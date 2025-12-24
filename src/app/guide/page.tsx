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
      console.log('Guide page - Auth state:', currentUser?.email || 'not logged in');
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleBack = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-gray-900">📖 사용 가이드</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">Record365.co.kr에 오신 것을 환영합니다! 🎉</h2>
          <p className="text-green-100">렌탈 분쟁을 예방하는 가장 쉬운 방법</p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">1</span>
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
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Before 촬영</h3>
                <p className="text-gray-600 mb-3">
                  렌탈 시작 전, 차량/주택의 현재 상태를 사진으로 기록하세요.
                </p>
                <div className="bg-green-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-green-900 mb-2">💡 촬영 팁</p>
                  <ul className="text-sm text-green-700 space-y-1">
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

{/* 홈 화면 추가 가이드 */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">📱 앱처럼 사용하기</h2>
  
  <div className="bg-orange-50 rounded-lg p-4 mb-6">
    <p className="text-sm text-orange-800 leading-relaxed">
      홈 화면에 추가하면 앱처럼 바로 실행할 수 있고,<br />
      알림도 받을 수 있어서 훨씬 편리해요!
    </p>
  </div>

  <div className="space-y-6">
    {/* iOS 가이드 */}
    <div className="border-2 border-green-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🍎</span>
        <h3 className="font-bold text-green-900 text-lg">iPhone (iOS)</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </div>
          <p className="text-gray-700 pt-0.5">
            <strong>Safari</strong> 브라우저로 사이트 열기
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </div>
          <p className="text-gray-700 pt-0.5">
            하단 <strong>공유 버튼 (📤)</strong> 탭
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </div>
          <p className="text-gray-700 pt-0.5">
            <strong>"홈 화면에 추가"</strong> 선택
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            4
          </div>
          <p className="text-gray-700 pt-0.5">
            우측 상단 <strong>"추가"</strong> 탭
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <p className="text-emerald-700 pt-0.5 font-medium">
            홈 화면에 아이콘 생성 완료! 🎉
          </p>
        </div>
      </div>
      
      <div className="mt-4 bg-green-50 rounded-lg p-3">
        <p className="text-xs text-green-700">
          💡 <strong>카카오톡에서 링크를 열었다면?</strong><br />
          우측 상단 <strong>⋮</strong> 메뉴 → <strong>"Safari에서 열기"</strong>를 먼저 선택하세요!
        </p>
      </div>
    </div>

    {/* Android 가이드 */}
    <div className="border-2 border-emerald-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="font-bold text-emerald-900 text-lg">Android</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </div>
          <p className="text-gray-700 pt-0.5">
            <strong>Chrome</strong> 브라우저로 사이트 열기
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </div>
          <p className="text-gray-700 pt-0.5">
            우측 상단 <strong>⋮ 메뉴</strong> 탭
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </div>
          <p className="text-gray-700 pt-0.5">
            <strong>"홈 화면에 추가"</strong> 또는 <strong>"설치"</strong> 선택
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            4
          </div>
          <p className="text-gray-700 pt-0.5">
            <strong>"추가"</strong> 또는 <strong>"설치"</strong> 탭
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <p className="text-emerald-700 pt-0.5 font-medium">
            홈 화면에 아이콘 생성 완료! 🎉
          </p>
        </div>
      </div>
      
      <div className="mt-4 bg-emerald-50 rounded-lg p-3">
        <p className="text-xs text-emerald-700">
          💡 <strong>카카오톡에서 링크를 열었다면?</strong><br />
          우측 상단 <strong>⋮</strong> 메뉴 → <strong>"Chrome에서 열기"</strong>를 먼저 선택하세요!
        </p>
      </div>
    </div>
  </div>

  {/* 추가 팁 */}
  <div className="mt-6 bg-purple-50 rounded-lg p-4">
    <h4 className="font-medium text-purple-900 mb-2">✨ 홈 화면 추가의 장점</h4>
    <ul className="text-sm text-purple-800 space-y-1">
      <li>✅ 앱처럼 전체화면으로 사용 가능</li>
      <li>✅ 홈 화면에서 바로 실행 (카톡 찾을 필요 없음!)</li>
      <li>✅ 알림 기능 사용 가능 (계약 만료일 알림)</li>
      <li>✅ 더 빠른 로딩 속도</li>
    </ul>
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
          <div className="bg-green-600 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">준비되셨나요? 🚀</h3>
            <p className="text-green-100 mb-4">지금 바로 첫 렌탈을 등록하고 안전하게 기록하세요!</p>
            {user ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
              >
                내 렌탈 보기
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
              >
                시작하기
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}