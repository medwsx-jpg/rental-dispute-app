import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, rentalId, areaId, timestamp, type } = await request.json();

    if (!imageBase64 || !rentalId || !areaId || !timestamp || !type) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Base64 → Buffer 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Storage 경로 설정
    const filename = `${areaId}_${timestamp}.jpg`;
    const path = `rentals/${rentalId}/${type}/${filename}`;

    // Firebase Storage에 업로드
    const bucket = adminStorage.bucket();
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
      public: true,
    });

    // 다운로드 URL 생성
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({ 
      success: true, 
      downloadURL 
    });

  } catch (error: any) {
    console.error('서버 업로드 에러:', error);
    return NextResponse.json(
      { error: error.message || '업로드 실패' },
      { status: 500 }
    );
  }
}