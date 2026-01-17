import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  MoreVertical,
  MessageCircle,
  PhoneCall,
  History,
  Share,
  CheckCircle2,
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Store,
  ListFilter,
  Loader2
} from 'lucide-react';
import { Debtor, Transaction, TransactionType, ViewState } from './types';
import { getDebtors, saveDebtor, updateDebtorTransaction, formatCurrency, formatDate } from './services/storage';
import TransactionModal from './components/TransactionModal';
import AddDebtorModal from './components/AddDebtorModal';

// --- Sub Components ---

const Header: React.FC<{ 
  view: ViewState; 
  onBack: () => void; 
  title?: string; 
  onShare?: () => void;
  onProfileClick?: () => void;
  currentUser?: string;
}> = ({ view, onBack, title, onShare, onProfileClick, currentUser }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 h-16 px-4 flex items-center justify-between">
    {view === 'DASHBOARD' ? (
      <>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
             <span className="text-white font-bold text-lg">D</span>
           </div>
           <h1 className="text-xl font-bold tracking-tight text-zinc-900">Daftar</h1>
        </div>
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100 py-1.5 px-3 rounded-full transition-colors border border-zinc-100"
        >
          <span className="text-xs font-medium text-zinc-600 hidden sm:block">{currentUser}</span>
          <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500">
             <User size={16} />
          </div>
        </button>
      </>
    ) : view === 'STORE_ANALYTICS' ? (
      <>
         <button onClick={onBack} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Бозгашт</span>
        </button>
        <h1 className="text-sm font-semibold text-zinc-900">Профили Соҳибкор</h1>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </>
    ) : (
      <>
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Бозгашт</span>
        </button>
        <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-[150px]">{title}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={onShare}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Share size={20} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </>
    )}
  </header>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Search size={24} className="text-zinc-300" />
    </div>
    <p className="text-zinc-400 text-sm">{message}</p>
  </div>
);

// --- Store Analytics Component ---
const StoreAnalytics: React.FC<{ 
  debtors: Debtor[], 
  currentUser: string,
  onSwitchUser: () => void 
}> = ({ debtors, currentUser, onSwitchUser }) => {
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* User Card */}
      <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10">
               <User size={24} />
             </div>
             <div>
               <p className="text-zinc-400 text-xs uppercase tracking-wider">Ҳолати корбар</p>
               <h2 className="text-xl font-bold">{currentUser}</h2>
             </div>
           </div>
           <button 
             onClick={onSwitchUser}
             className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
             title="Иваз кардани корбар"
           >
             <LogOut size={20} />
           </button>
        </div>
        {/* Abstract Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-zinc-500 text-sm">
          <Filter size={16} />
          <span className="font-medium">Филтр аз рӯи вақт</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className="text-[10px] uppercase text-zinc-400 font-semibold pl-1">Аз санаи</label>
             <input 
               type="date" 
               className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
             />
          </div>
          <div>
             <label className="text-[10px] uppercase text-zinc-400 font-semibold pl-1">То санаи</label>
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
        <Store size={20} />
        Аналитикаи умумии мағоза
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ArrowUpRight size={16} />
            <span className="text-xs font-medium uppercase">Ҷамъи қарзҳо</span>
          </div>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totals.debt)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <ArrowDownLeft size={16} />
            <span className="text-xs font-medium uppercase">Ҷамъи пардохтҳо</span>
          </div>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totals.payment)}</p>
        </div>
      </div>

      {/* Detailed Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-zinc-400" />
            <h3 className="font-medium text-sm text-zinc-900">Рӯйхати муфассал</h3>
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
            Қарзҳо (Киҳо гирифтанд?)
          </button>
          <button 
            onClick={() => setActiveListTab('PAYMENT')}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeListTab === 'PAYMENT' 
                ? 'border-green-500 text-green-600 bg-green-50/30' 
                : 'border-transparent text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            Пардохтҳо (Киҳо супориданд?)
          </button>
        </div>

        {/* List Content */}
        {detailedList.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Дар ин давра {activeListTab === 'DEBT' ? 'қарз' : 'пардохт'} нест
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
            {detailedList.map((t) => (
              <li key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                <div>
                  <p className="font-medium text-sm text-zinc-900">{t.debtorName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(t.date)}</p>
                  {t.description && (
                    <p className="text-[10px] text-zinc-400 mt-1 italic">{t.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-semibold text-sm ${
                    t.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {t.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(t.amount)}
                  </span>
                  <p className="text-[10px] text-zinc-300 mt-1">Сабт: {t.createdBy}</p>
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
          <h3 className="font-medium text-sm text-zinc-900">Графикаи моҳона</h3>
        </div>
        
        {monthlyStats.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Дар ин давра маълумот нест
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {monthlyStats.map(([month, data]) => (
              <div key={month} className="p-4">
                <p className="font-medium text-sm text-zinc-900 mb-3 capitalize">{month}</p>
                <div className="space-y-2">
                  {/* Debt Bar */}
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-zinc-500">Қарз дода шуд</span>
                     <span className="font-medium text-red-600">{formatCurrency(data.debt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(data.debt / (data.debt + data.payment || 1)) * 100}%` }}></div>
                  </div>

                  {/* Payment Bar */}
                  <div className="flex items-center justify-between text-xs mt-1">
                     <span className="text-zinc-500">Пардохт шуд</span>
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
  
  // Current User Simulation
  const [currentUser, setCurrentUser] = useState('Соҳибкор');
  
  // Modal States
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getDebtors();
    setDebtors(data);
    setLoading(false);
  };

  // Computed Values
  const totalReceivable = useMemo(() => debtors.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0), [debtors]);
  const totalOverdue = useMemo(() => debtors.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0) * 0.3, [debtors]);

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
    setCurrentUser(prev => prev === 'Соҳибкор' ? 'Фурӯшанда' : 'Соҳибкор');
  };

  const handleAddDebtor = async (name: string, phone: string) => {
    const newDebtor: Debtor = {
      id: Date.now().toString(),
      name,
      phone,
      balance: 0,
      lastActivity: new Date().toISOString(),
      transactions: [],
      createdBy: currentUser
    };
    await saveDebtor(newDebtor);
    await fetchData(); // Refresh list
  };

  const handleAddTransaction = async (amount: number, type: TransactionType, description: string) => {
    if (!selectedDebtorId) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      type,
      description,
      date: new Date().toISOString(),
      createdBy: currentUser
    };

    await updateDebtorTransaction(selectedDebtorId, newTransaction);
    await fetchData(); // Refresh list
  };

  const navigateToDetail = (id: string) => {
    setSelectedDebtorId(id);
    setView('DEBTOR_DETAIL');
    window.scrollTo(0, 0);
  };

  const sendReminder = (phone: string, balance: number) => {
    const text = `Салом! Лутфан қарзи худро ба маблағи ${formatCurrency(balance)} пардохт кунед. Ташаккур!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareProfile = () => {
    if (!selectedDebtor) return;
    const uniqueToken = Math.random().toString(36).substring(7);
    const link = `https://daftar.tj/share/view/${selectedDebtor.id}?t=${uniqueToken}`;
    const text = `Салом! Истиноди якдафъина барои дидани ҳисоби Шумо: ${link}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  if (loading && view === 'DASHBOARD' && debtors.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
        <p className="text-zinc-400 text-sm">Боргирии маълумот...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Header 
        view={view} 
        onBack={() => setView('DASHBOARD')} 
        title={selectedDebtor?.name}
        onShare={handleShareProfile}
        onProfileClick={() => setView('STORE_ANALYTICS')}
        currentUser={currentUser}
      />

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <main className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in duration-300">
          
          {/* Stats Card */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/60">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">Маблағи умумӣ дар дафтар</p>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">{formatCurrency(totalReceivable)}</h2>
            
            <div className="flex mt-6 pt-6 border-t border-zinc-100 gap-8">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Боқимонда</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalReceivable)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Таъхиршуда</p>
                <p className="font-semibold text-red-600">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </section>

          {/* Search & List */}
          <section className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-3.5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Ҷустуҷӯ (ном ё телефон)..."
                className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden min-h-[300px]">
              {filteredDebtors.length === 0 ? (
                 <EmptyState message={searchTerm ? "Ҳеҷ чиз ёфт нашуд" : "Рӯйхат холи аст"} />
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

      {/* STORE ANALYTICS VIEW */}
      {view === 'STORE_ANALYTICS' && (
        <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
           <StoreAnalytics 
              debtors={debtors} 
              currentUser={currentUser} 
              onSwitchUser={handleSwitchUser} 
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
              <p className="text-xs text-zinc-400 uppercase mb-1">Қарзи ҷорӣ</p>
              <p className={`text-2xl font-bold ${selectedDebtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                {formatCurrency(selectedDebtor.balance)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
               <button 
                onClick={() => sendReminder(selectedDebtor.phone, selectedDebtor.balance)}
                className="flex flex-1 items-center justify-center gap-2 py-2.5 px-4 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 active:scale-95 transition-all"
              >
                 <MessageCircle size={16} />
                 Ёдраскунӣ
               </button>
               <button 
                 onClick={() => window.open(`tel:${selectedDebtor.phone}`)}
                 className="flex items-center justify-center w-12 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 active:scale-95 transition-all"
               >
                 <PhoneCall size={18} />
               </button>
            </div>
            <p className="text-[10px] text-zinc-300 mt-4 uppercase tracking-widest">
              Илова карда шуд: {selectedDebtor.createdBy}
            </p>
          </div>

          {/* Actions */}
          <button 
            onClick={() => setIsTransactionOpen(true)}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-medium shadow-md shadow-zinc-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Сабти амалиёт
          </button>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
              <Calendar size={16} className="text-zinc-400" />
              <h3 className="font-medium text-sm text-zinc-900">Таърихи амалиётҳо</h3>
            </div>
            
            {(selectedDebtor.transactions || []).length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                Ҳанӯз ягон амалиёт нест
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {(selectedDebtor.transactions || []).map((t) => (
                  <li key={t.id} className="p-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            t.type === TransactionType.DEBT 
                              ? 'bg-red-50 text-red-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {t.type === TransactionType.DEBT ? 'Қарз' : 'Пардохт'}
                          </span>
                          <span className="text-xs text-zinc-400">{formatDate(t.date)}</span>
                      </div>
                      {t.description && (
                        <p className="text-sm text-zinc-600 mb-1">{t.description}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Сабт: {t.createdBy}
                      </p>
                    </div>
                    <span className={`font-medium ${
                      t.type === TransactionType.DEBT ? 'text-zinc-900' : 'text-green-600'
                    }`}>
                      {t.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </main>
      )}

      {/* MODALS */}
      <AddDebtorModal 
        isOpen={isAddDebtorOpen}
        onClose={() => setIsAddDebtorOpen(false)}
        onSubmit={handleAddDebtor}
      />
      
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleAddTransaction}
        debtorName={selectedDebtor?.name || ''}
      />

    </div>
  );
}

export default App;