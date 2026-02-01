# backend/youtube_service.py
from googleapiclient.discovery import build
import isodate
from youtube_transcript_api import YouTubeTranscriptApi
from config import Config
import re

YOUTUBEDATA_API_KEY = Config.YOUTUBEDATA_API_KEY
youtube = build('youtube', 'v3', developerKey=YOUTUBEDATA_API_KEY)


def extract_video_id(url):
    """YouTube URL에서 비디오 ID 추출"""
    patterns = [
        r'(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("유효한 YouTube URL이 아닙니다.")


def get_transcript_from_youtube(video_id):
    """YouTube 자막 가져오기 - 타임스탬프 포함"""
    try:
        print(f"📝 YouTube 자막 시도: {video_id}")
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)
        
        try:
            transcript = transcript_list.find_transcript(['ko', 'kr'])
            print("✅ 한국어 자막 사용")
        except:
            try:
                transcript = transcript_list.find_transcript(['en'])
                print("✅ 영어 자막 사용")
            except:
                transcript = transcript_list.find_transcript([transcript_list[0].language_code])
                print("✅ 자동생성 자막 사용")
        
        fetched = transcript.fetch()
        transcript_data = fetched.to_raw_data()
        
        # 전체 텍스트
        full_text = ' '.join([item['text'] for item in transcript_data])
        
        # 타임스탬프 데이터 (퀴즈용)
        timestamps = [{
            'start': item['start'],
            'end': item['start'] + item.get('duration', 0),
            'text': item['text']
        } for item in transcript_data]
        
        return {
            'text': full_text,
            'timestamps': timestamps,
            'source': 'youtube'
        }
        
    except Exception as e:
        print(f"❌ YouTube 자막 실패: {e}")
        return None


def get_transcript_until_time(timestamps, current_time):
    """timestamps 기반으로 현재 시간까지의 텍스트만 추출"""
    if not timestamps:
        return ""
    
    texts = []
    for seg in timestamps:
        if seg['end'] <= current_time:
            texts.append(seg['text'])
        elif seg['start'] < current_time:
            # 중간에 걸친 세그먼트도 포함
            texts.append(seg['text'])
            break
    
    return ' '.join(texts)


def get_video_info(video_id):
    """영상 정보 가져오기 (제목, 길이)"""
    try:
        response = youtube.videos().list(
            part="snippet,contentDetails",
            id=video_id
        ).execute()

        if not response["items"]:
            raise Exception("영상 정보를 찾을 수 없습니다.")

        item = response["items"][0]
        duration_iso = item["contentDetails"]["duration"]
        duration_seconds = int(isodate.parse_duration(duration_iso).total_seconds())
        title = item["snippet"]["title"]
        thumbnail = item["snippet"]["thumbnails"]["high"]["url"]

        return {
            "video_id": video_id,
            "title": title,
            "duration": duration_seconds,
            "thumbnail": thumbnail
        }

    except Exception as e:
        print(f"❌ 영상 정보 추출 실패: {e}")
        return {"video_id": video_id, "duration": 600, "title": "", "thumbnail": ""}


def get_transcript(video_url):
    """자막 추출 메인 함수"""
    video_id = extract_video_id(video_url)
    transcript = get_transcript_from_youtube(video_id)
    video_info = get_video_info(video_id)
    
    return {
        'video_id': video_id,
        'transcript': transcript,
        'duration': video_info.get("duration", 600),
        'title': video_info.get("title", ""),
        'thumbnail': video_info.get("thumbnail", "")
    }
