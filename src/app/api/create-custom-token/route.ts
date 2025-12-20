import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, kakaoId, phoneNumber, provider } = body;

    // UID 생성 (일관성 있게)
    let uid: string;
    
    if (provider === 'kakao' && kakaoId) {
      // 카카오: kakaoId 기반 UID
      uid = `kakao_${kakaoId}`;
    } else if (provider === 'phone' && phoneNumber) {
      // 휴대폰: 전화번호 해시 기반 UID
      uid = `phone_${crypto.createHash('sha256').update(phoneNumber).digest('hex').substring(0, 20)}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Custom Token 생성
    const customToken = await adminAuth.createCustomToken(uid);

    console.log(`✅ Custom Token 생성: ${uid}`);

    return NextResponse.json({ 
      success: true, 
      customToken,
      uid 
    });

  } catch (error: any) {
    console.error('Custom Token 생성 실패:', error);
    return NextResponse.json(
      { error: error.message || 'Token 생성 실패' },
      { status: 500 }
    );
  }
}