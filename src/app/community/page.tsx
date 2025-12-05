'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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
}

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
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
      collection(db, 'posts'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList: Post[] = [];
      snapshot.forEach((doc) => {
        postList.push({ id: doc.id, ...doc.data(), comments: doc.data().comments || [] } as Post);
      });
      setPosts(postList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !user || !nickname) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userNickname: nickname,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        timestamp: serverTimestamp(),
        comments: [],
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

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user || !nickname) {
      alert('댓글을 입력해주세요.');
      return;
    }

    setCommenting(true);
    try {
      const postRef = doc(db, 'posts', postId);
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
          <h1 className="text-xl font-bold text-gray-900">📋 게시판</h1>
          <button 
            onClick={() => router.push('/profile')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {nickname}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => setShowNewPostModal(true)}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg mb-6 hover:bg-blue-700 transition"
        >
          + 새 게시글 작성
        </button>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500">아직 게시글이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">첫 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="font-medium text-blue-600">{post.userNickname}</span>
                  <span>
                    {post.timestamp?.toDate().toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      💬 댓글 {post.comments.length}개
                    </span>
                    <button
                      onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedPost?.id === post.id ? '접기' : '펼치기'}
                    </button>
                  </div>

                  {selectedPost?.id === post.id && (
                    <div className="space-y-3">
                      {post.comments.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {post.comments.map((comment, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{comment.userNickname}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={commenting}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment.trim() || commenting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {commenting ? '등록 중...' : '등록'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 새 게시글 작성 모달 */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">새 게시글 작성</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="내용을 입력하세요"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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