'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, increment, deleteDoc } from 'firebase/firestore';

interface Comment {
  userId: string;
  userNickname: string;
  comment: string;
  timestamp: any;
}

interface Post {
  id: string;
  userId: string;
  userNickname: string;
  title: string;
  content: string;
  timestamp: any;
  comments: Comment[];
  views: number;
}

const ADMIN_EMAILS = ['medws@naver.com'];

export default function RentalCasesBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email || ''));
        await checkNickname(currentUser.uid);
        loadPosts();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const checkNickname = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().nickname) {
        setNickname(docSnap.data().nickname);
      } else {
        alert('닉네임을 먼저 설정해주세요.');
        router.push('/profile');
        return;
      }
    } catch (error) {
      console.error('닉네임 확인 실패:', error);
    }
  };

  const loadPosts = () => {
    const q = query(
      collection(db, 'boards', 'rental-cases', 'posts'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList: Post[] = [];
      snapshot.forEach((doc) => {
        postList.push({ 
          id: doc.id, 
          ...doc.data(), 
          comments: doc.data().comments || [],
          views: doc.data().views || 0
        } as Post);
      });
      setPosts(postList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreatePost = async () => {
    if (!isAdmin) {
      alert('관리자만 글을 작성할 수 있습니다.');
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim() || !user || !nickname) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setPosting(true);
    try {
      await addDoc(collection(db, 'boards', 'rental-cases', 'posts'), {
        userId: user.uid,
        userNickname: nickname,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        timestamp: serverTimestamp(),
        comments: [],
        views: 0,
      });

      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostModal(false);
      alert('게시글이 등록되었습니다!');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = confirm('정말 이 게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'boards', 'rental-cases', 'posts', postId));
      alert('게시글이 삭제되었습니다!');
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handlePostClick = async (post: Post) => {
    try {
      const postRef = doc(db, 'boards', 'rental-cases', 'posts', post.id);
      await updateDoc(postRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }

    setSelectedPost(selectedPost?.id === post.id ? null : post);
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user || !nickname) {
      alert('댓글을 입력해주세요.');
      return;
    }

    setCommenting(true);
    try {
      const postRef = doc(db, 'boards', 'rental-cases', 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          userId: user.uid,
          userNickname: nickname,
          comment: newComment.trim(),
          timestamp: Date.now(),
        }),
      });

      setNewComment('');
      alert('댓글이 등록되었습니다!');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentIndex: number) => {
    if (!isAdmin) {
      alert('관리자만 댓글을 삭제할 수 있습니다.');
      return;
    }

    const confirmed = confirm('이 댓글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const updatedComments = post.comments.filter((_, index) => index !== commentIndex);
      
      const postRef = doc(db, 'boards', 'rental-cases', 'posts', postId);
      await updateDoc(postRef, {
        comments: updatedComments
      });

      alert('댓글이 삭제되었습니다!');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 30) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← 뒤로
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">🚗 렌탈 분쟁사례</h1>
            <p className="text-xs text-gray-500">실제 분쟁 사례로 배우는 렌탈 보호법</p>
          </div>
          <button 
            onClick={() => router.push('/profile')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {nickname}
            {isAdmin && <span className="ml-1 text-xs">👑</span>}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 안내 메시지 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-orange-800 mb-2">⚠️ 이런 일이 실제로 일어납니다</h3>
          <p className="text-sm text-orange-700">
            사진 기록이 없어서 억울한 비용을 물게 된 실제 사례들입니다. Record365로 미리 예방하세요!
          </p>
        </div>

        {/* 관리자만 글쓰기 버튼 */}
        {isAdmin && (
          <button
            onClick={() => setShowNewPostModal(true)}
            className="fixed right-6 bottom-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center text-2xl z-10"
          >
            +
          </button>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500">아직 사례가 등록되지 않았습니다.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post, index) => (
              <div key={post.id}>
                <div 
                  onClick={() => handlePostClick(post)}
                  className="bg-white p-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    {truncateContent(post.content)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{post.userNickname} · {formatDate(post.timestamp)} · 조회 {post.views}</span>
                    {post.comments.length > 0 && (
                      <span className="text-orange-500">💬 {post.comments.length}</span>
                    )}
                  </div>
                </div>

                {selectedPost?.id === post.id && (
                  <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {post.timestamp?.toDate().toLocaleString('ko-KR')}
                        </div>
                        
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            🗑️ 삭제
                          </button>
                        )}
                      </div>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-gray-700">댓글 {post.comments.length}개</p>
                        {post.comments.map((comment, commentIndex) => (
                          <div key={commentIndex} className="bg-white rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{comment.userNickname}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, commentIndex)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        disabled={commenting}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment.trim() || commenting}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}

                {index < posts.length - 1 && <div className="h-px bg-gray-200"></div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 새 게시글 작성 모달 (관리자만) */}
      {showNewPostModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">새 사례 등록</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="예: 렌터카 반납 시 기존 스크래치로 50만원 청구됨"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={posting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="상세 내용을 입력하세요..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  disabled={posting}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setNewPostTitle('');
                  setNewPostContent('');
                }}
                disabled={posting}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleCreatePost}
                disabled={posting || !newPostTitle.trim() || !newPostContent.trim()}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {posting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}