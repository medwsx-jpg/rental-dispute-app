import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // 모바일 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const options = {
    maxSizeMB: isMobile ? 0.8 : 0.8,
    maxWidthOrHeight: isMobile ? 1600 : 1920,
    useWebWorker: !isMobile,  // ← 모바일: false, 웹: true
    fileType: 'image/jpeg' as const,
    initialQuality: isMobile ? 0.75 : 0.8,
  };

  try {
    console.log(`압축 시작 (${isMobile ? '모바일' : '웹'}, WebWorker: ${options.useWebWorker}):`, file.name, file.size, 'bytes');
    const startTime = Date.now();
    
    const compressedFile = await imageCompression(file, options);
    
    const endTime = Date.now();
    console.log(`압축 완료 (${endTime - startTime}ms):`, compressedFile.size, 'bytes');
    
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    
    // 5MB 이하면 원본 허용
    if (file.size <= 5 * 1024 * 1024) {
      console.log('압축 실패했지만 원본 크기가 적당하여 업로드 진행');
      return file;
    }
    
    alert('사진 크기가 너무 큽니다 (5MB 초과). 다른 사진을 선택해주세요.');
    throw error;
  }
}