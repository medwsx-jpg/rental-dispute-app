'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Rental, CAR_AREAS, HOUSE_AREAS, Photo } from '@/types/rental';

export default function AfterPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [memo, setMemo] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const areas = rental?.type === 'car' ? CAR_AREAS : HOUSE_AREAS;
  const currentArea = areas?.[currentAreaIndex];

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
        setPhotos(data.checkOut.photos || []);
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

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentArea) return;

    const currentPhoto = getPhotoForArea(currentArea.id);
    setPendingFile(file);
    setMemo(currentPhoto?.notes || '');
    setShowMemoInput(true);
  };

  const handleUploadWithMemo = async () => {
    if (!pendingFile || !currentArea) return;

    setUploading(true);
    setShowMemoInput(false);

    try {
      const location = await getLocation();
      const timestamp = Date.now();

      const storageRef = ref(
        storage,
        `rentals/${rentalId}/after/${currentArea.id}_${timestamp}.jpg`
      );

      await uploadBytes(storageRef, pendingFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newPhoto: Photo = {
        url: downloadURL,
        timestamp,
        location,
        area: currentArea.id,
        notes: memo.trim(),
      };

      const updatedPhotos = [...photos];
      const existingIndex = updatedPhotos.findIndex(p => p.area === currentArea.id);
      
      if (existingIndex >= 0) {
        updatedPhotos[existingIndex] = newPhoto;
      } else {
        updatedPhotos.push(newPhoto);
      }

      setPhotos(updatedPhotos);

      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkOut.photos': updatedPhotos,
      });

      setMemo('');
      setPendingFile(null);

      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(currentAreaIndex + 1);
      }

      alert(`${currentArea.name} 사진 저장 완료!`);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditMemo = () => {
    const currentPhoto = getPhotoForArea(currentArea.id);
    if (currentPhoto) {
      setMemo(currentPhoto.notes);
      setEditingMemo(true);
    }
  };

  const handleSaveMemo = async () => {
    if (!currentArea) return;

    try {
      const updatedPhotos = photos.map(p => 
        p.area === currentArea.id ? { ...p, notes: memo.trim() } : p
      );

      setPhotos(updatedPhotos);

      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkOut.photos': updatedPhotos,
      });

      setEditingMemo(false);
      setMemo('');
      alert('메모가 수정되었습니다!');
    } catch (error) {
      console.error('메모 수정 실패:', error);
      alert('메모 수정에 실패했습니다.');
    }
  };

  const handleComplete = async () => {
    const requiredAreas = areas.filter(a => a.required);
    const uploadedAreas = photos.map(p => p.area);
    const missingAreas = requiredAreas.filter(a => !uploadedAreas.includes(a.id));

    if (missingAreas.length > 0) {
      alert(`필수 영역을 모두 촬영해주세요:\n${missingAreas.map(a => a.name).join(', ')}`);
      return;
    }

    try {
      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkOut.completedAt': Date.now(),
        'status': 'completed',
      });

      alert('After 사진 등록이 완료되었습니다! 🎉\n비교 화면으로 이동합니다.');
      router.push(`/rental/${rentalId}/compare`);
    } catch (error) {
      console.error('완료 처리 실패:', error);
      alert('완료 처리에 실패했습니다.');
    }
  };

  const getPhotoForArea = (areaId: string) => {
    return photos.find(p => p.area === areaId);
  };

  const getBeforePhotoForArea = (areaId: string) => {
    return rental?.checkIn.photos.find(p => p.area === areaId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rental || !currentArea) {
    return null;
  }

  const currentPhoto = getPhotoForArea(currentArea.id);
  const beforePhoto = getBeforePhotoForArea(currentArea.id);

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
                <h1 className="text-lg font-bold text-gray-900">📸 After 촬영</h1>
                <p className="text-sm text-gray-500">{rental.title}</p>
              </div>
            </div>
            <span className="text-2xl">{rental.type === 'car' ? '🚗' : '🏠'}</span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>촬영 진행률</span>
            <span>{photos.length} / {areas.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${(photos.length / areas.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
          {areas.map((area, index) => {
            const hasPhoto = getPhotoForArea(area.id);
            return (
              <button
                key={area.id}
                onClick={() => setCurrentAreaIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  currentAreaIndex === index
                    ? 'bg-orange-500 text-white'
                    : hasPhoto
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {hasPhoto && '✓ '}{area.icon} {area.name}
                {area.required && !hasPhoto && <span className="text-red-500 ml-1">*</span>}
              </button>
            );
          })}
        </div>

        {beforePhoto && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-2">📥 Before 사진</p>
            <img src={beforePhoto.url} alt="Before 사진" className="w-full h-32 object-cover rounded-lg" />
            {beforePhoto.notes && (
              <p className="text-xs text-blue-600 mt-2">📝 {beforePhoto.notes}</p>
            )}
            <p className="text-xs text-blue-600 mt-1">
              {new Date(beforePhoto.timestamp).toLocaleString('ko-KR')}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <span className="text-5xl">{currentArea.icon}</span>
            <h2 className="text-xl font-bold mt-2">{currentArea.name}</h2>
            {currentArea.required && (
              <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">필수 촬영</span>
            )}
          </div>

          {showMemoInput ? (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">📝 메모 (선택사항)</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 새로운 스크래치 발견, 상태 양호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMemoInput(false);
                    setPendingFile(null);
                    setMemo('');
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleUploadWithMemo}
                  disabled={uploading}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  {uploading ? '업로드 중...' : '저장하기'}
                </button>
              </div>
            </div>
          ) : editingMemo ? (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">📝 메모 수정</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingMemo(false);
                    setMemo('');
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                >
                  메모 저장
                </button>
              </div>
            </div>
          ) : currentPhoto ? (
            <div className="space-y-4">
              <img src={currentPhoto.url} alt={currentArea.name} className="w-full h-64 object-cover rounded-lg" />
              <div className="text-sm text-gray-500 text-center">
                📍 {currentPhoto.location ? '위치 기록됨' : '위치 정보 없음'} • 🕐 {new Date(currentPhoto.timestamp).toLocaleString('ko-KR')}
              </div>
              {currentPhoto.notes && (
                <div className="bg-yellow-50 rounded-lg p-3 flex items-start justify-between">
                  <p className="text-sm text-yellow-800">📝 {currentPhoto.notes}</p>
                  <button
                    onClick={handleEditMemo}
                    className="ml-2 text-yellow-600 hover:text-yellow-800 text-sm whitespace-nowrap"
                  >
                    ✏️ 수정
                  </button>
                </div>
              )}
              {!currentPhoto.notes && (
                <button
                  onClick={handleEditMemo}
                  className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition"
                >
                  📝 메모 추가
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-3 border-2 border-orange-500 text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition">
                📸 다시 촬영
              </button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-orange-500 transition">
              {uploading ? (
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">업로드 중...</p>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-lg font-medium text-gray-700">탭하여 {currentArea.name} 촬영</p>
                  <p className="text-sm text-gray-500 mt-2">Before와 같은 구도로 촬영하세요</p>
                </div>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={() => setCurrentAreaIndex(Math.max(0, currentAreaIndex - 1))} disabled={currentAreaIndex === 0} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 disabled:opacity-50">
            ← 이전
          </button>
          {currentAreaIndex < areas.length - 1 ? (
            <button onClick={() => setCurrentAreaIndex(currentAreaIndex + 1)} className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium">
              다음 →
            </button>
          ) : (
            <button onClick={handleComplete} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              ✓ After 완료
            </button>
          )}
        </div>

        <div className="mt-6 bg-orange-50 rounded-lg p-4">
          <h3 className="font-medium text-orange-800 mb-2">💡 촬영 팁</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Before와 <strong>같은 위치, 같은 구도</strong>로 촬영하세요</li>
            <li>• 새로운 흠집이나 손상이 있다면 메모를 남기세요</li>
            <li>• 촬영 후에도 메모를 추가/수정할 수 있습니다</li>
            <li>• 비교가 쉽도록 비슷한 조명에서 촬영하세요</li>
          </ul>
        </div>
      </main>
    </div>
  );
}