import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Eye, User, Store, Calendar, LogOut, Users, Search, ChevronLeft, ChevronRight, Menu, ArrowRight, ArrowLeft, History } from 'lucide-react';
import { VerificationRequest, AdminUser, Store as StoreType, Debtor } from './types';
import { formatCurrency, formatDate } from './services/storage'; // Reusing existing helper

// API endpoints helper
const API_URL = '/api';

const AdminApp: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'verifications' | 'users'>('verifications');
  const [loading, setLoading] = useState(false);

  // Verifications State
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  // Drill-down State (Users -> Stores -> Debtors)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userStores, setUserStores] = useState<(StoreType & { debtors_count: number })[]>([]);
  
  const [selectedStore, setSelectedStore] = useState<(StoreType & { debtors_count: number }) | null>(null);
  const [storeDebtors, setStoreDebtors] = useState<Debtor[]>([]);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server error');
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
    setSelectedUser(null);
    setSelectedStore(null);
  };

  // --- Fetch Logic ---
  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/verifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            q: userSearch
        });
        const res = await fetch(`${API_URL}/admin/users?${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
            logout();
            return;
        }
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const fetchUserStores = async (telegramId: string) => {
    if (!token) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/admin/users/${telegramId}/stores`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUserStores(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchStoreDebtors = async (storeId: string) => {
    if (!token) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/admin/stores/${storeId}/debtors`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStoreDebtors(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (token) {
        if (activeTab === 'verifications') fetchRequests();
        if (activeTab === 'users') fetchUsers();
    }
  }, [token, activeTab, page]); // Reload when tab or page changes

  // Debounced User Search
  useEffect(() => {
      const timer = setTimeout(() => {
          if (activeTab === 'users' && token && !selectedUser) {
              setPage(1); // Reset to page 1 on search
              fetchUsers();
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [userSearch]);

  // When selected User changes
  useEffect(() => {
      if (selectedUser) {
          fetchUserStores(selectedUser.telegram_id);
          setSelectedStore(null); // Reset deep state
      }
  }, [selectedUser]);

  // When selected Store changes
  useEffect(() => {
      if (selectedStore) {
          fetchStoreDebtors(selectedStore.id);
      }
  }, [selectedStore]);


  // --- Actions ---
  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/verifications/${id}/status`, {
        method: 'PUT',
        headers: { 
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests(); // Refresh list
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  // --- Login View ---
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-zinc-100">
          <div className="flex justify-center mb-6 text-zinc-900">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <Shield size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-zinc-900 mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <input 
                type="text" 
                className="w-full p-3 border border-zinc-300 rounded-lg outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full p-3 border border-zinc-300 rounded-lg outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button className="w-full bg-zinc-900 text-white py-3 rounded-lg font-bold hover:bg-zinc-800 transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Admin Layout ---
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex-shrink-0">
         <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
             <Shield className="text-blue-600" />
             <span className="font-bold text-xl text-zinc-900">Daftar Admin</span>
         </div>
         <nav className="p-4 space-y-2">
             <button 
                onClick={() => { setActiveTab('verifications'); setSelectedUser(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'verifications' 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
             >
                 <CheckCircle size={18} />
                 Requests
             </button>
             <button 
                onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'users' 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
             >
                 <Users size={18} />
                 Users
             </button>
         </nav>
         <div className="p-4 mt-auto border-t border-zinc-100">
             <button onClick={logout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 w-full hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Logout
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* === VERIFICATIONS VIEW === */}
        {activeTab === 'verifications' && (
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-zinc-800">Verification Requests</h1>
                    <button onClick={fetchRequests} className="text-sm text-blue-600 hover:underline">Refresh</button>
                </div>

                {loading && requests.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-zinc-200 text-zinc-400">
                        No verification requests found.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col md:flex-row">
                                <div 
                                    className="w-full md:w-48 h-48 bg-zinc-100 flex items-center justify-center cursor-pointer relative group"
                                    onClick={() => setViewingImage(req.image_base64)}
                                >
                                    <img src={req.image_base64} className="w-full h-full object-cover" alt="Document" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                                        <Eye size={24} />
                                    </div>
                                </div>

                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                                                <Store size={18} className="text-zinc-400" />
                                                {req.custom_store_name}
                                            </h3>
                                            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                                <User size={14} />
                                                {req.owner_name} ({req.owner_username ? `@${req.owner_username}` : 'No username'})
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600 mb-6">
                                        <div>
                                            <span className="block text-xs font-bold text-zinc-400 uppercase">Document Type</span>
                                            {req.document_type}
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-zinc-400 uppercase">Submitted At</span>
                                            {new Date(req.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {req.status === 'PENDING' && (
                                        <div className="flex gap-3 mt-auto">
                                            <button 
                                                onClick={() => updateStatus(req.id, 'APPROVED')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <CheckCircle size={18} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => updateStatus(req.id, 'REJECTED')}
                                                className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <XCircle size={18} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* === USERS VIEW === */}
        {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto">
                
                {/* 1. Main User List (Level 0) */}
                {!selectedUser && (
                    <>
                        <h1 className="text-2xl font-bold text-zinc-800 mb-6">User Management</h1>
                        
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 mb-6 flex items-center gap-3 shadow-sm">
                            <Search className="text-zinc-400" />
                            <input 
                                type="text" 
                                placeholder="Search users by name, username or phone..." 
                                className="flex-1 outline-none text-sm text-zinc-700"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                            <th className="p-4 font-semibold">User</th>
                                            <th className="p-4 font-semibold">Phone</th>
                                            <th className="p-4 font-semibold">Username</th>
                                            <th className="p-4 font-semibold">Telegram ID</th>
                                            <th className="p-4 font-semibold">Lang</th>
                                            <th className="p-4 font-semibold">Last Seen</th>
                                            <th className="p-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 text-sm">
                                        {loading && users.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Loading users...</td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400">No users found.</td></tr>
                                        ) : (
                                            users.map(user => (
                                                <tr key={user.telegram_id} className="hover:bg-zinc-50 transition-colors">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center text-zinc-500 shrink-0">
                                                            {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <User size={16} />}
                                                        </div>
                                                        <span className="font-medium text-zinc-900">{user.first_name}</span>
                                                    </td>
                                                    <td className="p-4 text-zinc-600">{user.phone_number ? `+${user.phone_number}` : '-'}</td>
                                                    <td className="p-4 text-blue-600">{user.username ? `@${user.username}` : '-'}</td>
                                                    <td className="p-4 text-zinc-500 font-mono text-xs">{user.telegram_id}</td>
                                                    <td className="p-4 text-zinc-600 uppercase text-xs">{user.language}</td>
                                                    <td className="p-4 text-zinc-500 text-xs">{new Date(user.last_seen).toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => setSelectedUser(user)}
                                                            className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500 hover:text-zinc-900 transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <span className="text-sm text-zinc-600">
                                Page <span className="font-bold text-zinc-900">{page}</span> of <span className="font-bold text-zinc-900">{totalPages || 1}</span>
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* 2. User Detail & Stores List (Level 1) */}
                {selectedUser && !selectedStore && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 font-medium text-sm transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Users
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center text-zinc-500 border-2 border-white shadow-md">
                                {selectedUser.photo_url ? <img src={selectedUser.photo_url} className="w-full h-full object-cover" /> : <User size={32} />}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">{selectedUser.first_name}</h1>
                                <p className="text-zinc-500">@{selectedUser.username || 'No username'} • {selectedUser.phone_number ? `+${selectedUser.phone_number}` : 'No phone'}</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                            <Store size={20} /> User's Stores
                        </h2>

                        <div className="grid gap-4">
                            {userStores.length === 0 ? (
                                <div className="p-8 bg-white border border-zinc-200 rounded-xl text-center text-zinc-400">
                                    No stores found for this user.
                                </div>
                            ) : (
                                userStores.map(store => (
                                    <div 
                                        key={store.id}
                                        onClick={() => setSelectedStore(store)}
                                        className="bg-white p-6 rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 mb-1">{store.name}</h3>
                                            <p className="text-sm text-zinc-500">Created: {new Date(store.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-zinc-900">{store.debtors_count}</span>
                                                <span className="text-xs text-zinc-500 uppercase font-medium">Debtors</span>
                                            </div>
                                            <ChevronRight size={20} className="text-zinc-300 group-hover:text-blue-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Store Detail & Debtors List (Level 2) */}
                {selectedUser && selectedStore && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
                            <button onClick={() => { setSelectedUser(null); setSelectedStore(null); }} className="hover:text-zinc-900">Users</button>
                            <ChevronRight size={14} />
                            <button onClick={() => setSelectedStore(null)} className="hover:text-zinc-900">{selectedUser.first_name}</button>
                            <ChevronRight size={14} />
                            <span className="text-zinc-900 font-medium">{selectedStore.name}</span>
                        </div>

                        <div className="flex items-center gap-4 mb-6 border-b border-zinc-200 pb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <Store size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-900">{selectedStore.name}</h1>
                                <p className="text-sm text-zinc-500">ID: {selectedStore.id}</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                            <Users size={20} /> Debtors List
                        </h2>

                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                            <th className="p-4 font-semibold">Name</th>
                                            <th className="p-4 font-semibold">Phone</th>
                                            <th className="p-4 font-semibold">Last Activity</th>
                                            <th className="p-4 font-semibold text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 text-sm">
                                        {storeDebtors.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-zinc-400">No debtors in this store.</td></tr>
                                        ) : (
                                            storeDebtors.map(debtor => (
                                                <tr key={debtor.id} className="hover:bg-zinc-50 transition-colors">
                                                    <td className="p-4 font-medium text-zinc-900">{debtor.name}</td>
                                                    <td className="p-4 text-zinc-600">{debtor.phone}</td>
                                                    <td className="p-4 text-zinc-500">
                                                        <div className="flex items-center gap-1">
                                                            <History size={14} />
                                                            {new Date(debtor.lastActivity).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className={`p-4 text-right font-bold ${debtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                                                        {formatCurrency(debtor.balance)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* Image Modal (Global for Verifications) */}
      {viewingImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
              <img src={viewingImage} className="max-w-full max-h-full rounded-lg" alt="Full view" />
              <button className="absolute top-4 right-4 text-white p-2">
                  <XCircle size={32} />
              </button>
          </div>
      )}
    </div>
  );
};

export default AdminApp;