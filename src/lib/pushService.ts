// src/lib/pushService.ts
// 푸시 알림 발송 서비스
// 💡 발송 로직만 담당, 메시지 내용은 pushMessages.ts에서 관리

import { PushMessage } from './pushMessages';

// ========================================
// 타입 정의
// ========================================

interface SendPushOptions {
  // 특정 사용자에게 발송 (Firebase UID)
  userIds?: string[];
  // 모든 구독자에게 발송
  sendToAll?: boolean;
}

interface SendPushResult {
  success: boolean;
  notificationId?: string;
  recipients?: number;
  error?: string;
}

// ========================================
// 푸시 발송 함수
// ========================================

/**
 * 푸시 알림 발송
 * @param message - pushMessages.ts에서 가져온 메시지 객체
 * @param options - 발송 대상 옵션
 */
export const sendPush = async (
  message: PushMessage,
  options: SendPushOptions
): Promise<SendPushResult> => {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: message.title,
        message: message.message,
        url: message.url,
        data: message.data,
        external_user_ids: options.userIds,
        send_to_all: options.sendToAll,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('푸시 발송 실패:', result);
      return {
        success: false,
        error: result.error || '푸시 발송에 실패했습니다.',
      };
    }

    return {
      success: true,
      notificationId: result.notification_id,
      recipients: result.recipients,
    };
  } catch (error) {
    console.error('푸시 발송 에러:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
};

// ========================================
// 편의 함수들
// ========================================

/**
 * 특정 사용자에게 푸시 발송
 */
export const sendPushToUser = async (
  message: PushMessage,
  userId: string
): Promise<SendPushResult> => {
  return sendPush(message, { userIds: [userId] });
};

/**
 * 여러 사용자에게 푸시 발송
 */
export const sendPushToUsers = async (
  message: PushMessage,
  userIds: string[]
): Promise<SendPushResult> => {
  return sendPush(message, { userIds });
};

/**
 * 모든 구독자에게 푸시 발송 (공지사항 등)
 */
export const sendPushToAll = async (
  message: PushMessage
): Promise<SendPushResult> => {
  return sendPush(message, { sendToAll: true });
};

// ========================================
// 사용 예시
// ========================================
/*
import { CONTRACT_MESSAGES, SIGNATURE_MESSAGES } from '@/lib/pushMessages';
import { sendPushToUser, sendPushToAll } from '@/lib/pushService';

// 1. 특정 사용자에게 계약 만료 알림
const msg = CONTRACT_MESSAGES.expiringSoon('강남 오피스텔', 3);
await sendPushToUser(msg, 'firebase_user_uid');

// 2. 서명 완료 알림
const signMsg = SIGNATURE_MESSAGES.completed('김철수', '렌터카 K5');
await sendPushToUser(signMsg, 'owner_user_uid');

// 3. 전체 공지
const noticeMsg = SYSTEM_MESSAGES.notice('서버 점검 안내');
await sendPushToAll(noticeMsg);
*/
