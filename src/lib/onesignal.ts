// src/lib/onesignal.ts
// OneSignal 클라이언트 측 기능
// 💡 초기화, 권한 요청, 구독 관리만 담당
// 💡 메시지 내용은 pushMessages.ts에서 관리
// 💡 발송 로직은 pushService.ts에서 관리

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = '38d82602-0568-4f5d-b1ae-98c0abe66e97';

// ========================================
// 초기화
// ========================================

/**
 * OneSignal 초기화
 * - OneSignalProvider에서 호출됨
 */
export const initOneSignal = () => {
  if (typeof window === 'undefined') return;
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      notifyButton: {
        enable: false, // 플로팅 버튼 비활성화
      },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },
      welcomeNotification: {
        disable: true, // OneSignal 대시보드에서 설정
      },
    });
    
    console.log('✅ OneSignal initialized');
  });
};

// ========================================
// 권한 요청
// ========================================

/**
 * 푸시 알림 권한 요청
 * @returns 권한 허용 여부
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.log('OneSignal not loaded');
    return false;
  }
  
  try {
    const permission = await window.OneSignal.Notifications.requestPermission();
    console.log('Push permission:', permission);
    return permission;
  } catch (error) {
    console.error('Push permission error:', error);
    return false;
  }
};

// ========================================
// 구독 상태 확인
// ========================================

/**
 * 현재 푸시 구독 상태 확인
 */
export const isPushSubscribed = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false;
  }
  
  try {
    const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
    return isSubscribed;
  } catch (error) {
    console.error('Check subscription error:', error);
    return false;
  }
};

/**
 * 푸시 구독 해제
 */
export const unsubscribePush = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.User.PushSubscription.optOut();
    console.log('Push unsubscribed');
  } catch (error) {
    console.error('Unsubscribe error:', error);
  }
};

/**
 * 푸시 다시 구독
 */
export const resubscribePush = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.User.PushSubscription.optIn();
    console.log('Push resubscribed');
  } catch (error) {
    console.error('Resubscribe error:', error);
  }
};

// ========================================
// 사용자 연동
// ========================================

/**
 * 외부 사용자 ID 설정 (Firebase UID 연동)
 * - 로그인 시 호출
 */
export const setExternalUserId = async (userId: string): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.login(userId);
    console.log('External user ID set:', userId);
  } catch (error) {
    console.error('Set external user ID error:', error);
  }
};

/**
 * 사용자 연동 해제
 * - 로그아웃 시 호출
 */
export const logoutOneSignal = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.logout();
    console.log('OneSignal user logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// ========================================
// 사용자 태그
// ========================================

/**
 * 사용자 태그 설정 (세그먼트 타겟팅용)
 */
export const setUserTags = async (tags: Record<string, string>): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.User.addTags(tags);
    console.log('User tags set:', tags);
  } catch (error) {
    console.error('Set user tags error:', error);
  }
};

/**
 * 사용자 태그 제거
 */
export const removeUserTags = async (tagKeys: string[]): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) return;
  
  try {
    await window.OneSignal.User.removeTags(tagKeys);
    console.log('User tags removed:', tagKeys);
  } catch (error) {
    console.error('Remove user tags error:', error);
  }
};
