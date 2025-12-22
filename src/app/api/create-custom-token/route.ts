import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, kakaoId, phoneNumber, provider, uid: providedUid } = body;

    // UID 생성 (일관성 있게)
    let uid: string;
    
    // 🔥 providedUid 체크 제거 - 항상 새로 생성
    
    // 카카오 로그인
    if (provider === 'kakao' && kakaoId) {
      uid = `kakao_${kakaoId}`;
      console.log(`✅ 카카오 UID 생성: ${uid}`);
    }
    // 전화번호 로그인 - 항상 해시 기반
    else if (provider === 'phone' && phoneNumber) {
      uid = `phone_${crypto.createHash('sha256').update(phoneNumber).digest('hex').substring(0, 20)}`;
      console.log(`✅ 전화번호 UID 생성: ${uid}`);
    }
    else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Custom Token 생성
    const customToken = await adminAuth.createCustomToken(uid);

    console.log(`✅ Custom Token 생성 완료: ${uid}`);

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