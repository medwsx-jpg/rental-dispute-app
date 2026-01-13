'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { FAKE_USERS, COMMENT_POOL, PAST_POSTS, FUTURE_POSTS_BY_DATE } from './community-pool-data';

export default function CommunityPoolPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, past: 0, future: 0 });
  const [currentPostCount, setCurrentPostCount] = useState(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 현재 게시글 수 확인
  useEffect(() => {
    const checkCount = async () => {
      const snapshot = await getDocs(collection(db, 'community'));
      setCurrentPostCount(snapshot.size);
    };
    checkCount();
  }, []);

  // 랜덤 좋아요 생성 (10~20개)
  const generateLikes = () => {
    const count = Math.floor(Math.random() * 11) + 10; // 10~20
    const shuffled = [...FAKE_USERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(u => u.id);
  };

  // 랜덤 댓글 생성 (10~20개) - postTime: 게시글 작성 시간 (밀리초)
const generateComments = (postTime: number) => {
    const count = Math.floor(Math.random() * 11) + 10; // 10~20
    const comments = [];
    const shuffledUsers = [...FAKE_USERS].sort(() => Math.random() - 0.5);
    const shuffledComments = [...COMMENT_POOL].sort(() => Math.random() - 0.5);
    
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const user = shuffledUsers[i % shuffledUsers.length];
      const commentText = shuffledComments[i % shuffledComments.length];
      
      // 댓글 시간: 게시글 작성 후 ~ 현재 사이 랜덤
      const randomCommentTime = postTime + Math.random() * (now - postTime);
      
      comments.push({
        userId: user.id,
        userNickname: user.nickname,
        comment: commentText,  // ✅ 필드명 수정
        timestamp: randomCommentTime,  // ✅ 숫자 (밀리초)
      });
    }
    
    // 시간순 정렬
    comments.sort((a, b) => a.timestamp - b.timestamp);
    
    return comments;
  };

  // 과거 게시글 150개 일괄 업로드
  const uploadPastPosts = async () => {
    if (!confirm('과거 게시글 150개를 업로드하시겠습니까?\n(과거 2주간 분산된 timestamp로 생성됩니다)')) return;
    
    setIsLoading(true);
    setLogs([]);
    addLog('📤 과거 게시글 업로드 시작...');

    const communityRef = collection(db, 'community');
    let successCount = 0;

    // 과거 14일간 분산
    const now = Date.now();
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < PAST_POSTS.length; i++) {
      const post = PAST_POSTS[i];
      const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      
      // 과거 timestamp (2주 전 ~ 현재 사이 랜덤)
      const randomTime = twoWeeksAgo + Math.random() * (now - twoWeeksAgo);
      
      try {
        const docData = {
          userId: randomUser.id,
          userNickname: randomUser.nickname,
          category: post.category,
          title: post.title,
          content: post.content,
          images: [],
          timestamp: Timestamp.fromMillis(randomTime),
          comments: generateComments(randomTime),
          views: Math.floor(Math.random() * 500) + 50,
          likes: generateLikes(),
        };

        await addDoc(communityRef, docData);
        successCount++;
        
        if (successCount % 10 === 0) {
          addLog(`✅ ${successCount}개 업로드 완료...`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        addLog(`❌ 실패: ${post.title.substring(0, 30)}...`);
      }
    }

    addLog(`\n🎉 과거 게시글 업로드 완료! 총 ${successCount}개`);
    setCurrentPostCount(prev => prev + successCount);
    setIsLoading(false);
  };

  // 특정 날짜 게시글 발행
  const publishDatePosts = async (dateKey: string) => {
    const posts = FUTURE_POSTS_BY_DATE[dateKey];
    if (!posts || posts.length === 0) {
      alert('해당 날짜에 발행할 게시글이 없습니다.');
      return;
    }

    if (!confirm(`${dateKey} 게시글 ${posts.length}개를 발행하시겠습니까?`)) return;

    setIsLoading(true);
    addLog(`📤 ${dateKey} 게시글 발행 시작...`);

    const communityRef = collection(db, 'community');
    let successCount = 0;

    // 오늘 하루 동안 분산 (오전 8시 ~ 오후 10시)
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + (14 * 60 * 60 * 1000); // 14시간

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      
      // 하루 동안 분산된 시간
      const randomTime = startTime + (i / posts.length) * (endTime - startTime) + Math.random() * 1800000;
      
      try {
        const docData = {
          userId: randomUser.id,
          userNickname: randomUser.nickname,
          category: post.category,
          title: post.title,
          content: post.content,
          images: [],
          timestamp: Timestamp.fromMillis(randomTime),
          comments: generateComments(randomTime),
          views: Math.floor(Math.random() * 100) + 10,
          likes: generateLikes(),
        };

        await addDoc(communityRef, docData);
        successCount++;
        addLog(`✅ 발행: ${post.title.substring(0, 30)}...`);

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        addLog(`❌ 실패: ${post.title.substring(0, 30)}...`);
      }
    }

    addLog(`\n🎉 ${dateKey} 발행 완료! 총 ${successCount}개`);
    setCurrentPostCount(prev => prev + successCount);
    setIsLoading(false);
  };

  // 전체 삭제
  const clearAll = async () => {
    if (!confirm('⚠️ 모든 커뮤니티 게시글을 삭제합니다. 정말로?')) return;
    if (!confirm('되돌릴 수 없습니다. 계속하시겠습니까?')) return;

    setIsLoading(true);
    addLog('🗑️ 삭제 시작...');

    const snapshot = await getDocs(collection(db, 'community'));
    let count = 0;
    
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'community', docSnap.id));
      count++;
      if (count % 20 === 0) addLog(`🗑️ ${count}개 삭제...`);
    }

    addLog(`✅ 총 ${count}개 삭제 완료!`);
    setCurrentPostCount(0);
    setIsLoading(false);
  };
// 시딩 게시글만 삭제 (user_로 시작하는 userId)
const clearSeededOnly = async () => {
    if (!confirm('시딩된 게시글만 삭제합니다. 실제 사용자 게시글은 유지됩니다.')) return;
  
    setIsLoading(true);
    addLog('🗑️ 시딩 게시글 삭제 시작...');
  
    const snapshot = await getDocs(collection(db, 'community'));
    let count = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // user_로 시작하는 userId만 삭제
      if (data.userId && data.userId.startsWith('user_')) {
        await deleteDoc(doc(db, 'community', docSnap.id));
        count++;
        if (count % 10 === 0) addLog(`🗑️ ${count}개 삭제...`);
      }
    }
  
    addLog(`✅ 시딩 게시글 ${count}개 삭제 완료! (실제 사용자 게시글 유지)`);
    setCurrentPostCount(prev => prev - count);
    setIsLoading(false);
  };
  // 미래 발행 날짜 목록
  const futureDates = Object.keys(FUTURE_POSTS_BY_DATE).sort();

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">📅 커뮤니티 게시글 관리</h1>
        <p className="text-gray-600 mb-6">과거 게시글 일괄 업로드 + 미래 게시글 날짜별 발행</p>

        {/* 현황 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📊 현황</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{currentPostCount}</p>
              <p className="text-sm text-gray-600">현재 게시글</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{PAST_POSTS.length}</p>
              <p className="text-sm text-gray-600">과거용 대기</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{futureDates.length}</p>
              <p className="text-sm text-gray-600">미래 발행일</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{FAKE_USERS.length}</p>
              <p className="text-sm text-gray-600">가상 사용자</p>
            </div>
          </div>
        </div>

        {/* 과거 게시글 업로드 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📤 과거 게시글 일괄 업로드</h2>
          <p className="text-sm text-gray-600 mb-4">
            150개 게시글을 과거 2주간 분산된 timestamp로 업로드합니다.<br/>
            각 게시글에 좋아요 10~20개, 댓글 10~20개가 자동 생성됩니다.
          </p>
          <button
            onClick={uploadPastPosts}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '🚀 과거 150개 업로드'}
          </button>
        </div>

        {/* 미래 게시글 발행 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📅 미래 게시글 날짜별 발행</h2>
          <p className="text-sm text-gray-600 mb-4">
            원하는 날짜의 게시글을 발행 버튼으로 업로드합니다.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {futureDates.map(dateKey => (
              <div key={dateKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{dateKey}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({FUTURE_POSTS_BY_DATE[dateKey].length}개)
                  </span>
                </div>
                <button
                  onClick={() => publishDatePosts(dateKey)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  발행하기
                </button>
              </div>
            ))}
            {futureDates.length === 0 && (
              <p className="text-gray-500 text-center py-4">발행할 게시글이 없습니다.</p>
            )}
          </div>
        </div>

       {/* 위험 영역 */}
<div className="bg-red-50 rounded-lg p-6 mb-6">
  <h2 className="text-lg font-bold text-red-700 mb-4">⚠️ 위험 영역</h2>
  <div className="flex gap-3">
    <button
      onClick={clearSeededOnly}
      disabled={isLoading}
      className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
    >
      🧹 시딩만 삭제
    </button>
    <button
      onClick={clearAll}
      disabled={isLoading}
      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
    >
      🗑️ 전체 삭제
    </button>
  </div>
</div>

        {/* 로그 */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">📝 로그</h2>
            <div className="font-mono text-sm text-green-400 max-h-60 overflow-y-auto space-y-1">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}