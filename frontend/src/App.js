// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import YouTubeLearnPage from './pages/YouTubeLearnPage';
import UploadLearnPage from './pages/UploadLearnPage';
import OfflineAssistPage from './pages/OfflineAssistPage';
import RankingPage from './pages/RankingPage';
import CommunityPage from './pages/CommunityPage';
import LecturesListPage from './pages/LecturesListPage';
import LectureDetailPage from './pages/LectureDetailPage';
import AdminUploadPage from './pages/AdminUploadPage';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* YouTube 학습 */}
          <Route path="/youtube" element={<YouTubeLearnPage />} />
          <Route path="/youtube/:videoId" element={<YouTubeLearnPage />} />
          
          {/* 파일 업로드 학습 */}
          <Route path="/upload" element={<UploadLearnPage />} />
          <Route path="/upload/:lectureId" element={<UploadLearnPage />} />
          
          {/* 강의 목록 */}
          <Route path="/lectures" element={<LecturesListPage />} />
          <Route path="/lectures/:lectureId" element={<LectureDetailPage />} />
          
          {/* 관리자 강의 업로드 */}
          <Route path="/admin/upload" element={<AdminUploadPage />} />
          
          {/* 오프라인 보조 */}
          <Route path="/offline" element={<OfflineAssistPage />} />
          
          {/* 랭킹 */}
          <Route path="/ranking" element={<RankingPage />} />
          
          {/* 커뮤니티 */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:postId" element={<CommunityPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
