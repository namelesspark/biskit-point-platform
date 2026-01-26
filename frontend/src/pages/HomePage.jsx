// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: '📺', title: 'YouTube 학습', desc: 'YouTube 강의를 AI가 분석하고 퀴즈를 생성합니다.', path: '/youtube' },
    { icon: '📁', title: '업로드 강의', desc: '직접 업로드한 강의 영상을 학습합니다.', path: '/upload' },
    { icon: '🎙️', title: '오프라인 보조', desc: '실시간 강의를 녹음하고 텍스트로 변환합니다.', path: '/offline' }
  ];

  return (
    <div className="home-page">
      <Header variant="main" />

      <section className="hero-section">
        <div className="hero-bg">
          <img src="/images/kit-pond.png" alt="KIT Campus" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1>AI 기반 학습 플랫폼</h1>
          <p>BISKIT POINT와 함께 효율적인 학습을 시작하세요</p>
          <button className="btn btn-hero" onClick={() => navigate(user ? '/dashboard' : '/signup')}>
            {user ? '학습 시작하기' : '무료로 시작하기'}
          </button>
        </div>
      </section>

      <section className="features-section">
        <h2>주요 기능</h2>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card" onClick={() => user ? navigate(feature.path) : navigate('/login')}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>왜 BISKIT POINT인가요?</h2>
        <div className="about-grid">
          <div className="about-item">
            <span>🧠</span>
            <h4>AI 퀴즈 생성</h4>
            <p>강의 내용을 분석해 자동으로 퀴즈를 생성합니다.</p>
          </div>
          <div className="about-item">
            <span>💬</span>
            <h4>AI 학습 도우미</h4>
            <p>강의 내용에 대해 궁금한 점을 바로 질문하세요.</p>
          </div>
          <div className="about-item">
            <span>🏆</span>
            <h4>포인트 시스템</h4>
            <p>학습하면서 포인트를 획득하고 랭킹에 도전하세요.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;
