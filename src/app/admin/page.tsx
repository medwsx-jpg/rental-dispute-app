'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc, getDoc, arrayUnion } from 'firebase/firestore';

interface User {
  id: string;
  email?: string;
  userId?: string;            // 🔥 추가
  nickname?: string;
  phoneNumber?: string;
  freeRentalsUsed: number;
  isPremium: boolean;
  createdAt: number;
  provider?: string;
  userType?: 'individual' | 'business';  // 🔥 추가
  marketingAgreed?: boolean;   // 🔥 추가
  marketingAgreedAt?: number;  // 🔥 추가
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

// 관리자 이메일 목록
const ADMIN_EMAILS = ['medws1@naver.com'];

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userMessages, setUserMessages] = useState<Record<string, MessageThread>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalRentals: 0,
    unreadMessages: 0,
    // 🔥 신규 통계
    marketingAgreedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    emailUsers: 0,
    kakaoUsers: 0,
    individualUsers: 0,
    businessUsers: 0,
    // 🔥 렌탈 통계
    carRentals: 0,
    houseRentals: 0,
    goodsRentals: 0,
    activeContracts: 0,
    expiringContracts: 0,
    completedContracts: 0,
    topCarModels: [] as Array<{ model: string; count: number }>,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserThread, setSelectedUserThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 🔥 렌탈 데이터 저장 (CSV용)
  const [rentalsData, setRentalsData] = useState<any[]>([]);
  
  // 🔥 필터 상태 추가
  const [filterProvider, setFilterProvider] = useState<'all' | 'email' | 'kakao'>('all');
  const [filterUserType, setFilterUserType] = useState<'all' | 'individual' | 'business'>('all');
  const [filterMarketing, setFilterMarketing] = useState<'all' | 'agreed' | 'not_agreed'>('all');

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
      
      userList.sort((a, b) => b.createdAt - a.createdAt);
      setUsers(userList);

      // 🔥 렌탈 데이터 로드 (deleted 제외)
      const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
      let totalRentals = 0;
      let carRentals = 0;
      let houseRentals = 0;
      let goodsRentals = 0;
      let activeContracts = 0;
      let expiringContracts = 0;
      let completedContracts = 0;
      const carModels: { [key: string]: number } = {};
      const rentalsList: any[] = [];  // 🔥 렌탈 데이터 저장용

      const now = Date.now();
      const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

      rentalsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'deleted') {
          totalRentals++;

          // 🔥 렌탈 데이터 저장
          rentalsList.push({
            id: doc.id,
            ...data,
          });

          // 렌탈 유형별 집계
          if (data.type === 'car') {
            carRentals++;
            // 자동차 모델 집계
            if (data.carModel) {
              carModels[data.carModel] = (carModels[data.carModel] || 0) + 1;
            }
          } else if (data.type === 'house') {
            houseRentals++;
          } else if (data.type === 'goods') {
            goodsRentals++;
          }

          // 계약 현황 집계
          const endDate = data.endDate || 0;
          if (data.status === 'completed') {
            completedContracts++;
          } else if (endDate < now) {
            completedContracts++;
          } else if (endDate <= sevenDaysFromNow) {
            expiringContracts++;
          } else {
            activeContracts++;
          }
        }
      });

      // 🔥 렌탈 데이터에 사용자 이메일 추가
      const rentalsWithUserEmail = rentalsList.map(rental => {
        const user = userList.find(u => u.id === rental.userId);
        return {
          ...rental,
          userEmail: user?.email || user?.userId || '-',
        };
      });
      setRentalsData(rentalsWithUserEmail);

      // 인기 차량 모델 TOP 5
      const topCarModels = Object.entries(carModels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([model, count]) => ({ model, count }));

      // 메시지 데이터 로드
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      const messagesMap: Record<string, MessageThread> = {};
      let totalUnread = 0;
      
      messagesSnapshot.forEach((doc) => {
        const data = doc.data() as MessageThread;
        messagesMap[doc.id] = data;
        totalUnread += data.unreadByAdmin || 0;
      });
      
      setUserMessages(messagesMap);

      // 🔥 확장된 통계 계산
      const now2 = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = now2 - (7 * 24 * 60 * 60 * 1000);
      const monthStart = now2 - (30 * 24 * 60 * 60 * 1000);

      const freeUsers = userList.filter(u => !u.isPremium).length;
      const premiumUsers = userList.filter(u => u.isPremium).length;
      
      const marketingAgreedUsers = userList.filter(u => u.marketingAgreed === true).length;
      const newUsersToday = userList.filter(u => u.createdAt >= todayStart).length;
      const newUsersThisWeek = userList.filter(u => u.createdAt >= weekStart).length;
      const newUsersThisMonth = userList.filter(u => u.createdAt >= monthStart).length;
      
      const emailUsers = userList.filter(u => u.provider === 'email').length;
      const kakaoUsers = userList.filter(u => u.provider === 'kakao').length;
      
      const individualUsers = userList.filter(u => u.userType === 'individual').length;
      const businessUsers = userList.filter(u => u.userType === 'business').length;

      setStats({
        totalUsers: userList.length,
        freeUsers,
        premiumUsers,
        totalRentals,
        unreadMessages: totalUnread,
        marketingAgreedUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        emailUsers,
        kakaoUsers,
        individualUsers,
        businessUsers,
        // 🔥 렌탈 통계 추가
        carRentals,
        houseRentals,
        goodsRentals,
        activeContracts,
        expiringContracts,
        completedContracts,
        topCarModels,
      });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다.');
    }
  };

  // 🔥 CSV 다운로드 함수
  const downloadCSV = (type: 'all' | 'marketing') => {
    let exportUsers = users;
    
    if (type === 'marketing') {
      exportUsers = users.filter(u => u.marketingAgreed === true);
    }

    if (exportUsers.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // CSV 헤더
    const headers = [
      '아이디',
      '이메일',
      '전화번호',
      '닉네임',
      '가입경로',
      '사용자타입',
      '마케팅동의',
      '프리미엄',
      '무료사용',
      '가입일'
    ].join(',');

    // CSV 데이터
    const rows = exportUsers.map(u => [
      u.userId || '-',
      u.email || '-',
      u.phoneNumber || '-',
      u.nickname || '-',
      u.provider === 'kakao' ? '카카오' : u.provider === 'email' ? '이메일' : '-',
      u.userType === 'individual' ? '개인' : u.userType === 'business' ? '사업자' : '-',
      u.marketingAgreed ? '동의' : '미동의',
      u.isPremium ? '프리미엄' : '무료',
      `${u.freeRentalsUsed}/1`,
      new Date(u.createdAt).toLocaleDateString('ko-KR')
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `회원목록_${type === 'marketing' ? '마케팅동의자' : '전체'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`${exportUsers.length}명의 데이터를 다운로드했습니다.`);
  };

  // 🔥 렌탈 CSV 다운로드 함수
  const downloadRentalsCSV = (type: 'all' | 'car') => {
    let exportRentals = rentalsData;
    
    if (type === 'car') {
      exportRentals = rentalsData.filter(r => r.type === 'car');
    }

    if (exportRentals.length === 0) {
      alert('다운로드할 렌탈 데이터가 없습니다.');
      return;
    }

    // 계약 현황 계산 함수
    const getContractStatus = (rental: any) => {
      const now = Date.now();
      const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
      const endDate = rental.endDate || 0;
      
      if (rental.status === 'completed') return '완료';
      if (endDate < now) return '완료';
      if (endDate <= sevenDaysFromNow) return '만료예정(7일)';
      return '진행중';
    };

    // CSV 헤더
    const headers = type === 'car' 
      ? ['제목', '렌탈유형', '자동차모델', '계약시작일', '계약종료일', '계약현황', '사용자이메일', '생성일'].join(',')
      : ['제목', '렌탈유형', '계약시작일', '계약종료일', '계약현황', '사용자이메일', '생성일'].join(',');

    // CSV 데이터
    const rows = exportRentals.map(r => {
      const rentalType = r.type === 'car' ? '렌터카' : r.type === 'house' ? '부동산' : r.type === 'goods' ? '물품' : '-';
      const baseData = [
        r.title || '-',
        rentalType,
        ...(type === 'car' ? [r.carModel || '-'] : []),
        new Date(r.startDate).toLocaleDateString('ko-KR'),
        new Date(r.endDate).toLocaleDateString('ko-KR'),
        getContractStatus(r),
        r.userEmail || '-',
        new Date(r.createdAt).toLocaleDateString('ko-KR')
      ];
      return baseData.join(',');
    });

    const csv = [headers, ...rows].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `렌탈목록_${type === 'car' ? '렌터카' : '전체'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`${exportRentals.length}건의 렌탈 데이터를 다운로드했습니다.`);
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

  const handleOpenMessages = async (userId: string) => {
    const thread = userMessages[userId];
    if (!thread) {
      alert('이 사용자는 아직 메시지를 보내지 않았습니다.');
      return;
    }

    setSelectedUserThread(thread);
    setShowMessageModal(true);

    if (thread.unreadByAdmin > 0) {
      try {
        const messageRef = doc(db, 'messages', userId);
        const updatedMessages = thread.messages.map(msg => ({
          ...msg,
          readByAdmin: true
        }));
        
        await updateDoc(messageRef, {
          messages: updatedMessages,
          unreadByAdmin: 0
        });
        
        await loadData();
      } catch (error) {
        console.error('읽음 처리 실패:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim().length === 0 || !selectedUserThread) return;
    
    setSendingMessage(true);
    
    try {
      const messageRef = doc(db, 'messages', selectedUserThread.userId);
      const messageData: Message = {
        from: 'admin',
        message: newMessage.trim(),
        timestamp: Date.now(),
        readByAdmin: true,
        readByUser: false,
      };

      await updateDoc(messageRef, {
        messages: arrayUnion(messageData),
        unreadByUser: selectedUserThread.unreadByUser + 1
      });
      
      setNewMessage('');
      
      const updatedDoc = await getDoc(messageRef);
      if (updatedDoc.exists()) {
        setSelectedUserThread(updatedDoc.data() as MessageThread);
      }
      
      await loadData();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSendingMessage(false);
    }
  };

  // 🔥 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    // 검색어 필터
    const matchSearch = 
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.nickname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // 가입 경로 필터
    if (filterProvider !== 'all' && user.provider !== filterProvider) return false;

    // 사용자 타입 필터
    if (filterUserType !== 'all' && user.userType !== filterUserType) return false;

    // 마케팅 동의 필터
    if (filterMarketing === 'agreed' && !user.marketingAgreed) return false;
    if (filterMarketing === 'not_agreed' && user.marketingAgreed) return false;

    return true;
  });

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/rentals')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              📋 렌탈 관리
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              ← 대시보드
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 🔥 확장된 통계 카드 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 전체 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-pink-600 mb-1">📧 마케팅 동의자</p>
              <p className="text-3xl font-bold text-pink-900">{stats.marketingAgreedUsers}</p>
              <p className="text-xs text-pink-600 mt-1">
                {stats.totalUsers > 0 ? Math.round((stats.marketingAgreedUsers / stats.totalUsers) * 100) : 0}% 동의율
              </p>
            </div>
            <div className="bg-cyan-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-cyan-600 mb-1">🆕 신규 가입</p>
              <div className="space-y-1">
                <p className="text-sm text-cyan-900">오늘: <strong>{stats.newUsersToday}</strong>명</p>
                <p className="text-sm text-cyan-900">이번 주: <strong>{stats.newUsersThisWeek}</strong>명</p>
                <p className="text-sm text-cyan-900">이번 달: <strong>{stats.newUsersThisMonth}</strong>명</p>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-yellow-600 mb-1">🔑 가입 경로</p>
              <div className="space-y-1">
                <p className="text-sm text-yellow-900">이메일: <strong>{stats.emailUsers}</strong>명</p>
                <p className="text-sm text-yellow-900">카카오: <strong>{stats.kakaoUsers}</strong>명</p>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-indigo-600 mb-1">👤 사용자 타입</p>
              <div className="space-y-1">
                <p className="text-sm text-indigo-900">개인: <strong>{stats.individualUsers}</strong>명</p>
                <p className="text-sm text-indigo-900">사업자: <strong>{stats.businessUsers}</strong>명</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 렌탈 통계 섹션 추가 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 렌탈 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 렌탈 유형별 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-3 font-semibold">📊 렌탈 유형별</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">🚗 렌터카</span>
                  <span className="text-lg font-bold text-blue-900">{stats.carRentals}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">🏠 부동산</span>
                  <span className="text-lg font-bold text-green-900">{stats.houseRentals}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">📦 물품</span>
                  <span className="text-lg font-bold text-purple-900">{stats.goodsRentals}건</span>
                </div>
              </div>
            </div>

            {/* 계약 현황 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-3 font-semibold">📅 계약 현황</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">✅ 진행중</span>
                  <span className="text-lg font-bold text-blue-900">{stats.activeContracts}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">⚠️ 만료 예정(7일)</span>
                  <span className="text-lg font-bold text-orange-900">{stats.expiringContracts}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">🏁 완료</span>
                  <span className="text-lg font-bold text-gray-900">{stats.completedContracts}건</span>
                </div>
              </div>
            </div>

            {/* 인기 차량 모델 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-3 font-semibold">🚗 인기 차량 모델 TOP 5</p>
              <div className="space-y-2">
                {stats.topCarModels.length > 0 ? (
                  stats.topCarModels.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {index + 1}. {item.model}
                      </span>
                      <span className="text-sm font-bold text-blue-900">{item.count}건</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    렌터카 데이터가 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 CSV 다운로드 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">💾 데이터 내보내기</h3>
          
          {/* 회원 데이터 */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2 font-medium">👥 회원 데이터</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => downloadCSV('all')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm"
              >
                📥 전체 회원 CSV ({users.length}명)
              </button>
              <button
                onClick={() => downloadCSV('marketing')}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition text-sm"
              >
                📧 마케팅 동의자 CSV ({stats.marketingAgreedUsers}명)
              </button>
            </div>
          </div>

          {/* 렌탈 데이터 */}
          <div>
            <p className="text-xs text-gray-600 mb-2 font-medium">📋 렌탈 데이터</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => downloadRentalsCSV('all')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
              >
                📥 전체 렌탈 CSV ({stats.totalRentals}건)
              </button>
              <button
                onClick={() => downloadRentalsCSV('car')}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition text-sm"
              >
                🚗 렌터카만 CSV ({stats.carRentals}건)
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="🔍 아이디, 이메일, 닉네임, 전화번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            
            {/* 🔥 필터 버튼 */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">가입경로:</span>
                <button
                  onClick={() => setFilterProvider('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterProvider === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterProvider('email')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterProvider === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  이메일
                </button>
                <button
                  onClick={() => setFilterProvider('kakao')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterProvider === 'kakao' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  카카오
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">타입:</span>
                <button
                  onClick={() => setFilterUserType('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterUserType === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterUserType('individual')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterUserType === 'individual' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  개인
                </button>
                <button
                  onClick={() => setFilterUserType('business')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterUserType === 'business' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  사업자
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">마케팅:</span>
                <button
                  onClick={() => setFilterMarketing('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterMarketing === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterMarketing('agreed')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterMarketing === 'agreed' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  동의
                </button>
                <button
                  onClick={() => setFilterMarketing('not_agreed')}
                  className={`px-3 py-1 text-sm rounded-lg transition ${filterMarketing === 'not_agreed' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  미동의
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디/이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">닉네임</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">마케팅</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">무료 사용</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">메시지</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">가입일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const thread = userMessages[user.id];
                  const unreadCount = thread?.unreadByAdmin || 0;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="text-gray-900 font-medium">
                            {user.userId || user.email?.split('@')[0] || '-'}
                          </p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                        {user.provider === 'kakao' && (
                          <span className="ml-2 text-xs text-yellow-600">💬</span>
                        )}
                        {user.provider === 'email' && (
                          <span className="ml-2 text-xs text-blue-600">📧</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.phoneNumber?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.nickname || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.userType === 'individual' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            🙋 개인
                          </span>
                        ) : user.userType === 'business' ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            🏢 사업자
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.marketingAgreed ? (
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                            ✅ 동의
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            ❌ 미동의
                          </span>
                        )}
                      </td>
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
                      <td className="px-4 py-3 text-center">
                        {thread ? (
                          <button
                            onClick={() => handleOpenMessages(user.id)}
                            className="relative inline-flex items-center justify-center"
                          >
                            <span className="text-lg">💬</span>
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ 관리자 안내</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 프리미엄 전환: 사용자를 무료 ↔ 프리미엄으로 전환</li>
            <li>• 초기화: 무료 사용 횟수를 0으로 재설정 (테스트용)</li>
            <li>• 메시지: 💬 아이콘 클릭하여 사용자와 대화</li>
            <li>• CSV 다운로드: 엑셀에서 열어서 확인 가능 (한글 지원)</li>
            <li>• 통계는 실시간으로 업데이트됩니다</li>
          </ul>
        </div>
      </main>

      {/* 메시지 모달 (기존과 동일) */}
      {showMessageModal && selectedUserThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedUserThread.userName}님과의 대화
              </h2>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedUserThread(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedUserThread.messages.length > 0 ? (
                selectedUserThread.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.from === 'admin'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.from === 'admin' ? 'text-green-100' : 'text-gray-500'
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
                  <p className="text-gray-500">메시지가 없습니다.</p>
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
                  placeholder="답장을 입력하세요... (Shift+Enter로 줄바꿈)"
                  rows={2}
                  maxLength={1000}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={newMessage.trim().length === 0 || sendingMessage}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? '전송 중...' : '답장'}
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