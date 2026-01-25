// src/components/watchupload/WhisperSection.jsx
import React, { useState } from 'react';

function WhisperSection({ videoFile, onTranscriptGenerated }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleExtractAudio = async () => {
    if (!videoFile) {
      alert('비디오 파일이 없습니다.');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('http://localhost:5000/api/whisper/extract', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setTranscript(data.transcript);
        if (onTranscriptGenerated) {
          onTranscriptGenerated(data.transcript);
        }
        alert('음성 추출 완료!');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Whisper 추출 실패:', error);
      alert(`음성 추출 실패: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="whisper-section">
      <h3>Whisper AI 음성 추출</h3>
      <p>업로드된 영상에서 음성을 추출하여 텍스트로 변환, 자동으로 번역하여 요약</p>
      
      <button
        className="extract-button"
        onClick={handleExtractAudio}
        disabled={isProcessing || !videoFile}
      >
        {isProcessing ? '추출 중...' : '음성 추출 시작'}
      </button>

      {transcript && (
        <div className="transcript-result">
          <h4>추출된 텍스트:</h4>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default WhisperSection;