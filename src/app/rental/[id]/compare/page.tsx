'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Rental, CAR_AREAS, HOUSE_AREAS } from '@/types/rental';
import { useReactToPrint } from 'react-to-print';
import { PrintableReport } from '@/components/PrintableReport';

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'side' | 'overlay'>('side');
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const printRef = useRef<HTMLDivElement | null>(null);

  const areas = rental?.type === 'car' ? CAR_AREAS : HOUSE_AREAS;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Record365_${rental?.title}_${new Date().toISOString().split('T')[0]}`,
  });

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

  const getBeforePhoto = (areaId: string) => {
    return rental?.checkIn.photos.find(p => p.area === areaId);
  };

  const getAfterPhoto = (areaId: string) => {
    return rental?.checkOut.photos.find(p => p.area === areaId);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${rental?.title} - Before/After 비교 리포트`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 복사되었습니다!');
    }
  };

  const handlePrintPDF = () => {
    if (!rental) return;
    handlePrint();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rental || !areas) {
    return null;
  }

  const currentArea = areas[selectedAreaIndex];
  const beforePhoto = getBeforePhoto(currentArea.id);
  const afterPhoto = getAfterPhoto(currentArea.id);

  const areasWithBothPhotos = areas.filter(area => 
    getBeforePhoto(area.id) && getAfterPhoto(area.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
                ← 뒤로
              </button>
              <div>
              <h1 className="font-bold text-gray-900 whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
  🔍 Before / After 비교
</h1>
                <p className="text-sm text-gray-500">{rental.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrintPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                📄 PDF
              </button>
              <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                📤 공유
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('side')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'side' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                좌우 비교
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'overlay' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                오버레이
              </button>
            </div>
            <div className="text-sm text-gray-500">
              비교 가능: {areasWithBothPhotos.length}개 영역
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
          {areas.map((area, index) => {
            const hasBefore = getBeforePhoto(area.id);
            const hasAfter = getAfterPhoto(area.id);
            const hasBoth = hasBefore && hasAfter;

            return (
              <button
                key={area.id}
                onClick={() => setSelectedAreaIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedAreaIndex === index
                    ? 'bg-blue-600 text-white'
                    : hasBoth
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {area.icon} {area.name}
                {hasBoth && ' ✓'}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">{currentArea.icon}</span>
            <h2 className="text-xl font-bold mt-2">{currentArea.name}</h2>
          </div>

          {!beforePhoto && !afterPhoto ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-5xl mb-4">📷</p>
              <p>이 영역에 촬영된 사진이 없습니다.</p>
            </div>
          ) : viewMode === 'side' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2 text-center">📥 Before</p>
                {beforePhoto ? (
                  <div>
                    <img src={beforePhoto.url} alt="Before 사진" className="w-full h-48 object-cover rounded-lg" />
                    {beforePhoto.notes && (
                      <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">📝 {beforePhoto.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {new Date(beforePhoto.timestamp).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">사진 없음</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-orange-500 mb-2 text-center">📤 After</p>
                {afterPhoto ? (
                  <div>
                    <img src={afterPhoto.url} alt="After 사진" className="w-full h-48 object-cover rounded-lg" />
                    {afterPhoto.notes && (
                      <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">📝 {afterPhoto.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {new Date(afterPhoto.timestamp).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">사진 없음</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                {beforePhoto && (
                  <img src={beforePhoto.url} alt="Before 사진" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {afterPhoto && (
                  <img
                    src={afterPhoto.url}
                    alt="After 사진"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: overlayOpacity / 100 }}
                  />
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>📥 Before</span>
                  <span>📤 After</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setSelectedAreaIndex(Math.max(0, selectedAreaIndex - 1))}
            disabled={selectedAreaIndex === 0}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 disabled:opacity-50"
          >
            ← 이전
          </button>
          <button
            onClick={() => setSelectedAreaIndex(Math.min(areas.length - 1, selectedAreaIndex + 1))}
            disabled={selectedAreaIndex === areas.length - 1}
            className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium disabled:opacity-50"
          >
            다음 →
          </button>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">📋 렌탈 정보</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">유형</p>
              <p className="font-medium">{rental.type === 'car' ? '🚗 렌터카' : '🏠 월세'}</p>
            </div>
            <div>
              <p className="text-gray-500">상태</p>
              <p className="font-medium">
                {rental.status === 'completed' ? '✅ 완료' : rental.status === 'active' ? '🔵 진행중' : '⚪ 대기'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">시작일</p>
              <p className="font-medium">{new Date(rental.startDate).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-gray-500">종료일</p>
              <p className="font-medium">{new Date(rental.endDate).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-gray-500">Before 사진</p>
              <p className="font-medium">{rental.checkIn.photos.length}장</p>
            </div>
            <div>
              <p className="text-gray-500">After 사진</p>
              <p className="font-medium">{rental.checkOut.photos.length}장</p>
            </div>
          </div>
        </div>

        {rental.checkIn.completedAt && rental.checkOut.completedAt && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">✅ 촬영 완료</h3>
            <p className="text-sm text-green-700">
              Before/After 사진이 모두 기록되었습니다. 분쟁 발생 시 이 기록을 증거로 활용할 수 있습니다.
            </p>
          </div>
        )}
      </main>

      {/* 프린트용 숨겨진 컴포넌트 */}
      <div className="hidden">
        <PrintableReport ref={printRef} rental={rental} areas={areas} />
      </div>
    </div>
  );
}