// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import WatchYoutubePage from './pages/WatchYoutubePage';
import WatchUploadPage from './pages/WatchUploadPage';
import OfflineAssistPage from './pages/OfflineAssistPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* YouTube 학습 - 입력 페이지 */}
        <Route path="/watch-youtube" element={<WatchYoutubePage />} />
        <Route path="/watch-youtube/:videoId" element={<WatchYoutubePage />} />
        
        {/* 업로드 강의 학습 - 업로드 페이지 */}
        <Route path="/watch-upload" element={<WatchUploadPage />} />
        <Route path="/watch-upload/:lectureId" element={<WatchUploadPage />} />
        
        {/* 오프라인 보조 */}
        <Route path="/offline-assist" element={<OfflineAssistPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;