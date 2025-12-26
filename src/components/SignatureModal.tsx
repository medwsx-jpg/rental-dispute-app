'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
  title?: string;
}

export default function SignatureModal({ 
  isOpen, 
  onClose, 
  onSave, 
  title = '서명'
}: SignatureModalProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);

  if (!isOpen) return null;

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('서명을 해주세요.');
      return;
    }

    const signatureData = signaturePadRef.current?.toDataURL();
    if (signatureData) {
      onSave(signatureData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          손가락이나 마우스로 아래에 서명해주세요
        </p>

        {/* 🔥 모바일 터치 최적화: touchAction: 'none'으로 스크롤 방지 */}
        <div 
          className="border-2 border-gray-300 rounded-lg mb-4 overflow-hidden bg-white"
          style={{ touchAction: 'none' }}
        >
          <SignatureCanvas
            ref={signaturePadRef}
            canvasProps={{
              width: 400,
              height: 200,
              className: 'w-full touch-none',
              style: { touchAction: 'none' }
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            지우기
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}