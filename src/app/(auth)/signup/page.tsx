'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: 'https://rental-dispute-app.vercel.app/complete-signup',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // 이메일을 localStorage에 저장 (나중에 인증 완료할 때 사용)
      window.localStorage.setItem('emailForSignup', email);
      
      setSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError('올바른 이메일 형식이 아닙니다.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('인증 메일 전송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                인증 메일을 확인해주세요!
              </h2>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600">{email}</span>로<br />
                회원가입 인증 링크를 전송했습니다.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">📱 다음 단계:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>이메일함을 확인하세요</li>
                <li>"Record 365 회원가입 인증" 이메일을 찾으세요</li>
                <li>이메일의 링크를 클릭하세요</li>
                <li>닉네임과 비밀번호를 설정하세요</li>
              </ol>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setSent(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                다른 이메일로 다시 보내기
              </button>

              <Link
                href="/login"
                className="block w-full py-3 text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-500 text-center">
              💡 이메일이 보이지 않나요? 스팸함을 확인해주세요!
            </p>
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
          <p className="mt-2 text-gray-600">렌탈 분쟁, 사진으로 해결하세요</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-center mb-6">회원가입</h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 font-medium mb-1">
              🆓 무료로 시작하세요!
            </p>
            <p className="text-xs text-green-700">
              회원가입 후 <strong>1건 무료</strong>로 렌탈 기록을 남길 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSendVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                입력하신 이메일로 인증 링크를 보내드립니다
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '전송 중...' : '인증 메일 받기 📧'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔐 안전한 이메일 인증으로 회원가입</p>
          <p className="mt-1">더 많은 기록이 필요하신가요? 프리미엄으로 업그레이드!</p>
        </div>
      </div>
    </div>
  );
}