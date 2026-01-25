// src/components/FeatureSection.jsx
import React from 'react';

function FeatureSection() {
  return (
    <section className="feature-section">
      
      {/* 첫 번째 카드 - 왼쪽 텍스트, 오른쪽 이미지 */}
      <div className="feature-card left-text">
        <div className="feature-content">
          <h3>AI로 학습</h3>
          <p>
            YouTube 강의를 보며 AI가 자동으로 생성하는 
            퀴즈를 풀어보세요.
          </p>
          <button className="button-black">Call to action</button>
        </div>
        <div className="feature-image">
          <img src="/images/feature1.jpg" alt="AI 학습" />
        </div>
      </div>

      {/* 두 번째 카드 - 왼쪽 이미지, 오른쪽 텍스트 */}
      <div className="feature-card right-text">
        <div className="feature-image">
          <img src="/images/feature2.jpg" alt="음성 녹음" />
        </div>
        <div className="feature-content">
          <h3>음성 녹음 기능</h3>
          <p>
            오프라인 강의도 녹음해서 
            자막으로 변환할 수 있습니다.
          </p>
          <button className="button-black">Another button</button>
        </div>
      </div>

    </section>
  );
}

export default FeatureSection;