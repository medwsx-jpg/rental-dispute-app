'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Rental } from '@/types/rental';

export default function RequestSignaturePage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [sendMethod, setSendMethod] = useState<'kakao' | 'sms'>('sms');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadRental();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, rentalId]);

  const loadRental = async () => {
    try {
      const docRef = doc(db, 'rentals', rentalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Rental;
        setRental(data);
      } else {
        alert('렌탈을 찾을 수 없습니다.');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('렌탈 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 자동 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setSignerPhone(formatted);
  };

  const handleSendRequest = async () => {
    // 유효성 검사
    if (!signerName.trim()) {
      alert('상대방 이름을 입력해주세요.');
      return;
    }

    if (!signerPhone.trim()) {
      alert('상대방 전화번호를 입력해주세요.');
      return;
    }

    // 전화번호 형식 검증 (010-xxxx-xxxx)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(signerPhone)) {
      alert('올바른 전화번호 형식이 아닙니다.\n예: 010-1234-5678');
      return;
    }

    setSending(true);

    try {
      // 서명 요청 API 호출
      const response = await fetch('/api/signature/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          signerName: signerName.trim(),
          signerPhone: signerPhone.trim(),
          method: sendMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '서명 요청 실패');
      }

      const data = await response.json();

      // 성공
      alert(
        `✅ 서명 요청이 전송되었습니다!\n\n` +
        `${signerName}님에게 ${sendMethod === 'kakao' ? '카카오톡' : '문자'}로 ` +
        `서명 링크가 전송되었습니다.`
      );

      router.push('/dashboard');
    } catch (error) {
      console.error('서명 요청 실패:', error);
      
      let errorMsg = '서명 요청 전송에 실패했습니다.';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rental) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">📝 서명 요청</h1>
              <p className="text-sm text-gray-500">{rental.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">상대방 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="예: 김철수"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={signerPhone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={13}
              />
              <p className="text-xs text-gray-500 mt-1">
                SMS 인증에 사용됩니다
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">전송 방법</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSendMethod('sms')}
              className={`p-4 rounded-lg border-2 transition ${
                sendMethod === 'sms'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">📱</div>
              <p className="font-medium text-gray-900">문자 (SMS)</p>
              <p className="text-xs text-gray-500 mt-1">누구나 받을 수 있어요</p>
            </button>

            <button
              onClick={() => setSendMethod('kakao')}
              className={`p-4 rounded-lg border-2 transition ${
                sendMethod === 'kakao'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">💬</div>
              <p className="font-medium text-gray-900">카카오톡</p>
              <p className="text-xs text-gray-500 mt-1">빠르고 편리해요</p>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">💡 서명 요청 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {signerName || '상대방'}님에게 서명 링크가 전송됩니다</li>
            <li>• 상대방은 SMS 인증 후 서명할 수 있습니다</li>
            <li>• 서명이 완료되면 알림을 받습니다</li>
            <li>• 서명 링크는 3일 동안 유효합니다</li>
          </ul>
        </div>

        <button
          onClick={handleSendRequest}
          disabled={sending || !signerName.trim() || !signerPhone.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? '전송 중...' : '서명 요청 전송하기 →'}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          취소
        </button>
      </main>
    </div>
  );
}