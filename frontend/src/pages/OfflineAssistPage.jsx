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
  
  // 저장 모달 관련
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSubject, setSaveSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 저장된 녹취록 목록
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  const [showTranscriptList, setShowTranscriptList] = useState(false);

  // 녹취록이 일정 길이 이상이면 세션 설정
  useEffect(() => {
    if (fullTranscript.length > 100 && !sessionSet) {
      setSession();
    }
  }, [fullTranscript, sessionSet]);

  // 저장된 녹취록 목록 로드
  useEffect(() => {
    if (userId && userId !== 'guest') {
      loadSavedTranscripts();
    }
  }, [userId]);

  const loadSavedTranscripts = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.OFFLINE_TRANSCRIPTS_LIST}?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setSavedTranscripts(data.transcripts);
      }
    } catch (error) {
      console.error('녹취록 목록 로드 실패:', error);
    }
  };

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
    setFullTranscript(newText);
  };

  const generateQuiz = async () => {
    if (!fullTranscript.trim()) {
      alert('먼저 음성 인식을 진행해주세요.');
      return;
    }

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

  // 녹취록 저장
  const handleSaveTranscript = async () => {
    if (!saveTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (userId === 'guest') {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.OFFLINE_TRANSCRIPTS_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: saveTitle,
          content: fullTranscript,
          subject: saveSubject
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('녹취록이 저장되었습니다!');
        setShowSaveModal(false);
        setSaveTitle('');
        setSaveSubject('');
        loadSavedTranscripts();
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 저장된 녹취록 불러오기
  const loadTranscript = async (transcriptId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.OFFLINE_TRANSCRIPTS_GET}?transcript_id=${transcriptId}`);
      const data = await response.json();
      if (data.success) {
        setFullTranscript(data.transcript.content);
        setShowTranscriptList(false);
        setSessionSet(false); // 세션 재설정 필요
        alert('녹취록을 불러왔습니다.');
      }
    } catch (error) {
      console.error('불러오기 실패:', error);
    }
  };

  // 저장된 녹취록 삭제
  const deleteTranscript = async (transcriptId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.OFFLINE_TRANSCRIPTS_DELETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          transcript_id: transcriptId
        })
      });

      const data = await response.json();
      if (data.success) {
        loadSavedTranscripts();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
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
            {/* 저장된 녹취록 버튼 */}
            <div className="saved-transcripts-toggle">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTranscriptList(!showTranscriptList)}
              >
                📁 내 녹취록 ({savedTranscripts.length})
              </button>
            </div>

            {/* 저장된 녹취록 목록 */}
            {showTranscriptList && (
              <div className="saved-transcripts-list">
                <h4>📁 저장된 녹취록</h4>
                {savedTranscripts.length === 0 ? (
                  <p className="empty-message">저장된 녹취록이 없습니다.</p>
                ) : (
                  <ul>
                    {savedTranscripts.map((t) => (
                      <li key={t.id} className="transcript-item">
                        <div className="transcript-info" onClick={() => loadTranscript(t.id)}>
                          <strong>{t.title}</strong>
                          {t.subject && <span className="subject-badge">{t.subject}</span>}
                          <span className="date">{new Date(t.createdAt).toLocaleDateString()}</span>
                          <span className="char-count">{t.charCount}자</span>
                        </div>
                        <button className="delete-btn" onClick={() => deleteTranscript(t.id)}>🗑️</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                      ⬇️ 다운로드
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowSaveModal(true)}
                      disabled={fullTranscript.length < 50}
                    >
                      💾 저장하기
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

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content save-transcript-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSaveModal(false)}>✕</button>
            <h2>💾 녹취록 저장</h2>
            
            <div className="form-group">
              <label>제목 *</label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="예: 병렬프로그래밍 3주차"
              />
            </div>
            
            <div className="form-group">
              <label>과목 (선택)</label>
              <select value={saveSubject} onChange={(e) => setSaveSubject(e.target.value)}>
                <option value="">선택 안 함</option>
                <option value="병렬프로그래밍">병렬프로그래밍</option>
                <option value="컴퓨터그래픽스">컴퓨터그래픽스</option>
                <option value="오픈소스프로젝트">오픈소스프로젝트</option>
                <option value="강화학습">강화학습</option>
                <option value="임베디드시스템">임베디드시스템</option>
                <option value="디지털공학">디지털공학</option>
                <option value="기타">기타</option>
              </select>
            </div>
            
            <div className="form-info">
              <p>📝 {fullTranscript.length}자 저장 예정</p>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                취소
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveTranscript}
                disabled={isSaving || !saveTitle.trim()}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

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