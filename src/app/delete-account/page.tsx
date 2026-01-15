export default function DeleteAccountPage() {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">계정 및 데이터 삭제 요청</h1>
          
          <p className="text-gray-600 mb-4">
            Record 365 계정 및 데이터 삭제를 원하시면 아래 방법으로 요청해 주세요.
          </p>
          
          <div className="bg-gray-100 rounded p-4 mb-4">
            <p className="font-semibold mb-2">삭제 요청 방법</p>
            <p className="text-sm text-gray-600">
              이메일: <a href="mailto:support@record365.co.kr" className="text-blue-600">support@record365.co.kr</a>
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p className="font-semibold mb-2">삭제되는 데이터:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>계정 정보 (이메일, 이름)</li>
              <li>촬영 기록 및 사진</li>
              <li>체크리스트 및 서명 데이터</li>
            </ul>
            <p className="mt-2">* 요청 후 7일 이내 처리됩니다.</p>
          </div>
        </div>
      </div>
    );
  }