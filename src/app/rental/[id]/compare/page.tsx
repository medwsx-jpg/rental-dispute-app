'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Rental, CAR_AREAS, HOUSE_AREAS } from '@/types/rental';
import ImageViewer from '@/components/ImageViewer';
import { PDFReport } from '@/components/PDFReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  const areas = rental?.type === 'car' ? CAR_AREAS : HOUSE_AREAS;
  const currentArea = areas?.[selectedAreaIndex];

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

  const handleDownloadPDF = async () => {
    if (!rental) return;
  
    setGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
  
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
  
      // 표지
      pdf.setFontSize(24);
      pdf.setTextColor(31, 41, 55);
      pdf.text('🏠 Record 365', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Before / After 비교 리포트', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(14);
      pdf.setTextColor(107, 114, 128);
      pdf.text(rental.title, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text(
        `${new Date(rental.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(rental.endDate).toLocaleDateString('ko-KR')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
  
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, pageWidth / 2, yPosition, { align: 'center' });
  
      // 각 영역별 비교
      for (const area of areas) {
        const beforePhoto = getPhotoForArea(area.id, 'before');
        const afterPhoto = getPhotoForArea(area.id, 'after');
  
        if (!beforePhoto && !afterPhoto) continue;
  
        // 새 페이지
        pdf.addPage();
        yPosition = margin;
  
        // 영역 제목
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.setFillColor(243, 244, 246);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
        pdf.text(`${area.icon} ${area.name}`, margin + 5, yPosition + 2);
  
        yPosition += 15;
  
        const imgWidth = (pageWidth - 3 * margin) / 2;
        const imgHeight = 80;
  
        // Before
        if (beforePhoto) {
          try {
            pdf.setFontSize(10);
            pdf.setTextColor(30, 64, 175);
            pdf.text('📥 Before', margin, yPosition);
            
            pdf.addImage(beforePhoto.url, 'JPEG', margin, yPosition + 5, imgWidth, imgHeight);
            
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text(
              new Date(beforePhoto.timestamp).toLocaleString('ko-KR'),
              margin,
              yPosition + imgHeight + 10
            );
  
            if (beforePhoto.notes) {
              pdf.text(`📝 ${beforePhoto.notes}`, margin, yPosition + imgHeight + 15);
            }
          } catch (error) {
            console.error('Before 이미지 추가 실패:', error);
          }
        }
  
        // After
        if (afterPhoto) {
          try {
            pdf.setFontSize(10);
            pdf.setTextColor(194, 65, 12);
            pdf.text('📤 After', margin + imgWidth + margin, yPosition);
            
            pdf.addImage(afterPhoto.url, 'JPEG', margin + imgWidth + margin, yPosition + 5, imgWidth, imgHeight);
            
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text(
              new Date(afterPhoto.timestamp).toLocaleString('ko-KR'),
              margin + imgWidth + margin,
              yPosition + imgHeight + 10
            );
  
            if (afterPhoto.notes) {
              pdf.text(`📝 ${afterPhoto.notes}`, margin + imgWidth + margin, yPosition + imgHeight + 15);
            }
          } catch (error) {
            console.error('After 이미지 추가 실패:', error);
          }
        }
      }
  
      // 서명 페이지
      if (rental.checkIn.signature || rental.checkOut.signature) {
        pdf.addPage();
        yPosition = margin;
  
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('✍️ 서명', margin, yPosition);
        yPosition += 15;
  
        const sigWidth = (pageWidth - 3 * margin) / 2;
        const sigHeight = 40;
  
        if (rental.checkIn.signature) {
          pdf.setFontSize(10);
          pdf.setTextColor(37, 99, 235);
          pdf.text('Before 서명', margin, yPosition);
          pdf.addImage(rental.checkIn.signature, 'PNG', margin, yPosition + 5, sigWidth, sigHeight);
        }
  
        if (rental.checkOut.signature) {
          pdf.setFontSize(10);
          pdf.setTextColor(234, 88, 12);
          pdf.text('After 서명', margin + sigWidth + margin, yPosition);
          pdf.addImage(rental.checkOut.signature, 'PNG', margin + sigWidth + margin, yPosition + 5, sigWidth, sigHeight);
        }
      }
  
      // 푸터
      const pageCount = pdf.internal.pages.length - 1;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(
          `본 문서는 Record 365에서 생성되었습니다. © ${new Date().getFullYear()} Record 365`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
  
      pdf.save(`${rental.title}_비교리포트_${new Date().toLocaleDateString('ko-KR')}.pdf`);
      alert('PDF가 다운로드되었습니다!');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${rental?.title} - Before/After 비교`,
          text: 'Record 365 렌탈 비교 리포트',
          url: shareUrl,
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('링크가 복사되었습니다!');
    }
  };

  const getPhotoForArea = (areaId: string, type: 'before' | 'after') => {
    if (!rental) return null;
    const photos = type === 'before' ? rental.checkIn.photos : rental.checkOut.photos;
    return photos.find(p => p.area === areaId);
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setViewerImage(imageUrl);
    setViewerTitle(title);
    setViewerOpen(true);
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

  const beforePhoto = getPhotoForArea(currentArea.id, 'before');
  const afterPhoto = getPhotoForArea(currentArea.id, 'after');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="text-gray-600 hover:text-gray-900 flex-shrink-0 font-medium"
            style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}
          >
            ← 뒤로
          </button>
          <h1 className="font-bold text-gray-900 whitespace-nowrap px-2" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
            🔍 Before / After 비교
          </h1>
          <div className="w-16 flex-shrink-0"></div>
        </div>
      </header>

      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600 truncate flex-1 mr-2">
            {rental.title}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generating ? 'PDF 생성 중...' : 'PDF'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              공유
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
          {areas.map((area, index) => {
            const hasBefore = getPhotoForArea(area.id, 'before');
            const hasAfter = getPhotoForArea(area.id, 'after');
            return (
              <button
                key={area.id}
                onClick={() => setSelectedAreaIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedAreaIndex === index
                    ? 'bg-blue-600 text-white'
                    : hasBefore && hasAfter
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {hasBefore && hasAfter && '✓ '}{area.icon} {area.name}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-blue-600 mb-2">📥 Before</h3>
              {beforePhoto ? (
                <div>
                  <div className="relative">
                    <img 
                      src={beforePhoto.url} 
                      alt="Before" 
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" 
                      onClick={() => handleImageClick(beforePhoto.url, `${currentArea.name} - Before`)}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      탭하여 확대
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(beforePhoto.timestamp).toLocaleString('ko-KR')}
                  </p>
                  {beforePhoto.notes && (
                    <p className="text-sm text-gray-700 mt-1">📝 {beforePhoto.notes}</p>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">사진 없음</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-orange-600 mb-2">📤 After</h3>
              {afterPhoto ? (
                <div>
                  <div className="relative">
                    <img 
                      src={afterPhoto.url} 
                      alt="After" 
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" 
                      onClick={() => handleImageClick(afterPhoto.url, `${currentArea.name} - After`)}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      탭하여 확대
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(afterPhoto.timestamp).toLocaleString('ko-KR')}
                  </p>
                  {afterPhoto.notes && (
                    <p className="text-sm text-gray-700 mt-1">📝 {afterPhoto.notes}</p>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">사진 없음</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
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
      </main>

      {/* PDF 생성용 숨겨진 컴포넌트 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {rental && <PDFReport ref={pdfRef} rental={rental} />}
      </div>

      <ImageViewer
        isOpen={viewerOpen}
        imageUrl={viewerImage}
        onClose={() => setViewerOpen(false)}
        title={viewerTitle}
      />
    </div>
  );
}