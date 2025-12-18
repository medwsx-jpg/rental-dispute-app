import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    console.log('압축 시작 - 원본:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB');
    const compressedFile = await imageCompression(file, options);
    console.log('압축 완료 - 결과:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 화면에 표시
    alert(`압축 완료!\n원본: ${(file.size / 1024 / 1024).toFixed(2)}MB\n압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    alert(`압축 실패! 원본 그대로 업로드 시도: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    return file;
  }
}