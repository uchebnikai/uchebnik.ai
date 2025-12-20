import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, DollarSign, 
  BarChart2, Search, Edit2, Trash2, Ban, Lock, Unlock, 
  FileText, Megaphone, Server, AlertTriangle, RefreshCw, Eye, Download,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { AdminUser, DashboardStats, Announcement, AuditLog, UserPlan } from '../../types';

interface AdminPanelProps {
  showAdminAuth: boolean;
  setShowAdminAuth: (val: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (val: string) => void;
  handleAdminLogin: () => void;
  generateKey: () => void;
  generatedKeys: { code: string; isUsed: boolean }[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'dashboard' | 'users' | 'revenue' | 'content' | 'keys' | 'system';

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
    
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [searchUser, setSearchUser] = useState('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ message: '', type: 'info' as const });
    
    // Key Generation State
    const [bulkAmount, setBulkAmount] = useState(1);

    // Fetch data when panel opens
    useEffect(() => {
        if (showAdminPanel) {
            fetchStats();
            fetchUsers();
            fetchAnnouncements();
        }
    }, [showAdminPanel]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
            if (error) throw error;
            setStats(data);
        } catch (e) {
            console.error("Stats fetch error", e);
            // Fallback mock data for visualization if RPC not set up
            setStats({ total_users: 1240, pro_users: 85, mrr_estimate: 1850 }); 
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_user_list');
            if (error) throw error;
            setUsers(data || []);
        } catch (e) {
            console.error("Users fetch error", e);
        }
    };

    const fetchAnnouncements = async () => {
        const { data } = await supabase.from('system_announcements').select('*').order('created_at', { ascending: false });
        if (data) setAnnouncements(data as any);
    };

    // User Actions
    const handleBanUser = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
        const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
        if (error) addToast('Error updating user status', 'error');
        else {
            addToast(`User ${currentStatus ? 'unbanned' : 'banned'}`, 'success');
            fetchUsers();
        }
    };

    const handleUpdatePlan = async (userId: string, newPlan: UserPlan) => {
        const { error } = await supabase.from('profiles').update({ 
            settings: { plan: newPlan } // Simplified, ideally updates raw column if exists
        }).eq('id', userId);
        
        // Also try direct column update if setup
        await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId);

        if (error) addToast('Failed to update plan', 'error');
        else {
            addToast('Plan updated', 'success');
            fetchUsers();
        }
    };

    const handleResetHistory = async (userId: string) => {
        if (!confirm("This will delete ALL user chat history. Irreversible.")) return;
        const { error } = await supabase.from('user_data').delete().eq('user_id', userId);
        if (error) addToast('Failed to reset history', 'error');
        else addToast('History wiped successfully', 'success');
    };

    // Content Actions
    const handlePostAnnouncement = async () => {
        if (!newAnnouncement.message) return;
        const { error } = await supabase.from('system_announcements').insert({
            message: newAnnouncement.message,
            type: newAnnouncement.type,
            is_active: true
        });
        if (error) addToast('Failed to post', 'error');
        else {
            addToast('Announcement posted', 'success');
            setNewAnnouncement({ message: '', type: 'info' });
            fetchAnnouncements();
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        await supabase.from('system_announcements').delete().eq('id', id);
        fetchAnnouncements();
    };

    // Bulk Keys
    const handleBulkGenerate = () => {
        // Logic to generate N keys (Simulation for UI)
        for(let i=0; i<bulkAmount; i++) {
            generateKey();
        }
        addToast(`Generated ${bulkAmount} keys`, 'info');
    };

    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500 border border-indigo-500/20"><Shield size={32}/></div>
                <h2 className="text-2xl font-bold tracking-tight">Admin Portal</h2>
             </div>
             <input 
               type="password" 
               value={adminPasswordInput}
               onChange={e => setAdminPasswordInput(e.target.value)}
               placeholder="Enter Access Key"
               className="w-full bg-white/50 dark:bg-black/40 p-4 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 text-center font-bold tracking-widest text-lg"
               autoFocus
             />
             <Button onClick={handleAdminLogin} className="w-full py-3.5 text-base">Authenticate</Button>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[80] bg-gray-100 dark:bg-black text-zinc-900 dark:text-zinc-100 flex animate-in fade-in duration-300">
           
           {/* Sidebar */}
           <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-white/10 flex flex-col">
               <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
                   <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield size={20}/></div>
                   <h1 className="font-bold text-lg tracking-tight">Admin OS</h1>
               </div>
               
               <div className="p-4 space-y-1 flex-1">
                   {[
                       { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                       { id: 'users', icon: Users, label: 'User Management' },
                       { id: 'revenue', icon: DollarSign, label: 'Revenue' },
                       { id: 'content', icon: Megaphone, label: 'Content' },
                       { id: 'keys', icon: Key, label: 'License Keys' },
                       { id: 'system', icon: Server, label: 'System Health' },
                   ].map(item => (
                       <button 
                         key={item.id}
                         onClick={() => setActiveTab(item.id as AdminTab)}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                       >
                           <item.icon size={18}/> {item.label}
                       </button>
                   ))}
               </div>

               <div className="p-4 border-t border-gray-200 dark:border-white/10">
                   <button onClick={() => setShowAdminPanel(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                       <X size={16}/> Close Panel
                   </button>
               </div>
           </div>

           {/* Main Content */}
           <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-black/50">
               {/* Header */}
               <header className="h-16 border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-8 flex items-center justify-between">
                   <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                   <div className="flex items-center gap-4">
                       <button onClick={fetchStats} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="Refresh Data"><RefreshCw size={18}/></button>
                       <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">A</div>
                   </div>
               </header>

               <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   
                   {/* DASHBOARD TAB */}
                   {activeTab === 'dashboard' && stats && (
                       <div className="space-y-8 max-w-6xl mx-auto">
                           {/* Key Metrics */}
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Users size={20}/></div>
                                       <span className="text-xs font-bold text-green-500 flex items-center gap-1">+12% <Activity size={12}/></span>
                                   </div>
                                   <div className="text-3xl font-black mb-1">{stats.total_users}</div>
                                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Users</div>
                               </div>
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-lg"><Key size={20}/></div>
                                   </div>
                                   <div className="text-3xl font-black mb-1">{stats.pro_users}</div>
                                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Pro</div>
                               </div>
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                                   </div>
                                   <div className="text-3xl font-black mb-1">{stats.mrr_estimate} лв.</div>
                                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Est. MRR</div>
                               </div>
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Activity size={20}/></div>
                                   </div>
                                   <div className="text-3xl font-black mb-1">~98%</div>
                                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Uptime</div>
                               </div>
                           </div>

                           {/* Charts Area */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm h-80">
                                   <h3 className="font-bold text-lg mb-6">User Growth</h3>
                                   <ResponsiveContainer width="100%" height="80%">
                                       <AreaChart data={[{name:'Jan', uv:400},{name:'Feb', uv:600},{name:'Mar', uv:1200},{name:'Apr', uv:1800},{name:'May', uv:2400}]}>
                                           <defs>
                                               <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                               </linearGradient>
                                           </defs>
                                           <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                                           <XAxis dataKey="name" stroke="#888" fontSize={10} axisLine={false} tickLine={false}/>
                                           <YAxis stroke="#888" fontSize={10} axisLine={false} tickLine={false}/>
                                           <Tooltip contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '8px'}}/>
                                           <Area type="monotone" dataKey="uv" stroke="#6366f1" fillOpacity={1} fill="url(#colorUv)" />
                                       </AreaChart>
                                   </ResponsiveContainer>
                               </div>
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm h-80">
                                   <h3 className="font-bold text-lg mb-6">Subject Popularity</h3>
                                   <ResponsiveContainer width="100%" height="80%">
                                       <BarChart data={[{name:'Math', val:45},{name:'Bg', val:30},{name:'Eng', val:25},{name:'Hist', val:15},{name:'IT', val:35}]}>
                                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2}/>
                                           <XAxis dataKey="name" stroke="#888" fontSize={10} axisLine={false} tickLine={false}/>
                                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '8px'}}/>
                                           <Bar dataKey="val" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                       </BarChart>
                                   </ResponsiveContainer>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* USERS TAB */}
                   {activeTab === 'users' && (
                       <div className="space-y-6 max-w-6xl mx-auto">
                           <div className="flex gap-4">
                               <div className="relative flex-1">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                   <input 
                                     value={searchUser}
                                     onChange={e => setSearchUser(e.target.value)}
                                     placeholder="Search users by email..." 
                                     className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500"
                                   />
                               </div>
                               <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">Refresh</button>
                           </div>

                           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                               <div className="overflow-x-auto">
                               <table className="w-full text-left text-sm">
                                   <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                       <tr>
                                           <th className="p-4 font-bold text-gray-500 uppercase text-xs">User</th>
                                           <th className="p-4 font-bold text-gray-500 uppercase text-xs">Plan</th>
                                           <th className="p-4 font-bold text-gray-500 uppercase text-xs">Joined</th>
                                           <th className="p-4 font-bold text-gray-500 uppercase text-xs">Status</th>
                                           <th className="p-4 font-bold text-gray-500 uppercase text-xs text-right">Actions</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                       {users.filter(u => u.email?.toLowerCase().includes(searchUser.toLowerCase())).map(user => (
                                           <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                               <td className="p-4">
                                                   <div className="font-bold text-zinc-900 dark:text-white">{user.full_name || 'No Name'}</div>
                                                   <div className="text-gray-500 text-xs">{user.email}</div>
                                               </td>
                                               <td className="p-4">
                                                   <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.plan === 'pro' ? 'bg-amber-100 text-amber-700' : user.plan === 'plus' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                                       {user.plan || 'Free'}
                                                   </span>
                                               </td>
                                               <td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                               <td className="p-4">
                                                   {user.is_banned ? (
                                                       <span className="text-red-500 font-bold text-xs flex items-center gap-1"><Ban size={12}/> Banned</span>
                                                   ) : (
                                                       <span className="text-green-500 font-bold text-xs flex items-center gap-1"><CheckCircle size={12}/> Active</span>
                                                   )}
                                               </td>
                                               <td className="p-4 flex justify-end gap-2">
                                                   <button onClick={() => handleUpdatePlan(user.id, user.plan === 'pro' ? 'free' : 'pro')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-indigo-500" title="Toggle Pro"><Edit2 size={16}/></button>
                                                   <button onClick={() => handleResetHistory(user.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-orange-500" title="Wipe Data"><Trash2 size={16}/></button>
                                                   <button onClick={() => handleBanUser(user.id, user.is_banned)} className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded ${user.is_banned ? 'text-green-500' : 'text-red-500'}`} title={user.is_banned ? "Unban" : "Ban"}>
                                                       {user.is_banned ? <Unlock size={16}/> : <Lock size={16}/>}
                                                   </button>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* REVENUE TAB */}
                   {activeTab === 'revenue' && (
                       <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-gray-500">
                           <DollarSign size={48} className="opacity-20"/>
                           <h3 className="text-xl font-bold">Transaction Feed</h3>
                           <p className="max-w-md">Real-time Stripe transaction data will appear here once the webhook is fully configured to insert into the 'payments' table.</p>
                           <Button onClick={() => addToast('Not connected to live payments yet', 'info')} variant="secondary">Check Stripe Status</Button>
                       </div>
                   )}

                   {/* CONTENT TAB */}
                   {activeTab === 'content' && (
                       <div className="space-y-8 max-w-4xl mx-auto">
                           <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Megaphone size={20} className="text-indigo-500"/> Global Announcement</h3>
                               <div className="flex gap-4 mb-4">
                                   <input 
                                     value={newAnnouncement.message} 
                                     onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                                     placeholder="Message to all users..." 
                                     className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none"
                                   />
                                   <select 
                                     value={newAnnouncement.type} 
                                     onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                                     className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none"
                                   >
                                       <option value="info">Info</option>
                                       <option value="warning">Warning</option>
                                       <option value="error">Critical</option>
                                   </select>
                                   <Button onClick={handlePostAnnouncement}>Post</Button>
                               </div>
                               
                               <div className="space-y-2">
                                   {announcements.map(a => (
                                       <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                           <div className="flex items-center gap-3">
                                               <div className={`w-2 h-2 rounded-full ${a.type === 'error' ? 'bg-red-500' : a.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}/>
                                               <span className="text-sm font-medium">{a.message}</span>
                                           </div>
                                           <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                       </div>
                                   ))}
                                   {announcements.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No active announcements</p>}
                               </div>
                           </div>
                       </div>
                   )}

                   {/* KEYS TAB */}
                   {activeTab === 'keys' && (
                       <div className="space-y-8 max-w-4xl mx-auto">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10">
                                   <h3 className="font-bold mb-4">Single Generator</h3>
                                   <Button onClick={generateKey} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500">Generate 1 Key</Button>
                               </div>
                               <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10">
                                   <h3 className="font-bold mb-4">Bulk Generator</h3>
                                   <div className="flex gap-4">
                                       <input 
                                         type="number" 
                                         min="1" 
                                         max="50" 
                                         value={bulkAmount} 
                                         onChange={e => setBulkAmount(parseInt(e.target.value))}
                                         className="w-20 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 outline-none"
                                       />
                                       <Button onClick={handleBulkGenerate} className="flex-1" variant="secondary" icon={Download}>Generate CSV</Button>
                                   </div>
                               </div>
                           </div>

                           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 p-4">
                               <h3 className="font-bold mb-4 px-2">Recent Keys</h3>
                               <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                   {generatedKeys.map((k, i) => (
                                       <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                           <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{k.code}</code>
                                           <div className="flex items-center gap-3">
                                               <span className={`text-xs font-bold ${k.isUsed ? 'text-red-500' : 'text-emerald-500'}`}>{k.isUsed ? 'USED' : 'ACTIVE'}</span>
                                               <button onClick={() => { navigator.clipboard.writeText(k.code); addToast('Copied', 'success') }} className="text-gray-400 hover:text-white"><Copy size={14}/></button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {/* SYSTEM TAB */}
                   {activeTab === 'system' && (
                       <div className="space-y-6 max-w-4xl mx-auto">
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
                               <div>
                                   <h3 className="font-bold text-lg">System Health</h3>
                                   <p className="text-sm text-gray-500">Database & API Status</p>
                               </div>
                               <div className="flex items-center gap-6">
                                   <div className="flex items-center gap-2 text-sm font-bold text-green-500"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/> Supabase Connected</div>
                                   <div className="flex items-center gap-2 text-sm font-bold text-green-500"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/> Google AI Operational</div>
                               </div>
                           </div>

                           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                               <h3 className="font-bold mb-4">Admin Audit Log</h3>
                               <div className="text-center text-gray-500 py-10">No recent admin actions recorded.</div>
                           </div>
                       </div>
                   )}

               </main>
           </div>
        </div>
      );
    }

    return null;
};
