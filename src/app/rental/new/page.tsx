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

  const [type, setType] = useState<'car' | 'house'>('car');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const areas = type === 'car' ? CAR_AREAS : HOUSE_AREAS;

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
      const docRef = await addDoc(collection(db, 'rentals'), {
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
      });

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
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('car')}
                className={`p-6 rounded-lg border-2 text-center transition ${
                  type === 'car'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-4xl">🚗</span>
                <p className="mt-2 font-medium">렌터카</p>
              </button>
              <button
                type="button"
                onClick={() => setType('house')}
                className={`p-6 rounded-lg border-2 text-center transition ${
                  type === 'house'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-4xl">🏠</span>
                <p className="mt-2 font-medium">월세</p>
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
                  placeholder={type === 'car' ? '예: 제주도 여행 렌터카' : '예: 강남 원룸 월세'}
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

          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">💡 촬영 팁</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 밝은 곳에서 선명하게 촬영하세요</li>
              <li>• 기존 흠집이나 손상은 꼭 촬영하세요</li>
              <li>• Before/After 비교를 위해 같은 구도로 촬영하세요</li>
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