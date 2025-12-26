'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">개인정보처리방침</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 뒤로
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* 시행일 */}
          <div className="border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-600">시행일: 2025년 1월 1일</p>
            <p className="text-sm text-gray-600">최종 수정일: 2025년 12월 26일</p>
          </div>

          {/* 서론 */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Record365.co.kr(이하 "회사")는 이용자의 개인정보를 중요시하며, 
              「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 
              관련 법령을 준수하고 있습니다.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              본 개인정보처리방침은 회사가 제공하는 렌탈 기록 서비스(이하 "서비스")를 
              이용하는 과정에서 수집되는 개인정보의 항목, 이용 목적, 보유 및 이용 기간, 
              파기 절차 등을 안내합니다.
            </p>
          </section>

          {/* 1. 수집하는 개인정보 항목 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. 수집하는 개인정보 항목
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  1.1 회원가입 시 수집 항목
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700"><strong>• 이메일 가입:</strong> 이메일 주소, 비밀번호, 휴대폰 번호, 닉네임</p>
                  <p className="text-gray-700"><strong>• 카카오 로그인:</strong> 카카오 계정 정보(이메일, 닉네임, 카카오 ID)</p>
                  <p className="text-gray-700"><strong>• 사업자 회원:</strong> 사업자 구분, 상호명</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  1.2 서비스 이용 과정에서 자동 수집되는 정보
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">• 사진 촬영 시 GPS 위치 정보 (사용자 동의 시)</p>
                  <p className="text-gray-700">• 사진 촬영 시간 정보</p>
                  <p className="text-gray-700">• 렌탈 기록 정보 (차량 정보, 부동산 정보 등)</p>
                  <p className="text-gray-700">• 서비스 이용 기록, 접속 로그, 쿠키</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  1.3 선택적 수집 항목
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">• 마케팅 정보 수신 동의 (선택)</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 개인정보 수집 및 이용 목적 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. 개인정보 수집 및 이용 목적
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="font-semibold text-gray-800">2.1 회원 관리</p>
                <p className="text-gray-700 text-sm">회원제 서비스 제공, 본인 확인, 부정 이용 방지, 분쟁 조정</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">2.2 서비스 제공</p>
                <p className="text-gray-700 text-sm">렌탈 기록 생성 및 관리, 사진 업로드 및 저장, 전자 서명 기능 제공</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">2.3 서비스 개선</p>
                <p className="text-gray-700 text-sm">신규 서비스 개발, 통계 분석, 맞춤형 서비스 제공</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">2.4 마케팅 (선택 동의 시)</p>
                <p className="text-gray-700 text-sm">이벤트 안내, 신규 서비스 소개, 광고성 정보 전송</p>
              </div>
            </div>
          </section>

          {/* 3. 개인정보 보유 및 이용 기간 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. 개인정보 보유 및 이용 기간
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-gray-700">
                <strong>• 회원 탈퇴 시:</strong> 즉시 파기 (단, 관련 법령에 따라 보존이 필요한 경우 예외)
              </p>
              <p className="text-gray-700">
                <strong>• 서비스 미이용 5년:</strong> 개인정보 파기 또는 별도 분리 보관
              </p>
              <p className="text-gray-700 mt-4">
                <strong>법령에 따른 보존:</strong>
              </p>
              <ul className="text-sm text-gray-600 ml-6 space-y-1">
                <li>• 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>• 소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
                <li>• 접속 로그 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </div>
          </section>

          {/* 4. 개인정보 제3자 제공 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              4. 개인정보 제3자 제공
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-700">
                회사는 원칙적으로 <strong>이용자의 개인정보를 제3자에게 제공하지 않습니다.</strong>
              </p>
              <p className="text-gray-700 mt-2 text-sm">
                단, 다음의 경우 예외로 합니다:
              </p>
              <ul className="text-sm text-gray-600 ml-6 mt-2 space-y-1">
                <li>• 이용자가 사전에 동의한 경우</li>
                <li>• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 요구가 있는 경우</li>
              </ul>
            </div>
          </section>

          {/* 5. 개인정보 처리 위탁 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              5. 개인정보 처리 위탁
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300">
                  <tr>
                    <th className="text-left py-2 text-gray-800">수탁업체</th>
                    <th className="text-left py-2 text-gray-800">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 text-gray-700">Google Firebase</td>
                    <td className="py-2 text-gray-700">회원 정보 관리, 데이터 저장</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-700">Vercel</td>
                    <td className="py-2 text-gray-700">웹 호스팅 및 서비스 운영</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-700">카카오</td>
                    <td className="py-2 text-gray-700">카카오 로그인 인증</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. 이용자의 권리 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              6. 이용자의 권리와 행사 방법
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700">이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 개인정보 열람, 정정, 삭제 요구</li>
                <li>• 개인정보 처리 정지 요구</li>
                <li>• 회원 탈퇴 (계정 삭제)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>권리 행사 방법:</strong> 서비스 내 '내정보' 메뉴 또는 이메일(medws1@naver.com)을 통해 요청
              </p>
            </div>
          </section>

          {/* 7. 개인정보 파기 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              7. 개인정보 파기 절차 및 방법
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="font-semibold text-gray-800">7.1 파기 절차</p>
                <p className="text-gray-700 text-sm">보유 기간이 경과하거나 처리 목적 달성 시 즉시 파기</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">7.2 파기 방법</p>
                <p className="text-gray-700 text-sm">전자적 파일: 복구 불가능한 방법으로 영구 삭제</p>
                <p className="text-gray-700 text-sm">종이 문서: 분쇄 또는 소각</p>
              </div>
            </div>
          </section>

          {/* 8. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              8. 개인정보 보호책임자
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
                개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위하여 
                아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="mt-4 space-y-1 text-gray-700">
                <p><strong>• 담당자:</strong> Record365 개인정보 보호팀</p>
                <p><strong>• 이메일:</strong> medws1@naver.com</p>
              </div>
            </div>
          </section>

          {/* 9. 개인정보 처리방침 변경 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              9. 개인정보 처리방침 변경
            </h2>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-gray-700">
                본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며, 
                변경 사항은 서비스 내 공지사항을 통해 공지합니다.
              </p>
            </div>
          </section>

          {/* 10. 고지 의무 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              10. 고지 의무
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 시에는 
                개정 최소 7일 전부터 서비스 내 '공지사항'을 통해 고지할 것입니다. 
                다만, 개인정보의 수집 및 활용, 제3자 제공 등과 같이 이용자 권리의 
                중요한 변경이 있을 경우에는 최소 30일 전에 고지합니다.
              </p>
            </div>
          </section>

          {/* 하단 */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              본 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}