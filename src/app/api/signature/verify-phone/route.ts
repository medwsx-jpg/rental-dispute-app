import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signId, phoneNumber } = body;

    // 유효성 검사
    if (!signId || !phoneNumber) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서명 요청 정보 조회
    const signRef = doc(db, 'signatures', signId);
    const signSnap = await getDoc(signRef);

    if (!signSnap.exists()) {
      return NextResponse.json(
        { message: '서명 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const signData = signSnap.data();

    // 만료 확인
    if (signData.expiresAt < Date.now()) {
      return NextResponse.json(
        { message: '서명 링크가 만료되었습니다.' },
        { status: 410 }
      );
    }

    // 이미 완료됨
    if (signData.status === 'completed') {
      return NextResponse.json(
        { message: '이미 서명이 완료되었습니다.' },
        { status: 400 }
      );
    }

    // 전화번호 매칭 확인
    const savedPhone = signData.signerPhone;
    const inputPhone = phoneNumber.trim();

    if (savedPhone !== inputPhone) {
      return NextResponse.json(
        { 
          success: false,
          message: `서명 요청자(${signData.signerName})가 입력한 번호와 일치하지 않습니다.`,
          requesterName: signData.signerName,
        },
        { status: 400 }
      );
    }

    // 전화번호 일치 - SMS 인증번호 발송
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리

    const messageText = `
[Record365 본인 인증]

인증번호: ${verificationCode}

3분 내에 입력해주세요.
    `.trim();

    // SMS 전송 시도 (실패해도 계속 진행)
    let smsSuccess = false;
    try {
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: inputPhone,
          message: messageText,
        }),
      });

      if (smsResponse.ok) {
        smsSuccess = true;
        console.log('✅ SMS 전송 성공');
      } else {
        console.error('⚠️ SMS 전송 실패:', await smsResponse.text());
      }
    } catch (smsError) {
      console.error('⚠️ SMS 전송 중 에러:', smsError);
    }

    // SMS 실패해도 인증번호는 반환 (개발 환경)
    console.log('📱 인증번호:', verificationCode);

    return NextResponse.json({
      success: true,
      verificationCode, // 🔥 실제 프로덕션에서는 서버에 저장하고 클라이언트에 안 보내야 함
      message: smsSuccess 
        ? '인증번호가 발송되었습니다.' 
        : '인증번호가 생성되었습니다. (SMS 전송 실패 - 개발 모드)',
      smsSuccess,
    });

  } catch (error) {
    console.error('❌ 전화번호 검증 API 에러:', error);
    
    return NextResponse.json(
      { 
        message: '전화번호 검증 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    );
  }
}