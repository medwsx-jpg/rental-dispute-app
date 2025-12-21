// src/app/api/send-sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// 솔라피 SDK 임포트
const { SolapiMessageService } = require('solapi');

// 6자리 랜덤 코드 생성
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 임시 저장소
const verificationCodes = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, type } = body;

    // 인증번호 발송
    if (type === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, error: '올바른 전화번호를 입력해주세요' },
          { status: 400 }
        );
      }

      const verificationCode = generateCode();
      
      try {
        // 솔라피 메시지 서비스 초기화
        const messageService = new SolapiMessageService(
          process.env.SOLAPI_API_KEY,
          process.env.SOLAPI_API_SECRET
        );

        // SMS 발송
        const result = await messageService.sendOne({
          to: phone,
          from: process.env.SOLAPI_SENDER_PHONE,
          text: `[Record 365] 인증번호는 ${verificationCode} 입니다. 3분 내에 입력해주세요.`,
        });

        console.log('솔라피 발송 성공:', result);

        verificationCodes.set(phone, {
          code: verificationCode,
          expires: Date.now() + 3 * 60 * 1000, // 3분
        });

        return NextResponse.json({ 
          success: true,
          message: '인증번호가 발송되었습니다'
        });
      } catch (error: any) {
        console.error('솔라피 발송 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'SMS 발송에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // 인증번호 확인
    // 인증번호 확인
else if (type === 'verify') {
  if (!phone || !code) {
    return NextResponse.json(
      { success: false, error: '전화번호와 인증번호를 입력해주세요' },
      { status: 400 }
    );
  }

  const stored = verificationCodes.get(phone);

  if (!stored) {
    return NextResponse.json(
      { success: false, error: '인증번호를 먼저 요청해주세요' },
      { status: 400 }
    );
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(phone);
    return NextResponse.json(
      { success: false, error: '인증번호가 만료되었습니다' },
      { status: 400 }
    );
  }

  if (stored.code !== code) {
    return NextResponse.json(
      { success: false, error: '인증번호가 일치하지 않습니다' },
      { status: 400 }
    );
  }

  // ✅ 인증 성공 - Firebase 인증은 login 페이지에서 처리
  verificationCodes.delete(phone);

  return NextResponse.json({ 
    success: true,
    message: '인증이 완료되었습니다'
  });
}

    return NextResponse.json(
      { success: false, error: 'Invalid request type' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}