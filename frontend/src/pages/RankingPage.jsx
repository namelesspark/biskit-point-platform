// src/pages/RankingPage.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_ENDPOINTS } from '../config/api';

function RankingPage() {
  const { userId } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [userId]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      // 전체 랭킹
      const rankingRes = await fetch(`${API_ENDPOINTS.RANKING_LIST}?limit=50`);
      const rankingData = await rankingRes.json();
      if (rankingData.success) setRankings(rankingData.rankings);

      // 내 랭킹
      if (userId !== 'guest') {
        const myRankRes = await fetch(`${API_ENDPOINTS.RANKING_MY}?user_id=${userId}`);
        const myRankData = await myRankRes.json();
        if (myRankData.success) setMyRank(myRankData.rank);
      }
    } catch (error) {
      console.error('랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="ranking-page">
      <Header variant="dashboard" />

      <main className="ranking-content">
        <h1 className="page-title">🏆 랭킹</h1>

        {myRank && (
          <div className="my-rank-card">
            <h2>내 랭킹</h2>
            <div className="my-rank-info">
              <span className="rank">{getRankEmoji(myRank.rank)}</span>
              <span className="points">{myRank.totalPoints}점</span>
              {!myRank.showInRanking && <span className="hidden-badge">🔒 비공개</span>}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="ranking-table">
            <div className="table-header">
              <span className="col-rank">순위</span>
              <span className="col-name">이름</span>
              <span className="col-points">점수</span>
            </div>
            
            {rankings.length === 0 ? (
              <div className="empty">아직 랭킹 데이터가 없습니다.</div>
            ) : (
              rankings.map((user) => (
                <div key={user.userId} className={`table-row ${user.rank <= 3 ? `top-${user.rank}` : ''}`}>
                  <span className="col-rank">{getRankEmoji(user.rank)}</span>
                  <span className="col-name">{user.displayName}</span>
                  <span className="col-points">{user.totalPoints}점</span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="ranking-notice">
          <p>💡 설정에서 랭킹 표시 여부를 변경할 수 있습니다.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default RankingPage;
