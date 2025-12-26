import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      signId, 
      signerName, 
      signerAddress, // 월세인 경우만
      signatureImage,
      ipAddress,
      userAgent,
    } = body;

    // 유효성 검사
    if (!signId || !signerName || !signatureImage) {
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

    // 서명 데이터
    const signature = {
      signerName,
      signerPhone: signData.signerPhone,
      signerAddress: signerAddress || null,
      signatureImage,
      signedAt: Date.now(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    };

    // signatures 컬렉션 업데이트
    await updateDoc(signRef, {
      signature,
      status: 'completed',
      completedAt: Date.now(),
    });

    // rentals 컬렉션 업데이트
    const rentalRef = doc(db, 'rentals', signData.rentalId);
    const rentalSnap = await getDoc(rentalRef);

    if (rentalSnap.exists()) {
      await updateDoc(rentalRef, {
        'checkIn.signatureRequest': {
          signId,
          signerName,
          signerPhone: signData.signerPhone,
          requestedAt: signData.requestedAt,
          completedAt: Date.now(),
        },
        'checkIn.partnerSignature': signature,
      });
    }

    return NextResponse.json({
      success: true,
      message: '서명이 완료되었습니다.',
    });

  } catch (error) {
    console.error('서명 제출 API 에러:', error);
    
    return NextResponse.json(
      { message: '서명 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}