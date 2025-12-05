'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Rental, FREE_RENTAL_LIMIT, PRICE_PER_RENTAL } from '@/types/rental';
import { requestNotificationPermission, checkExpirationsDaily } from '@/lib/notifications';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadRentals(currentUser.uid);
        checkNotificationPermission();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (rentals.length > 0 && notificationEnabled) {
      checkExpirationsDaily(rentals);
      
      const interval = setInterval(() => {
        checkExpirationsDaily(rentals);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [rentals, notificationEnabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    
    if (granted) {
      alert('알림이 활성화되었습니다! 계약 만료 3일 전부터 알림을 받을 수 있습니다.');
      checkExpirationsDaily(rentals);
    } else {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
    }
  };

  const loadRentals = (userId: string) => {
    const q = query(
      collection(db, 'rentals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rentalList: Rental[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'deleted') {
          rentalList.push({ id: doc.id, ...data } as Rental);
        }
      });
      setRentals(rentalList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleNewRental = () => {
    if (rentals.length >= FREE_RENTAL_LIMIT) {
      const confirmed = confirm(
        `무료 사용량(${FREE_RENTAL_LIMIT}개)을 초과했습니다.\n\n추가 렌탈은 건당 ${PRICE_PER_RENTAL.toLocaleString()}원이 부과됩니다.\n계속하시겠습니까?`
      );
      if (!confirmed) return;
    }
    router.push('/rental/new');
  };

  const getStatusBadge = (rental: Rental) => {
    const now = Date.now();
    const endDate = rental.endDate;
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (rental.status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">완료</span>;
    }
    if (daysLeft < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">만료됨</span>;
    }
    if (daysLeft <= 3) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⚠️ {daysLeft}일 남음</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{daysLeft}일 남음</span>;
  };

  const getProgressInfo = (rental: Rental) => {
    const beforeDone = rental.checkIn.completedAt !== null;
    const afterDone = rental.checkOut.completedAt !== null;

    if (afterDone) return { text: '✅ Before/After 완료', color: 'text-green-600' };
    if (beforeDone) return { text: '📸 After 대기중', color: 'text-orange-600' };
    return { text: '📷 Before 대기중', color: 'text-blue-600' };
  };

  const getActionButton = (rental: Rental) => {
    const beforeDone = rental.checkIn.completedAt !== null;
    const afterDone = rental.checkOut.completedAt !== null;

    if (afterDone) {
      return (
        <button
          onClick={() => router.push(`/rental/${rental.id}/compare`)}
          className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          🔍 비교 보기
        </button>
      );
    }
    if (beforeDone) {
      return (
        <button
          onClick={() => router.push(`/rental/${rental.id}/checkout`)}
          className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          📤 After 촬영
        </button>
      );
    }
    return (
      <button
        onClick={() => router.push(`/rental/${rental.id}/checkin`)}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        📥 Before 촬영
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/community')}
            className="text-lg font-bold text-gray-900 hover:text-blue-600 transition"
          >
            💬 게시판
          </button>
          <div className="relative user-menu-container">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-sm text-gray-700">내정보</span>
              <span className="text-xs">{showUserMenu ? '▲' : '▼'}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">로그인 계정</p>
                  <p className="text-sm text-gray-900 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  🚪 로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {!notificationEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">🔔 만료일 알림</h3>
                <p className="text-sm text-yellow-700">
                  계약 만료 3일 전부터 알림을 받으려면 알림을 활성화하세요.
                </p>
              </div>
              <button
                onClick={handleEnableNotifications}
                className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 whitespace-nowrap"
              >
                알림 켜기
              </button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">무료 사용량</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.min(rentals.length, FREE_RENTAL_LIMIT)} / {FREE_RENTAL_LIMIT}개
              </p>
            </div>
            {rentals.length >= FREE_RENTAL_LIMIT && (
              <span className="text-xs text-blue-600">추가 건당 {PRICE_PER_RENTAL.toLocaleString()}원</span>
            )}
          </div>
        </div>

        <button
          onClick={handleNewRental}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg mb-6 hover:bg-blue-700 transition"
        >
          + 새 렌탈 등록
        </button>

        {rentals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500">등록된 렌탈이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">위 버튼을 눌러 첫 렌탈을 등록하세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => {
              const progress = getProgressInfo(rental);
              return (
                <div key={rental.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{rental.type === 'car' ? '🚗' : '🏠'}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{rental.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(rental.startDate).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(rental.endDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(rental)}
                      <button
                        onClick={() => router.push(`/rental/${rental.id}/edit`)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                        title="수정"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${progress.color}`}>{progress.text}</span>
                    <span className="text-xs text-gray-400">
                      Before {rental.checkIn.photos.length}장 / After {rental.checkOut.photos.length}장
                    </span>
                  </div>

                  {getActionButton(rental)}
                </div>
              );
            })}
          </div>
        )}

<div className="mt-8 bg-white rounded-lg shadow-sm p-6 text-center">
          <h3 className="font-medium text-gray-900 mb-2">💬 문의하기</h3>
          <p className="text-sm text-gray-600 mb-4">
            앱 사용 중 문제가 있거나 제안사항이 있으신가요?
          </p>
          
            <a href="mailto:medws@naver.com?subject=Record%20365%20문의"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            📧 개발자에게 이메일 보내기
          </a>
          <p className="text-xs text-gray-500 mt-3">medws@naver.com</p>
        </div>
      </main>
    </div>
  );
}