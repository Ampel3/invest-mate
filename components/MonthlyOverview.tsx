import React, { useState, useMemo } from 'react';
import { Investment, AppSettings } from '../types';
import { getMonthlyReport, formatCurrency, toROCDate, MonthlyReportItem, getRateColorClass } from '../utils';
import { ChevronDown, ChevronRight, CheckSquare, Square, CalendarDays, ArrowUpRight, ArrowDownLeft, Coins, History, GripVertical, Edit2, Copy, Trash2, Calendar, Clock, ArrowRight, Building2, Layers } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MonthlyOverviewProps {
  investments: Investment[];
  settings?: AppSettings;
  onBulkPay: (monthStr: string) => void;
  onUpdatePayment: (invId: string, period: number, isPaid: boolean) => void;
  onEdit: (inv: Investment) => void;
  onCopy: (inv: Investment) => void;
  onDelete: (id: string) => void;
}

// Sortable Table Row Component for Interest Detail
const SortableInterestRow = ({ 
    id, 
    item,
    onUpdatePayment,
    onEdit,
    onCopy,
    onDelete,
    investments,
    startDate,
    settings
}: { 
    id: string, 
    item: any,
    onUpdatePayment: (invId: string, period: number, isPaid: boolean) => void,
    onEdit: (inv: Investment) => void,
    onCopy: (inv: Investment) => void,
    onDelete: (id: string) => void,
    investments: Investment[],
    startDate?: string,
    settings?: AppSettings
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
    };

    const handleAction = (action: 'edit' | 'copy' | 'delete', e: React.MouseEvent) => {
        e.stopPropagation();
        const fullInv = investments.find(i => i.id === item.invId);
        if (!fullInv) return;

        if (action === 'edit') onEdit(fullInv);
        if (action === 'copy') onCopy(fullInv);
        if (action === 'delete') onDelete(item.invId);
    };

    const rowColor = getRateColorClass(item.rate, settings?.rateColorMap);

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors ${isDragging ? 'bg-blue-50 dark:bg-blue-900/40 shadow-md opacity-90' : `${rowColor} hover:brightness-95 dark:hover:brightness-110`}`}
        >
             <td className="px-2 py-3 text-center w-12 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-300 hover:text-blue-500 touch-none" {...attributes} {...listeners}>
                <GripVertical size={18} className="mx-auto" />
             </td>
             <td className="px-4 py-3">
                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.source}</div>
                {item.ticketNumber && <div className="text-xs text-blue-600 dark:text-blue-300 font-mono mt-0.5">{item.ticketNumber}</div>}
             </td>
             <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-slate-600 dark:text-slate-300 font-mono text-sm font-medium">{startDate ? toROCDate(startDate) : '-'}</span>
             </td>
             <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-slate-600 dark:text-slate-300 font-mono text-sm font-medium">{toROCDate(item.dueDate)}</span>
             </td>
             <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex flex-col items-end">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(item.amount)}</span>
                    <span className="bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-1.5 rounded text-[10px] font-bold font-mono">第 {item.period} 期</span>
                </div>
             </td>
             <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onUpdatePayment(item.invId, item.period, !item.isPaid);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                            item.isPaid 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        {item.isPaid ? <CheckSquare size={14}/> : <Square size={14}/>}
                        <span>{item.isPaid ? '已入帳' : '未入帳'}</span>
                    </button>
                    
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                    
                    <button 
                        onClick={(e) => handleAction('edit', e)}
                        className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/50"
                        title="修改"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => handleAction('copy', e)}
                        className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                        title="複製"
                    >
                        <Copy size={16} />
                    </button>
                    <button 
                        onClick={(e) => handleAction('delete', e)}
                        className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/50"
                        title="刪除"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
             </td>
        </tr>
    );
};

// Helper component for rendering a single month row to avoid duplication
const MonthRow = ({ 
    item, 
    isExpanded, 
    toggleMonth, 
    currentMonthStr, 
    onBulkPay, 
    onUpdatePayment,
    interestOrder,
    investments,
    onEdit,
    onCopy,
    onDelete,
    settings
}: { 
    item: MonthlyReportItem, 
    isExpanded: boolean, 
    toggleMonth: (m: string) => void, 
    currentMonthStr: string,
    onBulkPay: (m: string) => void,
    onUpdatePayment: (id: string, p: number, paid: boolean) => void,
    interestOrder: string[],
    investments: Investment[],
    onEdit: (inv: Investment) => void,
    onCopy: (inv: Investment) => void,
    onDelete: (id: string) => void,
    settings?: AppSettings
}) => {
    const isCurrent = item.monthStr === currentMonthStr;
    const fullyPaid = item.interestExpected > 0 && item.interestExpected === item.interestActual;
    const hasInterest = item.interestExpected > 0;
    const [sortMode, setSortMode] = useState<'startDate' | 'manual'>('startDate');

    // Prepare a map of start dates for sorting
    const invStartDates = useMemo(() => {
        const map = new Map<string, string>();
        investments.forEach(i => map.set(i.id, i.startDate));
        return map;
    }, [investments]);

    // Group Details by Source for display
    const groupedDetails = useMemo(() => {
        const groups: Record<string, typeof item.interestDetails> = {};
        item.interestDetails.forEach(det => {
             const key = det.source;
             if (!groups[key]) groups[key] = [];
             groups[key].push(det);
        });
        return groups;
    }, [item.interestDetails]);

    // Helper to sort a specific list based on current mode
    const sortList = (list: typeof item.interestDetails) => {
        let items = [...list];
        if (sortMode === 'startDate') {
             items.sort((a, b) => {
                 const startA = invStartDates.get(a.invId) || '';
                 const startB = invStartDates.get(b.invId) || '';
                 return startA.localeCompare(startB);
             });
        } else if (interestOrder && interestOrder.length > 0) {
            // Manual Sort: relies on global 'interestOrder'
            const orderMap = new Map(interestOrder.map((id, index) => [id, index]));
            items.sort((a, b) => {
                const idA = `${item.monthStr}::${a.invId}-${a.period}`;
                const idB = `${item.monthStr}::${b.invId}-${b.period}`;
                const indexA = orderMap.get(idA);
                const indexB = orderMap.get(idB);
                if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
                if (indexA !== undefined) return -1;
                if (indexB !== undefined) return 1;
                return 0; 
            });
        }
        return items;
    };

    return (
        <React.Fragment>
            <tr 
                className={`transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                onClick={() => toggleMonth(item.monthStr)}
            >
                <td className="px-4 py-4 text-center text-slate-400">
                    {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </td>
                <td className="px-4 py-4">
                    <div className="flex flex-col">
                        <span className={`font-bold text-base ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.rocMonth}
                            {isCurrent && <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 px-1.5 py-0.5 rounded">本月</span>}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{item.monthStr}</span>
                    </div>
                </td>
                <td className="px-4 py-4 text-right">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{formatCurrency(item.interestExpected)}</div>
                    {hasInterest && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            已收: {formatCurrency(item.interestActual)}
                        </div>
                    )}
                </td>
                <td className="px-4 py-4 text-right">
                    {item.newCapital > 0 ? (
                        <div className="font-mono font-medium text-blue-600 dark:text-blue-400 flex items-center justify-end gap-1">
                            <ArrowUpRight size={14}/> {formatCurrency(item.newCapital)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-4 py-4 text-right">
                        {item.returnedCapital > 0 ? (
                        <div className="font-mono font-medium text-orange-600 dark:text-orange-400 flex items-center justify-end gap-1">
                            <ArrowDownLeft size={14}/> {formatCurrency(item.returnedCapital)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-4 py-4 text-center">
                    {hasInterest && (
                        fullyPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckSquare size={12}/> 全收
                            </span>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onBulkPay(item.monthStr); }}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors"
                            >
                                <Coins size={12}/> 一鍵入帳
                            </button>
                        )
                    )}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700">
                        
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                {/* Sort Toggles */}
                                <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-0.5 inline-flex">
                                    <button 
                                        onClick={() => setSortMode('startDate')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortMode === 'startDate' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        依起息日
                                    </button>
                                    <button 
                                        onClick={() => setSortMode('manual')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortMode === 'manual' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        自訂排序 (拖曳)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Capital Movements */}
                        {(item.capitalInDetails.length > 0 || item.capitalOutDetails.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {item.capitalInDetails.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-900 shadow-sm p-3">
                                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1"><ArrowUpRight size={14}/> 新增資金</h4>
                                        <div className="space-y-2">
                                            {item.capitalInDetails.map((c, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 last:border-0 pb-1">
                                                    <div>
                                                        <div className="text-slate-800 dark:text-slate-200 font-medium">{c.source}</div>
                                                        <div className="text-[10px] text-slate-400">{toROCDate(c.date)} {c.ticketNumber && `| ${c.ticketNumber}`}</div>
                                                    </div>
                                                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatCurrency(c.amount)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {item.capitalOutDetails.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-900 shadow-sm p-3">
                                        <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1"><ArrowDownLeft size={14}/> 到期回金</h4>
                                        <div className="space-y-2">
                                            {item.capitalOutDetails.map((c, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 last:border-0 pb-1">
                                                    <div>
                                                        <div className="text-slate-800 dark:text-slate-200 font-medium">{c.source}</div>
                                                        <div className="text-[10px] text-slate-400">{toROCDate(c.date)} {c.ticketNumber && `| ${c.ticketNumber}`}</div>
                                                    </div>
                                                    <div className="font-mono font-bold text-orange-600 dark:text-orange-400">{formatCurrency(c.amount)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interest Details - Grouped by Source */}
                        {item.interestDetails.length > 0 ? (
                            <div className="space-y-4">
                                {Object.keys(groupedDetails).sort().map(source => {
                                    const items = sortList(groupedDetails[source]);
                                    const totalForSource = items.reduce((sum, i) => sum + i.amount, 0);
                                    const uniqueContextId = `${item.monthStr}-${source}`;

                                    return (
                                        <div key={source} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                            {/* Institution Header */}
                                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-slate-500 dark:text-slate-400"/>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{source}</span>
                                                    <span className="text-xs bg-white dark:bg-slate-600 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-300 font-bold">{items.length} 筆</span>
                                                </div>
                                                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(totalForSource)}
                                                </span>
                                            </div>

                                            {/* Items Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-2 py-2 w-12 text-center"></th>
                                                            <th className="px-4 py-2">專案 / 存單</th>
                                                            <th className="px-4 py-2 text-center">起息日</th>
                                                            <th className="px-4 py-2 text-center">預計領息日</th>
                                                            <th className="px-4 py-2 text-right">本金 / 期數</th>
                                                            <th className="px-4 py-2 text-right">操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        <SortableContext items={items.map(d => `${item.monthStr}::${d.invId}-${d.period}`)} strategy={verticalListSortingStrategy} id={uniqueContextId}>
                                                            {items.map((detail) => (
                                                                <SortableInterestRow 
                                                                    key={`${item.monthStr}::${detail.invId}-${detail.period}`}
                                                                    id={`${item.monthStr}::${detail.invId}-${detail.period}`}
                                                                    item={detail}
                                                                    onUpdatePayment={onUpdatePayment}
                                                                    investments={investments}
                                                                    startDate={invStartDates.get(detail.invId)}
                                                                    onEdit={onEdit}
                                                                    onCopy={onCopy}
                                                                    onDelete={onDelete}
                                                                    settings={settings}
                                                                />
                                                            ))}
                                                        </SortableContext>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                                本月無應收利息
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ 
  investments, 
  settings,
  onBulkPay, 
  onUpdatePayment,
  onEdit,
  onCopy,
  onDelete
}) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isFutureExpanded, setIsFutureExpanded] = useState(true);
  const [isPastExpanded, setIsPastExpanded] = useState(true); 

  const [interestOrder, setInterestOrder] = useState<string[]>(() => {
       const saved = localStorage.getItem('monthly_interest_order');
       return saved ? JSON.parse(saved) : [];
  });

  const report = useMemo(() => getMonthlyReport(investments), [investments]);
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
  }, []);

  const { futureList, pastList } = useMemo(() => {
      const future = report.filter(m => m.monthStr > currentMonthStr).reverse(); 
      future.sort((a, b) => a.monthStr.localeCompare(b.monthStr));

      const past = report.filter(m => m.monthStr <= currentMonthStr).sort((a, b) => b.monthStr.localeCompare(a.monthStr)); 

      return { futureList: future, pastList: past };
  }, [report, currentMonthStr]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleMonth = (monthStr: string) => {
    const newSet = new Set(expandedMonths);
    if (newSet.has(monthStr)) newSet.delete(monthStr);
    else newSet.add(monthStr);
    setExpandedMonths(newSet);
  };

  const expandAll = () => {
    const all = new Set(report.map(r => r.monthStr));
    setExpandedMonths(all);
  };

  const collapseAll = () => {
    setExpandedMonths(new Set());
  };

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      
      const activeId = String(active.id);
      const overId = String(over.id);

      // 1. Construct the current list for the specific month where drag happened
      const [monthPrefix] = activeId.split('::');
      const targetReport = report.find(r => r.monthStr === monthPrefix);
      if (!targetReport) return;

      const currentIds = targetReport.interestDetails.map(d => `${monthPrefix}::${d.invId}-${d.period}`);
      
      // If we have a saved order, we need to respect it for the "old index" calculation
      let sortedIds = [...currentIds];
      if (interestOrder.length > 0) {
           const orderMap = new Map(interestOrder.map((id, index) => [id, index]));
           sortedIds.sort((a, b) => {
               const idxA = orderMap.get(a);
               const idxB = orderMap.get(b);
               if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
               if (idxA !== undefined) return -1;
               if (idxB !== undefined) return 1;
               return 0;
           });
      }

      const oldIndex = sortedIds.indexOf(activeId);
      const newIndex = sortedIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
          const newSortedIds = arrayMove(sortedIds, oldIndex, newIndex);
          const newGlobalOrder = interestOrder.filter(id => !newSortedIds.includes(id));
          const updatedOrder = [...newGlobalOrder, ...newSortedIds];
          setInterestOrder(updatedOrder);
          localStorage.setItem('monthly_interest_order', JSON.stringify(updatedOrder));
      }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarDays className="text-blue-500" />
                        收支總覽 (Monthly Overview)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">依月份查看資金與利息明細</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        展開全部
                    </button>
                    <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        收合全部
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                <button 
                    onClick={() => setIsPastExpanded(!isPastExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                        <History size={18} className="text-blue-600"/>
                        歷史合約交易明細 (含本月) <span className="text-xs font-normal text-slate-500 ml-1">({pastList.length} 個月)</span>
                    </div>
                    {isPastExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                </button>
                
                {isPastExpanded && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3 whitespace-nowrap">月份 (ROC)</th>
                                    <th className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">利息收入</th>
                                    <th className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">投入資金</th>
                                    <th className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">到期回金</th>
                                    <th className="px-4 py-3 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {pastList.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-4 text-slate-400">無歷史收支紀錄</td></tr>
                                )}
                                {pastList.map(item => (
                                    <MonthRow 
                                        key={item.monthStr} 
                                        item={item} 
                                        isExpanded={expandedMonths.has(item.monthStr)}
                                        toggleMonth={toggleMonth}
                                        currentMonthStr={currentMonthStr}
                                        onBulkPay={onBulkPay}
                                        onUpdatePayment={onUpdatePayment}
                                        interestOrder={interestOrder}
                                        investments={investments}
                                        onEdit={onEdit}
                                        onCopy={onCopy}
                                        onDelete={onDelete}
                                        settings={settings}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Future Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                <button 
                    onClick={() => setIsFutureExpanded(!isFutureExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                        <Clock size={18} className="text-emerald-500"/>
                        未到合約交易明細 <span className="text-xs font-normal text-slate-500 ml-1">({futureList.length} 個月)</span>
                    </div>
                    {isFutureExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                </button>
                
                {isFutureExpanded && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3 whitespace-nowrap">月份 (ROC)</th>
                                    <th className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">預估利息</th>
                                    <th className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">預定投入</th>
                                    <th className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">預定回金</th>
                                    <th className="px-4 py-3 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {futureList.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-4 text-slate-400">無未來收支預定</td></tr>
                                )}
                                {futureList.map(item => (
                                    <MonthRow 
                                        key={item.monthStr} 
                                        item={item} 
                                        isExpanded={expandedMonths.has(item.monthStr)}
                                        toggleMonth={toggleMonth}
                                        currentMonthStr={currentMonthStr}
                                        onBulkPay={onBulkPay}
                                        onUpdatePayment={onUpdatePayment}
                                        interestOrder={interestOrder}
                                        investments={investments}
                                        onEdit={onEdit}
                                        onCopy={onCopy}
                                        onDelete={onDelete}
                                        settings={settings}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Legend / Tip */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 px-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-sm"></div>
                    <span>當前月份</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ArrowUpRight size={14} className="text-blue-500"/>
                    <span>新增資金投入</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ArrowDownLeft size={14} className="text-orange-500"/>
                    <span>投資到期回本</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <GripVertical size={14} className="text-slate-400"/>
                    <span>拖曳可自訂排序 (僅限同機構內?) No, 全局排序</span>
                </div>
            </div>
        </div>
    </DndContext>
  );
};