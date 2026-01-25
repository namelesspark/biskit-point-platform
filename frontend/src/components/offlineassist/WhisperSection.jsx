// src/components/offlineassist/WhisperSection.jsx
import React, { useState } from 'react';

function WhisperSection({ audioBlob }) {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTranscribe = async () => {
    if (!audioBlob) {
      alert('녹음된 오디오가 없습니다.');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('http://localhost:5000/api/whisper/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setTranscript(data.transcript);
        alert('텍스트 변환 완료!');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Whisper 변환 실패:', error);
      alert(`텍스트 변환 실패: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="whisper-section">
      <h3>Whisper AI 실시간 텍스트 변환</h3>
      <p>Whisper AI가 음성을 텍스트로 변환하여 이곳에 표시</p>

      <button
        className="transcribe-button"
        onClick={handleTranscribe}
        disabled={isProcessing || !audioBlob}
      >
        {isProcessing ? '변환 중...' : '텍스트 변환'}
      </button>

      {transcript && (
        <div className="transcript-result">
          <h4>변환된 텍스트:</h4>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default WhisperSection;