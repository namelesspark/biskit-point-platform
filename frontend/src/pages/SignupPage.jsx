// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import Header from '../components/common/Header';
import { API_ENDPOINTS } from '../config/api';

// 금오공대 학과 목록
const DEPARTMENTS = [
  '컴퓨터공학과',
  '컴퓨터소프트웨어공학과',
  'AI소프트웨어학과',
  '전자공학부',
  '전기공학과',
  '기계공학과',
  '기계설계공학과',
  '메카트로닉스공학과',
  '산업공학과',
  '신소재공학부',
  '화학공학과',
  '환경공학과',
  '건축학부',
  '토목공학과',
  '경영학과',
  '응용수학과',
  '기타'
];

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    department: '',
    gender: '',
    year: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (!formData.department) {
      setError('학과를 선택해주세요.');
      return;
    }

    if (!formData.gender) {
      setError('성별을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Firebase Auth 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      
      // Firestore에 추가 정보 저장 (백엔드 API 호출)
      try {
        await fetch(API_ENDPOINTS.USER_PROFILE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userCredential.user.uid,
            email: formData.email,
            displayName: formData.name,
            department: formData.department,
            gender: formData.gender,
            year: formData.year
          })
        });
      } catch (profileError) {
        console.error('프로필 저장 실패:', profileError);
        // 프로필 저장 실패해도 회원가입은 완료
      }

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page"
      style={{ 
        backgroundImage: "url('/images/kit-signup-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Header variant="auth" />
      <div className="auth-container">
        <div className="auth-card">
          <h2>회원가입</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSignup}>
            <div className="input-group">
              <label>이름 <span className="required">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="이름을 입력하세요" 
                required 
              />
            </div>

            <div className="input-group">
              <label>이메일 <span className="required">*</span></label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="이메일을 입력하세요" 
                required 
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>학과 <span className="required">*</span></label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange}
                  required
                >
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>학년</label>
                <select 
                  name="year" 
                  value={formData.year} 
                  onChange={handleChange}
                >
                  <option value="">학년 선택</option>
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                  <option value="대학원">대학원</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>성별 <span className="required">*</span></label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="남성" 
                    checked={formData.gender === '남성'}
                    onChange={handleChange}
                  />
                  <span>남성</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="여성"
                    checked={formData.gender === '여성'}
                    onChange={handleChange}
                  />
                  <span>여성</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="기타"
                    checked={formData.gender === '기타'}
                    onChange={handleChange}
                  />
                  <span>기타</span>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>비밀번호 <span className="required">*</span></label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="비밀번호 (6자 이상)" 
                required 
              />
            </div>

            <div className="input-group">
              <label>비밀번호 확인 <span className="required">*</span></label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                placeholder="비밀번호를 다시 입력하세요" 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
          
          <p className="auth-link">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
