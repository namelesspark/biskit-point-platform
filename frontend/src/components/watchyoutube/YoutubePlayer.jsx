// src/components/watchyoutube/YoutubePlayer.jsx
import React, { useEffect, useRef } from 'react';

function YoutubePlayer({ videoId, onReady, onEnd }) {
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    // YouTube IFrame API 로드
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // API 준비
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        events: {
          onReady: (event) => {
            if (onReady) onReady(event.target);
          },
          onStateChange: (event) => {
            // 영상 종료
            if (event.data === window.YT.PlayerState.ENDED && onEnd) {
              onEnd();
            }
          }
        }
      });
    };

  }, [videoId, onReady, onEnd]);

  return (
    <div className="youtube-player-container">
      <div id="youtube-player"></div>
    </div>
  );
}

export default YoutubePlayer;