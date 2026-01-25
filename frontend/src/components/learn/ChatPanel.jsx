// src/components/Watchyoutube/ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../config/firebase';

function ChatPanel({ videoId }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요! 강의에 대해 궁금한 점을 물어보세요.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    
    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userMessageText
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 현재 로그인한 사용자 ID
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';

      console.log('챗봇 API 호출:', {
        user_id: userId,
        message: userMessageText
      });

      // 백엔드 API 호출
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessageText
        })
      });

      const data = await response.json();

      console.log('챗봇 응답:', data);

      if (!data.success) {
        throw new Error(data.error || '응답 생성 실패');
      }

      // 봇 응답 추가
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response || '죄송합니다. 응답을 생성할 수 없습니다.'
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('챗봇 에러:', error);
      
      // 에러 메시지
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: error.message.includes('먼저 영상을 로드하세요')
          ? '먼저 영상을 로드해주세요. 대시보드로 돌아가서 YouTube URL을 입력하세요.'
          : '현재 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터키로 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel">
      {/* 채팅 메시지 영역 */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`chat-message ${msg.sender}`}
          >
            <div className="message-bubble">
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message bot">
            <div className="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
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
          className="chat-send-button"
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;