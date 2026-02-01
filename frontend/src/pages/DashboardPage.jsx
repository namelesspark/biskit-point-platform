// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, userId, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [profile, setProfile] = useState(null);  // 프로필 정보 추가
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !dataLoaded && userId && userId !== 'guest') {
      console.log('📍 loadData 호출, userId:', userId);
      loadData();
      setDataLoaded(true);
    }
  }, [userId, authLoading, dataLoaded]);


  const loadData = async () => {
    setLoading(true);
    console.log('📍 API_BASE_URL:', API_ENDPOINTS.BOOKMARK_LIST);
    console.log('📍 userId:', userId);
    try {
      // 프로필 정보 로드
      if (userId && userId !== 'guest') {
        try {
          const profileRes = await fetch(`${API_ENDPOINTS.USER_PROFILE}?user_id=${userId}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success) setProfile(profileData.profile);
          }
        } catch (e) {
          console.log('프로필 로드 실패 (무시)');
        }
      }

      // 즐겨찾기 - 에러 무시
      if (userId && userId !== 'guest') {
        try {
          const bookmarkRes = await fetch(`${API_ENDPOINTS.BOOKMARK_LIST}?user_id=${userId}`);
          if (bookmarkRes.ok) {
            const bookmarkData = await bookmarkRes.json();
            if (bookmarkData.success) setBookmarks(bookmarkData.bookmarks.slice(0, 3));
          }
        } catch (e) {
          console.log('즐겨찾기 로드 실패 (무시)');
        }
      }

      // 랭킹 - 에러 무시
      try {
        const rankingRes = await fetch(`${API_ENDPOINTS.RANKING_LIST}?limit=3`);
        if (rankingRes.ok) {
          const rankingData = await rankingRes.json();
          if (rankingData.success) setRankings(rankingData.rankings);
        }
      } catch (e) {
        console.log('랭킹 로드 실패 (무시)');
      }

      // 강의 목록 - 에러 무시
      try {
        const lectureRes = await fetch(API_ENDPOINTS.LECTURES_LIST);
        if (lectureRes.ok) {
          const lectureData = await lectureRes.json();
          if (lectureData.success) setLectures(lectureData.lectures.slice(0, 3));
        }
      } catch (e) {
        console.log('강의 로드 실패 (무시)');
      }

      // 커뮤니티 임시 데이터
      setCommunityPosts([
        { id: 1, name: 'Andi Antennae', role: 'Director of Air Logistics', content: 'Your expectations will fly sky high...' },
        { id: 2, name: 'Sally Spiracle', role: 'Nest Founder', content: 'When we began building this colony...' },
        { id: 3, name: 'Dev Doodlebug', role: 'Life Cycle Manager', content: 'Namedly\'s tools for managing our identity...' },
      ]);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 즐겨찾기 클릭 핸들러 - URL 경로 방식으로 수정
  const handleBookmarkClick = (item) => {
    if (item.videoType === 'youtube') {
      navigate(`/youtube/${item.videoId}`);
    } else if (item.videoType === 'lecture') {
      navigate(`/lectures/${item.videoId.replace('lecture_', '')}`);
    } else {
      navigate(`/upload/${item.videoId}`);
    }
  };

  // 강의 클릭 핸들러 - lectures 페이지로 이동
  const handleLectureClick = (lecture) => {
    navigate(`/lectures/${lecture.id}`);
  };

  // 사용자 이름 가져오기 (프로필 > Firebase Auth > 기본값 순)
  const getUserDisplayName = () => {
    if (profile?.displayName) return profile.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return '학습자';
  };

  const learningModes = [
    { icon: '📺', title: 'YouTube 학습', desc: 'YouTube URL로 강의 시청', path: '/youtube' },
    { icon: '📁', title: '업로드 강의', desc: '영상 파일 업로드하여 학습', path: '/upload' },
    { icon: '🎙️', title: '오프라인 보조', desc: '실시간 녹음 및 텍스트 변환', path: '/offline' }
  ];

  return (
    <div className="dashboard-page">
      <Header variant="dashboard" />

      <main className="dashboard-content">
        {/* 환영 섹션 */}
        <section className="welcome-section">
          <h1>안녕하세요, {getUserDisplayName()}님! 👋</h1>
          <p>오늘도 즐거운 학습 되세요.</p>
        </section>

        {/* 학습 모드 선택 */}
        <section className="learning-modes">
          <h2>학습 모드 선택</h2>
          <div className="mode-cards">
            {learningModes.map((mode, i) => (
              <div key={i} className="mode-card" onClick={() => navigate(mode.path)}>
                <div className="mode-icon">{mode.icon}</div>
                <h3>{mode.title}</h3>
                <p>{mode.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 즐겨찾기 섹션 */}
        <section className="section-block">
          <h2 className="section-title">즐겨찾기</h2>
          <div className="card-grid three-col">
            {bookmarks.length === 0 ? (
              <>
                <div className="content-card youtube" onClick={() => navigate('/youtube')}>
                  <div className="card-thumbnail">
                    <div className="play-icon">▶</div>
                  </div>
                  <h4>유튜브 링크</h4>
                  <p>즐겨찾기한 YouTube 영상이 여기에 표시됩니다.</p>
                  <span className="card-link">학습하기 →</span>
                </div>
                <div className="content-card upload">
                  <div className="card-thumbnail">
                    <div className="file-icon">⏸</div>
                  </div>
                  <h4>업로드 비디오</h4>
                  <p>즐겨찾기한 업로드 강의가 여기에 표시됩니다.</p>
                  <span className="card-link">학습하기 →</span>
                </div>
                <div className="content-card youtube" onClick={() => navigate('/youtube')}>
                  <div className="card-thumbnail">
                    <div className="play-icon">▶</div>
                  </div>
                  <h4>유튜브 링크</h4>
                  <p>더 많은 영상을 즐겨찾기에 추가하세요.</p>
                  <span className="card-link">학습하기 →</span>
                </div>
              </>
            ) : (
              bookmarks.map((item, i) => (
                <div 
                  key={item.videoId || i} 
                  className={`content-card ${item.videoType}`}
                  onClick={() => handleBookmarkClick(item)}
                >
                  <div className="card-thumbnail">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" />
                    ) : (
                      <div className={item.videoType === 'youtube' ? 'play-icon' : 'file-icon'}>
                        {item.videoType === 'youtube' ? '▶' : '⏸'}
                      </div>
                    )}
                  </div>
                  <h4>{item.videoTitle || '영상 제목'}</h4>
                  <p>{item.description || '즐겨찾기한 영상입니다.'}</p>
                  <span className="card-link">학습하기 →</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 업로드된 강의 섹션 */}
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">업로드된 강의</h2>
            <button className="view-all-btn" onClick={() => navigate('/lectures')}>전체 보기</button>
          </div>
          <div className="card-grid three-col">
            {lectures.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="content-card lecture" onClick={() => navigate('/lectures')}>
                    <div className="card-thumbnail orange">
                      <div className="file-icon">⏸</div>
                    </div>
                    <h4>영상 제목</h4>
                    <p>추출된 음성 파일 요약 내용</p>
                    <span className="card-link">학습하기 →</span>
                  </div>
                ))}
              </>
            ) : (
              lectures.map((lecture, i) => (
                <div 
                  key={lecture.id || i} 
                  className="content-card lecture" 
                  onClick={() => handleLectureClick(lecture)}
                >
                  <div className={`card-thumbnail ${!lecture.thumbnailUrl ? 'orange' : ''}`}>
                    {lecture.thumbnailUrl ? (
                      <img src={lecture.thumbnailUrl} alt={lecture.title} />
                    ) : (
                      <div className="file-icon">⏸</div>
                    )}
                  </div>
                  <h4>{lecture.title || '영상 제목'}</h4>
                  <p>{lecture.description || '추출된 음성 파일 요약 내용'}</p>
                  <span className="card-link">학습하기 →</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 게시판 섹션 */}
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">게시판</h2>
            <button className="view-all-btn" onClick={() => navigate('/community')}>전체 보기</button>
          </div>
          <div className="community-grid">
            {communityPosts.map((post) => (
              <div key={post.id} className="community-card" onClick={() => navigate(`/community/${post.id}`)}>
                <div className="post-author">
                  <div className="author-avatar">👤</div>
                  <div className="author-info">
                    <span className="author-name">{post.name}</span>
                    <span className="author-role">{post.role}</span>
                  </div>
                </div>
                <p className="post-content">{post.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 랭킹 섹션 */}
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">POINT Ranking</h2>
            <button className="view-all-btn" onClick={() => navigate('/ranking')}>전체 보기</button>
          </div>
          <div className="ranking-cards">
            {rankings.length === 0 ? (
              <>
                <div className="ranking-card">
                  <div className="ranking-points">10875</div>
                  <div className="ranking-user">
                    <span className="user-avatar">👤</span>
                    <div className="user-info">
                      <span className="user-name">홍길동</span>
                      <span className="user-dept">컴퓨터공학과</span>
                      <span className="user-year">4학년</span>
                    </div>
                  </div>
                </div>
                <div className="ranking-card">
                  <div className="ranking-points">10000</div>
                  <div className="ranking-user">
                    <span className="user-avatar">👤</span>
                    <div className="user-info">
                      <span className="user-name">홍길동</span>
                      <span className="user-dept">컴퓨터공학과</span>
                      <span className="user-year">4학년</span>
                    </div>
                  </div>
                </div>
                <div className="ranking-card">
                  <div className="ranking-points">8000</div>
                  <div className="ranking-user">
                    <span className="user-avatar">👤</span>
                    <div className="user-info">
                      <span className="user-name">익명</span>
                      <span className="user-dept">컴퓨터공학과</span>
                      <span className="user-year">4학년</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              rankings.map((rankUser, i) => (
                <div key={rankUser.userId || i} className="ranking-card">
                  <div className="ranking-points">{rankUser.totalPoints || 0}</div>
                  <div className="ranking-user">
                    <span className="user-avatar">👤</span>
                    <div className="user-info">
                      <span className="user-name">{rankUser.displayName || '익명'}</span>
                      <span className="user-dept">{rankUser.department || '학과 미입력'}</span>
                      <span className="user-year">{rankUser.year || ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default DashboardPage;
