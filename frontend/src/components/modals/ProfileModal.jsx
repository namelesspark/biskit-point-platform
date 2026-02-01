// src/components/modals/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../config/firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
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
  
  // 회원 탈퇴 관련 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && userId !== 'guest') {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch(`${API_ENDPOINTS.USER_PROFILE}?user_id=${userId}`);
      const profileData = await profileRes.json();
      if (profileData.success) setProfile(profileData.profile);

      const bookmarkRes = await fetch(`${API_ENDPOINTS.BOOKMARK_LIST}?user_id=${userId}`);
      const bookmarkData = await bookmarkRes.json();
      if (bookmarkData.success) setBookmarks(bookmarkData.bookmarks);

      const watchedRes = await fetch(`${API_ENDPOINTS.USER_WATCHED}?user_id=${userId}`);
      const watchedData = await watchedRes.json();
      if (watchedData.success) setWatched(watchedData.watched_videos);

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

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      // 1. 재인증 (보안상 필요)
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. 백엔드에서 사용자 데이터 삭제 (선택사항)
      try {
        await fetch(`${API_ENDPOINTS.USER_DELETE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
      } catch (e) {
        console.log('백엔드 데이터 삭제 실패 (무시 가능):', e);
      }

      // 3. Firebase Auth에서 사용자 삭제
      await deleteUser(auth.currentUser);

      alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      navigate('/');
      
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      if (error.code === 'auth/wrong-password') {
        setDeleteError('비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/too-many-requests') {
        setDeleteError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setDeleteError('탈퇴 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setDeleting(false);
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

        {/* 회원 탈퇴 확인 화면 */}
        {showDeleteConfirm ? (
          <div className="delete-confirm-section">
            <h2>⚠️ 회원 탈퇴</h2>
            <p className="delete-warning">
              정말 탈퇴하시겠습니까?<br />
              탈퇴 시 모든 데이터(포인트, 시청기록, 즐겨찾기 등)가 삭제되며 복구할 수 없습니다.
            </p>
            
            <div className="input-group">
              <label>비밀번호 확인</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>
            
            {deleteError && <p className="error-message">{deleteError}</p>}
            
            <div className="delete-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={deleting}
              >
                취소
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <div className="item-list">
                  {bookmarks.length === 0 ? (
                    <p className="empty-message">즐겨찾기한 영상이 없습니다.</p>
                  ) : bookmarks.map((item) => (
                    <div 
                      key={item.videoId} 
                      className="list-item clickable"
                      onClick={() => {
                        if (item.videoType === 'youtube') {
                          handleNavigate(`/youtube/${item.videoId}`);
                        } else if (item.videoType === 'lecture') {
                          handleNavigate(`/lectures/${item.videoId.replace('lecture_', '')}`);
                        } else {
                          handleNavigate(`/lectures/${item.videoId.replace('lecture_', '')}`);
                        }
                      }}
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

            {/* 회원 탈퇴 버튼 */}
            <div className="profile-footer">
              <button 
                className="btn-link delete-account-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                회원 탈퇴
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;