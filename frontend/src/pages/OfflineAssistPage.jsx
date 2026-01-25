// src/pages/OfflineAssistPage.jsx
import React, { useState } from 'react';
import LearnPageHeader from '../components/common/Header/LearnPageHeader';
import AudioRecorder from '../components/offlineassist/AudioRecorder';
import WhisperSection from '../components/offlineassist/WhisperSection';
import GoogleSearch from '../components/learn/GoogleSearch';
import Footer from '../components/common/Footer/Footer';

function OfflineAssistPage() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');

  const handleAudioRecorded = (blob) => {
    setAudioBlob(blob);
  };

  return (
    <div className="offline-assist-page">
      <LearnPageHeader />

      <h1 className="page-title">오프라인 강의 보조</h1>

      <div className="offline-container">
        <AudioRecorder onAudioRecorded={handleAudioRecorded} />
        
        <WhisperSection audioBlob={audioBlob} />

        <GoogleSearch 
          transcript={transcript}
          contentTitle="오프라인 강의"
        />
      </div>

      <Footer />
    </div>
  );
}

export default OfflineAssistPage;