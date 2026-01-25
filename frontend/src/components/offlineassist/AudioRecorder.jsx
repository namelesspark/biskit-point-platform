// src/components/offlineassist/AudioRecorder.jsx
import React, { useState, useRef } from 'react';

function AudioRecorder({ onAudioRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        if (onAudioRecorded) {
          onAudioRecorded(blob);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('🎤 녹음 시작');

    } catch (error) {
      console.error('마이크 접근 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('⏸ 녹음 종료');
    }
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-controls">
        {!isRecording ? (
          <button className="record-button start" onClick={startRecording}>
            🎤 음성 추출 시작
          </button>
        ) : (
          <button className="record-button stop" onClick={stopRecording}>
            ⏹ 녹음 중지
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse"></span>
          녹음 중...
        </div>
      )}

      {recordedBlob && (
        <div className="recorded-info">
          <p>✅ 녹음 완료 ({(recordedBlob.size / 1024).toFixed(2)} KB)</p>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;