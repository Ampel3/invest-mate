import React, { useState, useMemo } from 'react';
import { Investment } from '../types';
import { toROCDate, formatCurrency } from '../utils';
import { X, AlertTriangle, ArrowRight, Copy, CheckCircle, RefreshCw, Plus } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'skip' | 'overwrite' | 'new') => void;
  existingData: Investment[];
  incomingData: Investment[];
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  existingData, 
  incomingData 
}) => {
  const [strategy, setStrategy] = useState<'skip' | 'overwrite' | 'new'>('skip');

  const analysis = useMemo(() => {
    const existingIds = new Set(existingData.map(i => i.id));
    const conflicts = incomingData.filter(i => existingIds.has(i.id));
    const newItems = incomingData.filter(i => !existingIds.has(i.id));
    return {
      total: incomingData.length,
      conflicts,
      newItems,
      hasConflicts: conflicts.length > 0
    };
  }, [existingData, incomingData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            匯入預覽與確認
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-sm text-slate-500 font-bold mb-1">讀取總筆數</div>
              <div className="text-2xl font-bold text-slate-800">{analysis.total}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
              <div className="text-sm text-emerald-700 font-bold mb-1">新增資料 (無衝突)</div>
              <div className="text-2xl font-bold text-emerald-700">+{analysis.newItems.length}</div>
            </div>
            <div className={`p-4 rounded-xl border shadow-sm text-center ${analysis.hasConflicts ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`text-sm font-bold mb-1 ${analysis.hasConflicts ? 'text-amber-700' : 'text-slate-500'}`}>
                {analysis.hasConflicts ? 'ID 重複 / 衝突' : '無衝突'}
              </div>
              <div className={`text-2xl font-bold ${analysis.hasConflicts ? 'text-amber-700' : 'text-slate-400'}`}>
                {analysis.conflicts.length}
              </div>
            </div>
          </div>

          {/* Strategy Selection */}
          {analysis.hasConflicts && (
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500"/>
                    請選擇重複資料處理方式：
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`cursor-pointer p-3 rounded-lg border-2 flex items-start gap-3 transition-all ${strategy === 'skip' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="strategy" value="skip" checked={strategy === 'skip'} onChange={() => setStrategy('skip')} className="mt-1" />
                        <div>
                            <span className="block font-bold text-slate-900">略過重複 (Skip)</span>
                            <span className="text-xs text-slate-500">保留現有資料，僅匯入 ID 不重複的新項目。</span>
                        </div>
                    </label>

                    <label className={`cursor-pointer p-3 rounded-lg border-2 flex items-start gap-3 transition-all ${strategy === 'overwrite' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="strategy" value="overwrite" checked={strategy === 'overwrite'} onChange={() => setStrategy('overwrite')} className="mt-1" />
                        <div>
                            <span className="block font-bold text-slate-900">覆蓋舊資料 (Overwrite)</span>
                            <span className="text-xs text-slate-500">使用匯入檔的內容覆蓋重複的項目，並加入新項目。</span>
                        </div>
                    </label>

                    <label className={`cursor-pointer p-3 rounded-lg border-2 flex items-start gap-3 transition-all ${strategy === 'new' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="strategy" value="new" checked={strategy === 'new'} onChange={() => setStrategy('new')} className="mt-1" />
                        <div>
                            <span className="block font-bold text-slate-900">建立為新資料 (Clone)</span>
                            <span className="text-xs text-slate-500">忽略 ID，強制將所有匯入資料視為新項目加入 (會產生新 ID)。</span>
                        </div>
                    </label>
                </div>
             </div>
          )}

          {!analysis.hasConflicts && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span>所有資料 ID 皆為新項目，將直接匯入。</span>
              </div>
          )}

          {/* Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-sm">
                 資料預覽 ({incomingData.length} 筆)
             </div>
             <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm">
                        <tr>
                            <th className="px-4 py-2 w-24">狀態</th>
                            <th className="px-4 py-2">掛名人</th>
                            <th className="px-4 py-2">日期</th>
                            <th className="px-4 py-2 text-right">金額</th>
                            <th className="px-4 py-2 text-right">單號 / ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {incomingData.map((item, idx) => {
                            const isConflict = analysis.conflicts.includes(item);
                            return (
                                <tr key={item.id || idx} className={isConflict ? 'bg-amber-50/50' : ''}>
                                    <td className="px-4 py-2">
                                        {isConflict ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                <AlertTriangle size={12}/> 重複
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <Plus size={12}/> 新增
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-800">{item.source}</td>
                                    <td className="px-4 py-2 text-slate-600">{toROCDate(item.startDate)}</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">{formatCurrency(item.amount)}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{item.ticketNumber || item.id}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100 rounded-lg transition-colors">
             取消匯入
          </button>
          <button 
             onClick={() => onConfirm(analysis.hasConflicts ? strategy : 'skip')} 
             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
          >
             {analysis.hasConflicts && strategy === 'overwrite' ? <RefreshCw size={18}/> : <ArrowRight size={18}/>}
             確認匯入 ({strategy === 'new' ? analysis.total : (analysis.hasConflicts && strategy === 'skip' ? analysis.newItems.length : analysis.total)} 筆)
          </button>
        </div>
      </div>
    </div>
  );
};