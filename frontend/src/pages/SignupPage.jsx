// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import SimpleHeader from '../components/common/Header/SimpleHeader';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const navigate = useNavigate();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [gender, setGender] = useState('');
  const [major, setMajor] = useState('');
  const [loading, setLoading] = useState(false);

  // 회원가입 버튼 클릭
  const handleSignup = async (e) => {
    e.preventDefault();

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 1. Firebase Authentication에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        displayName: lastName + firstName,
        email: email,
        major: major,
        gender: gender,
        totalScore: 0,
        createdAt: new Date().toISOString()
      });

      console.log('회원가입 성공:', user);
      alert('회원가입이 완료되었습니다!');
      
      // 로그인 페이지로 이동
      navigate('/login');

    } catch (error) {
      console.error('회원가입 실패:', error);
      
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 최소 6자 이상 입력하세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SimpleHeader />
      
      <div className="auth-container">
        <form className="auth-form signup-form" onSubmit={handleSignup}>
          
          <div className="form-row">
            <div className="form-group half">
              <label>성</label>
              <input
                type="text"
                placeholder="김"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group half">
              <label>이름</label>
              <input
                type="text"
                placeholder="민호"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>아이디</label>
            <input
              type="email"
              placeholder="student@kumoh.ac.kr"
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
              placeholder="비밀번호 입력 (최소 6자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>성별</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="남"
                  checked={gender === '남'}
                  onChange={(e) => setGender(e.target.value)}
                  required
                />
                <span>남</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="여"
                  checked={gender === '여'}
                  onChange={(e) => setGender(e.target.value)}
                />
                <span>여</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>학과 선택</label>
            <select
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">선택하세요</option>
              <option value="컴퓨터공학부">컴퓨터공학부</option>
              <option value="전자공학부">전자공학부</option>
              <option value="기계공학과">기계공학과</option>
              <option value="신소재공학부">신소재공학부</option>
              <option value="산업공학부">산업공학부</option>
            </select>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default SignupPage;