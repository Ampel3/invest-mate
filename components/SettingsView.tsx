import React, { useState, useMemo } from 'react';
import { AppSettings, ThemeOption, Investment } from '../types';
import { Trash2, Plus, Save, Monitor, Sun, Moon, Palette } from 'lucide-react';
import { RATE_COLOR_PALETTE, getRateColorClass } from '../utils';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  investments?: Investment[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, investments = [] }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newSource, setNewSource] = useState('');
  const [newFunder, setNewFunder] = useState('');
  const [newRate, setNewRate] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<string | null>(null);

  // Get unique rates from existing investments + rates already in config
  const displayRates = useMemo(() => {
      const rates = new Set<string>();
      // From investments
      investments.forEach(i => rates.add(i.rate.toString()));
      // From existing config (if any were manually added, though we only store map)
      Object.keys(localSettings.rateColorMap || {}).forEach(r => rates.add(r));
      
      return Array.from(rates).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [investments, localSettings.rateColorMap]);

  const addSource = () => {
    if (newSource && !localSettings.savedSources.includes(newSource)) {
      setLocalSettings(prev => ({ ...prev, savedSources: [...prev.savedSources, newSource] }));
      setNewSource('');
    }
  };

  const removeSource = (item: string) => {
    setLocalSettings(prev => ({ ...prev, savedSources: prev.savedSources.filter(s => s !== item) }));
  };

  const addFunder = () => {
    if (newFunder && !localSettings.savedFunders.includes(newFunder)) {
      setLocalSettings(prev => ({ ...prev, savedFunders: [...prev.savedFunders, newFunder] }));
      setNewFunder('');
    }
  };

  const removeFunder = (item: string) => {
    setLocalSettings(prev => ({ ...prev, savedFunders: prev.savedFunders.filter(s => s !== item) }));
  };

  const setTheme = (theme: ThemeOption) => {
      setLocalSettings(prev => ({ ...prev, theme }));
  };
  
  const handleRateColorChange = (rate: string, colorClass: string) => {
      setLocalSettings(prev => ({
          ...prev,
          rateColorMap: {
              ...(prev.rateColorMap || {}),
              [rate]: colorClass
          }
      }));
      setIsColorPickerOpen(null);
  };

  const addRate = () => {
      const r = parseFloat(newRate);
      if (!isNaN(r)) {
          const key = r.toString();
          const currentMap = localSettings.rateColorMap || {};
          
          if (!currentMap[key]) {
             handleRateColorChange(key, getRateColorClass(r)); // Set current default as initial
          }
          setNewRate('');
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">系統設定</h2>

        {/* Theme Settings */}
        <div className="mb-8">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">外觀主題 (Theme)</h3>
            <div className="flex gap-4">
                <button 
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${localSettings.theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 text-slate-600 dark:text-slate-400'}`}
                >
                    <Monitor size={20} />
                    <span className="font-bold">跟隨系統</span>
                </button>
                <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${localSettings.theme === 'light' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 dark:border-slate-600 hover:border-amber-300 text-slate-600 dark:text-slate-400'}`}
                >
                    <Sun size={20} />
                    <span className="font-bold">淺色模式</span>
                </button>
                <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${localSettings.theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 text-slate-600 dark:text-slate-400'}`}
                >
                    <Moon size={20} />
                    <span className="font-bold">深色模式</span>
                </button>
            </div>
        </div>

        {/* Rate Color Settings */}
        <div className="mb-8">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Palette size={20} className="text-pink-500"/>
                月利率顏色設定 (Rate Colors)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                自訂不同月利率在列表中的背景顏色。點擊區塊可選擇顏色。
            </p>
            
            <div className="flex gap-2 mb-4 max-w-xs">
                <input 
                    type="number" 
                    step="0.01"
                    className="flex-1 px-4 py-2 border rounded-lg text-sm font-bold text-slate-900 bg-white border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                    placeholder="輸入利率 (如 1.2)"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                />
                <button onClick={addRate} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white px-4 rounded-lg text-sm font-bold transition-colors">
                    新增
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayRates.map(rate => {
                    const currentColorClass = getRateColorClass(parseFloat(rate), localSettings.rateColorMap);
                    
                    return (
                        <div key={rate} className="relative group">
                            <div 
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${currentColorClass} border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 shadow-sm`}
                                onClick={() => setIsColorPickerOpen(isColorPickerOpen === rate ? null : rate)}
                            >
                                <span className="font-bold text-slate-800 dark:text-slate-100">{rate}%</span>
                                <div className="w-5 h-5 rounded-full border border-slate-400/30 shadow-inner bg-current opacity-70"></div>
                            </div>
                            
                            {/* Color Picker Dropdown */}
                            {isColorPickerOpen === rate && (
                                <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 w-64 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-100">
                                    {RATE_COLOR_PALETTE.map((p, idx) => (
                                        <button 
                                            key={idx}
                                            className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-500 hover:scale-110 transition-transform ${p.class}`}
                                            title={p.name}
                                            onClick={() => handleRateColorChange(rate, p.class)}
                                        ></button>
                                    ))}
                                    <div className="col-span-4 text-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <button onClick={() => setIsColorPickerOpen(null)} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline">關閉</button>
                                    </div>
                                </div>
                            )}
                             {/* Overlay to close */}
                             {isColorPickerOpen === rate && (
                                <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(null)}></div>
                            )}
                        </div>
                    );
                })}
                {displayRates.length === 0 && <p className="text-slate-400 text-sm italic col-span-full">尚無利率資料</p>}
            </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">常用名單設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Sources */}
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">投資人 / 來源 (Sources)</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="flex-1 px-4 py-2.5 border rounded-lg text-sm text-slate-900 bg-white border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新增來源..."
                value={newSource}
                onChange={e => setNewSource(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSource()}
              />
              <button onClick={addSource} className="bg-blue-600 text-white px-3.5 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all font-bold">
                <Plus size={20} />
              </button>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 min-h-[240px] border border-slate-100 dark:border-slate-700 space-y-2.5">
              {localSettings.savedSources.map(s => (
                <div key={s} className="flex justify-between items-center bg-white dark:bg-slate-700 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm text-sm text-slate-800 dark:text-slate-200 hover:border-slate-300 transition-colors">
                  <span className="font-medium">{s}</span>
                  <button onClick={() => removeSource(s)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {localSettings.savedSources.length === 0 && <p className="text-slate-400 text-xs text-center py-10 italic">尚未新增資料</p>}
            </div>
          </div>

          {/* Funders */}
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">金主姓名 (Funders)</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="flex-1 px-4 py-2.5 border rounded-lg text-sm text-slate-900 bg-white border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新增金主..."
                value={newFunder}
                onChange={e => setNewFunder(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFunder()}
              />
              <button onClick={addFunder} className="bg-blue-600 text-white px-3.5 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all font-bold">
                <Plus size={20} />
              </button>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 min-h-[240px] border border-slate-100 dark:border-slate-700 space-y-2.5">
              {localSettings.savedFunders.map(f => (
                <div key={f} className="flex justify-between items-center bg-white dark:bg-slate-700 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm text-sm text-slate-800 dark:text-slate-200 hover:border-slate-300 transition-colors">
                  <span className="font-medium">{f}</span>
                  <button onClick={() => removeFunder(f)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
               {localSettings.savedFunders.length === 0 && <p className="text-slate-400 text-xs text-center py-10 italic">尚未新增資料</p>}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-slate-100 dark:border-slate-700 pt-6">
          <button 
            onClick={() => onSave(localSettings)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all transform active:scale-95"
          >
            <Save size={18} />
            儲存並返回
          </button>
        </div>
      </div>
    </div>
  );
};