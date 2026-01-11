'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 카테고리 정의
const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: 'event', label: '이벤트', icon: '🎁' },
  { id: 'dispute', label: '분쟁사례', icon: '⚠️' },
  { id: 'review', label: '사용후기', icon: '✅' },
  { id: 'question', label: '질문/잡담', icon: '💬' },
];

// 가이드 데이터
const GUIDES = [
  { id: 1, title: '렌탈 전 사진 기록이 중요한 이유', emoji: '📸', views: 1240 },
  { id: 2, title: '분쟁 시 증거력 있는 사진 찍는 법', emoji: '✅', views: 892 },
  { id: 3, title: '반납 전 체크리스트', emoji: '📝', views: 756 },
];

interface Comment {
  userId: string;
  userNickname: string;
  comment: string;
  timestamp: number;
}

interface Post {
  id: string;
  userId: string;
  userNickname: string;
  category: string;
  title: string;
  content: string;
  images?: string[];
  timestamp: any;
  comments: Comment[];
  views: number;
  likes: string[];
}

const ADMIN_EMAILS = ['medws1@naver.com'];

export default function CommunityPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 사용자 상태
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 게시판 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // 모달 상태
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState<Post | null>(null);
  const [showGuideDetail, setShowGuideDetail] = useState<number | null>(null);
  const [showImageViewer, setShowImageViewer] = useState<string | null>(null);
  
  // 글쓰기 상태
  const [newPost, setNewPost] = useState({
    category: 'question',
    title: '',
    content: '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 댓글 상태
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // 로그인 필요 체크 함수
  const requireLogin = (callback?: () => void) => {
    if (!user) {
      if (confirm('로그인이 필요한 기능입니다. 로그인하시겠습니까?')) {
        router.push('/login');
      }
      return false;
    }
    if (!nickname) {
      if (confirm('닉네임 설정이 필요합니다. 설정하시겠습니까?')) {
        router.push('/profile');
      }
      return false;
    }
    if (callback) callback();
    return true;
  };

  // 인증 체크 - 비로그인도 목록 조회 가능
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email || ''));
        await checkNickname(currentUser.uid);
      } else {
        setUser(null);
        setNickname('');
      }
      loadPosts(); // 로그인 여부와 관계없이 게시글 로드
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 카테고리 필터링
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === activeCategory));
    }
  }, [activeCategory, posts]);

  const checkNickname = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().nickname) {
        setNickname(docSnap.data().nickname);
      }
      // 닉네임 없어도 리다이렉트하지 않음 (글쓰기 시점에 체크)
    } catch (error) {
      console.error('닉네임 확인 실패:', error);
    }
  };

  const loadPosts = () => {
    const q = query(
      collection(db, 'community'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList: Post[] = [];
      snapshot.forEach((doc) => {
        postList.push({ 
          id: doc.id, 
          ...doc.data(),
          comments: doc.data().comments || [],
          views: doc.data().views || 0,
          likes: doc.data().likes || [],
          images: doc.data().images || [],
        } as Post);
      });
      setPosts(postList);
    });

    return unsubscribe;
  };

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - selectedImages.length); // 최대 5장
    
    if (selectedImages.length + newFiles.length > 5) {
      alert('이미지는 최대 5장까지 첨부할 수 있습니다.');
      return;
    }

    setSelectedImages(prev => [...prev, ...newFiles]);

    // 미리보기 생성
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 업로드
  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < selectedImages.length; i++) {
      const file = selectedImages[i];
      const fileName = `community/${user.uid}/${Date.now()}_${i}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      uploadedUrls.push(downloadUrl);
      
      setUploadProgress(Math.round(((i + 1) / selectedImages.length) * 100));
    }

    return uploadedUrls;
  };

  // 글 작성
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setPosting(true);
    setUploadProgress(0);

    try {
      // 이미지 업로드
      const imageUrls = await uploadImages();

      // 게시글 저장
      await addDoc(collection(db, 'community'), {
        userId: user.uid,
        userNickname: nickname,
        category: newPost.category,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        images: imageUrls,
        timestamp: serverTimestamp(),
        comments: [],
        views: 0,
        likes: [],
      });

      // 초기화
      setNewPost({ category: 'question', title: '', content: '' });
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setShowNewPostModal(false);
      alert('게시글이 등록되었습니다!');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setPosting(false);
      setUploadProgress(0);
    }
  };

  // 글 삭제
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'community', postId));
      setShowPostDetail(null);
      alert('게시글이 삭제되었습니다!');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

 // 조회수 증가 & 상세보기 (로그인 필요)
 const handlePostClick = async (post: Post) => {
    if (!requireLogin()) return;
    
    try {
      await updateDoc(doc(db, 'community', post.id), {
        views: increment(1)
      });
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }
    setShowPostDetail(post);
  };

 // 좋아요 토글 (로그인 필요)
 const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireLogin()) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    
    try {
      await updateDoc(doc(db, 'community', postId), {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    setCommenting(true);
    try {
      await updateDoc(doc(db, 'community', postId), {
        comments: arrayUnion({
          userId: user.uid,
          userNickname: nickname,
          comment: newComment.trim(),
          timestamp: Date.now(),
        }),
      });
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setCommenting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (postId: string, comment: Comment) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const updatedComments = post.comments.filter(
        c => !(c.userId === comment.userId && c.timestamp === comment.timestamp)
      );
      
      await updateDoc(doc(db, 'community', postId), {
        comments: updatedComments
      });
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
    }
  };

  // 시간 포맷
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 카테고리 라벨
  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  // 권한 체크
  const canDelete = (post: Post) => user && (user.uid === post.userId || isAdmin);
  const canDeleteComment = (comment: Comment) => user && (user.uid === comment.userId || isAdmin);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">커뮤니티</h1>
          <button onClick={() => router.push('/profile')} className="p-1">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

       {/* 카테고리 탭 */}
<div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
<div 
  className="flex gap-2 px-4 md:px-0 pb-3 overflow-x-auto md:overflow-visible touch-pan-x md:justify-center"
  style={{ 
    scrollbarWidth: 'none', 
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch'
  }}
>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        </div>
      </header>

      <main className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
       {/* 이벤트 배너 */}
<div className="mx-4 md:mx-0 mt-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>
            <div className="text-white">
              <p className="font-bold">기록 인증하고 선물 받자!</p>
              <p className="text-sm text-orange-100">추첨 통해 <span className="font-bold">기프티콘</span> 증정</p>
            </div>
          </div>
          <button 
            onClick={() => requireLogin(() => {
              setNewPost({ ...newPost, category: 'review' });
              setShowNewPostModal(true);
            })}
            className="bg-white text-orange-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-50 transition"
          >
            인증하기
          </button>
        </div>

       {/* 가이드 섹션 */}
<div className="mt-6 px-4 md:px-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">📚 기록 가이드</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">전체보기 &gt;</button>
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto md:overflow-visible pb-2" style={{ scrollbarWidth: 'none' }}>
  {GUIDES.map((guide) => (
    <button
      key={guide.id}
      onClick={() => setShowGuideDetail(guide.id)}
      className="flex-shrink-0 w-40 md:w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left"
    >
                <div className="text-3xl mb-2">{guide.emoji}</div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{guide.title}</p>
                <p className="text-xs text-gray-500">조회 {guide.views}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="mt-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-gray-500">아직 게시글이 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="bg-white divide-y divide-gray-100">
              {filteredPosts.map((post) => {
                const catInfo = getCategoryInfo(post.category);
                const isLiked = post.likes.includes(user?.uid || '');
                
                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    {/* 태그 + 닉네임 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.category === 'dispute' ? 'bg-red-100 text-red-600' :
                        post.category === 'review' ? 'bg-green-100 text-green-600' :
                        post.category === 'event' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {catInfo.label}
                      </span>
                      <span className="text-sm text-gray-500">{post.userNickname}</span>
                    </div>

                    {/* 본문 + 이미지 썸네일 */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2 line-clamp-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(post.timestamp)} · 조회 {post.views}</span>
                          <div className="flex items-center gap-3">
                            <span className={isLiked ? 'text-red-500' : ''}>
                              {isLiked ? '❤️' : '🤍'} {post.likes.length}
                            </span>
                            <span>💬 {post.comments.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 이미지 썸네일 */}
                      {post.images && post.images.length > 0 && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={post.images[0]} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                          {post.images.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                              +{post.images.length - 1}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

     {/* 글쓰기 FAB */}
     <button
        onClick={() => requireLogin(() => setShowNewPostModal(true))}
        className="fixed right-4 bottom-24 sm:bottom-6 bg-orange-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-orange-600 transition flex items-center gap-2 z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span className="text-sm font-medium">글쓰기</span>
      </button>

      {/* 글쓰기 모달 */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              <button 
                onClick={() => {
                  setShowNewPostModal(false);
                  setSelectedImages([]);
                  setImagePreviewUrls([]);
                }}
                className="text-gray-600 p-1"
              >
                ✕
              </button>
              <h2 className="font-bold">글쓰기</h2>
              <button
                onClick={handleCreatePost}
                disabled={posting || !newPost.title.trim() || !newPost.content.trim()}
                className="text-orange-500 font-bold disabled:text-gray-300"
              >
                {posting ? '등록 중...' : '등록'}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 업로드 진행률 */}
              {posting && uploadProgress > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-orange-700">이미지 업로드 중...</span>
                    <span className="text-sm text-orange-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewPost({ ...newPost, category: cat.id })}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        newPost.category === cat.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={posting}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={
                    newPost.category === 'dispute' 
                      ? '어떤 분쟁을 겪으셨나요? 상황, 결과, 교훈을 공유해주세요.'
                      : newPost.category === 'review'
                      ? 'Record 365로 기록한 경험을 공유해주세요!'
                      : '자유롭게 이야기를 나눠보세요.'
                  }
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  disabled={posting}
                />
              </div>

              {/* 이미지 첨부 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 첨부 <span className="text-gray-400 font-normal">(최대 5장)</span>
                </label>
                
                {/* 이미지 미리보기 */}
                {imagePreviewUrls.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img 
                          src={url} 
                          alt={`preview-${index}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 이미지 추가 버튼 */}
                {selectedImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 transition"
                  >
                    📷 사진 추가하기
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* 카테고리별 안내 */}
              {newPost.category === 'review' && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    💡 <strong>Tip:</strong> Record 365 앱 스크린샷과 함께 후기를 남기면 이벤트 참여가 됩니다!
                  </p>
                </div>
              )}

              {newPost.category === 'dispute' && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ⚠️ 개인정보(실명, 연락처, 주소 등)는 작성하지 마세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 글 상세보기 모달 */}
      {showPostDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              <button 
                onClick={() => setShowPostDetail(null)}
                className="text-gray-600 p-1"
              >
                ✕
              </button>
              <h2 className="font-bold">게시글</h2>
              {canDelete(showPostDetail) && (
                <button
                  onClick={() => handleDeletePost(showPostDetail.id)}
                  className="text-red-500 text-sm"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="p-4">
              {/* 태그 */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  showPostDetail.category === 'dispute' ? 'bg-red-100 text-red-600' :
                  showPostDetail.category === 'review' ? 'bg-green-100 text-green-600' :
                  showPostDetail.category === 'event' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getCategoryInfo(showPostDetail.category).label}
                </span>
              </div>

              {/* 작성자 정보 */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span>👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{showPostDetail.userNickname}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(showPostDetail.timestamp)} · 조회 {showPostDetail.views}
                  </p>
                </div>
              </div>

              {/* 제목 & 본문 */}
              <h3 className="text-lg font-bold text-gray-900 mb-3">{showPostDetail.title}</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{showPostDetail.content}</p>

              {/* 이미지 갤러리 */}
              {showPostDetail.images && showPostDetail.images.length > 0 && (
                <div className="mb-6">
                  <div className={`grid gap-2 ${
                    showPostDetail.images.length === 1 ? 'grid-cols-1' :
                    showPostDetail.images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {showPostDetail.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setShowImageViewer(img)}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img 
                          src={img} 
                          alt={`image-${index}`}
                          className="w-full h-full object-cover hover:opacity-90 transition"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 좋아요 버튼 */}
              <button
                onClick={(e) => handleLike(showPostDetail.id, e)}
                className={`w-full py-3 rounded-lg border ${
                  showPostDetail.likes.includes(user?.uid || '')
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-gray-200 text-gray-600'
                } font-medium mb-6`}
              >
                {showPostDetail.likes.includes(user?.uid || '') ? '❤️' : '🤍'} 좋아요 {showPostDetail.likes.length}
              </button>

              {/* 댓글 영역 */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">댓글 {showPostDetail.comments.length}</h4>
                
                {/* 댓글 목록 */}
                {showPostDetail.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {showPostDetail.comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.userNickname}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.timestamp)}
                            </span>
                            {canDeleteComment(comment) && (
                              <button
                                onClick={() => handleDeleteComment(showPostDetail.id, comment)}
                                className="text-xs text-red-500"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 입력 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(showPostDetail.id)}
                    placeholder="댓글을 입력하세요..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={commenting}
                  />
                  <button
                    onClick={() => handleAddComment(showPostDetail.id)}
                    disabled={!newComment.trim() || commenting}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 뷰어 */}
      {showImageViewer && (
        <div 
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
          onClick={() => setShowImageViewer(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-2xl z-10"
            onClick={() => setShowImageViewer(null)}
          >
            ✕
          </button>
          <img 
            src={showImageViewer} 
            alt="full view"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* 가이드 상세 모달 */}
      {showGuideDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <button 
                onClick={() => setShowGuideDetail(null)}
                className="text-gray-600 p-1"
              >
                ✕
              </button>
              <h2 className="font-bold">기록 가이드</h2>
              <div className="w-6"></div>
            </div>
            
            <div className="p-4">
              {(() => {
                const guide = GUIDES.find(g => g.id === showGuideDetail);
                if (!guide) return null;
                
                return (
                  <>
                    <div className="text-center py-8">
                      <span className="text-6xl">{guide.emoji}</span>
                      <h3 className="text-xl font-bold text-gray-900 mt-4">{guide.title}</h3>
                      <p className="text-sm text-gray-500 mt-2">조회 {guide.views}</p>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-gray-600">
                      {guide.id === 1 && (
                        <p>렌탈 물품을 받을 때 사진으로 상태를 기록해두면, 나중에 반납 시 발생할 수 있는 분쟁을 예방할 수 있습니다. 기존 흠집, 고장, 오염 등을 꼼꼼히 촬영해두세요.</p>
                      )}
                      {guide.id === 2 && (
                        <p>증거력 있는 사진을 찍으려면: 1) 날짜/시간이 자동 기록되는 앱 사용, 2) 전체 샷과 클로즈업 모두 촬영, 3) 조명이 충분한 환경에서 촬영하세요.</p>
                      )}
                      {guide.id === 3 && (
                        <p>반납 전 체크리스트: 1) 처음 받은 상태와 비교, 2) 새로운 흠집이나 손상 확인, 3) 반납 시점의 상태도 사진으로 기록해두세요.</p>
                      )}
                    </div>

                    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700 font-medium mb-2">📱 Record 365로 기록하세요</p>
                      <p className="text-sm text-orange-600">렌탈 상태를 체계적으로 기록하고 관리할 수 있습니다.</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}