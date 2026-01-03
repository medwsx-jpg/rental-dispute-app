'use client';

import { useEffect, useState } from 'react';

export default function OpenInBrowserPage() {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const ua = navigator.userAgent;
    const targetUrl = 'https://record365.co.kr';
    
    // iOS 체크
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    
    // 인앱 브라우저 체크
    const isInApp = /KAKAOTALK|INAPP|FBAV|FBAN|Instagram|NAVER|Line\//i.test(ua);
    
    // Android 인앱 브라우저 → Chrome으로 열기 시도
    if (!isIOS && isInApp) {
      // Chrome intent로 외부 브라우저 열기
      const intentUrl = `intent://${targetUrl.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
      
      window.location.href = intentUrl;
      
      // 1초 후에도 안 열리면 (Chrome 없는 경우) 그냥 이동
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
      
      return;
    }
    
    // iOS 인앱 브라우저 → 안내 표시
    if (isIOS && isInApp) {
      setShowIOSGuide(true);
      return;
    }
    
    // 일반 브라우저 → 바로 메인으로 이동
    window.location.href = targetUrl;
    
  }, []);

  // iOS 카운트다운
  useEffect(() => {
    if (showIOSGuide && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showIOSGuide, countdown]);

  // iOS 안내 화면
  if (showIOSGuide) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          {/* 아이콘 */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🌐</span>
          </div>
          
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Safari에서 열어주세요
          </h1>
          
          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            더 나은 경험을 위해<br />
            Safari 브라우저에서 열어주세요!
          </p>
          
          {/* 단계 안내 */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-gray-700">
                우측 상단 <strong>⋮</strong> 또는 <strong>···</strong> 탭
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-gray-700">
                <strong>"Safari에서 열기"</strong> 선택
              </p>
            </div>
          </div>
          
          {/* 이미지 가이드 (화살표로 위치 표시) */}
          <div className="relative bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">👆 여기를 탭하세요!</p>
            <div className="flex justify-end">
              <div className="bg-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600">
                ⋮ 메뉴
              </div>
            </div>
          </div>
          
          {/* 그냥 진행 버튼 */}
          <button
            onClick={() => window.location.href = 'https://record365.co.kr'}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
          >
            그냥 진행하기 {countdown > 0 && `(${countdown})`}
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            Safari에서 열면 앱처럼 설치할 수 있어요!
          </p>
        </div>
      </div>
    );
  }

  // 로딩 화면 (리다이렉트 중)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-6">
      <div className="text-center">
        {/* 로딩 스피너 */}
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        
        {/* 텍스트 */}
        <h1 className="text-xl font-bold text-white mb-2">
          브라우저로 이동 중...
        </h1>
        <p className="text-gray-400 text-sm">
          잠시만 기다려주세요
        </p>
      </div>
    </div>
  );
}