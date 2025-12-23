'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function InitSamplesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleUnlock = () => {
    if (password === 'record365admin') {
      setIsUnlocked(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const rentalCases = [
    { title: "렌터카 반납 시 기존 스크래치로 50만원 청구됨", content: "제주도 여행을 위해 렌터카를 빌렸습니다. 차량 인수 시 직원이 빨리 나가세요라며 재촉해서 사진을 제대로 못 찍었습니다.\n\n반납 시 조수석 문에 작은 스크래치가 있다며 50만원을 청구했습니다. 제가 낸 것이 아니라고 항변했지만 Before 사진이 없어서 증명할 방법이 없었습니다." },
    { title: "차량 하부 손상으로 100만원 청구", content: "렌터카를 3일간 빌려서 강원도 여행을 다녀왔습니다. 반납 후 일주일 뒤 차량 하부에 손상이 있어 수리비 100만원이 필요하다고 연락이 왔습니다." },
    { title: "소액 스크래치인데 전액 수리비 80만원 청구", content: "부산 출장에서 렌터카를 이용했습니다. 반납 시 뒤 범퍼에 5cm 정도의 작은 스크래치가 있었는데 범퍼 전체를 교체해야 한다며 80만원을 청구했습니다." },
    { title: "타이어 찍힘으로 40만원 청구", content: "제주도 해안도로를 달렸습니다. 반납 시 타이어 측면에 찍힌 흔적이 있다며 40만원을 청구했습니다. 인수 시 타이어를 확인하지 않아 증명할 수 없었습니다." },
    { title: "범퍼 스크래치로 도색 비용 70만원", content: "강릉 여행에서 렌터카를 빌렸습니다. 반납 시 앞 범퍼에 10cm 스크래치가 있다며 70만원을 청구했습니다." },
    { title: "휠 스크래치 수리비 60만원", content: "경주 여행 후 반납 시 휠에 스크래치가 있다며 60만원을 청구했습니다. 사진이 없어서 항변할 수 없었습니다." },
    { title: "실내 오염으로 청소비 30만원", content: "가족 여행으로 아이들이 간식을 먹어 실내가 지저분했습니다. 특수 청소가 필요하다며 30만원을 청구했습니다." },
    { title: "사이드미러 파손으로 90만원", content: "조수석 사이드미러에 금이 가 있다며 90만원을 청구했습니다. 부딪친 기억이 없는데 증명할 방법이 없었습니다." },
    { title: "후방 카메라 작동 불량 20만원", content: "제주 렌터카 후방 카메라가 잘 안 보였습니다. 반납 후 파손되었다며 20만원을 청구했습니다." },
    { title: "트렁크 내부 스크래치 25만원", content: "캠핑 장비를 실었습니다. 트렁크 내부에 스크래치가 있다며 25만원을 청구했습니다." },
    { title: "헤드라이트 김서림 55만원", content: "헤드라이트에 습기가 차 있다며 교체 비용 55만원을 청구했습니다." },
    { title: "도어 흠집으로 판금 비용 65만원", content: "운전석 도어에 찌그러짐이 있다며 65만원을 청구했습니다." },
    { title: "본넷 페인트 손상 80만원", content: "본넷에 페인트가 벗겨진 부분이 있다며 80만원을 청구했습니다." },
    { title: "블랙박스 SD카드 분실 30만원", content: "SD카드가 없다며 30만원을 청구했습니다. 건드린 적이 없는데 증명 불가했습니다." },
    { title: "키 스크래치 45만원", content: "스마트키에 스크래치가 있다며 45만원을 청구받았습니다." },
    { title: "에어컨 냄새로 살균 비용 15만원", content: "에어컨에서 냄새가 난다며 15만원을 청구했습니다." },
    { title: "시트 오염으로 커버 교체 40만원", content: "시트에 얼룩이 있다며 40만원을 청구했습니다." },
    { title: "휠 캡 분실 20만원", content: "휠 캡 하나가 없다며 20만원을 청구했습니다." },
    { title: "와이퍼 교체 비용 12만원", content: "와이퍼가 낡았다며 12만원을 청구했습니다." },
    { title: "사이드 스커트 파손 70만원", content: "사이드 스커트가 파손되었다며 70만원을 청구했습니다." },
    { title: "루프 안테나 파손 35만원", content: "루프 안테나가 휘어져 있다며 35만원을 청구했습니다." },
    { title: "뒷좌석 발판 오염 18만원", content: "뒷좌석 발판이 심하게 오염되었다며 18만원을 청구했습니다." },
    { title: "보조 미러 파손 25만원", content: "선바이저 보조 미러가 파손되었다며 25만원을 청구받았습니다." },
    { title: "핸드브레이크 작동 불량 55만원", content: "핸드브레이크 작동이 불량하다며 55만원을 청구했습니다." },
    { title: "엔진룸 커버 파손 40만원", content: "엔진룸 하단 커버가 파손되었다며 40만원을 청구했습니다." },
    { title: "선루프 작동 불량 120만원", content: "선루프 작동이 불량하다며 120만원을 청구했습니다." },
    { title: "USB 포트 파손 30만원", content: "USB 포트가 파손되었다며 30만원을 청구했습니다." },
    { title: "주유구 커버 파손 20만원", content: "주유구 커버가 제대로 닫히지 않는다며 20만원을 청구했습니다." },
    { title: "계기판 경고등 수리비 95만원", content: "계기판에 경고등이 들어왔다며 95만원을 청구받았습니다." },
    { title: "내비게이션 화면 스크래치 60만원", content: "내비게이션 화면에 스크래치가 있다며 60만원을 청구했습니다." },
  ];

  const houseCases = [
    { title: "전세 퇴거 시 벽지 교체비 200만원", content: "2년 전세 계약이 끝나고 퇴거했습니다. 벽지가 너무 더러워서 전체 교체가 필요하다며 200만원을 공제하겠다고 했습니다." },
    { title: "보증금 100만원 못 받음", content: "여러 곳에 손상이 있다며 보증금 100만원 전액을 돌려주지 않았습니다. Before 사진이 없어서 증명 불가했습니다." },
    { title: "싱크대 물때로 50만원 청구", content: "싱크대에 물때가 심하다며 50만원을 청구했습니다." },
    { title: "에어컨 청소 비용 30만원", content: "에어컨이 너무 더럽다며 30만원을 청구했습니다." },
    { title: "베란다 바닥 변색 80만원", content: "베란다 바닥이 변색되었다며 80만원을 청구했습니다." },
    { title: "방문 흠집으로 교체 60만원", content: "방문에 흠집이 많다며 60만원을 청구했습니다." },
    { title: "화장실 타일 깨짐 70만원", content: "화장실 타일 일부가 깨졌다며 70만원을 청구했습니다." },
    { title: "주방 후드 기름때 40만원", content: "주방 후드에 기름때가 심하다며 40만원을 청구했습니다." },
    { title: "현관문 잠금장치 불량 50만원", content: "현관문 잠금장치가 고장났다며 50만원을 청구했습니다." },
    { title: "붙박이장 손잡이 파손 35만원", content: "붙박이장 손잡이가 파손되었다며 35만원을 청구했습니다." },
    { title: "거실 마루 긁힘 120만원", content: "거실 마루에 긁힌 자국이 많다며 120만원을 청구했습니다." },
    { title: "보일러 청소 비용 25만원", content: "보일러가 더럽다며 25만원을 청구했습니다." },
    { title: "샤워기 수압 약화 20만원", content: "샤워기 수압이 약해졌다며 20만원을 청구했습니다." },
    { title: "창틀 곰팡이로 교체 55만원", content: "창틀에 곰팡이가 심하다며 55만원을 청구했습니다." },
    { title: "가스레인지 교체 비용 45만원", content: "가스레인지가 낡았다며 45만원을 청구했습니다." },
    { title: "전등 교체 비용 18만원", content: "전등 몇 개가 나갔다며 18만원을 청구했습니다." },
    { title: "옷장 내부 습기 30만원", content: "옷장 내부에 습기 손상이 있다며 30만원을 청구했습니다." },
    { title: "인덕션 작동 불량 60만원", content: "인덕션 작동이 불량하다며 60만원을 청구했습니다." },
    { title: "세탁기 배수구 막힘 15만원", content: "세탁기 배수구가 막혔다며 15만원을 청구했습니다." },
    { title: "수도꼭지 녹 발생 22만원", content: "수도꼭지에 녹이 슬었다며 22만원을 청구했습니다." },
    { title: "방충망 파손 12만원", content: "방충망이 여러 곳 찢어졌다며 12만원을 청구했습니다." },
    { title: "욕조 변색으로 재코팅 65만원", content: "욕조가 변색되었다며 65만원을 청구했습니다." },
    { title: "싱크대 상판 얼룩 70만원", content: "싱크대 상판에 얼룩이 심하다며 70만원을 청구했습니다." },
    { title: "장판 손상으로 교체 90만원", content: "방 장판이 여러 곳 찢어졌다며 90만원을 청구했습니다." },
    { title: "현관 신발장 문짝 휘어짐 50만원", content: "신발장 문짝이 휘어졌다며 50만원을 청구했습니다." },
    { title: "천장 곰팡이로 재도장 85만원", content: "천장에 곰팡이가 생겼다며 85만원을 청구했습니다." },
    { title: "베란다 창문 잠금 불량 35만원", content: "베란다 창문 잠금장치가 고장났다며 35만원을 청구했습니다." },
    { title: "거실 에어컨 냉매 부족 28만원", content: "에어컨 냉매가 부족하다며 28만원을 청구했습니다." },
    { title: "화장실 수전 누수 32만원", content: "화장실 수전에서 물이 샌다며 32만원을 청구했습니다." },
    { title: "드레스룸 선반 파손 42만원", content: "드레스룸 선반이 파손되었다며 42만원을 청구했습니다." },
  ];

  const handleInitRentalCases = async () => {
    if (!confirm('렌탈 분쟁사례 30개를 생성하시겠습니까?')) return;
    setLoading(true);
    setMessage('렌탈 분쟁사례 생성 중...');
    try {
      let count = 0;
      for (const caseData of rentalCases) {
        await addDoc(collection(db, 'boards', 'rental-cases', 'posts'), {
          userId: 'admin',
          userNickname: '관리자',
          title: caseData.title,
          content: caseData.content,
          timestamp: serverTimestamp(),
          comments: [],
          views: 0,
        });
        count++;
        setMessage(`렌탈 분쟁사례 생성 중... (${count}/30)`);
      }
      alert('렌탈 분쟁사례 30개가 생성되었습니다!');
      setMessage('');
    } catch (error) {
      console.error('생성 실패:', error);
      alert('생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitHouseCases = async () => {
    if (!confirm('부동산 분쟁사례 30개를 생성하시겠습니까?')) return;
    setLoading(true);
    setMessage('부동산 분쟁사례 생성 중...');
    try {
      let count = 0;
      for (const caseData of houseCases) {
        await addDoc(collection(db, 'boards', 'house-cases', 'posts'), {
          userId: 'admin',
          userNickname: '관리자',
          title: caseData.title,
          content: caseData.content,
          timestamp: serverTimestamp(),
          comments: [],
          views: 0,
        });
        count++;
        setMessage(`부동산 분쟁사례 생성 중... (${count}/30)`);
      }
      alert('부동산 분쟁사례 30개가 생성되었습니다!');
      setMessage('');
    } catch (error) {
      console.error('생성 실패:', error);
      alert('생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitAll = async () => {
    if (!confirm('모든 샘플 데이터 60개를 생성하시겠습니까?')) return;
    await handleInitRentalCases();
    await handleInitHouseCases();
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-2">🔒 관리자 인증</h1>
          <p className="text-center text-gray-600 mb-8">비밀번호를 입력하세요</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="비밀번호 입력"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button onClick={handleUnlock} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            확인
          </button>
          <button onClick={() => router.push('/dashboard')} className="w-full py-3 mt-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">샘플 데이터 생성</h1>
          <p className="text-center text-gray-600 mb-8">관리자 전용 페이지</p>
          <div className="space-y-4">
            <button onClick={handleInitRentalCases} disabled={loading} className="w-full py-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
              🚗 렌탈 분쟁사례 30개 생성
            </button>
            <button onClick={handleInitHouseCases} disabled={loading} className="w-full py-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
              🏠 부동산 분쟁사례 30개 생성
            </button>
            <button onClick={handleInitAll} disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              ✨ 전체 60개 한 번에 생성
            </button>
            <button onClick={() => router.push('/dashboard')} disabled={loading} className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              대시보드로 돌아가기
            </button>
          </div>
          {message && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-center text-blue-800 font-medium">{message}</p>
            </div>
          )}
          <div className="mt-8 bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 각 버튼을 한 번씩만 클릭하세요</li>
              <li>• 생성하는 데 약 1-2분 소요됩니다</li>
              <li>• 중복 생성 시 같은 내용이 여러 개 생깁니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}