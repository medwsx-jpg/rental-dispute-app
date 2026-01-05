'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 언어 확인
  const getCurrentLanguage = () => {
    if (pathname.startsWith('/en')) return { code: 'en', name: 'English', flag: '🇺🇸' };
    if (pathname.startsWith('/zh')) return { code: 'zh', name: '中文', flag: '🇨🇳' };
    return { code: 'ko', name: '한국어', flag: '🇰🇷' };
  };

  const currentLang = getCurrentLanguage();

  // 언어 목록
  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷', path: '/' },
    { code: 'en', name: 'English', flag: '🇺🇸', path: '/en' },
    { code: 'zh', name: '中文', flag: '🇨🇳', path: '/zh' },
  ];

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm sm:text-base"
      >
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.path)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition flex items-center gap-2 ${
                currentLang.code === lang.code ? 'bg-green-50 text-green-600' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang.code === lang.code && (
                <span className="ml-auto text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}