// src/components/watchupload/VideoPlayer.jsx
import React from 'react';

function VideoPlayer({ videoUrl }) {
  return (
    <div className="upload-video-player-container">
      {videoUrl ? (
        <video
          width="100%"
          height="100%"
          controls
          src={videoUrl}
        >
          브라우저가 video 태그를 지원하지 않습니다.
        </video>
      ) : (
        <div className="video-placeholder">
          <div className="upload-icon">⏸</div>
          <p>업로드된 영상을 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;