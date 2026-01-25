// src/components/DashboardHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../../modals/ProfileModal';
import MessageModal from '../../modals/MessageModal';
import SettingsModal from '../../modals/SettingsModal';

function DashboardHeader() {
  const navigate = useNavigate();
  
  // 모달 상태 관리
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="dashboard-header">
        <div className="logo-container">
          <img src="/images/kit-logo.png" alt="금오공대" className="kit-logo" />
        </div>

        <h1 className="main-title">BISKIT POINT</h1>

        <div className="dashboard-icons">
          <button 
            className="icon-button" 
            title="프로필"
            onClick={() => setIsProfileOpen(true)}
          >
            👤
          </button>
          <button 
            className="icon-button" 
            title="쪽지함"
            onClick={() => setIsMessageOpen(true)}
          >
            💬
          </button>
          <button 
            className="icon-button" 
            title="설정"
            onClick={() => setIsSettingsOpen(true)}
          >
            ⚙️
          </button>
          <button 
            className="button-primary" 
            title="뒤로가기"
            onClick={() => navigate('/dashboard')}
          >
            뒤로가기
          </button>
        </div>
      </header>

      {/* 모달들 */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      <MessageModal 
        isOpen={isMessageOpen} 
        onClose={() => setIsMessageOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}

export default DashboardHeader;