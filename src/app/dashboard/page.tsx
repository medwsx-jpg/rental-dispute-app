'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, addDoc } from 'firebase/firestore';
import { Rental, FREE_RENTAL_LIMIT, PRICE_PER_RENTAL } from '@/types/rental';
import { requestNotificationPermission, checkExpirationsDaily } from '@/lib/notifications';

interface UserData {
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
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

  const loadUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

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

  const handleSendMessage = async () => {
    if (messageText.trim().length === 0) return;
    
    setSendingMessage(true);
    
    try {
      await addDoc(collection(db, 'messages'), {
        userId: user.uid,
        userEmail: user.email || '이메일 없음',
        userName: userData?.nickname || '사용자',
        message: messageText.trim(),
        createdAt: Date.now(),
        status: 'unread',
      });
      
      alert('메시지가 전송되었습니다! 관리자가 확인 후 답변드리겠습니다.');
      setMessageText('');
      setShowMessageForm(false);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleNewRental = () => {
    // 무료 사용자: 1건 제한
    if (!userData?.isPremium && userData && userData.freeRentalsUsed >= FREE_RENTAL_LIMIT) {
      // 무료 1건 초과 시 결제 안내
      const confirmed = confirm(
        `🆓 무료 1건을 모두 사용하셨습니다!\n\n💰 추가 렌탈: 건당 ${PRICE_PER_RENTAL.toLocaleString()}원\n📅 보관 기간: 렌탈 종료 후 1개월\n\n결제 페이지로 이동하시겠습니까?`
      );
      if (confirmed) {
        router.push('/upgrade');
      }
      return;
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

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isPremium = userData.isPremium;
  const freeUsed = userData.freeRentalsUsed;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/guide')}
              className="text-lg font-bold text-gray-900 hover:text-blue-600 transition"
            >
              📖 사용가이드
            </button>
            <button 
              onClick={() => router.push('/community')}
              className="text-lg font-bold text-gray-900 hover:text-blue-600 transition"
            >
              📋 게시판
            </button>
          </div>
          <div className="relative user-menu-container">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-lg text-gray-700">내정보</span>
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

        {/* 무료/유료 상태 표시 */}
        {isPremium ? (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 mb-1">✨ 프리미엄 사용자</p>
                <p className="text-2xl font-bold text-purple-900">무제한 사용 중</p>
                <p className="text-xs text-purple-600 mt-1">📅 데이터 보관: 렌탈 종료 후 1개월</p>
              </div>
              <span className="text-4xl">⭐</span>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-blue-800">🆓 무료 사용량</p>
                <p className="text-2xl font-bold text-blue-900">
                  {freeUsed} / {FREE_RENTAL_LIMIT}건 사용
                </p>
                <p className="text-xs text-blue-600 mt-1">📅 데이터 보관: 렌탈 종료 후 6일</p>
              </div>
              {freeUsed >= FREE_RENTAL_LIMIT && (
                <span className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  무료 1건 완료
                </span>
              )}
            </div>
            
            {freeUsed >= FREE_RENTAL_LIMIT && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  💰 추가 렌탈이 필요하신가요?
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  건당 {PRICE_PER_RENTAL.toLocaleString()}원 • 렌탈 종료 후 1개월 보관
                </p>
                <button
                  onClick={() => router.push('/upgrade')}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  유료 구매하기
                </button>
              </div>
            )}
          </div>
        )}

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
                      {rental.checkIn.photos.length > 0 ? (
                        <img 
                          src={rental.checkIn.photos[0].url} 
                          alt={rental.title}
                          className="w-20 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">{rental.type === 'car' ? '🚗' : '🏠'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{rental.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(rental.startDate).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(rental.endDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* 관리자에게 메시지 보내기 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium text-gray-900 mb-2 text-center">💬 관리자에게 문의하기</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">
            앱 사용 중 문제가 있거나 제안사항이 있으신가요?
          </p>
          
          {showMessageForm ? (
            <div className="space-y-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="메시지를 입력하세요..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <div className="text-right text-xs text-gray-500 mb-2">
                {messageText.length} / 1000자
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMessageForm(false);
                    setMessageText('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  취소
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={messageText.trim().length === 0 || sendingMessage}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? '전송 중...' : '📤 전송'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMessageForm(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              💬 메시지 보내기
            </button>
          )}
        </div>
      </main>
    </div>
  );
}