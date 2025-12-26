'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

type Step = 'loading' | 'verify' | 'info' | 'photos' | 'sign' | 'complete';

export default function SignaturePage() {
  const router = useRouter();
  const params = useParams();
  const signId = params.signId as string;

  const [step, setStep] = useState<Step>('loading');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 서명 요청 데이터
  const [signData, setSignData] = useState<any>(null);

  // Step 1: 전화번호 검증
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [savedVerificationCode, setSavedVerificationCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Step 2: 서명자 정보
  const [signerName, setSignerName] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 3: 사진 확인
  const [photosConfirmed, setPhotosConfirmed] = useState(false);

  // Step 4: 서명
  const signaturePadRef = useRef<SignatureCanvas>(null);

  // Step 5: 완료 후 가입 권유
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  useEffect(() => {
    loadSignatureData();
  }, [signId]);

  const loadSignatureData = async () => {
    try {
      const response = await fetch(`/api/signature/info?signId=${signId}`);
      
      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 410) {
          alert('서명 링크가 만료되었습니다.');
          return;
        }
        
        if (error.completed) {
          alert('이미 서명이 완료되었습니다.');
          return;
        }
        
        throw new Error(error.message);
      }

      const data = await response.json();
      setSignData(data);
      setSignerName(data.signerName); // 미리 채워놓기
      setStep('verify');
    } catch (error) {
      console.error('서명 정보 로딩 실패:', error);
      alert('서명 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 포맷팅
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
    setPhoneNumber(formatted);
  };

  // 전화번호 검증 및 인증번호 발송
  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('올바른 전화번호 형식이 아닙니다.\n예: 010-1234-5678');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signature/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signId,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      // 인증번호 저장 (실제로는 서버에 저장해야 함)
      setSavedVerificationCode(data.verificationCode);
      alert('인증번호가 발송되었습니다.');
    } catch (error) {
      console.error('전화번호 검증 실패:', error);
      alert('전화번호 검증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      alert('인증번호를 입력해주세요.');
      return;
    }

    if (verificationCode !== savedVerificationCode) {
      alert('인증번호가 일치하지 않습니다.');
      return;
    }

    setPhoneVerified(true);
    setStep('info');
  };

  // 서명자 정보 확인
  const handleNextToPhotos = () => {
    if (!signerName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (signData?.rental?.type === 'house' && !signerAddress.trim()) {
      alert('렌탈할 집 주소를 입력해주세요.');
      return;
    }

    if (!agreedToTerms) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setStep('photos');
  };

  // 사진 확인 완료
  const handleNextToSign = () => {
    if (!photosConfirmed) {
      alert('사진 확인 체크박스를 선택해주세요.');
      return;
    }

    setStep('sign');
  };

  // 서명 지우기
  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  // 서명 완료
  const handleCompleteSignature = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('서명을 해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      // 서명 이미지 추출
      const signatureImage = signaturePadRef.current?.toDataURL();

      // IP 주소 및 UserAgent
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = navigator.userAgent;

      // 서명 제출
      const response = await fetch('/api/signature/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signId,
          signerName,
          signerAddress: signData?.rental?.type === 'house' ? signerAddress : null,
          signatureImage,
          ipAddress,
          userAgent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setStep('complete');
      setShowJoinPrompt(true);
    } catch (error) {
      console.error('서명 제출 실패:', error);
      alert('서명 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 가입 페이지로 이동
  const handleJoin = () => {
    router.push('/register');
  };

  // 종료
  const handleSkip = () => {
    setShowJoinPrompt(false);
  };

  if (loading && step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Step 1: 전화번호 검증
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📸</div>
            <h1 className="text-xl font-bold text-gray-900">Record365 전자서명</h1>
            <p className="text-sm text-gray-600 mt-2">
              {signData?.rental?.title}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="font-medium text-gray-900 mb-4">📱 본인 확인</h2>
            <p className="text-sm text-gray-600 mb-4">
              서명하실 분의 전화번호로 인증이 필요합니다
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={13}
                  disabled={phoneVerified}
                />
              </div>

              {!phoneVerified && (
                <button
                  onClick={handleSendVerificationCode}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? '발송 중...' : '인증번호 받기'}
                </button>
              )}

              {savedVerificationCode && !phoneVerified && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">인증번호</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6자리 입력"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    확인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 서명자 정보
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">✍️</div>
            <h1 className="text-xl font-bold text-gray-900">서명자 정보</h1>
          </div>

          <div className="space-y-4 mb-6">
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

            {signData?.rental?.type === 'house' && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  렌탈할 집 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signerAddress}
                  onChange={(e) => setSignerAddress(e.target.value)}
                  placeholder="예: 서울시 강남구 역삼동 123-45"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                개인정보 수집 및 이용에 동의합니다 (필수)
              </span>
            </label>
          </div>

          <button
            onClick={handleNextToPhotos}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Before 사진 확인
  if (step === 'photos') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold text-gray-900">📸 렌탈 시작 상태 확인</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <h2 className="font-medium text-gray-900">렌탈 정보</h2>
              <p className="text-sm text-gray-600 mt-1">{signData?.rental?.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(signData?.rental?.startDate).toLocaleDateString('ko-KR')} ~ {new Date(signData?.rental?.endDate).toLocaleDateString('ko-KR')}
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Before 사진 ({signData?.rental?.checkIn?.photos?.length || 0}장)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {signData?.rental?.checkIn?.photos?.map((photo: any, index: number) => (
                  <div key={index}>
                    <img
                      src={photo.url}
                      alt={`Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {photo.notes && (
                      <p className="text-xs text-gray-600 mt-1">📝 {photo.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={photosConfirmed}
                onChange={(e) => setPhotosConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                ✅ 위 사진의 상태를 확인했으며, 렌탈 시작에 동의합니다
              </span>
            </label>
          </div>

          <button
            onClick={handleNextToSign}
            disabled={!photosConfirmed}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            서명하기
          </button>
        </main>
      </div>
    );
  }

  // Step 4: 전자 서명
  if (step === 'sign') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">✍️</div>
            <h1 className="text-xl font-bold text-gray-900">전자 서명</h1>
            <p className="text-sm text-gray-600 mt-2">
              손가락이나 마우스로 서명해주세요
            </p>
          </div>

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

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleClearSignature}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              지우기
            </button>
            <button
              onClick={handleCompleteSignature}
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? '제출 중...' : '완료'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: 완료
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900">서명 완료!</h1>
            <p className="text-gray-600 mt-2">
              서명이 안전하게 저장되었습니다
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">📄 계약 정보</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 서명자: {signerName}</p>
              <p>• 렌탈: {signData?.rental?.title}</p>
              <p>• 기간: {new Date(signData?.rental?.startDate).toLocaleDateString('ko-KR')} ~ {new Date(signData?.rental?.endDate).toLocaleDateString('ko-KR')}</p>
              <p>• 일시: {new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>

          {showJoinPrompt && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-2">🎉 Record365에 가입하시겠습니까?</h3>
              <p className="text-sm text-gray-600 mb-4">
                가입하시면 렌탈 기록을 관리하고 언제든 확인서를 다시 확인할 수 있습니다
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  다음에 하기
                </button>
                <button
                  onClick={handleJoin}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  가입하기 →
                </button>
              </div>
            </div>
          )}

          {!showJoinPrompt && (
            <p className="text-center text-sm text-gray-500">
              이 창을 닫으셔도 됩니다
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}