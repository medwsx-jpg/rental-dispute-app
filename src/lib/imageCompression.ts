import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5, // 최대 500KB
    maxWidthOrHeight: 1920, // 최대 1920px
    useWebWorker: true,
    quality: 0.85, // 품질 85%
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`압축 전: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    return file; // 압축 실패 시 원본 반환
  }
};