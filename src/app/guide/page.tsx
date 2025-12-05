'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function GuidePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-gray-900">📖 사용 가이드</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">Record 365에 오신 것을 환영합니다! 🎉</h2>
          <p className="text-blue-100">렌탈 분쟁을 예방하는 가장 쉬운 방법</p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">📝 새 렌탈 등록</h3>
                <p className="text-gray-600 mb-3">
                  차량 또는 주택 렌탈을 시작할 때, "새 렌탈 등록" 버튼을 눌러 정보를 입력하세요.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 렌탈 제목 (예: "2025 제네시스 G80")</li>
                  <li>• 차량/주택 선택</li>
                  <li>• 시작일과 종료일</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Before 촬영</h3>
                <p className="text-gray-600 mb-3">
                  렌탈 시작 전, 차량/주택의 현재 상태를 사진으로 기록하세요.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-blue-900 mb-2">💡 촬영 팁</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 밝은 곳에서 촬영하세요</li>
                    <li>• 기존 흠집이나 손상은 꼭 메모를 남기세요</li>
                    <li>• 사진은 자동으로 압축되어 저장됩니다</li>
                    <li>• GPS 위치와 시간이 자동 기록됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">📤 After 촬영</h3>
                <p className="text-gray-600 mb-3">
                  렌탈 종료 후, 같은 위치에서 동일한 각도로 사진을 촬영하세요.
                </p>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-900 mb-2">⚠️ 중요!</p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Before와 같은 구도로 촬영하세요</li>
                    <li>• 새로운 손상이 있다면 메모를 남기세요</li>
                    <li>• 비슷한 조명에서 촬영하면 비교가 쉽습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">🔍 비교 및 리포트</h3>
                <p className="text-gray-600 mb-3">
                  Before/After 사진을 비교하고 PDF 리포트를 생성하세요.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 좌우 비교 또는 오버레이 비교 선택</li>
                  <li>• 사진을 탭하면 확대하여 자세히 볼 수 있습니다</li>
                  <li>• PDF 다운로드로 증거 자료 보관</li>
                  <li>• 공유 버튼으로 타인에게 전송</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">🌟 추가 기능</h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• <strong>만료일 알림:</strong> 계약 종료 3일 전부터 알림을 받을 수 있습니다</p>
              <p>• <strong>사진 재촬영:</strong> 언제든지 사진을 다시 찍을 수 있습니다</p>
              <p>• <strong>메모 수정:</strong> 촬영 후에도 메모를 추가/수정할 수 있습니다</p>
              <p>• <strong>렌탈 정보 수정:</strong> 제목, 날짜 등을 자유롭게 수정할 수 있습니다</p>
              <p>• <strong>게시판:</strong> 다른 사용자들과 경험을 공유하세요</p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-600 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">준비되셨나요? 🚀</h3>
            <p className="text-blue-100 mb-4">지금 바로 첫 렌탈을 등록하고 안전하게 기록하세요!</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              시작하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}