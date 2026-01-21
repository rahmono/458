import React, { useState, useEffect } from 'react';
import { X, Search, User, Shield, Check, Phone } from 'lucide-react';
import { UserSearchResult, CollaboratorPermissions } from '../types';
import { searchUsers } from '../services/storage';

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userTelegramId: string, permissions: CollaboratorPermissions) => void;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({
    canDeleteDebtor: false,
    canAddDebt: true,
    canAddPayment: true
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      setPermissions({ canDeleteDebtor: false, canAddDebt: true, canAddPayment: true });
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setSearching(true);
        const users = await searchUsers(query);
        setResults(users);
        setSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onSubmit(selectedUser.telegramId, permissions);
      onClose();
    }
  };

  const togglePermission = (key: keyof CollaboratorPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in slide-in-from-bottom duration-300">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-medium text-zinc-900">Иловаи ҳамкор</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Search Section */}
          {!selectedUser ? (
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-500">Ҷустуҷӯ (Бо рақами телефон)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-zinc-400" size={16} />
                <input
                  type="tel"
                  placeholder="Рақами телефон..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="min-h-[150px] max-h-[200px] overflow-y-auto space-y-1">
                {searching ? (
                   <p className="text-center text-xs text-zinc-400 py-4">Ҷустуҷӯ...</p>
                ) : results.length > 0 ? (
                  results.map(user => (
                    <div 
                      key={user.telegramId}
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center text-zinc-500 shrink-0">
                        {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover"/> : <User size={14}/>}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-zinc-900 truncate">{user.firstName}</p>
                        {user.username && <p className="text-xs text-zinc-400 truncate">@{user.username}</p>}
                      </div>
                    </div>
                  ))
                ) : query.length >= 2 ? (
                   <p className="text-center text-xs text-zinc-400 py-4">Ҳеҷ кас ёфт нашуд. Боварӣ ҳосил кунед, ки ҳамкор ботро START кардааст.</p>
                ) : null}
              </div>
            </div>
          ) : (
            // Selected User & Permissions
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 overflow-hidden flex items-center justify-center text-zinc-500">
                        {selectedUser.photoUrl ? <img src={selectedUser.photoUrl} className="w-full h-full object-cover"/> : <User size={18}/>}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-900">{selectedUser.firstName}</p>
                        <p className="text-xs text-zinc-500">Ҳамкори интихобшуда</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedUser(null)} className="text-xs text-red-600 font-medium">Иваз</button>
               </div>

               <div className="space-y-2">
                 <p className="text-xs font-medium text-zinc-500 uppercase">Ҳуқуқҳои дастрасӣ</p>
                 
                 <label className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-zinc-400" />
                        <span className="text-sm text-zinc-700">Иловаи қарз</span>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${permissions.canAddDebt ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}>
                        {permissions.canAddDebt && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={permissions.canAddDebt} onChange={() => togglePermission('canAddDebt')} />
                 </label>

                 <label className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-zinc-400" />
                        <span className="text-sm text-zinc-700">Иловаи пардохт</span>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${permissions.canAddPayment ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}>
                        {permissions.canAddPayment && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={permissions.canAddPayment} onChange={() => togglePermission('canAddPayment')} />
                 </label>

                 <label className="flex items-center justify-between p-3 border border-red-100 bg-red-50/50 rounded-lg cursor-pointer hover:bg-red-50">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-red-400" />
                        <span className="text-sm text-red-700">Нест кардани мизоҷ/амалиёт</span>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${permissions.canDeleteDebtor ? 'bg-red-600 border-red-600' : 'border-red-300'}`}>
                        {permissions.canDeleteDebtor && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={permissions.canDeleteDebtor} onChange={() => togglePermission('canDeleteDebtor')} />
                 </label>
               </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedUser}
            className={`w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all active:scale-[0.98] ${
              !selectedUser ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Тасдиқ ва илова
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCollaboratorModal;