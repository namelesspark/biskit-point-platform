// src/components/modals/MessageModal.jsx
import React from 'react';

function MessageModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content message-modal" onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* 제목 */}
        <h2 className="modal-title">쪽지함</h2>

        {/* 메시지 내용 */}
        <div className="message-content">
          <div className="message-quote">
            <p>
              "A large, heavily bolded quote for emphasis and breaking up content."
            </p>
          </div>
          
          <div className="message-info">
            <p className="message-author">익명</p>
            <p className="message-date">2026-01-15 20:49</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageModal;