'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title: string;
}

export default function SignatureModal({ isOpen, onClose, onSave, title }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('서명을 입력해주세요.');
      return;
    }

    const signatureData = sigCanvas.current?.toDataURL();
    if (signatureData) {
      onSave(signatureData);
      handleClear();
    }
  };

  const handleBeginStroke = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">아래 박스에 서명해주세요</p>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-48',
                style: { touchAction: 'none' }
              }}
              onBegin={handleBeginStroke}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            🔄 다시 그리기
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
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

        <p className="text-xs text-gray-500 mt-4 text-center">
          서명은 계약의 법적 효력을 강화하는 데 사용됩니다.
        </p>
      </div>
    </div>
  );
}