# 🎓 BISKIT POINT

> AI 기반 학습 플랫폼 - 금오공과대학교 DX·AX 역량 강화 프로젝트

YouTube 영상, 업로드 강의, 오프라인 수업을 AI가 분석하여 학습을 돕는 통합 교육 플랫폼입니다.

배포된 프로젝트 링크: https://frontend-nu-lemon-27.vercel.app

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [데이터 구조](#-데이터-구조)
- [사용자 플로우](#-사용자-플로우)
- [API 구조](#-api-구조)
- [실시간 음성 인식](#-실시간-음성-인식)
- [설치 및 실행](#-설치-및-실행)
- [환경 변수 설정](#-환경-변수-설정)
- [팀 정보](#-팀-정보)

---

## ✨ 주요 기능

### 🎯 4가지 학습 모드

| 모드 | 설명 |
|------|------|
| 📺 **YouTube 학습** | YouTube URL 입력 → 자막 추출 → AI 튜터 질문 |
| 📁 **파일 업로드** | 동영상 업로드 → Whisper 음성 변환 → AI 학습 |
| 🎙️ **오프라인 보조** | 실시간 음성 녹음 → 5초 간격 텍스트 변환 |
| 📚 **강의 목록** | 관리자 업로드 강의 시청 및 학습 |

### 🤖 AI 기능

- **AI 튜터 챗봇**: 강의 내용 기반 질의응답
- **자동 퀴즈 생성**: 학습 내용 기반 퀴즈 자동 생성
- **음성 인식**: OpenAI Whisper 기반 실시간 변환
- **요약 생성**: 강의 내용 AI 요약

### 👥 커뮤니티 기능

- **랭킹 시스템**: 포인트 기반 학습자 순위
- **쪽지 기능**: 사용자 간 1:1 메시지
- **커뮤니티 게시판**: 학습 정보 공유

---

## 🛠 기술 스택
<img width="3903" height="1974" alt="기술 스택" src="https://github.com/user-attachments/assets/487fa549-0c82-4a20-8e32-3a4c1275746c" />


---

## 🏗 시스템 아키텍처
<img width="6416" height="3639" alt="시스템 아키텍처" src="https://github.com/user-attachments/assets/465df727-773b-4b5d-a601-a14860f4c5ce" />



---

## 💾 데이터 구조
<img width="8191" height="3874" alt="데이터 구조" src="https://github.com/user-attachments/assets/0d62c0df-42bf-4c01-9103-6043d9a3dfb3" />


---

## 🔄 사용자 플로우
<img width="6732" height="1980" alt="사용자 학습 플로우" src="https://github.com/user-attachments/assets/4d573003-c006-4110-8150-dc055180b617" />


---

## 🔌 API 구조
<img width="8192" height="1339" alt="APi 엔트리 구조" src="https://github.com/user-attachments/assets/7d2cfa2e-adf2-4a31-927b-35c8fd9e01a1" />


---


### 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/youtube/load` | YouTube 영상 로드 및 자막 추출 |
| POST | `/api/chat` | AI 튜터 대화 |
| POST | `/api/quiz/generate` | 퀴즈 자동 생성 |
| POST | `/api/whisper/transcribe` | 실시간 음성 변환 |
| POST | `/api/whisper/extract` | 비디오 음성 추출 |
| GET | `/api/ranking/list` | 랭킹 목록 조회 |
| POST | `/api/messages/send` | 쪽지 보내기 |

---

## 🎙 실시간 음성 인식
<img width="4785" height="5060" alt="음성 인식 시퀀스 다이어그램" src="https://github.com/user-attachments/assets/22d5f029-84e5-4f4f-84ef-523791459b9c" />


---

## 🚀 설치 및 실행

### 요구 사항

- Node.js 18+
- Python 3.10+
- ffmpeg
- Firebase 프로젝트

### Frontend 설치

```bash
cd frontend
npm install
npm start
```

### Backend 설치

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### ffmpeg 설치

```bash
# Ubuntu
sudo apt install ffmpeg -y

# macOS
brew install ffmpeg

# Windows
# https://ffmpeg.org/download.html 에서 다운로드
```

---

## ⚙ 환경 변수 설정

### Backend (.env)

```env
OPENAI_API_KEY=your_openai_api_key
FLASK_DEBUG=True
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin SDK

`backend/firebase-adminsdk.json` 파일에 Firebase Admin SDK 키 저장

---

## 📁 프로젝트 구조

```
biskit-point/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Header, Footer
│   │   │   ├── modals/        # ProfileModal, MessageModal
│   │   │   ├── shared/        # ChatPanel, QuizModal
│   │   │   └── offline/       # AudioRecorder
│   │   ├── pages/             # 12개 페이지
│   │   ├── config/            # api.js, firebase.js
│   │   ├── hooks/             # useAuth.js
│   │   └── styles/            # App.css
│   └── package.json
├── backend/
│   ├── main.py                # Flask 서버
│   ├── youtube_service.py     # YouTube 자막 추출
│   ├── whisper_service.py     # 음성 인식
│   ├── chat_service.py        # AI 챗봇
│   ├── quiz_service.py        # 퀴즈 생성
│   ├── firebase_service.py    # Firebase 연동
│   ├── config.py              # 설정
│   └── requirements.txt
└── README.md
```

---

## 👥 팀 정보

**금오공과대학교 2025학년도 DX·AX 기반 역량 강화 프로젝트**


---

## 📄 라이선스

이 프로젝트는 금오공과대학교 교내 프로젝트로 개발되었습니다.

---

<p align="center">
  <b>🎓 BISKIT POINT - AI와 함께하는 스마트 학습</b><br>
  금오공과대학교 교수학습혁신센터
</p>
