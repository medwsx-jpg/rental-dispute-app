import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// 고유 ID 생성 함수
function generateSignId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sign_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rentalId, signerName, signerPhone, method } = body;

    // 필수값 검증
    if (!rentalId || !signerName || !signerPhone || !method) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(signerPhone)) {
      return NextResponse.json(
        { message: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 🔥 Admin SDK 사용
    const rentalDoc = await adminDb.collection('rentals').doc(rentalId).get();

    if (!rentalDoc.exists) {
      return NextResponse.json(
        { message: '렌탈을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const rentalData = rentalDoc.data();

    // Before 촬영 완료 확인
    if (!rentalData?.checkIn || !rentalData.checkIn.completedAt) {
      return NextResponse.json(
        { message: 'Before 촬영이 완료되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 고유 서명 ID 생성
    const signId = generateSignId();

    // 서명 URL 생성
    const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.record365.co.kr'}/sign/${signId}`;

    // 만료 기한 설정 (3일)
    const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000);

    // 서명 요청 데이터
    const signatureRequest = {
      id: signId,
      rentalId,
      rentalTitle: rentalData.title,
      rentalType: rentalData.type,
      requestedBy: rentalData.userId,
      requestedAt: Date.now(),
      signerName,
      signerPhone,
      method,
      signUrl,
      expiresAt,
      status: 'pending',
      signature: null,
    };

    // 🔥 Admin SDK로 Firestore에 저장
    await adminDb.collection('signatures').doc(signId).set(signatureRequest);

    // SMS/카카오톡 발송 준비
    const messageText = `
[Record365 전자계약]

렌탈 계약 서명을 요청받았습니다.

📦 렌탈: ${rentalData.title}
📅 기간: ${new Date(rentalData.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(rentalData.endDate).toLocaleDateString('ko-KR')}

아래 링크에서 확인 및 서명해주세요
${signUrl}

⏰ 유효기간: 3일
    `.trim();

    if (method === 'sms') {
      // SMS 발송 (send-sms API 사용)
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: signerPhone,  // 🔥 phoneNumber → phone
          message: messageText,
        }),
      });

      if (!smsResponse.ok) {
        console.error('SMS 발송 실패');
        // SMS 실패해도 서명 요청은 생성됨
      }
    } else if (method === 'kakao') {
      // 카카오톡 알림톡 발송 (TODO: 추후 구현)
      // 현재는 SMS로 대체
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: signerPhone,  // 🔥 phoneNumber → phone
          message: messageText,
        }),
      });

      if (!smsResponse.ok) {
        console.error('SMS 발송 실패 (카카오톡 대체)');
      }
    }

    return NextResponse.json({
      success: true,
      signId,
      signUrl,
      expiresAt,
    });

  } catch (error) {
    console.error('서명 요청 API 에러:', error);

    return NextResponse.json(
      { message: '서명 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}