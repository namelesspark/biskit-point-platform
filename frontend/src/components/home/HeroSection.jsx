// src/components/HeroSection.jsx
import React from 'react';

function HeroSection() {
  return (
    <section className="hero-section">
      {/* 배경 이미지 */}
      <div className="hero-image-container">
        <img 
          src="/images/kit-pond.png" 
          alt="금dhwl" 
          className="hero-image"
        />
        {/* 중앙 텍스트 */}
        <div className="hero-text-overlay">
          <h2>끌귀 삼업</h2>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;