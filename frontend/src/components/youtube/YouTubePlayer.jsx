// src/components/youtube/YouTubePlayer.jsx
import React, { useEffect, useRef } from 'react';

function YouTubePlayer({ videoId, onReady, onStateChange, onEnd, onTimeUpdate }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  
  const initPlayer = () => {
    if (!window.YT || !window.YT.Player) return;
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player('yt-player-container', {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: handleReady,
        onStateChange: handleStateChange
      }
    });
  };

  const handleReady = (event) => {
    console.log('✅ YouTube Player Ready');
    onReady?.(event.target);
  };

  const handleStateChange = (event) => {
    const state = event.data;
    console.log('🎬 Player State:', state);
    onStateChange?.(state);

    // 1 = 재생 중
    if (state === 1) {
      startTimeTracking();
    } else {
      stopTimeTracking();
    }

    // 0 = 종료
    if (state === 0) {
      onEnd?.();
    }
  };

  const startTimeTracking = () => {
    if (intervalRef.current) return;

    console.log('▶️ 시간 추적 시작');
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        console.log('⏱️ Time:', Math.floor(time));
        onTimeUpdate?.(time);
      }
    }, 1000);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      console.log('⏸️ 시간 추적 중지');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="youtube-player-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
      <div 
        id="yt-player-container" 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default YouTubePlayer;