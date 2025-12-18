'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChecklistItem, AreaChecklist, DEFAULT_CHECKLISTS } from '@/types/rental';

interface ChecklistSectionProps {
  rentalId: string;
  rentalType: 'car' | 'house' | 'goods';
  areaId: string;
  type: 'before' | 'after';
  existingChecklists?: AreaChecklist[];
  onUpdate?: (checklists: AreaChecklist[]) => void;
}

export default function ChecklistSection({
  rentalId,
  rentalType,
  areaId,
  type,
  existingChecklists = [],
  onUpdate
}: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    // 기존 체크리스트 로드 또는 기본 체크리스트 생성
    const existingChecklist = existingChecklists.find(c => c.areaId === areaId);
    
    if (existingChecklist) {
      setItems(existingChecklist.items);
    } else {
      // 기본 체크리스트 생성
      const defaultItems = DEFAULT_CHECKLISTS[rentalType]?.[areaId] || [];
      const checklistItems: ChecklistItem[] = defaultItems.map((text, index) => ({
        id: `default_${index}`,
        text,
        checked: false
      }));
      setItems(checklistItems);
    }
  }, [areaId, rentalType, existingChecklists]);

  const saveToFirebase = async (updatedItems: ChecklistItem[]) => {
    try {
      // 현재 영역의 체크리스트 업데이트
      const updatedChecklists = existingChecklists.filter(c => c.areaId !== areaId);
      updatedChecklists.push({
        areaId,
        items: updatedItems
      });

      const rentalRef = doc(db, 'rentals', rentalId);
      const fieldPath = type === 'before' ? 'checkIn.checklists' : 'checkOut.checklists';
      
      await updateDoc(rentalRef, {
        [fieldPath]: updatedChecklists
      });

      if (onUpdate) {
        onUpdate(updatedChecklists);
      }
    } catch (error) {
      console.error('체크리스트 저장 실패:', error);
    }
  };

  const handleToggle = async (itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          checked: !item.checked,
          checkedAt: !item.checked ? Date.now() : undefined
        };
      }
      return item;
    });

    setItems(updatedItems);
    await saveToFirebase(updatedItems);
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      text: newItemText.trim(),
      checked: false
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    await saveToFirebase(updatedItems);

    setNewItemText('');
    setShowAddInput(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    // 기본 항목은 삭제 불가
    if (itemId.startsWith('default_')) {
      alert('기본 항목은 삭제할 수 없습니다.');
      return;
    }

    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    await saveToFirebase(updatedItems);
  };

  const completionRate = items.length > 0 
    ? Math.round((items.filter(i => i.checked).length / items.length) * 100)
    : 0;

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          ✅ 확인 사항
          <span className="text-xs text-gray-500">
            ({items.filter(i => i.checked).length}/{items.length})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600">
            완료율: <span className="font-medium text-blue-600">{completionRate}%</span>
          </div>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div 
            key={item.id}
            className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition group"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggle(item.id)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label 
              className={`flex-1 text-sm cursor-pointer select-none ${
                item.checked ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}
              onClick={() => handleToggle(item.id)}
            >
              {item.text}
            </label>
            {item.id.startsWith('custom_') && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddInput ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="확인 항목 입력..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewItemText('');
              }}
              className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddInput(true)}
          className="w-full mt-3 py-2 text-sm border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition"
        >
          ➕ 항목 추가
        </button>
      )}
    </div>
  );
}