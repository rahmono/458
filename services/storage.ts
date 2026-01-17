import { Debtor, Transaction, TransactionType } from '../types';

// API Base URL (empty for relative path if served from same origin)
const API_URL = '/api';

export const getDebtors = async (): Promise<Debtor[]> => {
  try {
    const response = await fetch(`${API_URL}/debtors`);
    if (!response.ok) throw new Error('Failed to fetch debtors');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveDebtor = async (newDebtor: Debtor): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/debtors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDebtor)
    });
    if (!response.ok) throw new Error('Failed to save debtor');
  } catch (error) {
    console.error(error);
  }
};

export const updateDebtorTransaction = async (debtorId: string, transaction: Transaction): Promise<void> => {
  try {
    const payload = {
      ...transaction,
      debtorId // Include debtorId so backend knows who to update
    };
    
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error('Failed to save transaction');
  } catch (error) {
    console.error(error);
  }
};

export const formatCurrency = (amount: number): string => {
  // Safe parsing for string inputs from DB
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('tg-TJ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' TJS';
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('tg-TJ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};