import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();

// 슬랙 웹훅 URL (환경변수)
const SLACK_WEBHOOK_SIGNUP = defineString('SLACK_WEBHOOK_SIGNUP');
const SLACK_WEBHOOK_MESSAGE = defineString('SLACK_WEBHOOK_MESSAGE');
const SLACK_WEBHOOK_ERROR = defineString('SLACK_WEBHOOK_ERROR');

// 슬랙 메시지 전송 함수
async function sendSlackMessage(webhookUrl: string, message: object) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      console.error('슬랙 전송 실패:', response.status);
    }
  } catch (error) {
    console.error('슬랙 전송 에러:', error);
  }
}

// 오류 알림 전송 함수
async function sendErrorAlert(webhookUrl: string, location: string, errorMessage: string, details?: string) {
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 오류 발생!',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*📍 위치:*\n${location}`,
          },
          {
            type: 'mrkdwn',
            text: `*⏰ 시간:*\n${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💬 에러 메시지:*\n\`\`\`${errorMessage}\`\`\``,
        },
      },
    ],
  };

  if (details) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📋 상세 정보:*\n${details}`,
      },
    });
  }

  await sendSlackMessage(webhookUrl, message);
}

// ========================================
// 1️⃣ 신규 회원 가입 알림
// ========================================
export const onNewUserSignup = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) return;
      
      const newUser = snap.data();
      const userId = event.params.userId;

      const message = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 신규 회원 가입!',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*👤 닉네임:*\n${newUser.nickname || '없음'}`,
              },
              {
                type: 'mrkdwn',
                text: `*📧 이메일:*\n${newUser.email || '없음'}`,
              },
              {
                type: 'mrkdwn',
                text: `*📱 전화번호:*\n${newUser.phoneNumber || '없음'}`,
              },
              {
                type: 'mrkdwn',
                text: `*🔑 가입방법:*\n${newUser.provider === 'kakao' ? '카카오' : '이메일'}`,
              },
              {
                type: 'mrkdwn',
                text: `*👥 사용자 타입:*\n${newUser.userType === 'business' ? '사업자' : '개인'}`,
              },
              {
                type: 'mrkdwn',
                text: `*📢 마케팅 동의:*\n${newUser.marketingAgreed ? '✅ 동의' : '❌ 미동의'}`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `🆔 UID: ${userId} | ⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
              },
            ],
          },
        ],
      };

      await sendSlackMessage(SLACK_WEBHOOK_SIGNUP.value(), message);
      console.log('✅ 신규 가입 알림 전송 완료:', newUser.email);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 신규 가입 알림 실패:', error);
      await sendErrorAlert(SLACK_WEBHOOK_ERROR.value(), 'onNewUserSignup', errorMessage, `userId: ${event.params.userId}`);
    }
  }
);

// ========================================
// 2️⃣ 사용자 메시지 수신 알림
// ========================================
export const onNewMessage = onDocumentUpdated(
  {
    document: 'messages/{threadId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    try {
      const beforeSnap = event.data?.before;
      const afterSnap = event.data?.after;
      if (!beforeSnap || !afterSnap) return;

      const beforeData = beforeSnap.data();
      const afterData = afterSnap.data();

      const beforeCount = beforeData.messages?.length || 0;
      const afterCount = afterData.messages?.length || 0;

      if (afterCount > beforeCount) {
        const newMessage = afterData.messages[afterCount - 1];

        if (newMessage.from === 'user') {
          const message = {
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '💬 새 메시지 도착!',
                  emoji: true,
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*👤 보낸 사람:*\n${afterData.userName || '알 수 없음'}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*📧 이메일:*\n${afterData.userEmail || '없음'}`,
                  },
                ],
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*📝 메시지 내용:*\n>>> ${newMessage.message}`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} | 안읽은 메시지: ${afterData.unreadByAdmin}개`,
                  },
                ],
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: '📋 관리자 페이지에서 확인',
                      emoji: true,
                    },
                    url: 'https://record365.co.kr/admin',
                  },
                ],
              },
            ],
          };

          await sendSlackMessage(SLACK_WEBHOOK_MESSAGE.value(), message);
          console.log('✅ 메시지 알림 전송 완료:', afterData.userEmail);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 메시지 알림 실패:', error);
      await sendErrorAlert(SLACK_WEBHOOK_ERROR.value(), 'onNewMessage', errorMessage, `threadId: ${event.params.threadId}`);
    }
  }
);

// 새 메시지 스레드 생성 시에도 알림
export const onNewMessageThread = onDocumentCreated(
  {
    document: 'messages/{threadId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) return;
      
      const data = snap.data();
      const firstMessage = data.messages?.[0];

      if (firstMessage && firstMessage.from === 'user') {
        const message = {
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '💬 새 문의 등록!',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*👤 보낸 사람:*\n${data.userName || '알 수 없음'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*📧 이메일:*\n${data.userEmail || '없음'}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📝 메시지 내용:*\n>>> ${firstMessage.message}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '📋 관리자 페이지에서 확인',
                    emoji: true,
                  },
                  url: 'https://record365.co.kr/admin',
                },
              ],
            },
          ],
        };

        await sendSlackMessage(SLACK_WEBHOOK_MESSAGE.value(), message);
        console.log('✅ 새 문의 알림 전송 완료:', data.userEmail);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 새 문의 알림 실패:', error);
      await sendErrorAlert(SLACK_WEBHOOK_ERROR.value(), 'onNewMessageThread', errorMessage, `threadId: ${event.params.threadId}`);
    }
  }
);

// ========================================
// 3️⃣ 테스트용 함수
// ========================================
export const testSlackAlert = onRequest(
  { region: 'asia-northeast3' },
  async (req, res) => {
    try {
      await sendErrorAlert(
        SLACK_WEBHOOK_ERROR.value(),
        'testSlackAlert (테스트)',
        '이것은 테스트 오류 메시지입니다.',
        '테스트를 위해 수동으로 호출된 함수입니다.'
      );
      res.send('✅ 테스트 알림이 슬랙으로 전송되었습니다!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send('❌ 오류: ' + errorMessage);
    }
  }
);