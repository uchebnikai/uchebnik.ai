
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  BarChart2, Bell, FileText, Ban, Trash2, Eye, RefreshCw, 
  Search, DollarSign, Lock, AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/Button';
import { UserProfileExtended, Announcement, AnalyticsEvent, Session } from '../../types';
import { GLASS_PANEL } from '../../styles/ui';

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

type AdminTab = 'overview' | 'users' | 'analytics' | 'announcements' | 'audit' | 'keys';

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
    
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfileExtended[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, mrr: 0, activeToday: 0, totalTokens: 0 });
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [viewingUserSessions, setViewingUserSessions] = useState<Session[] | null>(null);
    const [viewingUserName, setViewingUserName] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Charts Data
    const [usageData, setUsageData] = useState<any[]>([]);

    useEffect(() => {
        if (showAdminPanel) {
            fetchDashboardData();
        }
    }, [showAdminPanel]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users & Calculate MRR
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (profiles) {
                const mappedUsers: UserProfileExtended[] = profiles.map((p: any) => ({
                    id: p.id,
                    email: p.email || 'Hidden (Auth)', // Email often in auth.users, not accessible directly via public table query easily without join or function
                    full_name: p.settings?.userName || 'User',
                    plan: p.plan || 'free',
                    is_banned: p.is_banned || false,
                    created_at: p.created_at,
                    last_active_at: p.updated_at,
                    usage_stats: p.usage_stats || { total_tokens: 0 }
                }));
                setUsers(mappedUsers);

                const mrr = mappedUsers.reduce((acc, user) => {
                    if (user.plan === 'plus') return acc + 13;
                    if (user.plan === 'pro') return acc + 23;
                    return acc;
                }, 0);

                setStats(prev => ({ ...prev, totalUsers: mappedUsers.length, mrr }));
            }

            // 2. Fetch Analytics for Charts & Activity
            const { data: analytics } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(1000); // Limit for demo performance

            if (analytics) {
                // Calculate Active Today
                const today = new Date().toDateString();
                const uniqueActive = new Set(analytics.filter((e: any) => new Date(e.created_at).toDateString() === today).map((e: any) => e.user_id));
                
                // Calculate Tokens
                const totalTokens = analytics.reduce((acc: number, curr: any) => acc + (curr.metadata?.total_tokens || 0), 0);

                setStats(prev => ({ ...prev, activeToday: uniqueActive.size, totalTokens }));

                // Process Chart Data (Messages per Day)
                const chartMap: Record<string, number> = {};
                analytics.forEach((e: any) => {
                    const date = new Date(e.created_at).toLocaleDateString();
                    chartMap[date] = (chartMap[date] || 0) + 1;
                });
                const chartData = Object.keys(chartMap).map(key => ({ date: key, messages: chartMap[key] }));
                setUsageData(chartData);
            }

            // 3. Fetch Announcements
            const { data: announce } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
            if (announce) setAnnouncements(announce);

        } catch (e) {
            console.error("Dashboard fetch error", e);
            addToast("Грешка при зареждане на данни", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: !currentStatus })
            .eq('id', userId);
        
        if (error) {
            addToast("Грешка при промяна на статуса", "error");
        } else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
            addToast(currentStatus ? "Потребителят е отблокиран" : "Потребителят е блокиран", "success");
            logAction('ban_user', userId, { banned: !currentStatus });
        }
    };

    const handleResetHistory = async (userId: string) => {
        if (!confirm("Сигурни ли сте? Това ще изтрие цялата история на потребителя.")) return;
        
        const { error } = await supabase
            .from('user_data')
            .delete()
            .eq('user_id', userId);

        if (error) {
            addToast("Грешка при изтриване", "error");
        } else {
            addToast("Историята е изтрита успешно", "success");
            logAction('reset_history', userId);
        }
    };

    const handleImpersonate = async (userId: string, name: string) => {
        setViewingUserName(name);
        setLoading(true);
        const { data } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', userId)
            .single();
        
        if (data && data.data) {
            setViewingUserSessions(data.data);
        } else {
            setViewingUserSessions([]);
            addToast("Няма намерени сесии", "info");
        }
        setLoading(false);
    };

    const handlePostAnnouncement = async () => {
        if (!newAnnouncement.trim()) return;
        const { data, error } = await supabase
            .from('announcements')
            .insert({ message: newAnnouncement, type: 'info', is_active: true })
            .select()
            .single();
        
        if (error) {
            addToast("Грешка при публикуване", "error");
        } else if (data) {
            setAnnouncements(prev => [data, ...prev]);
            setNewAnnouncement('');
            addToast("Съобщението е публикувано", "success");
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        await supabase.from('announcements').delete().eq('id', id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const logAction = async (action: string, targetId?: string, details?: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('admin_audit_logs').insert({
                admin_id: session.user.id,
                action,
                target_user_id: targetId,
                details
            });
        }
    };

    // Filter Users
    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.id.includes(searchQuery)
    );

    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500"><Shield size={32}/></div>
                <h2 className="text-xl font-bold">Admin Access</h2>
             </div>
             <input 
               type="password" 
               value={adminPasswordInput}
               onChange={e => setAdminPasswordInput(e.target.value)}
               placeholder="Enter Password"
               className="w-full bg-white/50 dark:bg-black/40 p-3 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold"
               autoFocus
             />
             <Button onClick={handleAdminLogin} className="w-full py-3">Login</Button>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[100] bg-zinc-100 dark:bg-black flex animate-in fade-in duration-300 font-sans text-zinc-900 dark:text-zinc-100">
           
           {/* Sidebar */}
           <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/10 flex flex-col p-4">
               <div className="flex items-center gap-3 mb-8 px-2">
                   <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield size={20}/></div>
                   <div>
                       <h3 className="font-bold text-lg leading-none">Uchebnik AI</h3>
                       <span className="text-xs text-indigo-500 font-bold tracking-wider">ADMIN PANEL</span>
                   </div>
               </div>

               <nav className="space-y-1 flex-1">
                   {[
                       { id: 'overview', icon: Activity, label: 'Overview' },
                       { id: 'users', icon: Users, label: 'Users Management' },
                       { id: 'analytics', icon: BarChart2, label: 'Analytics' },
                       { id: 'announcements', icon: Bell, label: 'Announcements' },
                       { id: 'keys', icon: Key, label: 'License Keys' },
                   ].map(item => (
                       <button 
                           key={item.id}
                           onClick={() => setActiveTab(item.id as AdminTab)}
                           className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                       >
                           <item.icon size={18} />
                           {item.label}
                       </button>
                   ))}
               </nav>

               <button onClick={() => setShowAdminPanel(false)} className="flex items-center gap-2 text-gray-500 hover:text-red-500 px-4 py-3 text-sm font-medium transition-colors">
                   <X size={18} /> Exit Admin
               </button>
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50 dark:bg-black/50">
               
               {/* Header */}
               <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
                   <div className="flex items-center gap-4">
                       <button onClick={fetchDashboardData} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors text-gray-500"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
                       <div className="text-xs text-gray-400 font-mono">v2.1.0-stable</div>
                   </div>
               </div>

               {/* TAB: OVERVIEW */}
               {activeTab === 'overview' && (
                   <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-xl"><Users size={20}/></div>
                                   <span className="text-xs font-bold text-green-500 bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded-full">+12%</span>
                               </div>
                               <div className="text-3xl font-black mb-1">{stats.totalUsers}</div>
                               <div className="text-sm text-gray-500">Total Users</div>
                           </div>
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="p-3 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-xl"><DollarSign size={20}/></div>
                               </div>
                               <div className="text-3xl font-black mb-1">{stats.mrr} лв.</div>
                               <div className="text-sm text-gray-500">Monthly Recurring Revenue</div>
                           </div>
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-xl"><Activity size={20}/></div>
                               </div>
                               <div className="text-3xl font-black mb-1">{stats.activeToday}</div>
                               <div className="text-sm text-gray-500">Active Users Today</div>
                           </div>
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="p-3 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-xl"><Key size={20}/></div>
                               </div>
                               <div className="text-3xl font-black mb-1">{(stats.totalTokens / 1000).toFixed(1)}k</div>
                               <div className="text-sm text-gray-500">Est. Tokens Consumed</div>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm h-80">
                               <h3 className="font-bold mb-4">Activity Trend</h3>
                               <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={usageData}>
                                       <defs>
                                           <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                                               <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                               <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                           </linearGradient>
                                       </defs>
                                       <XAxis dataKey="date" hide />
                                       <YAxis hide />
                                       <Tooltip contentStyle={{background:'#18181b', border:'none', borderRadius:'8px', color:'#fff'}} />
                                       <Area type="monotone" dataKey="messages" stroke="#6366f1" fillOpacity={1} fill="url(#colorMsg)" />
                                   </AreaChart>
                               </ResponsiveContainer>
                           </div>
                           
                           <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-y-auto">
                               <h3 className="font-bold mb-4">Recent Signups</h3>
                               <div className="space-y-4">
                                   {users.slice(0, 5).map(u => (
                                       <div key={u.id} className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                               {u.full_name?.[0] || 'U'}
                                           </div>
                                           <div className="flex-1">
                                               <div className="text-sm font-bold">{u.full_name || 'Anonymous'}</div>
                                               <div className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</div>
                                           </div>
                                           <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.plan === 'pro' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{u.plan}</div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {/* TAB: USERS */}
               {activeTab === 'users' && (
                   <div className="space-y-4">
                       <div className="flex gap-4 mb-4">
                           <div className="relative flex-1">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                               <input 
                                   type="text" 
                                   placeholder="Search users..." 
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                                   className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none focus:border-indigo-500"
                               />
                           </div>
                       </div>

                       <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 font-medium">
                                   <tr>
                                       <th className="p-4">User</th>
                                       <th className="p-4">Plan</th>
                                       <th className="p-4">Created</th>
                                       <th className="p-4">Status</th>
                                       <th className="p-4 text-right">Actions</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {filteredUsers.map(user => (
                                       <tr key={user.id} className="border-t border-zinc-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                           <td className="p-4">
                                               <div className="font-bold">{user.full_name || 'No Name'}</div>
                                               <div className="text-xs text-gray-400 font-mono">{user.id.substring(0, 8)}...</div>
                                           </td>
                                           <td className="p-4">
                                               <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.plan === 'pro' ? 'bg-amber-100 text-amber-600' : user.plan === 'plus' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                   {user.plan}
                                               </span>
                                           </td>
                                           <td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                           <td className="p-4">
                                               {user.is_banned ? (
                                                   <span className="flex items-center gap-1 text-red-500 font-bold text-xs"><Ban size={12}/> Banned</span>
                                               ) : (
                                                   <span className="flex items-center gap-1 text-green-500 font-bold text-xs"><CheckCircle size={12}/> Active</span>
                                               )}
                                           </td>
                                           <td className="p-4 flex justify-end gap-2">
                                               <button onClick={() => handleImpersonate(user.id, user.full_name || 'User')} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-500 rounded-lg" title="View Data"><Eye size={16}/></button>
                                               <button onClick={() => handleResetHistory(user.id)} className="p-2 hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-500 rounded-lg" title="Reset History"><RefreshCw size={16}/></button>
                                               <button onClick={() => handleBanUser(user.id, user.is_banned)} className={`p-2 rounded-lg ${user.is_banned ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-500'}`} title={user.is_banned ? 'Unban' : 'Ban'}>
                                                   {user.is_banned ? <CheckCircle size={16}/> : <Ban size={16}/>}
                                               </button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                           {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
                       </div>
                   </div>
               )}

                {/* TAB: ANNOUNCEMENTS */}
                {activeTab === 'announcements' && (
                   <div className="space-y-6 max-w-2xl">
                       <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                           <h3 className="font-bold mb-4">Create Announcement</h3>
                           <textarea 
                               className="w-full bg-gray-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl p-4 min-h-[100px] outline-none focus:border-indigo-500 mb-4"
                               placeholder="Type your message to all users..."
                               value={newAnnouncement}
                               onChange={e => setNewAnnouncement(e.target.value)}
                           />
                           <div className="flex justify-end">
                               <Button onClick={handlePostAnnouncement} icon={Bell}>Post Now</Button>
                           </div>
                       </div>

                       <div className="space-y-2">
                           <h3 className="font-bold text-sm uppercase text-gray-500">Active Announcements</h3>
                           {announcements.map(a => (
                               <div key={a.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/10">
                                   <div className="flex items-start gap-3">
                                       <Bell size={18} className="text-indigo-500 mt-1 shrink-0"/>
                                       <div>
                                           <p className="font-medium text-sm">{a.message}</p>
                                           <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                                       </div>
                                   </div>
                                   <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                               </div>
                           ))}
                           {announcements.length === 0 && <p className="text-gray-400 italic text-sm">No active announcements.</p>}
                       </div>
                   </div>
               )}

               {/* TAB: KEYS */}
               {activeTab === 'keys' && (
                   <div className="max-w-2xl space-y-6">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Generate Pro Key</h3>
                                <p className="text-sm text-gray-500">Create a one-time use key for Pro plan access.</p>
                            </div>
                            <Button onClick={generateKey} className="bg-emerald-600 hover:bg-emerald-500" icon={Key}>Generate</Button>
                        </div>

                        <div className="space-y-2">
                            {generatedKeys.map((k, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <code className="font-mono font-bold text-indigo-500">{k.code}</code>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${k.isUsed ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>{k.isUsed ? 'Used' : 'Active'}</span>
                                        <button onClick={() => {navigator.clipboard.writeText(k.code); addToast("Copied", "success")}} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400"><Copy size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </div>
               )}

           </div>

           {/* Session Viewer Modal */}
           {viewingUserSessions && (
               <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                   <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                       <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                           <h3 className="font-bold flex items-center gap-2"><Eye size={18}/> Viewing: {viewingUserName}</h3>
                           <button onClick={() => setViewingUserSessions(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><X size={20}/></button>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-black/50">
                           {viewingUserSessions.map(s => (
                               <div key={s.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                   <div className="font-bold text-sm mb-2 text-indigo-500">{s.title} <span className="text-gray-400 font-normal text-xs ml-2">({new Date(s.lastModified).toLocaleDateString()})</span></div>
                                   <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-black/20 rounded-lg">
                                       {s.messages.map(m => (
                                           <div key={m.id} className={`text-sm p-2 rounded-lg ${m.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900/30 ml-8' : 'bg-white dark:bg-zinc-700 mr-8'}`}>
                                               <span className="font-bold text-[10px] block opacity-50 mb-1 uppercase">{m.role}</span>
                                               {m.text}
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           ))}
                           {viewingUserSessions.length === 0 && <p className="text-center text-gray-500">No history available.</p>}
                       </div>
                   </div>
               </div>
           )}

        </div>
      );
    }

    return null;
};
