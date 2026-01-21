
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
  balanceAfter?: number; // Snapshot of balance after this transaction
}

export interface Debtor {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive means they owe money
  lastActivity: string; // ISO string
  transactions: Transaction[];
  createdBy: string; // Name of the user who added this debtor
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  ownerTelegramId: string;
  createdAt: string;
  isOwner?: boolean; // Helper to know if current user is owner
  permissions?: CollaboratorPermissions; // If not owner, what can they do?
  isVerified?: boolean; // Verification status
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE'; // New field for request status
}

export interface CollaboratorPermissions {
  canDeleteDebtor: boolean;
  canAddDebt: boolean;
  canAddPayment: boolean;
}

export interface Collaborator {
  id: number;
  userTelegramId: string;
  firstName: string;
  username?: string;
  photoUrl?: string;
  permissions: CollaboratorPermissions;
}

export interface UserSearchResult {
  telegramId: string;
  firstName: string;
  username?: string;
  photoUrl?: string;
}

export interface AdminUser {
  telegram_id: string;
  first_name: string;
  username?: string;
  phone_number?: string;
  last_seen: string;
  language: string;
  photo_url?: string;
}

export interface VerificationRequest {
  id: number;
  store_id: string;
  user_telegram_id: string;
  document_type: string;
  custom_store_name: string;
  image_base64: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  // Joins
  owner_name?: string;
  owner_username?: string;
}

export type ViewState = 'DASHBOARD' | 'DEBTOR_DETAIL' | 'PROFILE' | 'ANALYTICS' | 'SETTINGS' | 'VERIFICATION';

// Telegram Types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  // Methods for opening links
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: any) => void;
  MainButton: any;
  BackButton: any;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
