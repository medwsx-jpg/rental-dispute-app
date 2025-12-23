'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

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

export default function HouseCasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNickname(docSnap.data().nickname || '');
        }
        loadPosts();
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadPosts = () => {
    const q = query(collection(db, 'boards', 'housecases', 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList: Post[] = [];
      snapshot.forEach((doc) => {
        postList.push({ id: doc.id, ...doc.data(), comments: doc.data().comments || [], views: doc.data().views || 0 } as Post);
      });
      setPosts(postList);
      setLoading(false);
    });
    return unsubscribe;
  };

  const handlePostClick = async (post: Post) => {
    try {
      await updateDoc(doc(db, 'boards', 'housecases', 'posts', post.id), { views: increment(1) });
    } catch (error) {
      console.error(error);
    }
    setSelectedPost(selectedPost?.id === post.id ? null : post);
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    try {
      await updateDoc(doc(db, 'boards', 'housecases', 'posts', postId), {
        comments: arrayUnion({ userId: user.uid, userNickname: nickname, comment: newComment.trim(), timestamp: Date.now() })
      });
      setNewComment('');
      alert('댓글이 등록되었습니다!');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-600">← 뒤로</button>
          <div className="text-center">
            <h1 className="text-xl font-bold">🏠 부동산 분쟁사례</h1>
            <p className="text-xs text-gray-500">실제 분쟁 사례로 배우는 임대차 보호법</p>
          </div>
          <button onClick={() => router.push('/profile')} className="text-sm text-blue-600">{nickname}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">⚠️ 보증금을 잃지 마세요</h3>
          <p className="text-sm text-blue-700">입주 전 사진이 없어서 보증금을 돌려받지 못한 실제 사례들입니다.</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500">아직 사례가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post, index) => (
              <div key={post.id}>
                <div onClick={() => handlePostClick(post)} className="bg-white p-4 cursor-pointer hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{post.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{post.userNickname} · 조회 {post.views}</span>
                    {post.comments.length > 0 && <span className="text-orange-500">💬 {post.comments.length}</span>}
                  </div>
                </div>

                {selectedPost?.id === post.id && (
                  <div className="bg-gray-50 border-t border-b p-4">
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">댓글 {post.comments.length}개</p>
                        {post.comments.map((comment, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3">
                            <span className="text-sm font-medium">{comment.userNickname}</span>
                            <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button onClick={() => handleAddComment(post.id)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
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
    </div>
  );
}