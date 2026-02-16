
import { Investment, Funder, InvestmentStatus } from './types';

// Convert ISO date (2025-07-16) to ROC string (114/07/16)
export const toROCDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const year = date.getFullYear() - 1911;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// Convert ISO date to ROC simple string for Ticket (e.g., 2026-02-15 -> 1150215)
export const toROCSimple = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const year = date.getFullYear() - 1911;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

// Convert ISO (2025-12-07) to ROC Input String (1141207)
export const isoToROCInput = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear() - 1911;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

// Convert ROC Input String (1141207 or 990101) to ISO (2025-12-07)
export const rocInputToISO = (rocInput: string): string | null => {
  const clean = rocInput.replace(/\D/g, '');
  // Allow 6 digit (990101) or 7 digit (1000101)
  if (clean.length !== 6 && clean.length !== 7) return null;

  let yearStr, monthStr, dayStr;
  if (clean.length === 7) {
    yearStr = clean.substring(0, 3);
    monthStr = clean.substring(3, 5);
    dayStr = clean.substring(5, 7);
  } else {
    yearStr = clean.substring(0, 2);
    monthStr = clean.substring(2, 4);
    dayStr = clean.substring(4, 6);
  }

  const year = parseInt(yearStr, 10) + 1911;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Basic validation
  if (month < 1 || month > 12) return null;
  // Check valid days in month
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
     return null;
  }

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Auto Generate Ticket Logic
export const generateTicketString = (endDate: string, name: string, amount: number, rate: number): string => {
  if (!endDate || !name) return '';
  const rocDate = toROCSimple(endDate);
  const amountWan = Math.round(amount / 10000);
  return `${rocDate}-${name}${amountWan}(${rate}%)`;
};

// Convert ROC string (114/07/16) to ISO date (2025-07-16)
export const parseROCDate = (rocDate: string): string => {
  if (!rocDate) return new Date().toISOString().split('T')[0];
  
  // Clean up string
  const cleanDate = rocDate.trim();
  
  // Handle ISO format if passed by mistake
  if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) return cleanDate;

  const parts = cleanDate.split(/[~/.-]/); 
  if (parts.length < 3) return new Date().toISOString().split('T')[0];
  
  let year = parseInt(parts[0], 10);
  // Assume ROC if year < 1911 (e.g. 114), else Gregorian
  if (year < 1911) year += 1911;
  
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate which month (1-based) we are currently in relative to start date
export const calculatePeriodDiff = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  
  // Calculate months difference
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  
  // Simple approximation:
  const currentMonthIdx = months + 1;
  return currentMonthIdx > 0 ? currentMonthIdx : 1;
};

// Start Date + N Months = End Date
export const calculateEndDate = (startDate: string, months: number): string => {
  if (!startDate) return '';
  const date = new Date(startDate);
  // Add months
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

// Get the specific due date for a given period index (1-based)
export const getPeriodDueDate = (startDate: string, periodIndex: number): string => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + periodIndex); 
  return date.toISOString().split('T')[0];
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- COLOR HELPER ---

// Updated palette with stronger contrast (100/200 for light, higher opacity for dark)
export const RATE_COLOR_PALETTE = [
    { name: 'Slate', class: 'bg-slate-100 dark:bg-slate-700/60' },
    { name: 'Red', class: 'bg-red-100 dark:bg-red-900/50' },
    { name: 'Orange', class: 'bg-orange-100 dark:bg-orange-900/50' },
    { name: 'Amber', class: 'bg-amber-100 dark:bg-amber-900/50' },
    { name: 'Yellow', class: 'bg-yellow-100 dark:bg-yellow-900/50' },
    { name: 'Lime', class: 'bg-lime-100 dark:bg-lime-900/50' },
    { name: 'Green', class: 'bg-green-100 dark:bg-green-900/50' },
    { name: 'Emerald', class: 'bg-emerald-100 dark:bg-emerald-900/50' },
    { name: 'Teal', class: 'bg-teal-100 dark:bg-teal-900/50' },
    { name: 'Cyan', class: 'bg-cyan-100 dark:bg-cyan-900/50' },
    { name: 'Sky', class: 'bg-sky-100 dark:bg-sky-900/50' },
    { name: 'Blue', class: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Indigo', class: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: 'Violet', class: 'bg-violet-100 dark:bg-violet-900/50' },
    { name: 'Purple', class: 'bg-purple-100 dark:bg-purple-900/50' },
    { name: 'Fuchsia', class: 'bg-fuchsia-100 dark:bg-fuchsia-900/50' },
    { name: 'Pink', class: 'bg-pink-100 dark:bg-pink-900/50' },
    { name: 'Rose', class: 'bg-rose-100 dark:bg-rose-900/50' },
];

export const getRateColorClass = (rate: number, customMap?: Record<string, string>): string => {
  const rateKey = rate.toString();
  
  // 1. Check Custom Map
  if (customMap && customMap[rateKey]) {
      return customMap[rateKey];
  }

  // 2. Fallback to deterministic palette based on rate value
  const colors = RATE_COLOR_PALETTE.map(c => c.class);
  // Use a hash-like index to ensure same rate gets same color, but spreads out
  const index = Math.floor(rate * 100) % colors.length;
  return colors[index];
};

// --- ANALYSIS HELPERS ---

// Calculate Weighted Average Rate (Annualized)
export const calculateWeightedRate = (investments: Investment[]): number => {
    if (investments.length === 0) return 0;
    const totalPrincipal = investments.reduce((sum, i) => sum + i.amount, 0);
    if (totalPrincipal === 0) return 0;

    // Weighted Sum = Sum(Principal * MonthlyRate)
    const weightedSum = investments.reduce((sum, i) => sum + (i.amount * i.rate), 0);
    
    // Weighted Monthly Rate
    const weightedMonthly = weightedSum / totalPrincipal;
    
    // Return Annual Rate (approx)
    return weightedMonthly * 12; // Assuming monthly rate input, return annual %
};

// Group Investments by Maturity Month (for Ladder Chart)
export const getMaturityLadder = (investments: Investment[]) => {
    const ladder: Record<string, number> = {};
    const today = new Date();
    
    // Look ahead 12 months
    for(let i=0; i<12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`; // YYYY-MM
        ladder[key] = 0;
    }

    investments.forEach(inv => {
        // Only count active investments
        if(inv.status === InvestmentStatus.Active || inv.status === InvestmentStatus.Renewed) {
             const endDate = new Date(inv.endDate);
             const key = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toString().padStart(2, '0')}`;
             if(ladder[key] !== undefined) {
                 ladder[key] += inv.amount;
             }
        }
    });

    return Object.entries(ladder)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => {
            // Convert YYYY-MM to ROC (e.g., 114/02)
            const [y, m] = date.split('-');
            const rocY = parseInt(y) - 1911;
            return {
                name: `${rocY}/${m}`,
                value: amount
            };
        });
};

// --- NEW CHART DATA GENERATOR (Dual Axis) ---
export const getMonthlyChartData = (investments: Investment[]) => {
    const dataMap: Record<string, { name: string, activeCapital: number, returnedCapital: number, interest: number }> = {};
    const today = new Date();
    
    // Range: Past 6 months to Future 12 months
    for(let i = -6; i <= 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
        const rocY = d.getFullYear() - 1911;
        const name = `${rocY}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
        
        dataMap[key] = { name, activeCapital: 0, returnedCapital: 0, interest: 0 };
    }

    investments.forEach(inv => {
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);
        const monthlyInterest = Math.round(inv.amount * (inv.rate / 100));

        // 1. Capital (Active & Returned)
        Object.keys(dataMap).forEach(key => {
            const [y, m] = key.split('-').map(Number);
            const monthStart = new Date(y, m - 1, 1);
            const monthEnd = new Date(y, m, 0); // End of this month

            // Active Capital: Invested BEFORE this month ends AND Matures AFTER this month starts
            // Simplification: If the investment covers this month.
            if (start <= monthEnd && end > monthStart) {
                 dataMap[key].activeCapital += inv.amount;
            }

            // Returned Capital: Matures IN this month
            if (end.getFullYear() === y && end.getMonth() + 1 === m) {
                // If status is returned, active capital drops, but let's show "Returned" bar
                dataMap[key].returnedCapital += inv.amount;
            }
        });

        // 2. Interest Distribution
        for(let i = 1; i <= inv.duration; i++) {
            const dueDate = new Date(inv.startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            const key = `${dueDate.getFullYear()}-${(dueDate.getMonth()+1).toString().padStart(2, '0')}`;
            
            if (dataMap[key]) {
                dataMap[key].interest += monthlyInterest;
            }
        }
    });

    return Object.values(dataMap).sort((a, b) => {
        const [yA, mA] = a.name.split('/').map(Number);
        const [yB, mB] = b.name.split('/').map(Number);
        return (yA * 12 + mA) - (yB * 12 + mB);
    });
};

// --- MONTHLY OVERVIEW REPORT HELPER ---
export interface MonthlyReportItem {
    monthStr: string; // YYYY-MM
    rocMonth: string; // ROC YYY/MM
    newCapital: number;
    returnedCapital: number;
    interestExpected: number;
    interestActual: number;
    // Details for expansion
    interestDetails: {
        invId: string;
        source: string;
        ticketNumber?: string; // Add ticketNumber
        amount: number;
        period: number;
        rate: number; // ADDED RATE for coloring
        dueDate: string;
        isPaid: boolean;
        paidDate?: string;
    }[];
    capitalInDetails: { source: string, ticketNumber?: string, amount: number, date: string }[];
    capitalOutDetails: { source: string, ticketNumber?: string, amount: number, date: string }[];
}

export const getMonthlyReport = (investments: Investment[]): MonthlyReportItem[] => {
    const report: Record<string, MonthlyReportItem> = {};
    
    investments.forEach(inv => {
        const monthlyInterest = Math.round(inv.amount * (inv.rate / 100));

        // 1. New Capital (Start Date)
        const start = new Date(inv.startDate);
        const startKey = `${start.getFullYear()}-${(start.getMonth()+1).toString().padStart(2, '0')}`;
        if(!report[startKey]) initReportMonth(report, startKey);
        report[startKey].newCapital += inv.amount;
        report[startKey].capitalInDetails.push({
            source: inv.source,
            ticketNumber: inv.ticketNumber,
            amount: inv.amount,
            date: inv.startDate
        });

        // 2. Returned Capital (End Date)
        const end = new Date(inv.endDate);
        const endKey = `${end.getFullYear()}-${(end.getMonth()+1).toString().padStart(2, '0')}`;
        if(!report[endKey]) initReportMonth(report, endKey);
        report[endKey].returnedCapital += inv.amount;
        report[endKey].capitalOutDetails.push({
            source: inv.source,
            ticketNumber: inv.ticketNumber,
            amount: inv.amount,
            date: inv.endDate
        });

        // 3. Interest
        for(let i = 1; i <= inv.duration; i++) {
            const d = new Date(inv.startDate);
            d.setMonth(d.getMonth() + i);
            const iKey = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
            if(!report[iKey]) initReportMonth(report, iKey);
            
            report[iKey].interestExpected += monthlyInterest;
            
            const isPaid = inv.paymentHistory[i]?.isPaid || false;
            if(isPaid) {
                report[iKey].interestActual += monthlyInterest;
            }

            report[iKey].interestDetails.push({
                invId: inv.id,
                source: inv.source,
                ticketNumber: inv.ticketNumber, 
                amount: monthlyInterest,
                period: i,
                rate: inv.rate, // ADDED
                dueDate: d.toISOString().split('T')[0],
                isPaid: isPaid,
                paidDate: inv.paymentHistory[i]?.paidDate
            });
        }
    });

    // Sort ascending
    return Object.values(report).sort((a, b) => a.monthStr.localeCompare(b.monthStr));
};

function initReportMonth(report: Record<string, MonthlyReportItem>, key: string) {
    const [y, m] = key.split('-').map(Number);
    const roc = `${y-1911}/${m.toString().padStart(2, '0')}`;
    report[key] = {
        monthStr: key,
        rocMonth: roc,
        newCapital: 0,
        returnedCapital: 0,
        interestExpected: 0,
        interestActual: 0,
        interestDetails: [],
        capitalInDetails: [],
        capitalOutDetails: []
    };
}


// --- EXPORT FUNCTIONS ---

const prepareExportData = (investments: Investment[]) => {
  // Sort by order before exporting
  const sorted = [...investments].sort((a, b) => (a.order || 0) - (b.order || 0));

  return sorted.map(inv => {
    // Generate a summary of tickets if multiple funders
    const tickets = inv.funders && inv.funders.length > 0 
      ? inv.funders.map(f => f.ticketNumber || generateTicketString(inv.endDate, f.name, f.amount, inv.rate)).join(', ')
      : inv.ticketNumber;

    const fundersNames = inv.funders?.map(f => `${f.name}(${f.amount/10000}萬)`).join(', ') || '';

    // Calculate total collected interest
    const monthlyIncome = Math.round(inv.amount * (inv.rate / 100));
    const paidCount = Object.values(inv.paymentHistory).filter(p => p.isPaid).length;
    const totalCollectedInterest = monthlyIncome * paidCount;

    return {
      "排序": inv.order || 0, // Added Order field
      "系統ID": inv.id, // Export ID for conflict detection on import
      "機構/專案": inv.source,
      "存單編號": tickets,
      "共同出資人": fundersNames,
      "總本金": inv.amount,
      "月利率(%)": inv.rate,
      "每月利息": monthlyIncome,
      "額外獎勵(%)": inv.introFeeRate,
      "獎勵金額": Math.round(inv.amount * (inv.introFeeRate / 100)),
      "獎勵已領": inv.introFeePaid ? '是' : '否',
      "開始日期": toROCDate(inv.startDate),
      "到期日期": toROCDate(inv.endDate),
      "合約期數": inv.duration,
      "目前期數": calculatePeriodDiff(inv.startDate),
      "已收期數": paidCount,
      "累積已收利息": totalCollectedInterest,
      "狀態": inv.status,
      "備註": inv.note
    };
  });
};

export const exportToXLSX = (investments: Investment[], filename: string) => {
  // @ts-ignore
  if (typeof XLSX === 'undefined') { alert('Excel library missing'); return; }
  const flatData = prepareExportData(investments);
  // @ts-ignore
  const ws = XLSX.utils.json_to_sheet(flatData);
  // @ts-ignore
  const wb = XLSX.utils.book_new();
  // @ts-ignore
  XLSX.utils.book_append_sheet(wb, ws, "Investments");
  // @ts-ignore
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (investments: Investment[], filename: string) => {
    // @ts-ignore
    if (typeof XLSX === 'undefined') { alert('Excel library missing'); return; }
    const flatData = prepareExportData(investments);
    // @ts-ignore
    const ws = XLSX.utils.json_to_sheet(flatData);
    // @ts-ignore
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    // Add BOM for UTF-8 Excel compatibility
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToJSON = (data: any, filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- IMPORT HELPERS ---

// Helper to attempt parsing "Name(10萬)" string back into objects
const parseFundersString = (str: string): Funder[] => {
    if (!str) return [];
    const funders: Funder[] = [];
    // Split by comma
    const parts = str.split(/[,，]/);
    parts.forEach(p => {
        // Match Name and Amount in brackets
        const match = p.match(/([^(]+)\((\d+(\.\d+)?)萬\)/);
        if (match) {
            const name = match[1].trim();
            const amountWan = parseFloat(match[2]);
            funders.push({
                id: generateId(),
                name: name,
                amount: amountWan * 10000,
                ticketNumber: '' // Generated later if needed
            });
        }
    });
    return funders;
};

export const parseExcelData = (data: any[]): Investment[] => {
    return data.map((row: any) => {
        // Mapping Excel columns back to Investment object
        // NOTE: This is "best effort". Complex payment history is lost in flat import.
        const funders = parseFundersString(row["共同出資人"] || row["金主明細"] || "");
        const amount = Number(row["總本金"]) || 0;
        
        // Use existing ID if present (for overwrite logic), else generate new
        const id = row["系統ID"] || generateId();
        
        return {
            id: id,
            source: row["機構/專案"] || row["掛名人/群組"] || "匯入資料",
            funders: funders,
            amount: amount,
            rate: Number(row["月利率(%)"]) || 1.2,
            introFeeRate: Number(row["額外獎勵(%)"]) || Number(row["介紹費(%)"]) || 0.5,
            introFeePaid: row["獎勵已領"] === '是' || row["介紹費已收"] === '是',
            startDate: parseROCDate(row["開始日期"]),
            endDate: parseROCDate(row["到期日期"]),
            duration: Number(row["合約期數"]) || 12,
            ticketNumber: row["存單編號"] || row["單號"] || "",
            note: row["備註"] || "",
            status: row["狀態"] as InvestmentStatus || InvestmentStatus.Active,
            paymentHistory: {}, // History is lost in flat import
            order: Number(row["排序"]) || 0 // Try to parse order if exists
        };
    });
};
