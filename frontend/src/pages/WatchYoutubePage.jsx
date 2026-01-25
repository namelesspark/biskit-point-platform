// src/pages/WatchYoutubePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../config/firebase';
import DashboardHeader from '../components/common/Header/DashboardHeader';
import YoutubePlayer from '../components/watchyoutube/YoutubePlayer';
import ChatPanel from '../components/learn/ChatPanel';
import QuizSettings from '../components/learn/QuizSettings';
import QuizModal from '../components/learn/QuizModal';
import GoogleSearch from '../components/learn/GoogleSearch';
import Footer from '../components/common/Footer/Footer';

function WatchYoutubePage() {
  const { videoId: urlVideoId } = useParams();
  
  const [videoUrl, setVideoUrl] = useState('');
  const [loadedVideoId, setLoadedVideoId] = useState(urlVideoId || null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 퀴즈 관련
  const [quizSchedule, setQuizSchedule] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const playerRef = useRef(null);
  const quizCheckIntervalRef = useRef(null);

  // YouTube URL에서 비디오 ID 추출
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // 영상 로드
  const loadVideo = async (url, vId) => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      const response = await fetch('http://localhost:5000/api/video/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_url: url,
          user_id: userId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '영상 로드 실패');
      }

      setVideoData(data);
      setLoadedVideoId(vId);
      alert('영상이 로드되었습니다!');

    } catch (error) {
      console.error('영상 로드 실패:', error);
      alert(`영상 로드 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // URL로 영상 로드 (ID 입력 제거)
  const handleLoadVideo = async () => {
    const extractedId = extractVideoId(videoUrl);
    
    if (!extractedId) {
      alert('올바른 YouTube URL을 입력해주세요.\n예시: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      return;
    }
    
    await loadVideo(videoUrl, extractedId);
  };

  // Enter 키로 로드
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoadVideo();
    }
  };

  // 퀴즈 생성
  const handleQuizzesGenerated = async (quizSettings) => {
    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      const response = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: loadedVideoId,
          num_quizzes: quizSettings.quizCount || 5
        })
      });

      const data = await response.json();

      if (data.success) {
        setQuizSchedule(data.quiz_schedule || []);
        alert(`퀴즈 ${data.quiz_schedule.length}개가 생성되었습니다!`);
        
        // 퀴즈 체크 시작
        startQuizCheck();
      }

    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
      alert('퀴즈 생성에 실패했습니다.');
    }
  };

  // 퀴즈 체크 (1초마다)
  const startQuizCheck = () => {
    if (quizCheckIntervalRef.current) {
      clearInterval(quizCheckIntervalRef.current);
    }

    quizCheckIntervalRef.current = setInterval(() => {
      checkQuizTime();
    }, 1000);
  };

  const checkQuizTime = () => {
    if (!playerRef.current || quizSchedule.length === 0) return;

    const currentTime = playerRef.current.getCurrentTime();

    // 출제할 퀴즈 찾기
    const upcomingQuiz = quizSchedule.find(
      (item) => Math.abs(item.time - currentTime) < 1 && !item.shown
    );

    if (upcomingQuiz) {
      // 영상 일시정지
      playerRef.current.pauseVideo();
      
      // 퀴즈 표시
      setCurrentQuiz(upcomingQuiz.quiz);
      setShowQuizModal(true);
      
      // 출제 완료 표시
      upcomingQuiz.shown = true;
    }
  };

  // 퀴즈 답변 처리
  const handleQuizAnswer = (isCorrect, selectedAnswer) => {
    if (isCorrect) {
      setQuizScore(prev => prev + 10);
    }
  };

  // 퀴즈 모달 닫기
  const handleCloseQuiz = () => {
    setShowQuizModal(false);
    setCurrentQuiz(null);
    
    // 영상 재생
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  // 영상 시청 완료
  const handleVideoEnd = async () => {
    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      if (userId === 'guest') {
        alert('로그인 후 점수를 획득할 수 있습니다.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/video/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: loadedVideoId,
          video_title: videoData?.title || `YouTube ${loadedVideoId}`,
          video_type: 'youtube',
          duration: videoData?.duration || 0,
          quiz_score: quizScore
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.already_watched) {
          alert(`${data.message}\n이미 획득한 영상입니다.`);
        } else {
          alert(
            `🎉 ${data.message}\n\n` +
            `획득 점수: ${data.points_earned}점\n` +
            `퀴즈 점수: ${quizScore}점\n` +
            `총 점수: ${data.total_points}점`
          );
        }
      }

    } catch (error) {
      console.error('영상 완료 처리 실패:', error);
    }
  };

  // 즐겨찾기 추가
  const handleBookmark = async () => {
    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      if (userId === 'guest') {
        alert('로그인 후 즐겨찾기를 사용할 수 있습니다.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/bookmark/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: loadedVideoId,
          video_title: `YouTube ${loadedVideoId}`,
          video_type: 'youtube',
          thumbnail_url: `https://img.youtube.com/vi/${loadedVideoId}/maxresdefault.jpg`
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsBookmarked(true);
        alert(data.message);
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error('즐겨찾기 실패:', error);
      alert('즐겨찾기에 실패했습니다.');
    }
  };

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (quizCheckIntervalRef.current) {
        clearInterval(quizCheckIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="watch-youtube-page">
      <DashboardHeader />

      <h1 className="page-title">YouTube로 강의 듣기</h1>

      {/* YouTube URL 입력 섹션 */}
      <div className="youtube-input-section">
        <div className="input-container">
          <div className="input-group">
            <span className="input-icon">🔗</span>
            <input
              type="text"
              placeholder="YouTube URL을 입력하세요... (예: https://www.youtube.com/watch?v=aircAruvnKk)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="youtube-input"
            />
          </div>
          <button 
            className="load-button"
            onClick={handleLoadVideo}
            disabled={loading || !videoUrl.trim()}
          >
            {loading ? '로딩 중...' : '영상 보기'}
          </button>
        </div>
      </div>

      {/* 로딩 메시지 */}
      {loading && (
        <div className="loading-message">
          <p>자막을 추출하는 중입니다... 잠시만 기다려주세요.</p>
        </div>
      )}

      {/* 영상 로드 후 표시 */}
      {loadedVideoId && (
        <>
          {/* 즐겨찾기 버튼 */}
          <div className="bookmark-section">
            <button 
              className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
              disabled={isBookmarked}
            >
              {isBookmarked ? '⭐ 즐겨찾기 완료' : '☆ 즐겨찾기'}
            </button>
          </div>

          <div className="video-container">
            <div className="video-section">
              <YoutubePlayer 
                videoId={loadedVideoId}
                onReady={(player) => { playerRef.current = player; }}
                onEnd={handleVideoEnd}
              />
            </div>
            <div className="chat-section">
              <ChatPanel contentType="youtube" />
            </div>
          </div>

          {/* 퀴즈 점수 표시 */}
          <div className="quiz-score-display">
            <p>퀴즈 점수: {quizScore}점</p>
          </div>

          {/* 영상 요약 & 퀴즈 설정 */}
          <div className="settings-section">
            <div className="summary-box">
              <h3>영상 요약</h3>
              <p>영상 요약은 기본으로 제공</p>
              <div className="summary-content">
                {videoData?.transcript_preview || '자막에서 추출한 요약 내용이 여기에 표시됩니다.'}
              </div>
            </div>

            <QuizSettings 
              contentId={loadedVideoId}
              contentType="youtube"
              onQuizzesGenerated={handleQuizzesGenerated}
            />
          </div>

          {/* Google 검색 */}
          <GoogleSearch 
            transcript={videoData?.transcript_preview}
            contentTitle={`YouTube ${loadedVideoId}`}
          />
        </>
      )}

      {/* 영상 없을 때 안내 */}
      {!loadedVideoId && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <p>YouTube URL을 입력하고 "영상 보기"를 클릭하세요.</p>
          <p className="empty-hint">예시: https://www.youtube.com/watch?v=aircAruvnKk</p>
        </div>
      )}

      {/* 퀴즈 모달 */}
      {showQuizModal && currentQuiz && (
        <QuizModal
          quiz={currentQuiz}
          onAnswer={handleQuizAnswer}
          onClose={handleCloseQuiz}
        />
      )}

      <Footer />
    </div>
  );
}

export default WatchYoutubePage;