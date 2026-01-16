'use client';

// src/components/OneSignalProvider.tsx
// OneSignal 초기화를 위한 Provider 컴포넌트

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  initOneSignal, 
  setExternalUserId, 
  logoutOneSignal, 
  setUserTags 
} from '@/lib/onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {

  // OneSignal 초기화
  useEffect(() => {
    initOneSignal();
  }, []);

  // 사용자 로그인 상태에 따라 OneSignal 사용자 연동
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 로그인 시 Firebase UID를 OneSignal에 연동
        await setExternalUserId(user.uid);
        
        // 사용자 태그 설정 (세그먼트 타겟팅용)
        await setUserTags({
          email: user.email || '',
          logged_in: 'true',
        });
      } else {
        // 로그아웃 시 OneSignal 사용자 연동 해제
        await logoutOneSignal();
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
