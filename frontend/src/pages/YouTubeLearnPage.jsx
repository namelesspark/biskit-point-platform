// src/pages/YouTubeLearnPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import YouTubePlayer from '../components/youtube/YouTubePlayer';
import ChatPanel from '../components/shared/ChatPanel';
import QuizModal from '../components/shared/QuizModal';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function YouTubeLearnPage() {
  const { videoId: urlVideoId } = useParams();
  const { userId } = useAuth();
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // 퀴즈 관련
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [quizCount, setQuizCount] = useState(5);
  const [quizTimes, setQuizTimes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuizTimes, setAnsweredQuizTimes] = useState([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // 실제 시청 시간 추적
  const [watchedSeconds, setWatchedSeconds] = useState(new Set());
  const [totalWatchedTime, setTotalWatchedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alreadyWatched, setAlreadyWatched] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const totalWatchedTimeRef = useRef(0);

  
  // 즐겨찾기
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const playerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const watchIntervalRef = useRef(null);
  
  // ★ 클로저 문제 해결을 위한 ref들
  const quizTimesRef = useRef([]);
  const quizEnabledRef = useRef(true);
  const isGeneratingQuizRef = useRef(false);
  const alreadyWatchedRef = useRef(false);
  const showQuizRef = useRef(false);
  const answeredQuizTimesRef = useRef([]);

  // ★ URL 파라미터로 영상 ID가 전달된 경우 자동 로드
  useEffect(() => {
    if (urlVideoId && !videoId) {
      console.log('🎬 URL에서 videoId 감지:', urlVideoId);
      const fullUrl = `https://www.youtube.com/watch?v=${urlVideoId}`;
      setYoutubeUrl(fullUrl);
      // 약간의 딜레이 후 로드 (상태 업데이트 대기)
      setTimeout(() => {
        loadVideoById(urlVideoId);
      }, 100);
    }
  }, [urlVideoId]);

  // ★ state 변경 시 ref 동기화
  useEffect(() => {
    quizTimesRef.current = quizTimes;
    console.log('🔄 quizTimes 업데이트:', quizTimes);
  }, [quizTimes]);

  useEffect(() => {
    quizEnabledRef.current = quizEnabled;
  }, [quizEnabled]);

  useEffect(() => {
    isGeneratingQuizRef.current = isGeneratingQuiz;
  }, [isGeneratingQuiz]);

  useEffect(() => {
    alreadyWatchedRef.current = alreadyWatched;
  }, [alreadyWatched]);

  useEffect(() => {
    showQuizRef.current = showQuiz;
  }, [showQuiz]);

  useEffect(() => {
    answeredQuizTimesRef.current = answeredQuizTimes;
  }, [answeredQuizTimes]);

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return match ? match[1] : null;
  };

  // ★ videoId로 직접 로드하는 함수 추가
  const loadVideoById = async (vId) => {
    console.log('🎬 loadVideoById 호출됨, videoId:', vId);
    
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.YOUTUBE_LOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_url: `https://www.youtube.com/watch?v=${vId}`, 
          user_id: userId 
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setVideoData(data);
      setVideoId(vId);
      setAlreadyWatched(data.already_watched || false);
      
      const numQuizzes = data.duration < 600 ? 1 : 5;
      setQuizCount(numQuizzes);
      
      if (data.duration > 0) {
        const times = [];
        for (let i = 1; i <= numQuizzes; i++) {
          times.push(Math.floor(data.duration * (i / (numQuizzes + 1))));
        }
        setQuizTimes(times);
        console.log('📅 퀴즈 예정 시간:', times.map(t => `${Math.floor(t/60)}분 ${t%60}초`));
      }
      
      checkBookmarkStatus(vId);
      loadSummary();
      
    } catch (error) {
      alert(`영상 로드 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async () => {
    console.log('🎬 loadVideo 호출됨, URL:', youtubeUrl);

    const id = extractVideoId(youtubeUrl);
    console.log('🎬 추출된 videoId:', id);
    if (!id) {
      alert('올바른 YouTube URL을 입력해주세요.');
      return;
    }

    await loadVideoById(id);
  };

  const checkBookmarkStatus = async (vId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BOOKMARK_LIST}?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        const found = data.bookmarks.find(b => b.videoId === vId);
        setIsBookmarked(!!found);
      }
    } catch (error) {
      console.error('즐겨찾기 확인 실패:', error);
    }
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.YOUTUBE_SUMMARIZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      if (data.success) setSummary(data.summary);
    } catch (error) {
      console.error('요약 실패:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const startWatchTracking = useCallback(() => {
    if (watchIntervalRef.current) return;
    
    watchIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      
      const player = playerRef.current;
      const state = player.getPlayerState?.();
      
      if (state === 1) {
        const time = Math.floor(player.getCurrentTime?.() || 0);
        
        setWatchedSeconds(prev => {
          const newSet = new Set(prev);
          if (Math.abs(time - lastTimeRef.current) <= 2) {
            newSet.add(time);
          }
          lastTimeRef.current = time;
          return newSet;
        });
      }
    }, 1000);
  }, []);

  const stopWatchTracking = useCallback(() => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
  totalWatchedTimeRef.current = totalWatchedTime;
  }, [totalWatchedTime]);

  useEffect(() => {
    setTotalWatchedTime(watchedSeconds.size);
  }, [watchedSeconds]);

  useEffect(() => {
    return () => stopWatchTracking();
  }, [stopWatchTracking]);

  const handlePlayerStateChange = useCallback((state) => {
    if (state === 1) {
      startWatchTracking();
    } else {
      stopWatchTracking();
    }
  }, [startWatchTracking, stopWatchTracking]);

  // ★ 퀴즈 생성 함수 (ref 사용)
  const generateQuiz = useCallback(async (quizTime, currentVideoTime) => {
    console.log(`🎯 퀴즈 출제! 시간: ${Math.floor(quizTime/60)}분 ${quizTime%60}초`);
    
    playerRef.current?.pauseVideo?.();
    setIsGeneratingQuiz(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, current_time: currentVideoTime, num_quizzes: 1 })
      });

      const data = await response.json();
      if (data.success && data.quizzes?.length > 0) {
        setCurrentQuiz(data.quizzes[0]);
        setShowQuiz(true);
        setAnsweredQuizTimes(prev => [...prev, quizTime]);
      } else {
        console.log('❌ 퀴즈 생성 실패, 영상 재생 계속');
        playerRef.current?.playVideo?.();
      }
    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
      playerRef.current?.playVideo?.();
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [userId]);

  // ★ 시간 업데이트 핸들러 (ref에서 최신값 읽기)
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    
    // ref에서 최신값 읽기
    const currentQuizEnabled = quizEnabledRef.current;
    const currentQuizTimes = quizTimesRef.current;
    const currentIsGenerating = isGeneratingQuizRef.current;
    const currentAlreadyWatched = alreadyWatchedRef.current;
    const currentShowQuiz = showQuizRef.current;
    const currentAnsweredQuizTimes = answeredQuizTimesRef.current;
    
    if (time % 30 === 0) {
      console.log('⏱️ 시간 체크:', {
        time,
        quizTimes: currentQuizTimes,
        answered: currentAnsweredQuizTimes,
        enabled: currentQuizEnabled,
        generating: currentIsGenerating,
        showQuiz: currentShowQuiz
      });
    }
    
    if (!currentQuizEnabled || currentQuizTimes.length === 0 || currentIsGenerating || currentAlreadyWatched || currentShowQuiz) {
      return;
    }
    
    // 퀴즈 출제 시간인지 확인
    for (const quizTime of currentQuizTimes) {
      if (time >= quizTime && !currentAnsweredQuizTimes.includes(quizTime)) {
        generateQuiz(quizTime, time);
        break;
      }
    }
  }, [generateQuiz]);

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) setQuizScore(prev => prev + 10);
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setTimeout(() => { playerRef.current?.playVideo?.(); }, 500);
  };

  const handleBookmark = async () => {
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }

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
            video_title: videoData?.title || `YouTube ${videoId}`,
            video_type: 'youtube',
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          })
        });
        const data = await response.json();
        if (data.success) { setIsBookmarked(true); alert('즐겨찾기에 추가되었습니다.'); }
        else alert(data.message);
      }
    } catch (error) { alert('즐겨찾기 처리 실패'); }
  };

  const handleVideoEnd = async () => {
    stopWatchTracking();
    
    // ★ ref에서 최신값 가져오기
    const currentWatchedTime = totalWatchedTimeRef.current;
    
    if (userId === 'guest') {
      alert('🎉 영상 시청 완료!\n로그인하면 포인트를 획득할 수 있습니다.');
      return;
    }

    if (alreadyWatched) {
      alert('🎬 영상 시청 완료!\n이미 포인트를 획득한 영상입니다.');
      return;
    }

    const duration = videoData?.duration || 0;
    const watchedRatio = duration > 0 ? currentWatchedTime / duration : 0;  // ★ ref 값 사용
    
    console.log('📊 시청 완료:', { currentWatchedTime, duration, watchedRatio });  // 디버그
    
    if (watchedRatio < 0.9) {
      alert(
        `⚠️ 영상을 충분히 시청하지 않았습니다.\n\n` +
        `📺 총 영상 길이: ${Math.floor(duration / 60)}분 ${duration % 60}초\n` +
        `⏱️ 실제 시청 시간: ${Math.floor(currentWatchedTime / 60)}분 ${currentWatchedTime % 60}초\n` +  // ★
        `📊 시청률: ${Math.floor(watchedRatio * 100)}%\n\n` +
        `90% 이상 시청해야 포인트를 획득할 수 있습니다.`
      );
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.VIDEO_COMPLETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: videoId,
          video_title: videoData?.title || `YouTube ${videoId}`,
          video_type: 'youtube',
          duration: duration,
          watched_time: currentWatchedTime,  // ★
          quiz_score: quizScore
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsCompleted(true);
        setEarnedPoints(data.points_earned);
        setAlreadyWatched(true);
        
        alert(
          `🎉 영상 시청 완료!\n\n` +
          `⏱️ 실제 시청 시간: ${Math.floor(currentWatchedTime / 60)}분 ${currentWatchedTime % 60}초\n` +  // ★
          `📺 시청 포인트: +${data.points_earned}점 (1분당 1점)\n` +
          `🧠 퀴즈 점수: +${quizScore}점\n` +
          `💎 총 보유 포인트: ${data.total_points}점`
        );
      }
    } catch (error) {
      console.error('완료 처리 실패:', error);
    }
  };

  const watchProgress = videoData?.duration > 0 
    ? Math.floor((totalWatchedTime / videoData.duration) * 100) 
    : 0;

  return (
    <div className="youtube-learn-page">
      <Header variant="dashboard" />

      <main className="learn-content">
        <h1 className="page-title">📺 YouTube 학습</h1>

        <div className="youtube-input-section">
          <div className="input-row">
            <input
              type="text"
              placeholder="YouTube URL을 입력하세요..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadVideo()}
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={loadVideo} disabled={loading || !youtubeUrl.trim()}>
              {loading ? '로딩 중...' : '영상 로드'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>자막을 추출하는 중입니다...</p>
          </div>
        )}

        {videoId && !loading && (
          <>
            {alreadyWatched && (
              <div className="notice-box warning">
                ⚠️ 이미 시청 완료한 영상입니다. 포인트와 퀴즈 점수는 다시 획득할 수 없습니다.
              </div>
            )}

            <div className="quiz-toggle-section">
              <span className="toggle-label">🧠 퀴즈 모드</span>
              <div className="toggle-buttons">
                <button className={`toggle-btn ${quizEnabled ? 'active' : ''}`} onClick={() => setQuizEnabled(true)} disabled={alreadyWatched}>ON</button>
                <button className={`toggle-btn ${!quizEnabled ? 'active' : ''}`} onClick={() => setQuizEnabled(false)}>OFF</button>
              </div>
              {quizEnabled && videoData && !alreadyWatched && (
                <span className="quiz-info">
                  {videoData.duration < 600 ? '(10분 미만: 퀴즈 1개)' : `(퀴즈 ${quizCount}개 예정)`}
                </span>
              )}
            </div>

            <div className="watch-progress-section">
              <div className="progress-info">
                <span>⏱️ 실제 시청: {Math.floor(totalWatchedTime / 60)}분 {totalWatchedTime % 60}초</span>
                <span>📊 시청률: {watchProgress}%</span>
                {watchProgress < 90 && <span className="progress-hint">(90% 이상 시청 시 포인트 획득)</span>}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(watchProgress, 100)}%` }}></div>
                <div className="progress-threshold" style={{ left: '90%' }}></div>
              </div>
            </div>

            <div className="video-chat-container">
              <div className="video-wrapper">
                <YouTubePlayer
                  videoId={videoId}
                  onReady={(player) => { playerRef.current = player; }}
                  onStateChange={handlePlayerStateChange}
                  onEnd={handleVideoEnd}
                  onTimeUpdate={handleTimeUpdate}
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

            <div className="summary-section">
              <div className="summary-card">
                <h3>📝 AI 요약</h3>
                <div className="summary-content">
                  {summaryLoading ? '요약 생성 중...' : summary || '요약을 불러오는 중...'}
                </div>
              </div>
            </div>
          </>
        )}

        {!videoId && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📺</div>
            <p>YouTube URL을 입력하고 "영상 로드"를 클릭하세요.</p>
          </div>
        )}
      </main>

      {showQuiz && currentQuiz && (
        <QuizModal quiz={currentQuiz} onAnswer={handleQuizAnswer} onClose={handleQuizClose} />
      )}

      <Footer />
    </div>
  );
}

export default YouTubeLearnPage;
