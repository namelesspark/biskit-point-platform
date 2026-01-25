// src/components/BookmarkSection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';

function BookmarkSection() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        const userId = user ? user.uid : 'guest';

        const response = await fetch(`http://localhost:5000/api/bookmarks?user_id=${userId}`);
        const data = await response.json();

        if (data.success) {
          setBookmarks(data.bookmarks);
        } else {
          throw new Error(data.error || '즐겨찾기 로드 실패');
        }
      } catch (error) {
        console.error('즐겨찾기 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  return (
    <section className="bookmark-section">
      <h2 className="section-title">즐겨찾기</h2>

      {loading && <p>로딩 중...</p>}

      <div className="bookmark-grid">
        {bookmarks.map((video) => (
          <div key={video.id} className="bookmark-card">
            <img src={video.thumbnail} alt={video.title} />
            <div className="card-content">
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <button className="card-button">Call to action →</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BookmarkSection;