'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

const ADMIN_EMAILS = ['medws1@naver.com'];

interface RentalData {
  id: string;
  userId: string;
  type: string;
  title: string;
  startDate: number;
  endDate: number;
  status: string;
  createdAt: number;
  checkIn: {
    photos: any[];
    completedAt: number | null;
  };
  checkOut: {
    photos: any[];
    completedAt: number | null;
  };
  userEmail?: string;
  userName?: string;
}

export default function AdminRentalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<RentalData[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<RentalData[]>([]);
  const [selectedRentals, setSelectedRentals] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  
  // 필터
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // 사용자 목록
  const [users, setUsers] = useState<Array<{ email: string; uid: string }>>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (userData?.isAdmin || ADMIN_EMAILS.includes(currentUser.email || '')) {
          setUser(currentUser);
          loadRentals();
          loadUsers();
        } else {
          alert('접근 권한이 없습니다.');
          router.push('/dashboard');
        }
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [rentals, filterUser, filterStatus, filterDateFrom, filterDateTo]);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList: Array<{ email: string; uid: string }> = [];
      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        userList.push({ email: data.email, uid: docSnap.id });
      });
      setUsers(userList);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
    }
  };

  const loadRentals = () => {
    const q = query(
      collection(db, 'rentals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rentalList: RentalData[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        if (data.status !== 'deleted') {
          const rental: RentalData = {
            id: docSnap.id,
            userId: data.userId || '',
            type: data.type || '',
            title: data.title || '',
            startDate: data.startDate || 0,
            endDate: data.endDate || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt || 0,
            checkIn: data.checkIn || { photos: [], completedAt: null },
            checkOut: data.checkOut || { photos: [], completedAt: null },
          };
          
          // 사용자 정보 가져오기
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              rental.userEmail = userData.email;
              rental.userName = userData.nickname;
            }
          } catch (error) {
            console.error('사용자 정보 로드 실패:', error);
          }
          
          rentalList.push(rental);
        }
      }
      
      setRentals(rentalList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const applyFilters = () => {
    let filtered = [...rentals];

    // 사용자 필터
    if (filterUser !== 'all') {
      filtered = filtered.filter(r => r.userId === filterUser);
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // 날짜 필터
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom).getTime();
      filtered = filtered.filter(r => r.createdAt >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo).getTime() + (24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => r.createdAt < toDate);
    }

    setFilteredRentals(filtered);
  };

  const handleSelectAll = () => {
    if (selectedRentals.size === filteredRentals.length) {
      setSelectedRentals(new Set());
    } else {
      setSelectedRentals(new Set(filteredRentals.map(r => r.id)));
    }
  };

  const handleSelectRental = (id: string) => {
    const newSelected = new Set(selectedRentals);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRentals(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedRentals.size === 0) {
      alert('삭제할 렌탈을 선택해주세요.');
      return;
    }

    const confirmed = confirm(
      `선택한 ${selectedRentals.size}건의 렌탈을 삭제하시겠습니까?\n\n` +
      '⚠️ 이 작업은 되돌릴 수 없습니다!'
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedRentals).map(id =>
        deleteDoc(doc(db, 'rentals', id))
      );
      
      await Promise.all(deletePromises);
      
      alert(`${selectedRentals.size}건의 렌탈이 삭제되었습니다.`);
      setSelectedRentals(new Set());
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = confirm(
      `전체 ${filteredRentals.length}건의 렌탈을 삭제하시겠습니까?\n\n` +
      '⚠️ 이 작업은 되돌릴 수 없습니다!\n' +
      '⚠️ 현재 필터가 적용된 결과만 삭제됩니다.'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      '정말로 삭제하시겠습니까?\n\n' +
      '한 번 더 확인합니다!'
    );

    if (!doubleConfirm) return;

    setDeleting(true);
    try {
      const deletePromises = filteredRentals.map(rental =>
        deleteDoc(doc(db, 'rentals', rental.id))
      );
      
      await Promise.all(deletePromises);
      
      alert(`${filteredRentals.length}건의 렌탈이 삭제되었습니다.`);
      setSelectedRentals(new Set());
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByUser = async () => {
    if (filterUser === 'all') {
      alert('먼저 사용자를 선택해주세요.');
      return;
    }

    const userRentals = rentals.filter(r => r.userId === filterUser);
    const userEmail = users.find(u => u.uid === filterUser)?.email || '선택한 사용자';

    const confirmed = confirm(
      `${userEmail}의 렌탈 ${userRentals.length}건을 모두 삭제하시겠습니까?\n\n` +
      '⚠️ 이 작업은 되돌릴 수 없습니다!'
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const deletePromises = userRentals.map(rental =>
        deleteDoc(doc(db, 'rentals', rental.id))
      );
      
      await Promise.all(deletePromises);
      
      alert(`${userRentals.length}건의 렌탈이 삭제되었습니다.`);
      setFilterUser('all');
      setSelectedRentals(new Set());
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; color: string } } = {
      pending: { text: '진행중', color: 'bg-blue-100 text-blue-700' },
      completed: { text: '완료', color: 'bg-green-100 text-green-700' },
    };
    
    const badge = badges[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getRentalIcon = (type: string) => {
    if (type === 'car') return '🚗';
    if (type === 'house') return '🏠';
    if (type === 'goods') return '📦';
    return '📋';
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin')} className="text-gray-600 hover:text-gray-900">
                ← 뒤로
              </button>
              <h1 className="text-xl font-bold text-gray-900">📋 렌탈 관리</h1>
            </div>
            <div className="text-sm text-gray-600">
              전체: {rentals.length}건 | 필터: {filteredRentals.length}건
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">🔍 필터</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 사용자 필터 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">사용자</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="pending">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>

            {/* 날짜 필터 (시작) */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">생성일 (시작)</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 날짜 필터 (종료) */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">생성일 (종료)</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 필터 초기화 */}
          <div className="mt-4">
            <button
              onClick={() => {
                setFilterUser('all');
                setFilterStatus('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              🔄 필터 초기화
            </button>
          </div>
        </div>

        {/* 작업 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">⚙️ 작업</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRentals.size === 0 || deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              🗑️ 선택 삭제 ({selectedRentals.size})
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={filteredRentals.length === 0 || deleting}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ⚠️ 필터 결과 전체 삭제 ({filteredRentals.length})
            </button>

            <button
              onClick={handleDeleteByUser}
              disabled={filterUser === 'all' || deleting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              👤 선택 사용자 렌탈 전체 삭제
            </button>
          </div>

          {deleting && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">삭제 중...</span>
            </div>
          )}
        </div>

        {/* 렌탈 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">📋 렌탈 목록</h2>
            
            {filteredRentals.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRentals.size === filteredRentals.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">전체 선택</span>
              </label>
            )}
          </div>

          {filteredRentals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">조건에 맞는 렌탈이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRentals.map((rental) => (
                <div
                  key={rental.id}
                  className={`border rounded-lg p-4 transition ${
                    selectedRentals.has(rental.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRentals.has(rental.id)}
                      onChange={() => handleSelectRental(rental.id)}
                      className="mt-1 w-4 h-4"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{getRentalIcon(rental.type)}</span>
                            <h3 className="font-medium text-gray-900">{rental.title}</h3>
                            {getStatusBadge(rental.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            👤 {rental.userEmail || rental.userName || '알 수 없음'}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/rental/${rental.id}/compare`)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          자세히 →
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          📅 계약: {new Date(rental.startDate).toLocaleDateString('ko-KR')} ~ {new Date(rental.endDate).toLocaleDateString('ko-KR')}
                        </p>
                        <p>
                          📸 Before {rental.checkIn.photos.length}장 / After {rental.checkOut.photos.length}장
                        </p>
                        <p>
                          🕐 생성: {new Date(rental.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}