'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface UserData {
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // PWA 모드 감지
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsPWA(isPWAMode);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 Auth state:', currentUser?.email || 'not logged in');
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      
      if (showBoardMenu && !target.closest('.board-menu-container')) {
        setShowBoardMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showBoardMenu]);

  const loadUserData = async (userId: string) => {
    try {
      console.log('📂 Loading user data for:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        console.log('✅ User data loaded:', data.nickname);
        setUserData(data);
      } else {
        console.log('⚠️ User document not found');
      }
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
    }
  };

  const handleMyRentals = () => {
    console.log('🎯 내 렌탈 클릭, user:', user?.email || 'not logged in');
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleStartNow = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setShowUserMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* 로고 - PWA 모드에서는 숨김 */}
            {!isPWA && (
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/')}
                  className="text-xl md:text-2xl font-bold text-green-600 hover:text-green-700 transition"
                >
                  Record365.co.kr
                </button>
              </div>
            )}

            {/* 메뉴 - PWA 모드에서는 전체 너비 */}
            <div className={`flex items-center gap-3 sm:gap-6 ${isPWA ? 'w-full justify-around' : ''}`}>
              {/* 사용가이드 */}
              <button
                onClick={() => router.push('/guide')}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                사용가이드
              </button>

              {/* 내 렌탈 */}
              <button
                onClick={handleMyRentals}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                내 렌탈
              </button>

              {/* 게시판 드롭다운 */}
              <div className="relative board-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBoardMenu(!showBoardMenu);
                  }}
                  className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition flex items-center gap-1"
                >
                  게시판
                  <span className="text-xs">{showBoardMenu ? '▲' : '▼'}</span>
                </button>

                {showBoardMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button
                      onClick={() => {
                        router.push('/board/chat');
                        setShowBoardMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      💬 채팅
                    </button>
                    <button
                      onClick={() => {
                        router.push('/board/rentalcases');
                        setShowBoardMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      🚗 렌탈 분쟁사례
                    </button>
                    <button
                      onClick={() => {
                        router.push('/board/housecases');
                        setShowBoardMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      🏠 부동산 분쟁사례
                    </button>
                  </div>
                )}
              </div>

              {/* 로그인 안된 상태: 로그인 버튼 */}
              {!user && (
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition"
                >
                  로그인
                </button>
              )}

              {/* 로그인 된 상태: 내정보 드롭다운 */}
              {user && (
                <div className="relative user-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition flex items-center gap-1"
                  >
                    내정보
                    <span className="text-xs">{showUserMenu ? '▲' : '▼'}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">로그인 계정</p>
                        <p className="text-sm text-gray-900 truncate">{user.email}</p>
                      </div>
                      {userData && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">닉네임</p>
                          <p className="text-sm text-gray-900">{userData.nickname}</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        ✏️ 닉네임 변경
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        🚪 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - 모바일 최적화 */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              손해배상 분쟁을<br />줄이기 시작하세요
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              렌탈 전후 상태를 명확히 기록하고,<br className="sm:hidden" /> 전자 서명으로 증거를 확보하세요.<br />
              더 이상 억울한 손해배상을 물지 마세요.
            </p>
            <button
              onClick={handleStartNow}
              className="bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-green-700 transition shadow-lg"
            >
              지금 시작하기 →
            </button>
          </div>
        </div>
      </section>

      {/* 기능 설명 - 모바일 최적화 */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            이렇게 사용하세요
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            {/* Before */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">📸</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">1. 받기 전 촬영</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                렌탈 물품을 받기 전, 상태를 사진으로 꼼꼼히 기록하세요. 
                시간과 위치가 자동으로 저장됩니다.
              </p>
            </div>

            {/* After */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">📤</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">2. 반납 후 촬영</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                반납할 때도 같은 방식으로 촬영하세요.
                Before와 After를 비교하면 차이가 한눈에 보입니다.
              </p>
            </div>

            {/* 서명 */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">✍️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">3. 전자 서명</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                양측이 전자 서명을 완료하면 법적 효력이 있는 증거가 됩니다.
                분쟁 발생 시 강력한 무기가 됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 - 모바일 최적화 */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 sm:mb-2">37,000+</p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">누적 점검 건수</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 sm:mb-2">90%</p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">분쟁 감소율</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 sm:mb-2">2분</p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">평균 점검<br className="sm:hidden" /> 소요 시간</p>
            </div>
          </div>
        </div>
      </section>

      {/* 고객 후기 - 모바일 최적화 */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            사용자들의 이야기
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🚗</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">김민준님</p>
                  <p className="text-xs sm:text-sm text-gray-600">장기렌트카 이용</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                "반납할 때 생긴 작은 흠집 때문에 200만원 청구받을 뻔했어요. 
                Record 365로 받기 전 상태를 증명해서 억울한 비용 안 냈습니다!"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🏠</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">이서연님</p>
                  <p className="text-xs sm:text-sm text-gray-600">전월세 세입자</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                "이사 들어갈 때 벽지 얼룩이 있었는데 집주인이 나중에 제 책임이라고 하더라고요. 
                사진으로 증명하니까 바로 인정하시더라고요."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">📦</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">박준호님</p>
                  <p className="text-xs sm:text-sm text-gray-600">물품 대여 사업</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                "고객들과 분쟁이 확 줄었어요. 서로 투명하게 상태를 확인하니까 
                신뢰가 생기더라고요. 재방문율도 올랐습니다!"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">최지우님</p>
                  <p className="text-xs sm:text-sm text-gray-600">중고거래 활용</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                "당근마켓 직거래할 때도 쓰고 있어요. 물건 주고받을 때 
                서로 사진 찍어서 서명하니까 나중에 연락 올 일이 없어요."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - 모바일 최적화 */}
      <section className="py-12 sm:py-16 md:py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8">
            무료로 1건 사용해보고, 마음에 들면 계속 이용하세요
          </p>
          <button
            onClick={handleStartNow}
            className="bg-white text-green-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-bold hover:bg-gray-100 transition shadow-xl"
          >
            첫 렌탈 기록하기 →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p className="mb-2 text-sm sm:text-base">© 2025 Record365.co.kr. All rights reserved.</p>
            <p className="text-xs sm:text-sm">렌탈 분쟁, 이제 기록으로 해결하세요</p>
          </div>
        </div>
      </footer>
    </div>
  );
}