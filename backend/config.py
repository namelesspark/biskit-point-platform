import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')
    YOUTUBEDATA_API_KEY = os.getenv('YOUTUBEDATA_API_KEY')
    
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = True
    CORS_ORIGINS = ['*']
    
    AI_MODEL = 'gpt-3.5-turbo'
    AI_TEMPERATURE = 0.7
    AI_MAX_TOKENS = 1000
    
    # Whisper 설정
    MAX_AUDIO_SIZE_MB = 25
    AUDIO_CHUNK_DURATION = 300  # 5분 단위로 분할
