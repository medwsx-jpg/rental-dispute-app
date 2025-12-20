'use client';

import { useState, useEffect } from 'react';

export default function InAppBrowserGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown');

  useEffect(() => {
    // 1. 모바일 감지
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    
    if (!isMobile) {
      // PC면 안내 안 보임
      return;
    }

    // 2. 플랫폼 감지
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    }

    // 3. "다시 보지 않기" 확인
    const dismissed = localStorage.getItem('pwaGuideDismissed');
    if (dismissed === 'true') {
      return;
    }

    // 4. 안내 표시
    setShowGuide(true);
  }, []);

  const handleDismiss = () => {
    setShowGuide(false);
  };

  const handleNeverShowAgain = () => {
    localStorage.setItem('pwaGuideDismissed', 'true');
    setShowGuide(false);
  };

  if (!showGuide) {
    return null;
  }

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* 모달 */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white text-2xl hover:opacity-80"
            >
              ✕
            </button>
            <h2 className="text-white text-xl font-bold pr-8">
              앱처럼 사용하려면 이렇게 해주세요
            </h2>
          </div>

          {/* 내용 */}
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              카카오톡 안에서는 홈 화면 추가가 바로 안 돼요.<br />
              이렇게 설치해 보세요!
            </p>

            {/* 단계별 안내 */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">오른쪽 상단 ⋮ 메뉴 누르기</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">'브라우저로 열기' 선택</p>
                  <p className="text-sm text-gray-500">
                    {platform === 'ios' ? '→ Safari에서 열림' : '→ Chrome에서 열림'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    열린 브라우저에서 '홈 화면에 추가'
                  </p>
                  <p className="text-sm text-gray-500">
                    {platform === 'ios' 
                      ? '공유 버튼(📤) → 홈 화면에 추가' 
                      : '메뉴(⋮) → 홈 화면에 추가'}
                  </p>
                </div>
              </div>
            </div>

            {/* 팁 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>홈 화면에 추가하면</strong><br />
                앱처럼 바로 실행할 수 있고, 알림도 받을 수 있어요!
              </p>
            </div>

            {/* 버튼 */}
            <div className="space-y-2">
              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
              >
                확인했어요
              </button>
              <button
                onClick={handleNeverShowAgain}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition"
              >
                다시 보지 않기 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}