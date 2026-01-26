// src/pages/LectureDetailPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ChatPanel from '../components/shared/ChatPanel';
import QuizModal from '../components/shared/QuizModal';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function LectureDetailPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 퀴즈 관련
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [quizTimes, setQuizTimes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuizTimes, setAnsweredQuizTimes] = useState([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // 시청 관련
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alreadyWatched, setAlreadyWatched] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const videoRef = useRef(null);
  const lastCheckedTimeRef = useRef(0);

  useEffect(() => {
    if (lectureId) loadLecture();
  }, [lectureId]);

  const loadLecture = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.LECTURES_GET}?lecture_id=${lectureId}&user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setLecture(data.lecture);
        setAlreadyWatched(data.alreadyWatched || false);
        setIsBookmarked(data.isBookmarked || false);
        
        // 세션에 transcript 설정
        if (data.lecture.transcript) {
          await fetch(`${API_ENDPOINTS.YOUTUBE_LOAD.replace('/youtube/load', '/lectures/session')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, transcript: data.lecture.transcript, lecture_id: lectureId })
          });
        }
      } else {
        setError(data.error || '강의를 불러올 수 없습니다.');
      }
    } catch (e) {
      setError('강의 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoLoaded = (e) => {
    const duration = Math.floor(e.target.duration);
    if (quizEnabled && lecture?.transcript) scheduleQuizzes(duration);
  };

  const scheduleQuizzes = async (duration) => {
    if (!quizEnabled || duration <= 0) return;
    try {
      const res = await fetch(API_ENDPOINTS.QUIZ_SCHEDULE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, num_quizzes: duration < 600 ? 1 : 5, duration })
      });
      const data = await res.json();
      if (data.success) setQuizTimes(data.quiz_times);
    } catch (e) {}
  };

  const handleTimeUpdate = useCallback(async () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    
    if (!quizEnabled || !lecture?.transcript || quizTimes.length === 0 || isGeneratingQuiz || alreadyWatched) return;
    
    const roundedTime = Math.floor(time);
    if (roundedTime === lastCheckedTimeRef.current) return;
    lastCheckedTimeRef.current = roundedTime;
    
    for (const quizTime of quizTimes) {
      if (Math.abs(time - quizTime) < 2 && !answeredQuizTimes.includes(quizTime)) {
        videoRef.current.pause();
        setIsGeneratingQuiz(true);
        try {
          const res = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, current_time: time, num_quizzes: 1 })
          });
          const data = await res.json();
          if (data.success && data.quizzes?.length > 0) {
            setCurrentQuiz(data.quizzes[0]);
            setShowQuiz(true);
            setAnsweredQuizTimes(prev => [...prev, quizTime]);
          } else {
            videoRef.current.play();
          }
        } catch (e) {
          videoRef.current.play();
        } finally {
          setIsGeneratingQuiz(false);
        }
        break;
      }
    }
  }, [quizEnabled, lecture, quizTimes, answeredQuizTimes, userId, isGeneratingQuiz, alreadyWatched]);

  const handleQuizAnswer = (isCorrect) => { if (isCorrect) setQuizScore(prev => prev + 10); };
  const handleQuizClose = () => { setShowQuiz(false); setCurrentQuiz(null); setTimeout(() => videoRef.current?.play(), 500); };

  const handleBookmark = async () => {
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }
    try {
      const endpoint = isBookmarked ? API_ENDPOINTS.BOOKMARK_REMOVE : API_ENDPOINTS.BOOKMARK_ADD;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: `lecture_${lectureId}`,
          video_title: lecture.title,
          video_type: 'lecture',
          thumbnail_url: lecture.thumbnailUrl || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsBookmarked(!isBookmarked);
        alert(isBookmarked ? '즐겨찾기에서 삭제되었습니다.' : '즐겨찾기에 추가되었습니다.');
      }
    } catch (e) { alert('즐겨찾기 처리 실패'); }
  };

  const handleVideoEnd = async () => {
    if (userId === 'guest') { alert('🎉 영상 시청 완료!\n로그인하면 포인트를 획득할 수 있습니다.'); return; }
    if (alreadyWatched) { alert('🎬 영상 시청 완료!\n이미 포인트를 획득한 영상입니다.'); return; }
    
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_COMPLETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: `lecture_${lectureId}`,
          video_title: lecture.title,
          video_type: 'lecture',
          duration: lecture.duration || 0,
          quiz_score: quizScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCompleted(true);
        setEarnedPoints(data.points_earned);
        setAlreadyWatched(true);
        if (!data.already_watched) {
          alert(`🎉 영상 시청 완료!\n\n📺 시청 포인트: +${data.points_earned}점\n🧠 퀴즈 점수: +${quizScore}점\n💎 총 보유 포인트: ${data.total_points}점`);
        }
      }
    } catch (e) {}
  };

  if (loading) return (
    <div className="lecture-detail-page">
      <Header variant="dashboard" />
      <main className="learn-content"><div className="loading-state"><div className="spinner"></div><p>강의를 불러오는 중...</p></div></main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="lecture-detail-page">
      <Header variant="dashboard" />
      <main className="learn-content">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/lectures')}>강의 목록으로</button>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="lecture-detail-page">
      <Header variant="dashboard" />

      <main className="learn-content">
        <div className="lecture-header-section">
          <button className="back-link" onClick={() => navigate('/lectures')}>← 강의 목록</button>
          <h1 className="page-title">{lecture?.title}</h1>
        </div>

        {alreadyWatched && (
          <div className="notice-box warning">⚠️ 이미 시청 완료한 강의입니다. 포인트와 퀴즈 점수는 다시 획득할 수 없습니다.</div>
        )}

        {lecture?.transcript && (
          <div className="quiz-toggle-section">
            <span className="toggle-label">🧠 퀴즈 모드</span>
            <div className="toggle-buttons">
              <button className={`toggle-btn ${quizEnabled ? 'active' : ''}`} onClick={() => setQuizEnabled(true)} disabled={alreadyWatched}>ON</button>
              <button className={`toggle-btn ${!quizEnabled ? 'active' : ''}`} onClick={() => setQuizEnabled(false)}>OFF</button>
            </div>
          </div>
        )}

        <div className="video-chat-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src={lecture?.videoUrl}
              controls
              className="video-player"
              onLoadedMetadata={handleVideoLoaded}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnd}
            />
            <div className="video-actions">
              <button className={`bookmark-btn ${isBookmarked ? 'active' : ''}`} onClick={handleBookmark}>
                {isBookmarked ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
              </button>
              <div className="score-display">
                <span>🧠 퀴즈: {quizScore}점</span>
                {isCompleted && <span className="earned">📺 +{earnedPoints}점</span>}
              </div>
            </div>
          </div>
          <ChatPanel />
        </div>

        {lecture?.description && (
          <div className="summary-section">
            <div className="summary-card">
              <h3>📝 강의 설명</h3>
              <div className="summary-content">{lecture.description}</div>
            </div>
          </div>
        )}

        {lecture?.transcript && (
          <div className="summary-section">
            <div className="summary-card">
              <h3>📜 자막 / 스크립트</h3>
              <div className="summary-content transcript-preview">{lecture.transcript.slice(0, 1000)}{lecture.transcript.length > 1000 ? '...' : ''}</div>
            </div>
          </div>
        )}
      </main>

      {showQuiz && currentQuiz && <QuizModal quiz={currentQuiz} onAnswer={handleQuizAnswer} onClose={handleQuizClose} />}
      <Footer />
    </div>
  );
}

export default LectureDetailPage;
