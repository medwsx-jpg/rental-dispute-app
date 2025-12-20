'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Rental, FREE_RENTAL_LIMIT, PRICE_PER_RENTAL } from '@/types/rental';
import { requestNotificationPermission, checkExpirationsDaily } from '@/lib/notifications';
import InAppBrowserGuide from '@/components/InAppBrowserGuide';

interface UserData {
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
  notificationDays?: number;
}

interface Message {
  from: 'user' | 'admin';
  message: string;
  timestamp: number;
  readByAdmin: boolean;
  readByUser: boolean;
}

interface MessageThread {
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: number;
  messages: Message[];
  unreadByUser: number;
  unreadByAdmin: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [messageThread, setMessageThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notificationDays, setNotificationDays] = useState(3);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
        loadRentals(currentUser.uid);
        loadMessageThread(currentUser.uid);
        checkNotificationPermission();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (rentals.length > 0 && notificationEnabled) {
      checkExpirationsDaily(rentals, notificationDays);
      
      const interval = setInterval(() => {
        checkExpirationsDaily(rentals, notificationDays);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [rentals, notificationEnabled, notificationDays]);

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
        const data = userDoc.data() as UserData;
        setUserData(data);
        setNotificationDays(data.notificationDays || 3);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const loadMessageThread = (userId: string) => {
    const messageRef = doc(db, 'messages', userId);
    
    const unsubscribe = onSnapshot(messageRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessageThread(docSnap.data() as MessageThread);
      } else {
        setMessageThread(null);
      }
    });

    return unsubscribe;
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
      alert('알림이 활성화되었습니다! 계약 만료 전에 알림을 받을 수 있습니다.');
      checkExpirationsDaily(rentals, notificationDays);
    } else {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
    }
  };

  const handleSaveNotificationDays = async (days: number) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationDays: days
      });
      
      setNotificationDays(days);
      alert(`알림 기간이 ${days}일 전으로 설정되었습니다!`);
      setShowNotificationSettings(false);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
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

  const handleOpenMessages = async () => {
    setShowMessageModal(true);
    
    if (messageThread && messageThread.unreadByUser > 0) {
      try {
        const messageRef = doc(db, 'messages', user.uid);
        const updatedMessages = messageThread.messages.map(msg => ({
          ...msg,
          readByUser: true
        }));
        
        await updateDoc(messageRef, {
          messages: updatedMessages,
          unreadByUser: 0
        });
      } catch (error) {
        console.error('읽음 처리 실패:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim().length === 0 || !user || !userData) return;
    
    setSendingMessage(true);
    
    try {
      const messageRef = doc(db, 'messages', user.uid);
      const messageData: Message = {
        from: 'user',
        message: newMessage.trim(),
        timestamp: Date.now(),
        readByAdmin: false,
        readByUser: true,
      };

      if (messageThread) {
        await updateDoc(messageRef, {
          messages: arrayUnion(messageData),
          unreadByAdmin: messageThread.unreadByAdmin + 1
        });
      } else {
        await setDoc(messageRef, {
          userId: user.uid,
          userEmail: user.email || '이메일 없음',
          userName: userData.nickname,
          createdAt: Date.now(),
          messages: [messageData],
          unreadByUser: 0,
          unreadByAdmin: 1
        });
      }
      
      setNewMessage('');
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
    if (!userData?.isPremium && userData && userData.freeRentalsUsed >= FREE_RENTAL_LIMIT) {
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
    if (daysLeft <= notificationDays) {
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

  const getRentalIcon = (type: string) => {
    if (type === 'car') return '🚗';
    if (type === 'house') return '🏠';
    if (type === 'goods') return '📦';
    return '📋';
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
  const unreadCount = messageThread?.unreadByUser || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <InAppBrowserGuide />
      
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
      관리자에게 문의해주세요
    </p>
    <button
      onClick={() => router.push('/upgrade')}
      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
    >
      더 알아보기
    </button>
  </div>
)}
          </div>
        )}

        {!notificationEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 mb-1">🔔 만료일 알림</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  계약 만료 {notificationDays}일 전부터 알림을 받으려면 알림을 활성화하세요.
                </p>
                <button
                  onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                  className="text-xs text-yellow-800 underline hover:text-yellow-900"
                >
                  알림 기간 설정
                </button>
                {showNotificationSettings && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => handleSaveNotificationDays(days)}
                        className={`px-3 py-1 text-xs rounded-lg transition ${
                          notificationDays === days
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100'
                        }`}
                      >
                        {days}일 전
                      </button>
                    ))}
                  </div>
                )}
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

        {notificationEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-green-800 mb-1">✅ 알림 활성화됨</h3>
                <p className="text-sm text-green-700 mb-2">
                  계약 만료 {notificationDays}일 전부터 알림을 받습니다.
                </p>
                <button
                  onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                  className="text-xs text-green-800 underline hover:text-green-900"
                >
                  알림 기간 변경
                </button>
                {showNotificationSettings && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => handleSaveNotificationDays(days)}
                        className={`px-3 py-1 text-xs rounded-lg transition ${
                          notificationDays === days
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-800 border border-green-300 hover:bg-green-100'
                        }`}
                      >
                        {days}일 전
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                          <span className="text-3xl">{getRentalIcon(rental.type)}</span>
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
          
          <button
            onClick={handleOpenMessages}
            className="relative w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            💬 메시지 보내기
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </main>

      {/* 메시지 모달 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">관리자와의 대화</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messageThread && messageThread.messages.length > 0 ? (
                messageThread.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.from === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.from === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">아직 메시지가 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-2">관리자에게 첫 메시지를 보내보세요!</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  rows={2}
                  maxLength={1000}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={newMessage.trim().length === 0 || sendingMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? '전송 중...' : '전송'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {newMessage.length} / 1000자
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}