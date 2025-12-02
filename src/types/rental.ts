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
  
  export interface Rental {
    id?: string;
    userId: string;
    type: 'car' | 'house';
    title: string;
    startDate: number;
    endDate: number;
    checkIn: {
      photos: Photo[];
      completedAt: number | null;
      signature?: string;
    };
    checkOut: {
      photos: Photo[];
      completedAt: number | null;
      signature?: string;
    };
    status: 'active' | 'completed';
    createdAt: number;
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
  
  export const FREE_RENTAL_LIMIT = 1;
  export const PRICE_PER_RENTAL = 2000;