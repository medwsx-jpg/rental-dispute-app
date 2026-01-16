// src/lib/pushMessages.ts
// 푸시 알림 메시지 템플릿 모음
// 💡 메시지 내용 수정은 이 파일만 수정하면 됩니다!

export interface PushMessage {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

// ========================================
// 📅 계약 관련 알림
// ========================================

export const CONTRACT_MESSAGES = {
  // 계약 만료 임박 알림
  expiringSoon: (rentalTitle: string, daysLeft: number): PushMessage => ({
    title: `⚠️ 계약 만료 ${daysLeft}일 전`,
    message: `"${rentalTitle}" 계약이 ${daysLeft}일 후 만료됩니다. After 촬영을 준비하세요!`,
    url: '/dashboard',
  }),

  // 계약 만료일 당일
  expiringToday: (rentalTitle: string): PushMessage => ({
    title: '🚨 오늘 계약 만료!',
    message: `"${rentalTitle}" 계약이 오늘 만료됩니다. 반납 전 After 촬영을 잊지 마세요!`,
    url: '/dashboard',
  }),

  // 계약 만료됨
  expired: (rentalTitle: string): PushMessage => ({
    title: '⏰ 계약 만료됨',
    message: `"${rentalTitle}" 계약이 만료되었습니다. After 촬영을 완료해주세요.`,
    url: '/dashboard',
  }),
};

// ========================================
// ✍️ 서명 관련 알림
// ========================================

export const SIGNATURE_MESSAGES = {
  // 서명 요청 받음
  requested: (requesterName: string, rentalTitle: string): PushMessage => ({
    title: '✍️ 서명 요청',
    message: `${requesterName}님이 "${rentalTitle}" 렌탈 서명을 요청했습니다.`,
    url: '/dashboard',
  }),

  // 상대방 서명 완료
  completed: (signerName: string, rentalTitle: string): PushMessage => ({
    title: '✅ 서명 완료',
    message: `${signerName}님이 "${rentalTitle}" 서명을 완료했습니다.`,
    url: '/dashboard',
  }),

  // 서명 거부됨
  rejected: (signerName: string, rentalTitle: string): PushMessage => ({
    title: '❌ 서명 거부',
    message: `${signerName}님이 "${rentalTitle}" 서명을 거부했습니다.`,
    url: '/dashboard',
  }),
};

// ========================================
// 📸 촬영 관련 알림
// ========================================

export const PHOTO_MESSAGES = {
  // Before 촬영 완료
  beforeCompleted: (rentalTitle: string): PushMessage => ({
    title: '📸 Before 촬영 완료',
    message: `"${rentalTitle}" Before 촬영이 완료되었습니다.`,
    url: '/dashboard',
  }),

  // After 촬영 완료
  afterCompleted: (rentalTitle: string): PushMessage => ({
    title: '✅ After 촬영 완료',
    message: `"${rentalTitle}" 렌탈 기록이 완료되었습니다. 비교 화면에서 확인하세요!`,
    url: '/dashboard',
  }),

  // 촬영 리마인더
  reminder: (rentalTitle: string, type: 'before' | 'after'): PushMessage => ({
    title: `📷 ${type === 'before' ? 'Before' : 'After'} 촬영 필요`,
    message: `"${rentalTitle}" ${type === 'before' ? 'Before' : 'After'} 촬영을 아직 하지 않았습니다.`,
    url: '/dashboard',
  }),
};

// ========================================
// 💬 커뮤니티 관련 알림
// ========================================

export const COMMUNITY_MESSAGES = {
  // 내 글에 댓글
  newComment: (postTitle: string, commenterName: string): PushMessage => ({
    title: '💬 새 댓글',
    message: `${commenterName}님이 "${postTitle}" 글에 댓글을 남겼습니다.`,
    url: '/community',
  }),

  // 내 댓글에 답글
  newReply: (commenterName: string): PushMessage => ({
    title: '💬 새 답글',
    message: `${commenterName}님이 회원님의 댓글에 답글을 남겼습니다.`,
    url: '/community',
  }),

  // 좋아요 알림
  liked: (postTitle: string): PushMessage => ({
    title: '❤️ 좋아요',
    message: `"${postTitle}" 글에 좋아요가 추가되었습니다.`,
    url: '/community',
  }),
};

// ========================================
// 📢 시스템 / 공지 알림
// ========================================

export const SYSTEM_MESSAGES = {
  // 환영 메시지 (OneSignal 대시보드에서 설정했지만 백업용)
  welcome: (): PushMessage => ({
    title: '🎉 Record365에 오신 것을 환영합니다!',
    message: '렌탈 분쟁, 이제 기록으로 해결하세요.',
    url: '/',
  }),

  // 공지사항
  notice: (noticeTitle: string): PushMessage => ({
    title: '📢 공지사항',
    message: noticeTitle,
    url: '/notice',
  }),

  // 업데이트 안내
  update: (updateContent: string): PushMessage => ({
    title: '🆕 새로운 기능',
    message: updateContent,
    url: '/',
  }),

  // 프로모션 / 이벤트
  promotion: (promoTitle: string, promoContent: string): PushMessage => ({
    title: `🎁 ${promoTitle}`,
    message: promoContent,
    url: '/payment',
  }),
};

// ========================================
// 💳 결제 관련 알림
// ========================================

export const PAYMENT_MESSAGES = {
  // 결제 완료
  completed: (planName: string): PushMessage => ({
    title: '✅ 결제 완료',
    message: `${planName} 결제가 완료되었습니다. 감사합니다!`,
    url: '/dashboard',
  }),

  // 이용권 소진 임박
  quotaLow: (remaining: number): PushMessage => ({
    title: '⚠️ 이용권 소진 임박',
    message: `남은 이용권이 ${remaining}건입니다. 추가 구매를 고려해주세요.`,
    url: '/payment',
  }),

  // 이용권 모두 소진
  quotaEmpty: (): PushMessage => ({
    title: '🚨 이용권 소진',
    message: '이용권을 모두 사용했습니다. 추가 구매 후 이용해주세요.',
    url: '/payment',
  }),
};
