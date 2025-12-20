import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export const config = {
  api: {
    bodyParser: false, // 🔥 FormData 처리를 위해 비활성화
  },
};

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // 🔥 FormData 파싱
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const rentalId = formData.get('rentalId') as string;
    const areaId = formData.get('areaId') as string;
    const timestamp = formData.get('timestamp') as string;
    const type = formData.get('type') as string;

    if (!file || !rentalId || !areaId || !timestamp || !type) {
      return NextResponse.json(
        { error: '필수 파라미터 누락' },
        { status: 400 }
      );
    }

    // 🔥 File을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Firebase Storage 경로
    const path = `rentals/${rentalId}/${type}/${areaId}_${timestamp}.jpg`;
    const bucket = adminStorage.bucket();
    const storageFile = bucket.file(path);

    // 🔥 Stream으로 업로드
    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type || 'image/jpeg',
      },
      public: true,
    });

    // Public URL 생성
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({
      success: true,
      downloadURL,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '업로드 실패: ' + (error as Error).message },
      { status: 500 }
    );
  }
}