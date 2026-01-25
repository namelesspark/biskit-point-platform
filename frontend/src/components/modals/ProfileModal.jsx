// src/components/modals/ProfileModal.jsx
import React from 'react';

function ProfileModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* 프로필 제목 */}
        <h2 className="modal-title">홍길동</h2>

        {/* 프로필 이미지 */}
        <div className="profile-image-container">
          <div className="profile-image">
            <img src="/images/profile-placeholder.png" alt="프로필" />
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="profile-info">
          <div className="info-section">
            <h3>전자공학부</h3>
            <p>전자시스템전공</p>
          </div>

          <div className="profile-description">
            <p>
              A little paragraph introduction that gives a sense of what you do,
              who you are, where you're from, and why you created this website.
              This is the most likely part of the page to be read in full.
            </p>
          </div>
        </div>

        {/* 스크랩 섹션 */}
        <div className="profile-scrap">
          <h3>스크랩</h3>
          
          <div className="scrap-card">
            <span className="scrap-icon">😊</span>
            <div className="scrap-content">
              <h4>작성자</h4>
              <p>글 제목</p>
              <p className="scrap-text">~~</p>
            </div>
            <span className="quote-mark">"</span>
          </div>

          <div className="scrap-card">
            <span className="scrap-icon">😊</span>
            <div className="scrap-content">
              <h4>작성자</h4>
              <p>글 제목</p>
              <p className="scrap-text">~~</p>
            </div>
            <span className="quote-mark">"</span>
          </div>

          <div className="scrap-card">
            <span className="scrap-icon">😊</span>
            <div className="scrap-content">
              <h4>작성자</h4>
              <p>글 제목</p>
              <p className="scrap-text">~~</p>
            </div>
            <span className="quote-mark">"</span>
          </div>

          <div className="scrap-card">
            <span className="scrap-icon">😊</span>
            <div className="scrap-content">
              <h4>작성자</h4>
              <p>글 제목</p>
              <p className="scrap-text">~~</p>
            </div>
            <span className="quote-mark">"</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;