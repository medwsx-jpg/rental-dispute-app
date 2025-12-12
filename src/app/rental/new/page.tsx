'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { CAR_AREAS, HOUSE_AREAS } from '@/types/rental';

export default function NewRentalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<'car' | 'house' | 'goods'>('car');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 생활용품용 커스텀 촬영 항목
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newAreaInput, setNewAreaInput] = useState('');

  const areas = type === 'car' ? CAR_AREAS : type === 'house' ? HOUSE_AREAS : [];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });

    // 오늘 날짜를 기본값으로
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);

    return () => unsubscribe();
  }, [router]);

  // 촬영 항목 추가
  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) {
      alert('촬영 항목을 입력해주세요.');
      return;
    }
    if (customAreas.includes(trimmed)) {
      alert('이미 추가된 항목입니다.');
      return;
    }
    if (customAreas.length >= 10) {
      alert('최대 10개까지 추가할 수 있습니다.');
      return;
    }
    setCustomAreas([...customAreas, trimmed]);
    setNewAreaInput('');
  };

  // 촬영 항목 삭제
  const handleRemoveArea = (index: number) => {
    setCustomAreas(customAreas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!startDate) {
      alert('계약 시작일을 선택해주세요.');
      return;
    }

    if (!endDate) {
      alert('계약 종료일을 선택해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const rentalData: any = {
        userId: user.uid,
        type,
        title: title.trim(),
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        status: 'pending',
        checkIn: {
          photos: [],
          completedAt: null,
        },
        checkOut: {
          photos: [],
          completedAt: null,
        },
        createdAt: Date.now(),
      };

      // 생활용품일 경우 커스텀 영역 저장
      if (type === 'goods' && customAreas.length > 0) {
        rentalData.customAreas = customAreas;
      }

      const docRef = await addDoc(collection(db, 'rentals'), rentalData);

      router.push(`/rental/${docRef.id}/checkin`);
    } catch (error) {
      console.error('렌탈 생성 실패:', error);
      alert('렌탈 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold text-gray-900">📝 새 렌탈 등록</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-medium text-gray-900 mb-4">렌탈 유형</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setType('car')}
                className={`p-3 sm:p-6 rounded-lg border-2 text-center transition ${
                  type === 'car'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl sm:text-4xl">🚗</span>
                <p className="mt-1 sm:mt-2 font-medium text-xs sm:text-base">렌터카</p>
              </button>
              <button
                type="button"
                onClick={() => setType('house')}
                className={`p-3 sm:p-6 rounded-lg border-2 text-center transition ${
                  type === 'house'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl sm:text-4xl">🏠</span>
                <p className="mt-1 sm:mt-2 font-medium text-xs sm:text-base">월세</p>
              </button>
              <button
                type="button"
                onClick={() => setType('goods')}
                className={`p-3 sm:p-6 rounded-lg border-2 text-center transition ${
                  type === 'goods'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl sm:text-4xl">📦</span>
                <p className="mt-1 sm:mt-2 font-medium text-xs sm:text-base">생활용품</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-medium text-gray-900 mb-4">렌탈 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'car' 
                      ? '예: 제주도 여행 렌터카' 
                      : type === 'house'
                      ? '예: 강남 원룸 월세'
                      : '예: 청소기 대여'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">계약 시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">계약 종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 생활용품 촬영 항목 입력 */}
          {type === 'goods' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-medium text-gray-900 mb-2">촬영 항목 추가 (선택사항)</h2>
              <p className="text-sm text-gray-600 mb-4">
                촬영하고 싶은 부분을 미리 추가해보세요. Before/After 촬영 시 참고할 수 있습니다.
              </p>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddArea();
                    }
                  }}
                  placeholder="예: 전체 외관, 상단 부분, 스크래치 등"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleAddArea}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  + 추가
                </button>
              </div>

              {customAreas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">추가된 항목 ({customAreas.length}/10)</p>
                  <div className="flex flex-wrap gap-2">
                    {customAreas.map((area, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
                      >
                        <span>✓ {area}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(index)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customAreas.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">촬영 항목을 추가하지 않아도 촬영은 가능합니다.</p>
                  <p className="text-xs text-gray-400 mt-1">항목을 추가하면 촬영 시 참고하기 편리해요!</p>
                </div>
              )}
            </div>
          )}

          {/* 차량/부동산 촬영 영역 미리보기 */}
          {areas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-medium text-gray-900 mb-4">촬영 영역 미리보기</h2>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <span
                    key={area.id}
                    className={`px-3 py-2 rounded-full text-sm ${
                      area.required
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {area.icon} {area.name}
                    {area.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">* 필수 촬영 영역</p>
            </div>
          )}

          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">💡 촬영 팁</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 밝은 곳에서 선명하게 촬영하세요</li>
              <li>• 기존 흠집이나 손상은 꼭 촬영하세요</li>
              <li>• Before/After 비교를 위해 같은 구도로 촬영하세요</li>
              {type === 'goods' && (
                <li>• 제품 번호나 시리얼 넘버도 함께 촬영하면 좋아요</li>
              )}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? '생성 중...' : '생성하고 Before 촬영 시작 →'}
          </button>
        </form>
      </main>
    </div>
  );
}