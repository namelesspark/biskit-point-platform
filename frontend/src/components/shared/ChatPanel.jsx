// src/components/shared/ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function ChatPanel() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요! 강의에 대해 궁금한 점을 물어보세요. 🎓' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessageText = inputText;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: userMessageText
    }]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userMessageText
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '응답 생성 실패');
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: error.message.includes('먼저 영상을') 
          ? '먼저 영상을 로드해주세요.' 
          : '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 AI 학습 도우미</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message bot">
            <div className="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="질문을 입력하세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={isLoading}
        />
        <button 
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
