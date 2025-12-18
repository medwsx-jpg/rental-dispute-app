export interface Photo {
  url: string;
  timestamp: number;
  location: {
    lat: number;
    lng: number;
  } | null;
  area: string;
  notes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  checkedAt?: number;
}

export interface AreaChecklist {
  areaId: string;
  items: ChecklistItem[];
}

export type RentalType = 'car' | 'house' | 'goods';

export interface Rental {
  id?: string;
  userId: string;
  type: RentalType;
  title: string;
  startDate: number;
  endDate: number;
  checkIn: {
    photos: Photo[];
    completedAt: number | null;
    signature?: string;
    checklists?: AreaChecklist[];
  };
  checkOut: {
    photos: Photo[];
    completedAt: number | null;
    signature?: string;
    checklists?: AreaChecklist[];
  };
  status: 'active' | 'completed';
  createdAt: number;
  customAreas?: string[];
}

export interface RentalArea {
  id: string;
  name: string;
  icon: string;
  required: boolean;
}

export const CAR_AREAS: RentalArea[] = [
  { id: 'front', name: '앞면', icon: '🚘', required: true },
  { id: 'back', name: '뒷면', icon: '🚙', required: true },
  { id: 'left', name: '좌측면', icon: '◀️', required: true },
  { id: 'right', name: '우측면', icon: '▶️', required: true },
  { id: 'dashboard', name: '계기판', icon: '🎛️', required: true },
  { id: 'interior', name: '실내', icon: '💺', required: false },
  { id: 'trunk', name: '트렁크', icon: '🧳', required: false },
  { id: 'tire', name: '타이어', icon: '⚫', required: false },
];

export const HOUSE_AREAS: RentalArea[] = [
  { id: 'living', name: '거실', icon: '🛋️', required: true },
  { id: 'kitchen', name: '주방', icon: '🍳', required: true },
  { id: 'bathroom', name: '욕실', icon: '🚿', required: true },
  { id: 'bedroom', name: '침실', icon: '🛏️', required: true },
  { id: 'entrance', name: '현관', icon: '🚪', required: false },
  { id: 'window', name: '창문/벽', icon: '🪟', required: false },
  { id: 'balcony', name: '베란다', icon: '🌿', required: false },
];

export const DEFAULT_CHECKLISTS: Record<string, Record<string, string[]>> = {
  car: {
    front: [
      '범퍼 긁힘/찍힘 확인',
      '헤드라이트 깨짐/금 확인',
      '보닛 손상 확인',
      '번호판 상태 확인',
      '그릴 손상 확인'
    ],
    back: [
      '후미등 상태 확인',
      '번호판 상태 확인',
      '범퍼 손상 확인',
      '트렁크 잠금 확인',
      '후면 유리 상태'
    ],
    left: [
      '도어 긁힘 확인',
      '사이드미러 상태',
      '휠 손상 확인',
      '타이어 상태 확인',
      '측면 유리 상태'
    ],
    right: [
      '도어 긁힘 확인',
      '사이드미러 상태',
      '휠 손상 확인',
      '타이어 상태 확인',
      '측면 유리 상태'
    ],
    dashboard: [
      '계기판 작동 확인',
      '에어컨 작동 확인',
      '오디오 작동 확인',
      '계기판 경고등 확인',
      '와이퍼 작동 확인'
    ],
    interior: [
      '시트 오염/찢어짐 확인',
      '안전벨트 작동 확인',
      '내부 청결도 확인',
      '천장 오염 확인',
      '매트 상태 확인'
    ],
    trunk: [
      '트렁크 청결도',
      '스페어 타이어 확인',
      '공구 세트 확인',
      '트렁크 조명 작동'
    ],
    tire: [
      '타이어 마모도 확인',
      '공기압 확인',
      '휠 손상 확인',
      '타이어 이물질 확인'
    ]
  },
  house: {
    living: [
      '벽지/페인트 상태',
      '바닥 긁힘/오염',
      '조명 작동 확인',
      '콘센트 작동 확인',
      '창문 잠금 확인'
    ],
    kitchen: [
      '싱크대 손상/누수',
      '가스레인지 작동',
      '환풍기 작동',
      '수도 누수 확인',
      '타일 상태 확인'
    ],
    bathroom: [
      '변기 작동/누수',
      '세면대 누수',
      '샤워기 작동',
      '타일 곰팡이 확인',
      '환풍기 작동'
    ],
    bedroom: [
      '벽지/페인트 상태',
      '바닥 상태',
      '창문 잠금',
      '조명 작동',
      '장롱/붙박이장 상태'
    ],
    entrance: [
      '현관문 잠금 확인',
      '신발장 상태',
      '바닥 상태',
      '인터폰 작동'
    ],
    window: [
      '창문 잠금 확인',
      '유리 깨짐/금 확인',
      '방충망 상태',
      '벽지/페인트 상태'
    ],
    balcony: [
      '바닥 상태',
      '난간 안전성',
      '배수구 막힘',
      '창문 잠금'
    ]
  }
};

export const FREE_RENTAL_LIMIT = 1;
export const PRICE_PER_RENTAL = 2000;