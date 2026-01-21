import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { TransactionType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: TransactionType, description: string) => void;
  debtorName: string;
  initialType?: TransactionType;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSubmit, debtorName, initialType = TransactionType.DEBT }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setAmount('');
      setDescription('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSubmit(parseFloat(amount), activeTab, description);
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-medium text-zinc-900">Сабти амалиёт</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-50 m-4 rounded-lg">
          <button
            onClick={() => setActiveTab(TransactionType.DEBT)}
            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === TransactionType.DEBT
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <ArrowUpRight size={16} />
            Қарз додам
          </button>
          <button
            onClick={() => setActiveTab(TransactionType.PAYMENT)}
            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === TransactionType.PAYMENT
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <ArrowDownLeft size={16} />
            Пул гирифтам
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          <div className="text-center mb-6">
             <p className="text-xs text-zinc-400 mb-1">{activeTab === TransactionType.DEBT ? 'Ба' : 'Аз'} {debtorName}</p>
             <div className="relative inline-block">
               <input
                type="number"
                step="0.01"
                placeholder="0"
                autoFocus
                className="text-4xl font-semibold text-center w-full bg-transparent border-none outline-none placeholder-zinc-200 text-zinc-900"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="text-sm text-zinc-400 absolute top-2 -right-8">TJS</span>
             </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Тавсиф (Ихтиёрӣ)</label>
            <input
              type="text"
              placeholder={activeTab === TransactionType.DEBT ? "Масалан: Нон, Шакар" : "Масалан: Қисман пардохт"}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-400 focus:ring-0 transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!amount}
            className={`w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all active:scale-[0.98] ${
              !amount ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Тасдиқ кардан
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;