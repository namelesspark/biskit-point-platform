// src/components/Footer.jsx
import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      {/* 상단 정보 */}
      <div className="footer-top">
        <p className="footer-title">DX / AX 프로젝트</p>
      </div>

      {/* 하단 저작권 및 연락처 */}
      <div className="footer-bottom">
        <p>© 2025 All Rights Reserved</p>
        <p>문의: jade.lake8852@gmail.com</p>
        <p>(646) 555-4567</p>
        
        {/* 소셜 아이콘 */}
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">♪</a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;