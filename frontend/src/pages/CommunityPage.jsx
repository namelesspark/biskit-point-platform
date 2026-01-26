// src/pages/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';
import SendMessageModal from '../components/modals/SendMessageModal';

function CommunityPage() {
  const navigate = useNavigate();
  const { user, userId } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '자유게시판' });
  
  // 쪽지 보내기
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [messageReceiver, setMessageReceiver] = useState(null);

  useEffect(() => { loadPosts(); }, [activeTab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const category = activeTab === 'all' ? '' : activeTab;
      const res = await fetch(`${API_ENDPOINTS.COMMUNITY_LIST}?category=${category}`);
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (e) {
      // Fallback to mock data
      const mockPosts = [
        { id: '1', title: '🔥 프로젝트 팀원 모집합니다!', content: 'AI 프로젝트 팀원을 모집합니다. 관심있으신 분은 댓글 남겨주세요!', author: '김철수', authorId: 'user1', category: '팀원모집', createdAt: '2025-01-26', scraps: 12, comments: 5 },
        { id: '2', title: '📚 알고리즘 스터디 모집 (주 2회)', content: '매주 화, 목 저녁 7시에 진행하는 알고리즘 스터디입니다.', author: '이영희', authorId: 'user2', category: '스터디', createdAt: '2025-01-25', scraps: 8, comments: 3 },
        { id: '3', title: '🎯 캡스톤 디자인 아이디어 공유', content: '캡스톤 디자인 주제 아이디어 공유합니다. 참고하세요!', author: '박민수', authorId: 'user3', category: '자유게시판', createdAt: '2025-01-25', scraps: 5, comments: 7 },
        { id: '4', title: '💡 AI 프로젝트 팀원 1명 급구!', content: 'ML 경험 있으신 분 환영합니다. 급하게 구합니다!', author: '정다희', authorId: 'user4', category: '팀원모집', createdAt: '2025-01-24', scraps: 15, comments: 10 },
        { id: '5', title: '🐍 Python 스터디 같이 하실 분?', content: '파이썬 기초부터 심화까지 함께 공부해요', author: '최지훈', authorId: 'user5', category: '스터디', createdAt: '2025-01-24', scraps: 6, comments: 4 },
      ];
      if (activeTab === 'all') {
        setPosts(mockPosts);
      } else {
        setPosts(mockPosts.filter(p => p.category === activeTab));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScrap = async (postId, e) => {
    e.stopPropagation();
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }
    
    try {
      const res = await fetch(API_ENDPOINTS.COMMUNITY_SCRAP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: postId })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, scraps: (p.scraps || 0) + 1 } : p));
        alert('스크랩되었습니다!');
      } else {
        alert(data.message || '이미 스크랩한 글입니다.');
      }
    } catch (e) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, scraps: (p.scraps || 0) + 1 } : p));
      alert('스크랩되었습니다!');
    }
  };

  const handleWritePost = async () => {
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }
    if (!newPost.title.trim() || !newPost.content.trim()) { alert('제목과 내용을 입력해주세요.'); return; }

    try {
      const res = await fetch(API_ENDPOINTS.COMMUNITY_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          author: user?.displayName || '익명',
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          category: newPost.category
        })
      });
      const data = await res.json();
      if (data.success) {
        loadPosts();
        setShowWriteModal(false);
        setNewPost({ title: '', content: '', category: '자유게시판' });
        alert('글이 등록되었습니다!');
      }
    } catch (e) {
      // Fallback: just add to local state
      const newPostData = {
        id: Date.now().toString(),
        ...newPost,
        author: user?.displayName || '익명',
        authorId: userId,
        createdAt: new Date().toISOString(),
        scraps: 0,
        comments: 0
      };
      setPosts(prev => [newPostData, ...prev]);
      setShowWriteModal(false);
      setNewPost({ title: '', content: '', category: '자유게시판' });
      alert('글이 등록되었습니다!');
    }
  };

  const handleSendMessage = (post, e) => {
    e?.stopPropagation();
    if (userId === 'guest') { alert('로그인이 필요합니다.'); return; }
    if (userId === post.authorId) { alert('자신에게는 쪽지를 보낼 수 없습니다.'); return; }
    setMessageReceiver({ id: post.authorId, name: post.author });
    setShowSendMessage(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getCategoryStyle = (category) => {
    switch(category) {
      case '팀원모집': return { bg: '#fee2e2', color: '#dc2626' };
      case '스터디': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const tabs = [
    { id: 'all', label: '전체' },
    { id: '팀원모집', label: '🔥 팀원모집' },
    { id: '스터디', label: '📚 스터디' },
    { id: '자유게시판', label: '💬 자유게시판' },
  ];

  return (
    <div className="community-page">
      <Header variant="dashboard" />

      <main className="community-content">
        <div className="community-header">
          <h1>💬 커뮤니티</h1>
          <button className="btn btn-primary" onClick={() => setShowWriteModal(true)}>✏️ 글쓰기</button>
        </div>

        <div className="community-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="posts-list">
          {loading ? (
            <div className="loading-state"><div className="spinner"></div></div>
          ) : posts.length === 0 ? (
            <div className="empty-posts"><p>아직 게시글이 없습니다.</p></div>
          ) : (
            posts.map(post => {
              const style = getCategoryStyle(post.category);
              return (
                <div key={post.id} className="post-card" onClick={() => setShowPostDetail(post)}>
                  <div className="post-header">
                    <span className="category-badge" style={{ background: style.bg, color: style.color }}>{post.category}</span>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-preview">{post.content}</p>
                  <div className="post-footer">
                    <div className="post-author-section">
                      <span className="post-author">👤 {post.author}</span>
                      {post.authorId !== userId && (
                        <button className="message-author-btn" onClick={(e) => handleSendMessage(post, e)} title="쪽지 보내기">
                          ✉️
                        </button>
                      )}
                    </div>
                    <div className="post-stats">
                      <button className="stat-btn" onClick={(e) => handleScrap(post.id, e)}>📌 스크랩 {post.scraps || 0}</button>
                      <span>💬 댓글 {post.comments || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={() => setShowWriteModal(false)}>
          <div className="modal-content write-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowWriteModal(false)}>✕</button>
            <h2>✏️ 글쓰기</h2>
            <div className="form-group">
              <label>카테고리</label>
              <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}>
                <option value="자유게시판">💬 자유게시판</option>
                <option value="팀원모집">🔥 팀원모집</option>
                <option value="스터디">📚 스터디</option>
              </select>
            </div>
            <div className="form-group">
              <label>제목</label>
              <input type="text" placeholder="제목을 입력하세요" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} maxLength={100} />
            </div>
            <div className="form-group">
              <label>내용</label>
              <textarea placeholder="내용을 입력하세요" rows={6} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} maxLength={2000} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowWriteModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleWritePost}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 글 상세 모달 */}
      {showPostDetail && (
        <div className="modal-overlay" onClick={() => setShowPostDetail(null)}>
          <div className="modal-content post-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPostDetail(null)}>✕</button>
            <div className="post-detail-header">
              <span className="category-badge" style={getCategoryStyle(showPostDetail.category)}>{showPostDetail.category}</span>
              <span className="post-date">{formatDate(showPostDetail.createdAt)}</span>
            </div>
            <h2>{showPostDetail.title}</h2>
            <div className="post-detail-author">
              <span>👤 {showPostDetail.author}</span>
              {showPostDetail.authorId !== userId && (
                <button className="btn btn-small btn-outline" onClick={() => handleSendMessage(showPostDetail)}>✉️ 쪽지 보내기</button>
              )}
            </div>
            <div className="post-detail-content">{showPostDetail.content}</div>
            <div className="post-detail-stats">
              <span>📌 스크랩 {showPostDetail.scraps || 0}</span>
              <span>💬 댓글 {showPostDetail.comments || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* 쪽지 보내기 모달 */}
      {showSendMessage && messageReceiver && (
        <SendMessageModal
          isOpen={showSendMessage}
          onClose={() => { setShowSendMessage(false); setMessageReceiver(null); }}
          receiverId={messageReceiver.id}
          receiverName={messageReceiver.name}
        />
      )}

      <Footer />
    </div>
  );
}

export default CommunityPage;
