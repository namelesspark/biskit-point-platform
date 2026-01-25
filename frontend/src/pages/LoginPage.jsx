// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import SimpleHeader from '../components/common/Header/SimpleHeader';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // 로그인 버튼 클릭
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Firebase 로그인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('로그인 성공:', userCredential.user);
      
      // 대시보드로 이동
      navigate('/dashboard');
      
    } catch (error) {
      console.error('로그인 실패:', error);
      
      // 에러 메시지 한글로
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '존재하지 않는 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 틀렸습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 찾기
  const handleForgotPassword = () => {
    alert('비밀번호 찾기 기능은 준비중입니다.');
  };

  // 회원가입 페이지로 이동
  const goToSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="auth-page">
      <SimpleHeader />
      
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleLogin}>
          
          <div className="form-group">
            <label>아이디</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>아이디 / 비밀번호 기억하기</span>
            </label>
            
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
            >
              비밀번호 찾기
            </button>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <button
            type="button"
            className="secondary-link"
            onClick={goToSignup}
          >
            회원가입
          </button>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;