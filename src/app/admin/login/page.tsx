'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('등록되지 않은 이메일입니다.');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 틀렸습니다.');
      } else if (err.code === 'auth/invalid-email') {
        setError('올바른 이메일 형식이 아닙니다.');
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const emailNickname = result.user.email?.split('@')[0] || 'Admin';
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          nickname: emailNickname,
          createdAt: Date.now(),
          freeRentalsUsed: 0,
          isPremium: false,
        });
      }

      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      setError('Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('비밀번호 재설정을 위해 이메일을 입력해주세요.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('비밀번호 재설정 이메일 전송에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Record 365</h1>
          <p className="mt-2 text-gray-600">관리자 로그인</p>
          <div className="mt-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              ADMIN ONLY
            </span>
          </div>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-center mb-6">관리자 로그인</h2>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속 진행
            </button>

            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition shadow-md"
            >
              <span className="text-xl">📧</span>
              이메일로 로그인
            </button>
          </div>

          {/* 이메일/비밀번호 폼 (토글) */}
          {showEmailForm && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">이메일/비밀번호 입력</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {resetEmailSent && (
                  <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                    비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '로그인 중...' : '관리자 로그인'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← 일반 로그인으로 돌아가기
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ 관리자 전용</h3>
          <p className="text-sm text-yellow-700">
            이 페이지는 관리자 전용입니다.<br />
            일반 사용자는 <a href="/login" className="underline font-medium">일반 로그인</a>을 이용해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}