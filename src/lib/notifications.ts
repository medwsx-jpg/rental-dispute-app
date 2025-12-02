export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
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
  
  export const scheduleExpirationNotification = (title: string, endDate: number) => {
    if (Notification.permission !== 'granted') {
      return;
    }
  
    const now = Date.now();
    const timeUntilExpiration = endDate - now;
    const daysUntilExpiration = Math.ceil(timeUntilExpiration / (1000 * 60 * 60 * 24));
  
    // 3일 전 알림
    if (daysUntilExpiration === 3) {
      new Notification('렌탈 만료 알림', {
        body: `"${title}" 계약이 3일 후 만료됩니다.`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }
  
    // 1일 전 알림
    if (daysUntilExpiration === 1) {
      new Notification('렌탈 만료 알림', {
        body: `"${title}" 계약이 내일 만료됩니다. After 촬영을 준비하세요!`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }
  
    // 당일 알림
    if (daysUntilExpiration === 0) {
      new Notification('렌탈 만료 알림', {
        body: `"${title}" 계약이 오늘 만료됩니다! After 촬영을 진행하세요.`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        requireInteraction: true,
      });
    }
  };
  
  export const checkExpirationsDaily = (rentals: any[]) => {
    rentals.forEach((rental) => {
      if (rental.status !== 'completed') {
        scheduleExpirationNotification(rental.title, rental.endDate);
      }
    });
  };