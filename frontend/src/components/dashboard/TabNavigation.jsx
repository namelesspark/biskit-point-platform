// src/components/dashboard/TabNavigation.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function TabNavigation() {
  const navigate = useNavigate();

  const tabs = [
    { id: 'youtube', label: 'YouTube로 시작', icon: '⚙️', path: '/watch-youtube' },
    { id: 'upload', label: '영상 업로드로 시작', icon: '⚙️', path: '/watch-upload' },
    { id: 'offline', label: '현장 강의 보조 시작', icon: '⚙️', path: '/offline-assist' }
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className="tab-nav-button"
          onClick={() => handleTabClick(tab.path)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default TabNavigation;