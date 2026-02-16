import React, { useState, useMemo, useEffect } from 'react';
import { Investment, InvestmentStatus, PaymentRecord, AppSettings, ThemeOption } from './types';
import { InvestmentsTable } from './components/InvestmentsTable';
import { InvestmentForm } from './components/InvestmentForm';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { StatsCard } from './components/StatsCard';
import { SettingsView } from './components/SettingsView';
import { MonthlyOverview } from './components/MonthlyOverview';
import { 
    formatCurrency, 
    exportToXLSX, 
    exportToCSV, 
    exportToJSON, 
    parseExcelData, 
    generateId, 
    calculateWeightedRate,
    getMonthlyChartData
} from './utils';
import { 
  Plus, 
  Download, 
  Upload, 
  PieChart, 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText,
  LayoutDashboard,
  FolderOpen,
  Menu,
  X,
  History,
  Settings as SettingsIcon,
  Table,
  FileJson,
  FileSpreadsheet,
  Layers,
  CalendarClock,
  Briefcase,
  Coins,
  CalendarDays
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  savedSources: [],
  savedFunders: [],
  theme: 'system',
  rateColorMap: {}
};

export default function App() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  
  // Import States
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importCandidates, setImportCandidates] = useState<Investment[]>([]);

  // Export States
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportType, setExportType] = useState<'json' | 'xlsx' | 'csv'>('xlsx');

  const [showCharts, setShowCharts] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'history' | 'all' | 'settings' | 'monthly'>('active');
  
  // Navigation State
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Theme Logic
  useEffect(() => {
    const root = document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load initial data
  useEffect(() => {
    const storedInv = localStorage.getItem('investments_data');
    if (storedInv) {
      try {
        const parsed = JSON.parse(storedInv);
        // Ensure all items have an order field for DnD
        const safeData = Array.isArray(parsed) ? parsed.map((item: Investment, idx: number) => ({
            ...item,
            order: typeof item.order === 'number' ? item.order : idx
        })) : [];
        setInvestments(safeData);
      } catch (e) {
        setInvestments([]);
      }
    }
    
    const storedSettings = localStorage.getItem('investments_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings({ 
            ...DEFAULT_SETTINGS, 
            ...parsed,
            // Guard against rateColorMap being null/undefined from legacy data
            rateColorMap: parsed.rateColorMap || {} 
        });
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('investments_data', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('investments_settings', JSON.stringify(settings));
  }, [settings]);

  // CRUD Operations
  const handleAdd = (inv: Investment) => {
    setInvestments(prev => {
        if (editingItem && prev.some(i => i.id === inv.id)) {
            // Edit: preserve original order
            return prev.map(item => item.id === inv.id ? { ...inv, order: item.order } : item);
        } else {
            // New: Add with new order (at the end)
            const maxOrder = prev.length > 0 ? Math.max(...prev.map(i => i.order || 0)) : 0;
            return [...prev, { ...inv, order: maxOrder + 1 }];
        }
    });
    setEditingItem(null);
  };

  const handleEdit = (inv: Investment) => {
    setEditingItem(inv);
    setIsModalOpen(true);
  };

  const handleCopy = (inv: Investment) => {
    // Deep clone and assign new IDs
    const maxOrder = investments.length > 0 ? Math.max(...investments.map(i => i.order || 0)) : 0;
    const newItem: Investment = {
        ...inv,
        id: generateId(),
        funders: inv.funders?.map(f => ({ ...f, id: generateId() })),
        ticketNumber: '', // Reset ticket so it regenerates based on date/amount if needed
        order: maxOrder + 1
    };
    setEditingItem(newItem);
    setIsModalOpen(true);
  };

  const handleRenew = (oldInv: Investment) => {
      const maxOrder = investments.length > 0 ? Math.max(...investments.map(i => i.order || 0)) : 0;
      const newItem: Investment = {
          ...oldInv,
          id: generateId(),
          status: InvestmentStatus.Active,
          startDate: new Date().toISOString().split('T')[0], // Default today
          paymentHistory: {},
          introFeePaid: false,
          introFeePaidDate: undefined,
          ticketNumber: '', // Reset to force re-generation
          funders: oldInv.funders?.map(f => ({
              ...f,
              id: generateId(), // New IDs for funders to avoid key conflicts
              ticketNumber: '' // Reset tickets
          })),
          order: maxOrder + 1
      };
      setEditingItem(newItem);
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('確定要刪除此筆投資紀錄嗎？\n此操作無法復原。')) {
      setInvestments(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleReorder = (newInvestments: Investment[]) => {
      setInvestments(newInvestments);
  };

  const handleUpdatePayment = (id: string, monthIdx: number, data: Partial<PaymentRecord>) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === id) {
        const currentRecord = inv.paymentHistory[monthIdx] || { isPaid: false };
        let updates = { ...data };
        if (data.isPaid === true && !currentRecord.paidDate && !data.paidDate) {
           updates.paidDate = new Date().toISOString().split('T')[0];
        }
        const newHistory = { 
            ...inv.paymentHistory,
            [monthIdx]: { ...currentRecord, ...updates }
        };
        return { ...inv, paymentHistory: newHistory };
      }
      return inv;
    }));
  };

  const handleUpdateIntroFee = (id: string, paid: boolean) => {
     setInvestments(prev => prev.map(inv => {
         if (inv.id === id) {
             return {
                 ...inv,
                 introFeePaid: paid,
                 introFeePaidDate: paid ? new Date().toISOString().split('T')[0] : undefined
             };
         }
         return inv;
     }));
  };
  
  // Bulk pay all interest due in a specific month
  const handleBulkPay = (monthStr: string) => {
      // monthStr is YYYY-MM
      // Find all investments that have a period due in this month
      const today = new Date().toISOString().split('T')[0];
      const targetMonthStart = new Date(monthStr + "-01");
      const targetMonthEnd = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth() + 1, 0);

      setInvestments(prev => prev.map(inv => {
          let updatedHistory = { ...inv.paymentHistory };
          let changed = false;

          for(let i = 1; i <= inv.duration; i++) {
              const d = new Date(inv.startDate);
              d.setMonth(d.getMonth() + i);
              // Check if due date is within the target month
              if (d >= targetMonthStart && d <= targetMonthEnd) {
                  if (!updatedHistory[i]?.isPaid) {
                      updatedHistory[i] = {
                          isPaid: true,
                          paidDate: today,
                          note: '一鍵入帳'
                      };
                      changed = true;
                  }
              }
          }

          if (changed) {
              return { ...inv, paymentHistory: updatedHistory };
          }
          return inv;
      }));
  };

  const handleSimplePaymentUpdate = (invId: string, period: number, isPaid: boolean) => {
      handleUpdatePayment(invId, period, { isPaid });
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
      setSettings(newSettings);
      alert('設定已儲存');
      setViewMode('active');
      setSelectedSource('All');
  };

  const checkIsHistory = (inv: Investment) => {
      const today = new Date().toISOString().split('T')[0];
      const isExpired = inv.endDate < today;
      const isReturned = inv.status === InvestmentStatus.Returned || inv.status === InvestmentStatus.Defaulted;
      return isExpired || isReturned;
  };

  const activeInvestments = useMemo(() => investments.filter(i => !checkIsHistory(i)), [investments]);
  const historyInvestments = useMemo(() => investments.filter(i => checkIsHistory(i)), [investments]);

  const displayedInvestments = useMemo(() => {
    if (viewMode === 'history') return historyInvestments;
    if (viewMode === 'all') return investments;
    return activeInvestments;
  }, [viewMode, historyInvestments, activeInvestments, investments]);

  const uniqueSources = useMemo(() => {
    // For sidebar counts/list, usually based on Active items, or All depending on view? 
    // Let's stick to using displayedInvestments to be consistent with current view.
    // If we want ALL sources ever, use 'investments'.
    const targetList = viewMode === 'history' ? historyInvestments : viewMode === 'all' ? investments : activeInvestments;
    return Array.from(new Set(targetList.map(i => i.source))).sort();
  }, [viewMode, historyInvestments, activeInvestments, investments]);

  const filteredInvestments = useMemo(() => {
    if (viewMode === 'settings' || viewMode === 'monthly') return [];
    if (selectedSource === 'All') return displayedInvestments;
    return displayedInvestments.filter(i => i.source === selectedSource);
  }, [displayedInvestments, selectedSource, viewMode]);

  // Import / Export Handles
  const triggerExportFlow = (type: 'json' | 'xlsx' | 'csv') => {
      setExportType(type);
      setExportPreviewOpen(true);
      setShowExportMenu(false);
  };

  const handleConfirmExport = (type: 'json' | 'xlsx' | 'csv') => {
      const filename = `InvestMate_Export_${new Date().toISOString().split('T')[0]}`;
      if (type === 'json') {
          exportToJSON({ version: 2, settings, investments }, filename);
      } else if (type === 'xlsx') {
          exportToXLSX(investments, filename);
      } else if (type === 'csv') {
          exportToCSV(investments, filename);
      }
      setExportPreviewOpen(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        let candidates: Investment[] = [];
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.json')) {
            const text = await file.text();
            const json = JSON.parse(text);
            candidates = Array.isArray(json) ? json : json.investments || [];
            if (json.settings) setSettings(json.settings);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
            // @ts-ignore
            if (typeof XLSX === 'undefined') { alert('Excel library missing'); return; }
            const arrayBuffer = await file.arrayBuffer();
            // @ts-ignore
            const wb = XLSX.read(arrayBuffer);
            // @ts-ignore
            const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            candidates = parseExcelData(jsonData);
        }
        if (candidates.length > 0) {
            setImportCandidates(candidates);
            setImportPreviewOpen(true);
        } else {
             alert('無有效資料');
        }
    } catch (err) { console.error(err); alert('匯入失敗'); }
    e.target.value = '';
  };

  const handleImportConfirm = (strategy: 'skip' | 'overwrite' | 'new') => {
      setInvestments(prev => {
          if (strategy === 'new') {
              const maxOrder = prev.length > 0 ? Math.max(...prev.map(i => i.order || 0)) : 0;
              const newItems = importCandidates.map((item, idx) => ({
                  ...item, 
                  id: generateId(), 
                  funders: item.funders?.map(f => ({ ...f, id: generateId() })),
                  order: maxOrder + idx + 1
              }));
              return [...prev, ...newItems];
          }
          const existingIds = new Set(prev.map(i => i.id));
          const conflicts = importCandidates.filter(i => existingIds.has(i.id));
          const newItems = importCandidates.filter(i => !existingIds.has(i.id));
          
          let result = [...prev];
          
          if (strategy === 'overwrite') {
              const conflictMap = new Map(conflicts.map(i => [i.id, i]));
              result = prev.map(item => conflictMap.has(item.id) ? { ...conflictMap.get(item.id)!, order: item.order } : item);
          }
          
          const currentMaxOrder = result.length > 0 ? Math.max(...result.map(i => i.order || 0)) : 0;
          const newItemsWithOrder = newItems.map((item, idx) => ({
              ...item,
              order: currentMaxOrder + idx + 1
          }));
          
          return [...result, ...newItemsWithOrder];
      });
      setImportPreviewOpen(false);
      setImportCandidates([]);
      alert('匯入完成！');
  };

  // --- STATS & ANALYSIS ---
  const stats = useMemo(() => {
    // For Stats cards, typically we want to see Active status overview.
    const list = activeInvestments; 
    
    // Principal: Only count ACTIVE investments.
    const activePrincipal = list
        .filter(i => i.status === InvestmentStatus.Active)
        .reduce((sum, i) => sum + i.amount, 0);

    const totalMonthlyIncome = list
        .filter(i => i.status === InvestmentStatus.Active)
        .reduce((sum, i) => sum + (i.amount * i.rate / 100), 0);
    
    // Total Interest Collected (Actual) - From ALL investments? Or just active? 
    // Usually "Collected" implies lifetime earnings. Let's use 'investments' (all) for collected stats.
    const totalCollectedInterest = investments.reduce((sum, inv) => {
        const monthly = Math.round(inv.amount * (inv.rate / 100));
        const paidCount = Object.values(inv.paymentHistory).filter(p => p.isPaid).length;
        return sum + (monthly * paidCount);
    }, 0);

    // Fixed Income Analysis
    const weightedRateAnnual = calculateWeightedRate(list.filter(i => i.status === InvestmentStatus.Active));
    
    // Chart Data: Dual Axis Monthly Data
    // Use ALL investments to show history + future
    const chartData = getMonthlyChartData(investments);
    
    // Chart Data: Institution Distribution
    const bySource = list.filter(i => i.status === InvestmentStatus.Active).reduce((acc, curr) => {
        acc[curr.source] = (acc[curr.source] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);
    const distData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

    return { activePrincipal, totalMonthlyIncome, weightedRateAnnual, chartData, distData, totalCollectedInterest };
  }, [investments, activeInvestments]);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
        <div className="p-4 flex items-center gap-2 border-b border-slate-800 h-16">
            <div className="bg-blue-600 p-1.5 rounded text-white">
               <Briefcase size={20} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">定存管理</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">投資視圖</div>
            <button onClick={() => { setViewMode('active'); setSelectedSource('All'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${viewMode === 'active' && selectedSource === 'All' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                <LayoutDashboard size={18} /> <span>現有定存 (Active)</span>
            </button>
            <button onClick={() => { setViewMode('monthly'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${viewMode === 'monthly' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}>
                <CalendarDays size={18} /> <span>收支總覽 (Overview)</span>
            </button>
            <button onClick={() => { setViewMode('history'); setSelectedSource('All'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${viewMode === 'history' && selectedSource === 'All' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                <History size={18} /> <span>歷史紀錄 (History)</span>
            </button>
            <button onClick={() => { setViewMode('all'); setSelectedSource('All'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${viewMode === 'all' && selectedSource === 'All' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                <Layers size={18} /> <span>所有紀錄 (All)</span>
            </button>
            <button onClick={() => { setViewMode('settings'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${viewMode === 'settings' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}>
                <SettingsIcon size={18} /> <span>系統設定 (Settings)</span>
            </button>

            {viewMode !== 'settings' && viewMode !== 'monthly' && (
                <>
                    <div className="mt-8 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">機構/專案 ({uniqueSources.length})</div>
                    <div className="space-y-1">
                        {uniqueSources.map(source => (
                            <button key={source} onClick={() => { setSelectedSource(source); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${selectedSource === source ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500' : 'hover:bg-slate-800'}`}>
                                <FolderOpen size={16} /> <span className="truncate">{source}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">v4.5.0 Export Preview</div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200`}>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 shadow-lg z-20">
          <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="w-64"><Sidebar /></div>
              <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)}><button className="p-4 text-white"><X size={24} /></button></div>
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden dark:bg-slate-900">
        
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 flex-shrink-0">
            <div className="h-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Menu size={20} /></button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {viewMode === 'active' ? '定存資產' : viewMode === 'history' ? '歷史明細' : viewMode === 'all' ? '總覽' : viewMode === 'monthly' ? '收支總覽' : '設定'} 
                            {viewMode !== 'settings' && viewMode !== 'monthly' && selectedSource !== 'All' && <><span className="text-slate-400">/</span> {selectedSource}</>}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2 relative">
                        <label className="cursor-pointer px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-2 transition-all">
                            <Upload size={16} /> <span className="hidden sm:inline">匯入</span>
                            <input type="file" accept=".json,.xlsx,.csv" className="hidden" onChange={handleImportFile} onClick={(e) => (e.target as HTMLInputElement).value = ''} />
                        </label>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-2 transition-all">
                            <Download size={16} /> <span className="hidden sm:inline">匯出</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-50 py-1">
                                <button onClick={() => triggerExportFlow('json')} className="w-full text-left px-4 py-2.5 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex gap-2"><FileJson size={16}/> JSON</button>
                                <button onClick={() => triggerExportFlow('xlsx')} className="w-full text-left px-4 py-2.5 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex gap-2"><FileSpreadsheet size={16}/> Excel</button>
                                <button onClick={() => triggerExportFlow('csv')} className="w-full text-left px-4 py-2.5 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex gap-2"><FileText size={16}/> CSV</button>
                            </div>
                        )}
                        {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
                    </div>
                    {viewMode !== 'settings' && viewMode !== 'monthly' && (
                        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap">
                            <Plus size={18} /> <span className="hidden sm:inline">新增定存</span>
                        </button>
                    )}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 dark:bg-slate-900 dark:text-slate-200">
            {viewMode === 'settings' ? (
                <SettingsView settings={settings} onSave={handleSettingsSave} />
            ) : viewMode === 'monthly' ? (
                <MonthlyOverview 
                    investments={investments} 
                    settings={settings}
                    onBulkPay={handleBulkPay} 
                    onUpdatePayment={handleSimplePaymentUpdate}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                />
            ) : (
                <>
                    {/* Fixed Income Analysis Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatsCard 
                            title="目前定存本金" 
                            value={formatCurrency(stats.activePrincipal)} 
                            icon={<DollarSign size={20} />} 
                            trend="不含已回金"
                        />
                         <StatsCard 
                            title="已實現利息收入" 
                            value={formatCurrency(stats.totalCollectedInterest)} 
                            icon={<Coins size={20} />} 
                            trend="累計實收"
                            color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        />
                        <StatsCard 
                            title="每月被動收入" 
                            value={formatCurrency(stats.totalMonthlyIncome)} 
                            icon={<TrendingUp size={20} />} 
                            color="bg-white dark:bg-slate-800"
                        />
                        <StatsCard 
                            title="加權平均報酬 (APY)" 
                            value={`${stats.weightedRateAnnual.toFixed(2)}%`} 
                            icon={<PieChart size={20} />} 
                        />
                    </div>

                    {/* Analysis Charts - Enhanced */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">資產與到期分析</h2>
                        <button onClick={() => setShowCharts(!showCharts)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{showCharts ? '隱藏' : '顯示'}圖表</button>
                    </div>

                    {showCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Composed Chart: Assets vs Interest */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <CalendarClock size={16}/> 資金與利息趨勢 (Assets & Interest)
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={stats.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                                            
                                            {/* Left Axis: Interest (Different Unit) */}
                                            <YAxis 
                                                yAxisId="left"
                                                orientation="left"
                                                tickFormatter={(val) => `${val/1000}k`} 
                                                tick={{fontSize: 12, fill: '#10b981'}} 
                                                stroke="#10b981"
                                                width={40}
                                            />
                                            
                                            {/* Right Axis: Capital */}
                                            <YAxis 
                                                yAxisId="right"
                                                orientation="right"
                                                tickFormatter={(val) => `${val/10000}萬`} 
                                                tick={{fontSize: 12, fill: '#3b82f6'}} 
                                                stroke="#3b82f6"
                                                width={40}
                                            />

                                            <Tooltip 
                                                formatter={(val: number) => formatCurrency(val)} 
                                                cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                            />
                                            <Legend wrapperStyle={{fontSize: '11px', color: '#94a3b8'}} />

                                            {/* Interest Area on Left Axis */}
                                            <Area yAxisId="left" type="monotone" dataKey="interest" name="預估利息" fill="#10b981" stroke="#10b981" fillOpacity={0.2} />

                                            {/* Capital Bars on Right Axis */}
                                            <Bar yAxisId="right" dataKey="activeCapital" name="現有資金" fill="#3b82f6" stackId="a" barSize={30} />
                                            <Bar yAxisId="right" dataKey="returnedCapital" name="到期回金" fill="#f59e0b" stackId="a" barSize={30} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Allocation */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">機構/專案配置 (本金)</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie data={stats.distData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                {stats.distData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                            <Legend wrapperStyle={{fontSize: '11px', color: '#94a3b8'}} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    <InvestmentsTable 
                        investments={filteredInvestments}
                        settings={settings}
                        onEdit={handleEdit}
                        onCopy={handleCopy}
                        onDelete={handleDelete}
                        onRenew={handleRenew}
                        onUpdatePayment={handleUpdatePayment}
                        onUpdateIntroFee={handleUpdateIntroFee}
                        onReorder={handleReorder}
                    />

                    {filteredInvestments.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl mt-4">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">尚無定存紀錄</p>
                            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">立即新增</button>
                        </div>
                    )}
                </>
            )}
            <div className="h-20"></div>
        </main>
      </div>

      <InvestmentForm 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
          onSubmit={handleAdd} 
          initialData={editingItem} 
          settings={settings}
          existingInvestments={investments} // Pass for duplication checks
      />
      <ImportPreviewModal isOpen={importPreviewOpen} onClose={() => { setImportPreviewOpen(false); setImportCandidates([]); }} onConfirm={handleImportConfirm} existingData={investments} incomingData={importCandidates} />
      <ExportPreviewModal 
          isOpen={exportPreviewOpen} 
          onClose={() => setExportPreviewOpen(false)} 
          data={investments} 
          onConfirm={handleConfirmExport} 
          selectedType={exportType}
      />
    </div>
  );
}