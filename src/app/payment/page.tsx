'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

declare global {
  interface Window {
    IMP?: {
      init: (userCode: string) => void;
      request_pay: (params: any, callback: (response: any) => void) => void;
    };
  }
}

// 셀프 이용 요금제
const selfPlans = [
  {
    id: 'single',
    name: '1회 이용권',
    price: 9800,
    description: '렌탈 1건 등록',
    features: [
      '렌탈 1건 등록',
      '렌탈 종료후 6개월까지 자료보관',  // 🔥 1개월 → 6개월
      '사진 기록 및 비교',
      '전자 서명',
      'PDF 리포트'
    ],
  },
  {
    id: 'yearly',
    name: '10회 이용권',
    price: 49000,
    period: '년',
    description: '10건 패키지',
    badge: '5회 이상이면 이득!',
    features: [
      '렌탈 10건 등록',  // 🔥 "무기한" → "10건"
      '렌탈 종료후 12개월까지 자료보관',  // 🔥 3개월 → 12개월
      '사진 기록 및 비교',
      '전자 서명',
      'PDF 리포트',
      '우선 고객지원'
    ],
  },
];

// 대행 서비스
const proxyService = {
  id: 'proxy',
  name: '부동산 촬영 대행',
  price: 50000,
  description: '서울/경기 지역',
  features: [
    '전문가 현장 방문',
    '체계적인 체크리스트',
    '즉시 리포트 전송',
    '입주/퇴거 당일 방문',
  ],
};

// 🔥 실제 결제 컴포넌트 (useSearchParams 사용)
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'self' | 'proxy'>('self');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  // URL 파라미터로 탭 선택 (예: /payment?tab=proxy)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'proxy') {
      setActiveTab('proxy');
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handlePayment = () => {
    if (!window.IMP) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    setIsProcessing(true);

    let productName = '';
    let amount = 0;

    if (activeTab === 'self') {
      const plan = selfPlans.find((p) => p.id === selectedPlan)!;
      productName = `Record 365 ${plan.name}`;
      amount = plan.price;
    } else {
      productName = `Record 365 ${proxyService.name}`;
      amount = proxyService.price;
    }

    const merchantUid = `record365_${activeTab}_${Date.now()}`;

    window.IMP.init('imp54810627');

    window.IMP.request_pay(
      {
        pg: 'kcp.AO09C',
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: productName,
        amount: amount,
        buyer_email: user.email || '',
        buyer_name: user.displayName || '사용자',
        buyer_tel: '',
      },
      async (response: any) => {
        setIsProcessing(false);

        if (response.success) {
          console.log('결제 성공:', response);

          if (activeTab === 'proxy') {
            alert('대행 서비스 결제가 완료되었습니다!\n담당자가 곧 연락드리겠습니다.');
          } else {
            alert('결제가 완료되었습니다!');
          }
          router.push('/dashboard');
        } else {
          console.error('결제 실패:', response.error_msg);
          alert(`결제 실패: ${response.error_msg}`);
        }
      }
    );
  };

  const getCurrentPrice = () => {
    if (activeTab === 'self') {
      return selfPlans.find((p) => p.id === selectedPlan)?.price || 0;
    }
    return proxyService.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">요금제 선택</h1>
          <p className="text-gray-600">Record 365의 모든 기능을 이용하세요</p>
        </div>

        {/* 탭 선택 */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setActiveTab('self')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'self'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📱 셀프 이용
            </button>
            <button
              onClick={() => setActiveTab('proxy')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'proxy'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏠 대행 서비스
            </button>
          </div>
        </div>

        {/* 셀프 이용 탭 */}
        {activeTab === 'self' && (
          <div className="space-y-6">
            {/* 비교 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-blue-800 text-sm">
  💡 <strong>5회 이상</strong> 이용하신다면 10회 이용권(49,000원)이 <strong>50% 이상 할인</strong>!
</p>
            </div>

            {/* 요금제 카드 */}
            <div className="grid md:grid-cols-2 gap-6">
              {selfPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-green-600 shadow-lg'
                      : 'border border-gray-200 hover:border-green-300'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-6 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === plan.id
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price.toLocaleString()}원
                    </span>
                    {plan.period && <span className="text-gray-500">/{plan.period}</span>}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 대행 서비스 탭 */}
        {activeTab === 'proxy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🏠</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{proxyService.name}</h3>
                  <p className="text-gray-500">{proxyService.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {proxyService.price.toLocaleString()}원
                </span>
                <span className="text-gray-500">/회</span>
              </div>

              <ul className="space-y-3 mb-6">
                {proxyService.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  📍 <strong>서비스 지역:</strong> 서울, 경기 지역<br />
                  📞 결제 후 담당자가 일정 조율을 위해 연락드립니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 결제 버튼 */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">결제 금액</span>
            <span className="text-2xl font-bold text-gray-900">
              {getCurrentPrice().toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full py-4 rounded-xl text-lg font-bold transition ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isProcessing ? '결제 처리 중...' : '결제하기'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-3">
            ⚠️ 테스트 모드: 실제 결제되지 않습니다
          </p>
        </div>
      </div>
    </div>
  );
}

// 🔥 메인 페이지 컴포넌트 - Suspense로 감싸기
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}