// src/pages/OfflineAssistPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import AudioRecorder from '../components/offline/AudioRecorder';
import ChatPanel from '../components/shared/ChatPanel';
import QuizModal from '../components/shared/QuizModal';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function OfflineAssistPage() {
  const { userId } = useAuth();
  const [fullTranscript, setFullTranscript] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);
  
  const transcriptEndRef = useRef(null);

  // 녹취록 변경 시 자동 스크롤
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fullTranscript]);

  // 녹취록이 일정 길이 이상이면 세션 설정
  useEffect(() => {
    if (fullTranscript.length > 100 && !sessionSet) {
      setSession();
    }
  }, [fullTranscript, sessionSet]);

  const setSession = async () => {
    try {
      await fetch(API_ENDPOINTS.OFFLINE_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          transcript: fullTranscript
        })
      });
      setSessionSet(true);
      console.log('📝 세션 설정 완료');
    } catch (error) {
      console.error('세션 설정 실패:', error);
    }
  };

  const handleTranscriptUpdate = (newText) => {
    setFullTranscript(prev => prev + newText);
  };

  const generateQuiz = async () => {
    if (!fullTranscript.trim()) {
      alert('먼저 음성 인식을 진행해주세요.');
      return;
    }

    // 세션 먼저 설정
    await setSession();

    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          transcript_text: fullTranscript,
          num_quizzes: 3
        })
      });

      const data = await response.json();
      if (data.success && data.quizzes?.length > 0) {
        setQuizzes(data.quizzes);
        setCurrentQuizIndex(0);
        setShowQuiz(true);
      } else {
        alert('퀴즈 생성에 실패했습니다. 녹취록이 충분한지 확인해주세요.');
      }
    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
      alert('퀴즈 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) setQuizScore(prev => prev + 10);
  };

  const handleQuizClose = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setShowQuiz(false);
    }
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(fullTranscript);
    alert('클립보드에 복사되었습니다!');
  };

  const downloadTranscript = () => {
    const blob = new Blob([fullTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `강의녹취록_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="offline-assist-page">
      <Header variant="dashboard" />

      <main className="learn-content">
        <div className="page-header">
          <h1 className="page-title">🎙️ 오프라인 강의 보조</h1>
          <p className="page-desc">실시간으로 음성을 인식하여 텍스트로 변환합니다. AI에게 강의 내용을 질문할 수 있습니다.</p>
        </div>

        <div className="offline-layout">
          <div className="left-section">
            <AudioRecorder onTranscriptUpdate={handleTranscriptUpdate} />
            
            {fullTranscript && (
              <div className="full-transcript-card">
                <div className="transcript-header">
                  <h3>📄 전체 녹취록</h3>
                  <div className="transcript-actions">
                    <button className="btn btn-secondary" onClick={copyTranscript}>
                      📋 복사
                    </button>
                    <button className="btn btn-secondary" onClick={downloadTranscript}>
                      💾 저장
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={generateQuiz}
                      disabled={isGenerating || fullTranscript.length < 50}
                    >
                      {isGenerating ? '생성 중...' : '🧠 퀴즈 생성'}
                    </button>
                  </div>
                </div>
                <div className="full-transcript-content">
                  {fullTranscript}
                  <div ref={transcriptEndRef} />
                </div>
                <div className="transcript-info">
                  <span>{fullTranscript.length}자</span>
                  <span>•</span>
                  <span>{sessionSet ? '✅ AI 연동됨' : '⏳ 100자 이상 시 AI 연동'}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="right-section">
            <ChatPanel />
            
            {quizScore > 0 && (
              <div className="quiz-score-card">
                <span>🧠 획득 포인트</span>
                <strong>{quizScore}점</strong>
              </div>
            )}
          </div>
        </div>
      </main>

      {showQuiz && quizzes[currentQuizIndex] && (
        <QuizModal 
          quiz={quizzes[currentQuizIndex]} 
          onAnswer={handleQuizAnswer} 
          onClose={handleQuizClose} 
        />
      )}

      <Footer />
    </div>
  );
}

export default OfflineAssistPage;