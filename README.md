# BISKIT POINT Backend

AI 기반 YouTube 학습 플랫폼 백엔드

## 📁 파일 구조

```
backend/
├─ main.py              # Flask 메인 서버
├─ youtube_service.py   # YouTube 자막 추출
├─ chat_service.py      # OpenAI 챗봇
├─ quiz_service.py      # 퀴즈 생성
├─ config.py            # 설정 관리
├─ .env                 # API 키 (보안 주의!)
└─ requirements.txt     # 패키지 목록
```

## 🚀 설치 및 실행

### 1. 가상환경 생성

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일에 API 키 입력:

```env
OPENAI_API_KEY=your_openai_api_key
YOUTUBEDATA_API_KEY=your_youtube_api_key
FIREBASE_API_KEY=your_firebase_api_key
FLASK_ENV=development
```

### 4. 서버 실행

```bash
python main.py
```

서버 주소: `http://localhost:5000`

## 📡 API 엔드포인트

### 1. 영상 로드

```http
POST /api/video/load
Content-Type: application/json

{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "user_id": "user123"
}
```

**응답:**
```json
{
  "success": true,
  "video_id": "VIDEO_ID",
  "duration": 600,
  "transcript_preview": "강의 내용 미리보기...",
  "source": "youtube"
}
```

### 2. 퀴즈 생성

```http
POST /api/quiz/generate
Content-Type: application/json

{
  "user_id": "user123",
  "video_id": "VIDEO_ID",
  "num_quizzes": 5
}
```

**응답:**
```json
{
  "success": true,
  "quizzes": [
    {
      "question": "질문 내용",
      "options": ["1", "2", "3", "4", "5"],
      "correct_answer": 2,
      "explanation": "해설"
    }
  ]
}
```

### 3. 퀴즈 제출

```http
POST /api/quiz/submit
Content-Type: application/json

{
  "user_id": "user123",
  "answer": 2,
  "correct_answer": 2
}
```

**응답:**
```json
{
  "success": true,
  "is_correct": true,
  "score": 1,
  "total_score": 5
}
```

### 4. AI 챗봇

```http
POST /api/chat
Content-Type: application/json

{
  "user_id": "user123",
  "message": "이 부분이 이해가 안 돼요"
}
```

**응답:**
```json
{
  "success": true,
  "response": "AI 응답 내용..."
}
```

## 🛠️ 주요 기능

1. **YouTube 자막 추출** - YouTube Transcript API
2. **AI 퀴즈 생성** - OpenAI GPT-3.5
3. **AI 챗봇** - OpenAI Chat Completion
4. **세션 관리** - 메모리 기반 (간단 구현)

## ⚠️ 주의사항

1. `.env` 파일은 Git에 올리지 마세요!
2. OpenAI API 사용량 체크 (유료)
3. YouTube Data API 할당량 확인
4. 프로덕션에서는 세션을 Redis 등으로 교체 필요

## 🔧 트러블슈팅

### CORS 에러
- `config.py`에서 `CORS_ORIGINS` 확인
- 프론트엔드 URL 추가

### API 키 에러
- `.env` 파일 확인
- API 키 유효성 체크

### 자막 추출 실패
- YouTube 영상에 자막이 있는지 확인
- 비공개 영상은 불가능