const CACHE_NAME = 'rental-check-v1';
const urlsToCache = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch 이벤트 (네트워크 우선, 실패 시 캐시)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API 요청 또는 POST 요청은 캐시하지 않음
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // GET 요청만 캐시
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시에 저장
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request);
      })
  );
});