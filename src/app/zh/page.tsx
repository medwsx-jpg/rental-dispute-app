'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import LanguageSelector from '@/components/LanguageSelector'; // 🔥 추가
import MobileTabBar from '@/components/MobileTabBar';

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
      title: '房东版',
      subtitle: '当租客说「本来就这样」时',
      videoSrc: '/videos/record365-landlord.mp4',
    },
    {
      id: 'tenant',
      title: '租客版',
      subtitle: '当收到不合理的维修费用时',
      videoSrc: '/videos/record365-tenant.mp4',
    },
    {
      id: 'pension',
      title: '民宿老板版',
      subtitle: '当客人否认设施损坏时',
      videoSrc: '/videos/record365-pension.mp4',
    }
  ];

// 📱 실제 사용 화면 슬라이드
const slides = [
    {
      image: '/images/screenshot-capture.png',
      title: '🚗 汽车损伤拍摄',
      description: '用红圈标记并留下备注'
    },
    {
      image: '/images/screenshot-compare.png',
      title: '🚗 汽车前后对比',
      description: '一目了然地确认差异'
    },
    {
      image: '/images/screenshot-house-capture.png',
      title: '🏠 房产损伤拍摄',
      description: '清楚记录墙纸、地板损坏'
    },
    {
      image: '/images/screenshot-house-compare.png',
      title: '🏠 房产前后对比',
      description: '比较入住前后，预防纠纷'
    }
  ];

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
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
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

  // 🔥 PWA 관련 체크
  useEffect(() => {
    // 모바일 체크
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/;
      setIsMobile(mobileKeywords.test(userAgent));
    };
    checkMobile();

    // iOS 체크
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    };
    checkIOS();

    // PWA(Standalone) 모드 체크
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };
    checkStandalone();

    // Android 설치 프롬프트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 설치 완료 감지
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowAppInstalledModal(true);
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

  // 🔥 핵심: 앱 유도 로직
  const handleAppAction = async (targetPath: string) => {
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

    // 모바일 + 브라우저 접속 → 앱 유도
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
          <p className="mt-4 text-gray-400">加载中...</p>
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
            <div className="hidden md:flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="text-xl md:text-2xl font-bold text-green-600 hover:text-green-700 transition"
              >
                Record365.co.kr
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto justify-around md:justify-end">
  {/* 🔥 언어 선택 추가 */}
  <LanguageSelector />
  
  <button
                onClick={() => router.push('/guide')}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                使用指南
              </button>

{/* 🔥 추가 */}
<button
  onClick={() => router.push('/zh/proxy-service')}
  className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
>
  代理服务
</button>

              <button
                onClick={handleMyRentals}
                className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition"
              >
                我的租赁
              </button>

              <div className="relative board-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBoardMenu(!showBoardMenu);
                  }}
                  className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition flex items-center gap-1"
                >
                  讨论区
                  <span className="text-xs">{showBoardMenu ? '▲' : '▼'}</span>
                </button>

                {showBoardMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => { router.push('/board/chat'); setShowBoardMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      💬 聊天
                    </button>
                    <button
                      onClick={() => { router.push('/board/rentalcases'); setShowBoardMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      🚗 租赁纠纷案例
                    </button>
                    <button
                      onClick={() => { router.push('/board/housecases'); setShowBoardMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition"
                    >
                      🏠 房产纠纷案例
                    </button>
                  </div>
                )}
              </div>

              {!user ? (
                <button
                  onClick={handleLogin}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition"
                >
                  登录
                </button>
              ) : (
                <div className="relative user-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="text-sm sm:text-base text-gray-700 hover:text-green-600 font-medium transition flex items-center gap-1"
                  >
                    我的信息
                    <span className="text-xs">{showUserMenu ? '▲' : '▼'}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">登录账户</p>
                        <p className="text-sm text-gray-900 truncate">{user.email}</p>
                      </div>
                      {userData && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">昵称</p>
                          <p className="text-sm text-gray-900">{userData.nickname}</p>
                        </div>
                      )}
                      <button
                        onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        ✏️ 修改昵称
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        🚪 登出
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
            没有记录， <span className="text-green-400">就无法证明</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
            租车、租房、民宿 — 用记录解决所有租赁纠纷
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
    立即开始 →
  </button>
  
  {/* 공감 문구 */}
  <div className="mt-6">
    <p className="text-2xl sm:text-3xl text-white font-bold mb-2">
    "幸好 <span className="text-green-400">记录了</span> "
    </p>
    <p className="text-gray-400 text-sm">
    解决纠纷后，用户说得最多的话
    </p>
  </div>
</div>
        </div>
      </section>

      {/* 모바일용 실제 사용 화면 (lg 미만에서만 표시) */}
      <section className="py-12 bg-gradient-to-b from-gray-900 to-gray-800 lg:hidden">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-white text-center mb-6">实际使用界面</h2>
          
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
          使用方法
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">📸</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">1. 领取前拍摄</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              领取租赁物品前，用照片仔细记录状态。
              时间和位置会自动保存。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">📤</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">2. 归还后拍摄</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              归还时也用同样方式拍摄。
              比较前后，一目了然看出差异。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl">✍️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">3. 电子签名</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              双方完成电子签名后，即成为具有法律效力的证据。
              发生纠纷时成为强有力的武器。
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
              <p className="text-xs sm:text-sm md:text-base text-gray-600">累计检查次数</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 sm:mb-2">90%</p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">纠纷减少率</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 sm:mb-2">2분</p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">平均检查<br className="sm:hidden" /> 时间</p>
            </div>
          </div>
        </div>
      </section>

      {/* 고객 후기 */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
          用户故事
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🚗</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">金民俊</p>
                  <p className="text-xs sm:text-sm text-gray-600">长期租车</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              "归还时因为一个小划痕差点被收取200万韩元。
              用Record 365证明了领取前的状态，没有支付不合理的费用！"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🏠</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">李瑞妍</p>
                  <p className="text-xs sm:text-sm text-gray-600">月租房客</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              "搬进来时墙纸就有污渍，但房东后来说是我弄的。
              用照片证明后，立刻就承认了。"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🏕️</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">朴俊浩</p>
                  <p className="text-xs sm:text-sm text-gray-600">民宿经营</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              "客人退房后否认设施损坏，但因为有入住前的记录，
              所以能够正当收取维修费。"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">崔智友</p>
                  <p className="text-xs sm:text-sm text-gray-600">二手交易</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              "在萝卜市场直接交易时也在用。交换物品时
              互相拍照并签名，之后就没有联系了。"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
          立即开始
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8">
          免费试用1次，满意后继续使用
          </p>
          <button
            onClick={handleStartNow}
            className="bg-white text-green-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-bold hover:bg-gray-100 transition shadow-xl"
          >
            记录第一次租赁 →
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
        服务条款
      </button>
      <span className="text-gray-600">|</span>
      <button 
        onClick={() => router.push('/privacy')}
        className="text-sm text-gray-400 hover:text-white transition font-bold"
      >
        隐私政策
      </button>
      <span className="text-gray-600">|</span>
      <button 
        onClick={() => router.push('/guide')}
        className="text-sm text-gray-400 hover:text-white transition"
      >
        使用指南
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
              <h3 className="text-xl font-bold text-gray-900">📱 安装应用</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">
            将Record365添加到主屏幕，即可像应用一样使用！
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">点击分享按钮</p>
                  <p className="text-sm text-gray-500">Safari底部的📤按钮</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">选择「添加到主屏幕」</p>
                  <p className="text-sm text-gray-500">滚动查找</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">点击「添加」</p>
                  <p className="text-sm text-gray-500">右上角按钮</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
              <p className="text-sm text-yellow-800">
              💡 <strong>在KakaoTalk中打开了？</strong><br />
              请先选择右上角 ⋮ → 「在Safari中打开」！
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              知道了
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">应用已安装！</h3>
            <p className="text-gray-600 mb-6">
            请从主屏幕启动 <strong>Record365</strong> 应用
            </p>
            <button
              onClick={() => setShowAppInstalledModal(false)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              确认
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">请在应用中使用</h3>
            <p className="text-gray-600 mb-6">
            请从主屏幕找到并启动 <strong>Record365</strong>  应用。<br />
              <span className="text-sm text-gray-500">如果没有应用，请添加到主屏幕！</span>
            </p>
            <button
              onClick={() => setShowUseAppModal(false)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold"
            >
              确认
            </button>
          </div>
        </div>
      )}
<MobileTabBar language="zh" />
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