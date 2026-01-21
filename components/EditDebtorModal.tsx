import React, { useState, useEffect } from 'react';
import { X, User, Phone } from 'lucide-react';

interface EditDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
  initialName: string;
  initialPhone: string;
}

const EditDebtorModal: React.FC<EditDebtorModalProps> = ({ isOpen, onClose, onSubmit, initialName, initialPhone }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPhone(initialPhone);
    }
  }, [isOpen, initialName, initialPhone]);

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
          <h3 className="font-medium text-zinc-900">Таҳрири мизоҷ</h3>
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
                placeholder="Рақами телефон"
                className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900 transition-colors placeholder-zinc-400"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || !phone}
            className={`w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all active:scale-[0.98] ${
              !name || !phone ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Сабт кардан
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDebtorModal;