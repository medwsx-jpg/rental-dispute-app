'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

interface UserData {
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
}

// 개별 슬라이드 (4개)
const slides = [
  {
    image: '/images/screenshot-capture.png',
    title: '🚗 자동차 손상 촬영',
    description: '빨간 원으로 체크하고 메모를 남기세요'
  },
  {
    image: '/images/screenshot-compare.png',
    title: '🚗 자동차 Before/After',
    description: '한눈에 차이를 확인하고 증거를 확보하세요'
  },
  {
    image: '/images/screenshot-house-capture.png',
    title: '🏠 부동산 손상 촬영',
    description: '벽지, 바닥 손상을 명확히 기록하세요'
  },
  {
    image: '/images/screenshot-house-compare.png',
    title: '🏠 부동산 Before/After',
    description: '입주 전후를 비교해 분쟁을 예방하세요'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsPWA(isPWAMode);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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

  // 자동 슬라이더 (3초마다, 1장씩 이동)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
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
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleMyRentals = () => {
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

  // 현재 보이는 2개의 슬라이드 인덱스 계산
  const getVisibleSlides = () => {
    const first = currentSlide;
    const second = (currentSlide + 1) % slides.length;
    return [first, second];
  };

  const [firstIndex, secondIndex] = getVisibleSlides();

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
            {!isPWA && (
              <div className="hidden md:flex items-center">
                <button 
                  onClick={() => router.push('/')}
                  className="text-xl md:text-2xl font-bold text-green-600 hover:text-green-700 transition"
                >
                  Record365.co.kr
                </button>
              </div>
            )}

<div className="flex items-center gap-3 sm:gap-6 w-full justify-around">
              <button
                onClick={() => router.push('/guide')}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                사용가이드
              </button>

              <button
                onClick={handleMyRentals}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                내 렌탈
              </button>

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

              {!user && (
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition"
                >
                  로그인
                </button>
              )}

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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              렌탈 분쟁! 손해 배상!<br />
              <span className="inline-block">그때 찍어둔 사진, 지금 어디에 있나요?</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              렌터카 반납 시 억울한 수리비 청구?,<br className="sm:hidden" />
              전월세 퇴거 시 원상복구 분쟁?<br />
              사진 찍어놨는데, 폰 바꾸면서 다 사라진 적 있죠?<br />
              그때 찍어둔 사진,영상 지금 어디에 있나요?
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

      {/* 실제 사용 예시 - 1장씩 슬라이드 캐러셀 */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              실제 사용 화면
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              자동차와 부동산, 모두 간편하게 기록하세요
            </p>
          </div>

          {/* 캐러셀 컨테이너 */}
          <div className="relative overflow-hidden">
            {/* 슬라이드 래퍼 */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 50}%)` }}
            >
              {/* 무한 루프를 위해 슬라이드를 3번 반복 */}
              {[...slides, ...slides, ...slides].map((slide, index) => (
                <div key={index} className="w-1/2 flex-shrink-0 px-4">
                  <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
                    {/* 스마트폰 프레임 */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                      {/* 노치 */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
                      
                      {/* 화면 */}
                      <div className="relative bg-white rounded-[2.5rem] overflow-hidden">
                        <Image 
                          src={slide.image}
                          alt={slide.title}
                          width={300}
                          height={650}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>

                    {/* 설명 텍스트 */}
                    <div className="mt-6 text-center">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {slide.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 좌우 화살표 */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition z-10 ml-2"
              aria-label="이전 슬라이드"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition z-10 mr-2"
              aria-label="다음 슬라이드"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 진행 표시 점 */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-green-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>

          {/* 하단 강조 문구 */}
          <div className="mt-12 sm:mt-16 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm sm:text-base font-medium">
              <span className="text-xl">✓</span>
              <span>사진은 GPS 위치와 시간이 자동으로 기록됩니다</span>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 설명 */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            이렇게 사용하세요
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
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

      {/* 통계 */}
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

      {/* 고객 후기 */}
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

      {/* CTA */}
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