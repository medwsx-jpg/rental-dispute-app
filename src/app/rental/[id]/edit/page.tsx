'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Rental, CAR_AREAS, HOUSE_AREAS } from '@/types/rental';

export default function EditRentalPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<'car' | 'house'>('car');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const areas = type === 'car' ? CAR_AREAS : HOUSE_AREAS;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadRental();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, rentalId]);

  const loadRental = async () => {
    try {
      const docRef = doc(db, 'rentals', rentalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Rental;
        setRental(data);
        setType(data.type);
        setTitle(data.title);
        setStartDate(new Date(data.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(data.endDate).toISOString().split('T')[0]);
      } else {
        alert('렌탈을 찾을 수 없습니다.');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('렌탈 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
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

    setSaving(true);

    try {
      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        type,
        title: title.trim(),
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
      });

      alert('렌탈 정보가 수정되었습니다!');
      router.push('/dashboard');
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      '정말 삭제하시겠습니까?\n삭제된 렌탈과 사진은 복구할 수 없습니다.'
    );

    if (!confirmed) return;

    try {
      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        status: 'deleted',
      });

      alert('렌탈이 삭제되었습니다.');
      router.push('/dashboard');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rental) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold text-gray-900">✏️ 렌탈 정보 수정</h1>
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
            <h2 className="font-medium text-gray-900 mb-4">촬영 정보</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Before 사진</p>
                <p className="font-medium">{rental.checkIn.photos.length}장</p>
              </div>
              <div>
                <p className="text-gray-500">After 사진</p>
                <p className="font-medium">{rental.checkOut.photos.length}장</p>
              </div>
              <div>
                <p className="text-gray-500">Before 완료</p>
                <p className="font-medium">
                  {rental.checkIn.completedAt ? '✅ 완료' : '❌ 미완료'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">After 완료</p>
                <p className="font-medium">
                  {rental.checkOut.completedAt ? '✅ 완료' : '❌ 미완료'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              ⚠️ 촬영된 사진은 수정 페이지에서 변경할 수 없습니다. 사진을 다시 촬영하려면 각 촬영 페이지로 이동하세요.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : '✓ 저장하기'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-4 bg-red-600 text-white rounded-lg font-medium text-lg hover:bg-red-700 transition"
            >
              🗑️ 삭제
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}