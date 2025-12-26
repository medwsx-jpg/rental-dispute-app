'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  
  // 이메일/비밀번호 로그인
  const [userId, setUserId] = useState('');  // 🔥 email → userId 변경
  const [password, setPassword] = useState('');

  // 🔥 마케팅 동의 모달
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [pendingKakaoUser, setPendingKakaoUser] = useState<any>(null);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

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
      } else {
        setTimeout(initKakao, 500);
      }
    };

    initKakao();
  }, []);

  // 이메일 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔥 아이디를 이메일 형식으로 변환
      const email = `${userId}@record365.app`;
      
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('로그인 실패:', err);
      if (err.code === 'auth/user-not-found') {
        setError('등록되지 않은 아이디입니다');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 틀렸습니다');
      } else if (err.code === 'auth/invalid-email') {
        setError('올바른 아이디 형식이 아닙니다');
      } else if (err.code === 'auth/invalid-credential') {
        setError('아이디 또는 비밀번호가 올바르지 않습니다');
      } else {
        setError('로그인에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 마케팅 동의 완료 후 회원가입 진행
  const handleMarketingConfirm = async () => {
    if (!pendingKakaoUser) return;

    try {
      const { customToken, uid, email, nickname, kakaoId } = pendingKakaoUser;

      // Firebase Auth 로그인
      await signInWithCustomToken(auth, customToken);
      console.log('✅ Firebase Auth 로그인 완료');

      // 🔥 Firestore에 마케팅 동의 포함하여 저장
      await setDoc(doc(db, 'users', uid), {
        email: email,
        nickname: nickname,
        kakaoId: kakaoId,
        provider: 'kakao',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        freeRentalsUsed: 0,
        isPremium: false,
        marketingAgreed: agreeMarketing,  // 🔥 추가
        marketingAgreedAt: agreeMarketing ? Date.now() : null,  // 🔥 추가
      });

      console.log('✅ Firestore 처리 완료');

      sessionStorage.setItem('kakao_user', JSON.stringify({
        userId: uid,
        kakaoId: kakaoId,
        email,
        nickname,
      }));

      setShowMarketingModal(false);
      setPendingKakaoUser(null);
      setAgreeMarketing(false);

      alert('회원가입이 완료되었습니다! 🎉');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ 회원가입 처리 중 에러:', error);
      setError('회원가입 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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

                // 중복 체크
                console.log('🔍 이메일 중복 체크:', email);
                
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', email));
                const snapshot = await getDocs(q);

                let userId: string;
                let isNewUser = false;

                if (!snapshot.empty) {
                  // 기존 사용자
                  const existingUser = snapshot.docs[0];
                  userId = existingUser.id;
                  console.log('✅ 기존 사용자 로그인:', userId);
                  
                  // 마지막 로그인 시간 업데이트
                  await updateDoc(doc(db, 'users', userId), {
                    lastLoginAt: Date.now(),
                  });
                } else {
                  // 신규 사용자
                  console.log('🆕 신규 사용자 회원가입');
                  isNewUser = true;
                }

                // Custom Token 발급
                console.log('🔑 Custom Token 요청...');
                const tokenResponse = await fetch('/api/create-custom-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: email,
                    kakaoId: kakaoId,
                    provider: 'kakao',
                  }),
                });

                if (!tokenResponse.ok) {
                  throw new Error('Custom Token 발급 실패');
                }

                const tokenData = await tokenResponse.json();
                const { customToken, uid } = tokenData;

                console.log('✅ Custom Token 받음:', uid);

                userId = uid;

                // 🔥 신규 사용자인 경우 마케팅 동의 모달 표시
                if (isNewUser) {
                  setPendingKakaoUser({
                    customToken,
                    uid,
                    email,
                    nickname,
                    kakaoId,
                  });
                  setShowMarketingModal(true);
                  setLoading(false);
                } else {
                  // 기존 사용자는 바로 로그인
                  await signInWithCustomToken(auth, customToken);
                  console.log('✅ Firebase Auth 로그인 완료');

                  sessionStorage.setItem('kakao_user', JSON.stringify({
                    userId: userId,
                    kakaoId: kakaoId,
                    email,
                    nickname,
                  }));

                  console.log('✅ 세션 저장 완료, 대시보드로 이동');
                  router.push('/dashboard');
                }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📸 Record 365</h1>
          <p className="mt-2 text-gray-600">렌탈 분쟁! 그때 찍어둔 사진, 지금 어디에 있나요?</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-center mb-6">로그인</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* 이메일/비밀번호 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="minsu123"
                required
                disabled={loading}
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 또는 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading || !kakaoReady}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-medium hover:bg-[#FDD835] transition disabled:opacity-50 mb-6"
          >
            <span className="text-xl">💬</span>
            카카오톡으로 계속 진행
          </button>

          {/* 회원가입 / 비밀번호 찾기 */}
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => router.push('/reset-password')}
              className="text-blue-600 hover:text-blue-700"
            >
              비밀번호 찾기
            </button>
            <button
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🚗 렌터카 반납 시 억울한 수리비 청구?</p>
          <p>🏠 전월세 퇴거 시 원상복구 분쟁?</p>
          <p className="mt-2 font-medium">사진 찍어놨는데, 폰 바꾸면서 다 사라진 적 있죠?</p>
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
                <h4 className="font-bold text-gray-800 text-sm">사진,영상으로 모든 것을 기록</h4>
                <p className="text-xs text-gray-600">입주시와 퇴거시 사진을 찍어 변화를 명확하게 비교하세요</p>
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

      {/* 🔥 마케팅 동의 모달 */}
      {showMarketingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎉 회원가입을 환영합니다!
            </h2>
            
            <p className="text-gray-700 mb-6">
              마지막으로 마케팅 정보 수신에 대한 동의를 부탁드립니다.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm flex-1">
                  <span className="text-gray-700 font-medium">
                    [선택] 마케팅 정보 수신 동의
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    이벤트, 할인 혜택 등의 마케팅 정보를 SMS/이메일/카카오톡으로 받습니다.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    동의하지 않아도 서비스 이용이 가능합니다.
                  </p>
                  <div className="mt-2">
                    <Link href="/privacy-policy" target="_blank" className="text-xs text-blue-600 hover:underline">
                      개인정보처리방침 보기 →
                    </Link>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAgreeMarketing(false);
                  handleMarketingConfirm();
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                동의 안 함
              </button>
              <button
                onClick={() => {
                  setAgreeMarketing(true);
                  handleMarketingConfirm();
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                동의하고 시작
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              나중에 내정보에서 변경할 수 있습니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}