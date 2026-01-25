// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      {/* 왼쪽 로고 */}
      <div className="logo-container">
        <img src="/images/kit-logo.png" alt="금오공대" className="kit-logo" />
      </div>

      {/* 가운데 타이틀 */}
      <h1 className="main-title">BISKIT POINT</h1>

      {/* 오른쪽 버튼들 */}
      <div className="header-buttons">
        <button className="button-primary" onClick={() => navigate('/')}>뒤로가기</button>
      </div>
    </header>
  );
}

export default Header;