// src/components/modals/MessageModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function MessageModal({ isOpen, onClose }) {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (isOpen && userId && userId !== 'guest') {
      loadMessages();
    }
  }, [isOpen, activeTab, userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES_LIST}?user_id=${userId}&type=${activeTab}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (e) {
      console.error('메시지 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (messageId) => {
    try {
      await fetch(API_ENDPOINTS.MESSAGES_READ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message_id: messageId })
      });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    } catch (e) {
      console.error('읽음 처리 실패:', e);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.MESSAGES_DELETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message_id: messageId })
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setSelectedMessage(null);
      }
    } catch (e) {
      console.error('삭제 실패:', e);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;
    try {
      const res = await fetch(API_ENDPOINTS.MESSAGES_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedMessage.senderId,
          content: replyContent
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('답장을 보냈습니다.');
        setReplyContent('');
        setSelectedMessage(null);
      }
    } catch (e) {
      alert('답장 전송 실패');
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content message-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>📬 쪽지함</h2>

        <div className="message-tabs">
          <button className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`} onClick={() => { setActiveTab('received'); setSelectedMessage(null); }}>
            받은 쪽지
          </button>
          <button className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}>
            보낸 쪽지
          </button>
        </div>

        {selectedMessage ? (
          <div className="message-detail">
            <button className="back-btn" onClick={() => setSelectedMessage(null)}>← 목록으로</button>
            <div className="message-detail-header">
              <span className="message-from">
                {activeTab === 'received' ? `보낸 사람: ${selectedMessage.senderName}` : `받는 사람: ${selectedMessage.receiverName}`}
              </span>
              <span className="message-date">{formatDate(selectedMessage.createdAt)}</span>
            </div>
            <div className="message-detail-content">{selectedMessage.content}</div>
            
            {activeTab === 'received' && (
              <div className="reply-section">
                <textarea
                  placeholder="답장 내용을 입력하세요..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  rows={3}
                />
                <div className="reply-actions">
                  <button className="btn btn-secondary btn-small" onClick={() => handleDelete(selectedMessage.id)}>삭제</button>
                  <button className="btn btn-primary btn-small" onClick={handleReply} disabled={!replyContent.trim()}>답장 보내기</button>
                </div>
              </div>
            )}
            
            {activeTab === 'sent' && (
              <div className="reply-actions">
                <button className="btn btn-secondary btn-small" onClick={() => handleDelete(selectedMessage.id)}>삭제</button>
              </div>
            )}
          </div>
        ) : (
          <div className="message-list">
            {loading ? (
              <div className="loading-small">로딩 중...</div>
            ) : messages.length === 0 ? (
              <div className="empty-messages">쪽지가 없습니다.</div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-item ${!msg.isRead && activeTab === 'received' ? 'unread' : ''}`}
                  onClick={() => { setSelectedMessage(msg); if (!msg.isRead && activeTab === 'received') handleRead(msg.id); }}
                >
                  <div className="message-info">
                    <span className="message-sender">
                      {activeTab === 'received' ? msg.senderName : msg.receiverName}
                    </span>
                    <span className="message-preview">{msg.content.slice(0, 30)}{msg.content.length > 30 ? '...' : ''}</span>
                  </div>
                  <span className="message-time">{formatDate(msg.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageModal;
