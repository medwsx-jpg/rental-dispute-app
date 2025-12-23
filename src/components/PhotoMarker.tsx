'use client';

import { useEffect, useRef, useState } from 'react';

interface PhotoMarkerProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (markedImageBlob: Blob) => void;
}

type Tool = 'arrow' | 'circle';
type Color = '#FF0000' | '#FFFF00' | '#0000FF'; // 빨강, 노랑, 파랑

interface Mark {
  tool: Tool;
  color: Color;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function PhotoMarker({ isOpen, imageUrl, onClose, onSave }: PhotoMarkerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [currentTool, setCurrentTool] = useState<Tool>('arrow');
    const [currentColor, setCurrentColor] = useState<Color>('#FF0000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [loading, setLoading] = useState(true);
  
    // 🔥 추가: 이미지 변경 시 마킹 초기화
    useEffect(() => {
      if (isOpen) {
        setMarks([]);
        setCurrentTool('arrow');
        setCurrentColor('#FF0000');
      }
    }, [imageUrl, isOpen]);
  
    // 이미지 로드
    useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      alert('이미지 로드 실패');
      setLoading(false);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Canvas 그리기
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = image.width;
    canvas.height = image.height;

    // 이미지 그리기
    ctx.drawImage(image, 0, 0);

    // 마킹들 그리기
    marks.forEach(mark => {
      drawMark(ctx, mark);
    });
  }, [image, marks]);

  // 마킹 그리기 함수
  const drawMark = (ctx: CanvasRenderingContext2D, mark: Mark) => {
    ctx.strokeStyle = mark.color;
    ctx.fillStyle = mark.color;
    ctx.lineWidth = 3;

    if (mark.tool === 'circle') {
      // 원 그리기
      const centerX = (mark.startX + mark.endX) / 2;
      const centerY = (mark.startY + mark.endY) / 2;
      const radiusX = Math.abs(mark.endX - mark.startX) / 2;
      const radiusY = Math.abs(mark.endY - mark.startY) / 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (mark.tool === 'arrow') {
      // 화살표 그리기
      const headlen = 20;
      const angle = Math.atan2(mark.endY - mark.startY, mark.endX - mark.startX);

      // 선
      ctx.beginPath();
      ctx.moveTo(mark.startX, mark.startY);
      ctx.lineTo(mark.endX, mark.endY);
      ctx.stroke();

      // 화살표 머리
      ctx.beginPath();
      ctx.moveTo(mark.endX, mark.endY);
      ctx.lineTo(
        mark.endX - headlen * Math.cos(angle - Math.PI / 6),
        mark.endY - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(mark.endX, mark.endY);
      ctx.lineTo(
        mark.endX - headlen * Math.cos(angle + Math.PI / 6),
        mark.endY - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  };

  // 마우스/터치 좌표 가져오기
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // 그리기 시작
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    setStartPos(pos);
  };

  // 그리기 중
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;

    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    // 미리보기 (실시간 그리기)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !image) return;

    // 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    marks.forEach(mark => drawMark(ctx, mark));

    // 현재 그리는 중인 마킹
    drawMark(ctx, {
      tool: currentTool,
      color: currentColor,
      startX: startPos.x,
      startY: startPos.y,
      endX: pos.x,
      endY: pos.y,
    });
  };

  // 그리기 종료
  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;

    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    // 새 마킹 추가
    const newMark: Mark = {
      tool: currentTool,
      color: currentColor,
      startX: startPos.x,
      startY: startPos.y,
      endX: pos.x,
      endY: pos.y,
    };

    setMarks([...marks, newMark]);
    setIsDrawing(false);
    setStartPos(null);
  };

  // 실행 취소
  const handleUndo = () => {
    if (marks.length === 0) return;
    setMarks(marks.slice(0, -1));
  };

  // 초기화
  const handleClear = () => {
    if (confirm('모든 마킹을 지우시겠습니까?')) {
      setMarks([]);
    }
  };

  // 저장
  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Blob 생성 실패'));
        }, 'image/jpeg', 0.95);
      });

      onSave(blob);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">🖍️ 사진 마킹</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-2xl">
          ✕
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-900">
        {loading ? (
          <div className="text-white">이미지 로딩 중...</div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="max-w-full max-h-full touch-none"
            style={{ cursor: 'crosshair' }}
          />
        )}
      </div>

      {/* 도구 바 */}
      <div className="bg-white p-4 space-y-3">
        {/* 도구 선택 */}
        <div>
          <p className="text-xs text-gray-600 mb-2">도구</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTool('arrow')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                currentTool === 'arrow'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              → 화살표
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                currentTool === 'circle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              ⭕ 원
            </button>
          </div>
        </div>

        {/* 색상 선택 */}
        <div>
          <p className="text-xs text-gray-600 mb-2">색상</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentColor('#FF0000')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                currentColor === '#FF0000'
                  ? 'bg-red-500 text-white ring-2 ring-red-600'
                  : 'bg-red-500 text-white opacity-50'
              }`}
            >
              🔴 빨강
            </button>
            <button
              onClick={() => setCurrentColor('#FFFF00')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                currentColor === '#FFFF00'
                  ? 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-600'
                  : 'bg-yellow-400 text-gray-900 opacity-50'
              }`}
            >
              🟡 노랑
            </button>
            <button
              onClick={() => setCurrentColor('#0000FF')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                currentColor === '#0000FF'
                  ? 'bg-blue-500 text-white ring-2 ring-blue-600'
                  : 'bg-blue-500 text-white opacity-50'
              }`}
            >
              🔵 파랑
            </button>
          </div>
        </div>

        {/* 실행 취소/초기화 */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={marks.length === 0}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50"
          >
            ↶ 실행 취소
          </button>
          <button
            onClick={handleClear}
            disabled={marks.length === 0}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50"
          >
            🗑️ 초기화
          </button>
        </div>

        {/* 저장/취소 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            ✓ 저장
          </button>
        </div>
      </div>
    </div>
  );
}