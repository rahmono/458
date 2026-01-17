import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, User, Phone } from 'lucide-react';
import { BLACKLIST_NUMBERS } from '../constants';

interface AddDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
}

const AddDebtorModal: React.FC<AddDebtorModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhone('');
      setIsBlacklisted(false);
    }
  }, [isOpen]);

  // Cross-check simulation logic
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 9 && BLACKLIST_NUMBERS.includes(cleanPhone)) {
      setIsBlacklisted(true);
    } else {
      setIsBlacklisted(false);
    }
  }, [phone]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    onSubmit(name, phone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in slide-in-from-bottom duration-300 sm:duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-medium text-zinc-900">Иловаи мизоҷи нав</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Ному насаб"
                autoFocus
                className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900 transition-colors placeholder-zinc-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={18} className="text-zinc-400" />
              </div>
              <input
                type="tel"
                placeholder="Рақами телефон (900...)"
                className={`w-full pl-10 pr-3 py-3 bg-white border rounded-lg text-sm outline-none transition-colors placeholder-zinc-400 ${
                  isBlacklisted ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'
                }`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {isBlacklisted && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs items-start animate-in fade-in">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p>Диққат: Ин мизоҷ дар мағозаҳои дигар қарздор аст (Симулятсия).</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!name || !phone}
            className={`w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all active:scale-[0.98] ${
              !name || !phone ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Илова кардан
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDebtorModal;