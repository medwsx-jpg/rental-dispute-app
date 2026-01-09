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

    // 🔥 전화번호로 기존 회원 체크 (Admin SDK 버전)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('phoneNumber', '==', signerPhone)
      .get();

    const isExistingUser = !usersSnapshot.empty;

    console.log(`📋 회원 체크: ${signerPhone} → ${isExistingUser ? '기존 회원' : '신규'}`);

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
      isExistingUser,
    };

    // 🔥 Admin SDK로 Firestore에 저장
    await adminDb.collection('signatures').doc(signId).set(signatureRequest);

    // 🔥 SMS 메시지 분기
    const messageText = isExistingUser
      ? `[Record365 전자계약]

서명 요청이 있습니다.

📦 렌탈: ${rentalData.title}
📅 기간: ${new Date(rentalData.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(rentalData.endDate).toLocaleDateString('ko-KR')}

✅ 이미 가입된 회원이시네요!
서명 후 로그인하시면 확인하실 수 있습니다.

${signUrl}

⏰ 유효기간: 3일`
      : `[Record365 전자계약]

서명 요청이 있습니다.

📦 렌탈: ${rentalData.title}
📅 기간: ${new Date(rentalData.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(rentalData.endDate).toLocaleDateString('ko-KR')}

서명 후 회원가입하시면 
언제든 이 기록을 확인하실 수 있습니다.

${signUrl}

⏰ 유효기간: 3일`;

    // 🔥 SMS/카카오톡 발송
    if (method === 'sms' || method === 'kakao') {
      try {
        const { SolapiMessageService } = require('solapi');
        
        const messageService = new SolapiMessageService(
          process.env.SOLAPI_API_KEY,
          process.env.SOLAPI_API_SECRET
        );

        const cleanPhone = signerPhone.replace(/-/g, '');

        // 📱 SMS 발송
        if (method === 'sms') {
          await messageService.sendOne({
            to: cleanPhone,
            from: process.env.SOLAPI_SENDER_PHONE,
            text: messageText,
          });

          console.log('✅ SMS 발송 성공');
        }
        // 💬 카카오톡 발송
        else if (method === 'kakao') {
          // 🔥 요청자 닉네임 조회
          let requesterName = '요청자';
          try {
            const requesterDoc = await adminDb.collection('users').doc(rentalData.userId).get();
            if (requesterDoc.exists) {
              const requesterData = requesterDoc.data();
              requesterName = requesterData?.nickname || requesterData?.email?.split('@')[0] || '요청자';
            }
          } catch (error) {
            console.log('⚠️ 요청자 정보 조회 실패, 기본값 사용');
          }

          // 렌탈 유형 한글 변환
          const getRentalTypeName = (type: string) => {
            const types: { [key: string]: string } = {
              car: '렌터카',
              house: '부동산',
              goods: '물품',
            };
            return types[type] || '렌탈';
          };

          // 날짜 포맷팅 (2025.01.10 형식)
          const formatDate = (timestamp: number) => {
            const date = new Date(timestamp);
            return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
          };

          await messageService.sendOne({
            to: cleanPhone,
            from: process.env.SOLAPI_SENDER_PHONE,
            kakaoOptions: {
              pfId: process.env.SOLAPI_KAKAO_PFID,
              templateId: process.env.SOLAPI_KAKAO_TEMPLATE,
              variables: {
                requester_name: requesterName,  // 🔥 조회한 닉네임 사용
                rental_type: getRentalTypeName(rentalData.type),
                rental_title: rentalData.title,
                start_date: formatDate(rentalData.startDate),
                end_date: formatDate(rentalData.endDate),
                signature_link: signUrl,
              },
            },
          });

          console.log('✅ 카카오톡 발송 성공');
        }

      } catch (error: any) {
        console.error(`❌ ${method === 'kakao' ? '카카오톡' : 'SMS'} 발송 실패:`, error);
        
        // 🔥 카카오톡 실패 시 SMS로 폴백
        if (method === 'kakao') {
          try {
            const { SolapiMessageService } = require('solapi');
            const messageService = new SolapiMessageService(
              process.env.SOLAPI_API_KEY,
              process.env.SOLAPI_API_SECRET
            );
            
            await messageService.sendOne({
              to: signerPhone.replace(/-/g, ''),
              from: process.env.SOLAPI_SENDER_PHONE,
              text: messageText,
            });
            
            console.log('✅ SMS 폴백 발송 성공');
          } catch (fallbackError) {
            console.error('❌ SMS 폴백도 실패:', fallbackError);
          }
        }
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