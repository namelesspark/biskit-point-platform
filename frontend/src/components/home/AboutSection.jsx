// src/components/AboutSection.jsx
import React from 'react';

function AboutSection() {
  return (
    <section className="about-section">
      <h2>About</h2>
      
      <p className="about-intro">
        BISKIT POINT는 금오공대 학생들을 위한 AI 기반 학습 플랫폼입니다.
      </p>

      <ul className="about-features">
        <li>· YouTube 강의 자막을 AI가 자동 분석</li>
        <li>· 맞춤형 퀴즈로 학습 효과 극대화</li>
        <li>· 실시간 AI 챗봇으로 즉각적인 피드백</li>
        <li>· 랭킹 시스템으로 학습 동기부여</li>
      </ul>
    </section>
  );
}

export default AboutSection;