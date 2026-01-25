// src/components/learn/QuizModal.jsx
import React, { useState } from 'react';

function QuizModal({ quiz, onAnswer, onClose }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!quiz) return null;

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      alert('답을 선택해주세요.');
      return;
    }

    const correct = selectedAnswer === quiz.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    // 부모 컴포넌트에 결과 전달
    onAnswer(correct, selectedAnswer);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    onClose();
  };

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <h2>퀴즈 타임! 🎯</h2>
        </div>

        <div className="quiz-content">
          <div className="quiz-question">
            <p>{quiz.question}</p>
          </div>

          <div className="quiz-options">
            {quiz.options.map((option, index) => (
              <button
                key={index}
                className={`quiz-option ${
                  selectedAnswer === index ? 'selected' : ''
                } ${
                  showResult && index === quiz.correct_answer
                    ? 'correct'
                    : showResult && selectedAnswer === index
                    ? 'incorrect'
                    : ''
                }`}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
              >
                <span className="option-number">{index + 1}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <div className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}>
              <p className="result-text">
                {isCorrect ? '정답입니다! 🎉' : '틀렸습니다. 😢'}
              </p>
              {quiz.explanation && (
                <p className="result-explanation">
                  <strong>해설:</strong> {quiz.explanation}
                </p>
              )}
              <p className="result-score">
                {isCorrect ? '+10점' : '+0점'}
              </p>
            </div>
          )}
        </div>

        <div className="quiz-footer">
          {!showResult ? (
            <button className="quiz-submit-button" onClick={handleSubmit}>
              제출하기
            </button>
          ) : (
            <button className="quiz-next-button" onClick={handleNext}>
              계속하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizModal;