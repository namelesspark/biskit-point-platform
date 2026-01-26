// src/components/common/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import ProfileModal from '../modals/ProfileModal';
import SettingsModal from '../modals/SettingsModal';
import MessageModal from '../modals/MessageModal';
import { API_ENDPOINTS } from '../../config/api';

function Header({ variant = 'main' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userId } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽지 않은 쪽지 수 조회
  useEffect(() => {
    if (userId && userId !== 'guest') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 갱신
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES_UNREAD}?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setUnreadCount(data.count || 0);
    } catch (e) {}
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // 메인 헤더 (홈페이지)
  if (variant === 'main') {
    return (
      <header className="header header-main">
        <div className="logo-container">
          <Link to="/">
            <img src="/images/kit-logo.png" alt="KIT" className="kit-logo" />
          </Link>
        </div>
        <h1 className="main-title">BISKIT POINT</h1>
        <div className="header-buttons">
          {user ? (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                대시보드
              </button>
              <button className="btn btn-secondary" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                로그인
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/signup')}>
                회원가입
              </button>
            </>
          )}
        </div>
      </header>
    );
  }

  // 대시보드 헤더
  return (
    <header className="header header-dashboard">
      <div className="logo-container">
        <Link to="/dashboard">
          <img src="/images/kit-logo.png" alt="KIT" className="kit-logo" />
        </Link>
      </div>
      
      <nav className="header-nav">
        <Link to="/youtube" className={`nav-link ${isActive('/youtube') ? 'active' : ''}`}>
          YouTube 학습
        </Link>
        <Link to="/lectures" className={`nav-link ${isActive('/lectures') ? 'active' : ''}`}>
          강의 목록
        </Link>
        <Link to="/upload" className={`nav-link ${isActive('/upload') ? 'active' : ''}`}>
          파일 업로드
        </Link>
        <Link to="/offline" className={`nav-link ${isActive('/offline') ? 'active' : ''}`}>
          오프라인 보조
        </Link>
        <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`}>
          커뮤니티
        </Link>
        <Link to="/ranking" className={`nav-link ${isActive('/ranking') ? 'active' : ''}`}>
          랭킹
        </Link>
      </nav>
      
      <div className="header-actions">
        <button className="icon-btn message-btn" onClick={() => setShowMessages(true)} title="쪽지함">
          📬
          {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        <button className="icon-btn" onClick={() => setShowSettings(true)} title="설정">
          ⚙️
        </button>
        <button className="icon-btn" onClick={() => setShowProfile(true)} title="프로필">
          👤
        </button>
        <button className="btn btn-small btn-secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <MessageModal isOpen={showMessages} onClose={() => { setShowMessages(false); fetchUnreadCount(); }} />
    </header>
  );
}

export default Header;
