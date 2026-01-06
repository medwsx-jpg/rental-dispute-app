'use client';

import { useRouter } from 'next/navigation';
import { DEFAULT_CHECKLISTS } from '@/types/rental';

export default function ProxyServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/en')} 
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Real Estate Photography Service</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Service Introduction */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Professional Photography<br />
              <span className="text-green-600">Storage Until Contract Expiration</span>
            </h2>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">✅</span>
                <p className="font-medium text-gray-900 mb-1">On-site Visit</p>
                <p className="text-sm text-gray-600">Professional visit on move-in/out day</p>
              </div>
              
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">📋</span>
                <p className="font-medium text-gray-900 mb-1">Systematic Checklist</p>
                <p className="text-sm text-gray-600">Thorough inspection of walls, floors, facilities</p>
              </div>
              
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">📱</span>
                <p className="font-medium text-gray-900 mb-1">Instant Report</p>
                <p className="text-sm text-gray-600">Report sent via KakaoTalk immediately</p>
              </div>

              <div className="text-center p-3">
                <span className="text-3xl block mb-2">💰</span>
                <p className="font-medium text-gray-900 mb-1">Reasonable Price</p>
                <p className="text-sm text-gray-600">30,000 KRW per session (Seoul/Gyeonggi)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            ✅ Real Estate Photography Checklist
          </h3>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Our professionals thoroughly check and photograph the following items
          </p>

          <div className="space-y-4">
            {Object.entries(DEFAULT_CHECKLISTS.house).map(([areaId, items]) => {
              const areaNames: Record<string, string> = {
                living: '🛋️ Living Room',
                kitchen: '🍳 Kitchen',
                bathroom: '🚿 Bathroom',
                bedroom: '🛏️ Bedroom',
                entrance: '🚪 Entrance',
                window: '🪟 Windows/Walls',
                balcony: '🌿 Balcony',
              };

              const itemTranslations: Record<string, string[]> = {
                living: [
                  'Wallpaper/paint condition',
                  'Floor scratches/stains',
                  'Lighting operation',
                  'Outlet operation',
                  'Window lock check'
                ],
                kitchen: [
                  'Sink damage/leaks',
                  'Gas range operation',
                  'Ventilator operation',
                  'Water leak check',
                  'Tile condition'
                ],
                bathroom: [
                  'Toilet operation/leaks',
                  'Sink leaks',
                  'Shower operation',
                  'Tile mold check',
                  'Ventilator operation'
                ],
                bedroom: [
                  'Wallpaper/paint condition',
                  'Floor condition',
                  'Window locks',
                  'Lighting operation',
                  'Closet/built-in closet condition'
                ],
                entrance: [
                  'Door lock check',
                  'Shoe cabinet condition',
                  'Floor condition',
                  'Intercom operation'
                ],
                window: [
                  'Window lock check',
                  'Glass cracks/damage',
                  'Screen condition',
                  'Wallpaper/paint condition'
                ],
                balcony: [
                  'Floor condition',
                  'Railing safety',
                  'Drain blockage',
                  'Window locks'
                ]
              };

              return (
                <div key={areaId} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{areaNames[areaId]}</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {itemTranslations[areaId].map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📢 How to Use</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">1.</span>
              <p><strong>Reservation:</strong> Staff assigned within 24 hours</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">2.</span>
              <p><strong>Photography:</strong> 30-40 minutes on-site visit</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">3.</span>
              <p><strong>Delivery:</strong> Report sent via KakaoTalk immediately</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">4.</span>
              <p><strong>Payment:</strong> KakaoPay/Bank transfer after completion</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Service Areas:</strong> Parts of Seoul/Gyeonggi. Please inquire for other areas.<br />
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Recommended For</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">👨‍💼</span>
              <div>
                <p className="font-medium text-gray-900">Busy Professionals</p>
                <p className="text-sm text-gray-600">Difficult to attend move-in/out</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <p className="font-medium text-gray-900">Property Managers</p>
                <p className="text-sm text-gray-600">Need systematic management of multiple properties</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📝</span>
              <div>
                <p className="font-medium text-gray-900">Dispute Prevention</p>
                <p className="text-sm text-gray-600">Want peace of mind with professional records</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="sticky bottom-4">
          <button
            onClick={() => window.open('http://pf.kakao.com/_ezNQn/chat', '_blank')}
            className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition shadow-lg"
          >
            💬 Contact via KakaoTalk
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-2">
            Or call: 010-6832-4158
          </p>
        </div>

      </main>
    </div>
  );
}