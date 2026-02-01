// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-page-new">
      {/* 헤더 */}
      <header className="home-header">
        <div className="header-left">
          <img src="/images/kit-logo.png" alt="금오공과대학교" className="kit-logo" />
        </div>
        <div className="header-center">
          <h1 className="site-title">BISKIT POINT</h1>
        </div>
        <div className="header-right">
          {user ? (
            <button className="btn-header" onClick={() => navigate('/dashboard')}>대시보드</button>
          ) : (
            <>
              <button className="btn-header btn-signup" onClick={() => navigate('/signup')}>회원가입</button>
              <button className="btn-header btn-login" onClick={() => navigate('/login')}>로그인</button>
            </>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="hero-new">
        <div className="hero-bg">
          <img src="/images/kit-library.png" alt="KIT Library" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-text">
          <h2>AI와 함께하는 스마트 학습</h2>
        </div>
      </section>

      {/* About 섹션 */}
      <section className="about-new">
        <div className="about-content">
          <h2>About</h2>
          <p className="about-main">BISKIT POINT는 금오공대 학생들을 위한 AI 기반 학습 플랫폼입니다.</p>
          <ul className="about-list">
            <li>· YouTube 강의 자막을 AI가 자동 분석</li>
            <li>· 맞춤형 퀴즈로 학습 효과 극대화</li>
            <li>· 실시간 AI 챗봇으로 즉각적인 피드백</li>
            <li>· 랭킹 시스템으로 학습 동기부여</li>
          </ul>
        </div>
      </section>

      {/* 기능 섹션 - 하나의 카드로 묶기 */}
      <section className="features-wrapper">
        <div className="features-card">
          {/* AI로 학습 */}
          <div className="feature-row">
            <div className="feature-text">
              <h3>AI로 학습</h3>
              <p>YouTube 영상이나 업로드한 강의를 AI가 분석하여 핵심 내용을 파악하고, 맞춤형 퀴즈를 생성합니다.</p>
              <button className="btn-feature" onClick={() => navigate(user ? '/youtube' : '/login')}>
                학습 시작하기
              </button>
            </div>
            <div className="feature-media">
              <video autoPlay loop muted playsInline>
                <source src="/videos/feature AI.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* 음성 녹음 기능 */}
          <div className="feature-row reverse">
            <div className="feature-media">
              <video autoPlay loop muted playsInline>
                <source src="/videos/STT convolution.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="feature-text">
              <h3>음성 녹음 기능</h3>
              <p>오프라인 강의를 실시간으로 녹음하고, Whisper AI가 텍스트로 변환하여 학습을 도와줍니다.</p>
              <button className="btn-feature" onClick={() => navigate(user ? '/offline' : '/login')}>
                녹음 시작하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-title">DX / AX 프로젝트</div>
          <div className="footer-divider"></div>
          <div className="footer-info">
            <p>© 2025 All Rights Reserved</p>
            <p>금오공과대학교 교수학습혁신센터</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;