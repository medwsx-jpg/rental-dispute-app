'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'phone' | 'sms' | 'password' | 'complete'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 이메일 찾기
  const [email, setEmail] = useState('');
  const [foundEmail, setFoundEmail] = useState('');
  
  // 이메일 잊음 - 휴대폰으로 찾기
  const [phoneForEmail, setPhoneForEmail] = useState('');

  // SMS 인증
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [userId, setUserId] = useState('');

  // 새 비밀번호
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // Step 1: 이메일 확인
  const handleCheckEmail = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('가입되지 않은 이메일입니다');
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0];
      const userPhoneNumber = userData.data().phoneNumber;

      if (!userPhoneNumber) {
        setError('휴대폰 번호가 등록되지 않은 계정입니다. 관리자에게 문의하세요.');
        setLoading(false);
        return;
      }

      setUserId(userData.id);
      setPhoneNumber(userPhoneNumber);
      setStep('sms');
    } catch (err) {
      console.error('이메일 확인 실패:', err);
      setError('이메일 확인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 이메일 잊음 - 휴대폰으로 찾기
  const handleFindEmailByPhone = async () => {
    if (!phoneForEmail || phoneForEmail.length < 10) {
      setError('올바른 전화번호를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneForEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('해당 전화번호로 가입된 계정이 없습니다');
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0];
      const userEmail = userData.data().email;

      setFoundEmail(userEmail);
      setEmail(userEmail);
      setUserId(userData.id);
      setPhoneNumber(phoneForEmail);
      
      alert(`가입된 이메일: ${userEmail}`);
      setStep('sms');
    } catch (err) {
      console.error('이메일 찾기 실패:', err);
      setError('이메일 찾기에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // SMS 발송
  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, type: 'send' }),
      });

      const result = await response.json();

      if (result.success) {
        setIsCodeSent(true);
        alert('인증번호가 발송되었습니다');
      } else {
        throw new Error(result.error || 'SMS 발송 실패');
      }
    } catch (err: any) {
      setError(err.message || '인증번호 발송 실패');
    } finally {
      setLoading(false);
    }
  };

  // SMS 인증
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: verificationCode, type: 'verify' }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('password');
      } else {
        throw new Error(result.error || '인증번호가 올바르지 않습니다');
      }
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 재설정
  const handleResetPassword = async () => {
    if (!newPassword || !newPasswordConfirm) {
      setError('모든 항목을 입력해주세요');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Custom Token으로 임시 로그인
      const tokenResponse = await fetch('/api/create-custom-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          uid: userId,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('인증 토큰 발급 실패');
      }

      const tokenData = await tokenResponse.json();
      const { customToken } = tokenData;

      // Firebase Auth 로그인
      const { signInWithCustomToken } = await import('firebase/auth');
      await signInWithCustomToken(auth, customToken);

      // 비밀번호 변경
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }

      await updatePassword(currentUser, newPassword);

      setStep('complete');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('비밀번호 재설정 실패:', err);
      setError('비밀번호 재설정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: 이메일 입력 또는 휴대폰으로 찾기
  if (step === 'email' || step === 'phone') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">비밀번호 찾기</h2>
            <p className="text-sm text-gray-600">
              {step === 'email' ? '가입한 이메일을 입력하세요' : '가입한 휴대폰 번호를 입력하세요'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 (아이디) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleCheckEmail}
                disabled={loading || !email}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '확인 중...' : '다음'}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                이메일을 잊으셨나요?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💡 회원가입 시 등록한 휴대폰 번호를 입력하면<br />
                  가입된 이메일을 찾을 수 있습니다
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneForEmail}
                  onChange={(e) => setPhoneForEmail(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="01012345678"
                  maxLength={11}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleFindEmailByPhone}
                disabled={loading || phoneForEmail.length < 10}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '확인 중...' : '이메일 찾기'}
              </button>

              <button
                onClick={() => setStep('email')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                이메일 입력으로 돌아가기
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← 로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: SMS 인증
  if (step === 'sms') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">본인 확인</h2>
            <p className="text-sm text-gray-600">가입 시 등록한 번호로 인증합니다</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {!isCodeSent ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 text-center">
                  {phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')}
                </p>
              </div>

              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '전송 중...' : '인증번호 받기'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}로<br />
                인증번호를 발송했습니다
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인증번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="인증번호 6자리"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '확인 중...' : '인증 완료'}
              </button>

              <button
                onClick={() => {
                  setIsCodeSent(false);
                  setVerificationCode('');
                  setError('');
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                다시 받기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: 새 비밀번호 설정
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">새 비밀번호 설정</h2>
            <p className="text-sm text-gray-600">새로운 비밀번호를 입력하세요</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6자 이상 입력"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">영문, 숫자 포함 6자 이상</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading || !newPassword || newPassword !== newPasswordConfirm}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '처리 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: 완료
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 변경 완료!</h2>
        <p className="text-gray-600 mb-4">새로운 비밀번호로 로그인해주세요</p>
        <p className="text-sm text-gray-500">로그인 페이지로 이동합니다...</p>
      </div>
    </div>
  );
}