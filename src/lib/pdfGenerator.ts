import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (
  rental: any,
  beforePhotos: any[],
  afterPhotos: any[],
  areas: any[]
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

  // 제목
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Record 365 - 렌탈 리포트', margin, yPosition);
  yPosition += 10;

  // 기본 정보
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`제목: ${rental.title}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`유형: ${rental.type === 'car' ? '렌터카' : '월세'}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`기간: ${new Date(rental.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(rental.endDate).toLocaleDateString('ko-KR')}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`생성일: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}`, margin, yPosition);
  yPosition += 15;

  // 각 영역별 사진 추가
  for (const area of areas) {
    const beforePhoto = beforePhotos.find(p => p.area === area.id);
    const afterPhoto = afterPhotos.find(p => p.area === area.id);

    if (!beforePhoto && !afterPhoto) continue;

    // 새 페이지 필요 시
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    // 영역 제목
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${area.icon} ${area.name}`, margin, yPosition);
    yPosition += 10;

    const imageWidth = (contentWidth - 5) / 2;
    const imageHeight = 60;

    // Before 사진
    if (beforePhoto) {
      try {
        const beforeImg = await loadImage(beforePhoto.url);
        pdf.addImage(beforeImg, 'JPEG', margin, yPosition, imageWidth, imageHeight);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Before', margin, yPosition + imageHeight + 5);
        
        if (beforePhoto.notes) {
          pdf.setFontSize(8);
          const lines = pdf.splitTextToSize(beforePhoto.notes, imageWidth);
          pdf.text(lines, margin, yPosition + imageHeight + 10);
        }
      } catch (error) {
        console.error('Before 이미지 로드 실패:', error);
        pdf.text('이미지 로드 실패', margin, yPosition + imageHeight / 2);
      }
    }

    // After 사진
    if (afterPhoto) {
      try {
        const afterImg = await loadImage(afterPhoto.url);
        pdf.addImage(afterImg, 'JPEG', margin + imageWidth + 5, yPosition, imageWidth, imageHeight);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('After', margin + imageWidth + 5, yPosition + imageHeight + 5);
        
        if (afterPhoto.notes) {
          pdf.setFontSize(8);
          const lines = pdf.splitTextToSize(afterPhoto.notes, imageWidth);
          pdf.text(lines, margin + imageWidth + 5, yPosition + imageHeight + 10);
        }
      } catch (error) {
        console.error('After 이미지 로드 실패:', error);
        pdf.text('이미지 로드 실패', margin + imageWidth + 5, yPosition + imageHeight / 2);
      }
    }

    yPosition += imageHeight + 20;
  }

  // 푸터
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Record 365 - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // PDF 저장
  const fileName = `Record365_${rental.title}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};