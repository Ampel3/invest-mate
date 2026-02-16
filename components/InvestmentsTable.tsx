import React, { useState, useEffect } from 'react';
import { Investment, InvestmentStatus, PaymentRecord, StatusLabels, AppSettings } from '../types';
import { toROCDate, formatCurrency, calculatePeriodDiff, getPeriodDueDate, isoToROCInput, rocInputToISO, getRateColorClass } from '../utils';
import { Edit2, Trash2, ChevronDown, ChevronUp, Users, CheckSquare, Square, RefreshCw, FileDigit, Copy, ArrowUpDown, CornerDownRight, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InvestmentsTableProps {
  investments: Investment[];
  settings: AppSettings;
  onEdit: (inv: Investment) => void;
  onCopy: (inv: Investment) => void;
  onDelete: (id: string) => void;
  onRenew: (inv: Investment) => void;
  onUpdatePayment: (id: string, monthIndex: number, data: Partial<PaymentRecord>) => void;
  onUpdateIntroFee: (id: string, paid: boolean) => void;
  onReorder: (newOrderInvestments: Investment[]) => void;
}

// Sub-component for handling ROC date inputs locally
const ROCDateInput = ({ value, onChange, placeholder, className }: { value?: string, onChange: (iso: string) => void, placeholder?: string, className?: string }) => {
    const [local, setLocal] = useState(isoToROCInput(value || ''));
    
    // Sync external changes
    useEffect(() => {
        const currentIso = rocInputToISO(local);
        if (currentIso !== value) {
            setLocal(isoToROCInput(value || ''));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocal(val);
        const iso = rocInputToISO(val);
        if (iso) {
            onChange(iso);
        }
    };

    return (
        <input 
            type="text" 
            value={local} 
            onChange={handleChange} 
            placeholder={placeholder} 
            maxLength={7} 
            className={className} 
        />
    );
};

// Sortable Row Component (Investment Item)
const SortableRow = ({ item, children, className }: { item: Investment, children: React.ReactNode, className?: string }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
    };

    return (
        <tr ref={setNodeRef} style={style} className={`${isDragging ? "bg-blue-50 dark:bg-blue-900/50 shadow-lg" : className}`}>
             {/* Inject listeners to drag handle ONLY */}
             {React.Children.map(children, child => {
                 if (React.isValidElement(child)) {
                     const props = child.props as { className?: string };
                     if (props.className?.includes('drag-handle')) {
                         return React.cloneElement(child, { ...attributes, ...listeners } as any);
                     }
                 }
                 return child;
             })}
        </tr>
    );
};

// Sortable Group Component (Institution Header + List)
const SortableGroup = ({ 
    source, 
    items, 
    isCollapsed, 
    onToggleCollapse, 
    children,
    dragHandleProps
}: { 
    source: string, 
    items: Investment[], 
    isCollapsed: boolean, 
    onToggleCollapse: () => void, 
    children: React.ReactNode,
    dragHandleProps?: any
}) => {
    // Prefix group ID to avoid collision with investment IDs
    const groupId = `group::${source}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: groupId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
        marginBottom: '2rem'
    };
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = items.reduce((sum, item) => sum + (item.amount * item.rate / 100), 0);

    return (
        <div ref={setNodeRef} style={style} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden ${isDragging ? 'opacity-80 ring-2 ring-blue-500' : ''}`}>
            {/* Header */}
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600 flex flex-wrap justify-between items-center gap-4 select-none">
                <div className="flex items-center gap-3 flex-1">
                    {/* Drag Handle for Group */}
                    <div 
                        {...attributes} 
                        {...listeners} 
                        className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <GripVertical size={20} />
                    </div>
                    
                    <button onClick={onToggleCollapse} className="flex items-center gap-3 focus:outline-none group">
                        <div className={`p-1 rounded-full transition-colors ${isCollapsed ? 'bg-slate-200 dark:bg-slate-600 text-slate-500' : 'bg-blue-100 dark:bg-blue-900 text-blue-600'}`}>
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{source}</h2>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 px-2 py-1 rounded border border-slate-300 dark:border-slate-500">{items.length} 筆</span>
                    </button>
                </div>
                
                <div className="flex gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-slate-600 dark:text-slate-400 text-xs mb-0.5 font-bold">總本金</span>
                        <span className="font-bold text-slate-900 dark:text-white text-base">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-slate-600 dark:text-slate-400 text-xs mb-0.5 font-bold">預估月收</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
            </div>

            {/* Content (Collapsible) */}
            {!isCollapsed && (
                <div className="overflow-x-auto">
                    {children}
                </div>
            )}
        </div>
    );
};

export const InvestmentsTable: React.FC<InvestmentsTableProps> = ({ investments, settings, onEdit, onCopy, onDelete, onRenew, onUpdatePayment, onUpdateIntroFee, onReorder }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Logic: Manual Source Sorting State
  const [sourceOrder, setSourceOrder] = useState<string[]>(() => {
      const saved = localStorage.getItem('source_order');
      return saved ? JSON.parse(saved) : [];
  });
  
  // Logic: Collapsed Groups State
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Logic 2: Sorting State (Internal Column Sort)
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount' | 'rate', direction: 'asc' | 'desc' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSort = (key: 'date' | 'amount' | 'rate') => {
      setSortConfig(current => {
          if (current?.key === key) {
              if (current.direction === 'asc') return { key, direction: 'desc' };
              return null; // Toggle off to return to manual sort
          }
          return { key, direction: 'asc' }; // Default asc for new key
      });
  };

  const toggleGroupCollapse = (source: string) => {
      const newSet = new Set(collapsedGroups);
      if (newSet.has(source)) newSet.delete(source);
      else newSet.add(source);
      setCollapsedGroups(newSet);
  };

  // Group by Source
  const grouped = investments.reduce((acc, curr) => {
    const key = curr.source || '未分類';
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, Investment[]>);

  // Sync Source Order with current data
  useEffect(() => {
      const currentSources = Object.keys(grouped);
      // New sources that aren't in order list yet
      const newSources = currentSources.filter(s => !sourceOrder.includes(s));
      
      if (newSources.length > 0) {
          const updatedOrder = [...sourceOrder, ...newSources];
          setSourceOrder(updatedOrder);
          localStorage.setItem('source_order', JSON.stringify(updatedOrder));
      }
  }, [Object.keys(grouped).join(',')]); // Trigger when sources change

  // Determine final render order of groups
  const displayedSources = sourceOrder.filter(s => grouped[s] !== undefined);
  // Add any missing ones at the end (fallback)
  Object.keys(grouped).forEach(s => {
      if (!displayedSources.includes(s)) displayedSources.push(s);
  });


  // Unified Drag End Handler
  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Scenario 1: Reordering Groups
      if (activeId.startsWith('group::') && overId.startsWith('group::')) {
          const oldIndex = displayedSources.indexOf(activeId.replace('group::', ''));
          const newIndex = displayedSources.indexOf(overId.replace('group::', ''));

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              const newOrder = arrayMove(displayedSources, oldIndex, newIndex);
              setSourceOrder(newOrder);
              localStorage.setItem('source_order', JSON.stringify(newOrder));
          }
      }
      // Scenario 2: Reordering Rows (Investments)
      else if (!activeId.startsWith('group::') && !overId.startsWith('group::')) {
          // Find which group this investment belongs to
          const sourceGroup = Object.keys(grouped).find(key => 
             grouped[key].some(i => i.id === activeId)
          );

          if (sourceGroup && grouped[sourceGroup].some(i => i.id === overId)) {
               // Get current items in this group sorted by current order
               const currentGroupItems = grouped[sourceGroup].sort((a, b) => (a.order || 0) - (b.order || 0));
               const oldIndex = currentGroupItems.findIndex(i => i.id === activeId);
               const newIndex = currentGroupItems.findIndex(i => i.id === overId);
               
               if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                   const newGroupOrder = arrayMove(currentGroupItems, oldIndex, newIndex);
                   
                   // Map back to global full list
                   const updatedGroupItems = newGroupOrder.map((item, idx) => ({
                       ...item,
                       order: idx 
                   }));

                   const groupIds = new Set(updatedGroupItems.map(i => i.id));
                   const newInvestments = investments.map(inv => {
                       if (groupIds.has(inv.id)) {
                           return updatedGroupItems.find(i => i.id === inv.id)!;
                       }
                       return inv;
                   });

                   onReorder(newInvestments);
               }
          }
      }
  };

  const getStatusBadge = (status: InvestmentStatus) => {
    const label = StatusLabels[status] || status;
    switch (status) {
      case InvestmentStatus.Active: return <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">{label}</span>;
      case InvestmentStatus.Renewed: return <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-200 shadow-sm">{label}</span>;
      case InvestmentStatus.Returned: return <span className="bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-300 shadow-sm">{label}</span>;
      case InvestmentStatus.Reinvested: return <span className="bg-indigo-100 text-indigo-800 font-bold text-xs px-2.5 py-1 rounded-full border border-indigo-200 shadow-sm">{label}</span>;
      case InvestmentStatus.Defaulted: return <span className="bg-red-100 text-red-800 font-bold text-xs px-2.5 py-1 rounded-full border border-red-200 shadow-sm">{label}</span>;
      default: return <span className="bg-gray-100 text-gray-800 font-bold text-xs px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">{label}</span>;
    }
  };

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const isRenewable = (inv: Investment) => {
      const today = new Date().toISOString().split('T')[0];
      return inv.endDate < today || inv.status === InvestmentStatus.Returned;
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayedSources.map(s => `group::${s}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-8">
            {displayedSources.map((source) => {
                const items = grouped[source];
                if (!items) return null;

                // Sorting Logic: Manual (Default) vs Column Sort
                let sortedItems = [...items];
                if (sortConfig) {
                    sortedItems.sort((a, b) => {
                        let valA: any = '';
                        let valB: any = '';
                        switch (sortConfig.key) {
                            case 'date': valA = a.startDate; valB = b.startDate; break;
                            case 'amount': valA = a.amount; valB = b.amount; break;
                            case 'rate': valA = a.rate; valB = b.rate; break;
                        }
                        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                } else {
                    // Default Sort by 'order' field
                    sortedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
                }

                return (
                    <SortableGroup 
                        key={source} 
                        source={source} 
                        items={items} 
                        isCollapsed={collapsedGroups.has(source)}
                        onToggleCollapse={() => toggleGroupCollapse(source)}
                    >
                        <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-600">
                                <tr>
                                    {/* Drag Handle Column */}
                                    <th className="px-2 py-3 w-8"></th>
                                    
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">存續期間 (ROC) <ArrowUpDown size={12}/></div>
                                    </th>
                                    <th className="px-4 py-3 whitespace-nowrap">存單編號 (Tree View)</th>
                                    <th className="px-4 py-3 whitespace-nowrap">期數</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" onClick={() => handleSort('rate')}>
                                        <div className="flex items-center justify-end gap-1">月利% <ArrowUpDown size={12}/></div>
                                    </th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-1">本金 <ArrowUpDown size={12}/></div>
                                    </th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right">月利息 / 累積</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">當期</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">領息紀錄</th>
                                    <th className="px-4 py-3 whitespace-nowrap">狀態</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right">操作</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedItems.map((item) => {
                                    const monthlyIncome = Math.round(item.amount * (item.rate / 100));
                                    const currentPeriod = calculatePeriodDiff(item.startDate);
                                    const isExpanded = expandedId === item.id;
                                    const duration = item.duration || 12; 
                                    
                                    const paidCount = Object.values(item.paymentHistory).filter(p => p.isPaid).length;
                                    const progress = Math.min(100, Math.round((paidCount / duration) * 100));
                                    const totalCollected = monthlyIncome * paidCount;
                                    const hasFunders = item.funders && item.funders.length > 0;
                                    const introFeeAmount = Math.round(item.amount * (item.introFeeRate / 100));
                                    const canRenew = isRenewable(item);
                                    const displayCurrentPeriod = Math.min(currentPeriod, duration);
                                    const rowColor = getRateColorClass(item.rate, settings.rateColorMap);

                                    return (
                                    <React.Fragment key={item.id}>
                                        <SortableRow item={item} className={`${rowColor} hover:brightness-95 dark:hover:brightness-110 transition-all`}>
                                            {/* Drag Handle Cell */}
                                            <td className="px-2 py-3 text-center drag-handle touch-none cursor-grab active:cursor-grabbing">
                                                {!sortConfig && <GripVertical size={16} className="text-slate-400 dark:text-slate-300 mx-auto" />}
                                            </td>

                                            <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-300 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-800 dark:text-slate-100 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                                                <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-500 dark:text-slate-300">{toROCDate(item.startDate)}</span>
                                                <span className="text-xl font-black text-slate-800 dark:text-white leading-none mt-1">~ {toROCDate(item.endDate)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    {item.ticketNumber && (
                                                        <div className="flex items-center gap-1 font-mono font-bold text-blue-700 dark:text-blue-200 text-sm">
                                                            <FileDigit size={14} className="text-blue-400 dark:text-blue-300"/>
                                                            {item.ticketNumber}
                                                        </div>
                                                    )}
                                                    {hasFunders && item.funders!.map((f, idx) => (
                                                        <div key={idx} className="flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-300 pl-4 border-l-2 border-slate-300 dark:border-slate-500 ml-1">
                                                            <CornerDownRight size={10} />
                                                            <span>{f.ticketNumber || '(無編號)'}</span>
                                                        </div>
                                                    ))}
                                                    {!item.ticketNumber && !hasFunders && <span className="text-slate-300">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-800 dark:text-slate-100">
                                                <span className="px-2 py-0.5 rounded text-xs bg-white/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-bold">{duration} 個月</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-slate-800 dark:text-slate-100 font-bold text-lg">{item.rate}%</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <div>{formatCurrency(item.amount)}</div>
                                                    {hasFunders && item.funders!.map((f, idx) => (
                                                        <div key={idx} className="text-xs text-slate-500 dark:text-slate-300 h-[18px]">
                                                            {formatCurrency(f.amount)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(monthlyIncome)}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 font-medium">累: {formatCurrency(totalCollected)}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-bold ${displayCurrentPeriod >= duration ? 'text-orange-600 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`}>{displayCurrentPeriod}</span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">/ {duration}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="w-full max-w-[140px] h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mx-auto border border-slate-300 dark:border-slate-500">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-300 text-center mt-1 font-medium">已領 {paidCount} / {duration} 期</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {getStatusBadge(item.status)}
                                                {item.introFeeRate > 0 && (
                                                <div className={`text-[10px] mt-1 font-bold px-1.5 py-0.5 rounded border inline-block ml-1 ${item.introFeePaid ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                    {item.introFeePaid ? '獎勵已領' : `獎勵: ${formatCurrency(introFeeAmount)}`}
                                                </div>
                                            )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onCopy(item); }}
                                                        className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                                                        title="複製"
                                                    >
                                                        <Copy size={16} className="pointer-events-none" />
                                                    </button>
                                                    {canRenew && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onRenew(item); }}
                                                            className="p-1.5 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                                            title="轉單/續存"
                                                        >
                                                            <RefreshCw size={16} className="pointer-events-none" />
                                                        </button>
                                                    )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                                                    className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                                    title="編輯"
                                                >
                                                    <Edit2 size={16} className="pointer-events-none" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                                                    className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={16} className="pointer-events-none" />
                                                </button>
                                                </div>
                                            </td>
                                        </SortableRow>
                                        
                                        {/* Expanded Detail View */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50 dark:bg-slate-800 border-y-2 border-slate-200 dark:border-slate-600 shadow-inner">
                                                <td colSpan={13} className="px-4 py-6">
                                                    <div className="pl-4 pr-4">
                                                        
                                                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                                                            {/* Left: Funders & Notes */}
                                                            <div className="flex-1 space-y-4">
                                                                {/* Funders Detail Info */}
                                                                {hasFunders && (
                                                                    <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-500 shadow-sm">
                                                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1"><Users size={16}/> 共同出資明細 / 憑證號</h4>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            {item.funders?.map((f, idx) => (
                                                                                <div key={f.id || idx} className="text-sm bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded border border-blue-200 dark:border-blue-800 flex justify-between items-center shadow-sm">
                                                                                    <div>
                                                                                        <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">{f.name}</span>
                                                                                        <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">{formatCurrency(f.amount)}</span>
                                                                                    </div>
                                                                                    <div className="font-mono text-blue-700 dark:text-blue-300 font-bold bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-700 px-1.5 py-0.5 rounded text-xs">
                                                                                        {f.ticketNumber || '-'}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Intro Fee Tracker */}
                                                                {item.introFeeRate > 0 && (
                                                                    <div className={`p-4 rounded-lg border flex items-center justify-between shadow-sm ${item.introFeePaid ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-300'}`}>
                                                                        <div>
                                                                            <div className={`text-sm font-bold ${item.introFeePaid ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>額外獎勵/介紹費 ({item.introFeeRate}%)</div>
                                                                            <div className="font-mono font-bold text-base text-slate-800 dark:text-white">{formatCurrency(introFeeAmount)}</div>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => onUpdateIntroFee(item.id, !item.introFeePaid)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm ${item.introFeePaid ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' : 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-200 border border-amber-400 hover:bg-amber-100'}`}
                                                                        >
                                                                            {item.introFeePaid ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                                            {item.introFeePaid ? `已領 (${item.introFeePaidDate || '無日期'})` : '標記已領'}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {item.note && <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-4 py-3 rounded border border-slate-300 dark:border-slate-500 italic shadow-sm">
                                                                    <span className="font-bold not-italic text-slate-900 dark:text-white mr-2">備註:</span>
                                                                    {item.note}
                                                                </div>}
                                                            </div>

                                                            {/* Right: Payment Grid */}
                                                            <div className="flex-[2]">
                                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">每月配息明細</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                    {Array.from({ length: duration }).map((_, i) => {
                                                                        const idx = i + 1;
                                                                        const record = item.paymentHistory[idx] || { isPaid: false };
                                                                        const dueDate = getPeriodDueDate(item.startDate, idx); 
                                                                        const isCurrent = idx === currentPeriod;

                                                                        return (
                                                                            <div key={idx} className={`p-3 rounded-lg border shadow-sm ${isCurrent ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900 bg-white dark:bg-slate-700' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700'}`}>
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">第 {idx} 期</span>
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        checked={record.isPaid}
                                                                                        onChange={(e) => onUpdatePayment(item.id, idx, { isPaid: e.target.checked })}
                                                                                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                                                    />
                                                                                </div>
                                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">預計: {toROCDate(dueDate)}</div>
                                                                                
                                                                                {record.isPaid && (
                                                                                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-600 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                                        <ROCDateInput 
                                                                                            value={record.paidDate || ''}
                                                                                            onChange={(iso) => onUpdatePayment(item.id, idx, { paidDate: iso })}
                                                                                            placeholder="1140226"
                                                                                            className="w-full text-[10px] px-1 py-1 border border-slate-300 dark:border-slate-500 rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-600"
                                                                                        />
                                                                                        <input 
                                                                                            type="text"
                                                                                            placeholder="備註..."
                                                                                            value={record.note || ''}
                                                                                            onChange={(e) => onUpdatePayment(item.id, idx, { note: e.target.value })}
                                                                                            className="w-full text-[10px] px-1 py-1 border border-slate-300 dark:border-slate-500 rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-600"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                <div className={`mt-2 pt-2 border-t ${record.isPaid ? 'border-emerald-100 dark:border-emerald-900' : 'border-slate-100 dark:border-slate-600'} text-right`}>
                                                                                    <span className={`text-xs font-bold ${record.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>{formatCurrency(monthlyIncome)}</span>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    );
                                })}
                                </tbody>
                            </table>
                        </SortableContext>
                    </SortableGroup>
                );
            })}
            </div>
        </SortableContext>
    </DndContext>
  );
};