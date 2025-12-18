import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // 모바일 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 모바일: 압축 생략
    console.log('모바일 - 압축 생략:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    alert(`모바일: 압축 없이 업로드\n크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    return file;
  }
  
  // 웹: 압축 진행
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    console.log('웹 - 압축 시작:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    const compressedFile = await imageCompression(file, options);
    console.log('웹 - 압축 완료:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');
    alert(`웹: 압축 완료\n원본: ${(file.size / 1024 / 1024).toFixed(2)}MB\n압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('웹 - 압축 실패:', error);
    alert('압축 실패! 원본 업로드');
    return file;
  }
}