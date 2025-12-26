import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signId = searchParams.get('signId');

    if (!signId) {
      return NextResponse.json(
        { message: '서명 ID가 필요합니다.' },
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
        { 
          expired: true,
          message: '서명 링크가 만료되었습니다.',
          expiresAt: signData.expiresAt,
        },
        { status: 410 }
      );
    }

    // 이미 완료됨
    if (signData.status === 'completed') {
      return NextResponse.json(
        { 
          completed: true,
          message: '이미 서명이 완료되었습니다.',
          completedAt: signData.completedAt,
        },
        { status: 200 }
      );
    }

    // 렌탈 정보 조회
    const rentalRef = doc(db, 'rentals', signData.rentalId);
    const rentalSnap = await getDoc(rentalRef);

    if (!rentalSnap.exists()) {
      return NextResponse.json(
        { message: '렌탈 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const rentalData = rentalSnap.data();

    // 응답 데이터
    const responseData = {
      signId,
      signerName: signData.signerName,
      signerPhone: signData.signerPhone,
      rental: {
        title: rentalData.title,
        type: rentalData.type,
        startDate: rentalData.startDate,
        endDate: rentalData.endDate,
        checkIn: {
          photos: rentalData.checkIn.photos || [],
          completedAt: rentalData.checkIn.completedAt,
        },
      },
      expiresAt: signData.expiresAt,
      createdAt: signData.requestedAt,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('서명 정보 조회 API 에러:', error);
    
    return NextResponse.json(
      { message: '서명 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}