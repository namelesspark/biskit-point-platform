// src/pages/UploadLearnPage.jsx
import React, { useState, useRef, useCallback } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ChatPanel from '../components/shared/ChatPanel';
import QuizModal from '../components/shared/QuizModal';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function UploadLearnPage() {
  const { userId } = useAuth();
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [duration, setDuration] = useState(0);
  
  // 퀴즈 관련
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [quizTimes, setQuizTimes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuizTimes, setAnsweredQuizTimes] = useState([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // 시청 관련
  const [isCompleted, setIsCompleted] = useState(false);
  const [alreadyWatched, setAlreadyWatched] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  // 즐겨찾기
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const videoRef = useRef(null);
  const lastCheckedTimeRef = useRef(0);

  // 파일 선택 핸들러
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드 가능합니다.');
      return;
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    await extractTranscript(file);
  };

  // Whisper 텍스트 추출
  const extractTranscript = async (file) => {
    setLoading(true);
    setProgress('비디오에서 음성을 추출하는 중...');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('user_id', userId);

      setProgress('Whisper AI로 텍스트 변환 중... (대용량 파일은 시간이 걸릴 수 있습니다)');

      const response = await fetch(API_ENDPOINTS.WHISPER_EXTRACT, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setTranscript(data.transcript);
        setProgress('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert(`추출 실패: ${error.message}`);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  // 비디오 메타데이터 로드
  const handleVideoLoaded = (e) => {
    const videoDuration = Math.floor(e.target.duration);
    setDuration(videoDuration);
    
    if (quizEnabled && transcript) {
      scheduleQuizzes(videoDuration);
    }
  };

  // 퀴즈 스케줄 생성
  const scheduleQuizzes = async (videoDuration) => {
    if (!quizEnabled || videoDuration <= 0) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.QUIZ_SCHEDULE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          num_quizzes: videoDuration < 600 ? 1 : 5,
          duration: videoDuration
        })
      });
      const data = await response.json();
      if (data.success) {
        setQuizTimes(data.quiz_times);
      }
    } catch (error) {
      console.error('퀴즈 스케줄 실패:', error);
    }
  };

  // 시간 업데이트
  const handleTimeUpdate = useCallback(async () => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    
    if (!quizEnabled || !transcript || quizTimes.length === 0 || isGeneratingQuiz || alreadyWatched) return;
    
    const roundedTime = Math.floor(time);
    if (roundedTime === lastCheckedTimeRef.current) return;
    lastCheckedTimeRef.current = roundedTime;
    
    for (const quizTime of quizTimes) {
      if (Math.abs(time - quizTime) < 2 && !answeredQuizTimes.includes(quizTime)) {
        videoRef.current.pause();
        setIsGeneratingQuiz(true);
        
        try {
          const response = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, current_time: time, num_quizzes: 1 })
          });

          const data = await response.json();
          if (data.success && data.quizzes?.length > 0) {
            setCurrentQuiz(data.quizzes[0]);
            setShowQuiz(true);
            setAnsweredQuizTimes(prev => [...prev, quizTime]);
          } else {
            videoRef.current.play();
          }
        } catch (error) {
          console.error('퀴즈 생성 실패:', error);
          videoRef.current.play();
        } finally {
          setIsGeneratingQuiz(false);
        }
        break;
      }
    }
  }, [quizEnabled, transcript, quizTimes, answeredQuizTimes, userId, isGeneratingQuiz, alreadyWatched]);

  // 퀴즈 답변
  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) setQuizScore(prev => prev + 10);
  };

  // 퀴즈 닫기
  const handleQuizClose = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setTimeout(() => { videoRef.current?.play(); }, 500);
  };

  // 즐겨찾기 토글
  const handleBookmark = async () => {
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }
    if (!videoFile) return;

    const videoId = `upload_${videoFile.name}_${videoFile.size}`;

    try {
      if (isBookmarked) {
        const response = await fetch(API_ENDPOINTS.BOOKMARK_REMOVE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, video_id: videoId })
        });
        const data = await response.json();
        if (data.success) { setIsBookmarked(false); alert('즐겨찾기에서 삭제되었습니다.'); }
      } else {
        const response = await fetch(API_ENDPOINTS.BOOKMARK_ADD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            video_id: videoId,
            video_title: videoFile.name,
            video_type: 'upload',
            thumbnail_url: ''
          })
        });
        const data = await response.json();
        if (data.success) { setIsBookmarked(true); alert('즐겨찾기에 추가되었습니다.'); }
        else alert(data.message);
      }
    } catch (error) { alert('즐겨찾기 처리 실패'); }
  };

  // 영상 종료
  const handleVideoEnd = async () => {
    if (userId === 'guest') {
      alert('🎉 영상 시청 완료!\n로그인하면 포인트를 획득할 수 있습니다.');
      return;
    }

    if (alreadyWatched) {
      alert('🎬 영상 시청 완료!\n이미 포인트를 획득한 영상입니다.');
      return;
    }

    const videoId = `upload_${videoFile.name}_${videoFile.size}`;

    try {
      const response = await fetch(API_ENDPOINTS.VIDEO_COMPLETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: videoId,
          video_title: videoFile.name,
          video_type: 'upload',
          duration: duration,
          quiz_score: quizScore
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsCompleted(true);
        setEarnedPoints(data.points_earned);
        setAlreadyWatched(true);
        
        if (!data.already_watched) {
          alert(
            `🎉 영상 시청 완료!\n\n` +
            `📺 시청 포인트: +${data.points_earned}점 (1분당 1점)\n` +
            `🧠 퀴즈 점수: +${quizScore}점\n` +
            `💎 총 보유 포인트: ${data.total_points}점`
          );
        }
      }
    } catch (error) {
      console.error('완료 처리 실패:', error);
    }
  };

  return (
    <div className="upload-learn-page">
      <Header variant="dashboard" />

      <main className="learn-content">
        <h1 className="page-title">📁 업로드 강의 학습</h1>

        {/* 파일 업로드 영역 - 비디오가 없을 때만 표시 */}
        {!videoUrl && !loading && (
          <div className="upload-section">
            <div 
              className="upload-dropzone"
              onClick={() => document.getElementById('video-file-input').click()}
            >
              <div className="dropzone-icon">📂</div>
              <p className="dropzone-text">비디오 파일을 선택하거나 드래그하세요</p>
              <p className="dropzone-hint">MP4, MOV, AVI 등 지원</p>
              <input 
                id="video-file-input" 
                type="file" 
                accept="video/*" 
                onChange={handleFileSelect} 
                hidden 
              />
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>{progress}</p>
          </div>
        )}

        {/* 비디오 로드됨 */}
        {videoUrl && !loading && (
          <>
            {alreadyWatched && (
              <div className="notice-box warning">
                ⚠️ 이미 시청 완료한 영상입니다. 포인트와 퀴즈 점수는 다시 획득할 수 없습니다.
              </div>
            )}

            {transcript && (
              <div className="quiz-toggle-section">
                <span className="toggle-label">🧠 퀴즈 모드</span>
                <div className="toggle-buttons">
                  <button 
                    className={`toggle-btn ${quizEnabled ? 'active' : ''}`} 
                    onClick={() => setQuizEnabled(true)} 
                    disabled={alreadyWatched}
                  >
                    ON
                  </button>
                  <button 
                    className={`toggle-btn ${!quizEnabled ? 'active' : ''}`} 
                    onClick={() => setQuizEnabled(false)}
                  >
                    OFF
                  </button>
                </div>
                {quizEnabled && duration > 0 && !alreadyWatched && (
                  <span className="quiz-info">
                    {duration < 600 ? '(10분 미만: 퀴즈 1개)' : '(퀴즈 5개 예정)'}
                  </span>
                )}
              </div>
            )}

            <div className="video-chat-container">
              <div className="video-wrapper">
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  controls 
                  className="video-player"
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnd}
                />
                <div className="video-actions">
                  <button 
                    className={`bookmark-btn ${isBookmarked ? 'active' : ''}`} 
                    onClick={handleBookmark}
                  >
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

            {transcript && (
              <div className="summary-section">
                <div className="summary-card">
                  <h3>📝 추출된 텍스트 (Whisper AI)</h3>
                  <div className="summary-content">{transcript}</div>
                </div>
              </div>
            )}

            {!transcript && !loading && (
              <div className="notice-box info">
                💡 텍스트 추출이 완료되면 퀴즈와 AI 채팅 기능을 사용할 수 있습니다.
              </div>
            )}
          </>
        )}
      </main>

      {showQuiz && currentQuiz && (
        <QuizModal quiz={currentQuiz} onAnswer={handleQuizAnswer} onClose={handleQuizClose} />
      )}

      <Footer />
    </div>
  );
}

export default UploadLearnPage;