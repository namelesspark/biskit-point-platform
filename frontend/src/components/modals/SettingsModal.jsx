// src/components/modals/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';

function SettingsModal({ isOpen, onClose }) {
  const { userId } = useAuth();
  const [settings, setSettings] = useState({
    showInRanking: true,
    notifications: true,
    darkMode: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId !== 'guest') {
      loadSettings();
    }
  }, [isOpen, userId]);

  // ★ 다크모드 초기 로드 (페이지 로드 시)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
      setSettings(prev => ({ ...prev, darkMode: true }));
    }
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}?user_id=${userId}`);
      const data = await res.json();
      if (data.success && data.profile) {
        const loadedSettings = {
          showInRanking: data.profile.showInRanking ?? true,
          notifications: data.profile.settings?.notifications ?? true,
          darkMode: data.profile.settings?.darkMode ?? false
        };
        setSettings(loadedSettings);
        
        // ★ 다크모드 즉시 적용
        if (loadedSettings.darkMode) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('darkMode', 'true');
        }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    // ★ 다크모드 즉시 적용
    if (key === 'darkMode') {
      if (newValue) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 랭킹 표시 설정
      await fetch(API_ENDPOINTS.RANKING_VISIBILITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          show_in_ranking: settings.showInRanking
        })
      });

      // 기타 설정
      await fetch(API_ENDPOINTS.USER_SETTINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          settings: {
            notifications: settings.notifications,
            darkMode: settings.darkMode
          }
        })
      });

      alert('설정이 저장되었습니다.');
      onClose();
    } catch (error) {
      alert('설정 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>⚙️ 설정</h2>

        <div className="settings-list">
          <div className="settings-item">
            <div className="setting-info">
              <h4>🏆 랭킹에 내 점수 표시</h4>
              <p>다른 사용자가 랭킹에서 내 점수를 볼 수 있습니다.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.showInRanking} onChange={() => handleToggle('showInRanking')} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="setting-info">
              <h4>🔔 알림</h4>
              <p>퀴즈 알림 및 학습 리마인더를 받습니다.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.notifications} onChange={() => handleToggle('notifications')} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="setting-info">
              <h4>🌙 다크 모드</h4>
              <p>어두운 테마를 사용합니다.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
