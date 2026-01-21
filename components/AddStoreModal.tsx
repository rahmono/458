import React, { useState } from 'react';
import { X, Store as StoreIcon } from 'lucide-react';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const AddStoreModal: React.FC<AddStoreModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit(name);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-medium text-zinc-900">Мағозаи нав</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Номи мағоза</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <StoreIcon size={18} className="text-zinc-400" />
                </div>
                <input
                type="text"
                placeholder="Масалан: Мағозаи марказӣ"
                autoFocus
                className="w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name}
            className={`w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all active:scale-[0.98] ${
              !name ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Сохтан
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStoreModal;