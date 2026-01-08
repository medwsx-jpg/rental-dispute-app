'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

export default function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [showBoardSubmenu, setShowBoardSubmenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const language = pathname.startsWith('/en') ? 'en' : pathname.startsWith('/zh') ? 'zh' : 'ko';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const texts = {
    ko: {
      language: '한국어',
      home: '홈',
      proxy: '대행',
      all: '전체',
      guide: '사용가이드',
      notice: '공지사항',
      board: '게시판',
      boardChat: '채팅',
      boardRental: '렌탈 분쟁사례',
      boardHouse: '부동산 분쟁사례',
      myInfo: '내정보',
      loginAccount: '로그인 계정',
      nickname: '닉네임',
      editNickname: '닉네임 변경',
      logout: '로그아웃',
      loginRequired: '로그인이 필요합니다',
      flag: '🇰🇷'
    },
    en: {
      language: 'English',
      home: 'Home',
      proxy: 'Proxy',
      all: 'All',
      guide: 'Guide',
      notice: 'Notice',
      board: 'Board',
      boardChat: 'Chat',
      boardRental: 'Rental Cases',
      boardHouse: 'Property Cases',
      myInfo: 'My Info',
      loginAccount: 'Login Account',
      nickname: 'Nickname',
      editNickname: 'Edit Nickname',
      logout: 'Logout',
      loginRequired: 'Login Required',
      flag: '🇺🇸'
    },
    zh: {
      language: '中文',
      home: '主页',
      proxy: '代理',
      all: '全部',
      guide: '使用指南',
      notice: '公告',
      board: '讨论区',
      boardChat: '聊天',
      boardRental: '租赁案例',
      boardHouse: '房产案例',
      myInfo: '我的信息',
      loginAccount: '登录账号',
      nickname: '昵称',
      editNickname: '修改昵称',
      logout: '登出',
      loginRequired: '需要登录',
      flag: '🇨🇳'
    }
  };

  const t = texts[language];

  const handleNewRental = () => {
    if (!user) {
      alert(t.loginRequired);
      router.push('/login');
      return;
    }
    router.push('/rental/new');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setShowAllMenu(false);
  };

  const handleLanguageChange = (lang: 'ko' | 'en' | 'zh') => {
    const currentPath = pathname;
    let newPath = currentPath;

    if (lang === 'ko') {
      newPath = currentPath.replace(/^\/(en|zh)/, '');
      if (newPath === '') newPath = '/';
    } else if (lang === 'en') {
      if (currentPath.startsWith('/zh')) {
        newPath = currentPath.replace('/zh', '/en');
      } else if (!currentPath.startsWith('/en')) {
        newPath = '/en' + currentPath;
      }
    } else if (lang === 'zh') {
      if (currentPath.startsWith('/en')) {
        newPath = currentPath.replace('/en', '/zh');
      } else if (!currentPath.startsWith('/zh')) {
        newPath = '/zh' + currentPath;
      }
    }

    setShowLanguageMenu(false);
    router.push(newPath);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/en' || pathname === '/zh';
    }
    return pathname.includes(path);
  };

  return (
    <>
      {/* 모바일 탭바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="relative flex items-center justify-around h-16 px-2">
          
          {/* 언어선택 */}
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <span className="text-xl mb-0.5">{t.flag}</span>
            <span className={`text-xs ${showLanguageMenu ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
              {t.language}
            </span>
          </button>

          {/* 홈 */}
          <button
            onClick={() => router.push(language === 'ko' ? '/' : `/${language}`)}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <span className={`text-sm ${isActive('/') && !pathname.includes('dashboard') && !pathname.includes('rental') ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
              {t.home}
            </span>
          </button>

          {/* 중앙 플로팅 + 버튼 */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={handleNewRental}
              className="absolute -top-6 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform"
            >
              <span className="text-white text-2xl font-bold">+</span>
            </button>
          </div>

          {/* 대행서비스 */}
          <button
            onClick={() => router.push(language === 'ko' ? '/proxy-service' : `/${language}/proxy-service`)}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <span className={`text-sm ${isActive('/proxy-service') ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
              {t.proxy}
            </span>
          </button>

          {/* 전체 */}
          <button
            onClick={() => setShowAllMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <span className="text-xl mb-0.5 text-gray-600">☰</span>
            <span className="text-xs text-gray-600">{t.all}</span>
          </button>
        </div>
      </div>

      {/* 언어 선택 드롭다운 */}
      {showLanguageMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowLanguageMenu(false)}
          />
          <div className="fixed bottom-20 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <button
              onClick={() => handleLanguageChange('ko')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition"
            >
              <span className="text-xl">🇰🇷</span>
              <span className="text-sm text-gray-700">한국어</span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition border-t border-gray-100"
            >
              <span className="text-xl">🇺🇸</span>
              <span className="text-sm text-gray-700">English</span>
            </button>
            <button
              onClick={() => handleLanguageChange('zh')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition border-t border-gray-100"
            >
              <span className="text-xl">🇨🇳</span>
              <span className="text-sm text-gray-700">中文</span>
            </button>
          </div>
        </>
      )}

      {/* 전체 메뉴 모달 */}
      {showAllMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowAllMenu(false);
              setShowBoardSubmenu(false);
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{t.all}</h3>
                <button
                  onClick={() => {
                    setShowAllMenu(false);
                    setShowBoardSubmenu(false);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {/* 사용가이드 */}
                <button
                  onClick={() => {
                    router.push(language === 'ko' ? '/guide' : `/${language}/guide`);
                    setShowAllMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-gray-700">📖 {t.guide}</span>
                </button>

                {/* 공지사항 */}
                <button
                  onClick={() => {
                    router.push(language === 'ko' ? '/notice' : `/${language}/notice`);
                    setShowAllMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-gray-700">📢 {t.notice}</span>
                </button>

                {/* 게시판 */}
                <div>
                  <button
                    onClick={() => setShowBoardSubmenu(!showBoardSubmenu)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-between"
                  >
                    <span className="text-gray-700">💬 {t.board}</span>
                    <span className="text-xs text-gray-500">{showBoardSubmenu ? '▲' : '▼'}</span>
                  </button>
                  
                  {showBoardSubmenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      <button
                        onClick={() => {
                          router.push('/board/chat');
                          setShowAllMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-600"
                      >
                        💬 {t.boardChat}
                      </button>
                      <button
                        onClick={() => {
                          router.push('/board/rentalcases');
                          setShowAllMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-600"
                      >
                        🚗 {t.boardRental}
                      </button>
                      <button
                        onClick={() => {
                          router.push('/board/housecases');
                          setShowAllMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-600"
                      >
                        🏠 {t.boardHouse}
                      </button>
                    </div>
                  )}
                </div>

                {/* 내정보 */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  {!user ? (
                    <button
                      onClick={() => {
                        router.push('/login');
                        setShowAllMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <span className="text-gray-700">👤 {t.myInfo}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{t.loginAccount}</p>
                        <p className="text-sm text-gray-900 truncate">{user.email}</p>
                      </div>
                      
                      {userData && (
                        <div className="px-4 py-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t.nickname}</p>
                          <p className="text-sm text-gray-900">{userData.nickname}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowAllMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition text-gray-700"
                      >
                        ✏️ {t.editNickname}
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition text-red-600"
                      >
                        🚪 {t.logout}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}