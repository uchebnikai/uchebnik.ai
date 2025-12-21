
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ChevronRight, Edit2, Save, MoreHorizontal, Database, 
  Terminal, Calendar, ArrowUpRight, ArrowLeft, Mail,
  Clock, Hash, AlertTriangle, Check, Layers, DollarSign,
  TrendingUp, TrendingDown, PieChart, Wallet, CreditCard,
  Settings, HelpCircle, ExternalLink, Cloud
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  usage: number; // Daily Image Count
  rawSettings: any;
  updatedAt: string;
}

interface FinancialData {
    balance: number; // in cents
    pending: number; // in cents
    currency: string;
    totalGrossRecent: number; // in cents
    mrr: number; // in cents
    googleCloudCost: number; // in cents
    costSource: 'estimate' | 'google_api_connected';
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

// Cost Constants (Estimates based on Gemini pricing)
const COST_PER_IMAGE = 0.004; 
const COST_PER_MSG_AVG = 0.0005; 

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
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | 'users' | 'finance'>('dashboard');
    const [dbKeys, setDbKeys] = useState<any[]>([]);
    const [dbUsers, setDbUsers] = useState<AdminUser[]>([]);
    const [financials, setFinancials] = useState<FinancialData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>('pro');
    const [searchQuery, setSearchQuery] = useState('');
    const [showRawData, setShowRawData] = useState<string | null>(null);
    
    // Manual Cost Override State
    const [manualCost, setManualCost] = useState<number | null>(null);
    const [isEditingCost, setIsEditingCost] = useState(false);
    const [tempCostInput, setTempCostInput] = useState('');

    // Filtering
    const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'plus' | 'pro'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // User Details & Editing
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string;
        plan: UserPlan;
        streak: number;
        usage: number;
    } | null>(null);

    useEffect(() => {
        if (showAdminPanel) {
            fetchData();
            // Load manual cost from local storage
            const savedCost = localStorage.getItem('uchebnik_admin_manual_cost');
            if (savedCost) setManualCost(parseFloat(savedCost));
        }
    }, [showAdminPanel, activeTab]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            // Fetch Users
            if (activeTab === 'users' || activeTab === 'dashboard' || activeTab === 'finance') {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(100); 
                
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

            // Fetch Finance
            if (activeTab === 'finance' || activeTab === 'dashboard') {
                const { data, error } = await supabase.functions.invoke('get-financial-stats');
                if (!error && data) {
                    setFinancials(data);
                } else {
                    console.log("Stripe fetch skipped or failed");
                }
            }

        } catch (e) {
            console.error("Admin Fetch Error:", e);
        } finally {
            setLoadingData(false);
        }
    };

    const handleGenerate = () => {
        generateKey(selectedPlan);
        setTimeout(fetchData, 1000);
        addToast(`Генериран ключ за ${selectedPlan.toUpperCase()}`, 'success');
    };

    const handleSaveCost = () => {
        const val = parseFloat(tempCostInput);
        if (!isNaN(val) && val >= 0) {
            setManualCost(val);
            localStorage.setItem('uchebnik_admin_manual_cost', val.toString());
            setIsEditingCost(false);
            addToast('Разходите са обновени ръчно', 'success');
        } else {
            addToast('Моля въведете валидно число', 'error');
        }
    };

    const handleClearManualCost = () => {
        setManualCost(null);
        localStorage.removeItem('uchebnik_admin_manual_cost');
        setIsEditingCost(false);
        addToast('Върнато към автоматична оценка', 'info');
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser || !editForm) return;

        try {
            const currentSettings = selectedUser.rawSettings || {};
            const updatedSettings = {
                ...currentSettings,
                userName: editForm.name,
                plan: editForm.plan,
                stats: {
                    ...(currentSettings.stats || {}),
                    streak: editForm.streak,
                    dailyImageCount: editForm.usage
                }
            };

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    settings: updatedSettings, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            const updatedUser: AdminUser = {
                ...selectedUser,
                name: editForm.name,
                plan: editForm.plan,
                streak: editForm.streak,
                usage: editForm.usage,
                rawSettings: updatedSettings
            };

            setDbUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser); 
            addToast('Промените са запазени успешно!', 'success');
        } catch (e) {
            console.error("Update Error:", e);
            addToast('Грешка при запазване на промените.', 'error');
        }
    };

    const handleUserClick = (user: AdminUser) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            plan: user.plan,
            streak: user.streak,
            usage: user.usage
        });
    };

    // Calculate Stats
    const totalUsers = dbUsers.length;
    
    // --- Financial Calculations ---
    const calculateEstimates = () => {
        const totalDailyImages = dbUsers.reduce((acc, user) => acc + (user.usage || 0), 0);
        const estimatedMonthlyImages = totalDailyImages * 30;
        const imageCost = estimatedMonthlyImages * COST_PER_IMAGE;
        
        const activeCount = dbUsers.filter(u => {
            const d = new Date(u.updatedAt);
            const now = new Date();
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        }).length;

        const estimatedDailyMessages = (activeCount || 1) * 15; 
        const estimatedMonthlyMessages = estimatedDailyMessages * 30;
        const textCost = estimatedMonthlyMessages * COST_PER_MSG_AVG;

        return {
            estimatedTotal: imageCost + textCost
        };
    };

    const estimates = calculateEstimates();
    const revenue = financials ? financials.mrr / 100 : 0; 
    
    // Cost Logic
    // 1. Manual Input (Highest Priority)
    // 2. Google Cloud API (If connected and > 0)
    // 3. Algorithm Estimate (Fallback)
    
    let finalCost = 0;
    let costLabel = "ESTIMATE";
    let costColor = "text-red-400";

    if (manualCost !== null) {
        finalCost = manualCost;
        costLabel = "MANUAL";
    } else if (financials?.costSource === 'google_api_connected') {
        // If API is connected but returns 0 (likely due to no BigQuery), fall back to estimate but show status
        if (financials.googleCloudCost > 0) {
            finalCost = financials.googleCloudCost / 100;
            costLabel = "CLOUD SYNC";
            costColor = "text-blue-400";
        } else {
            finalCost = estimates.estimatedTotal;
            costLabel = "ESTIMATE (GCP LINKED)";
        }
    } else {
        finalCost = estimates.estimatedTotal;
    }

    const profit = revenue - finalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const chartData = [
        { name: 'Revenue', value: revenue, color: '#10b981' }, 
        { name: 'Costs', value: finalCost, color: '#ef4444' },
        { name: 'Profit', value: profit, color: profit >= 0 ? '#6366f1' : '#f59e0b' },
    ];

    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
          <div className="bg-[#09090b]/80 border border-white/10 w-full max-w-sm p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-7xl h-[90vh] bg-[#09090b]/90 border border-white/10 rounded-[32px] shadow-2xl flex overflow-hidden backdrop-blur-2xl relative">
             
             {/* Raw Data Modal */}
             {showRawData && (
                 <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setShowRawData(null)}>
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
             <div className="w-72 bg-black/20 border-r border-white/5 flex flex-col p-6">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Shield size={18} fill="currentColor"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm">Admin Panel</h2>
                        <div className="text-[10px] text-zinc-500 font-mono">v2.4 • Connected</div>
                    </div>
                </div>
                
                <nav className="space-y-2 flex-1">
                    <button onClick={() => {setActiveTab('dashboard'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity size={18}/> Overview
                    </button>
                    <button onClick={() => {setActiveTab('finance'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'finance' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <DollarSign size={18}/> Finance (P&L)
                    </button>
                    <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Users size={18}/> Users
                    </button>
                    <button onClick={() => {setActiveTab('keys'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Key size={18}/> Access Keys
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <button onClick={() => setShowAdminPanel(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <X size={18}/> Logout
                    </button>
                </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-900/30 to-black/30">
                 {/* Header */}
                 <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/10 backdrop-blur-sm">
                     <div className="flex items-center gap-4">
                         {selectedUser && (
                             <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                                 <ArrowLeft size={20}/>
                             </button>
                         )}
                         <div>
                             <h3 className="text-xl font-bold text-white capitalize">{selectedUser ? selectedUser.name : activeTab}</h3>
                             <p className="text-xs text-zinc-500 mt-0.5">{selectedUser ? 'Viewing User Details' : 'Manage your application data'}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Refresh Data">
                             <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/>
                         </button>
                     </div>
                 </div>

                 {/* Content Scroll Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                     
                     {/* USER DETAILS VIEW */}
                     {selectedUser && editForm ? (
                         <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right fade-in duration-300">
                             {/* ... (User Detail View Code) ... */}
                             <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex items-center gap-8 shadow-xl">
                                 <div 
                                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-indigo-500/20"
                                    style={{ backgroundColor: selectedUser.theme }}
                                 >
                                     {selectedUser.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="flex-1">
                                     <h2 className="text-3xl font-bold text-white mb-2">{selectedUser.name}</h2>
                                     <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                                         <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-lg border border-white/5"><Hash size={12}/> ID: {selectedUser.id}</span>
                                     </div>
                                     <div className="flex items-center gap-4">
                                         <button 
                                            onClick={() => setShowRawData(JSON.stringify(selectedUser.rawSettings, null, 2))}
                                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                         >
                                             <Database size={12}/> View Raw JSON
                                         </button>
                                     </div>
                                 </div>
                                 <div className="text-right space-y-2">
                                     <Button onClick={handleSaveUserChanges} icon={Save} className="bg-white text-black hover:bg-zinc-200">Save Changes</Button>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                 {/* Edit Details */}
                                 <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-5">
                                     <h4 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-zinc-500"/> Edit Profile</h4>
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Display Name</label>
                                         <input 
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Subscription Plan</label>
                                         <div className="grid grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
                                             {(['free', 'plus', 'pro'] as const).map(plan => (
                                                 <button
                                                    key={plan}
                                                    onClick={() => setEditForm({...editForm, plan})}
                                                    className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${editForm.plan === plan 
                                                        ? (plan === 'pro' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : plan === 'plus' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-zinc-600 text-white')
                                                        : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                 >
                                                     {plan}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                                 {/* Edit Stats */}
                                 <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-5">
                                     <h4 className="text-lg font-bold text-white flex items-center gap-2"><Activity size={18} className="text-zinc-500"/> Usage Stats</h4>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Daily Streak</label>
                                             <input 
                                                type="number"
                                                value={editForm.streak}
                                                onChange={(e) => setEditForm({...editForm, streak: parseInt(e.target.value) || 0})}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-colors"
                                             />
                                         </div>
                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Images Used</label>
                                             <input 
                                                type="number"
                                                value={editForm.usage}
                                                onChange={(e) => setEditForm({...editForm, usage: parseInt(e.target.value) || 0})}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <>
                             {/* DASHBOARD & FINANCE COMBINED VIEW */}
                             {(activeTab === 'dashboard' || activeTab === 'finance') && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     {/* Summary Cards */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         
                                         {/* MONEY IN (REVENUE) */}
                                         <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-4 text-emerald-400">
                                                     <div className="p-2 bg-emerald-500/20 rounded-xl"><DollarSign size={24}/></div>
                                                     <span className="font-bold uppercase tracking-wider text-xs">Money In (MRR)</span>
                                                 </div>
                                                 <div className="text-5xl font-black text-white tracking-tight">€{revenue.toFixed(2)}</div>
                                                 <div className="text-sm text-emerald-400/60 mt-2 font-medium">Monthly Recurring Revenue</div>
                                             </div>
                                         </div>

                                         {/* MONEY OUT (COSTS) - With Manual Override */}
                                         <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center justify-between mb-4 text-red-400">
                                                     <div className="flex items-center gap-3">
                                                         <div className="p-2 bg-red-500/20 rounded-xl"><TrendingDown size={24}/></div>
                                                         <span className="font-bold uppercase tracking-wider text-xs">Money Out (Cost)</span>
                                                     </div>
                                                     <button 
                                                        onClick={() => { setIsEditingCost(true); setTempCostInput(finalCost.toString()); }}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors opacity-0 group-hover:opacity-100" 
                                                        title="Set Actual Cost"
                                                     >
                                                         <Edit2 size={16}/>
                                                     </button>
                                                 </div>

                                                 {isEditingCost ? (
                                                     <div className="flex gap-2 items-center animate-in fade-in">
                                                         <input 
                                                            type="number" 
                                                            value={tempCostInput}
                                                            onChange={e => setTempCostInput(e.target.value)}
                                                            className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-2xl font-bold text-white outline-none focus:border-red-500"
                                                            placeholder="0.00"
                                                            autoFocus
                                                         />
                                                         <button onClick={handleSaveCost} className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl"><Check size={20}/></button>
                                                         <button onClick={() => setIsEditingCost(false)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"><X size={20}/></button>
                                                         <button onClick={handleClearManualCost} className="p-3 bg-white/10 hover:bg-white/20 text-yellow-500 rounded-xl" title="Reset to Auto"><RefreshCw size={20}/></button>
                                                     </div>
                                                 ) : (
                                                     <>
                                                         <div className="text-5xl font-black text-white tracking-tight">€{finalCost.toFixed(2)}</div>
                                                         <div className="flex items-center gap-2 mt-2">
                                                             <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${costLabel.includes('CLOUD') ? 'bg-blue-500/20 text-blue-400' : manualCost ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400'}`}>
                                                                 {costLabel}
                                                             </span>
                                                             <span className={`text-sm font-medium ${costColor}`}>{costLabel === 'MANUAL' ? 'Corrected by Admin' : (costLabel.includes('CLOUD') ? 'Synced via GCP' : 'Based on usage')}</span>
                                                         </div>
                                                     </>
                                                 )}
                                             </div>
                                         </div>

                                         {/* NET PROFIT */}
                                         <div className={`p-8 rounded-[32px] relative overflow-hidden border ${profit >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                             <div className="relative z-10">
                                                 <div className={`flex items-center gap-3 mb-4 ${profit >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>
                                                     <div className={`p-2 rounded-xl ${profit >= 0 ? 'bg-indigo-500/20' : 'bg-orange-500/20'}`}><Wallet size={24}/></div>
                                                     <span className="font-bold uppercase tracking-wider text-xs">Net Profit</span>
                                                 </div>
                                                 <div className={`text-5xl font-black tracking-tight ${profit >= 0 ? 'text-white' : 'text-orange-500'}`}>€{profit.toFixed(2)}</div>
                                                 <div className={`text-sm mt-2 font-medium ${profit >= 0 ? 'text-indigo-400/60' : 'text-orange-400/60'}`}>Margin: {margin.toFixed(1)}%</div>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Charts */}
                                     <div className="h-80 w-full bg-white/5 border border-white/5 rounded-3xl p-8">
                                         <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-500">Financial Overview</h4>
                                         <ResponsiveContainer width="100%" height="100%">
                                             <BarChart data={chartData} layout="vertical" margin={{top: 0, right: 30, left: 30, bottom: 0}}>
                                                 <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                                 <XAxis type="number" stroke="#666" tick={{fontSize: 10}} hide/>
                                                 <YAxis type="category" dataKey="name" stroke="#999" width={100} tick={{fontSize: 14, fontWeight: 'bold', fill: '#fff'}} axisLine={false} tickLine={false}/>
                                                 <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl">
                                                                <p className="text-white font-bold">{payload[0].payload.name}: €{Number(payload[0].value).toFixed(2)}</p>
                                                            </div>
                                                        );
                                                        }
                                                        return null;
                                                    }}
                                                 />
                                                 <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                                                     {chartData.map((entry, index) => (
                                                         <Cell key={`cell-${index}`} fill={entry.color} />
                                                     ))}
                                                 </Bar>
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>

                                     {/* Instruction for Cost Accuracy */}
                                     <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
                                         <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 shrink-0"><Cloud size={24}/></div>
                                         <div>
                                             <h4 className="font-bold text-white mb-1">Automate Costs with Google Cloud</h4>
                                             <p className="text-sm text-gray-400 leading-relaxed mb-3">
                                                 To get real-time cost tracking, create a <strong>Google Cloud Service Account</strong> with "Billing Account Viewer" access and add the JSON key to your Supabase Secrets as <code>GOOGLE_SERVICE_ACCOUNT</code>. Also set <code>GOOGLE_BILLING_ACCOUNT_ID</code>.
                                             </p>
                                             <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-white transition-colors bg-blue-500/10 hover:bg-blue-500/30 px-3 py-2 rounded-lg">
                                                 Go to Google Cloud Billing <ExternalLink size={12}/>
                                             </a>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* KEYS MANAGEMENT */}
                             {activeTab === 'keys' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     {/* Generator Card */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"/>
                                         <div className="flex-1 relative z-10">
                                             <h4 className="text-2xl font-black text-white mb-2">Generate Access Key</h4>
                                             <p className="text-zinc-400 text-sm max-w-md">Create new secure promotional keys for user activation.</p>
                                         </div>
                                         <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/5 backdrop-blur-md relative z-10">
                                             <button onClick={() => setSelectedPlan('plus')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'plus' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                                                 <Zap size={16} fill="currentColor"/> Plus
                                             </button>
                                             <button onClick={() => setSelectedPlan('pro')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'pro' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                                                 <Crown size={16} fill="currentColor"/> Pro
                                             </button>
                                         </div>
                                         <Button onClick={handleGenerate} icon={Plus} className="px-8 py-4 bg-white text-black hover:bg-zinc-200 shadow-xl rounded-2xl text-base relative z-10">Generate Key</Button>
                                     </div>

                                     {/* Keys Table */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-lg">
                                         <table className="w-full text-left">
                                             <thead>
                                                 <tr className="border-b border-white/5 bg-black/20">
                                                     <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Key Code</th>
                                                     <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                                                     <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                                     <th className="p-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-white/5">
                                                 {dbKeys.map((k, i) => (
                                                     <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                         <td className="p-5 font-mono text-sm text-indigo-400 font-medium">{k.code}</td>
                                                         <td className="p-5">
                                                             <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${k.plan === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>{k.plan || 'pro'}</span>
                                                         </td>
                                                         <td className="p-5">
                                                             <div className={`flex items-center gap-2 text-xs font-bold ${k.is_used ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                 <div className={`w-2 h-2 rounded-full ${k.is_used ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`}/>
                                                                 {k.is_used ? 'Redeemed' : 'Available'}
                                                             </div>
                                                         </td>
                                                         <td className="p-5 text-right">
                                                             <button onClick={() => {navigator.clipboard.writeText(k.code); addToast('Copied to clipboard', 'success')}} className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-colors">
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
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="flex gap-4">
                                         <div className="flex-1 relative group">
                                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18}/>
                                             <input 
                                                type="text" 
                                                placeholder="Search users..." 
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-lg"
                                             />
                                         </div>
                                         <div className="relative">
                                             <button 
                                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                                className={`h-full px-6 flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold transition-all hover:bg-white/10 ${filterPlan !== 'all' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 'text-zinc-400'}`}
                                             >
                                                 <Filter size={18}/> 
                                                 {filterPlan === 'all' ? 'Filter' : filterPlan.charAt(0).toUpperCase() + filterPlan.slice(1)}
                                             </button>
                                             
                                             {showFilterMenu && (
                                                 <div className="absolute top-full right-0 mt-2 w-40 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                                                     {(['all', 'free', 'plus', 'pro'] as const).map(p => (
                                                         <button 
                                                            key={p}
                                                            onClick={() => { setFilterPlan(p); setShowFilterMenu(false); }}
                                                            className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5 flex items-center justify-between ${filterPlan === p ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                                                         >
                                                             {p}
                                                             {filterPlan === p && <Check size={14}/>}
                                                         </button>
                                                     ))}
                                                 </div>
                                             )}
                                             {showFilterMenu && <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)}/>}
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 gap-4">
                                         {dbUsers
                                            .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .filter(u => filterPlan === 'all' || u.plan === filterPlan)
                                            .map((user) => (
                                             <div 
                                                key={user.id} 
                                                onClick={() => handleUserClick(user)}
                                                className="group bg-white/5 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer shadow-md hover:shadow-xl"
                                             >
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-5">
                                                         <div 
                                                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300"
                                                            style={{ backgroundColor: user.theme }}
                                                         >
                                                             {user.name.charAt(0).toUpperCase()}
                                                         </div>
                                                         <div>
                                                             <div className="flex items-center gap-3 mb-1">
                                                                 <h4 className="font-bold text-white text-lg group-hover:text-indigo-200 transition-colors">{user.name}</h4>
                                                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                                     user.plan === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                                                     user.plan === 'plus' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                                                                     'bg-zinc-800 text-zinc-500 border border-white/5'
                                                                 }`}>
                                                                     {user.plan}
                                                                 </span>
                                                             </div>
                                                             <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                                                                 <span className="flex items-center gap-1"><Hash size={10}/> {user.id.substring(0, 8)}...</span>
                                                                 <span className="w-1 h-1 rounded-full bg-zinc-700"/>
                                                                 <span className="flex items-center gap-1 group-hover:text-emerald-400 transition-colors"><Activity size={10}/> {user.usage} imgs</span>
                                                             </div>
                                                         </div>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all shadow-lg">
                                                             <ChevronRight size={18}/>
                                                         </button>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </>
                     )}
                 </div>
             </div>
           </div>
        </div>
      );
    }

    return null;
};
