import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  ChevronRight, 
  Calendar,
  MoreVertical,
  MessageCircle,
  PhoneCall,
  History,
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Store,
  ListFilter,
  Loader2,
  ShieldCheck,
  Info,
  Trash2,
  Briefcase,
  Check,
  Users,
  Lock,
  X,
  UserCircle2,
  PieChart,
  Edit2,
  Settings,
  Languages,
  AlertTriangle,
  BadgeCheck,
  ShieldAlert,
  Clock,
  XCircle,
  Phone,
  Send
} from 'lucide-react';
import { Debtor, Transaction, TransactionType, ViewState, TelegramUser, Store as StoreType, Collaborator, CollaboratorPermissions } from './types';
import { getDebtors, saveDebtor, updateDebtorTransaction, deleteDebtor, deleteTransaction, formatCurrency, formatDate, setTelegramId, getStores, createStore, setStoreId, syncUser, getCollaborators, addCollaborator, removeCollaborator, saveLastActiveStore, updateDebtor, saveLanguage, submitVerificationRequest, sendSmsReminder } from './services/storage';
import { translations, Language } from './utils/translations';
import TransactionModal from './components/TransactionModal';
import AddDebtorModal from './components/AddDebtorModal';
import EditDebtorModal from './components/EditDebtorModal';
import AddStoreModal from './components/AddStoreModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import VerificationView from './components/VerificationView';
import ConnectPhoneModal from './components/ConnectPhoneModal';

// --- Sub Components ---

const Header: React.FC<{ 
  view: ViewState; 
  title?: string; 
  onProfileClick?: () => void;
  currentUser?: string;
  telegramPhoto?: string;
  currentStoreName?: string;
  onEditDebtor?: () => void;
  onDeleteDebtor?: () => void;
  t: (key: string) => string;
}> = ({ view, title, onProfileClick, currentUser, telegramPhoto, currentStoreName, onEditDebtor, onDeleteDebtor, t }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 h-16 px-4 flex items-center justify-between">
      {view === 'DASHBOARD' ? (
        <>
          <div className="flex items-center gap-2 max-w-[60%]">
             <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
               <span className="text-white font-bold text-lg">Д</span>
             </div>
             <div className="flex flex-col overflow-hidden">
               <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">{t('app_name')}</h1>
               <span className="text-[10px] text-zinc-500 truncate">{currentStoreName || t('loading')}</span>
             </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100 py-1.5 px-3 rounded-full transition-colors border border-zinc-100"
          >
            <span className="text-xs font-medium text-zinc-600 hidden sm:block max-w-[100px] truncate">{currentUser}</span>
            <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 overflow-hidden">
               {telegramPhoto ? (
                 <img src={telegramPhoto} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={16} />
               )}
            </div>
          </button>
        </>
      ) : view === 'PROFILE' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('profile_title')}</h1>
        </div>
      ) : view === 'ANALYTICS' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('analytics_title')}</h1>
        </div>
      ) : view === 'SETTINGS' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('settings')}</h1>
        </div>
      ) : view === 'VERIFICATION' ? (
         <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('verification_title')}</h1>
        </div>
      ) : (
        <>
          <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-[200px]">{title}</h1>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && view === 'DEBTOR_DETAIL' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-10 bg-white shadow-xl rounded-xl z-50 py-1.5 border border-zinc-100 w-48 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <button 
                    onClick={() => { onEditDebtor?.(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center gap-2 text-zinc-700"
                  >
                    <Edit2 size={16} />
                    {t('edit')}
                  </button>
                  <button 
                    onClick={() => { onDeleteDebtor?.(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 size={16} />
                    {t('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
};

// ... (Other components: EmptyState, TransactionDetailsModal, SettingsView remain same)
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Search size={24} className="text-zinc-300" />
    </div>
    <p className="text-zinc-400 text-sm">{message}</p>
  </div>
);

// --- Transaction Detail Modal Component ---
const TransactionDetailsModal: React.FC<{
    transaction: Transaction | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    showCreator: boolean;
    t: (key: string) => string;
}> = ({ transaction, onClose, onDelete, showCreator, t }) => {
    if (!transaction) return null;

    // Calculate Before Balance if BalanceAfter exists
    let balanceBefore = 0;
    if (transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) {
        if (transaction.type === TransactionType.DEBT) {
            balanceBefore = Number(transaction.balanceAfter) - Number(transaction.amount);
        } else {
            balanceBefore = Number(transaction.balanceAfter) + Number(transaction.amount);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-200">
                
                <div className="flex items-center justify-between p-4 border-b border-zinc-50">
                    <h3 className="font-medium text-zinc-900">{t('transaction_detail_title')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        transaction.type === TransactionType.DEBT ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                        {transaction.type === TransactionType.DEBT ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                    </div>
                    
                    <h2 className={`text-3xl font-bold mb-1 ${
                         transaction.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'
                    }`}>
                         {transaction.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(transaction.amount)}
                    </h2>
                    <p className="text-sm text-zinc-500">{formatDate(transaction.date)}</p>
                    {transaction.description && <p className="text-sm text-zinc-800 font-medium mt-2">"{transaction.description}"</p>}
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* User Info - ONLY SHOWN IF showCreator IS TRUE */}
                    {showCreator && (
                        <div className="bg-zinc-50 p-3 rounded-xl flex items-center gap-3">
                             <div className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400">
                                <User size={20} />
                             </div>
                             <div>
                                <p className="text-xs text-zinc-400 uppercase font-semibold">{t('performed_by')}</p>
                                <p className="text-sm font-medium text-zinc-900">{transaction.createdBy}</p>
                             </div>
                        </div>
                    )}

                    {/* Balance History Calculation */}
                    {transaction.balanceAfter !== undefined && transaction.balanceAfter !== null ? (
                         <div className="space-y-2 border-t border-zinc-100 pt-4">
                             <p className="text-xs text-zinc-400 uppercase font-semibold text-center mb-2">{t('balance_change')}</p>
                             <div className="flex items-center justify-between text-sm">
                                 <span className="text-zinc-500">{t('prev_debt')}</span>
                                 <span className="font-medium">{formatCurrency(balanceBefore)}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                 <span className="text-zinc-500">{t('amount')}</span>
                                 <span className={transaction.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'}>
                                     {transaction.type === TransactionType.DEBT ? '+' : '-'}{formatCurrency(transaction.amount)}
                                 </span>
                             </div>
                             <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-zinc-100">
                                 <span className="text-zinc-900">{t('new_debt')}</span>
                                 <span className={Number(transaction.balanceAfter) > 0 ? 'text-red-600' : 'text-zinc-500'}>
                                     {formatCurrency(Number(transaction.balanceAfter))}
                                 </span>
                             </div>
                         </div>
                    ) : (
                        <div className="text-center p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                            <Info size={14} className="inline mr-1 -mt-0.5" />
                            {t('old_data_info')}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-100">
                    <button 
                        onClick={() => {
                            if (window.confirm(t('delete_transaction_confirm'))) {
                                onDelete(transaction.id);
                                onClose();
                            }
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Trash2 size={16} />
                        {t('delete_transaction')}
                    </button>
                </div>

            </div>
        </div>
    );
};

// --- Settings View Component ---
const SettingsView: React.FC<{
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: (key: string) => string;
}> = ({ language, onLanguageChange, t }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
         <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
            <Languages size={16} className="text-zinc-500" />
            <h3 className="font-medium text-sm text-zinc-900">{t('language')}</h3>
         </div>
         <div className="p-4 space-y-3">
            <p className="text-sm text-zinc-500 mb-2">{t('select_language')}</p>
            
            <button 
              onClick={() => onLanguageChange('tg')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                language === 'tg' 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
               <span className="font-medium">Тоҷикӣ</span>
               {language === 'tg' && <Check size={16} />}
            </button>

            <button 
              onClick={() => onLanguageChange('ru')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                language === 'ru' 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
               <span className="font-medium">Русский</span>
               {language === 'ru' && <Check size={16} />}
            </button>
         </div>
      </div>
    </div>
  );
};

// --- User Profile Component (No Charts) ---
const UserProfile: React.FC<{
  currentUser: string,
  telegramUser: TelegramUser | null,
  phoneNumber: string | null,
  onSwitchUser: () => void,
  stores: StoreType[],
  currentStoreId: string,
  onSwitchStore: (id: string) => void,
  onCreateStore: () => void,
  currentStore: StoreType | undefined,
  onAddCollaborator: () => void,
  onViewAnalytics: () => void,
  onOpenSettings: () => void,
  collaborators: Collaborator[],
  onRemoveCollaborator: (id: string) => void,
  onVerifyStore: () => void,
  t: (key: string) => string;
}> = ({ currentUser, telegramUser, phoneNumber, onSwitchUser, stores, currentStoreId, onSwitchStore, onCreateStore, currentStore, onAddCollaborator, onViewAnalytics, onOpenSettings, collaborators, onRemoveCollaborator, onVerifyStore, t }) => {

  const handleRemoveCollaborator = async (userId: string) => {
    if (confirm("Оё мехоҳед ин ҳамкорро нест кунед?")) {
        onRemoveCollaborator(userId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
       {/* User Card */}
       <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white border-2 border-white/20 overflow-hidden">
               {telegramUser?.photo_url ? (
                  <img src={telegramUser.photo_url} alt={telegramUser.first_name} className="w-full h-full object-cover" />
               ) : (
                  <User size={32} />
               )}
             </div>
             <div>
               <h2 className="text-xl font-bold flex items-center gap-2">
                 {currentStore ? currentStore.name : currentUser}
               </h2>
               {phoneNumber ? (
                 <div className="flex items-center gap-1 mt-1 text-zinc-300 text-sm">
                    <Phone size={12} />
                    <span>+{phoneNumber}</span>
                 </div>
               ) : (
                 !telegramUser && <p className="text-xs text-zinc-400 mt-1">{t('guest_mode')}</p>
               )}
             </div>
           </div>
           {!telegramUser && (
             <button 
               onClick={onSwitchUser}
               className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
               title={t('switch_user')}
             >
               <LogOut size={20} />
             </button>
           )}
        </div>
        {/* Abstract Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
      </div>

      {/* Analytics Entry Button */}
      <button 
        onClick={onViewAnalytics}
        className="w-full bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
      >
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                 <PieChart size={20} />
             </div>
             <div className="text-left">
                 <h3 className="font-bold text-zinc-900 text-sm">{t('store_stats')}</h3>
                 <p className="text-xs text-zinc-500">{t('view_analytics')}</p>
             </div>
         </div>
         <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-500" />
      </button>

      {/* Settings Button */}
      <button 
        onClick={onOpenSettings}
        className="w-full bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
      >
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-lg flex items-center justify-center">
                 <Settings size={20} />
             </div>
             <div className="text-left">
                 <h3 className="font-bold text-zinc-900 text-sm">{t('settings')}</h3>
                 <p className="text-xs text-zinc-500">{t('language')}</p>
             </div>
         </div>
         <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-500" />
      </button>

      {/* Stores Management Section */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Briefcase size={16} className="text-zinc-500" />
             <h3 className="font-medium text-sm text-zinc-900">{t('my_stores')}</h3>
          </div>
          <button 
            onClick={onCreateStore}
            className="flex items-center gap-1 text-[10px] bg-zinc-900 text-white px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <Plus size={12} />
            {t('new_store')}
          </button>
        </div>
        <div className="p-2 space-y-2">
            {stores.map(store => (
                <button
                    key={store.id}
                    onClick={() => onSwitchStore(store.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                        store.id === currentStoreId 
                        ? 'bg-blue-50 border border-blue-100' 
                        : 'hover:bg-zinc-50 border border-transparent'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            store.id === currentStoreId ? 'bg-blue-200 text-blue-700' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                            <Store size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium ${
                                    store.id === currentStoreId ? 'text-blue-900' : 'text-zinc-900'
                                }`}>
                                    {store.name}
                                </p>
                                {!store.isOwner && (
                                    <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">
                                        {t('collaborator')}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-400">{formatDate(store.createdAt)}</p>
                        </div>
                    </div>
                    {store.id === currentStoreId && (
                        <Check size={16} className="text-blue-600" />
                    )}
                </button>
            ))}
        </div>
      </div>
    
      {/* Collaborators Section - Only visible to Owner */}
      {currentStore?.isOwner && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Users size={16} className="text-zinc-500" />
                 <h3 className="font-medium text-sm text-zinc-900">{t('collaborators')}</h3>
              </div>
              <button 
                onClick={onAddCollaborator}
                className="flex items-center gap-1 text-[10px] bg-white border border-zinc-200 text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-50 transition-colors"
              >
                <Plus size={12} />
                {t('add')}
              </button>
            </div>
            <div className="p-2 space-y-2">
                {collaborators.length === 0 ? (
                    <p className="text-center text-xs text-zinc-400 py-3">{t('no_collaborators')}</p>
                ) : (
                    collaborators.map(collab => (
                        <div key={collab.id} className="flex items-center justify-between p-3 bg-zinc-50/50 rounded-lg border border-zinc-100">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 overflow-hidden">
                                   {collab.photoUrl ? <img src={collab.photoUrl} className="w-full h-full object-cover"/> : <User size={14} />}
                               </div>
                               <div>
                                   <p className="text-sm font-medium text-zinc-900">{collab.firstName}</p>
                                   <div className="flex gap-1 mt-1">
                                       {collab.permissions.canAddDebt && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded">{t('perm_add_debt')}</span>}
                                       {collab.permissions.canAddPayment && <span className="text-[9px] bg-green-50 text-green-600 px-1 rounded">{t('perm_add_payment')}</span>}
                                       {collab.permissions.canDeleteDebtor && <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded">{t('perm_delete')}</span>}
                                   </div>
                               </div>
                           </div>
                           <button 
                            onClick={() => handleRemoveCollaborator(collab.userTelegramId)}
                            className="text-zinc-400 hover:text-red-500 p-2"
                           >
                               <X size={16} />
                           </button>
                        </div>
                    ))
                )}
            </div>
          </div>
      )}
    </div>
  );
}

// --- Analytics Dashboard Component ---
const AnalyticsDashboard: React.FC<{ 
  debtors: Debtor[],
  showCreator: boolean,
  t: (key: string) => string;
}> = ({ debtors, showCreator, t }) => {
  // ... (AnalyticsDashboard logic unchanged)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeListTab, setActiveListTab] = useState<'DEBT' | 'PAYMENT'>('DEBT');

  // Flatten all transactions from all debtors and include debtor name
  const allTransactions = useMemo(() => {
    return debtors.flatMap(d => (d.transactions || []).map(t => ({
      ...t,
      debtorName: d.name
    })));
  }, [debtors]);

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const tDate = new Date(t.date).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      return tDate >= start && tDate <= end;
    });
  }, [allTransactions, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.DEBT) {
        // Ensure amount is treated as number
        acc.debt += Number(t.amount);
      } else {
        acc.payment += Number(t.amount);
      }
      return acc;
    }, { debt: 0, payment: 0 });
  }, [filteredTransactions]);

  // Group by Month
  const monthlyStats = useMemo(() => {
    const stats: Record<string, { debt: number; payment: number; order: number }> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = date.toLocaleString('tg-TJ', { month: 'long', year: 'numeric' });
      const sortKey = date.getFullYear() * 100 + date.getMonth(); // For sorting
      
      if (!stats[key]) {
        stats[key] = { debt: 0, payment: 0, order: sortKey };
      }
      
      if (t.type === TransactionType.DEBT) {
        stats[key].debt += Number(t.amount);
      } else {
        stats[key].payment += Number(t.amount);
      }
    });

    return Object.entries(stats).sort(([, a], [, b]) => b.order - a.order);
  }, [filteredTransactions]);

  // Specific list for the bottom section
  const detailedList = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === (activeListTab === 'DEBT' ? TransactionType.DEBT : TransactionType.PAYMENT))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions, activeListTab]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-10">
      
      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-zinc-500 text-sm">
          <Filter size={16} />
          <span className="font-medium">{t('time_filter')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className="text-[10px] uppercase text-zinc-400 font-semibold pl-1">{t('date_from')}</label>
             <input 
               type="date" 
               className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
             />
          </div>
          <div>
             <label className="text-[10px] uppercase text-zinc-400 font-semibold pl-1">{t('date_to')}</label>
             <input 
               type="date" 
               className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
             />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 px-1">
        <BarChart3 size={20} />
        {t('results')}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ArrowUpRight size={16} />
            <span className="text-xs font-medium uppercase">{t('total_debts')}</span>
          </div>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totals.debt)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <ArrowDownLeft size={16} />
            <span className="text-xs font-medium uppercase">{t('total_payments')}</span>
          </div>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totals.payment)}</p>
        </div>
      </div>

      {/* Detailed Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-zinc-400" />
            <h3 className="font-medium text-sm text-zinc-900">{t('detailed_list')}</h3>
          </div>
        </div>
        
        {/* List Tabs */}
        <div className="flex border-b border-zinc-100">
          <button 
            onClick={() => setActiveListTab('DEBT')}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeListTab === 'DEBT' 
                ? 'border-red-500 text-red-600 bg-red-50/30' 
                : 'border-transparent text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            {t('debts_list')}
          </button>
          <button 
            onClick={() => setActiveListTab('PAYMENT')}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeListTab === 'PAYMENT' 
                ? 'border-green-500 text-green-600 bg-green-50/30' 
                : 'border-transparent text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            {t('payments_list')}
          </button>
        </div>

        {/* List Content */}
        {detailedList.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            {t('no_data_period')}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
            {detailedList.map((trx) => (
              <li key={trx.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                <div>
                  <p className="font-medium text-sm text-zinc-900">{trx.debtorName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(trx.date)}</p>
                  {trx.description && (
                    <p className="text-[10px] text-zinc-400 mt-1 italic">{trx.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-semibold text-sm ${
                    trx.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {trx.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(trx.amount)}
                  </span>
                  {showCreator && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                          <User size={10} className="text-zinc-300" />
                          <p className="text-[10px] text-zinc-300">{trx.createdBy}</p>
                      </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Monthly Breakdown Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
          <BarChart3 size={16} className="text-zinc-400" />
          <h3 className="font-medium text-sm text-zinc-900">{t('monthly_chart')}</h3>
        </div>
        
        {monthlyStats.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            {t('no_data_period')}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {monthlyStats.map(([month, data]) => (
              <div key={month} className="p-4">
                <p className="font-medium text-sm text-zinc-900 mb-3 capitalize">{month}</p>
                <div className="space-y-2">
                  {/* Debt Bar */}
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-zinc-500">{t('given')}</span>
                     <span className="font-medium text-red-600">{formatCurrency(data.debt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(data.debt / (data.debt + data.payment || 1)) * 100}%` }}></div>
                  </div>

                  {/* Payment Bar */}
                  <div className="flex items-center justify-between text-xs mt-1">
                     <span className="text-zinc-500">{t('received')}</span>
                     <span className="font-medium text-green-600">{formatCurrency(data.payment)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(data.payment / (data.debt + data.payment || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Current User Simulation & Telegram Logic
  const [currentUser, setCurrentUser] = useState('Соҳибкор (Меҳмон)');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isTelegramSession, setIsTelegramSession] = useState(true);
  
  // Phone Number Logic
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isConnectPhoneOpen, setIsConnectPhoneOpen] = useState(false);
  
  // Language State
  const [language, setLanguage] = useState<Language>('tg');

  // Store Logic
  const [stores, setStores] = useState<StoreType[]>([]);
  const [currentStoreId, setCurrentStoreIdState] = useState<string>('');
  
  // Collaborators List (Lifted up from UserProfile)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  
  // Selected Transaction for Detail Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>(TransactionType.DEBT);

  // Reminder Modal State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Computed Values
  const currentStore = useMemo(() => stores.find(s => s.id === currentStoreId), [stores, currentStoreId]);

  // Logic to show/hide "Created By" info
  const showCreatorInfo = useMemo(() => {
    if (!currentStore) return false;
    if (!currentStore.isOwner) return true; // Shared store
    return collaborators.length > 0; // Owned store, depends on collaborators
  }, [currentStore, collaborators]);

  // Modal States
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false);
  const [isEditDebtorOpen, setIsEditDebtorOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isAddCollabOpen, setIsAddCollabOpen] = useState(false);
  
  // Translation Helper
  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
  };

  const syncUserData = async (user: TelegramUser) => {
    const syncResult = await syncUser(user);
    
    if (syncResult.language) {
        setLanguage(syncResult.language);
    }
    
    setPhoneNumber(syncResult.phoneNumber);
    if (!syncResult.phoneNumber) {
        setIsConnectPhoneOpen(true);
    } else {
        setIsConnectPhoneOpen(false);
    }
    
    return syncResult.lastActiveStoreId;
  };

  // Initialize Telegram WebApp and Load Data
  useEffect(() => {
    const startApp = async () => {
        let lastStoreId: string | null = null;
        let preferredLang: Language = 'tg';

        // Check if running inside Telegram
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          if (!tg.initData) {
            setIsTelegramSession(false);
            setLoading(false);
            return;
          }

          tg.ready();
          tg.expand();
          
          try {
             tg.setHeaderColor('#ffffff');
          } catch (e) {
            console.warn('Cannot set header color');
          }

          // Get User Data from Telegram
          if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            setTelegramUser(user);
            
            if (user.id) {
                setTelegramId(user.id.toString());
                // SYNC USER TO DB & GET PREFERENCES
                lastStoreId = await syncUserData(user);
            }

            const displayName = user.first_name + (user.last_name ? ` ${user.last_name[0]}.` : '');
            setCurrentUser(displayName);
          }
        } else {
             setIsTelegramSession(false);
             setLoading(false);
             return;
        }

        // Initial Load
        await initApp(lastStoreId);
    };

    startApp();
  }, []);

  // Handle Telegram Back Button Integration
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
        if (view === 'ANALYTICS') setView('PROFILE');
        else if (view === 'SETTINGS') setView('PROFILE');
        else if (view === 'VERIFICATION') setView('PROFILE');
        else if (view === 'PROFILE') setView('DASHBOARD');
        else setView('DASHBOARD'); // For DEBTOR_DETAIL
    };

    if (view !== 'DASHBOARD') {
        tg.BackButton.show();
        tg.BackButton.onClick(handleBack);
    } else {
        tg.BackButton.hide();
    }

    return () => {
        tg.BackButton.offClick(handleBack);
    };
  }, [view]);

  const initApp = async (preferredStoreId: string | null) => {
      setLoading(true);
      
      // 1. Fetch Stores first
      const loadedStores = await getStores();
      setStores(loadedStores);

      if (loadedStores.length > 0) {
          // If preference exists and is valid, use it. Otherwise, use first store.
          let targetStoreId = loadedStores[0].id;
          if (preferredStoreId && loadedStores.some(s => s.id === preferredStoreId)) {
              targetStoreId = preferredStoreId;
          }

          handleSwitchStore(targetStoreId, false); // false = don't save again, we just loaded it
      } else {
          setLoading(false);
      }
  };

  const handleSwitchStore = async (storeId: string, shouldSave = true) => {
      setCurrentStoreIdState(storeId);
      setStoreId(storeId); // Update service
      
      if (shouldSave) {
          saveLastActiveStore(storeId);
      }
      
      // Find the store object to check ownership
      const selectedStore = stores.find(s => s.id === storeId);
      
      // If owner, fetch collaborators to update state for "showCreatorInfo" logic
      if (selectedStore?.isOwner) {
          try {
             const collabs = await getCollaborators(storeId);
             setCollaborators(collabs);
          } catch (e) {
             console.error("Failed to fetch collaborators", e);
             setCollaborators([]);
          }
      } else {
          setCollaborators([]); 
      }

      // Fetch data for this store
      setLoading(true);
      const data = await getDebtors();
      setDebtors(data);
      setLoading(false);
  };

  const handleCreateStore = async (name: string) => {
      const newStore = await createStore(name);
      if (newStore) {
          setStores(prev => [...prev, newStore]);
          handleSwitchStore(newStore.id); // Switch to new store
          setView('PROFILE'); // Stay on profile
      }
  };

  const handleAddCollaborator = async (userId: string, permissions: CollaboratorPermissions) => {
    await addCollaborator(currentStoreId, userId, permissions);
    // Refresh collaborator list
    const collabs = await getCollaborators(currentStoreId);
    setCollaborators(collabs);
  };

  const handleRemoveCollaborator = async (userId: string) => {
     await removeCollaborator(currentStoreId, userId);
     setCollaborators(prev => prev.filter(c => c.userTelegramId !== userId));
  };

  const handleVerificationSubmit = async (docType: string, imageBase64: string, customStoreName: string) => {
     await submitVerificationRequest(currentStoreId, docType, imageBase64, customStoreName);
     
     // Refresh stores to update verification status (PENDING)
     const updatedStores = await getStores();
     setStores(updatedStores);
  };

  const fetchData = async () => {
    setLoading(true);
    const data = await getDebtors();
    setDebtors(data);
    setLoading(false);
  };

  // Computed Values
  const currentStoreName = currentStore?.name;
  const totalReceivable = useMemo(() => debtors.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0), [debtors]);

  const filteredDebtors = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return debtors.filter(d => 
      d.name.toLowerCase().includes(lowerSearch) || 
      d.phone.includes(lowerSearch)
    );
  }, [debtors, searchTerm]);

  const selectedDebtor = useMemo(() => 
    debtors.find(d => d.id === selectedDebtorId), 
  [debtors, selectedDebtorId]);

  // Handlers
  const handleSwitchUser = () => {
    // If Telegram user exists, prevent switching in this demo logic or allow switching to a "Guest" mode
    if (telegramUser) return;
    setCurrentUser(prev => prev.includes('Соҳибкор') ? 'Фурӯшанда' : 'Соҳибкор');
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const handleCheckPhoneAgain = async () => {
      if (telegramUser) {
          await syncUserData(telegramUser);
      }
  };

  const handleAddDebtor = async (name: string, phone: string) => {
    // Generate Creator Name: Use full Telegram name + username if available
    let creatorName = currentUser;
    if (telegramUser) {
        const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
        if (telegramUser.username) {
            creatorName = `${fullName} (@${telegramUser.username})`;
        } else {
            creatorName = fullName;
        }
    }

    const newDebtor: Debtor = {
      id: Date.now().toString(),
      name,
      phone,
      balance: 0,
      lastActivity: new Date().toISOString(),
      transactions: [],
      createdBy: creatorName
    };
    await saveDebtor(newDebtor);
    await fetchData(); // Refresh list
  };

  const handleEditDebtor = async (name: string, phone: string) => {
      if (!selectedDebtorId) return;
      await updateDebtor(selectedDebtorId, name, phone);
      await fetchData();
  };

  const handleAddTransaction = async (amount: number, type: TransactionType, description: string) => {
    if (!selectedDebtorId) return;

    // Permissions check UI side (Backend also checks)
    if (currentStore && !currentStore.isOwner) {
        if (type === TransactionType.DEBT && !currentStore.permissions?.canAddDebt) {
            alert('Шумо ҳуқуқи иловаи қарзро надоред.');
            return;
        }
        if (type === TransactionType.PAYMENT && !currentStore.permissions?.canAddPayment) {
            alert('Шумо ҳуқуқи иловаи пардохтро надоред.');
            return;
        }
    }

    // Generate Creator Name: Use full Telegram name + username if available
    let creatorName = currentUser;
    if (telegramUser) {
        const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
        if (telegramUser.username) {
            creatorName = `${fullName} (@${telegramUser.username})`;
        } else {
            creatorName = fullName;
        }
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      type,
      description,
      date: new Date().toISOString(),
      createdBy: creatorName
    };

    await updateDebtorTransaction(selectedDebtorId, newTransaction);
    await fetchData(); // Refresh list
  };

  const handleDeleteDebtor = async () => {
    if (!selectedDebtorId) return;

    if (currentStore && !currentStore.isOwner && !currentStore.permissions?.canDeleteDebtor) {
        alert('Шумо ҳуқуқи нест кардани мизоҷро надоред.');
        return;
    }

    if (window.confirm("Шумо мутмаин ҳастед, ки мехоҳед ин мизоҷро пурра нест кунед? Ин амал барқарорнашаванда аст.")) {
      await deleteDebtor(selectedDebtorId);
      await fetchData();
      setView('DASHBOARD');
      setSelectedDebtorId(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    // Note: Transaction deletion permissions are implicit based on Debt/Payment permissions usually, 
    // or strictly reserved for admins. For now, we apply general logic.
    if (currentStore && !currentStore.isOwner && !currentStore.permissions?.canDeleteDebtor) { 
        // Using delete debtor permission as "high level" delete permission
        alert('Шумо ҳуқуқи нест кардани амалиётҳоро надоред.');
        return;
    }
    // Logic moved to Modal for explicit confirmation button there, but kept here for direct calls if any.
    await deleteTransaction(transactionId);
    await fetchData();
    setSelectedTransaction(null); // Close modal if open
  };

  const navigateToDetail = (id: string) => {
    setSelectedDebtorId(id);
    setView('DEBTOR_DETAIL');
    window.scrollTo(0, 0);
  };

  const sendReminder = () => {
    setIsReminderOpen(true);
  };

  const confirmSendSms = async () => {
      if (!selectedDebtorId) return;
      setIsSendingSms(true);
      try {
          await sendSmsReminder(selectedDebtorId);
          alert(t('sms_sent_success'));
          setIsReminderOpen(false);
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setIsSendingSms(false);
      }
  };

  // RESTRICT ACCESS IF NOT TELEGRAM
  if (!isTelegramSession) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-zinc-50 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-zinc-900/10">
                <span className="text-white font-bold text-3xl">Д</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mb-3">
                Барнома танҳо дар телеграм дастрас аст
            </h1>
            <p className="text-zinc-500 mb-6 text-sm">
                Лутфан тариқи боти мо ворид шавед:
            </p>
            <a 
                href="https://t.me/daftartjbot" 
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
                @daftartjbot
            </a>
        </div>
    );
  }

  if (loading && view === 'DASHBOARD' && debtors.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
        <p className="text-zinc-400 text-sm">{t('loading_store')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Header 
        view={view} 
        title={selectedDebtor?.name}
        onProfileClick={() => setView('PROFILE')}
        currentUser={currentUser}
        telegramPhoto={telegramUser?.photo_url}
        currentStoreName={currentStoreName}
        onEditDebtor={() => setIsEditDebtorOpen(true)}
        onDeleteDebtor={handleDeleteDebtor}
        t={t}
      />

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <main className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in duration-300">
          
          {/* Stats Card */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/60">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">{t('total_amount')}</p>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">{formatCurrency(totalReceivable)}</h2>
          </section>

          {/* Search & List */}
          <section className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-3.5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden min-h-[300px]">
              {filteredDebtors.length === 0 ? (
                 <EmptyState message={searchTerm ? t('nothing_found') : t('list_empty')} />
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {filteredDebtors.map(debtor => (
                    <li 
                      key={debtor.id} 
                      onClick={() => navigateToDetail(debtor.id)}
                      className="p-4 hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">{debtor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <History size={12} className="text-zinc-400" />
                          <span className="text-xs text-zinc-400">{formatDate(debtor.lastActivity)}</span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`font-semibold ${debtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                          {formatCurrency(debtor.balance)}
                        </span>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <button 
            onClick={() => setIsAddDebtorOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg shadow-zinc-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </main>
      )}

      {/* USER PROFILE VIEW (Stores & Collaborators) */}
      {view === 'PROFILE' && (
        <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
           <UserProfile 
              currentUser={currentUser}
              telegramUser={telegramUser} 
              phoneNumber={phoneNumber}
              onSwitchUser={handleSwitchUser} 
              stores={stores}
              currentStoreId={currentStoreId}
              onSwitchStore={handleSwitchStore}
              onCreateStore={() => setIsAddStoreOpen(true)}
              currentStore={currentStore}
              onAddCollaborator={() => setIsAddCollabOpen(true)}
              onViewAnalytics={() => setView('ANALYTICS')}
              onOpenSettings={() => setView('SETTINGS')}
              collaborators={collaborators}
              onRemoveCollaborator={handleRemoveCollaborator}
              onVerifyStore={() => setView('VERIFICATION')}
              t={t}
           />
        </main>
      )}

      {/* SETTINGS VIEW */}
      {view === 'SETTINGS' && (
         <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
            <SettingsView language={language} onLanguageChange={handleLanguageChange} t={t} />
         </main>
      )}

      {/* ANALYTICS DASHBOARD VIEW */}
      {view === 'ANALYTICS' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <AnalyticsDashboard debtors={debtors} showCreator={showCreatorInfo} t={t} />
          </main>
      )}

      {/* VERIFICATION VIEW */}
      {view === 'VERIFICATION' && (
         <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
             <VerificationView 
                onSubmit={handleVerificationSubmit}
                initialStoreName={currentStoreName || ''}
                t={t}
                onBack={() => setView('PROFILE')}
                currentStatus={currentStore?.verificationStatus || 'NONE'}
             />
         </main>
      )}

      {/* DETAIL VIEW */}
      {view === 'DEBTOR_DETAIL' && selectedDebtor && (
        <main className="max-w-md mx-auto p-4 space-y-6 animate-in slide-in-from-right duration-300">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-zinc-100 rounded-full mx-auto flex items-center justify-center mb-4 text-zinc-300">
              <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{selectedDebtor.name}</h2>
            <p className="text-zinc-500 text-sm mb-6">{selectedDebtor.phone}</p>
            
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase mb-1">{t('current_debt')}</p>
              <p className={`text-2xl font-bold ${selectedDebtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                {formatCurrency(selectedDebtor.balance)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
               <button 
                onClick={sendReminder}
                className="flex flex-1 items-center justify-center gap-2 py-2.5 px-4 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 active:scale-95 transition-all"
              >
                 <MessageCircle size={16} />
                 {t('reminder')}
               </button>
               <button 
                 onClick={() => window.open(`tel:${selectedDebtor.phone}`)}
                 className="flex items-center justify-center w-12 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 active:scale-95 transition-all"
               >
                 <PhoneCall size={18} />
               </button>
            </div>

            {/* CREATED BY INFO */}
            {showCreatorInfo && (
                <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-center gap-2 text-zinc-400">
                    <span className="text-[10px] uppercase tracking-wider">{t('created_by')}</span>
                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                        <UserCircle2 size={12} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600">{selectedDebtor.createdBy}</span>
                    </div>
                </div>
            )}
          </div>

          {/* Actions (Two large buttons) */}
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => {
                   setTransactionModalType(TransactionType.DEBT);
                   setIsTransactionOpen(true);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
             >
                <ArrowUpRight size={24} />
                {t('i_gave_debt')}
             </button>
             
             <button 
                onClick={() => {
                    setTransactionModalType(TransactionType.PAYMENT);
                    setIsTransactionOpen(true);
                }}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
             >
                <ArrowDownLeft size={24} />
                {t('i_received_money')}
             </button>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
              <Calendar size={16} className="text-zinc-400" />
              <h3 className="font-medium text-sm text-zinc-900">{t('transaction_history')}</h3>
            </div>
            
            {(selectedDebtor.transactions || []).length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                {t('no_transactions')}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {(selectedDebtor.transactions || []).map((trx) => (
                  <li 
                      key={trx.id} 
                      onClick={() => setSelectedTransaction(trx)}
                      className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            trx.type === TransactionType.DEBT 
                              ? 'bg-red-50 text-red-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {trx.type === TransactionType.DEBT ? t('debt') : t('payment')}
                          </span>
                          <span className="text-xs text-zinc-400">{formatDate(trx.date)}</span>
                      </div>
                      {trx.description && (
                        <p className="text-sm text-zinc-600 mb-1">{trx.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${
                        trx.type === TransactionType.DEBT ? 'text-zinc-900' : 'text-green-600'
                      }`}>
                        {trx.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(trx.amount)}
                      </span>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </main>
      )}

      {/* Reminder / SMS Modal */}
      {isReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsReminderOpen(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm text-center animate-in fade-in zoom-in duration-200 shadow-xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
                 {currentStore?.isVerified ? (
                     // State 1: Verified (Allow SMS)
                     <>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Send size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-900 mb-2">{t('sms_reminder_title')}</h3>
                        <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">{t('sms_send_confirm')}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsReminderOpen(false)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors">
                                {t('back')}
                            </button>
                            <button 
                                onClick={confirmSendSms} 
                                disabled={isSendingSms}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isSendingSms && <Loader2 size={16} className="animate-spin" />}
                                {t('send_sms_btn')}
                            </button>
                        </div>
                     </>
                 ) : (
                     // State 2: Not Verified (Prompt)
                     <>
                        <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-900 mb-2">{t('sms_verification_required_title')}</h3>
                        <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">{t('sms_verification_required_desc')}</p>
                        <button 
                            onClick={() => {
                                setIsReminderOpen(false);
                                setView('VERIFICATION');
                            }} 
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-colors"
                        >
                            {t('go_to_verify')}
                        </button>
                     </>
                 )}
            </div>
        </div>
      )}

      {/* MODALS */}
      <AddDebtorModal 
        isOpen={isAddDebtorOpen}
        onClose={() => setIsAddDebtorOpen(false)}
        onSubmit={handleAddDebtor}
      />

      <EditDebtorModal 
        isOpen={isEditDebtorOpen}
        onClose={() => setIsEditDebtorOpen(false)}
        onSubmit={handleEditDebtor}
        initialName={selectedDebtor?.name || ''}
        initialPhone={selectedDebtor?.phone || ''}
      />
      
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleAddTransaction}
        debtorName={selectedDebtor?.name || ''}
        initialType={transactionModalType}
      />

      <AddStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        onSubmit={handleCreateStore}
      />

      <AddCollaboratorModal
        isOpen={isAddCollabOpen}
        onClose={() => setIsAddCollabOpen(false)}
        onSubmit={handleAddCollaborator}
      />

      <TransactionDetailsModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)}
          onDelete={handleDeleteTransaction}
          showCreator={showCreatorInfo}
          t={t}
      />
      
      <ConnectPhoneModal 
          isOpen={isConnectPhoneOpen}
          botUsername="daftartjbot" // Make sure this matches your bot's username
          onCheckAgain={handleCheckPhoneAgain}
          t={t}
      />

    </div>
  );
}

export default App;