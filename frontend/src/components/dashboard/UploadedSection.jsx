// src/components/dashboard/UploadedSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function UploadedSection() {
  const navigate = useNavigate();

  const uploadedLectures = [
    { id: 1, title: '영상 제목', description: '추출된 음성 파일 영상 내용' },
    { id: 2, title: '영상 제목', description: '추출된 음성 파일 영상 내용' },
    { id: 3, title: '영상 제목', description: '추출된 음성 파일 영상 내용' }
  ];

  const handleViewAll = () => {
    navigate('/uploaded-lectures');
  };

  const handleWatchLecture = (lectureId) => {
    navigate(`/watch-upload/${lectureId}`);
  };

  return (
    <section className="uploaded-section">
      <div className="section-header">
        <h2>업로드된 강의</h2>
        <button className="view-all-button" onClick={handleViewAll}>
          전체보기
        </button>
      </div>

      <div className="uploaded-grid">
        {uploadedLectures.map(lecture => (
          <div key={lecture.id} className="uploaded-card">
            <div className="upload-icon">⏸</div>
            <h3>{lecture.title}</h3>
            <p>{lecture.description}</p>
            <button 
              className="watch-button"
              onClick={() => handleWatchLecture(lecture.id)}
            >
              학습하기 →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default UploadedSection;