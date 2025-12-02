import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFFromElement = async (
  elementId: string,
  fileName: string
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // 화면을 캡처
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    throw error;
  }
};

export const generatePDF = async (
  rental: any,
  beforePhotos: any[],
  afterPhotos: any[],
  areas: any[]
) => {
  const fileName = `Record365_${rental.title}_${new Date().toISOString().split('T')[0]}.pdf`;
  await generatePDFFromElement('compare-container', fileName);
};