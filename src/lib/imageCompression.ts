import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // 모바일 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const options = {
    maxSizeMB: isMobile ? 0.3 : 0.8,              // 모바일: 300KB, 웹: 800KB
    maxWidthOrHeight: isMobile ? 1280 : 1920,      // 모바일: 1280px, 웹: 1920px
    useWebWorker: true,
    fileType: 'image/jpeg' as const,               // 명시적으로 JPEG로
    initialQuality: isMobile ? 0.7 : 0.8,          // 모바일: 품질 70%, 웹: 80%
  };

  try {
    console.log(`압축 시작 (${isMobile ? '모바일' : '웹'}):`, file.size, 'bytes');
    const compressedFile = await imageCompression(file, options);
    console.log('압축 완료:', compressedFile.size, 'bytes');
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    return file;
  }
}