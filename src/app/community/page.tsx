'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: any;
}

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadMessages();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadMessages = () => {
    const q = query(
      collection(db, 'community'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'community'), {
        userId: user.uid,
        userEmail: user.email,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← 내 렌탈
          </button>
          <h1 className="text-xl font-bold text-gray-900">💬 커뮤니티</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 mb-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-gray-500">아직 메시지가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">첫 메시지를 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.userId === user?.uid
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.userId !== user?.uid && (
                      <p className="text-xs opacity-70 mb-1">{msg.userEmail}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.userId === user?.uid ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.timestamp?.toDate().toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? '전송 중...' : '전송'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}