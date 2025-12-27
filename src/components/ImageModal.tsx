'use client';

import { useState } from 'react';

interface ImageModalProps {
  images: { url: string; notes?: string }[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageModal({ images, initialIndex, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl font-bold z-10 hover:text-gray-300"
        >
          ✕
        </button>

        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 text-white text-4xl font-bold z-10 hover:text-gray-300"
          >
            ‹
          </button>
        )}

        {/* 이미지 */}
        <div
          className="max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex].url}
            alt={`사진 ${currentIndex + 1}`}
            className="w-full h-full object-contain rounded-lg"
          />
          
          {/* 이미지 정보 */}
          <div className="mt-4 text-center text-white">
            <p className="text-lg font-medium">
              {currentIndex + 1} / {images.length}
            </p>
            {images[currentIndex].notes && (
              <p className="text-sm text-gray-300 mt-2">
                📝 {images[currentIndex].notes}
              </p>
            )}
          </div>
        </div>

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 text-white text-4xl font-bold z-10 hover:text-gray-300"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}