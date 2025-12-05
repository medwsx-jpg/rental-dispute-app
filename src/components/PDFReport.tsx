import React from 'react';
import { Rental, CAR_AREAS, HOUSE_AREAS } from '@/types/rental';

interface PDFReportProps {
  rental: Rental;
}

export const PDFReport = React.forwardRef<HTMLDivElement, PDFReportProps>(
  ({ rental }, ref) => {
    const areas = rental.type === 'car' ? CAR_AREAS : HOUSE_AREAS;

    const getPhotoForArea = (areaId: string, type: 'before' | 'after') => {
      const photos = type === 'before' ? rental.checkIn.photos : rental.checkOut.photos;
      return photos.find(p => p.area === areaId);
    };

    return (
      <div ref={ref} style={{ padding: '40px', backgroundColor: 'white' }}>
        {/* 표지 */}
        <div style={{ textAlign: 'center', marginBottom: '60px', paddingBottom: '40px', borderBottom: '3px solid #2563eb' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
            🏠 Record 365
          </h1>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', marginBottom: '30px' }}>
            Before / After 비교 리포트
          </h2>
          <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '10px' }}>
            {rental.title}
          </div>
          <div style={{ fontSize: '16px', color: '#9ca3af' }}>
            {new Date(rental.startDate).toLocaleDateString('ko-KR')} ~ {new Date(rental.endDate).toLocaleDateString('ko-KR')}
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 각 영역별 비교 */}
        {areas.map((area, index) => {
          const beforePhoto = getPhotoForArea(area.id, 'before');
          const afterPhoto = getPhotoForArea(area.id, 'after');

          if (!beforePhoto && !afterPhoto) return null;

          return (
            <div key={area.id} style={{ marginBottom: '60px', pageBreakInside: 'avoid' }}>
              <div style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '15px 20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>{area.icon}</span>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {area.name}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Before */}
                <div>
                  <div style={{ 
                    backgroundColor: '#dbeafe', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e40af'
                  }}>
                    📥 Before
                  </div>
                  {beforePhoto ? (
                    <div>
                      <img 
                        src={beforePhoto.url} 
                        alt="Before" 
                        style={{ 
                          width: '100%', 
                          height: '300px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }} 
                      />
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                        {new Date(beforePhoto.timestamp).toLocaleString('ko-KR')}
                      </div>
                      {beforePhoto.notes && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#374151', 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '6px'
                        }}>
                          📝 {beforePhoto.notes}
                        </div>
                      )}
                      {beforePhoto.location && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                          📍 GPS: {beforePhoto.location.lat.toFixed(6)}, {beforePhoto.location.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      height: '300px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
                    }}>
                      사진 없음
                    </div>
                  )}
                </div>

                {/* After */}
                <div>
                  <div style={{ 
                    backgroundColor: '#fed7aa', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#c2410c'
                  }}>
                    📤 After
                  </div>
                  {afterPhoto ? (
                    <div>
                      <img 
                        src={afterPhoto.url} 
                        alt="After" 
                        style={{ 
                          width: '100%', 
                          height: '300px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }} 
                      />
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                        {new Date(afterPhoto.timestamp).toLocaleString('ko-KR')}
                      </div>
                      {afterPhoto.notes && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#374151', 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '6px'
                        }}>
                          📝 {afterPhoto.notes}
                        </div>
                      )}
                      {afterPhoto.location && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                          📍 GPS: {afterPhoto.location.lat.toFixed(6)}, {afterPhoto.location.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      height: '300px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
                    }}>
                      사진 없음
                    </div>
                  )}
                </div>
              </div>

              {index < areas.length - 1 && (
                <div style={{ 
                  height: '1px', 
                  backgroundColor: '#e5e7eb', 
                  marginTop: '40px' 
                }} />
              )}
            </div>
          );
        })}

        {/* 서명 */}
        <div style={{ marginTop: '60px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
            ✍️ 서명
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {rental.checkIn.signature && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', marginBottom: '10px' }}>
                  Before 서명
                </div>
                <img 
                  src={rental.checkIn.signature} 
                  alt="Before 서명" 
                  style={{ 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '8px',
                    maxHeight: '120px',
                    backgroundColor: 'white'
                  }} 
                />
              </div>
            )}
            {rental.checkOut.signature && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ea580c', marginBottom: '10px' }}>
                  After 서명
                </div>
                <img 
                  src={rental.checkOut.signature} 
                  alt="After 서명" 
                  style={{ 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '8px',
                    maxHeight: '120px',
                    backgroundColor: 'white'
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ 
          marginTop: '60px', 
          paddingTop: '20px', 
          borderTop: '2px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <p>본 문서는 Record 365에서 생성되었습니다.</p>
          <p>© {new Date().getFullYear()} Record 365. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

PDFReport.displayName = 'PDFReport';