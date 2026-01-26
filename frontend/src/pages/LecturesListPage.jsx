// src/pages/LecturesListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function LecturesListPage() {
  const navigate = useNavigate();
  const { user, userId } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadLectures(); }, []);

  const loadLectures = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.LECTURES_LIST);
      const data = await res.json();
      if (data.success) setLectures(data.lectures || []);
    } catch (e) {
      console.error('강의 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLectures = lectures.filter(l =>
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="lectures-list-page">
      <Header variant="dashboard" />

      <main className="lectures-content">
        <div className="lectures-header">
          <div className="lectures-title-section">
            <h1>📚 강의 목록</h1>
            <p>운영자가 업로드한 강의를 학습하세요</p>
          </div>
          <div className="lectures-actions">
            <input
              type="text"
              placeholder="강의 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {user?.email === 'admin@biskit.com' && (
              <button className="btn btn-primary" onClick={() => navigate('/admin/upload')}>
                ➕ 강의 업로드
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>강의 목록을 불러오는 중...</p></div>
        ) : filteredLectures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>{searchTerm ? '검색 결과가 없습니다.' : '등록된 강의가 없습니다.'}</p>
          </div>
        ) : (
          <div className="lectures-grid">
            {filteredLectures.map(lecture => (
              <div key={lecture.id} className="lecture-card" onClick={() => navigate(`/lectures/${lecture.id}`)}>
                <div className="lecture-thumbnail">
                  {lecture.thumbnailUrl ? (
                    <img src={lecture.thumbnailUrl} alt={lecture.title} />
                  ) : (
                    <div className="thumbnail-placeholder">🎬</div>
                  )}
                  {lecture.duration && <span className="duration-badge">{formatDuration(lecture.duration)}</span>}
                </div>
                <div className="lecture-info">
                  <h3 className="lecture-title">{lecture.title}</h3>
                  <p className="lecture-description">{lecture.description?.slice(0, 80)}{lecture.description?.length > 80 ? '...' : ''}</p>
                  <div className="lecture-meta">
                    <span className="lecture-date">{formatDate(lecture.createdAt)}</span>
                    <span className="lecture-views">👁 {lecture.viewCount || 0}회</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default LecturesListPage;
