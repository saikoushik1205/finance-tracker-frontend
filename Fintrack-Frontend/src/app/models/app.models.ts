export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  providers: string[];
  memberSince: Date;
  lastLogin?: Date;
}

export interface Person {
  _id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  sectionType: SectionType;
  metadata?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats?: PersonStats;
  transactions?: Transaction[];
}

export interface PersonStats {
  transactionCount: number;
  total: number;
  pending: number;
  completed: number;
}

export interface Transaction {
  _id: string;
  personId: string;
  userId: string;
  date: Date;
  amount: number;
  remarks: string;
  status: TransactionStatus;
  type?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashBank {
  cash: number;
  bank: number;
  amazonPay?: number;
  tide?: number;
  total: number;
  amazonPayAccounts?: BalanceAccount[];
  bankAccounts?: BalanceAccount[];
  tideAccounts?: BalanceAccount[];
  updatedAt?: Date;
}

export interface BalanceAccount {
  _id?: string;
  name: string;
  balance: number;
}

export interface DashboardStats {
  lending: SectionStats;
  borrowing: SectionStats;
  earnings: SectionStats;
  expenses: SectionStats;
  interest: SectionStats;
  cashBank: CashBank;
  netBalance: number;
  netReceivable?: number;
  cashPosition?: number;
  netWorth?: number;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalLent: number;
    totalBorrowed: number;
    availableCash: number;
    pendingLent?: number;
    pendingBorrowed?: number;
    returnedLent?: number;
    returnedBorrowed?: number;
    totalEarnings?: number;
    netReceivable?: number;
    cashPosition?: number;
    netWorth?: number;
  };
}

export interface SectionStats {
  total: number;
  pending: number;
  completed: number;
}

export type SectionType =
  | "lending"
  | "borrowing"
  | "earnings"
  | "expenses"
  | "interest";
export type TransactionStatus = "pending" | "completed" | "cancelled";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
