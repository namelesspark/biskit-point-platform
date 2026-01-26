# backend/whisper_service.py
from openai import OpenAI
from config import Config
import os
import tempfile
import subprocess
import math

client = OpenAI(api_key=Config.OPENAI_API_KEY)

MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25MB


def get_audio_duration(file_path):
    """오디오 파일 길이 확인 (초)"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries', 
            'format=duration', '-of', 
            'default=noprint_wrappers=1:nokey=1', file_path
        ], capture_output=True, text=True)
        return float(result.stdout.strip())
    except:
        return 0


def compress_audio(input_path, output_path, target_size_mb=24):
    """오디오 압축 (ffmpeg 사용)"""
    try:
        duration = get_audio_duration(input_path)
        if duration <= 0:
            duration = 600  # 기본값 10분
        
        # 목표 비트레이트 계산 (kbps)
        target_bitrate = int((target_size_mb * 8 * 1024) / duration)
        target_bitrate = max(32, min(target_bitrate, 128))  # 32~128kbps
        
        subprocess.run([
            'ffmpeg', '-i', input_path,
            '-vn',  # 비디오 제거
            '-acodec', 'libmp3lame',
            '-b:a', f'{target_bitrate}k',
            '-ar', '16000',  # 16kHz 샘플레이트
            '-ac', '1',  # 모노
            '-y',
            output_path
        ], capture_output=True, check=True)
        
        return True
    except Exception as e:
        print(f"❌ 압축 실패: {e}")
        return False


def split_audio(input_path, chunk_duration=300):
    """오디오를 청크로 분할 (5분 단위)"""
    duration = get_audio_duration(input_path)
    num_chunks = math.ceil(duration / chunk_duration)
    
    chunks = []
    for i in range(num_chunks):
        start_time = i * chunk_duration
        chunk_path = f"{input_path}_chunk_{i}.mp3"
        
        subprocess.run([
            'ffmpeg', '-i', input_path,
            '-ss', str(start_time),
            '-t', str(chunk_duration),
            '-acodec', 'libmp3lame',
            '-b:a', '64k',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            chunk_path
        ], capture_output=True)
        
        if os.path.exists(chunk_path):
            chunks.append(chunk_path)
    
    return chunks


def transcribe(audio_file):
    """오디오 파일을 텍스트로 변환"""
    try:
        # 1. webm으로 임시 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
            audio_file.save(temp_audio.name)
            webm_path = temp_audio.name
        
        file_size = os.path.getsize(webm_path)
        print(f"📁 webm 파일 크기: {file_size} bytes")
        
        if file_size < 1000:
            os.unlink(webm_path)
            print("❌ 파일 너무 작음")
            return ""
        
        # 2. ffmpeg로 mp3 변환
        mp3_path = webm_path.replace('.webm', '.mp3')
        result = subprocess.run([
            'ffmpeg', '-i', webm_path,
            '-acodec', 'libmp3lame',
            '-b:a', '64k',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            mp3_path
        ], capture_output=True, text=True)
        
        print(f"📁 ffmpeg 결과: {result.returncode}")
        if result.stderr:
            print(f"📁 ffmpeg stderr: {result.stderr[-200:]}")  # 마지막 200자만
        
        if result.returncode != 0 or not os.path.exists(mp3_path):
            if os.path.exists(webm_path):
                os.unlink(webm_path)
            print("❌ ffmpeg 변환 실패")
            return ""
        
        mp3_size = os.path.getsize(mp3_path)
        print(f"📁 mp3 파일 크기: {mp3_size} bytes")
        
        # 3. Whisper API 호출
        with open(mp3_path, "rb") as audio:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="ko",
                response_format="text"
            )
        
        print(f"✅ Whisper 응답: '{response}'")
        
        # 4. 임시 파일 정리
        for f in [webm_path, mp3_path]:
            if os.path.exists(f):
                os.unlink(f)
        
        return response
    
    except Exception as e:
        print(f"❌ Whisper 전사 실패: {e}")
        return ""


def extract_and_transcribe(video_file):
    """비디오에서 오디오 추출 후 텍스트 변환 (대용량 지원)"""
    try:
        # 비디오를 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
            video_file.save(temp_video.name)
            temp_video_path = temp_video.name
        
        # 오디오 추출 + 압축
        audio_path = temp_video_path + '_audio.mp3'
        
        subprocess.run([
            'ffmpeg', '-i', temp_video_path,
            '-vn',
            '-acodec', 'libmp3lame',
            '-b:a', '64k',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            audio_path
        ], capture_output=True, check=True)
        
        # 파일 크기 확인
        file_size = os.path.getsize(audio_path)
        
        transcripts = []
        
        if file_size > MAX_SIZE_BYTES:
            # 청크로 분할
            chunks = split_audio(audio_path)
            for chunk_path in chunks:
                with open(chunk_path, "rb") as audio:
                    response = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio,
                        response_format="text"
                    )
                    transcripts.append(response)
                os.unlink(chunk_path)
        else:
            with open(audio_path, "rb") as audio:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    response_format="text"
                )
                transcripts.append(response)
        
        # 정리
        for f in [temp_video_path, audio_path]:
            if os.path.exists(f):
                os.unlink(f)
        
        return ' '.join(transcripts)
    
    except Exception as e:
        print(f"❌ 비디오 처리 실패: {e}")
        raise e


def transcribe_stream(audio_chunks):
    """실시간 스트리밍 전사 (청크 단위)"""
    try:
        transcripts = []
        
        for chunk in audio_chunks:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp:
                temp.write(chunk)
                temp_path = temp.name
            
            with open(temp_path, "rb") as audio:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    response_format="text"
                )
                transcripts.append(response)
            
            os.unlink(temp_path)
        
        return transcripts
    
    except Exception as e:
        print(f"❌ 스트리밍 전사 실패: {e}")
        raise e
