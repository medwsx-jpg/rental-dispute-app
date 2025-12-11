'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { isSignInWithEmailLink, signInWithEmailLink, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function CompleteSignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'form' | 'processing' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyEmailLink = async () => {
      try {
        // URL이 이메일 링크인지 확인
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setError('유효하지 않은 링크입니다.');
          setStatus('error');
          return;
        }

        // localStorage에서 이메일 가져오기
        let userEmail = window.localStorage.getItem('emailForSignup');

        // 이메일이 없으면 사용자에게 입력 요청
        if (!userEmail) {
          userEmail = window.prompt('확인을 위해 이메일 주소를 입력해주세요');
        }

        if (!userEmail) {
          setError('이메일 주소가 필요합니다.');
          setStatus('error');
          return;
        }

        setEmail(userEmail);

        // 이메일 링크로 로그인 (인증)
        await signInWithEmailLink(auth, userEmail, window.location.href);
        
        // localStorage에서 이메일 제거
        window.localStorage.removeItem('emailForSignup');

        // 폼 표시
        setStatus('form');

      } catch (err: any) {
        console.error('Email verification error:', err);
        
        if (err.code === 'auth/invalid-action-code') {
          setError('링크가 만료되었거나 이미 사용되었습니다.');
        } else if (err.code === 'auth/invalid-email') {
          setError('올바르지 않은 이메일 주소입니다.');
        } else {
          setError('인증 처리 중 오류가 발생했습니다.');
        }
        
        setStatus('error');
      }
    };

    verifyEmailLink();
  }, []);

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (nickname.length < 2 || nickname.length > 10) {
      setError('닉네임은 2-10자 사이여야 합니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setStatus('processing');

    try {
      const user = auth.currentUser;

      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        setStatus('form');
        setLoading(false);
        return;
      }

      // 비밀번호 설정
      await updatePassword(user, password);

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        nickname: nickname.trim(),
        createdAt: Date.now(),
        freeRentalsUsed: 0,
        isPremium: false,
      });

      setStatus('success');

      // 1초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err: any) {
      console.error('Signup completion error:', err);
      setError('회원가입 처리 중 오류가 발생했습니다.');
      setStatus('form');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            이메일 인증 확인 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            회원가입 처리 중...
          </h2>
          <p className="text-gray-600">계정을 생성하고 있습니다</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            회원가입 완료!
          </h2>
          <p className="text-gray-600 mb-4">
            환영합니다, {nickname}님!
          </p>
          <p className="text-sm text-gray-500">
            대시보드로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                인증 실패
              </h2>
              <p className="text-red-600">{error}</p>
            </div>

            <button
              onClick={() => router.push('/signup')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📸 Record 365</h1>
          <p className="mt-2 text-gray-600">회원정보를 입력해주세요</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">
              이메일 인증 완료!
            </h2>
            <p className="text-center text-sm text-gray-600">
              {email}
            </p>
          </div>

          <form onSubmit={handleCompleteSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2-10자 입력"
                maxLength={10}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                앱에서 사용될 닉네임 ({nickname.length}/10자)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '처리 중...' : '회원가입 완료 🎉'}
            </button>
          </form>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              🆓 회원가입 완료 시 <strong>무료 1건</strong> 렌탈 기록이 제공됩니다!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}