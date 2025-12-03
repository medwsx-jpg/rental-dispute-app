'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

export default function ImageViewer({ isOpen, imageUrl, onClose, title }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
    if (scale <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-black bg-opacity-80 p-4 flex items-center justify-between">
        <h3 className="text-white font-medium">{title || '이미지 보기'}</h3>
        <button
          onClick={onClose}
          className="text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* 이미지 컨테이너 */}
      <div
        ref={imageRef}
        className="flex-1 overflow-hidden flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt="확대 이미지"
          className="max-w-full max-h-full select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* 컨트롤 */}
      <div className="bg-black bg-opacity-80 p-4 flex items-center justify-center gap-4">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg font-medium hover:bg-opacity-30 disabled:opacity-50"
        >
          🔍−
        </button>
        <span className="text-white font-medium min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 4}
          className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg font-medium hover:bg-opacity-30 disabled:opacity-50"
        >
          🔍+
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg font-medium hover:bg-opacity-30"
        >
          🔄 초기화
        </button>
      </div>

      <p className="text-center text-white text-xs py-2 bg-black bg-opacity-80">
        {scale > 1 ? '드래그하여 이동하세요' : '확대하여 자세히 볼 수 있습니다'}
      </p>
    </div>
  );
}