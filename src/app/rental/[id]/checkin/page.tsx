'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Rental, RentalArea, CAR_AREAS, HOUSE_AREAS, Photo } from '@/types/rental';
import SignatureModal from '@/components/SignatureModal';
import { compressImage } from '@/lib/imageCompression';
import ImageViewer from '@/components/ImageViewer';
import ChecklistSection from '@/components/ChecklistSection';
import { AreaChecklist } from '@/types/rental';

// 렌탈 타입에 따른 촬영 영역 반환
const getAreasForRental = (rental: Rental | null): RentalArea[] => {
  if (!rental) return [];
  if (rental.type === 'car') return CAR_AREAS;
  if (rental.type === 'house') return HOUSE_AREAS;
  if (rental.type === 'goods' && rental.customAreas && rental.customAreas.length > 0) {
    return rental.customAreas.map((name, i) => ({
      id: `custom_${i}`,
      name: name,
      icon: '📦',
      required: false
    }));
  }
  return [];
};

export default function BeforePage() {
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
  const [editingPhotoTimestamp, setEditingPhotoTimestamp] = useState<number | null>(null); // ← 추가
  const [checklists, setChecklists] = useState<AreaChecklist[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

 

  const areas = getAreasForRental(rental);
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
        setPhotos(data.checkIn.photos || []);
        setSignature(data.checkIn.signature || '');
        setChecklists(data.checkIn.checklists || []);
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
    if (!file) return;
  
    if (rental?.type === 'goods' && areas.length === 0) {
      await handleFreePhotoUpload(file);
      return;
    }
  
    if (!currentArea) return;
  
    const compressedFile = await compressImage(file);
  
    // 모바일 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 모바일: 미리보기 건너뛰고 바로 메모 입력
      setPendingFile(compressedFile);
      setMemo('');
      setShowMemoInput(true);
    } else {
      // 웹: 미리보기 표시
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setShowPreview(true);
      };
      reader.readAsDataURL(compressedFile);
  
      setPendingFile(compressedFile);
      setMemo('');
    }
  };

  const handleFreePhotoUpload = async (file: File) => {
    setUploading(true);

    try {
      const compressedFile = await compressImage(file);
      const location = await getLocation();
      const timestamp = Date.now();
      const photoId = `free_${timestamp}`;

      const storageRef = ref(
        storage,
        `rentals/${rentalId}/before/${photoId}.jpg`
      );

      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

await new Promise<void>((resolve, reject) => {
  uploadTask.on(
    'state_changed',
    null,
    (error) => reject(error),
    () => resolve()
  );
});

const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      const newPhoto: Photo = {
        url: downloadURL,
        timestamp,
        location,
        area: photoId,
        notes: '',
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);

      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkIn.photos': updatedPhotos,
      });

      alert('사진이 저장되었습니다!');
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
      
    }
  };

  const handleConfirmPreview = () => {
    setShowPreview(false);
    setShowMemoInput(true);
  };

  const handleRetakePhoto = () => {
    setShowPreview(false);
    setPreviewImage(null);
    setPendingFile(null);
    
  };

  const handleUploadWithMemo = async () => {
    console.log('handleUploadWithMemo 호출', { pendingFile, currentArea, uploading });
    
    if (uploading) {
      console.log('이미 업로드 중');
      return;
    }
    
    if (!pendingFile || !currentArea) {
      console.log('파일 또는 영역 없음');
      return;
    }
  
    // 파일 크기 체크
    if (pendingFile.size > 10 * 1024 * 1024) {
      alert('파일이 너무 큽니다 (10MB 이하만 가능)');
      return;
    }
  
    setUploading(true);
    setShowMemoInput(false);
  
    try {
      const location = await getLocation();
      const timestamp = Date.now();
      const storageRef = ref(
        storage,
        `rentals/${rentalId}/before/${currentArea.id}_${timestamp}.jpg`
      );
  
      // uploadBytesResumable 사용
      const uploadTask = uploadBytesResumable(storageRef, pendingFile);
  
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('업로드 진행:', progress.toFixed(0) + '%');
        },
        (error) => {
          console.error('업로드 실패:', error);
          alert('업로드 실패: ' + error.message);
          setUploading(false);
        },
        async () => {
          // 업로드 완료
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
  
          const newPhoto: Photo = {
            url: downloadURL,
            timestamp,
            location,
            area: currentArea.id,
            notes: memo.trim(),
          };
  
          const updatedPhotos = [...photos, newPhoto];
          setPhotos(updatedPhotos);
  
          const rentalRef = doc(db, 'rentals', rentalId);
          await updateDoc(rentalRef, {
            'checkIn.photos': updatedPhotos,
          });
  
          // 상태 명확히 리셋
        setMemo('');
        setPendingFile(null);
        setPreviewImage(null);
        setShowMemoInput(false);
        setShowPreview(false);
        setUploading(false);

        // 메모리 정리 대기
        await new Promise(resolve => setTimeout(resolve, 300));

        alert('사진 저장 완료!');
        }
      );
    } catch (error) {
      console.error('에러:', error);
      alert('업로드 에러: ' + (error as Error).message);
      setUploading(false);
    }
  };
  // ✅ 변경: 특정 사진의 메모 수정
  const handleEditMemo = (photoTimestamp: number, currentNotes: string) => {
    setEditingPhotoTimestamp(photoTimestamp);
    setMemo(currentNotes);
    setEditingMemo(true);
  };

  const handleSaveMemo = async () => {
    if (!currentArea || editingPhotoTimestamp === null) return;

    try {
      const updatedPhotos = photos.map(p => 
        p.timestamp === editingPhotoTimestamp ? { ...p, notes: memo.trim() } : p
      );

      setPhotos(updatedPhotos);

      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkIn.photos': updatedPhotos,
      });

      setEditingMemo(false);
      setEditingPhotoTimestamp(null);
      setMemo('');
      alert('메모가 수정되었습니다!');
    } catch (error) {
      console.error('메모 수정 실패:', error);
      alert('메모 수정에 실패했습니다.');
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    try {
      setSignature(signatureData);
      
      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkIn.signature': signatureData,
      });
      
      setShowSignatureModal(false);
      alert('서명이 저장되었습니다!');
    } catch (error) {
      console.error('서명 저장 실패:', error);
      alert('서명 저장에 실패했습니다.');
    }
  };

  const handleComplete = async () => {
    // 생활용품 자유 촬영 모드
    if (rental?.type === 'goods' && areas.length === 0) {
      if (photos.length === 0) {
        alert('최소 1장 이상의 사진을 촬영해주세요.');
        return;
      }
      
      if (!signature) {
        alert('서명이 필요합니다.');
        setShowSignatureModal(true);
        return;
      }

      try {
        const rentalRef = doc(db, 'rentals', rentalId);
        await updateDoc(rentalRef, {
          'checkIn.completedAt': Date.now(),
          'checkIn.signature': signature,
          'checkIn.checklists': checklists,
        });

        alert('Before 사진 등록이 완료되었습니다!');
        router.push('/dashboard');
      } catch (error) {
        console.error('완료 처리 실패:', error);
        alert('완료 처리에 실패했습니다.');
      }
      return;
    }

    // 일반 모드: 필수 영역별로 최소 1장씩 확인
    const requiredAreas = areas.filter(a => a.required);
    const uploadedAreaIds = [...new Set(photos.map(p => p.area))]; // 중복 제거
    const missingAreas = requiredAreas.filter(a => !uploadedAreaIds.includes(a.id));

    if (missingAreas.length > 0) {
      alert(`필수 영역을 모두 촬영해주세요:\n${missingAreas.map(a => a.name).join(', ')}`);
      return;
    }

    if (!signature) {
      alert('서명이 필요합니다.');
      setShowSignatureModal(true);
      return;
    }

    try {
      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkIn.completedAt': Date.now(),
        'checkIn.signature': signature,
        'checkIn.checklists': checklists,
      });

      alert('Before 사진 등록이 완료되었습니다!');
      router.push('/dashboard');
    } catch (error) {
      console.error('완료 처리 실패:', error);
      alert('완료 처리에 실패했습니다.');
    }
  };

  // ✅ 변경: 단일 사진 → 여러 사진 배열
  const getPhotosForArea = (areaId: string): Photo[] => {
    return photos.filter(p => p.area === areaId);
  };

  // ✅ 변경: timestamp로 삭제
  const handleDeletePhoto = async (photoTimestamp: number) => {
    const confirmed = confirm('이 사진을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      const updatedPhotos = photos.filter(p => p.timestamp !== photoTimestamp);
      setPhotos(updatedPhotos);

      const rentalRef = doc(db, 'rentals', rentalId);
      await updateDoc(rentalRef, {
        'checkIn.photos': updatedPhotos,
      });

      alert('사진이 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다.');
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

  // 생활용품 자유 촬영 모드
  if (rental.type === 'goods' && areas.length === 0) {
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
                  <h1 className="text-lg font-bold text-gray-900">📸 Before 촬영</h1>
                  <p className="text-sm text-gray-500">{rental.title}</p>
                </div>
              </div>
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">💡 자유 촬영 모드</h3>
            <p className="text-sm text-blue-700">
              생활용품은 자유롭게 촬영하실 수 있습니다. 필요한 부분을 모두 촬영해주세요.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">촬영된 사진: {photos.length}장</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">압축 및 업로드 중...</p>
<p className="mt-2 text-xs text-gray-500">고화질 사진은 1-2분 소요될 수 있습니다</p>
                </div>
              ) : (
                <div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => handleFileSelect(e as any);
                        input.click();
                      }}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      📷 촬영하기
                    </button>
                    <button
  onClick={() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  }}
  className="flex-1 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
>
  📂 갤러리
</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">자동으로 압축되어 저장됩니다</p>
                </div>
              )}
            </div>

            
          </div>

          {photos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">📸 촬영된 사진</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.timestamp} className="relative">
                    <img
                      src={photo.url}
                      alt={`사진 ${photo.timestamp}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                      onClick={() => {
                        setViewerImage(photo.url);
                        setViewerTitle(`사진 ${new Date(photo.timestamp).toLocaleString('ko-KR')}`);
                        setViewerOpen(true);
                      }}
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.timestamp)}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {new Date(photo.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signature && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">✍️ 서명</h3>
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  다시 서명
                </button>
              </div>
              <img src={signature} alt="서명" className="border rounded-lg max-h-24" />
            </div>
          )}

          {!signature && (
            <button
              onClick={() => setShowSignatureModal(true)}
              className="w-full py-3 mb-6 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
            >
              ✍️ 서명하기
            </button>
          )}

          <button
            onClick={handleComplete}
            disabled={photos.length === 0}
            className="w-full py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Before 완료
          </button>

          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">💡 촬영 팁</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 밝은 곳에서 촬영하세요</li>
              <li>• 제품 전체, 특이사항, 일련번호 등을 촬영하세요</li>
              <li>• 기존 흠집이나 손상은 꼭 촬영하세요</li>
              <li>• 사진을 탭하면 확대하여 자세히 볼 수 있습니다</li>
            </ul>
          </div>
        </main>

        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
          title="Before 촬영 서명"
        />

        <ImageViewer
          isOpen={viewerOpen}
          imageUrl={viewerImage}
          onClose={() => setViewerOpen(false)}
          title={viewerTitle}
        />
      </div>
    );
  }

  // 일반 모드 (영역별 촬영)
  const currentPhotos = getPhotosForArea(currentArea?.id || '');

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
                <h1 className="text-lg font-bold text-gray-900">📸 Before 촬영</h1>
                <p className="text-sm text-gray-500">{rental.title}</p>
              </div>
            </div>
            <span className="text-2xl">{rental.type === 'car' ? '🚗' : rental.type === 'house' ? '🏠' : '📦'}</span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>촬영 진행률</span>
            <span>{[...new Set(photos.map(p => p.area))].length} / {areas.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${([...new Set(photos.map(p => p.area))].length / areas.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
          {areas.map((area, index) => {
            const areaPhotos = getPhotosForArea(area.id);
            const hasPhoto = areaPhotos.length > 0;
            return (
              <button
  key={area.id}
  onClick={() => {
    setCurrentAreaIndex(index);
    // 상태 초기화
    setUploading(false);
    setPendingFile(null);
    setShowMemoInput(false);
    setShowPreview(false);
    setPreviewImage(null);
    setMemo('');
  }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  currentAreaIndex === index
                    ? 'bg-blue-600 text-white'
                    : hasPhoto
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {hasPhoto && `✓(${areaPhotos.length}) `}{area.icon} {area.name}
                {area.required && !hasPhoto && <span className="text-red-500 ml-1">*</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <span className="text-5xl">{currentArea?.icon}</span>
            <h2 className="text-xl font-bold mt-2">{currentArea?.name}</h2>
            {currentArea?.required && (
              <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">필수 촬영</span>
            )}
            {currentPhotos.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">📸 {currentPhotos.length}장 촬영됨</p>
            )}
          </div>

          {showMemoInput ? (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">📝 메모 (선택사항)</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 기존 스크래치 있음, 오른쪽 모서리 찍힘"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMemoInput(false);
                    setPendingFile(null);
                    setPreviewImage(null);
                    setMemo('');
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleUploadWithMemo}
                  disabled={uploading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingMemo(false);
                    setEditingPhotoTimestamp(null);
                    setMemo('');
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  메모 저장
                </button>
              </div>
            </div>
          ) : currentPhotos.length > 0 ? (
            <div className="space-y-4">
              {/* ✅ 사진 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {currentPhotos.map((photo) => (
                  <div key={photo.timestamp} className="relative">
                    <img 
                      src={photo.url} 
                      alt={currentArea?.name} 
                      className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                      onClick={() => {
                        setViewerImage(photo.url);
                        setViewerTitle(`${currentArea?.name} - ${new Date(photo.timestamp).toLocaleString('ko-KR')}`);
                        setViewerOpen(true);
                      }}
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.timestamp)}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      탭하여 확대
                    </div>
                    
                    {/* 메모 표시 */}
                    {photo.notes && (
                      <div className="mt-2 bg-yellow-50 rounded-lg p-2 flex items-start justify-between">
                        <p className="text-xs text-yellow-800 flex-1">📝 {photo.notes}</p>
                        <button
                          onClick={() => handleEditMemo(photo.timestamp, photo.notes)}
                          className="ml-2 text-yellow-600 hover:text-yellow-800 text-xs whitespace-nowrap"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    {!photo.notes && (
                      <button
                        onClick={() => handleEditMemo(photo.timestamp, '')}
                        className="w-full mt-2 py-1 border border-dashed border-gray-300 text-gray-600 rounded text-xs hover:border-gray-400 transition"
                      >
                        📝 메모 추가
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {new Date(photo.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* ✅ + 사진 추가 버튼 */}
              <button 
  onClick={() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      alert('모바일에서는 영역당 1장만 촬영 가능합니다.\n\nPC 웹 버전(https://rental-dispute-app.vercel.app)을 사용하시면 여러 장 촬영하실 수 있습니다.');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  }}
  disabled={uploading} 
  className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
>
  ➕ 사진 추가
</button>
              
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">압축 및 업로드 중...</p>
                  <p className="mt-2 text-xs text-gray-500">고화질 사진은 1-2분 소요될 수 있습니다</p>
                </div>
              ) : (
                <div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => handleFileSelect(e as any);
                        input.click();
                      }}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      📷 촬영
                    </button>
                    <button
  onClick={() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  }}
                      className="flex-1 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      📂 갤러리
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">자동으로 압축되어 저장됩니다</p>
                </div>
              )}
            </div>
          )}

        </div>

        {rental?.type !== 'goods' && currentArea && (
          <ChecklistSection
            rentalId={rentalId}
            rentalType={rental.type}
            areaId={currentArea.id}
            type="before"
            existingChecklists={checklists}
            onUpdate={setChecklists}
          />
        )}

        {signature && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">✍️ 서명</h3>
              <button
                onClick={() => setShowSignatureModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                다시 서명
              </button>
            </div>
            <img src={signature} alt="서명" className="border rounded-lg max-h-24" />
          </div>
        )}

        {!signature && (
          <button
            onClick={() => setShowSignatureModal(true)}
            className="w-full py-3 mt-6 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
          >
            ✍️ 서명하기
          </button>
        )}

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
              ✓ Before 완료
            </button>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 rounded-lg p-4">
  <h3 className="font-medium text-yellow-800 mb-2">💡 촬영 팁</h3>
  <ul className="text-sm text-yellow-700 space-y-1">
    <li>• 밝은 곳에서 촬영하세요</li>
    {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? (
      <li>• 모바일에서는 영역당 1장씩 촬영됩니다 (PC 웹에서는 여러 장 가능)</li>
    ) : (
      <li>• 한 영역에 여러 장 촬영 가능합니다</li>
    )}
    <li>• 기존 흠집이나 손상은 꼭 촬영하고 메모를 남기세요</li>
    <li>• 사진을 탭하면 확대하여 자세히 볼 수 있습니다</li>
    <li>• GPS가 켜져 있으면 위치가 자동 기록됩니다</li>
  </ul>
</div>
      </main>

      {/* 이미지 미리보기 모달 */}
      {showPreview && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <img 
              src={previewImage} 
              alt="미리보기" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <div className="bg-white p-6 space-y-3">
            <p className="text-center font-medium text-gray-900">
              {currentArea?.icon} {currentArea?.name}
            </p>
            <p className="text-center text-sm text-gray-600">
              사진이 선명한가요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetakePhoto}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                📸 다시 촬영
              </button>
              <button
                onClick={handleConfirmPreview}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                ✓ 이 사진 사용
              </button>
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSaveSignature}
        title="Before 촬영 서명"
      />

      <ImageViewer
        isOpen={viewerOpen}
        imageUrl={viewerImage}
        onClose={() => setViewerOpen(false)}
        title={viewerTitle}
      />
    </div>
  );
}