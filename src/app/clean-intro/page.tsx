'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CleanIntroPage() {
  const router = useRouter();

  const handleStart = () => {
    window.location.href = 'https://record365-clean-6q7o.vercel.app';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <button onClick={() => router.push('/')} className="text-gray-600 mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">슥싹 매칭</h1>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-green-600 to-green-700 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-6 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg">
            <Image src="/clean-icon.png" alt="슥싹 매칭" width={80} height={80} className="object-contain" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            청소, 전문가에게 맡기세요
          </h2>
          <p className="text-green-100 text-base sm:text-lg">
            검증된 청소 전문가를 빠르게 매칭해드립니다
          </p>
        </div>
      </section>

      {/* 이렇게 이용하세요 */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            이렇게 이용하세요
          </h3>

          <div className="space-y-8">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">1. 청소 의뢰 등록</h4>
                <p className="text-gray-600">청소할 공간의 사진과 정보를 등록하세요. 구역별로 촬영하면 더 정확한 견적을 받을 수 있어요.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤝</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">2. 전문가 매칭</h4>
                <p className="text-gray-600">주변의 검증된 청소 전문가가 의뢰를 확인하고 지원합니다. 프로필과 후기를 보고 선택하세요.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">3. 청소 완료 & 리뷰</h4>
                <p className="text-gray-600">청소 완료 후 Before/After 사진으로 결과를 확인하고, 만족하셨다면 리뷰를 남겨주세요.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">4. 정기 청소 신청</h4>
                <p className="text-gray-600">만족스러웠다면 같은 전문가로 정기 청소를 신청할 수 있어요. 매번 새로 찾을 필요 없이 편하게 이용하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 이런 분께 추천 */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-10">
            이런 분께 추천해요
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <span className="text-2xl mb-2 block">🏠</span>
              <h4 className="font-bold text-gray-900 mb-1">이사 전후 청소가 필요한 분</h4>
              <p className="text-sm text-gray-500">입주 청소, 퇴거 청소 전문가를 바로 매칭</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <span className="text-2xl mb-2 block">🏢</span>
              <h4 className="font-bold text-gray-900 mb-1">사무실 정기 청소가 필요한 분</h4>
              <p className="text-sm text-gray-500">주기적으로 깨끗한 업무 환경을 유지하세요</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <span className="text-2xl mb-2 block">⏰</span>
              <h4 className="font-bold text-gray-900 mb-1">시간이 없는 맞벌이 부부</h4>
              <p className="text-sm text-gray-500">바쁜 일상 속 청소는 전문가에게 맡기세요</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <span className="text-2xl mb-2 block">🏪</span>
              <h4 className="font-bold text-gray-900 mb-1">매장·상가 청소가 필요한 분</h4>
              <p className="text-sm text-gray-500">영업 전후 깔끔한 매장 관리</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-green-600">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            지금 바로 시작하세요
          </h3>
          <p className="text-green-100 mb-8">
            가입 없이 바로 청소 의뢰를 등록할 수 있어요
          </p>
          <button
            onClick={handleStart}
            className="bg-white text-green-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-xl"
          >
            슥싹 매칭 시작하기 →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-xs">
            슥싹 매칭은 Record 365에서 운영하는 청소 전문가 매칭 서비스입니다.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            &copy; 2026 DIO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
