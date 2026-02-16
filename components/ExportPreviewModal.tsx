import React, { useMemo } from 'react';
import { Investment } from '../types';
import { formatCurrency, toROCDate, calculatePeriodDiff } from '../utils';
import { X, FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Investment[];
  onConfirm: (type: 'json' | 'xlsx' | 'csv') => void;
  selectedType: 'json' | 'xlsx' | 'csv';
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({ isOpen, onClose, data, onConfirm, selectedType }) => {
  if (!isOpen) return null;

  // Prepare sorted preview data
  const previewData = useMemo(() => {
      return [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [data]);

  const totalAmount = previewData.reduce((sum, item) => sum + item.amount, 0);

  const getIcon = () => {
      switch(selectedType) {
          case 'json': return <FileJson size={24} className="text-yellow-600"/>;
          case 'xlsx': return <FileSpreadsheet size={24} className="text-emerald-600"/>;
          case 'csv': return <FileText size={24} className="text-blue-600"/>;
      }
  };

  const getLabel = () => {
      switch(selectedType) {
          case 'json': return 'JSON';
          case 'xlsx': return 'Excel (XLSX)';
          case 'csv': return 'CSV';
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            匯出預覽 ({getLabel()})
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
           
           {/* Summary Stats */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">總筆數</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">{previewData.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center col-span-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">總本金合計</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</div>
                </div>
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 text-sm flex justify-between">
                    <span>資料內容 (依自訂排序)</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">僅顯示前 50 筆供預覽</span>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-4 py-2 w-16 text-center">排序</th>
                                <th className="px-4 py-2">機構/專案</th>
                                <th className="px-4 py-2 text-right">本金</th>
                                <th className="px-4 py-2 text-center">利率</th>
                                <th className="px-4 py-2 text-center">起息日</th>
                                <th className="px-4 py-2 text-center">到期日</th>
                                <th className="px-4 py-2">狀態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {previewData.slice(0, 50).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-2 text-center font-mono text-slate-400">{item.order || '-'}</td>
                                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{item.source}</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.amount)}</td>
                                    <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{item.rate}%</td>
                                    <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{toROCDate(item.startDate)}</td>
                                    <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{toROCDate(item.endDate)}</td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
           </div>
        </div>

        <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
             取消
          </button>
          <button 
             onClick={() => onConfirm(selectedType)} 
             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
          >
             <Download size={18}/>
             確認下載
          </button>
        </div>
      </div>
    </div>
  );
};
