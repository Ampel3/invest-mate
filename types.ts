
export enum InvestmentStatus {
  Active = 'Active',
  Renewed = 'Renewed',
  Returned = 'Returned',
  Reinvested = 'Reinvested',
  Defaulted = 'Defaulted'
}

export const StatusLabels: Record<InvestmentStatus, string> = {
  [InvestmentStatus.Active]: '進行中',
  [InvestmentStatus.Renewed]: '續約',
  [InvestmentStatus.Returned]: '已回金',
  [InvestmentStatus.Reinvested]: '轉投',
  [InvestmentStatus.Defaulted]: '違約/異常'
};

export interface PaymentRecord {
  isPaid: boolean;
  paidDate?: string;
  note?: string;
}

export interface Funder {
  id: string;
  name: string;
  amount: number; // Stored as raw number (e.g. 100000)
  ticketNumber?: string; // Specific ticket for this funder
}

export interface Investment {
  id: string;
  source: string; // The group/name
  funders?: Funder[]; // List of individual funders
  amount: number; // Total Capital
  rate: number; // Monthly interest rate %
  introFeeRate: number; // 0.5 or 1.0 %
  introFeePaid?: boolean; // Whether intro fee is collected
  introFeePaidDate?: string; // Date collected
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string; // ISO Date string YYYY-MM-DD
  duration: number; // Duration in months (e.g., 6, 12, 3)
  ticketNumber?: string; // Master ticket number (if no funders) or summary
  note: string; // General note
  status: InvestmentStatus;
  // Key is the month index (1-based)
  paymentHistory: Record<number, PaymentRecord>; 
  order?: number; // For manual sorting
}

export type ThemeOption = 'system' | 'light' | 'dark';

export interface AppSettings {
  savedSources: string[];
  savedFunders: string[];
  theme: ThemeOption;
  rateColorMap: Record<string, string>;
}

export interface SummaryStats {
  totalPrincipal: number;
  totalMonthlyIncome: number;
  totalIntroFees: number;
  activeCount: number;
}
