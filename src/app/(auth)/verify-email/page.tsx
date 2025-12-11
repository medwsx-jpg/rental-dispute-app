'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // URL이 이메일 링크인지 확인
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setError('유효하지 않은 링크입니다.');
          setStatus('error');
          return;
        }

        // localStorage에서 이메일 가져오기
        let email = window.localStorage.getItem('emailForSignIn');

        // 이메일이 없으면 사용자에게 입력 요청 (다른 기기에서 열었을 경우)
        if (!email) {
          email = window.prompt('확인을 위해 이메일 주소를 입력해주세요');
        }

        if (!email) {
          setError('이메일 주소가 필요합니다.');
          setStatus('error');
          return;
        }

        // 이메일 링크로 로그인
        const result = await signInWithEmailLink(auth, email, window.location.href);
        
        // localStorage에서 이메일 제거
        window.localStorage.removeItem('emailForSignIn');

        // Firestore에 사용자 정보 저장 (새 사용자인 경우)
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (!userDoc.exists()) {
          const emailNickname = email.split('@')[0];
          await setDoc(doc(db, 'users', result.user.uid), {
            email: email,
            nickname: emailNickname,
            createdAt: Date.now(),
            freeRentalsUsed: 0, // 무료 렌탈 사용 횟수
            isPremium: false, // 프리미엄 여부
          });
        }

        setStatus('success');
        
        // 1초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (err: any) {
        console.error('Email verification error:', err);
        
        if (err.code === 'auth/invalid-action-code') {
          setError('링크가 만료되었거나 이미 사용되었습니다.');
        } else if (err.code === 'auth/invalid-email') {
          setError('올바르지 않은 이메일 주소입니다.');
        } else {
          setError('로그인 처리 중 오류가 발생했습니다.');
        }
        
        setStatus('error');
      }
    };

    verifyEmail();
  }, [router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            인증 처리 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인 성공!
          </h2>
          <p className="text-gray-600 mb-4">
            대시보드로 이동합니다...
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인 실패
            </h2>
            <p className="text-red-600">{error}</p>
          </div>

          <button
            onClick={() => router.push('/email-login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            다시 시도하기
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full mt-3 py-3 text-gray-600 hover:text-gray-900 font-medium"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}