'use client';

import { useRouter } from 'next/navigation';
import { DEFAULT_CHECKLISTS } from '@/types/rental';

export default function ProxyServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')} 
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-gray-900"> 부동산 촬영 대행</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 서비스 소개 */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              입주/퇴거 시 전문가가 대신<br />
              <span className="text-green-600">촬영,계약 만료시 까지 보관</span>해드립니다
            </h2>
          </div>
          
          <div className="bg-white rounded-lg p-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="text-center p-3">
      <span className="text-3xl block mb-2">✅</span>
      <p className="font-medium text-gray-900 mb-1">전문가 현장 방문</p>
      <p className="text-sm text-gray-600">입주/퇴거 당일 현장 방문</p>
    </div>
    
    <div className="text-center p-3">
      <span className="text-3xl block mb-2">📋</span>
      <p className="font-medium text-gray-900 mb-1">체계적인 체크리스트</p>
      <p className="text-sm text-gray-600">벽지, 바닥, 설비까지 꼼꼼히 확인</p>
    </div>
    
    <div className="text-center p-3">
      <span className="text-3xl block mb-2">📱</span>
      <p className="font-medium text-gray-900 mb-1">즉시 리포트 전송</p>
      <p className="text-sm text-gray-600">촬영 완료 후 바로 카카오톡으로 전송</p>
    </div>

    <div className="text-center p-3">
      <span className="text-3xl block mb-2">💰</span>
      <p className="font-medium text-gray-900 mb-1">합리적인 가격</p>
      <p className="text-sm text-gray-600">1회 50,000원 (서울/경기 기준)</p>
    </div>
  </div>
</div>
        </div>

        {/* 체크리스트 미리보기 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
  ✅ 부동산 촬영 체크리스트
</h3>
<p className="text-sm text-gray-600 mb-4 text-center">
  전문가가 아래 항목들을 꼼꼼히 확인하고 촬영합니다
</p>

          <div className="space-y-4">
            {Object.entries(DEFAULT_CHECKLISTS.house).map(([areaId, items]) => {
              const areaNames: Record<string, string> = {
                living: '🛋️ 거실',
                kitchen: '🍳 주방',
                bathroom: '🚿 욕실',
                bedroom: '🛏️ 침실',
                entrance: '🚪 현관',
                window: '🪟 창문/벽',
                balcony: '🌿 베란다',
              };

              return (
                <div key={areaId} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{areaNames[areaId]}</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이용 안내 */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📢 이용 안내</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">1.</span>
              <p><strong>예약:</strong> 신청 후 24시간 이내 담당자 배정</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">2.</span>
              <p><strong>촬영:</strong> 약속 시간에 현장 방문 후 30-40분 소요</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">3.</span>
              <p><strong>전송:</strong> 촬영 완료 즉시 카카오톡으로 리포트 전송</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">4.</span>
              <p><strong>결제:</strong> 촬영 완료 후 카카오페이/계좌이체</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>현재 서비스 지역:</strong> 서울/경기 일부, 기타 지역은 별도 문의 바랍니다.<br />
              
            </p>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💡 이런 분들께 추천드려요</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">👨‍💼</span>
              <div>
                <p className="font-medium text-gray-900">바쁜 직장인</p>
                <p className="text-sm text-gray-600">입주/퇴거 시간에 참석하기 어려운 분</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <p className="font-medium text-gray-900">부동산 임대업자</p>
                <p className="text-sm text-gray-600">여러 매물의 체계적인 관리가 필요한 분</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📝</span>
              <div>
                <p className="font-medium text-gray-900">분쟁 예방 희망</p>
                <p className="text-sm text-gray-600">전문가의 객관적인 기록으로 안심하고 싶은 분</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="sticky bottom-4">
        <button
  onClick={() => window.open('http://pf.kakao.com/_ezNQn/chat', '_blank')}
  className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition shadow-lg"
>
  💬 카카오톡으로 문의하기
</button>
          
          <p className="text-center text-xs text-gray-500 mt-2">
            또는 전화 문의: 010-6832-4158
          </p>
        </div>

      </main>
    </div>
  );
}