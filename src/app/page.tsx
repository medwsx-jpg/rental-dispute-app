'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ServiceSelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[480px] mx-auto">
        {/* Logo */}
        <div className="text-center mb-12">
          <Image
            src="/record365-icon.png"
            alt="Record 365"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-2xl shadow-sm"
          />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Record 365
          </h1>
          <p className="text-gray-400 mt-1 text-sm">기록하고, 매칭하고, 해결하세요</p>
        </div>

        {/* Service Cards */}
        <div className="w-full grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/clean-intro')}
            className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 active:bg-gray-100 transition-all text-center border border-gray-200 shadow-sm"
          >
            <div className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden bg-orange-50">
              <Image src="/clean-icon.png" alt="슥싹 매칭" width={64} height={64} className="object-contain" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">슥싹 매칭</h2>
            <p className="text-xs text-gray-400 mt-1">청소 전문가 매칭</p>
          </button>

          <button
            onClick={() => router.push('/rental-intro')}
            className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 active:bg-gray-100 transition-all text-center border border-gray-200 shadow-sm"
          >
            <div className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden bg-violet-50">
              <Image src="/rental-icon.png" alt="렌탈 분쟁 기록" width={64} height={64} className="object-contain" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">렌탈 분쟁 기록</h2>
            <p className="text-xs text-gray-400 mt-1">전후 상태를 사진 기록</p>
          </button>
        </div>

        <p className="text-xs text-gray-300 mt-16 text-center">
          Record 365 &copy; 2026
        </p>
      </div>
    </div>
  );
}
