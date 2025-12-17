import { NextRequest, NextResponse } from 'next/server';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  
      // ===== 디버그 코드 추가 =====
      console.log('🔍 환경변수 확인:');
      console.log('ALIGO_API_KEY:', process.env.ALIGO_API_KEY);
      console.log('ALIGO_USER_ID:', process.env.ALIGO_USER_ID);
      console.log('ALIGO_SENDER:', process.env.ALIGO_SENDER);
      // ===========================
  
      // 인증번호 발송
      if (type === 'send') {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { success: false, error: '올바른 전화번호를 입력해주세요' },
          { status: 400 }
        );
      }

      const verificationCode = generateCode();
      
      // 알리고 SMS 발송
      const aligoResponse = await fetch('https://apis.aligo.in/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            key: 'lfhvdcpywuez79gv6da8hsoagsex2u75',
            user_id: 'dioplywoood',
            sender: '01064707876',
            receiver: phone,
            msg: `[Record 365] 인증번호는 ${verificationCode} 입니다.`,
            msg_type: 'SMS',
            title: '',
          }),
      });

      const result = await aligoResponse.json();
      console.log('알리고 응답:', result);

      if (result.result_code === '1') {
        verificationCodes.set(phone, {
          code: verificationCode,
          expires: Date.now() + 5 * 60 * 1000,
        });

        return NextResponse.json({ 
          success: true,
          message: '인증번호가 발송되었습니다'
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.message || 'SMS 발송에 실패했습니다' },
          { status: 500 }
        );
      }
    }

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

      // Firebase 인증
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        phoneNumber: phone,
        provider: 'phone',
        createdAt: Date.now(),
        freeRentalsUsed: 0,
        isPremium: false,
      });

      verificationCodes.delete(phone);

      return NextResponse.json({ 
        success: true,
        userId: userId,
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