// src/pages/AdminUploadPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { storage, db } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { API_ENDPOINTS } from '../config/api';

function AdminUploadPage() {
  const navigate = useNavigate();
  const { user, userId } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [extractingTranscript, setExtractingTranscript] = useState(false);
  const [duration, setDuration] = useState(0);

  const isAdmin = user?.email === 'admin@biskit.com' || user?.email?.endsWith('@kumoh.ac.kr') || user?.email === 'jade.lake8852@gmail.com';

  // 비디오에서 썸네일 자동 추출
  const extractThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        setDuration(Math.floor(video.duration));
        // 5초 또는 영상 길이의 10% 지점으로 이동
        video.currentTime = Math.min(5, video.duration * 0.1);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbFile = new File([blob], `thumb_${file.name}.jpg`, { type: 'image/jpeg' });
            setThumbnailFile(thumbFile);
            setThumbnailPreview(URL.createObjectURL(blob));
          }
          URL.revokeObjectURL(video.src);
          resolve();
        }, 'image/jpeg', 0.8);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드 가능합니다.');
      return;
    }
    setVideoFile(file);
    
    // 썸네일 자동 추출
    setStatus('썸네일 추출 중...');
    await extractThumbnail(file);
    setStatus('썸네일 추출 완료!');
    
    // Whisper로 텍스트 추출
    if (window.confirm('영상에서 자동으로 자막을 추출하시겠습니까?\n(시간이 걸릴 수 있습니다)')) {
      await extractTranscript(file);
    }
  };

  // 수동 썸네일 선택 (자동 추출 덮어쓰기)
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const extractTranscript = async (file) => {
    setExtractingTranscript(true);
    setStatus('Whisper AI로 텍스트 추출 중');
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('user_id', userId);

      const res = await fetch(API_ENDPOINTS.WHISPER_EXTRACT, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success) {
        setTranscript(data.transcript);
        setStatus('텍스트 추출 완료!');
      } else {
        setStatus('텍스트 추출 실패: ' + data.error);
      }
    } catch (e) {
      setStatus('텍스트 추출 실패');
    } finally {
      setExtractingTranscript(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요.'); return; }
    if (!videoFile) { alert('비디오 파일을 선택해주세요.'); return; }
    if (!isAdmin) { alert('관리자 권한이 필요합니다.'); return; }

    setUploading(true);
    setProgress(0);
    setStatus('비디오 업로드 중...');

    try {
      // 1. 비디오 업로드
      const videoRef = ref(storage, `lectures/${Date.now()}_${videoFile.name}`);
      const uploadTask = uploadBytesResumable(videoRef, videoFile);

      const videoUrl = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });

      // 2. 썸네일 업로드
      let thumbnailUrl = '';
      if (thumbnailFile) {
        setStatus('썸네일 업로드 중...');
        const thumbRef = ref(storage, `thumbnails/${Date.now()}_${thumbnailFile.name}`);
        await uploadBytesResumable(thumbRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // 3. Firestore에 강의 정보 저장
      setStatus('강의 정보 저장 중...');

      await addDoc(collection(db, 'lectures'), {
        title: title.trim(),
        description: description.trim(),
        videoUrl,
        thumbnailUrl,
        transcript,
        duration,
        viewCount: 0,
        uploadedBy: userId,
        createdAt: serverTimestamp()
      });

      setStatus('업로드 완료!');
      alert('강의가 성공적으로 업로드되었습니다!');
      navigate('/lectures');
      
    } catch (e) {
      console.error('업로드 실패:', e);
      setStatus('업로드 실패: ' + e.message);
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-upload-page">
        <Header variant="dashboard" />
        <main className="admin-content">
          <div className="error-state">
            <h2>🔒 접근 권한 없음</h2>
            <p>관리자만 강의를 업로드할 수 있습니다.</p>
            <button className="btn btn-primary" onClick={() => navigate('/lectures')}>강의 목록으로</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-upload-page">
      <Header variant="dashboard" />

      <main className="admin-content">
        <div className="admin-header">
          <button className="back-link" onClick={() => navigate('/lectures')}>← 강의 목록</button>
          <h1>📤 강의 업로드</h1>
        </div>

        <div className="upload-form">
          <div className="form-group">
            <label>강의 제목 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="강의 제목을 입력하세요" maxLength={100} />
          </div>

          <div className="form-group">
            <label>강의 설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="강의에 대한 설명을 입력하세요" rows={4} maxLength={1000} />
          </div>

          <div className="form-group">
            <label>비디오 파일 *</label>
            <div className="file-input-wrapper">
              <input type="file" accept="video/*" onChange={handleVideoSelect} id="video-file" />
              <label htmlFor="video-file" className="file-label">
                {videoFile ? `📁 ${videoFile.name}` : '비디오 파일 선택'}
              </label>
            </div>
            {duration > 0 && <span className="file-info">길이: {Math.floor(duration / 60)}분 {duration % 60}초</span>}
          </div>

          <div className="form-group">
            <label>썸네일 이미지 {thumbnailPreview && '(자동 추출됨 - 변경 가능)'}</label>
            {thumbnailPreview && (
              <div className="thumbnail-preview">
                <img src={thumbnailPreview} alt="썸네일 미리보기" />
              </div>
            )}
            <div className="file-input-wrapper">
              <input type="file" accept="image/*" onChange={handleThumbnailSelect} id="thumb-file" />
              <label htmlFor="thumb-file" className="file-label">
                {thumbnailFile ? `🖼️ ${thumbnailFile.name}` : '다른 썸네일 선택 (선택사항)'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>자막 / 스크립트 {extractingTranscript && <span className="extracting">(추출 중...)</span>}</label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="자막이나 스크립트를 입력하세요 (Whisper로 자동 추출 가능)"
              rows={6}
            />
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span>{progress}% - {status}</span>
            </div>
          )}

          {status && !uploading && <p className="status-text">{status}</p>}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/lectures')} disabled={uploading}>취소</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !videoFile || !title.trim()}>
              {uploading ? '업로드 중...' : '강의 업로드'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AdminUploadPage;