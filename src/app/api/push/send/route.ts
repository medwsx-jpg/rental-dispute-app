// src/app/api/push/send/route.ts
// OneSignal을 통해 푸시 알림을 보내는 API
// 💡 이 파일은 건들지 않아도 됩니다
// 💡 메시지 내용은 pushMessages.ts에서 관리

import { NextRequest, NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = '38d82602-0568-4f5d-b1ae-98c0abe66e97';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

interface PushNotificationPayload {
  external_user_ids?: string[];
  send_to_all?: boolean;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PushNotificationPayload = await request.json();
    
    if (!ONESIGNAL_REST_API_KEY) {
      return NextResponse.json(
        { error: 'OneSignal REST API Key not configured' },
        { status: 500 }
      );
    }

    // OneSignal API 요청 본문 구성
    const notificationPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: body.title, ko: body.title },
      contents: { en: body.message, ko: body.message },
    };

    // 대상 설정
    if (body.send_to_all) {
      notificationPayload.included_segments = ['All'];
    } else if (body.external_user_ids && body.external_user_ids.length > 0) {
      notificationPayload.include_aliases = {
        external_id: body.external_user_ids,
      };
      notificationPayload.target_channel = 'push';
    } else {
      return NextResponse.json(
        { error: 'No target specified. Use external_user_ids or send_to_all' },
        { status: 400 }
      );
    }

    // 클릭 시 이동 URL
    if (body.url) {
      notificationPayload.url = body.url;
    }

    // 추가 데이터
    if (body.data) {
      notificationPayload.data = body.data;
    }

    // OneSignal API 호출
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      notification_id: result.id,
      recipients: result.recipients,
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
