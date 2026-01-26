// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import Header from '../components/common/Header';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
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
    <div className="auth-page">
      <Header variant="main" />
      <div className="auth-container">
        <div className="auth-card">
          <h2>회원가입</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSignup}>
            <div className="input-group">
              <label>이름</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="이름을 입력하세요" required />
            </div>
            <div className="input-group">
              <label>이메일</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="이메일을 입력하세요" required />
            </div>
            <div className="input-group">
              <label>비밀번호</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="비밀번호 (6자 이상)" required />
            </div>
            <div className="input-group">
              <label>비밀번호 확인</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="비밀번호를 다시 입력하세요" required />
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
