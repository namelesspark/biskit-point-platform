// src/components/modals/SettingsModal.jsx
import React, { useState } from 'react';

function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    mic: false,
    camera: false,
    feature13: false,
    feature14: false,
    feature15: false,
    feature16: false,
    feature17: false,
    feature18: false,
    studentVerification: false,
    rankingSystem: false,
    dashboardImageSettings: false,
    pointSystem: false,
    pointChange: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* 제목 */}
        <h2 className="modal-title">설정</h2>

        {/* 설정 항목 리스트 */}
        <div className="settings-list">
          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.mic}
              onChange={() => handleToggle('mic')}
            />
            <label>마이크 설정</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.camera}
              onChange={() => handleToggle('camera')}
            />
            <label>카메라 설정</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature13}
              onChange={() => handleToggle('feature13')}
            />
            <label>Feature Thirteen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature14}
              onChange={() => handleToggle('feature14')}
            />
            <label>Feature Fourteen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature15}
              onChange={() => handleToggle('feature15')}
            />
            <label>Feature Fifteen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature16}
              onChange={() => handleToggle('feature16')}
            />
            <label>Feature Sixteen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature17}
              onChange={() => handleToggle('feature17')}
            />
            <label>Feature Seventeen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.feature18}
              onChange={() => handleToggle('feature18')}
            />
            <label>Feature Eighteen</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.studentVerification}
              onChange={() => handleToggle('studentVerification')}
            />
            <label>학습자 학습 판단 확인 기술</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.rankingSystem}
              onChange={() => handleToggle('rankingSystem')}
            />
            <label>랭킹 시스템 → 개인 정보 조치 필요</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.dashboardImageSettings}
              onChange={() => handleToggle('dashboardImageSettings')}
            />
            <label>대시보드 이미지 교체</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.pointSystem}
              onChange={() => handleToggle('pointSystem')}
            />
            <label>점수 시스템</label>
          </div>

          <div className="settings-item">
            <input 
              type="checkbox" 
              checked={settings.pointChange}
              onChange={() => handleToggle('pointChange')}
            />
            <label>점수 반기 전, 강의 1시간에 10점</label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;