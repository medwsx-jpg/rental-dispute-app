import { Rental } from '@/types/rental';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
};

export const checkExpirationsDaily = (rentals: Rental[], notificationDays: number = 3) => {
  const now = Date.now();
  
  rentals.forEach((rental) => {
    const daysLeft = Math.ceil((rental.endDate - now) / (1000 * 60 * 60 * 24));
    
    // notificationDays 이하일 때 알림
    if (daysLeft > 0 && daysLeft <= notificationDays) {
      sendNotification(
        `⚠️ 렌탈 계약 만료 ${daysLeft}일 전`,
        {
          body: `"${rental.title}" 계약이 ${daysLeft}일 후 만료됩니다.`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `rental-${rental.id}`,
        }
      );
    }
    
    // 만료된 경우
    if (daysLeft === 0) {
      sendNotification(
        '⚠️ 렌탈 계약 만료일',
        {
          body: `"${rental.title}" 계약이 오늘 만료됩니다!`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `rental-${rental.id}`,
        }
      );
    }
  });
};