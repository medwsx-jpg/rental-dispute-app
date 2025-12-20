'use client';

import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold text-gray-900">📋 추가 렌탈</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 무료 사용량 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-2">🎉 무료 1건을 완료하셨습니다!</h2>
          <p className="text-blue-700 text-sm">
            Record 365를 이용해주셔서 감사합니다.
          </p>
        </div>

        {/* 추가 렌탈 필요 시 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">📝 추가 렌탈이 필요하신가요?</h3>
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            현재 무료 1건을 모두 사용하셨습니다.<br />
            추가 렌탈이 필요하시다면 관리자에게 문의해주세요.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 서비스 개선 중</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              더 나은 서비스를 제공하기 위해 노력하고 있습니다.<br />
              여러분의 의견을 들려주세요!
            </p>
          </div>
        </div>

        {/* 관리자 문의 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-3 text-center">💬 관리자에게 문의하기</h3>
          <p className="text-sm text-blue-700 mb-4 text-center leading-relaxed">
            추가 렌탈이 필요하시거나,<br />
            서비스에 대한 제안이 있으시다면 언제든 문의해주세요!
          </p>
          
          <button
            onClick={() => {
              alert('대시보드의 "💬 메시지 보내기" 버튼을 이용해주세요!\n\n관리자가 빠르게 답변드리겠습니다.');
              router.push('/dashboard');
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition shadow-md"
          >
            💬 관리자에게 메시지 보내기
          </button>
        </div>

        {/* 프리미엄 (간단히 언급만) */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <span className="text-4xl mb-3 block">⭐</span>
            <h3 className="text-lg font-bold text-purple-900 mb-2">프리미엄 플랜</h3>
            <p className="text-sm text-purple-700 mb-3">
              무제한 렌탈 등록 • 우선 지원
            </p>
            <div className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
              곧 만나요! 🚀
            </div>
          </div>
        </div>

        {/* 대시보드 버튼 */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-lg hover:bg-gray-50 transition"
        >
          대시보드로 돌아가기
        </button>

        {/* 안내 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">💡 참고사항</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 무료 1건은 회원가입 시 제공됩니다</li>
            <li>• 추가 렌탈이 필요하시면 관리자에게 문의해주세요</li>
            <li>• 무료 데이터는 렌탈 종료일로부터 6일간 보관됩니다</li>
            <li>• 여러분의 피드백이 서비스 개선에 큰 도움이 됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}