# BISKIT POINT - AI 기반 학습 플랫폼

금오공과대학교 DX·AX 기반 역량 강화 프로젝트

## 🚀 주요 기능

### 1. YouTube 학습
- YouTube URL 입력으로 강의 시청
- AI 자동 자막 추출 및 요약
- 시청 시간에 따른 퀴즈 생성 (10분 미만: 1개 고정)
- AI 학습 도우미 챗봇

### 2. 업로드 강의
- 비디오 파일 업로드
- Whisper AI로 음성-텍스트 변환 (대용량 지원)
- 퀴즈 및 챗봇 기능

### 3. 오프라인 강의 보조
- 실시간 음성 녹음
- 30초 단위 실시간 텍스트 변환
- 전체 녹취록 저장

### 4. 랭킹 시스템
- 학습 포인트 적립
- 랭킹 표시 On/Off 설정

## 📁 프로젝트 구조

```
biskit-point-platform-main/
├── backend/
│   ├── main.py              # Flask 메인 서버
│   ├── config.py            # 환경 설정
│   ├── youtube_service.py   # YouTube 자막 추출
│   ├── quiz_service.py      # 퀴즈 생성 (시간 기반)
│   ├── chat_service.py      # AI 챗봇 + 요약
│   ├── whisper_service.py   # 음성-텍스트 (대용량 지원)
│   └── firebase_service.py  # 데이터베이스
│
└── frontend/
    └── src/
        ├── components/
        │   ├── common/      # Header, Footer
        │   ├── shared/      # ChatPanel, QuizModal, QuizSettings
        │   ├── youtube/     # YouTubePlayer
        │   ├── offline/     # AudioRecorder
        │   └── modals/      # ProfileModal, SettingsModal
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── DashboardPage.jsx
        │   ├── YouTubeLearnPage.jsx
        │   ├── UploadLearnPage.jsx
        │   ├── OfflineAssistPage.jsx
        │   └── RankingPage.jsx
        ├── hooks/           # useAuth
        ├── config/          # firebase, api
        └── styles/          # App.css
```

## 🛠️ 설치 및 실행

### 1. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일 생성

**Backend (.env)**
```
OPENAI_API_KEY=your_key
YOUTUBEDATA_API_KEY=your_key
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_key
...
```

### 2. Backend 실행

```bash
cd backend
pip install -r ../requirements.txt
python main.py
```

서버: http://localhost:5000

### 3. Frontend 실행

```bash
cd frontend
npm install
npm start
```

앱: http://localhost:3000

## 🔧 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| POST /api/youtube/load | YouTube 영상 로드 |
| POST /api/youtube/summarize | AI 요약 |
| POST /api/quiz/generate | 퀴즈 생성 (current_time 기반) |
| POST /api/chat | AI 챗봇 |
| POST /api/whisper/transcribe | 음성 전사 |
| POST /api/whisper/extract | 비디오 추출+전사 |
| GET /api/ranking/list | 랭킹 목록 |
| POST /api/ranking/visibility | 랭킹 표시 설정 |

## ✅ 해결된 문제

1. **10분 미만 퀴즈**: duration < 600초면 퀴즈 1개 고정
2. **시간 기반 퀴즈**: current_time까지의 자막으로만 퀴즈 생성
3. **AI 요약**: 자막 전체를 AI로 요약 (기존: 일부만 표시)
4. **대용량 비디오**: ffmpeg 압축 + 청크 분할로 25MB 제한 해결
5. **실시간 전사**: 30초마다 청크 전송으로 실시간 텍스트 출력
6. **랭킹 비공개**: showInRanking 설정으로 랭킹 표시 On/Off
7. **프로필 모달**: 즐겨찾기 + 시청 기록 통합 표시

## 📌 Firebase 구조

```
users/
  {userId}/
    displayName
    email
    totalPoints
    showInRanking
    settings/
    bookmarks/
      {videoId}/
    watchedVideos/
      {videoId}/

uploadedLectures/
  {lectureId}/
```

## 👥 팀원

- 개발: [팀원 이름]

---

© 2025 BISKIT POINT - 금오공과대학교
