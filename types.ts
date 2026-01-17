export enum TransactionType {
  DEBT = 'DEBT',     // Қарз додам (Merchant gave goods/money)
  PAYMENT = 'PAYMENT' // Пул гирифтам (Merchant received money)
}

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  type: TransactionType;
  createdBy: string; // Name of the user who recorded this
}

export interface Debtor {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive means they owe money
  lastActivity: string; // ISO string
  transactions: Transaction[];
  createdBy: string; // Name of the user who added this debtor
}

export type ViewState = 'DASHBOARD' | 'DEBTOR_DETAIL' | 'STORE_ANALYTICS';