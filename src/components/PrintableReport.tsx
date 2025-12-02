import React from 'react';

interface PrintableReportProps {
  rental: any;
  areas: any[];
}

export const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ rental, areas }, ref) => {
    const getBeforePhoto = (areaId: string) => {
      return rental?.checkIn.photos.find((p: any) => p.area === areaId);
    };

    const getAfterPhoto = (areaId: string) => {
      return rental?.checkOut.photos.find((p: any) => p.area === areaId);
    };

    return (
      <div ref={ref} className="p-8 bg-white">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          `}
        </style>

        {/* 헤더 */}
        <div className="mb-8 border-b-2 border-blue-600 pb-4">
          <h1 className="text-3xl font-bold text-blue-600">Record 365</h1>
          <p className="text-xl text-gray-700 mt-2">렌탈 분쟁 해결 리포트</p>
        </div>

        {/* 기본 정보 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📋 기본 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">제목</p>
              <p className="font-medium">{rental.title}</p>
            </div>
            <div>
              <p className="text-gray-600">유형</p>
              <p className="font-medium">{rental.type === 'car' ? '🚗 렌터카' : '🏠 월세'}</p>
            </div>
            <div>
              <p className="text-gray-600">시작일</p>
              <p className="font-medium">{new Date(rental.startDate).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-gray-600">종료일</p>
              <p className="font-medium">{new Date(rental.endDate).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-gray-600">Before 사진</p>
              <p className="font-medium">{rental.checkIn.photos.length}장</p>
            </div>
            <div>
              <p className="text-gray-600">After 사진</p>
              <p className="font-medium">{rental.checkOut.photos.length}장</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">생성일</p>
              <p className="font-medium">{new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* Before/After 비교 */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">📸 Before / After 비교</h2>
          
          {areas.map((area) => {
            const beforePhoto = getBeforePhoto(area.id);
            const afterPhoto = getAfterPhoto(area.id);

            if (!beforePhoto && !afterPhoto) return null;

            return (
              <div key={area.id} className="mb-8 break-inside-avoid">
                <h3 className="text-lg font-bold mb-3 text-gray-700">
                  {area.icon} {area.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-2">📥 Before</p>
                    {beforePhoto ? (
                      <div>
                        <img 
                          src={beforePhoto.url} 
                          alt="Before" 
                          className="w-full h-48 object-cover rounded border"
                        />
                        {beforePhoto.notes && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                            📝 {beforePhoto.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(beforePhoto.timestamp).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400">사진 없음</span>
                      </div>
                    )}
                  </div>

                  {/* After */}
                  <div>
                    <p className="text-sm font-medium text-orange-500 mb-2">📤 After</p>
                    {afterPhoto ? (
                      <div>
                        <img 
                          src={afterPhoto.url} 
                          alt="After" 
                          className="w-full h-48 object-cover rounded border"
                        />
                        {afterPhoto.notes && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                            📝 {afterPhoto.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(afterPhoto.timestamp).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400">사진 없음</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>이 리포트는 Record 365에서 생성되었습니다.</p>
          <p>{window.location.origin}</p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';
