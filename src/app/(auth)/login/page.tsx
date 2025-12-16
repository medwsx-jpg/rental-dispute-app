'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { 
  signInAnonymously,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  
  // 📱 휴대폰 인증 state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Kakao SDK 초기화 확인
  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init('f2bc10f532d5ea14883a44ce3fe509ea');
            console.log('✅ Kakao SDK v1 initialized');
          } catch (error) {
            console.error('❌ Kakao init error:', error);
          }
        }
        setKakaoReady(true);
        console.log('✅ Kakao Ready:', window.Kakao);
      } else {
        setTimeout(initKakao, 500);
      }
    };

    initKakao();
  }, []);

  const handleKakaoLogin = async () => {
    console.log('🔵 카카오 로그인 버튼 클릭됨');
    setError('');
    setLoading(true);

    try {
      if (!window.Kakao || !kakaoReady) {
        console.log('❌ Kakao SDK 준비 안 됨');
        setError('카카오 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      console.log('✅ Kakao SDK 준비됨, Auth.login 호출');

      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          console.log('✅ 카카오 로그인 성공!', authObj);
          try {
            console.log('🔵 사용자 정보 요청 시작');
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: async (res: any) => {
                console.log('✅ 사용자 정보 받음:', res);
                const kakaoAccount = res.kakao_account;
                const kakaoId = res.id;
                
                const email = kakaoAccount.email || `kakao_${kakaoId}@record365.app`;
                const nickname = kakaoAccount.profile?.nickname || '카카오 사용자';

                console.log('🔵 Firebase 익명 로그인 시작');
                
                const firebaseUser = await signInAnonymously(auth);
                
                console.log('✅ Firebase 익명 로그인 완료:', firebaseUser.user.uid);

                await setDoc(doc(db, 'users', firebaseUser.user.uid), {
                  email: email,
                  nickname: nickname,
                  kakaoId: kakaoId,
                  provider: 'kakao',
                  createdAt: Date.now(),
                  freeRentalsUsed: 0,
                  isPremium: false,
                }, { merge: true });

                console.log('✅ Firestore 저장 완료');

                sessionStorage.setItem('kakao_user', JSON.stringify({
                  userId: firebaseUser.user.uid,
                  kakaoId: kakaoId,
                  email,
                  nickname,
                }));

                console.log('✅ 세션 저장 완료, 대시보드로 이동');
                router.push('/dashboard');
              },
              fail: (error: any) => {
                console.error('❌ 사용자 정보 요청 실패:', error);
                setError('카카오 사용자 정보를 가져오는데 실패했습니다.');
                setLoading(false);
              },
            });
          } catch (err) {
            console.error('❌ 사용자 정보 처리 중 에러:', err);
            setError('카카오 로그인 처리 중 오류가 발생했습니다.');
            setLoading(false);
          }
        },
        fail: (err: any) => {
          console.error('❌ 카카오 로그인 실패:', err);
          setError('카카오 로그인에 실패했습니다.');
          setLoading(false);
        },
      });
    } catch (err: any) {
      console.error('❌ 카카오 로그인 함수 에러:', err);
      setError('카카오 로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  // 📱 휴대폰 인증 함수들
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA 확인됨');
          },
        }
      );
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      setError('올바른 전화번호를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formattedPhone = '+82' + phoneNumber.slice(1);
      
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );
      
      setConfirmationResult(confirmation);
      setIsCodeSent(true);
      alert('인증번호가 발송되었습니다');
    } catch (err: any) {
      console.error('인증번호 발송 오류:', err);
      setError('인증번호 발송 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (confirmationResult) {
        const result = await confirmationResult.confirm(verificationCode);
        
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', result.user.uid), {
            phoneNumber: result.user.phoneNumber,
            provider: 'phone',
            createdAt: Date.now(),
            freeRentalsUsed: 0,
            isPremium: false,
          });
        }
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('인증 오류:', err);
      setError('인증번호가 올바르지 않습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📸 Record 365</h1>
          <p className="mt-2 text-gray-600">렌탈 분쟁, 점검 기록 과정과 사진,영상으로 해결하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-center mb-6">로그인</h2>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleKakaoLogin}
              disabled={loading || !kakaoReady}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-medium hover:bg-[#FDD835] transition disabled:opacity-50"
            >
              <span className="text-xl">💬</span>
              카카오톡으로 계속 진행
            </button>

            <button
              onClick={() => setShowPhoneModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
            >
              <span className="text-xl">📱</span>
              휴대폰 번호로 시작하기
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🚗 렌터카 반납 시 억울한 수리비 청구?</p>
          <p>🏠 월세 퇴거 시 원상복구 분쟁?</p>
          <p className="mt-2 font-medium">사진으로 미리 기록하세요!</p>
        </div>

        {/* 기능 소개 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
            왜 Record 365인가요?
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">사진으로 모든 것을 기록</h4>
                <p className="text-xs text-gray-600">입주 시와 퇴거 시 사진을 찍어 변화를 명확하게 비교하세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">전자 서명으로 분쟁 예방</h4>
                <p className="text-xs text-gray-600">임대인과 임차인 양측 서명으로 법적 효력을 갖춘 증거 확보</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">체크리스트로 빠른 점검</h4>
                <p className="text-xs text-gray-600">미리 준비된 체크리스트로 놓치는 것 없이 완벽하게 점검</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">AI 손상 자동 감지 (출시 예정)</h4>
                <p className="text-xs text-gray-600">사진을 찍으면 AI가 자동으로 손상 부분을 찾아드립니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 휴대폰 번호 입력 모달 */}
      {showPhoneModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5"
          onClick={() => setShowPhoneModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-md w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowPhoneModal(false);
                setIsCodeSent(false);
                setPhoneNumber('');
                setVerificationCode('');
                setError('');
              }}
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">📱</span>
              <h3 className="text-xl font-bold text-gray-800">
                휴대폰 번호로 시작
              </h3>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                {error}
              </div>
            )}

            {!isCodeSent ? (
              <>
                <input
                  type="tel"
                  placeholder="휴대폰 번호 입력 (예: 01012345678)"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPhoneNumber(value);
                  }}
                  maxLength={11}
                  className="w-full p-3.5 border-2 border-gray-300 rounded-lg mb-3 text-base focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || phoneNumber.length < 11}
                  className="w-full py-3.5 bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all"
                >
                  {loading ? '전송 중...' : '인증번호 받기'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 text-center mb-5 leading-relaxed">
                  {phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}로<br />
                  인증번호를 발송했습니다
                </p>
                <input
                  type="text"
                  placeholder="인증번호 6자리"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setVerificationCode(value);
                  }}
                  maxLength={6}
                  className="w-full p-3.5 border-2 border-gray-300 rounded-lg mb-3 text-base focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-3.5 bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all"
                >
                  {loading ? '확인 중...' : '인증 완료'}
                </button>
                <button
                  onClick={() => {
                    setIsCodeSent(false);
                    setVerificationCode('');
                    setError('');
                  }}
                  className="w-full py-3.5 bg-transparent text-blue-500 border-2 border-blue-500 rounded-lg font-bold mt-2 hover:bg-blue-50 transition-all"
                >
                  다시 받기
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}