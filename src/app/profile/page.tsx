'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadNickname(currentUser.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadNickname = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setNickname(docSnap.data().nickname || '');
      }
    } catch (error) {
      console.error('닉네임 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length < 2 || nickname.length > 10) {
      alert('닉네임은 2-10자 사이여야 합니다.');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        nickname: nickname.trim(),
        email: user.email,
        updatedAt: Date.now(),
      }, { merge: true });

      alert('닉네임이 저장되었습니다!');
      router.push('/dashboard');
    } catch (error) {
      console.error('닉네임 저장 실패:', error);
      alert('닉네임 저장에 실패했습니다.');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">👤 닉네임 설정</h1>
          <p className="text-sm text-gray-600">
            서명 요청 및 게시판에 사용할 닉네임을 설정하세요
          </p>
          <p className="text-xs text-orange-600 mt-2">
            💼 계약 신뢰도를 위해 실명 사용을 권장합니다
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="실수"
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            {nickname.length}/10자
          </p>
        </div>

        {/* 🔥 경고 문구 추가 */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-orange-800 mb-1">⚠️ 중요</p>
          <p className="text-xs text-orange-700">
            이 닉네임은 서명 요청 시 상대방에게 표시됩니다.<br />
            장난스러운 닉네임은 계약 신뢰도를 낮출 수 있습니다.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium">💡 닉네임 규칙</p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1">
            <li>• 2-10자 사이</li>
            <li>• 게시판에서 다른 사용자에게 표시됩니다</li>
            <li>• 계약 서명 요청 시 상대방에게 표시됩니다</li>
            <li>• 언제든 변경 가능합니다</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSaveNickname}
            disabled={saving || !nickname.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}