import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function AudioRecorder({ onTranscriptUpdate }) {
  const { userId } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('ko');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastTranscriptRef = useRef('');  // 이전 전사 결과 추적

  const sendChunkForTranscription = useCallback(async (audioBlob) => {
    if (audioBlob.size < 1000) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'chunk.webm');
      formData.append('user_id', userId);
      formData.append('language', language);

      const response = await fetch(API_ENDPOINTS.WHISPER_TRANSCRIBE, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success && data.transcript && data.transcript.trim()) {
        const fullText = data.transcript.trim();
        
        // 새로운 부분만 추출 (이전 결과보다 길면)
        if (fullText.length > lastTranscriptRef.current.length) {
          const newText = fullText.substring(lastTranscriptRef.current.length).trim();
          if (newText) {
            setTranscript(fullText);
            if (onTranscriptUpdate) {
              onTranscriptUpdate(fullText);
            }
          }
        }
        lastTranscriptRef.current = fullText;
      }
    } catch (error) {
      console.error('전사 실패:', error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [userId, language, onTranscriptUpdate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      lastTranscriptRef.current = '';

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // 5초마다 전체 녹음을 Whisper로 전송
      intervalRef.current = setInterval(() => {
        if (chunksRef.current.length > 0 && !isProcessingRef.current) {
          // 청크 초기화 안 함! 전체를 보냄
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          sendChunkForTranscription(blob);
        }
      }, 5000);

      mediaRecorder.start(1000);
      setIsRecording(true);
      setTranscript('');
      console.log('🎤 녹음 시작');

    } catch (error) {
      console.error('마이크 접근 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);

    // 최종 전사
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await sendChunkForTranscription(blob);
    }

    console.log('⏹ 녹음 종료');
  };

  const clearTranscript = () => {
    setTranscript('');
    lastTranscriptRef.current = '';
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-header">
        <h3>🎙️ 실시간 강의 녹음</h3>
        <p>5초 간격으로 음성을 텍스트로 변환합니다.</p>
      </div>

      <div className="language-selector">
        <label>언어: </label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isRecording}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="recorder-controls">
        {!isRecording ? (
          <button className="record-btn start" onClick={startRecording}>
            🎤 녹음 시작
          </button>
        ) : (
          <button className="record-btn stop" onClick={stopRecording}>
            ⏹ 녹음 중지
          </button>
        )}
        {transcript && (
          <button className="clear-btn" onClick={clearTranscript}>
            🗑️ 초기화
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse-dot"></span>
          <span>녹음 중... {isProcessing && '(변환 중)'}</span>
        </div>
      )}

      <div className="transcript-box">
        <h4>📝 변환된 텍스트</h4>
        <div className="transcript-content">
          {transcript || '녹음을 시작하면 여기에 텍스트가 표시됩니다.'}
        </div>
      </div>

      <div className="transcript-stats">
        <span>글자 수: {transcript.length}자</span>
      </div>
    </div>
  );
}

export default AudioRecorder;