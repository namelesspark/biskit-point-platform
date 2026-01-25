# backend/whisper_service.py
from openai import OpenAI
from config import Config
import os
import tempfile

client = OpenAI(api_key=Config.OPENAI_API_KEY)

def transcribe(audio_file):
    """
    오디오 파일을 텍스트로 변환
    audio_file: Flask의 FileStorage 객체 또는 파일 경로
    """
    try:
        print(f"📝 Whisper로 오디오 전사 시도")
        
        # FileStorage 객체를 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
        
        # Whisper API 호출
        with open(temp_path, "rb") as audio:
            response = client.audio.transcriptions.create(  # audio (소문자!)
                model="whisper-1",
                file=audio,
                response_format="text"  # 간단한 텍스트만
            )
        
        # 임시 파일 삭제
        os.unlink(temp_path)
        
        print(f"✅ Whisper 전사 완료: {response[:100]}...")
        
        return response  # response는 string
    
    except Exception as e:
        print(f"❌ Whisper 전사 실패: {e}")
        raise e


def extract_and_transcribe(video_file):
    """
    비디오 파일에서 오디오 추출 후 텍스트 변환
    video_file: Flask의 FileStorage 객체
    """
    try:
        print(f"🎬 비디오에서 오디오 추출 시도")
        
        # 비디오를 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
            video_file.save(temp_video.name)
            temp_video_path = temp_video.name
        
        # ffmpeg로 오디오 추출 (필요 시)
        # 간단하게 비디오 파일 그대로 Whisper에 전달
        with open(temp_video_path, "rb") as video:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=video,
                response_format="text"
            )
        
        # 임시 파일 삭제
        os.unlink(temp_video_path)
        
        print(f"✅ 비디오 전사 완료: {response[:100]}...")
        
        return response
    
    except Exception as e:
        print(f"❌ 비디오 처리 실패: {e}")
        raise e