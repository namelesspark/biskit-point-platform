// src/components/learn/QuizSettings.jsx
import React, { useState } from 'react';
import { auth } from '../../config/firebase';

function QuizSettings({ contentId, contentType = 'youtube', onQuizzesGenerated }) {
  const [quizEnabled, setQuizEnabled] = useState(true);
  const [quizCount, setQuizCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!quizEnabled) {
      alert('퀴즈 기능을 먼저 켜주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      const response = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: contentId,
          content_type: contentType,
          num_quizzes: quizCount
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`퀴즈 ${data.quizzes.length}개가 생성되었습니다!`);
        if (onQuizzesGenerated) {
          onQuizzesGenerated(data.quizzes);
        }
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
      alert(`퀴즈 생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="quiz-settings-card">
      <h3 className="quiz-settings-title">퀴즈 설정</h3>
      
      <div className="quiz-toggle-section">
        <button
          className={`quiz-toggle-button ${quizEnabled ? 'active' : ''}`}
          onClick={() => setQuizEnabled(true)}
        >
          퀴즈 On
        </button>
        <button
          className={`quiz-toggle-button ${!quizEnabled ? 'active' : ''}`}
          onClick={() => setQuizEnabled(false)}
        >
          퀴즈 Off
        </button>
      </div>

      <div className="quiz-count-section">
        <label>퀴즈 개수</label>
        <select
          value={quizCount}
          onChange={(e) => setQuizCount(Number(e.target.value))}
          disabled={!quizEnabled}
        >
          <option value={3}>3개</option>
          <option value={5}>5개</option>
          <option value={10}>10개</option>
        </select>
      </div>

      <button
        className="generate-quiz-button"
        onClick={handleGenerateQuiz}
        disabled={!quizEnabled || isGenerating}
      >
        {isGenerating ? '생성 중...' : '퀴즈 생성하기'}
      </button>
    </div>
  );
}

export default QuizSettings;