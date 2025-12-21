
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ChevronRight, Edit2, Save, MoreHorizontal, Database, 
  Terminal, Calendar, ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan } from '../../types';

interface GeneratedKey {
  code: string;
  isUsed: boolean;
  plan?: 'plus' | 'pro';
}

interface AdminUser {
  id: string;
  name: string;
  plan: UserPlan;
  streak: number;
  lastVisit: string;
  theme: string;
  usage: number;
  rawSettings: any;
  updatedAt: string;
}

interface AdminPanelProps {
  showAdminAuth: boolean;
  setShowAdminAuth: (val: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (val: string) => void;
  handleAdminLogin: () => void;
  generateKey: (plan: 'plus' | 'pro') => void;
  generatedKeys: GeneratedKey[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminPanel = ({
  showAdminAuth,
  setShowAdminAuth,
  showAdminPanel,
  setShowAdminPanel,
  adminPasswordInput,
  setAdminPasswordInput,
  handleAdminLogin,
  generateKey,
  generatedKeys,
  addToast
}: AdminPanelProps) => {
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | 'users'>('dashboard');
    const [dbKeys, setDbKeys] = useState<any[]>([]);
    const [dbUsers, setDbUsers] = useState<AdminUser[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>('pro');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editPlanValue, setEditPlanValue] = useState<UserPlan>('free');
    const [showRawData, setShowRawData] = useState<string | null>(null);

    useEffect(() => {
        if (showAdminPanel) {
            fetchData();
        }
    }, [showAdminPanel, activeTab]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            // Fetch Users
            if (activeTab === 'users' || activeTab === 'dashboard') {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                
                if (!error && users) {
                    const mappedUsers: AdminUser[] = users.map((u: any) => {
                        let settings = u.settings;
                        if (typeof settings === 'string') {
                            try { settings = JSON.parse(settings); } catch (e) {}
                        }
                        return {
                            id: u.id,
                            name: settings?.userName || 'Anonymous',
                            plan: settings?.plan || 'free',
                            streak: settings?.stats?.streak || 0,
                            usage: settings?.stats?.dailyImageCount || 0,
                            lastVisit: settings?.stats?.lastVisit || new Date(u.updated_at).toLocaleDateString(),
                            theme: u.theme_color || '#6366f1',
                            rawSettings: settings,
                            updatedAt: u.updated_at
                        };
                    });
                    setDbUsers(mappedUsers);
                }
            }

            // Fetch Keys
            if (activeTab === 'keys' || activeTab === 'dashboard') {
                const { data: keys, error } = await supabase
                    .from('promo_codes')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (!error && keys) setDbKeys(keys);
            }
        } catch (e) {
            console.error("Admin Fetch Error:", e);
            addToast("Грешка при зареждане на данни", 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const handleGenerate = () => {
        generateKey(selectedPlan);
        setTimeout(fetchData, 1000);
        addToast(`Генериран ключ за ${selectedPlan.toUpperCase()}`, 'success');
    };

    const handleUpdateUserPlan = async (userId: string, newPlan: UserPlan, currentSettings: any) => {
        try {
            const updatedSettings = { ...currentSettings, plan: newPlan };
            const { error } = await supabase
                .from('profiles')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan, rawSettings: updatedSettings } : u));
            setEditingUser(null);
            addToast('Планът на потребителя е обновен!', 'success');
        } catch (e) {
            console.error("Update Error:", e);
            addToast('Грешка при обновяване.', 'error');
        }
    };

    // Calculate Stats
    const totalUsers = dbUsers.length;
    const proUsers = dbUsers.filter(u => u.plan === 'pro').length;
    const plusUsers = dbUsers.filter(u => u.plan === 'plus').length;
    const activeToday = dbUsers.filter(u => {
        const d = new Date(u.updatedAt);
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in">
          <div className="bg-[#09090b] border border-white/10 w-full max-w-sm p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"/>
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
             
             <div className="flex flex-col items-center gap-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-full border border-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <Shield size={32}/>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-1">Admin Access</h2>
                    <p className="text-zinc-500 text-sm">Въведете парола за достъп</p>
                </div>
                
                <div className="w-full space-y-3">
                    <input 
                    type="password" 
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest"
                    autoFocus
                    />
                    <Button onClick={handleAdminLogin} className="w-full py-3 bg-white text-black hover:bg-zinc-200">Вход</Button>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-7xl h-[90vh] bg-[#09090b]/95 border border-white/10 rounded-[32px] shadow-2xl flex overflow-hidden backdrop-blur-2xl relative">
             
             {/* Raw Data Modal */}
             {showRawData && (
                 <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setShowRawData(null)}>
                     <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-white font-mono font-bold flex items-center gap-2"><Terminal size={18}/> Raw User Data</h3>
                             <button onClick={() => setShowRawData(null)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={18}/></button>
                         </div>
                         <pre className="flex-1 overflow-auto custom-scrollbar bg-black/50 p-4 rounded-xl text-green-400 font-mono text-xs leading-relaxed">
                             {showRawData}
                         </pre>
                     </div>
                 </div>
             )}

             {/* Sidebar */}
             <div className="w-72 bg-black/40 border-r border-white/5 flex flex-col p-6">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Shield size={18} fill="currentColor"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm">Admin Panel</h2>
                        <div className="text-[10px] text-zinc-500 font-mono">v2.0 • Secure</div>
                    </div>
                </div>
                
                <nav className="space-y-2 flex-1">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity size={18}/> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Users size={18}/> User Accounts
                    </button>
                    <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Key size={18}/> Access Keys
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <button onClick={() => setShowAdminPanel(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <X size={18}/> Close Panel
                    </button>
                </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black/50">
                 {/* Header */}
                 <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
                     <div>
                         <h3 className="text-xl font-bold text-white capitalize">{activeTab}</h3>
                         <p className="text-xs text-zinc-500 mt-0.5">Manage your application data</p>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                             <span className="text-xs font-mono text-zinc-400">DB Connected</span>
                         </div>
                         <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Refresh Data">
                             <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/>
                         </button>
                     </div>
                 </div>

                 {/* Content Scroll Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                     
                     {/* DASHBOARD VIEW */}
                     {activeTab === 'dashboard' && (
                         <div className="space-y-8">
                             {/* Stats Grid */}
                             <div className="grid grid-cols-4 gap-6">
                                 <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><Users size={20}/></div>
                                         <span className="text-xs text-zinc-500 font-mono">+2 today</span>
                                     </div>
                                     <div className="text-3xl font-black text-white">{totalUsers}</div>
                                     <div className="text-xs text-zinc-500 mt-1">Total Users</div>
                                 </div>
                                 <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><Crown size={20}/></div>
                                         <span className="text-xs text-zinc-500 font-mono">{(proUsers / (totalUsers || 1) * 100).toFixed(0)}% ratio</span>
                                     </div>
                                     <div className="text-3xl font-black text-white">{proUsers}</div>
                                     <div className="text-xs text-zinc-500 mt-1">Pro Subscribers</div>
                                 </div>
                                 <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Zap size={20}/></div>
                                     </div>
                                     <div className="text-3xl font-black text-white">{plusUsers}</div>
                                     <div className="text-xs text-zinc-500 mt-1">Plus Subscribers</div>
                                 </div>
                                 <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Activity size={20}/></div>
                                     </div>
                                     <div className="text-3xl font-black text-white">{activeToday}</div>
                                     <div className="text-xs text-zinc-500 mt-1">Active Today</div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                 {/* Recent Keys */}
                                 <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                     <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Key size={16} className="text-indigo-500"/> Recent Keys</h4>
                                     <div className="space-y-2">
                                         {dbKeys.slice(0, 5).map((k, i) => (
                                             <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                                                 <code className="text-xs font-mono text-zinc-300">{k.code}</code>
                                                 <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${k.is_used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                     {k.is_used ? 'Used' : 'Active'}
                                                 </span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Recent Users */}
                                 <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                     <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-emerald-500"/> Newest Members</h4>
                                     <div className="space-y-2">
                                         {dbUsers.slice(0, 5).map((u, i) => (
                                             <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{backgroundColor: u.theme}}>{u.name[0]}</div>
                                                     <div>
                                                         <div className="text-xs font-bold text-white">{u.name}</div>
                                                         <div className="text-[10px] text-zinc-500">{u.plan}</div>
                                                     </div>
                                                 </div>
                                                 <span className="text-[10px] text-zinc-500">{u.lastVisit}</span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* KEYS MANAGEMENT */}
                     {activeTab === 'keys' && (
                         <div className="space-y-6">
                             {/* Generator Card */}
                             <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                                 <div className="flex-1">
                                     <h4 className="text-xl font-bold text-white mb-2">Generate Access Key</h4>
                                     <p className="text-zinc-400 text-sm">Create new promotional keys for user activation.</p>
                                 </div>
                                 <div className="flex items-center gap-4 bg-black/30 p-2 rounded-xl border border-white/5">
                                     <button onClick={() => setSelectedPlan('plus')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'plus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                                         <Zap size={14}/> Plus
                                     </button>
                                     <button onClick={() => setSelectedPlan('pro')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'pro' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                                         <Crown size={14}/> Pro
                                     </button>
                                 </div>
                                 <Button onClick={handleGenerate} icon={Plus} className="px-8 py-3 bg-white text-black hover:bg-zinc-200">Generate</Button>
                             </div>

                             {/* Keys Table */}
                             <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                                 <table className="w-full text-left">
                                     <thead>
                                         <tr className="border-b border-white/5 bg-black/20">
                                             <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Key Code</th>
                                             <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                                             <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                             <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Created</th>
                                             <th className="p-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-white/5">
                                         {dbKeys.map((k, i) => (
                                             <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                 <td className="p-4 font-mono text-sm text-indigo-400">{k.code}</td>
                                                 <td className="p-4">
                                                     <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${k.plan === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{k.plan || 'pro'}</span>
                                                 </td>
                                                 <td className="p-4">
                                                     <div className={`flex items-center gap-2 text-xs font-medium ${k.is_used ? 'text-red-400' : 'text-emerald-400'}`}>
                                                         <div className={`w-1.5 h-1.5 rounded-full ${k.is_used ? 'bg-red-500' : 'bg-emerald-500'}`}/>
                                                         {k.is_used ? 'Redeemed' : 'Available'}
                                                     </div>
                                                 </td>
                                                 <td className="p-4 text-xs text-zinc-500">{new Date(k.created_at).toLocaleDateString()}</td>
                                                 <td className="p-4 text-right">
                                                     <button onClick={() => {navigator.clipboard.writeText(k.code); addToast('Copied to clipboard', 'success')}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                                         <Copy size={16}/>
                                                     </button>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     )}

                     {/* USERS MANAGEMENT */}
                     {activeTab === 'users' && (
                         <div className="space-y-6">
                             <div className="flex gap-4">
                                 <div className="flex-1 relative">
                                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                     <input 
                                        type="text" 
                                        placeholder="Search users by name..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                     />
                                 </div>
                                 <div className="flex gap-2">
                                     <button className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"><Filter size={18}/></button>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 gap-4">
                                 {dbUsers.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                                     <div key={user.id} className="group bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                                         <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-4">
                                                 <div 
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                                                    style={{ backgroundColor: user.theme }}
                                                 >
                                                     {user.name.charAt(0).toUpperCase()}
                                                 </div>
                                                 <div>
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <h4 className="font-bold text-white">{user.name}</h4>
                                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                             user.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 
                                                             user.plan === 'plus' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 
                                                             'bg-zinc-800 text-zinc-500 border border-white/5'
                                                         }`}>
                                                             {user.plan}
                                                         </span>
                                                     </div>
                                                     <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                                                         <span>ID: {user.id.substring(0, 8)}</span>
                                                         <span>•</span>
                                                         <span className="flex items-center gap-1"><Activity size={10}/> {user.usage} imgs/day</span>
                                                         <span>•</span>
                                                         <span className="flex items-center gap-1"><Calendar size={10}/> {user.lastVisit}</span>
                                                     </div>
                                                 </div>
                                             </div>

                                             <div className="flex items-center gap-2">
                                                 {editingUser === user.id ? (
                                                     <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10 animate-in slide-in-from-right">
                                                         <select 
                                                            value={editPlanValue} 
                                                            onChange={(e) => setEditPlanValue(e.target.value as UserPlan)}
                                                            className="bg-transparent text-white text-xs font-bold px-2 outline-none"
                                                         >
                                                             <option value="free" className="bg-zinc-900">FREE</option>
                                                             <option value="plus" className="bg-zinc-900">PLUS</option>
                                                             <option value="pro" className="bg-zinc-900">PRO</option>
                                                         </select>
                                                         <button onClick={() => handleUpdateUserPlan(user.id, editPlanValue, user.rawSettings)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Save size={14}/></button>
                                                         <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-white/10 text-zinc-400 rounded"><X size={14}/></button>
                                                     </div>
                                                 ) : (
                                                     <>
                                                         <button 
                                                            onClick={() => { setEditingUser(user.id); setEditPlanValue(user.plan); }} 
                                                            className="px-3 py-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-zinc-400 rounded-lg text-xs font-bold transition-all"
                                                         >
                                                             Edit Plan
                                                         </button>
                                                         <button 
                                                            onClick={() => setShowRawData(JSON.stringify(user.rawSettings, null, 2))}
                                                            className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors" 
                                                            title="View JSON"
                                                         >
                                                             <Database size={16}/>
                                                         </button>
                                                     </>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                                 
                                 {dbUsers.length === 0 && (
                                     <div className="text-center py-20">
                                         <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                             <Users size={32}/>
                                         </div>
                                         <p className="text-zinc-500 font-medium">No users found.</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}

                 </div>
             </div>
           </div>
        </div>
      );
    }

    return null;
};
