'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

// 운영자 계정 정보 (실제 운영자 userId로 변경 필요)
const ADMIN_USER = {
  userId: 'admin_record365',
  userNickname: 'Record365 운영자'
};

// 시딩 데이터
const SEED_DATA = [
  // ========== 🎁 이벤트 ==========
  {
    category: 'event',
    title: '🎉 첫 기록 인증 이벤트 - 스타벅스 기프티콘 증정!',
    content: `Record 365로 첫 렌탈 기록을 완료하신 분들께 감사의 마음을 담아 스타벅스 아메리카노 기프티콘을 드립니다!

📌 참여 방법
1. Record 365에서 첫 렌탈 기록 완료
2. 이 게시글에 댓글로 인증샷 업로드
3. 간단한 사용 후기 작성

📌 이벤트 기간
2026년 1월 11일 ~ 2026년 1월 31일

📌 당첨자 발표
매주 금요일 10명 추첨

많은 참여 부탁드립니다! 🙏`,
  },
  {
    category: 'event',
    title: '👫 친구 초대 이벤트 - 둘 다 무료 이용권!',
    content: `친구를 초대하면 나도, 친구도 무료 이용권을 받을 수 있어요!

📌 참여 방법
1. 친구에게 Record 365 소개
2. 친구가 가입 시 추천인 코드 입력
3. 친구가 첫 기록 완료하면 둘 다 무료 이용권 지급!

📌 혜택
- 추천인: 1회 무료 이용권
- 피추천인: 1회 무료 이용권

📌 이벤트 기간
상시 진행

추천인 코드는 마이페이지에서 확인하세요! 💝`,
  },

  // ========== ⚠️ 분쟁사례 ==========
  {
    category: 'dispute',
    title: '🚗 렌트카 반납 시 흠집 수리비 폭탄 피하는 법',
    content: `한국소비자원 조사에 따르면, 최근 3년간 렌터카 관련 피해구제 신청 957건 중 '수리비 과다청구'가 55.9%로 가장 많았습니다.

📌 실제 사례
- 제주 여행 후 범퍼 미세 흠집으로 80만원 청구
- "원래 있던 흠집"이라고 했지만 증거 없어 패소
- 인수 시 사진을 찍어뒀다면 면제받을 수 있었음

📌 예방법
✅ 인수 전 차량 외관 360도 촬영
✅ 기존 흠집, 찌그러짐 모두 사진으로 기록
✅ 계약서에 기존 손상 부위 명시 요청
✅ 반납 시에도 동일하게 촬영

💡 Record 365를 사용하면 Before/After 사진을 체계적으로 관리하고, 상대방 서명까지 받을 수 있어 분쟁 시 강력한 증거가 됩니다.

출처: 한국소비자원 (consumer.go.kr)`,
  },
  {
    category: 'dispute',
    title: '🏠 입주 전 사진 없어서 보증금 100만원 날린 사연',
    content: `실제로 많이 발생하는 전세/월세 분쟁 사례입니다.

📌 사례
A씨는 2년간 거주 후 퇴거하려는데, 집주인이 바닥 흠집 수리비로 100만원을 청구했습니다.
A씨는 "입주할 때부터 있던 흠집"이라고 주장했지만, 증거가 없어 결국 보증금에서 차감당했습니다.

📌 교훈
- 입주 시 집 상태를 꼼꼼히 사진/영상으로 기록
- 벽지 구멍, 바닥 얼룩, 타일 변색 등 미세한 것도 모두 촬영
- 집주인과 함께 확인하고 계약서에 기재

📌 원상복구 기준 (참고)
- 자연적 마모: 집주인 부담
- 세입자 과실: 세입자 부담
- 감가상각 적용 가능 (LH 단가표 참고)

💡 Record 365로 입주 시 상태를 기록해두면, 퇴거 시 억울한 비용 청구를 막을 수 있습니다.`,
  },
  {
    category: 'dispute',
    title: '📦 장비 렌탈 후 고장 분쟁 - 대법원 판례',
    content: `장비나 물품을 렌탈했다가 고장이 발생하면 누구 책임일까요?

📌 대법원 판례 (2018다291347)
"임차인이 반환할 임대차 목적물이 훼손된 경우, 임차인은 자기가 책임질 수 없는 사유로 발생한 것임을 증명하지 못하면 손해배상 책임을 진다"

즉, **"내 잘못 아님"을 임차인이 증명해야 합니다.**

📌 실제 사례
의료장비 임대 후 고장 발생 → 임차인이 과실 없음을 증명 못해 수리비 7,890만원 청구당함

📌 예방법
✅ 인수 시 장비 상태 상세 촬영
✅ 기존 하자나 마모 부분 기록
✅ 정상 작동 여부 영상 촬영
✅ 인수확인서에 상태 명시

💡 고가의 장비일수록 Record 365로 꼼꼼히 기록해두세요!`,
  },
  {
    category: 'dispute',
    title: '🚨 렌터카 업체의 충격적인 사기 수법 적발',
    content: `최근 적발된 렌터카 업체의 조직적 사기 사건을 공유합니다.

📌 사건 개요
렌터카 업체 사장과 직원들이 영업 부진을 이유로 조직적 사기 범행을 공모했습니다.

📌 수법
1. 고객에게 차량 대여
2. GPS로 차량 위치 추적
3. 몰래 찾아가서 고의로 차량 파손
4. 고객에게 수리비 청구 또는 보험사에 허위 접수

총 10회에 걸쳐 1,346만원을 편취한 혐의로 적발되었습니다.

📌 자신을 보호하는 방법
✅ 인수 시 차량 상태 꼼꼼히 촬영 (날짜/시간 표시)
✅ 반납 시에도 동일하게 촬영
✅ 가능하면 블랙박스 영상도 보관
✅ 수리비 청구 시 견적서 요청

💡 사진 기록은 나를 보호하는 가장 확실한 방법입니다!

출처: 로톡 (lawtalk.co.kr)`,
  },

  // ========== ✅ 사용후기 ==========
  {
    category: 'review',
    title: '전세 퇴거 시 보증금 전액 돌려받았어요! 👍',
    content: `2년 전 전세 입주할 때 Record 365로 집 상태를 꼼꼼히 기록해뒀는데, 이번에 퇴거하면서 진짜 도움이 됐어요!

📌 상황
집주인: "거실 바닥 스크래치 수리비 50만원 내세요"
나: "입주할 때부터 있던 건데요?"

📌 해결
Record 365에 저장해둔 입주 시 사진을 보여드렸더니 바로 인정하시더라구요.
결국 원상복구 비용 0원, 보증금 전액 돌려받았습니다!

📌 팁
- 입주 시 사진은 많이 찍을수록 좋아요
- 특히 바닥, 벽지, 화장실은 꼼꼼히
- 날짜가 표시되는 게 중요해요

Record 365 덕분에 억울한 일 안 당했네요. 강추합니다! 🙌`,
  },
  {
    category: 'review',
    title: '렌트카 기존 흠집 증명해서 수리비 면제받았어요!',
    content: `제주도 여행 갔다가 렌트카 반납할 때 있었던 일이에요.

📌 상황
직원: "앞범퍼에 흠집이 있네요. 수리비 30만원입니다."
나: "어? 그건 빌릴 때부터 있던 건데요?"
직원: "증거 있으세요?"

📌 해결
다행히 인수할 때 Record 365로 차량 외관을 360도 촬영해뒀어요.
사진 보여드리니까 바로 "아, 네 확인됐습니다" 하고 끝!

📌 꿀팁
- 렌트카 인수 시 무조건 사진 찍기
- 특히 범퍼, 휠, 사이드미러 집중
- 실내 상태도 촬영해두면 좋아요
- 반납할 때도 똑같이 촬영!

30만원 아꼈습니다 ㅎㅎ 앞으로 렌트카 빌릴 때마다 써야겠어요! 🚗`,
  },
  {
    category: 'review',
    title: '카메라 장비 렌탈 후 깔끔하게 반납한 후기',
    content: `사진 촬영 일 때문에 고가의 카메라 장비를 렌탈했어요.
혹시 분쟁 생길까봐 Record 365로 기록해뒀는데 역시 잘한 선택!

📌 대여 시
- 카메라 바디, 렌즈 상태 꼼꼼히 촬영
- 기존 사용감 (미세 스크래치 등) 기록
- 렌탈업체 직원분께 확인 받음

📌 반납 시
- 동일하게 상태 촬영
- Before/After 비교해서 보여드림
- 깔끔하게 반납 완료!

📌 느낀 점
고가 장비일수록 기록이 중요한 것 같아요.
서로 기분 상할 일 없이 깔끔하게 마무리할 수 있어서 좋았습니다.

Record 365 추천드려요! 📸`,
  },

  // ========== 💬 질문/잡담 ==========
  {
    category: 'question',
    title: '전세 입주할 때 어디까지 사진 찍어야 할까요?',
    content: `다음 주에 새 전세집으로 이사가는데요, 나중에 퇴거할 때 분쟁 안 생기려면 뭘 찍어둬야 할지 모르겠어요.

선배님들 경험상 어디까지 찍어두시나요?

제가 생각한 건:
- 각 방 전체 사진
- 바닥 상태
- 벽지 상태
- 화장실

더 찍어둬야 할 곳 있으면 알려주세요! 🙏`,
  },
  {
    category: 'question',
    title: '렌트카 인수할 때 체크리스트 공유해요!',
    content: `렌트카 자주 빌리시는 분들을 위해 제가 쓰는 체크리스트 공유합니다!

📌 외관 체크
□ 앞/뒤 범퍼
□ 양쪽 사이드
□ 휠 4개
□ 사이드미러
□ 유리창 (금 간 곳 없는지)
□ 루프 (위쪽)

📌 실내 체크
□ 시트 상태
□ 대시보드
□ 센터콘솔
□ 트렁크

📌 기능 체크
□ 에어컨/히터
□ 와이퍼
□ 라이트
□ 계기판 경고등

📌 촬영 팁
- 360도 돌면서 촬영
- 기존 흠집은 클로즈업
- 날짜/시간 표시되게

다들 안전 운전하세요! 🚗💨`,
  },
  {
    category: 'question',
    title: '반려동물 키우면 원상복구 비용 더 나오나요?',
    content: `현재 고양이 2마리와 함께 월세 살고 있는데요, 나중에 이사갈 때 원상복구 비용이 더 나올까 걱정이에요.

벽지에 스크래치가 좀 있고, 바닥도 발톱 자국이 약간 있거든요...

혹시 반려동물 키우시는 분들 퇴거 경험 있으시면 공유해주세요!

📌 궁금한 점
1. 스크래치 수리비 얼마나 나왔나요?
2. 냄새 때문에 추가 비용 청구 받으신 적 있나요?
3. 특약에 반려동물 관련 내용 있으셨나요?

미리 감사합니다! 🐱🐱`,
  },
  {
    category: 'question',
    title: '이사할 때 가전제품 상태도 기록해두시나요?',
    content: `새 월세집에 빌트인 가전이 있는데 (냉장고, 세탁기, 에어컨 등), 이것도 따로 기록해두는 게 좋을까요?

혹시 가전제품 고장 때문에 분쟁 겪으신 분 계신가요?

어디까지 기록해둬야 할지 고민이네요...`,
  },
];

export default function SeedCommunityPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ success: 0, error: 0 });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const seedCommunity = async () => {
    if (!confirm('커뮤니티에 시딩 데이터를 추가하시겠습니까?')) return;
    
    setIsLoading(true);
    setLogs([]);
    addLog('🌱 커뮤니티 시딩 시작...');

    const communityRef = collection(db, 'community');
    let successCount = 0;
    let errorCount = 0;

    for (const post of SEED_DATA) {
      try {
        const docData = {
          userId: ADMIN_USER.userId,
          userNickname: ADMIN_USER.userNickname,
          category: post.category,
          title: post.title,
          content: post.content,
          images: [],
          timestamp: Timestamp.now(),
          comments: [],
          views: Math.floor(Math.random() * 500) + 100,
          likes: [],
        };

        await addDoc(communityRef, docData);
        addLog(`✅ 추가됨: ${post.title.substring(0, 40)}...`);
        successCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        addLog(`❌ 실패: ${post.title.substring(0, 40)}...`);
        errorCount++;
      }
    }

    setStats({ success: successCount, error: errorCount });
    addLog(`\n🎉 시딩 완료! 성공: ${successCount}건, 실패: ${errorCount}건`);
    setIsLoading(false);
  };

  const clearCommunity = async () => {
    if (!confirm('⚠️ 주의: 모든 커뮤니티 게시글을 삭제합니다. 계속하시겠습니까?')) return;
    if (!confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsLoading(true);
    setLogs([]);
    addLog('🗑️ 커뮤니티 데이터 삭제 시작...');

    try {
      const communityRef = collection(db, 'community');
      const snapshot = await getDocs(communityRef);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'community', docSnap.id));
        count++;
        if (count % 10 === 0) {
          addLog(`🗑️ ${count}건 삭제됨...`);
        }
      }

      addLog(`✅ 총 ${count}건 삭제 완료!`);
    } catch (error) {
      addLog(`❌ 삭제 실패: ${error}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🌱 커뮤니티 시딩 도구</h1>
        <p className="text-gray-600 mb-8">Record 365 커뮤니티에 샘플 데이터를 추가합니다.</p>

        {/* 버튼 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={seedCommunity}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '🌱 시딩 데이터 추가'}
          </button>
          <button
            onClick={clearCommunity}
            disabled={isLoading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '🗑️ 전체 삭제'}
          </button>
        </div>

        {/* 시딩 데이터 미리보기 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 시딩 데이터 미리보기</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {SEED_DATA.filter(d => d.category === 'event').length}
              </p>
              <p className="text-sm text-gray-600">🎁 이벤트</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {SEED_DATA.filter(d => d.category === 'dispute').length}
              </p>
              <p className="text-sm text-gray-600">⚠️ 분쟁사례</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {SEED_DATA.filter(d => d.category === 'review').length}
              </p>
              <p className="text-sm text-gray-600">✅ 사용후기</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {SEED_DATA.filter(d => d.category === 'question').length}
              </p>
              <p className="text-sm text-gray-600">💬 질문/잡담</p>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {SEED_DATA.map((post, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  post.category === 'event' ? 'bg-orange-100 text-orange-700' :
                  post.category === 'dispute' ? 'bg-red-100 text-red-700' :
                  post.category === 'review' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {post.category}
                </span>
                <span className="text-gray-700 truncate">{post.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 로그 */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">📝 실행 로그</h2>
            <div className="font-mono text-sm text-green-400 max-h-80 overflow-y-auto space-y-1">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>

            {stats.success > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4">
                <span className="text-green-400">✅ 성공: {stats.success}건</span>
                <span className="text-red-400">❌ 실패: {stats.error}건</span>
              </div>
            )}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ 주의사항</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 이 페이지는 개발/테스트 용도입니다.</li>
            <li>• 프로덕션 환경에서는 이 페이지를 삭제하거나 접근을 제한하세요.</li>
            <li>• 시딩 데이터의 userId는 'admin_record365'로 설정되어 있습니다.</li>
            <li>• 필요 시 ADMIN_USER 값을 실제 운영자 계정으로 변경하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}