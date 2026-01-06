'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface MobileTabBarProps {
  language?: 'ko' | 'en' | 'zh';
}

export default function MobileTabBar({ language = 'ko' }: MobileTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAllMenu, setShowAllMenu] = useState(false);

  // 언어별 경로 접두사
  const langPrefix = language === 'ko' ? '' : `/${language}`;

  // 언어별 텍스트
  const texts = {
    ko: {
      home: '홈',
      guide: '가이드',
      proxy: '대행서비스',
      rentals: '내렌탈',
      all: '전체'
    },
    en: {
      home: 'Home',
      guide: 'Guide',
      proxy: 'Proxy',
      rentals: 'Rentals',
      all: 'All'
    },
    zh: {
      home: '首页',
      guide: '指南',
      proxy: '代理',
      rentals: '租赁',
      all: '全部'
    }
  };

  const t = texts[language];

  // 현재 경로 확인
  const isActive = (path: string) => {
    if (path === langPrefix || path === '/') {
      return pathname === path || pathname === langPrefix + '/';
    }
    return pathname.startsWith(langPrefix + path);
  };

  // 전체 메뉴 항목
  const allMenuItems = [
    { label: language === 'ko' ? '사용 가이드' : language === 'en' ? 'User Guide' : '使用指南', path: '/guide' },
    { label: language === 'ko' ? '대행서비스' : language === 'en' ? 'Proxy Service' : '代理服务', path: '/proxy-service' },
    { label: language === 'ko' ? '게시판' : language === 'en' ? 'Board' : '公告板', path: '/board' },
    { label: language === 'ko' ? '공지사항' : language === 'en' ? 'Notice' : '通知', path: '/notice' },
    { label: language === 'ko' ? '설정' : language === 'en' ? 'Settings' : '设置', path: '/settings' },
  ];

  return (
    <>
      {/* 하단 탭바 - 모바일 전용 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {/* 홈 */}
          <button
            onClick={() => router.push(langPrefix || '/')}
            className={`flex-1 h-full flex flex-col items-center justify-center transition ${
              isActive(langPrefix || '/') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <span className={`text-sm font-medium ${isActive(langPrefix || '/') ? 'font-bold' : ''}`}>
              {t.home}
            </span>
          </button>

          {/* 가이드 */}
          <button
            onClick={() => router.push(`${langPrefix}/guide`)}
            className={`flex-1 h-full flex flex-col items-center justify-center transition ${
              isActive('/guide') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <span className={`text-sm font-medium ${isActive('/guide') ? 'font-bold' : ''}`}>
              {t.guide}
            </span>
          </button>

          {/* 대행서비스 */}
          <button
            onClick={() => router.push(`${langPrefix}/proxy-service`)}
            className={`flex-1 h-full flex flex-col items-center justify-center transition ${
              isActive('/proxy-service') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <span className={`text-sm font-medium ${isActive('/proxy-service') ? 'font-bold' : ''}`}>
              {t.proxy}
            </span>
          </button>

          {/* 내렌탈 */}
          <button
            onClick={() => {
              const phoneNumber = localStorage.getItem('phoneNumber');
              if (!phoneNumber) {
                alert(language === 'ko' ? '로그인이 필요합니다.' : language === 'en' ? 'Login required.' : '需要登录。');
                router.push(`${langPrefix}/login`);
              } else {
                router.push(`${langPrefix}/my-rentals`);
              }
            }}
            className={`flex-1 h-full flex flex-col items-center justify-center transition ${
              isActive('/my-rentals') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <span className={`text-sm font-medium ${isActive('/my-rentals') ? 'font-bold' : ''}`}>
              {t.rentals}
            </span>
          </button>

          {/* 전체 */}
          <button
            onClick={() => setShowAllMenu(true)}
            className="flex-1 h-full flex flex-col items-center justify-center text-gray-600 transition hover:text-green-600"
          >
            <span className="text-xl mb-0.5">☰</span>
            <span className="text-xs font-medium">{t.all}</span>
          </button>
        </div>
      </div>

      {/* 전체 메뉴 모달 */}
      {showAllMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowAllMenu(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t.all}</h2>
              <button
                onClick={() => setShowAllMenu(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 메뉴 리스트 */}
            <div className="p-4">
              {allMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(langPrefix + item.path);
                    setShowAllMenu(false);
                  }}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg transition flex items-center justify-between"
                >
                  <span className="text-gray-900 font-medium">{item.label}</span>
                  <span className="text-gray-400">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}