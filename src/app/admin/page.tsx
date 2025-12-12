'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';

interface User {
  id: string;
  email: string;
  nickname: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
  provider?: string;
}

interface Message {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  createdAt: number;
  status: 'unread' | 'read';
}

// 관리자 이메일 목록
const ADMIN_EMAILS = ['medws@naver.com'];

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'messages'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalRentals: 0,
    unreadMessages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const adminCheck = ADMIN_EMAILS.includes(user.email || '');
        setIsAdmin(adminCheck);
        
        if (adminCheck) {
          await loadData();
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async () => {
    try {
      // 사용자 데이터 로드
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList: User[] = [];
      usersSnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() } as User);
      });
      
      // 최신순 정렬
      userList.sort((a, b) => b.createdAt - a.createdAt);
      setUsers(userList);

      // 렌탈 데이터 로드
      const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
      const totalRentals = rentalsSnapshot.size;

      // 메시지 데이터 로드
      const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const messagesSnapshot = await getDocs(messagesQuery);
      const messageList: Message[] = [];
      messagesSnapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageList);

      // 통계 계산
      const freeUsers = userList.filter(u => !u.isPremium).length;
      const premiumUsers = userList.filter(u => u.isPremium).length;
      const unreadMessages = messageList.filter(m => m.status === 'unread').length;

      setStats({
        totalUsers: userList.length,
        freeUsers,
        premiumUsers,
        totalRentals,
        unreadMessages,
      });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다.');
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const confirmed = confirm(
      currentStatus 
        ? '이 사용자를 무료로 전환하시겠습니까?' 
        : '이 사용자를 프리미엄으로 전환하시겠습니까?'
    );
    
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        isPremium: !currentStatus,
      });
      
      alert('변경되었습니다!');
      await loadData();
    } catch (error) {
      console.error('업데이트 실패:', error);
      alert('업데이트에 실패했습니다.');
    }
  };

  const resetFreeRentals = async (userId: string) => {
    const confirmed = confirm('이 사용자의 무료 사용 횟수를 0으로 초기화하시겠습니까?');
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        freeRentalsUsed: 0,
      });
      
      alert('초기화되었습니다!');
      await loadData();
    } catch (error) {
      console.error('초기화 실패:', error);
      alert('초기화에 실패했습니다.');
    }
  };

  const toggleMessageStatus = async (messageId: string, currentStatus: 'unread' | 'read') => {
    try {
      const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
      await updateDoc(doc(db, 'messages', messageId), {
        status: newStatus,
      });
      await loadData();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const deleteMessage = async (messageId: string) => {
    const confirmed = confirm('이 메시지를 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'messages', messageId));
      alert('삭제되었습니다!');
      await loadData();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(msg =>
    msg.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">🚫</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">관리자만 접근 가능한 페이지입니다.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">🔧 관리자 페이지</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              ADMIN
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            ← 대시보드
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">👥 총 사용자</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-blue-600 mb-1">🆓 무료 사용자</p>
            <p className="text-3xl font-bold text-blue-900">{stats.freeUsers}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-purple-600 mb-1">⭐ 프리미엄</p>
            <p className="text-3xl font-bold text-purple-900">{stats.premiumUsers}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-600 mb-1">📋 렌탈 기록</p>
            <p className="text-3xl font-bold text-green-900">{stats.totalRentals}</p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-orange-600 mb-1">💬 안읽은 메시지</p>
            <p className="text-3xl font-bold text-orange-900">{stats.unreadMessages}</p>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 사용자 관리
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-6 py-4 font-medium transition relative ${
                activeTab === 'messages'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 메시지
              {stats.unreadMessages > 0 && (
                <span className="absolute top-2 right-4 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder={activeTab === 'users' ? '🔍 이메일 또는 닉네임 검색...' : '🔍 메시지 검색...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* 사용자 목록 탭 */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                사용자 목록 ({filteredUsers.length}명)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">닉네임</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">무료 사용</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">가입일</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.email}
                        {user.provider === 'kakao' && (
                          <span className="ml-2 text-xs text-yellow-600">💬</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.nickname}</td>
                      <td className="px-4 py-3 text-center">
                        {user.isPremium ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            ⭐ 프리미엄
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            🆓 무료
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {user.freeRentalsUsed} / 1
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => togglePremium(user.id, user.isPremium)}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                              user.isPremium
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {user.isPremium ? '무료로' : '프리미엄'}
                          </button>
                          {!user.isPremium && user.freeRentalsUsed > 0 && (
                            <button
                              onClick={() => resetFreeRentals(user.id)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                            >
                              초기화
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 메시지 목록 탭 */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                메시지 목록 ({filteredMessages.length}개)
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-4 hover:bg-gray-50 transition ${
                    msg.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{msg.userName}</span>
                      <span className="text-sm text-gray-500">({msg.userEmail})</span>
                      {msg.status === 'unread' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{msg.message}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleMessageStatus(msg.id, msg.status)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                        msg.status === 'unread'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {msg.status === 'unread' ? '✓ 읽음 처리' : '읽지 않음으로'}
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMessages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-500">메시지가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ 관리자 안내</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 프리미엄 전환: 사용자를 무료 ↔ 프리미엄으로 전환</li>
            <li>• 초기화: 무료 사용 횟수를 0으로 재설정 (테스트용)</li>
            <li>• 메시지: 사용자가 보낸 문의 메시지 관리</li>
            <li>• 통계는 실시간으로 업데이트됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}