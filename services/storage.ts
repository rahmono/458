import { Debtor, Transaction, TransactionType, Store, TelegramUser, Collaborator, CollaboratorPermissions, UserSearchResult } from '../types';
import { Language } from '../utils/translations';

// API Base URL (empty for relative path if served from same origin)
const API_URL = '/api';

// Store current Telegram User ID and Store ID in memory
let currentTelegramId: string = 'public'; 
let currentStoreId: string = '';

export const setTelegramId = (id: string) => {
  if (id) {
    currentTelegramId = id;
  }
};

export const setStoreId = (id: string) => {
    if (id) {
        currentStoreId = id;
    }
};

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Telegram-User-ID': currentTelegramId
    };
    if (currentStoreId) {
        headers['X-Store-ID'] = currentStoreId;
    }
    return headers;
};

// --- AUTH & USER METHODS ---

export const syncUser = async (user: TelegramUser): Promise<{ lastActiveStoreId: string | null, language: Language, phoneNumber: string | null }> => {
    try {
        const response = await fetch(`${API_URL}/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        if (!response.ok) return { lastActiveStoreId: null, language: 'tg', phoneNumber: null };
        const data = await response.json();
        return { 
            lastActiveStoreId: data.lastActiveStoreId || null,
            language: data.language || 'tg',
            phoneNumber: data.phoneNumber || null
        };
    } catch (e) {
        console.error('Sync failed', e);
        return { lastActiveStoreId: null, language: 'tg', phoneNumber: null };
    }
};

export const saveLastActiveStore = async (storeId: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/users/me/store`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': currentTelegramId 
            },
            body: JSON.stringify({ storeId })
        });
    } catch (e) {
        console.error('Failed to save store preference', e);
    }
};

export const saveLanguage = async (language: Language): Promise<void> => {
    try {
        await fetch(`${API_URL}/users/me/language`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': currentTelegramId 
            },
            body: JSON.stringify({ language })
        });
    } catch (e) {
        console.error('Failed to save language preference', e);
    }
};

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    try {
        const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

// --- STORE & COLLABORATOR METHODS ---

export const getStores = async (): Promise<Store[]> => {
    try {
        const response = await fetch(`${API_URL}/stores`, {
            headers: { 'X-Telegram-User-ID': currentTelegramId } 
        });
        if (!response.ok) throw new Error('Failed to fetch stores');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const createStore = async (name: string): Promise<Store | null> => {
    try {
        const response = await fetch(`${API_URL}/stores`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': currentTelegramId 
            },
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error('Failed to create store');
        const data = await response.json();
        return data.store;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const submitVerificationRequest = async (storeId: string, documentType: string, imageBase64: string, customStoreName: string): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/stores/${storeId}/verify`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ documentType, imageBase64, customStoreName })
        });
        
        if (!response.ok) {
             if (response.status === 413) {
                 throw new Error("Расм хеле калон аст. Лутфан расми хурдтарро интихоб кунед.");
             }
             const errorData = await response.json().catch(() => ({}));
             const errorMessage = errorData.error || `Server Error: ${response.status}`;
             throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Submit verification error:", error);
        throw error;
    }
};

export const getCollaborators = async (storeId: string): Promise<Collaborator[]> => {
    try {
        const response = await fetch(`${API_URL}/stores/${storeId}/collaborators`, {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const addCollaborator = async (storeId: string, userTelegramId: string, permissions: CollaboratorPermissions): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/stores/${storeId}/collaborators`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ userTelegramId, permissions })
        });
        if (!response.ok) throw new Error('Failed to add collaborator');
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const removeCollaborator = async (storeId: string, userId: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/stores/${storeId}/collaborators/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    } catch (e) {
        console.error(e);
    }
};

// --- DEBTOR METHODS ---

export const getDebtors = async (): Promise<Debtor[]> => {
  try {
    const response = await fetch(`${API_URL}/debtors`, {
      headers: getHeaders()
    });
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
      headers: getHeaders(),
      body: JSON.stringify(newDebtor)
    });
    if (!response.ok) throw new Error('Failed to save debtor');
  } catch (error) {
    console.error(error);
  }
};

export const updateDebtor = async (id: string, name: string, phone: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/debtors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, phone })
    });
    if (!response.ok) throw new Error('Failed to update debtor');
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteDebtor = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/debtors/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete debtor');
  } catch (error) {
    console.error(error);
    throw error;
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
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error('Failed to save transaction');
  } catch (error) {
    console.error(error);
  }
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const sendSmsReminder = async (debtorId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/sms/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ debtorId })
    });
    
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send SMS');
    }
  } catch (error) {
    console.error("SMS Error", error);
    throw error;
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