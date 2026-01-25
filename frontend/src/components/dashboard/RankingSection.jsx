// src/components/RankingSection.jsx
import React from 'react';

function RankingSection() {
  // 임시 데이터
  const rankings = [
    { id: 1, rank: 1, name: '홍길동', major: '컴퓨터공학부', year: '4학년', points: 10875 },
    { id: 2, rank: 2, name: '동길홍', major: '컴퓨터공학부', year: '4학년', points: 10000 },
    { id: 3, rank: 3, name: '이명', major: '컴퓨터공학과', year: '4학년', points: 8000 },
  ];

  return (
    <section className="ranking-section">
      <div className="section-header">
        <h2 className="section-title">POINT Ranking</h2>
        <button className="view-all-button">전체 보기</button>
      </div>

      <div className="ranking-grid">
        {rankings.map((user) => (
          <div key={user.id} className="ranking-card">
            <div className="rank-badge">
              <span className="rank-icon">🏆</span>
            </div>
            <div className="ranking-points">
              {user.points.toLocaleString()}
            </div>
            <div className="ranking-info">
              <p className="user-name">{user.name}</p>
              <p className="user-details">{user.major}</p>
              <p className="user-details">{user.year}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RankingSection;