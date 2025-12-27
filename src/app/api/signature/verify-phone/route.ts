import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signId, phoneNumber } = body;

    // 필수값 검증
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

    // 전화번호 일치 - SMS 인증번호 발송 (회원가입과 동일)
    try {
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: inputPhone,
          type: 'send'
        }),
      });

      const smsResult = await smsResponse.json();

      if (smsResult.success) {
        console.log('✅ SMS 전송 성공');
        
        // ✅ 회원가입과 동일: 인증번호는 반환하지 않음!
        return NextResponse.json({
          success: true,
          message: '인증번호가 발송되었습니다.',
        });
      } else {
        console.error('❌ SMS 전송 실패:', smsResult.error);
        
        return NextResponse.json({
          success: false,
          message: '인증번호 발송에 실패했습니다. 다시 시도해주세요.',
        }, { status: 500 });
      }
    } catch (smsError) {
      console.error('❌ SMS 전송 중 에러:', smsError);
      
      return NextResponse.json({
        success: false,
        message: 'SMS 전송 중 오류가 발생했습니다.',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('🔥 전화번호 검증 API 에러:', error);
    return NextResponse.json(
      {
        message: '전화번호 검증 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    );
  }
}