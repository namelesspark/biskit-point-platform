// src/pages/WatchUploadPage.jsx
import React, { useState } from 'react';
import { auth } from '../config/firebase';
import LearnPageHeader from '../components/common/Header/LearnPageHeader';
import VideoPlayer from '../components/watchupload/VideoPlayer';
import WhisperSection from '../components/watchupload/WhisperSection';
import ChatPanel from '../components/learn/ChatPanel';
import QuizSettings from '../components/learn/QuizSettings';
import GoogleSearch from '../components/learn/GoogleSearch';
import Footer from '../components/common/Footer/Footer';

function WatchUploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [currentTab, setCurrentTab] = useState('summary');
  const [isLoaded, setIsLoaded] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드 가능합니다.');
      return;
    }

    setVideoFile(file);
    
    // 비디오 URL 생성 (미리보기용)
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsLoaded(true);

    console.log('비디오 파일 업로드:', file.name);
  };

  const handleTranscriptGenerated = (newTranscript) => {
    setTranscript(newTranscript);
  };

  return (
    <div className="watch-upload-page">
      <LearnPageHeader />

      <h1 className="page-title">업로드된 강의 듣기</h1>

      {/* 파일 업로드 섹션 */}
      <div className="upload-input-section">
        <div className="upload-area">
          <label htmlFor="video-upload" className="upload-label">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              {videoFile ? videoFile.name : '비디오 파일을 선택하거나 드래그하세요'}
            </p>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* 영상 로드 후 표시 */}
      {isLoaded && videoUrl && (
        <>
          <div className="video-container">
            <div className="video-section">
              <VideoPlayer videoUrl={videoUrl} />
            </div>
            <div className="chat-section">
              <ChatPanel contentType="upload" />
            </div>
          </div>

          {/* Whisper 섹션 */}
          <WhisperSection 
            videoFile={videoFile}
            onTranscriptGenerated={handleTranscriptGenerated}
          />

          {/* 퀴즈 설정 */}
          <div className="settings-section">
            <QuizSettings 
              contentId={videoFile?.name}
              contentType="upload"
            />
          </div>

          {/* Google 검색 */}
          <GoogleSearch 
            transcript={transcript}
            contentTitle={videoFile?.name || '업로드 강의'}
          />
        </>
      )}

      {!isLoaded && (
        <div className="empty-state">
          <p>비디오 파일을 업로드하세요.</p>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default WatchUploadPage;