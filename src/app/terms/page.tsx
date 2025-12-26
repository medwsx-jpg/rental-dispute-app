'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">서비스 이용약관</h1>
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

          {/* 제1조 목적 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제1조 (목적)
            </h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관은 Record365.co.kr(이하 "회사")가 제공하는 렌탈 기록 서비스(이하 "서비스")의 
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 
              규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 정의 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제2조 (정의)
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-gray-700">
                <strong>1. "서비스"</strong>란 회사가 제공하는 렌탈 물품(차량, 부동산, 물품 등)의 
                상태를 사진으로 기록하고, 전자 서명을 통해 증거를 확보하는 웹/앱 서비스를 말합니다.
              </p>
              <p className="text-gray-700">
                <strong>2. "이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 
                회원 및 비회원을 말합니다.
              </p>
              <p className="text-gray-700">
                <strong>3. "회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 
                회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 말합니다.
              </p>
              <p className="text-gray-700">
                <strong>4. "렌탈 기록"</strong>이란 회원이 서비스를 통해 생성한 사진, 메모, 
                체크리스트, 전자 서명 등의 데이터를 말합니다.
              </p>
            </div>
          </section>

          {/* 제3조 약관의 효력 및 변경 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
              </p>
              <p className="text-gray-700">
                2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 
                변경된 약관은 서비스 내 공지사항을 통해 공지한 날로부터 7일 후부터 효력이 발생합니다.
              </p>
              <p className="text-gray-700">
                3. 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 
                탈퇴할 수 있습니다.
              </p>
            </div>
          </section>

          {/* 제4조 회원가입 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제4조 (회원가입)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회원가입은 이용자가 본 약관에 동의하고, 회사가 정한 절차에 따라 
                가입신청을 하여 회사가 이를 승낙함으로써 체결됩니다.
              </p>
              <p className="text-gray-700">
                2. 회원가입 시 제공한 정보는 정확해야 하며, 허위 정보 제공 시 
                서비스 이용이 제한될 수 있습니다.
              </p>
              <p className="text-gray-700">
                3. 만 14세 미만의 아동은 회원가입을 할 수 없습니다.
              </p>
            </div>
          </section>

          {/* 제5조 서비스의 제공 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제5조 (서비스의 제공)
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700">회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 렌탈 물품의 사진 촬영 및 기록 기능</li>
                <li>• Before/After 사진 비교 기능</li>
                <li>• 체크리스트 작성 및 관리 기능</li>
                <li>• 전자 서명 기능</li>
                <li>• 렌탈 기록 저장 및 조회 기능</li>
                <li>• 기타 회사가 추가로 개발하는 서비스</li>
              </ul>
            </div>
          </section>

          {/* 제6조 서비스의 제한 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제6조 (서비스의 제한 및 중단)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
              </p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 시스템 정기점검, 보수, 교체</li>
                <li>• 통신 두절 등의 기술적 사유</li>
                <li>• 천재지변, 국가비상사태 등 불가항력</li>
              </ul>
              <p className="text-gray-700 mt-3">
                2. 회사는 서비스 중단 시 사전에 공지하며, 불가피한 경우 사후 공지할 수 있습니다.
              </p>
            </div>
          </section>

          {/* 제7조 무료 및 유료 서비스 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제7조 (무료 및 유료 서비스)
            </h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
              <p className="text-gray-700">
                <strong>1. 무료 서비스</strong>
              </p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 신규 회원: 렌탈 기록 1건 무료 제공</li>
                <li>• 무료 제공 이후에는 유료 전환 필요</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>2. 프리미엄 서비스</strong>
              </p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 무제한 렌탈 기록 생성</li>
                <li>• 요금제 및 결제 방법은 별도 공지</li>
              </ul>
            </div>
          </section>

          {/* 제8조 회원의 의무 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제8조 (회원의 의무)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">회원은 다음 행위를 해서는 안 됩니다:</p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 허위 정보 제공 또는 타인의 정보 도용</li>
                <li>• 서비스 운영을 방해하는 행위</li>
                <li>• 다른 회원의 개인정보를 수집, 저장, 공개</li>
                <li>• 회사 및 제3자의 지적재산권 침해</li>
                <li>• 음란물, 불법 정보 게시 또는 전송</li>
                <li>• 기타 관련 법령에 위배되는 행위</li>
              </ul>
            </div>
          </section>

          {/* 제9조 회사의 의무 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제9조 (회사의 의무)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회사는 관련 법령과 본 약관을 준수하며, 지속적이고 안정적인 서비스를 
                제공하기 위해 노력합니다.
              </p>
              <p className="text-gray-700">
                2. 회사는 이용자의 개인정보 보호를 위해 개인정보처리방침을 수립하고 
                이를 준수합니다.
              </p>
              <p className="text-gray-700">
                3. 회사는 이용자의 의견을 수렴하여 서비스 개선에 반영하도록 노력합니다.
              </p>
            </div>
          </section>

          {/* 제10조 저작권 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제10조 (저작권 및 지적재산권)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회사가 제공하는 서비스, 그에 필요한 소프트웨어, 이미지, 마크, 로고, 
                디자인 등의 저작권 및 지적재산권은 회사에 귀속됩니다.
              </p>
              <p className="text-gray-700">
                2. 이용자가 서비스에 업로드한 사진, 메모 등의 콘텐츠에 대한 저작권은 
                해당 이용자에게 있습니다.
              </p>
              <p className="text-gray-700">
                3. 이용자는 서비스를 통해 생성한 렌탈 기록을 서비스의 목적(분쟁 예방 및 해결)에 
                맞게 사용할 수 있습니다.
              </p>
            </div>
          </section>

          {/* 제11조 면책 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제11조 (면책 조항)
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3">
              <p className="text-gray-700">
                1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 
                인한 서비스 중단에 대해 책임을 지지 않습니다.
              </p>
              <p className="text-gray-700">
                2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
              </p>
              <p className="text-gray-700">
                3. 회사는 이용자가 서비스를 이용하여 얻은 정보의 정확성, 신뢰성에 대해 
                보증하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
              </p>
              <p className="text-gray-700">
                4. 회사가 제공하는 서비스는 렌탈 상태 기록을 지원하는 도구이며, 
                법적 분쟁의 결과를 보장하지 않습니다.
              </p>
            </div>
          </section>

          {/* 제12조 분쟁 해결 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제12조 (분쟁 해결)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회사는 이용자로부터 제기되는 불만사항 및 의견을 신속하게 처리합니다.
              </p>
              <p className="text-gray-700">
                2. 회사와 이용자 간 발생한 분쟁에 관한 소송은 대한민국 법을 준거법으로 하며, 
                회사의 본사 소재지를 관할하는 법원을 제1심 관할법원으로 합니다.
              </p>
            </div>
          </section>

          {/* 제13조 회원 탈퇴 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              제13조 (회원 탈퇴 및 자격 상실)
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                1. 회원은 언제든지 서비스 내 '회원 탈퇴' 메뉴를 통해 탈퇴를 요청할 수 있습니다.
              </p>
              <p className="text-gray-700">
                2. 회사는 회원이 다음에 해당하는 경우 사전 통보 후 회원 자격을 제한 또는 
                정지시킬 수 있습니다:
              </p>
              <ul className="text-gray-700 ml-6 space-y-1">
                <li>• 가입 시 허위 정보를 기재한 경우</li>
                <li>• 다른 이용자의 서비스 이용을 방해하는 경우</li>
                <li>• 본 약관을 위반한 경우</li>
              </ul>
            </div>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              부칙
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                본 약관은 2025년 1월 1일부터 시행됩니다.
              </p>
            </div>
          </section>

          {/* 하단 */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              본 약관과 관련하여 문의사항이 있으시면 medws@naver.com으로 연락 주시기 바랍니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}