'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🔥 URL 파라미터 읽기
  const preVerifiedPhone = searchParams.get('phone');
  const signId = searchParams.get('signId');
  
  // 🔥 전화번호가 있으면 2단계부터 시작
  const [step, setStep] = useState<'phone' | 'account' | 'nickname' | 'complete'>(
    preVerifiedPhone ? 'account' : 'phone'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 휴대폰 인증
  const [phoneNumber, setPhoneNumber] = useState(preVerifiedPhone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  // 계정 정보
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [userType, setUserType] = useState<'individual' | 'business'>('individual');
  const [businessType, setBusinessType] = useState<'car_rental' | 'real_estate' | 'goods_rental'>('car_rental');
  const [companyName, setCompanyName] = useState('');

  // 닉네임
  const [nickname, setNickname] = useState('');

  // 마케팅 수신 동의
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // SMS 발송
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('올바른 전화번호를 입력해주세요');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
      
      // 🔥 전화번호 중복 체크 추가 (새로운 코드)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        // 기존 회원 발견
        if (signId) {
          // 서명 후 가입인 경우
          alert(
            '이미 가입된 전화번호입니다.\n' +
            '로그인하시면 서명한 렌탈 기록을 확인하실 수 있습니다.'
          );
          router.push(`/login?signId=${signId}`);
          return;
        } else {
          // 일반 회원가입인 경우
          throw new Error('이미 가입된 전화번호입니다');
        }
      }
      
      // 기존 SMS 발송 로직 (그대로 유지)
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
        setStep('account');
      } else {
        throw new Error(result.error || '인증번호가 올바르지 않습니다');
      }
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 계정 생성
  const handleCreateAccount = async () => {
    if (!userId || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요');
      return;
    }

    if (userId.length < 4) {
      setError('아이디는 4자 이상이어야 합니다');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      setError('아이디는 영문, 숫자, 언더바(_)만 사용 가능합니다');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (userType === 'business' && !companyName.trim()) {
      setError('상호명 또는 이름을 입력해주세요');
      return;
    }

    const email = `${userId}@record365.app`;

    try {
      setLoading(true);
      setError('');

      // Firebase Auth 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Firestore에 기본 정보 저장
      const userData: any = {
        email: email,
        userId: userId,
        phoneNumber: phoneNumber,
        provider: 'email',
        createdAt: Date.now(),
        freeRentalsUsed: 0,
        isPremium: false,
        nickname: '',
        userType: userType,
        marketingAgreed: agreeMarketing,
        marketingAgreedAt: agreeMarketing ? Date.now() : null,
      };

      if (userType === 'business') {
        userData.businessInfo = {
          businessType: businessType,
          companyName: companyName.trim(),
        };
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // 🔥 signId가 있으면 렌탈 연결
      if (signId) {
        try {
          const signDoc = await getDoc(doc(db, 'signatures', signId));
          if (signDoc.exists()) {
            const signData = signDoc.data();
            const rentalId = signData.rentalId;
            
            // rentals에 partnerUserId 추가
            await updateDoc(doc(db, 'rentals', rentalId), {
              'checkIn.partnerSignature.userId': userCredential.user.uid
            });
            
            console.log('✅ 렌탈 연결 완료:', rentalId);
          }
        } catch (linkError) {
          console.error('렌탈 연결 실패:', linkError);
          // 에러 무시 (회원가입은 성공)
        }
      }

      setStep('nickname');
    } catch (err: any) {
      console.error('계정 생성 실패:', err);
      if (err.code === 'auth/email-already-in-use') {
        if (signId) {
          // 🔥 서명 후 가입인데 이미 가입된 경우
          setError('이미 가입된 계정입니다. 로그인 페이지로 이동합니다...');
          
          setTimeout(() => {
            router.push(`/login?signId=${signId}`);
          }, 2000);
        } else {
          // 일반 회원가입
          setError('이미 사용 중인 아이디입니다');
        }
      } else {
        setError('계정 생성에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 설정
  const handleSetNickname = async () => {
    if (!nickname || nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const user = auth.currentUser;
      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        nickname: nickname.trim(),
      }, { merge: true });

      setStep('complete');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError('닉네임 설정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: 휴대폰 인증
  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">회원가입</h2>
            <p className="text-sm text-gray-600">Step 1/3: 본인 인증</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              <p>{error}</p>
            </div>
          )}

          {!isCodeSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={loading || phoneNumber.length < 10}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '전송 중...' : '인증번호 받기'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {phoneNumber}로<br />
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

  // Step 2: 계정 정보
  if (step === 'account') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">계정 정보 입력</h2>
            <p className="text-sm text-gray-600">Step 2/3: 아이디 및 비밀번호 설정</p>
            {/* 🔥 서명 후 가입인 경우 안내 */}
            {preVerifiedPhone && signId && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ✅ 전화번호 인증 완료 ({preVerifiedPhone})
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 사용자 타입 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어떻게 사용하시나요? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('individual')}
                  className={`px-4 py-3 rounded-lg border-2 transition ${
                    userType === 'individual'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">🙋‍♂️</div>
                  <div className="font-medium">빌리는</div>
                  <div className="text-xs text-gray-500">차량/집 렌트</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('business')}
                  className={`px-4 py-3 rounded-lg border-2 transition ${
                    userType === 'business'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">🤝</div>
                  <div className="font-medium">빌려주는</div>
                  <div className="text-xs text-gray-500">렌트카/부동산</div>
                </button>
              </div>
            </div>

            {userType === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    무엇을 빌려주시나요? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="car_rental">🚗 차량 (렌트카)</option>
                    <option value="real_estate">🏠 부동산 (전월세)</option>
                    <option value="goods_rental">📦 물품 대여</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상호명 또는 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="예) OO렌트카, 홍길동"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="minsu123 (영문, 숫자, _ 사용)"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                영문, 숫자, 언더바(_)만 사용 가능 (4-20자)
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
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            {/* 마케팅 수신 동의 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm flex-1">
                  <span className="text-gray-700">
                    [선택] 마케팅 정보 수신 동의
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    이벤트, 할인 혜택 등의 마케팅 정보를 SMS/이메일/카카오톡으로 받습니다.
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={loading || !userId || !password || password !== passwordConfirm}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '처리 중...' : '다음'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 닉네임
  if (step === 'nickname') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Record 365</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-1">닉네임 설정</h2>
            <p className="text-sm text-gray-600">Step 3/3: 거의 다 왔어요!</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2-20자 입력"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">게시판에서 사용될 닉네임 ({nickname.length}/20자)</p>
            </div>

            <button
              onClick={handleSetNickname}
              disabled={loading || nickname.length < 2}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '처리 중...' : '완료'}
            </button>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              🆓 회원가입 완료 시 <strong>무료 1건</strong> 렌탈 기록이 제공됩니다!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: 완료
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">회원가입 완료!</h2>
        <p className="text-gray-600 mb-4">환영합니다, {nickname}님!</p>
        {signId && (
          <p className="text-sm text-blue-600 mb-2">✅ 서명한 렌탈 기록이 대시보드에 연결되었습니다</p>
        )}
        <p className="text-sm text-gray-500">대시보드로 이동합니다...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}