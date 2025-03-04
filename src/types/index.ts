// Transaction Types
export interface Transaction {
    id: number;
    type: 'profit' | 'cost';
    amount: number;
    date: Date;
    description: string;
  }
  
  export interface TransactionFormData {
    type: 'profit' | 'cost';
    amount: string | number;
    date: string;
    description: string;
  }
  
  // Stakeholder Types
  export interface Stakeholder {
    id: number;
    name: string;
    active: boolean;
  }
  
  // Payment Types
  export interface Payment {
    id: number;
    stakeholderId: number;
    month: string; // Format: YYYY-M
    amount: number;
    date: Date;
    notes: string;
  }
  
  export interface PaymentFormData {
    stakeholderId: number | null;
    month: string | null;
    amount: string | number;
    date?: string;
    notes?: string;
  }
  
  // Filter Types
  export interface DateRange {
    startDate: string;
    endDate: string;
  }
  
  // Financial Summary Types
  export interface StakeholderShare {
    [stakeholderId: number]: number;
  }
  
  export interface StakeholderPaymentInfo {
    totalPaid: number;
    remaining: number;
    payments: Payment[];
  }
  
  export interface StakeholderPayments {
    [stakeholderId: number]: StakeholderPaymentInfo;
  }
  
  export interface MonthlyCalculation {
    month: string;
    profit: number;
    cost: number;
    balance: number;
    stakeholderShares: StakeholderShare;
    stakeholderPayments: StakeholderPayments;
  }
  
  export interface FinancialSummary {
    totalProfit: number;
    totalCost: number;
    totalBalance: number;
    stakeholders: Stakeholder[];
    stakeholderTotals: StakeholderShare;
    monthlyCalculations: MonthlyCalculation[];
  }