// src/components/modals/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function ProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, userId } = useAuth();
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState([]);
  const [watched, setWatched] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId !== 'guest') {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 프로필
      const profileRes = await fetch(`${API_ENDPOINTS.USER_PROFILE}?user_id=${userId}`);
      const profileData = await profileRes.json();
      if (profileData.success) setProfile(profileData.profile);

      // 즐겨찾기
      const bookmarkRes = await fetch(`${API_ENDPOINTS.BOOKMARK_LIST}?user_id=${userId}`);
      const bookmarkData = await bookmarkRes.json();
      if (bookmarkData.success) setBookmarks(bookmarkData.bookmarks);

      // 시청 기록
      const watchedRes = await fetch(`${API_ENDPOINTS.USER_WATCHED}?user_id=${userId}`);
      const watchedData = await watchedRes.json();
      if (watchedData.success) setWatched(watchedData.watched_videos);

      // 스크랩한 커뮤니티 글 (임시 데이터 - 나중에 Firebase 연결)
      setScraps([
        { id: 1, title: '🔥 프로젝트 팀원 모집합니다!', author: '김철수', category: '팀원모집', date: '2025-01-26' },
        { id: 4, title: '💡 AI 프로젝트 팀원 1명 급구!', author: '정다희', category: '팀원모집', date: '2025-01-24' },
      ]);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const getCategoryStyle = (category) => {
    switch(category) {
      case '팀원모집': return { bg: '#fee2e2', color: '#dc2626' };
      case '스터디': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* 프로필 헤더 */}
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <h2>{profile?.displayName || user?.displayName || user?.email || '사용자'}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-points">
            <span className="points-label">총 점수</span>
            <span className="points-value">{profile?.totalPoints || 0}점</span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            ⭐ 즐겨찾기
          </button>
          <button 
            className={`tab-btn ${activeTab === 'watched' ? 'active' : ''}`}
            onClick={() => setActiveTab('watched')}
          >
            📺 시청기록
          </button>
          <button 
            className={`tab-btn ${activeTab === 'scraps' ? 'active' : ''}`}
            onClick={() => setActiveTab('scraps')}
          >
            📌 스크랩
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="profile-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : activeTab === 'bookmarks' ? (
            // 즐겨찾기 탭
            <div className="item-list">
              {bookmarks.length === 0 ? (
                <p className="empty-message">즐겨찾기한 영상이 없습니다.</p>
              ) : bookmarks.map((item) => (
                <div 
                  key={item.videoId} 
                  className="list-item clickable"
                  onClick={() => handleNavigate(item.videoType === 'youtube' ? `/youtube/${item.videoId}` : '/upload')}
                >
                  <div className="item-thumb">
                    {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : '📺'}
                  </div>
                  <div className="item-info">
                    <h4>{item.videoTitle}</h4>
                    <span className={`badge ${item.videoType}`}>
                      {item.videoType === 'youtube' ? 'YouTube' : '업로드'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'watched' ? (
            // 시청 기록 탭
            <div className="item-list">
              {watched.length === 0 ? (
                <p className="empty-message">시청 기록이 없습니다.</p>
              ) : watched.map((item) => (
                <div key={item.videoId} className="list-item">
                  <div className="item-info">
                    <h4>{item.videoTitle}</h4>
                    <div className="item-stats">
                      <span>📺 +{item.pointsEarned}점</span>
                      <span>🧠 퀴즈 {item.quizScore}점</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 스크랩 탭 (커뮤니티 글)
            <div className="item-list">
              {scraps.length === 0 ? (
                <p className="empty-message">스크랩한 글이 없습니다.</p>
              ) : scraps.map((post) => {
                const style = getCategoryStyle(post.category);
                return (
                  <div 
                    key={post.id} 
                    className="list-item clickable"
                    onClick={() => handleNavigate(`/community/${post.id}`)}
                  >
                    <div className="item-info">
                      <div className="scrap-header">
                        <span className="category-badge" style={{ background: style.bg, color: style.color }}>
                          {post.category}
                        </span>
                        <span className="scrap-date">{post.date}</span>
                      </div>
                      <h4>{post.title}</h4>
                      <span className="scrap-author">👤 {post.author}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
