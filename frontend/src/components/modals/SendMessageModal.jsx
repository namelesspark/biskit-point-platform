// src/components/modals/SendMessageModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function SendMessageModal({ isOpen, onClose, receiverId, receiverName }) {
  const { userId, user } = useAuth();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (userId === 'guest') {
      alert('로그인이 필요합니다.');
      return;
    }
    if (userId === receiverId) {
      alert('자신에게는 쪽지를 보낼 수 없습니다.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(API_ENDPOINTS.MESSAGES_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          sender_name: user?.displayName || '익명',
          receiver_id: receiverId,
          receiver_name: receiverName,
          content: content.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('쪽지를 보냈습니다!');
        setContent('');
        onClose();
      } else {
        alert(data.error || '전송 실패');
      }
    } catch (e) {
      alert('쪽지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content send-message-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>✉️ 쪽지 보내기</h2>
        
        <div className="form-group">
          <label>받는 사람</label>
          <input type="text" value={receiverName} disabled />
        </div>

        <div className="form-group">
          <label>내용</label>
          <textarea
            placeholder="쪽지 내용을 입력하세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            maxLength={500}
          />
          <span className="char-count">{content.length}/500</span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending || !content.trim()}>
            {sending ? '전송 중...' : '보내기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendMessageModal;
