'use client';

import { useRouter } from 'next/navigation';
import { DEFAULT_CHECKLISTS } from '@/types/rental';

export default function ProxyServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/zh')} 
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← 返回
          </button>
          <h1 className="text-xl font-bold text-gray-900">房产拍摄代理服务</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 服务介绍 */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              入住/退房时专业代拍<br />
              <span className="text-green-600">保存至合同到期</span>
            </h2>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">✅</span>
                <p className="font-medium text-gray-900 mb-1">专家上门访问</p>
                <p className="text-sm text-gray-600">入住/退房当天现场访问</p>
              </div>
              
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">📋</span>
                <p className="font-medium text-gray-900 mb-1">系统化检查清单</p>
                <p className="text-sm text-gray-600">墙纸、地板、设施仔细确认</p>
              </div>
              
              <div className="text-center p-3">
                <span className="text-3xl block mb-2">📱</span>
                <p className="font-medium text-gray-900 mb-1">即时报告发送</p>
                <p className="text-sm text-gray-600">拍摄完成后立即通过KakaoTalk发送</p>
              </div>

              <div className="text-center p-3">
                <span className="text-3xl block mb-2">💰</span>
                <p className="font-medium text-gray-900 mb-1">合理价格</p>
                <p className="text-sm text-gray-600">每次30,000韩元（首尔/京畿基准）</p>
              </div>
            </div>
          </div>
        </div>

        {/* 检查清单预览 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            ✅ 房产拍摄检查清单
          </h3>
          <p className="text-sm text-gray-600 mb-4 text-center">
            专家会仔细确认并拍摄以下项目
          </p>

          <div className="space-y-4">
            {Object.entries(DEFAULT_CHECKLISTS.house).map(([areaId, items]) => {
              const areaNames: Record<string, string> = {
                living: '🛋️ 客厅',
                kitchen: '🍳 厨房',
                bathroom: '🚿 浴室',
                bedroom: '🛏️ 卧室',
                entrance: '🚪 玄关',
                window: '🪟 窗户/墙',
                balcony: '🌿 阳台',
              };

              const itemTranslations: Record<string, string[]> = {
                living: [
                  '墙纸/油漆状态',
                  '地板划痕/污渍',
                  '照明运行确认',
                  '插座运行确认',
                  '窗户锁确认'
                ],
                kitchen: [
                  '水槽损坏/漏水',
                  '燃气灶运行',
                  '排风扇运行',
                  '水管漏水确认',
                  '瓷砖状态确认'
                ],
                bathroom: [
                  '马桶运行/漏水',
                  '洗手池漏水',
                  '淋浴运行',
                  '瓷砖发霉确认',
                  '排风扇运行'
                ],
                bedroom: [
                  '墙纸/油漆状态',
                  '地板状态',
                  '窗户锁',
                  '照明运行',
                  '衣柜/嵌入式衣柜状态'
                ],
                entrance: [
                  '门锁确认',
                  '鞋柜状态',
                  '地板状态',
                  '对讲机运行'
                ],
                window: [
                  '窗户锁确认',
                  '玻璃破损/裂缝确认',
                  '纱窗状态',
                  '墙纸/油漆状态'
                ],
                balcony: [
                  '地板状态',
                  '栏杆安全性',
                  '排水口堵塞',
                  '窗户锁'
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

        {/* 使用指南 */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📢 使用指南</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">1.</span>
              <p><strong>预约:</strong> 申请后24小时内安排负责人</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">2.</span>
              <p><strong>拍摄:</strong> 约定时间现场访问后30-40分钟</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">3.</span>
              <p><strong>发送:</strong> 拍摄完成即刻通过KakaoTalk发送报告</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">4.</span>
              <p><strong>结算:</strong> 拍摄完成后KakaoPay/银行转账</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>当前服务地区:</strong> 首尔/京畿部分地区，其他地区请另行咨询。<br />
            </p>
          </div>
        </div>

        {/* 附加信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💡 推荐给这些人</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">👨‍💼</span>
              <div>
                <p className="font-medium text-gray-900">忙碌的上班族</p>
                <p className="text-sm text-gray-600">难以参加入住/退房时间</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <p className="font-medium text-gray-900">房产租赁业者</p>
                <p className="text-sm text-gray-600">需要系统管理多个物业</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📝</span>
              <div>
                <p className="font-medium text-gray-900">预防纠纷</p>
                <p className="text-sm text-gray-600">希望通过专业记录安心</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 按钮 */}
        <div className="sticky bottom-4">
          <button
            onClick={() => window.open('http://pf.kakao.com/_ezNQn/chat', '_blank')}
            className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition shadow-lg"
          >
            💬 通过KakaoTalk咨询
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-2">
            或电话咨询: 010-6832-4158
          </p>
        </div>

      </main>
    </div>
  );
}