'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import LanguageSelector from '@/components/LanguageSelector'; // 🔥 추가
import MobileTabBar from '@/components/MobileTabBar'; // 🔥 추가

interface UserData {
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
}

// 📹 영상 데이터
const videos = [
  {
    id: 'landlord',
    title: '임대인편',
    subtitle: '세입자가 "원래 이랬어요" 할 때',
    videoSrc: '/videos/record365-landlord.mp4',
  },
  {
    id: 'tenant',
    title: '임차인편',
    subtitle: '억울한 수리비 청구를 받았을 때',
    videoSrc: '/videos/record365-tenant.mp4',
  },
  {
    id: 'pension',
    title: '펜션사장님편',
    subtitle: '손님이 시설 파손을 부인할 때',
    videoSrc: '/videos/record365-pension.mp4',
  }
];

// 📱 실제 사용 화면 슬라이드
const slides = [
  {
    image: '/images/screenshot-capture.png',
    title: '🚗 자동차 손상 촬영',
    description: '빨간 원으로 체크하고 메모를 남기세요'
  },
  {
    image: '/images/screenshot-compare.png',
    title: '🚗 자동차 Before/After',
    description: '한눈에 차이를 확인하세요'
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

// 🔥 인앱 브라우저 감지 함수 (컴포넌트 외부에 정의)
const checkIsInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  
  // 🔥 인앱 브라우저 키워드 (대소문자 구분 없이 체크)
  // 카카오톡: KAKAOTALK, (INAPP)
  // 페이스북: FBAV, FBAN
  // 인스타그램: Instagram
  // 네이버: NAVER
  // 라인: Line
  
  const inAppPatterns = [
    /KAKAOTALK/i,      // 카카오톡 (대소문자 무시)
    /\(INAPP\)/i,      // (INAPP) 표시
    /FBAV/i,           // 페이스북
    /FBAN/i,           // 페이스북
    /FB_IAB/i,         // 페이스북
    /Instagram/i,      // 인스타그램
    /NAVER\(/i,        // 네이버앱
    /NAVER /i,         // 네이버앱
    /NaverApp/i,       // 네이버앱
    /Line\//i,         // 라인
    /Twitter/i,        // 트위터
    /Snapchat/i,       // 스냅챗
    /WeChat/i,         // 위챗
    /MicroMessenger/i, // 위챗
    /DaumApps/i,       // 다음앱
  ];
  
  return inAppPatterns.some(pattern => pattern.test(ua));
};

// 🔥 모바일 체크 함수
const checkIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

// 🔥 iOS 체크 함수
const checkIsIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua);
};

// 🔥 Standalone(PWA) 모드 체크 함수
const checkIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone 
    || document.referrer.includes('android-app://');
};

export default function LandingV2Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  
  // 영상 관련 상태
  const [activeVideo, setActiveVideo] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 슬라이드 관련 상태
  const [currentSlide, setCurrentSlide] = useState(0);

  // 🔥 PWA 관련 상태
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAppInstalledModal, setShowAppInstalledModal] = useState(false);
  const [showUseAppModal, setShowUseAppModal] = useState(false);

  useEffect(() => {
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

  // 🔥 PWA 설치 프롬프트 캡처
  useEffect(() => {
    // Android 설치 프롬프트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 설치 완료 감지
   // 수정 - 1.5초 딜레이 추가
window.addEventListener('appinstalled', () => {
    setDeferredPrompt(null);
    setTimeout(() => {
      setShowAppInstalledModal(true);
    }, 1500);
  });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 슬라이드 자동 전환 (4초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 영상 끝나면 다음 영상으로 자동 전환
  const handleVideoEnded = () => {
    setActiveVideo((prev) => (prev + 1) % videos.length);
  };

  // 영상 변경 시 재생
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [activeVideo]);

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

  // 🔥 핵심: 앱 유도 로직 (함수 내에서 직접 체크)
  const handleAppAction = async (targetPath: string) => {
    // 🔥 함수 실행 시점에 직접 체크 (상태값 의존 X)
    const isMobile = checkIsMobile();
    const isStandalone = checkIsStandalone();
    const isInAppBrowser = checkIsInAppBrowser();
    const isIOS = checkIsIOS();

    // PC인 경우 → 기존 로직
    if (!isMobile) {
      router.push(targetPath);
      return;
    }

    // 모바일 + PWA 앱에서 접속한 경우 → 기존 로직
    if (isStandalone) {
      router.push(targetPath);
      return;
    }

    // 🔥 모바일 + 인앱 브라우저 (카카오톡 등) → 기존 로직으로 이동
    if (isInAppBrowser) {
      router.push(targetPath);
      return;
    }

    // 모바일 + 일반 브라우저 → 앱 유도
    // iOS인 경우 → 설치 가이드 모달
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Android인 경우
    if (deferredPrompt) {
      // 미설치 → 설치 프롬프트 표시
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          // 설치 완료 → 모달은 appinstalled 이벤트에서 처리
          setDeferredPrompt(null);
        } else {
          // 설치 거부 → 그래도 앱 사용 유도
          setShowUseAppModal(true);
        }
      } catch (error) {
        console.error('설치 프롬프트 오류:', error);
        setShowUseAppModal(true);
      }
    } else {
      // 이미 설치됨 (브라우저에서 접속) → 앱 실행 유도
      setShowUseAppModal(true);
    }
  };

  const handleMyRentals = () => {
    handleAppAction(user ? '/dashboard' : '/login');
  };

  const handleStartNow = () => {
    handleAppAction(user ? '/dashboard' : '/login');
  };

  const handleLogin = () => {
    handleAppAction('/login');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setShowUserMenu(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const selectVideo = (index: number) => {
    setActiveVideo(index);
    setIsPaused(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 */}
<nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {/* 모바일 메뉴 */}
    <div className="md:hidden flex items-center justify-between h-14">
      <LanguageSelector />
      <button onClick={() => router.push('/')} className="text-lg font-bold text-green-600">
        Record365
      </button>
      {!user ? (
        <button onClick={handleLogin} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium">
          로그인
        </button>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium">
          내정보
        </button>
      )}
    </div>

    {/* 데스크톱 메뉴 */}
    <div className="hidden md:flex justify-between items-center h-14">
      <button onClick={() => router.push('/')} className="text-xl md:text-2xl font-bold text-green-600">
        Record365.co.kr
      </button>
      <div className="flex items-center gap-3">
        <LanguageSelector />
        <button onClick={() => router.push('/guide')} className="text-sm text-gray-700 hover:text-green-600 font-medium">
          사용가이드
        </button>
        <button onClick={() => router.push('/proxy-service')} className="text-sm text-gray-700 hover:text-green-600 font-medium">
          대행서비스
        </button>
        <button onClick={handleMyRentals} className="text-sm text-gray-700 hover:text-green-600 font-medium">
          내 렌탈
        </button>
        
        <div className="relative board-menu-container">
          <button onClick={(e) => { e.stopPropagation(); setShowBoardMenu(!showBoardMenu); }} className="text-sm text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
            게시판
            <span className="text-xs">{showBoardMenu ? '▲' : '▼'}</span>
          </button>
          {showBoardMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
              <button onClick={() => { router.push('/board/chat'); setShowBoardMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                💬 채팅
              </button>
              <button onClick={() => { router.push('/board/rentalcases'); setShowBoardMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                🚗 렌탈 분쟁사례
              </button>
              <button onClick={() => { router.push('/board/housecases'); setShowBoardMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                🏠 부동산 분쟁사례
              </button>
            </div>
          )}
        </div>

        {!user ? (
          <button onClick={handleLogin} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
            로그인
          </button>
        ) : (
          <div className="relative user-menu-container">
            <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} className="text-sm text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
              내정보
              <span className="text-xs">{showUserMenu ? '▲' : '▼'}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-xs text-gray-500">로그인 계정</p>
                  <p className="text-sm text-gray-900 truncate">{user.email}</p>
                </div>
                {userData && (
                  <div className="px-4 py-2 border-b">
                    <p className="text-xs text-gray-500">닉네임</p>
                    <p className="text-sm text-gray-900">{userData.nickname}</p>
                  </div>
                )}
                <button onClick={() => { router.push('/profile'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  ✏️ 닉네임 변경
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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

      {/* 🎬 직방 스타일 히어로 섹션 - 세로 영상 대응 */}
      <section className="bg-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* 메인 카피 */}
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              기록이 없으면, <span className="text-green-400">억울해도 당합니다</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              렌터카, 전월세, 펜션까지 — 모든 렌탈 분쟁을 기록으로 해결하세요
            </p>
          </div>

          {/* 영상 탭 버튼 */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6 lg:mb-8">
            {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
                className={`relative px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                  activeVideo === index
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {video.title}
              </button>
            ))}
          </div>

          {/* 컨텐츠 영역: 영상 (세로) + 슬라이드 */}
          <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-6 lg:gap-10">
            
            {/* 왼쪽: 세로 영상 플레이어 (9:16) - 스마트폰 프레임 */}
            <div className="relative">
              {/* 스마트폰 프레임 */}
              <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl">
                {/* 노치 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 h-5 sm:h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                
                {/* 화면 */}
                <div className="relative bg-black rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden" style={{ width: '260px', height: '462px' }}>
                  <video
                    ref={videoRef}
                    src={videos[activeVideo].videoSrc}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted={isMuted}
                    playsInline
                    onEnded={handleVideoEnded}
                  />
                  
                  {/* 영상 위 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* 영상 하단 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium mb-1">
                      {videos[activeVideo].subtitle}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Record365 | {videos[activeVideo].title}
                    </p>
                  </div>

                  {/* 컨트롤 버튼 */}
                  <div className="absolute bottom-4 right-3 flex gap-2">
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition"
                      aria-label={isMuted ? '음소거 해제' : '음소거'}
                    >
                      {isMuted ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={togglePause}
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition"
                      aria-label={isPaused ? '재생' : '일시정지'}
                    >
                      {isPaused ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 실제 사용 화면 슬라이드 */}
            <div className="hidden lg:block">
              <div className="relative bg-gradient-to-br from-green-600 to-green-700 rounded-[2.5rem] p-3 shadow-2xl" style={{ width: '280px', height: '500px' }}>
                {/* 노치 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-green-700 rounded-b-2xl z-10"></div>
                
                {/* 내부 컨텐츠 */}
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-[2rem] h-full flex flex-col justify-between p-5 pt-8">
                  {/* 상단 텍스트 */}
                  <div>
                    <h3 className="text-green-100 text-sm font-medium mb-1">실제 사용 화면</h3>
                    <p className="text-white text-xl font-bold leading-tight">
                      사진 한 장이<br />
                      <span className="text-yellow-300">증거</span>가 됩니다
                    </p>
                  </div>

                  {/* 스마트폰 목업 */}
                  <div className="flex justify-center my-3">
                    <div className="relative" style={{ width: '140px' }}>
                      <div className="bg-gray-900 rounded-[1.2rem] p-1 shadow-xl">
                        <div className="bg-white rounded-[1rem] overflow-hidden">
                          <Image 
                            src={slides[currentSlide].image}
                            alt={slides[currentSlide].title}
                            width={140}
                            height={300}
                            className="w-full h-auto transition-opacity duration-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 슬라이드 설명 */}
                  <div className="text-center">
                    <p className="text-white font-medium text-sm mb-1">
                      {slides[currentSlide].title}
                    </p>
                    <p className="text-green-100 text-xs">
                      {slides[currentSlide].description}
                    </p>
                  </div>

                  {/* 슬라이드 인디케이터 */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentSlide 
                            ? 'bg-white w-5' 
                            : 'bg-white/40 w-1.5 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

         {/* CTA 버튼 */}
<div className="text-center mt-8 lg:mt-10">
  <button
    onClick={handleStartNow}
    className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/30"
  >
    지금 시작하기 →
  </button>
  
  {/* 공감 문구 */}
  <div className="mt-6">
    <p className="text-2xl sm:text-3xl text-white font-bold mb-2">
      " 기록해 두길 <span className="text-green-400">잘했다</span> "
    </p>
    <p className="text-gray-400 text-sm">
      분쟁 해결 후, 사용자들이 가장 많이 한 말입니다
    </p>
  </div>
</div>
        </div>
      </section>

      {/* 모바일용 실제 사용 화면 (lg 미만에서만 표시) */}
      <section className="py-12 bg-gradient-to-b from-gray-900 to-gray-800 lg:hidden">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-white text-center mb-6">실제 사용 화면</h2>
          
          <div className="relative mx-auto" style={{ maxWidth: '180px' }}>
            <div className="bg-gray-900 rounded-[1.8rem] p-1.5 shadow-2xl border border-gray-700">
              <div className="bg-white rounded-[1.4rem] overflow-hidden">
                <Image 
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  width={180}
                  height={390}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-white font-medium">{slides[currentSlide].title}</p>
            <p className="text-gray-400 text-sm">{slides[currentSlide].description}</p>
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-green-500 w-6' : 'bg-gray-600 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 기능 설명 */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            이렇게 사용하세요
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
  <div className="text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full hidden sm:flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <span className="text-3xl sm:text-4xl">📸</span>
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">1. 받기 전 촬영</h3>
    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
      렌탈 물품을 받기 전, 상태를 사진으로 꼼꼼히 기록하세요. 
      시간과 위치가 자동으로 저장됩니다.
    </p>
  </div>

  <div className="text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full hidden sm:flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <span className="text-3xl sm:text-4xl">📤</span>
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">2. 반납 후 촬영</h3>
    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
      반납할 때도 같은 방식으로 촬영하세요.
      Before와 After를 비교하면 차이가 한눈에 보입니다.
    </p>
  </div>

  <div className="text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full hidden sm:flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <span className="text-3xl sm:text-4xl">✍️</span>
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">3. 전자 서명</h3>
    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
      양측이 전자 서명을 완료하면 법적 효력이 있는 증거가 됩니다.
      분쟁 발생 시 강력한 무기가 됩니다.
    </p>
  </div>

  <div className="text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full hidden sm:flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <span className="text-3xl sm:text-4xl">🤝</span>
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">4. 대행서비스</h3>
    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
      시간이 없거나 어려우신가요? 
      전문가가 대신 점검하고, 계약만료시 까지 기록/보관 해드립니다.
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
                  <span className="text-xl sm:text-2xl">🏕️</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">박준호님</p>
                  <p className="text-xs sm:text-sm text-gray-600">펜션 운영</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                "손님이 퇴실 후 시설 파손을 부인했는데, 입실 전 기록이 있어서 
                수리비를 정당하게 청구할 수 있었어요."
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
<footer className="bg-gray-900 pt-8 pb-6 sm:pt-12 sm:pb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {/* 상단 링크 */}
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pb-6 border-b border-gray-700">
      <button 
        onClick={() => router.push('/terms')}
        className="text-sm text-gray-400 hover:text-white transition"
      >
        서비스 이용약관
      </button>
      <span className="text-gray-600">|</span>
      <button 
        onClick={() => router.push('/privacy')}
        className="text-sm text-gray-400 hover:text-white transition font-bold"
      >
        개인정보처리방침
      </button>
      <span className="text-gray-600">|</span>
      <button 
        onClick={() => router.push('/guide')}
        className="text-sm text-gray-400 hover:text-white transition"
      >
        사용가이드
      </button>
    </div>

    {/* 사업자 정보 */}
    <div className="pt-6 text-center sm:text-left">
      <p className="text-gray-400 text-sm mb-3">
        <span className="font-semibold text-gray-300">Record365</span>
        <span className="text-gray-600 mx-2">|</span>
        전자계약 및 렌탈 기록 보관 서비스
      </p>
      
      <div className="text-gray-500 text-xs sm:text-sm space-y-1">
        <p>
          <span className="text-gray-400">상호명:</span> 디오
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-400">대표:</span> 오운석
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-400">사업자등록번호:</span> 135-26-72358
        </p>
        <p>
          <span className="text-gray-400">주소:</span> 충청남도 천안시 동남구 풍세면 풍세산단로 290
        </p>
        <p>
  <span className="text-gray-400">담당자 문의:</span> medwsx@gmail.com
  <span className="text-gray-600 mx-2">/</span>
  010-6832-4158
</p>
<p>
  <span className="text-gray-400">상담가능시간:</span> 평일 09:00 ~ 18:00 (그 외 이메일문의)
</p>
<p className="mt-2 text-gray-400">
  본 서비스 Record365는 디오에서 운영하는 전자계약 및 렌탈 기록 보관 서비스입니다.
</p>
      </div>

      {/* 저작권 */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-gray-500 text-xs">
        © 2025 DIO. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</footer>

      {/* 🔥 iOS 설치 가이드 모달 */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">📱 앱 설치하기</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Record365를 홈 화면에 추가하면 앱처럼 사용할 수 있어요!
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">하단 공유 버튼 탭</p>
                  <p className="text-sm text-gray-500">Safari 하단의 📤 버튼</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">"홈 화면에 추가" 선택</p>
                  <p className="text-sm text-gray-500">스크롤해서 찾아보세요</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">"추가" 탭</p>
                  <p className="text-sm text-gray-500">우측 상단 버튼</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
              <p className="text-sm text-yellow-800">
                💡 <strong>카카오톡에서 열었다면?</strong><br />
                우측 상단 ⋮ → "Safari에서 열기"를 먼저 선택하세요!
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              확인했어요
            </button>
          </div>
        </div>
      )}

      {/* 🔥 앱 설치 완료 모달 */}
      {showAppInstalledModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-scale-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">앱이 설치되었습니다!</h3>
            <p className="text-gray-600 mb-6">
              홈 화면에서 <strong>Record365</strong> 앱을 실행해주세요
            </p>
            <button
              onClick={() => setShowAppInstalledModal(false)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 🔥 앱 실행 유도 모달 (이미 설치됨 / 설치 거부) */}
      {showUseAppModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-scale-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">앱에서 실행해주세요</h3>
            <p className="text-gray-600 mb-6">
              홈 화면에서 <strong>Record365</strong> 앱을 찾아 실행해주세요.<br />
              <span className="text-sm text-gray-500">앱이 없다면 홈 화면에 추가해주세요!</span>
            </p>
            <button
              onClick={() => setShowUseAppModal(false)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}

<MobileTabBar language="ko" />

<style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scale-up {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}