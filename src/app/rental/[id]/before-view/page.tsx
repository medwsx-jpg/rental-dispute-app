'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ImageModal from '@/components/ImageModal';

export default function BeforeViewPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadRental();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadRental = async () => {
    try {
      const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
      if (rentalDoc.exists()) {
        setRental({ id: rentalDoc.id, ...rentalDoc.data() });
      } else {
        alert('렌탈을 찾을 수 없습니다.');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('렌탈 로드 실패:', error);
      alert('렌탈 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const beforePhotos = rental.checkIn?.photos || [];
  const checklists = rental.checkIn?.checklists || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold text-gray-900">📋 Before 상태 확인</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 렌탈 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="font-medium text-gray-900">{rental.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(rental.startDate).toLocaleDateString('ko-KR')} ~ {new Date(rental.endDate).toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* Before 사진 */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Before 사진 ({beforePhotos.length}장)
            </h3>
            <p className="text-xs text-gray-500 mb-3">💡 사진을 탭하면 확대됩니다</p>
            
            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {beforePhotos.map((photo: any, index: number) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className="cursor-pointer hover:opacity-80 transition"
                  >
                    <img
                      src={photo.url}
                      alt={`Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {photo.notes && (
                      <p className="text-xs text-gray-600 mt-1">📝 {photo.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Before 사진이 없습니다.
              </p>
            )}
          </div>

          {/* 체크리스트 */}
          {checklists.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">✅ 체크리스트</h3>
              <div className="space-y-4">
                {checklists.map((checklist: any, areaIndex: number) => (
                  <div key={areaIndex}>
                    {/* 영역별로 구분 */}
                    <div className="space-y-2">
                      {checklist.items && checklist.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex items-start gap-2 text-sm">
                          <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>
                            {item.checked ? '✅' : '☐'}
                          </span>
                          <span className={item.checked ? 'text-gray-900' : 'text-gray-400'}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 서명 정보 */}
          {rental.checkIn?.signature && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">✍️ 본인 서명</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <img 
                  src={rental.checkIn.signature} 
                  alt="서명" 
                  className="h-20 mx-auto"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  {new Date(rental.checkIn.completedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}

          {/* 상대방 서명 정보 */}
          {rental.checkIn?.partnerSignature && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">👥 상대방 서명</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">서명자:</span> {rental.checkIn.partnerSignature.signerName}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">전화번호:</span> {rental.checkIn.partnerSignature.signerPhone}
                  </p>
                  {rental.checkIn.partnerSignature.signerAddress && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">주소:</span> {rental.checkIn.partnerSignature.signerAddress}
                    </p>
                  )}
                </div>
                <img 
                  src={rental.checkIn.partnerSignature.signatureImage} 
                  alt="상대방 서명" 
                  className="h-20 mx-auto"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  {new Date(rental.checkIn.partnerSignature.signedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/rental/${rentalId}/checkout`)}
            className="w-full py-4 bg-orange-500 text-white rounded-lg font-medium text-lg hover:bg-orange-600 transition"
          >
            📤 After 촬영하기 →
          </button>

          {!rental.checkIn?.partnerSignature && (
            <button
              onClick={() => router.push(`/rental/${rentalId}/request-signature`)}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 transition"
            >
              ✍️ 서명 요청하기
            </button>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </main>

      {/* 이미지 확대 모달 */}
      {selectedImageIndex !== null && beforePhotos.length > 0 && (
        <ImageModal
          images={beforePhotos}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
}