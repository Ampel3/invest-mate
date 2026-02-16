import React, { useState, useEffect } from 'react';
import { Investment, InvestmentStatus, Funder, StatusLabels, AppSettings } from '../types';
import { toROCDate, calculateEndDate, generateId, generateTicketString, isoToROCInput, rocInputToISO } from '../utils';
import { X, Plus, Trash2, Users, Settings, Building2 } from 'lucide-react';

interface InvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (investment: Investment) => void;
  initialData?: Investment | null;
  settings: AppSettings;
  existingInvestments: Investment[];
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ isOpen, onClose, onSubmit, initialData, settings, existingInvestments }) => {
  const [formData, setFormData] = useState<Partial<Investment>>({
    source: '',
    amount: 0,
    rate: 1.2,
    introFeeRate: 0.5,
    startDate: new Date().toISOString().split('T')[0],
    duration: 6,
    status: InvestmentStatus.Active,
    note: '',
    paymentHistory: {},
    funders: [],
    introFeePaid: false
  });

  const [funders, setFunders] = useState<Funder[]>([]);
  const [useAutoTicket, setUseAutoTicket] = useState(true);
  const [startRocInput, setStartRocInput] = useState('');

  // Initialize Data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setFunders(initialData.funders || []);
      // User request: Default enable auto ticket for both Add and Edit
      setUseAutoTicket(true); 
      setStartRocInput(isoToROCInput(initialData.startDate));
    } else {
      // Reset for new entry
      const defaultId = generateId();
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        id: defaultId,
        source: '',
        amount: 500000,
        rate: 1.2,
        introFeeRate: 0.5, // Default 6 months = 0.5%
        startDate: today,
        duration: 6,
        status: InvestmentStatus.Active,
        note: '',
        paymentHistory: {},
        funders: [],
        introFeePaid: false
      });
      setFunders([]);
      setUseAutoTicket(true);
      setStartRocInput(isoToROCInput(today));
    }
  }, [initialData, isOpen]);

  // Handle Start Date Input Change
  const handleRocDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setStartRocInput(val);
      const iso = rocInputToISO(val);
      if (iso) {
          setFormData(prev => ({ ...prev, startDate: iso }));
      }
  };

  // Logic 1: Auto Status for Expired (New Entry Only)
  useEffect(() => {
      if (!initialData && formData.startDate && formData.duration) {
          const endDate = calculateEndDate(formData.startDate, formData.duration);
          const today = new Date().toISOString().split('T')[0];
          if (endDate < today) {
              setFormData(prev => ({ ...prev, status: InvestmentStatus.Returned }));
          } else {
              setFormData(prev => ({ ...prev, status: InvestmentStatus.Active }));
          }
      }
  }, [formData.startDate, formData.duration, initialData]);

  // Logic 5: Auto Intro Fee based on Duration (Strict Rule)
  useEffect(() => {
    if (!initialData && formData.duration) {
      if (formData.duration === 6) {
        setFormData(prev => ({ ...prev, introFeeRate: 0.5 }));
      } else if (formData.duration === 12) {
        setFormData(prev => ({ ...prev, introFeeRate: 1.0 }));
      }
    }
  }, [formData.duration, initialData]);

  // Update Total Amount when funders change
  useEffect(() => {
    if (funders.length > 0) {
      const total = funders.reduce((sum, f) => sum + f.amount, 0);
      setFormData(prev => ({ ...prev, amount: total }));
    }
  }, [funders]);

  // Helper: Check for duplicates and append suffix (Logic 3)
  const getUniqueTicket = (baseTicket: string): string => {
      let unique = baseTicket;
      let suffixCode = 65; // 'A'
      
      // Check if this ticket exists in OTHER investments
      // If we are editing, we must exclude the current ID
      while (existingInvestments.some(i => i.ticketNumber === unique && i.id !== formData.id)) {
          unique = `${baseTicket}${String.fromCharCode(suffixCode)}`;
          suffixCode++;
      }
      return unique;
  };

  // Logic 5: Auto Ticket Number & Logic 3 (Duplicate Check)
  useEffect(() => {
    if (useAutoTicket) {
       const endDate = calculateEndDate(formData.startDate!, formData.duration || 6);
       const rate = formData.rate || 0;

       // 1. If Funders exist, update THEIR tickets (Tree Children)
       if (funders.length > 0) {
           const updatedFunders = funders.map(f => ({
               ...f,
               // Note: Funder tickets usually don't need uniqueness check against global list in same way, 
               // but visually they follow the pattern. 
               ticketNumber: generateTicketString(endDate, f.name || '?', f.amount, rate)
           }));
           if (JSON.stringify(updatedFunders) !== JSON.stringify(funders)) {
               setFunders(updatedFunders);
           }
           
           // Master Ticket (Tree Root)
           const baseMaster = generateTicketString(endDate, formData.source || '', formData.amount || 0, rate);
           const uniqueMaster = getUniqueTicket(baseMaster);
           if (formData.ticketNumber !== uniqueMaster) {
                setFormData(prev => ({ ...prev, ticketNumber: uniqueMaster }));
           }
       } 
       // 2. If no Funders, update Master Ticket
       else {
           const baseTicket = generateTicketString(
               endDate, 
               formData.source || '', 
               formData.amount || 0, 
               rate
           );
           const uniqueTicket = getUniqueTicket(baseTicket);
           if (formData.ticketNumber !== uniqueTicket) {
               setFormData(prev => ({ ...prev, ticketNumber: uniqueTicket }));
           }
       }
    }
  }, [useAutoTicket, formData.startDate, formData.duration, formData.source, formData.amount, formData.rate, funders.length, JSON.stringify(funders.map(f=>({n:f.name, a:f.amount}))), initialData, existingInvestments]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEndDate = calculateEndDate(formData.startDate!, formData.duration || 6);
    
    onSubmit({
      ...formData,
      endDate: finalEndDate,
      id: formData.id || generateId(),
      funders: funders, // Attach funders with tickets
      paymentHistory: formData.paymentHistory || {}
    } as Investment);
    onClose();
  };

  // Helper for Funder Management
  const addFunder = () => {
    setFunders([...funders, { id: generateId(), name: '', amount: 0, ticketNumber: '' }]);
  };

  const removeFunder = (id: string) => {
    setFunders(funders.filter(f => f.id !== id));
  };

  const updateFunder = (id: string, field: keyof Funder, value: any) => {
    setFunders(funders.map(f => {
        if (f.id === id) {
            return { ...f, [field]: value };
        }
        return f;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {initialData ? '編輯定存/投資' : '新增定存/投資'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 bg-white dark:bg-slate-800">
          <form id="investForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Source with Quick Select */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex justify-between">
                  <span>機構/專案名稱 (Institution)</span>
                  <span className="text-[10px] text-slate-500 font-medium">存入銀行或對象</span>
              </label>
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm"
                        placeholder="例如: 台灣銀行 / 專案A"
                        value={formData.source}
                        onChange={e => setFormData({...formData, source: e.target.value})}
                      />
                  </div>
                  <select 
                    className="w-1/3 px-2 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium shadow-sm"
                    onChange={(e) => {
                        if(e.target.value) setFormData({...formData, source: e.target.value});
                    }}
                    value=""
                  >
                      <option value="">常用選擇...</option>
                      {settings.savedSources.map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
            </div>

            {/* Funders Section - Enhanced Contrast (Logic 6) */}
            <div className="md:col-span-2 bg-slate-200 dark:bg-slate-700 p-5 rounded-xl border border-slate-400 dark:border-slate-500 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={16} /> 共同出資人 (選填)
                    </label>
                    <button type="button" onClick={addFunder} className="text-xs bg-white dark:bg-slate-600 text-slate-800 dark:text-white border border-slate-400 dark:border-slate-500 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-500 font-bold shadow-sm transition-all">
                        + 新增出資人
                    </button>
                </div>
                
                {funders.length === 0 && (
                     <p className="text-xs text-slate-600 dark:text-slate-400 italic text-center py-2 font-medium">無共同出資人，請直接輸入下方總金額。</p>
                )}

                <div className="space-y-3">
                    {funders.map((f, index) => (
                        <div key={f.id} className="flex flex-col gap-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-5">#{index+1}</span>
                                {/* Funder Name Select/Input */}
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="姓名"
                                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white font-medium bg-white dark:bg-slate-700"
                                        value={f.name}
                                        onChange={e => updateFunder(f.id, 'name', e.target.value)}
                                        list={`funder-list-${f.id}`}
                                    />
                                    <datalist id={`funder-list-${f.id}`}>
                                        {settings.savedFunders.map(name => (
                                            <option key={name} value={name} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="relative w-28">
                                    <input 
                                        type="number" 
                                        placeholder="金額"
                                        className="w-full pl-2 pr-7 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700"
                                        value={f.amount === 0 ? '' : f.amount / 10000} // Display in Wan
                                        onChange={e => updateFunder(f.id, 'amount', Number(e.target.value) * 10000)}
                                    />
                                    <span className="absolute right-2 top-1.5 text-xs text-slate-500 font-medium">萬</span>
                                </div>
                                <button type="button" onClick={() => removeFunder(f.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {/* Individual Ticket Preview */}
                            <div className="flex items-center gap-2 pl-7">
                                <span className="text-[10px] text-slate-500 font-bold">憑證號:</span>
                                <input 
                                    type="text"
                                    className="flex-1 text-[10px] bg-slate-50 dark:bg-slate-700 border-none text-slate-700 dark:text-slate-300 font-mono font-medium p-0 h-auto"
                                    value={f.ticketNumber || ''}
                                    readOnly={useAutoTicket}
                                    onChange={(e) => {
                                        setUseAutoTicket(false);
                                        updateFunder(f.id, 'ticketNumber', e.target.value);
                                    }}
                                    placeholder="自動產生或手動輸入..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Amount (Requirement 2: Input in Wan) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">存入總金額 (萬元)</label>
              <div className="relative">
                <input
                    type="number"
                    required
                    readOnly={funders.length > 0} // Lock if funders exist
                    className={`w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-700 shadow-sm ${funders.length > 0 ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed text-slate-500' : ''}`}
                    value={formData.amount ? formData.amount / 10000 : ''}
                    onChange={e => setFormData({...formData, amount: Number(e.target.value) * 10000})}
                    placeholder="請輸入"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-bold">萬元</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right font-medium">
                  實際: {formData.amount?.toLocaleString()} 元
              </p>
            </div>

             {/* Rate */}
             <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">月利率 % (Monthly Rate)</label>
              <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-700 shadow-sm"
                    value={formData.rate}
                    onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})}
                  />
              </div>
            </div>

            {/* Intro Fee Rate */}
            <div>
                 <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">介紹費/額外獎勵 %</label>
                 <div className="flex items-center gap-4 mt-2">
                     <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                         <input 
                            type="radio" 
                            name="introFee" 
                            checked={formData.introFeeRate === 0.5} 
                            onChange={() => setFormData({...formData, introFeeRate: 0.5})}
                            className="w-4 h-4 text-blue-600"
                         />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">0.5% (短約)</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                         <input 
                            type="radio" 
                            name="introFee" 
                            checked={formData.introFeeRate === 1.0} 
                            onChange={() => setFormData({...formData, introFeeRate: 1.0})}
                            className="w-4 h-4 text-blue-600"
                         />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">1.0% (長約)</span>
                     </label>
                 </div>
            </div>

            {/* Start Date (ROC) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">起息日 (ROC / ISO)</label>
              <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={7}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-700 shadow-sm"
                    placeholder="例如: 1140226"
                    value={startRocInput}
                    onChange={handleRocDateChange}
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-400 font-mono">
                      {formData.startDate}
                  </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">合約期數 (月)</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-700 shadow-sm"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
              >
                  <option value={3}>3 個月</option>
                  <option value={6}>6 個月</option>
                  <option value={12}>12 個月 (1年)</option>
                  <option value={24}>24 個月 (2年)</option>
              </select>
            </div>

            {/* Ticket Number (Manual Override) */}
            <div className="md:col-span-2">
                 <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex justify-between">
                     <span>總存單編號 / 憑證號 (Master Ticket)</span>
                     <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => setUseAutoTicket(true)}>重設為自動產生</span>
                 </label>
                 <input
                    type="text"
                    className={`w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-700 shadow-sm ${useAutoTicket ? 'bg-slate-50 dark:bg-slate-800 text-slate-500' : ''}`}
                    value={formData.ticketNumber}
                    readOnly={useAutoTicket && funders.length === 0} // Only readonly if auto AND no funders (if funders exist, master ticket is still auto calculated usually)
                    // Actually if auto is on, it's computed.
                    onChange={e => {
                        setUseAutoTicket(false);
                        setFormData({...formData, ticketNumber: e.target.value});
                    }}
                    placeholder="自動產生中..."
                 />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">備註</label>
              <textarea
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm"
                rows={3}
                placeholder="例如：特定約定、匯款帳號..."
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="investForm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-95"
          >
            {initialData ? '儲存變更' : '新增定存'}
          </button>
        </div>
      </div>
    </div>
  );
};