// types/user.ts

export type UserTier = 'free' | 'paid' | 'premium';

export interface UserData {
  email: string;
  nickname: string;
  phoneNumber?: string;
  userId?: string;
  
  // 🔥 등급 관리
  userTier: UserTier;  // 'free' | 'paid' | 'premium'
  
  // 🔥 사용 횟수
  freeRentalsUsed: number;  // 0-1 (무료 사용자)
  paidRentalsTotal: number;  // 1회권 총 결제 횟수
  premiumRentalsUsed: number;  // 0-10 (프리미엄 사용자)
  
  // 🔥 데이터 보관 정책
  dataRetentionDays: number;  // 180(6개월) or 365(12개월)
  
  // 메타데이터
  createdAt: number;
  updatedAt?: number;
  
  // 🔥 기존 필드 (호환성 유지)
  isPremium: boolean;  // userTier === 'premium'
  
  // 기타 필드들
  provider?: string;
  userType?: 'individual' | 'business';
  businessInfo?: {
    businessType: 'car_rental' | 'real_estate' | 'goods_rental';
    companyName: string;
  };
  marketingAgreed?: boolean;
  marketingAgreedAt?: number;
  notificationDays?: number;
}

// 🔥 등급별 설정
export const USER_TIER_CONFIG = {
  free: {
    name: '무료 사용자',
    icon: '🆓',
    color: 'blue',
    maxRentals: 1,
    dataRetentionDays: 180,  // 6개월
    dataRetentionMonths: 6,
    price: 0,
    description: '무료로 1건 체험',
  },
  paid: {
    name: '1회 이용권',
    icon: '💰',
    color: 'green',
    maxRentals: Infinity,  // 무제한 (결제할 때마다)
    dataRetentionDays: 180,  // 6개월
    dataRetentionMonths: 6,
    pricePerRental: 9800,
    description: '건당 결제',
  },
  premium: {
    name: '프리미엄 (10회)',
    icon: '⭐',
    color: 'purple',
    maxRentals: 10,
    dataRetentionDays: 365,  // 12개월
    dataRetentionMonths: 12,
    price: 49000,
    description: '10건 패키지',
    savings: '50% 할인',
  },
} as const;

// 🔥 헬퍼 함수들
export const getUserTierConfig = (tier: UserTier) => {
  return USER_TIER_CONFIG[tier];
};

export const canCreateRental = (userData: UserData): { allowed: boolean; reason?: string } => {
  if (userData.userTier === 'free') {
    if (userData.freeRentalsUsed >= 1) {
      return {
        allowed: false,
        reason: '무료 1건을 모두 사용하셨습니다. 추가 이용권을 구매해주세요.',
      };
    }
    return { allowed: true };
  }
  
  if (userData.userTier === 'paid') {
    // 1회권은 결제 후 사용 (항상 허용, 결제 유도)
    return { allowed: true };
  }
  
  if (userData.userTier === 'premium') {
    if (userData.premiumRentalsUsed >= 10) {
      return {
        allowed: false,
        reason: '프리미엄 10건을 모두 사용하셨습니다. 추가 이용권을 구매해주세요.',
      };
    }
    return { allowed: true };
  }
  
  return { allowed: false, reason: '알 수 없는 오류' };
};

export const getRemainingRentals = (userData: UserData): number => {
  if (userData.userTier === 'free') {
    return Math.max(0, 1 - userData.freeRentalsUsed);
  }
  
  if (userData.userTier === 'paid') {
    return Infinity;  // 무제한
  }
  
  if (userData.userTier === 'premium') {
    return Math.max(0, 10 - userData.premiumRentalsUsed);
  }
  
  return 0;
};

export const getDataRetentionInfo = (userData: UserData): string => {
  const config = getUserTierConfig(userData.userTier);
  return `렌탈 종료 후 ${config.dataRetentionMonths}개월`;
};