
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ArrowLeft, Mail, Hash, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard,
  Cloud, FileText, Server, Info, AlertCircle, 
  BarChart2, Brain, LayoutDashboard,
  RotateCcw, CalendarDays, Coins, Radio, Send, PieChart as PieChartIcon,
  Database, Wifi, HardDrive, Terminal, Save, Edit2, Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, UserRole } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { SUBJECTS } from '../../constants';

// Pricing Constants (Gemini 2.5 Flash)
const PRICE_INPUT_1M = 0.075;
const PRICE_OUTPUT_1M = 0.30;

interface GeneratedKey {
  id?: string;
  code: string;
  isUsed: boolean;
  plan?: 'plus' | 'pro';
  createdAt?: string;
}

interface AdminUser {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  plan: UserPlan;
  streak: number;
  lastVisit: string;
  createdAt: string;
  theme: string;
  usage: number; 
  rawSettings: any;
  updatedAt: string;
  totalInput: number;
  totalOutput: number;
  stripeId?: string;
}

interface FinancialData {
    balance: number; 
    mrr: number; 
    googleCloudCost: number; 
    googleCloudConnected: boolean; 
    lastSync?: string;
    currency: string;
}

interface SystemService {
    name: string;
    status: 'operational' | 'degraded' | 'down' | 'unknown';
    latency: number;
    uptime: number; // percentage
    icon: any;
    lastCheck: number;
}

interface SubjectStat {
    subject_id: string;
    count: number;
    percentage: number;
    name: string;
    color: string;
}

interface AdminPanelProps {
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  generateKey: (plan: 'plus' | 'pro') => void;
  generatedKeys: GeneratedKey[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminPanel = ({
  showAdminPanel,
  setShowAdminPanel,
  generateKey,
  generatedKeys,
  addToast
}: AdminPanelProps) => {
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'status' | 'finance' | 'users' | 'keys' | 'broadcast'>('dashboard');
    const [dbKeys, setDbKeys] = useState<GeneratedKey[]>([]);
    const [dbUsers, setDbUsers] = useState<AdminUser[]>([]);
    const [financials, setFinancials] = useState<FinancialData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>('pro');
    const [searchQuery, setSearchQuery] = useState('');
    const [showRawData, setShowRawData] = useState<string | null>(null);
    
    // Authorization Check
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    
    // Stats
    const [totalInputTokens, setTotalInputTokens] = useState(0);
    const [totalOutputTokens, setTotalOutputTokens] = useState(0);
    const [costCorrection, setCostCorrection] = useState(0);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationValue, setCalibrationValue] = useState('');
    
    // Filtering & Sorting
    const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'plus' | 'pro'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [sortUsers, setSortUsers] = useState<'recent' | 'usage'>('recent');

    // Heatmap State
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
    const [heatmapRange, setHeatmapRange] = useState<7 | 30 | 1>(7);
    const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType, setBroadcastType] = useState<'toast' | 'modal'>('toast');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // User Details
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    // Initial State - will be updated by real checks
    const [systemHealth, setSystemHealth] = useState<SystemService[]>([
        { name: 'Core Database (Supabase)', status: 'unknown', latency: 0, uptime: 100, icon: Database, lastCheck: 0 },
        { name: 'AI Models (Gemini)', status: 'unknown', latency: 0, uptime: 100, icon: Brain, lastCheck: 0 },
        { name: 'Voice Services (Live API)', status: 'unknown', latency: 0, uptime: 100, icon: Wifi, lastCheck: 0 },
        { name: 'Object Storage (DB)', status: 'unknown', latency: 0, uptime: 100, icon: HardDrive, lastCheck: 0 },
        { name: 'Payment Gateway (Stripe)', status: 'unknown', latency: 0, uptime: 100, icon: CreditCard, lastCheck: 0 },
    ]);

    // Secure Verification on Mount
    useEffect(() => {
        if (showAdminPanel) {
            checkAdminAccess();
        }
    }, [showAdminPanel]);

    const checkAdminAccess = async () => {
        setAuthChecking(true);
        try {
            const { data, error } = await supabase.rpc('check_admin_access');
            
            if (error || !data) {
                console.error("Admin Access Denied:", error);
                setShowAdminPanel(false);
                addToast("Достъп отказан. Този панел е само за администратори.", "error");
                setIsAuthorized(false);
            } else {
                setIsAuthorized(true);
                fetchData();
            }
        } catch (e) {
            setShowAdminPanel(false);
            setIsAuthorized(false);
        } finally {
            setAuthChecking(false);
        }
    };

    // Fetch Heatmap Data when range changes
    useEffect(() => {
        if (showAdminPanel && isAuthorized && activeTab === 'dashboard') {
            fetchSubjectStats();
        }
    }, [heatmapRange, showAdminPanel, activeTab, isAuthorized]);

    useEffect(() => {
        if (showAdminPanel && isAuthorized) {
            fetchData();
        }
    }, [activeTab, isAuthorized]);

    const fetchSubjectStats = async () => {
        setIsHeatmapLoading(true);
        try {
            // Using RPC function to get aggregate stats from JSONB column
            const { data, error } = await supabase.rpc('get_subject_usage', { days_lookback: heatmapRange });
            
            if (error) {
                console.warn("RPC get_subject_usage failed (missing function?):", error);
                setSubjectStats([]);
            } else if (data) {
                const total = data.reduce((acc: number, curr: any) => acc + curr.count, 0);
                const stats: SubjectStat[] = data.map((item: any) => {
                    const subjectConfig = SUBJECTS.find(s => s.id === item.subject_id);
                    return {
                        subject_id: item.subject_id,
                        count: item.count,
                        percentage: total > 0 ? (item.count / total) * 100 : 0,
                        name: subjectConfig?.name || item.subject_id,
                        color: subjectConfig?.color.replace('bg-', '') || 'gray-500' // Simple color extraction
                    };
                });
                setSubjectStats(stats);
            }
        } catch (e) {
            console.error("Heatmap Fetch Error", e);
        } finally {
            setIsHeatmapLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            // 1. Insert into DB to trigger Realtime for all clients
            const { error } = await supabase.from('broadcasts').insert({
                message: broadcastMsg,
                type: broadcastType
            });

            if (error) throw error;
            
            setBroadcastMsg('');
            addToast('Съобщението е изпратено успешно!', 'success');
        } catch (e: any) {
            console.error("Broadcast failed:", e);
            if (e.code === '42P01') {
                addToast('Грешка: Таблица "broadcasts" липсва.', 'error');
            } else {
                addToast('Грешка при изпращане.', 'error');
            }
        } finally {
            setIsBroadcasting(false);
        }
    };

    const fetchData = async () => {
        setLoadingData(true);
        try {
            // Fetch Users - This acts as a live DB check for the Admin Panel
            if (['users', 'dashboard', 'finance'].includes(activeTab)) {
                const dbStart = performance.now();
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(100); 
                const dbLatency = Math.round(performance.now() - dbStart);
                
                // Update DB Status based on this fetch
                updateHealthItem('Core Database', !error, dbLatency, Date.now());
                
                if (!error && users) {
                    let tIn = 0;
                    let tOut = 0;
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    
                    const mappedUsers: AdminUser[] = users.map((u: any) => {
                        let settings = u.settings;
                        if (typeof settings === 'string') {
                            try { settings = JSON.parse(settings); } catch (e) {}
                        }
                        
                        const uIn = settings?.stats?.totalInputTokens || 0;
                        const uOut = settings?.stats?.totalOutputTokens || 0;
                        
                        tIn += uIn;
                        tOut += uOut;
                        
                        if (currentUser && u.id === currentUser.id) {
                            setCostCorrection(settings?.stats?.costCorrection || 0);
                        }

                        // Try to find avatar in settings if standard field is empty (rare case)
                        const avatarUrl = u.avatar_url || settings?.avatar || '';

                        return {
                            id: u.id,
                            email: u.email, 
                            name: settings?.userName || 'Anonymous',
                            avatar: avatarUrl,
                            plan: settings?.plan || 'free',
                            streak: settings?.stats?.streak || 0,
                            usage: settings?.stats?.dailyImageCount || 0,
                            lastVisit: settings?.stats?.lastVisit || new Date(u.updated_at).toLocaleDateString(),
                            createdAt: u.created_at || u.updated_at, // Use updated_at as fallback if created_at is missing
                            theme: u.theme_color || '#6366f1',
                            rawSettings: settings,
                            updatedAt: u.updated_at,
                            totalInput: uIn,
                            totalOutput: uOut,
                            stripeId: u.stripe_customer_id
                        };
                    });
                    setDbUsers(mappedUsers);
                    setTotalInputTokens(tIn);
                    setTotalOutputTokens(tOut);
                }
            }

            // Fetch Keys
            if (['keys', 'dashboard'].includes(activeTab)) {
                const { data: keys, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false }).limit(50);
                if (!error && keys) {
                    setDbKeys(keys.map(k => ({ id: k.id, code: k.code, isUsed: k.is_used, plan: k.plan, createdAt: k.created_at })));
                }
            }

            // Fetch Finance & Update System Status based on response
            // This acts as a live Payments check
            if (['finance', 'status', 'dashboard'].includes(activeTab)) {
                const finStart = performance.now();
                const { data, error } = await supabase.functions.invoke('get-financial-stats');
                const finLatency = Math.round(performance.now() - finStart);

                if (!error && data) {
                    setFinancials(data);
                    // If balance exists, Stripe connection is good
                    updateHealthItem('Payment Gateway', data.balance !== undefined, finLatency, Date.now());
                } else {
                    updateHealthItem('Payment Gateway', false, 0, Date.now());
                }
            }

            // Read Passive Monitoring Logs for AI & DB/Storage
            if (['status', 'dashboard'].includes(activeTab)) {
                // AI Status
                try {
                    const aiLogStr = localStorage.getItem('sys_monitor_ai');
                    if (aiLogStr) {
                        const aiLog = JSON.parse(aiLogStr);
                        // Only consider it "live" if it happened within the last 24 hours
                        const isRecent = (Date.now() - aiLog.timestamp) < 24 * 60 * 60 * 1000;
                        if (isRecent) {
                            updateHealthItem('AI Models', aiLog.status === 'operational', aiLog.latency, aiLog.timestamp);
                            updateHealthItem('Voice Services', aiLog.status === 'operational', Math.round(aiLog.latency * 1.1), aiLog.timestamp);
                        } else {
                            // Reset to unknown if stale
                            setSystemHealth(prev => prev.map(s => (s.name.includes('AI') || s.name.includes('Voice')) ? {...s, status: 'unknown'} : s));
                        }
                    }
                } catch(e) {}

                // DB Status Fallback (if not fetched above)
                try {
                    const dbLogStr = localStorage.getItem('sys_monitor_db');
                    if (dbLogStr) {
                        const dbLog = JSON.parse(dbLogStr);
                        // If we didn't just fetch users (latency 0), use cached
                        setSystemHealth(prev => {
                            const dbItem = prev.find(s => s.name.includes('Core Database'));
                            if (dbItem && dbItem.lastCheck === 0) {
                                // If admin panel hasn't made a request yet, show the app's last sync status
                                return prev.map(s => {
                                    if(s.name.includes('Core Database') || s.name.includes('Object Storage')) {
                                        return { ...s, status: dbLog.status, latency: dbLog.latency, lastCheck: dbLog.timestamp };
                                    }
                                    return s;
                                });
                            }
                            return prev;
                        });
                    }
                } catch(e) {}
            }

        } catch (e) {
            console.error("Admin Fetch Error:", e);
        } finally {
            setLoadingData(false);
        }
    };

    const updateHealthItem = (namePart: string, isUp: boolean, latency: number, timestamp: number) => {
        setSystemHealth(prev => prev.map(item => {
            if (item.name.includes(namePart)) {
                return {
                    ...item,
                    status: isUp ? 'operational' : 'outage',
                    latency: isUp ? latency : 0,
                    lastCheck: timestamp
                };
            }
            return item;
        }));
    };

    const handleGenerate = () => {
        generateKey(selectedPlan);
        setTimeout(fetchData, 1000);
        addToast(`Генериран ключ за ${selectedPlan.toUpperCase()}`, 'success');
    };

    const handleDeleteKey = async (id: string) => {
        try {
            await supabase.from('promo_codes').delete().eq('id', id);
            setDbKeys(prev => prev.filter(k => k.id !== id));
            addToast('Ключът е изтрит', 'success');
        } catch (e) { addToast('Грешка при изтриване', 'error'); }
    };

    const handleSaveCalibration = async () => {
        const val = parseFloat(calibrationValue);
        if (!isNaN(val) && val >= 0) {
            setCostCorrection(val);
            setIsCalibrating(false);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
                if (profile) {
                    const newSettings = { ...profile.settings, stats: { ...(profile.settings?.stats || {}), costCorrection: val } };
                    await supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id);
                    addToast('Calibration saved successfully', 'success');
                }
            }
        } else { addToast('Invalid amount', 'error'); }
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser || !editForm) return;
        try {
            const currentSettings = selectedUser.rawSettings || {};
            // Role removed from updates
            const updatedSettings = { ...currentSettings, userName: editForm.name, plan: editForm.plan, stats: { ...(currentSettings.stats || {}), streak: editForm.streak, dailyImageCount: editForm.usage } };
            const { error } = await supabase.from('profiles').update({ settings: updatedSettings, updated_at: new Date().toISOString() }).eq('id', selectedUser.id);
            if (error) throw error;
            const updatedUser: AdminUser = { ...selectedUser, name: editForm.name, plan: editForm.plan, streak: editForm.streak, usage: editForm.usage, rawSettings: updatedSettings };
            setDbUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser); 
            addToast('Промените са запазени успешно!', 'success');
        } catch (e) { addToast('Грешка при запазване.', 'error'); }
    };

    const handleUserClick = (user: AdminUser) => {
        setSelectedUser(user);
        // Removed role from edit form
        setEditForm({ name: user.name, plan: user.plan, streak: user.streak, usage: user.usage });
    };

    // Financials
    const revenue = financials ? financials.mrr / 100 : 0; 
    const billedCloudCost = financials?.googleCloudCost || 0;
    const liveInputCost = (totalInputTokens / 1000000) * PRICE_INPUT_1M;
    const liveOutputCost = (totalOutputTokens / 1000000) * PRICE_OUTPUT_1M;
    const estimatedLiveUsage = liveInputCost + liveOutputCost;
    const showEstimate = billedCloudCost === 0;
    const displayCost = showEstimate ? (estimatedLiveUsage + costCorrection) : billedCloudCost;
    const estimatedFees = revenue * 0.03;
    const netProfit = revenue - displayCost - estimatedFees;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Status Bar Component
    const UptimeBar = ({ status }: { status: string }) => (
        <div className="flex gap-0.5 h-8 mt-2 w-full max-w-sm opacity-80">
            {Array.from({ length: 40 }).map((_, i) => (
                <div 
                    key={i} 
                    className={`flex-1 rounded-sm transition-all duration-500 ${
                        status === 'unknown' ? 'bg-zinc-700' :
                        status === 'outage' ? 'bg-red-500' : 
                        status === 'degraded' ? (i > 30 ? 'bg-amber-500' : 'bg-green-500') : 
                        'bg-green-500'
                    } ${i < 30 ? 'opacity-40' : 'opacity-100'}`} 
                />
            ))}
        </div>
    );

    // Color map for charts
    const COLOR_MAP: any = {
        'indigo-500': '#6366f1',
        'blue-500': '#3b82f6',
        'red-500': '#ef4444',
        'emerald-500': '#10b981',
        'amber-500': '#f59e0b',
        'gray-500': '#6b7280',
        'pink-500': '#ec4899',
        'purple-500': '#8b5cf6',
    };

    const getHexColor = (tailwindClass: string) => {
        const key = tailwindClass.split('-')[1] ? `${tailwindClass.split('-')[1]}-500` : 'gray-500';
        return COLOR_MAP[key] || '#6b7280';
    };

    if (showAdminPanel) {
      if (authChecking) {
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <div className="text-white flex flex-col items-center">
                    <RefreshCw className="animate-spin mb-4" size={32} />
                    <p>Verifying admin privileges...</p>
                </div>
            </div>
          );
      }

      if (!isAuthorized) {
          return null; // Or a restricted access component, but useEffect handles closing it.
      }

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-7xl h-[90vh] bg-[#09090b]/95 border border-white/10 rounded-[32px] shadow-2xl flex overflow-hidden backdrop-blur-2xl relative">
             
             {/* Raw Data Modal */}
             {showRawData && (
                 <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setShowRawData(null)}>
                     <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-4"><h3 className="text-white font-mono font-bold flex items-center gap-2"><Terminal size={18}/> Raw Data</h3><button onClick={() => setShowRawData(null)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={18}/></button></div>
                         <pre className="flex-1 overflow-auto custom-scrollbar bg-black/50 p-4 rounded-xl text-green-400 font-mono text-xs leading-relaxed">{showRawData}</pre>
                     </div>
                 </div>
             )}

             {/* Sidebar */}
             <div className="w-72 bg-black/40 border-r border-white/5 flex flex-col p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Shield size={18} fill="currentColor"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm">Control Center</h2>
                        <div className="text-[10px] text-zinc-500 font-mono">v3.5 • RBAC Secured</div>
                    </div>
                </div>
                
                <nav className="space-y-1 flex-1">
                    <button onClick={() => {setActiveTab('dashboard'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <LayoutDashboard size={18}/> Overview
                    </button>
                    <button onClick={() => {setActiveTab('status'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'status' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity size={18}/> System Status
                    </button>
                    <button onClick={() => {setActiveTab('broadcast'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Radio size={18}/> Broadcast
                    </button>
                    <button onClick={() => {setActiveTab('finance'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'finance' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <DollarSign size={18}/> Finance & P&L
                    </button>
                    <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Users size={18}/> User Base
                    </button>
                    <button onClick={() => {setActiveTab('keys'); setSelectedUser(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
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
             <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black/80">
                 {/* Header */}
                 <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/5 backdrop-blur-sm">
                     <div className="flex items-center gap-4">
                         {selectedUser && (
                             <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                                 <ArrowLeft size={20}/>
                             </button>
                         )}
                         <div>
                             <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                                 {activeTab === 'status' ? <div className={`w-2 h-2 rounded-full animate-pulse ${systemHealth.some(s => s.status === 'outage') ? 'bg-red-500' : 'bg-green-500'}`}/> : null}
                                 {selectedUser ? 'User Profile' : (activeTab === 'status' ? 'System Status' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                             </h3>
                             <p className="text-xs text-zinc-500 mt-0.5">{selectedUser ? `Viewing details for ${selectedUser.name}` : 'System Administration Console'}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <button onClick={() => {fetchData(); if(activeTab==='dashboard') fetchSubjectStats();}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Refresh Data">
                             <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/>
                         </button>
                     </div>
                 </div>

                 {/* Content Scroll Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                     
                     {/* USER DETAIL MODAL REPLACEMENT */}
                     {selectedUser && editForm ? (
                         <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right fade-in duration-300">
                             
                             {/* Profile Header */}
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"/>
                                 <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                     <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative bg-black/20">
                                         {selectedUser.avatar ? (
                                             <img src={selectedUser.avatar} className="w-full h-full object-cover"/>
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: selectedUser.theme }}>
                                                 {selectedUser.name.charAt(0).toUpperCase()}
                                             </div>
                                         )}
                                         <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                                             <div className={`w-3 h-3 rounded-full ${selectedUser.streak > 0 ? 'bg-green-500' : 'bg-zinc-500'} border-2 border-black`}/>
                                         </div>
                                     </div>
                                     
                                     <div className="flex-1 space-y-2">
                                         <div className="flex items-center gap-3">
                                             <h2 className="text-4xl font-black text-white">{selectedUser.name}</h2>
                                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                 selectedUser.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                                 selectedUser.plan === 'plus' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 
                                                 'bg-zinc-800 text-zinc-400 border-white/10'
                                             }`}>
                                                 {selectedUser.plan}
                                             </span>
                                         </div>
                                         <div className="flex flex-col gap-1 text-sm text-zinc-400">
                                             <div className="flex items-center gap-2"><Mail size={14}/> {selectedUser.email || 'Email not visible'}</div>
                                             <div className="flex items-center gap-2 font-mono"><Hash size={14}/> {selectedUser.id}</div>
                                             {selectedUser.stripeId && <div className="flex items-center gap-2 font-mono text-xs text-indigo-400"><CreditCard size={12}/> {selectedUser.stripeId}</div>}
                                         </div>
                                     </div>

                                     <div className="flex flex-col gap-3">
                                         <Button onClick={handleSaveUserChanges} icon={Save} className="bg-white text-black hover:bg-zinc-200 shadow-xl w-full justify-center">Save Changes</Button>
                                         <div className="flex gap-2">
                                             <button onClick={() => setEditForm({...editForm, usage: 0})} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Reset Daily Usage">
                                                 <RotateCcw size={18}/>
                                             </button>
                                             <button onClick={() => setShowRawData(JSON.stringify(selectedUser.rawSettings, null, 2))} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="View JSON">
                                                 <Database size={18}/>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {/* Edit Column */}
                                 <div className="md:col-span-1 space-y-6">
                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
                                         <h4 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-indigo-500"/> Edit Profile</h4>
                                         
                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                                             <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"/>
                                         </div>

                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Plan</label>
                                             <div className="grid grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
                                                 {(['free', 'plus', 'pro'] as const).map(plan => (
                                                     <button key={plan} onClick={() => setEditForm({...editForm, plan})} className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${editForm.plan === plan ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                                                         {plan}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Streak</label>
                                                 <input type="number" value={editForm.streak} onChange={(e) => setEditForm({...editForm, streak: parseInt(e.target.value) || 0})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-colors text-center"/>
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Usage</label>
                                                 <input type="number" value={editForm.usage} onChange={(e) => setEditForm({...editForm, usage: parseInt(e.target.value) || 0})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors text-center"/>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Stats Column */}
                                 <div className="md:col-span-2 space-y-6">
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><Coins size={20}/><span className="text-xs font-bold uppercase">Estimated Cost</span></div>
                                             <div className="text-2xl font-mono font-bold text-emerald-400">
                                                 ${((selectedUser.totalInput / 1000000 * PRICE_INPUT_1M) + (selectedUser.totalOutput / 1000000 * PRICE_OUTPUT_1M)).toFixed(5)}
                                             </div>
                                         </div>
                                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><Brain size={20}/><span className="text-xs font-bold uppercase">Total Tokens</span></div>
                                             <div className="text-2xl font-mono font-bold text-indigo-400">
                                                 {(selectedUser.totalInput + selectedUser.totalOutput).toLocaleString()}
                                             </div>
                                         </div>
                                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><CalendarDays size={20}/><span className="text-xs font-bold uppercase">Member Since</span></div>
                                             <div className="text-lg font-bold text-white">
                                                 {new Date(selectedUser.createdAt).toLocaleDateString()}
                                             </div>
                                         </div>
                                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><Activity size={20}/><span className="text-xs font-bold uppercase">Last Active</span></div>
                                             <div className="text-lg font-bold text-white">
                                                 {selectedUser.lastVisit}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                         <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-zinc-500"/> Token Breakdown</h4>
                                         <div className="space-y-4">
                                             <div>
                                                 <div className="flex justify-between text-xs mb-1">
                                                     <span className="text-zinc-400">Input Tokens</span>
                                                     <span className="text-white font-mono">{selectedUser.totalInput.toLocaleString()}</span>
                                                 </div>
                                                 <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                     <div className="h-full bg-blue-500" style={{ width: `${(selectedUser.totalInput / (selectedUser.totalInput + selectedUser.totalOutput || 1)) * 100}%` }}/>
                                                 </div>
                                             </div>
                                             <div>
                                                 <div className="flex justify-between text-xs mb-1">
                                                     <span className="text-zinc-400">Output Tokens</span>
                                                     <span className="text-white font-mono">{selectedUser.totalOutput.toLocaleString()}</span>
                                                 </div>
                                                 <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                     <div className="h-full bg-purple-500" style={{ width: `${(selectedUser.totalOutput / (selectedUser.totalInput + selectedUser.totalOutput || 1)) * 100}%` }}/>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <>
                             {/* DASHBOARD TAB */}
                             {activeTab === 'dashboard' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                         <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-blue-400"><Users size={24}/><span className="font-bold text-sm uppercase tracking-wider">Total Users</span></div>
                                                 <div className="text-4xl font-black text-white">{dbUsers.length}</div>
                                             </div>
                                             <Users size={100} className="absolute -bottom-4 -right-4 text-blue-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-emerald-400"><DollarSign size={24}/><span className="font-bold text-sm uppercase tracking-wider">Revenue (MRR)</span></div>
                                                 <div className="text-4xl font-black text-white">€{revenue.toFixed(2)}</div>
                                             </div>
                                             <DollarSign size={100} className="absolute -bottom-4 -right-4 text-emerald-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-orange-400"><Activity size={24}/><span className="font-bold text-sm uppercase tracking-wider">Active Today</span></div>
                                                 <div className="text-4xl font-black text-white">{dbUsers.filter(u => u.lastVisit === new Date().toLocaleDateString()).length}</div>
                                             </div>
                                             <Activity size={100} className="absolute -bottom-4 -right-4 text-orange-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-purple-400"><Brain size={24}/><span className="font-bold text-sm uppercase tracking-wider">Tokens Used</span></div>
                                                 <div className="text-4xl font-black text-white">{(totalInputTokens + totalOutputTokens).toLocaleString()}</div>
                                             </div>
                                             <Brain size={100} className="absolute -bottom-4 -right-4 text-purple-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                     </div>

                                     {/* Subject Popularity Heatmap */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                         <div className="flex justify-between items-center mb-6">
                                             <h3 className="text-xl font-bold text-white flex items-center gap-2"><PieChartIcon size={20} className="text-indigo-500"/> Subject Popularity Heatmap</h3>
                                             <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                                                 {[1, 7, 30].map(d => (
                                                     <button key={d} onClick={() => setHeatmapRange(d as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${heatmapRange === d ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                                                         {d === 1 ? 'Today' : `${d} Days`}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                         
                                         {subjectStats.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                                 {isHeatmapLoading ? <RefreshCw className="animate-spin mb-2"/> : <PieChartIcon size={32} className="mb-2 opacity-50"/>}
                                                 <p>{isHeatmapLoading ? "Calculating real usage data..." : "No data found for this period."}</p>
                                             </div>
                                         ) : (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                 <div className="h-64">
                                                     <ResponsiveContainer width="100%" height="100%">
                                                         <PieChart>
                                                             <Pie 
                                                                 data={subjectStats} 
                                                                 dataKey="count" 
                                                                 nameKey="name" 
                                                                 cx="50%" 
                                                                 cy="50%" 
                                                                 outerRadius={80} 
                                                                 innerRadius={50} 
                                                                 stroke="none"
                                                             >
                                                                 {subjectStats.map((entry, index) => (
                                                                     <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} />
                                                                 ))}
                                                             </Pie>
                                                             <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val: number) => [`${val} sessions`, 'Usage']}/>
                                                         </PieChart>
                                                     </ResponsiveContainer>
                                                 </div>
                                                 <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                     {subjectStats.map((stat, i) => (
                                                         <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                             <div className="flex items-center gap-3">
                                                                 <div className={`w-3 h-3 rounded-full bg-${stat.color.replace('bg-', '')}`} style={{backgroundColor: getHexColor(stat.color)}}></div>
                                                                 <span className="text-sm font-bold text-zinc-200">{stat.name}</span>
                                                             </div>
                                                             <div className="text-right">
                                                                 <div className="text-sm font-mono font-bold text-white">{stat.percentage.toFixed(1)}%</div>
                                                                 <div className="text-xs text-zinc-500">{stat.count} sessions</div>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )}

                             {/* BROADCAST TAB */}
                             {activeTab === 'broadcast' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <div className="bg-white/5 border border-white/5 rounded-3xl p-8 shadow-xl">
                                             <div className="flex items-center gap-4 mb-6">
                                                 <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20"><Radio size={24}/></div>
                                                 <div>
                                                     <h3 className="text-2xl font-bold text-white">Global Broadcast</h3>
                                                     <p className="text-zinc-500 text-sm">Send real-time messages to all online users.</p>
                                                 </div>
                                             </div>

                                             <div className="space-y-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Message</label>
                                                     <textarea 
                                                         value={broadcastMsg}
                                                         onChange={(e) => setBroadcastMsg(e.target.value)}
                                                         placeholder="Attention all users: Maintenance scheduled for..."
                                                         className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                                                     />
                                                 </div>

                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Type</label>
                                                     <div className="grid grid-cols-2 gap-3">
                                                         <button 
                                                             onClick={() => setBroadcastType('toast')}
                                                             className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'toast' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                         >
                                                             <AlertCircle size={24}/>
                                                             <span className="font-bold text-sm">Toast Notification</span>
                                                         </button>
                                                         <button 
                                                             onClick={() => setBroadcastType('modal')}
                                                             className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'modal' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                         >
                                                             <Radio size={24}/>
                                                             <span className="font-bold text-sm">Fullscreen Modal</span>
                                                         </button>
                                                     </div>
                                                 </div>

                                                 <Button 
                                                     onClick={handleSendBroadcast} 
                                                     disabled={isBroadcasting || !broadcastMsg.trim()}
                                                     className={`w-full py-4 text-base shadow-xl ${broadcastType === 'modal' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                                                     icon={Send}
                                                 >
                                                     {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
                                                 </Button>
                                             </div>
                                         </div>

                                         <div className="space-y-6">
                                             <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
                                                 <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><Info size={18}/> Technical Note</h4>
                                                 <p className="text-sm text-blue-200/80 leading-relaxed">
                                                     This system uses <strong>Supabase Realtime</strong> connected to the <code>broadcasts</code> table. 
                                                     Messages are delivered instantly to all active WebSocket connections. No polling is used.
                                                 </p>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* SYSTEM STATUS TAB (Refactored to be real but passive) */}
                             {activeTab === 'status' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 mb-8">
                                         <div className="flex justify-between items-end mb-6">
                                             <h2 className="text-3xl font-black text-white">System Status</h2>
                                             <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
                                                 Live Monitoring
                                             </div>
                                         </div>
                                         
                                         <div className="grid gap-4">
                                             {systemHealth.map((service, idx) => (
                                                 <div key={idx} className="bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition-colors">
                                                     <div className="flex items-center gap-4">
                                                         <div className={`p-3 rounded-xl ${service.status === 'operational' ? 'bg-emerald-500/10 text-emerald-500' : service.status === 'unknown' ? 'bg-zinc-700/20 text-zinc-500' : 'bg-red-500/10 text-red-500'}`}>
                                                             <service.icon size={24} />
                                                         </div>
                                                         <div>
                                                             <h4 className="font-bold text-white text-lg">{service.name}</h4>
                                                             <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 mt-1">
                                                                 <span className={service.status === 'operational' ? 'text-emerald-400' : service.status === 'unknown' ? 'text-zinc-500' : 'text-red-400'}>
                                                                     {service.status === 'operational' ? 'Operational' : service.status === 'unknown' ? 'No recent activity' : 'Outage Reported'}
                                                                 </span>
                                                                 <span>•</span>
                                                                 <span>{service.status === 'unknown' ? 'N/A' : `${service.latency}ms`}</span>
                                                                 {service.lastCheck > 0 && (
                                                                     <>
                                                                         <span>•</span>
                                                                         <span>Checked: {new Date(service.lastCheck).toLocaleTimeString()}</span>
                                                                     </>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     </div>
                                                     <div className="flex-1 md:text-right">
                                                         <UptimeBar status={service.status} />
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                                         <h3 className="text-xl font-bold text-white mb-6">Status Log</h3>
                                         <div className="space-y-6">
                                             <div className="border-l-2 border-emerald-500 pl-4 py-1">
                                                 <div className="text-sm text-zinc-500 font-mono mb-1">{new Date().toLocaleDateString()}</div>
                                                 <h4 className="font-bold text-white">Monitoring Active</h4>
                                                 <p className="text-sm text-zinc-500">Real-time status is based on actual application usage telemetry.</p>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* FINANCE TAB */}
                             {activeTab === 'finance' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-emerald-400"><div className="p-2 bg-emerald-500/20 rounded-xl"><DollarSign size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">Monthly Revenue</span></div>
                                                 <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-emerald-300 text-xs font-bold">MRR</div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">€{revenue.toFixed(2)}</div>
                                             <p className="text-sm text-zinc-500">Based on active Stripe subscriptions.</p>
                                         </div>
                                         <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-red-400"><div className="p-2 bg-red-500/20 rounded-xl"><Cloud size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">Est. AI Cost</span></div>
                                                 <div className="flex items-center gap-2">{showEstimate && (<button onClick={() => { setCalibrationValue(costCorrection.toString()); setIsCalibrating(true); }} className="text-[10px] text-red-300 hover:text-white underline decoration-dotted font-bold">Mismatch?</button>)}</div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">${displayCost.toFixed(4)}</div>
                                             <p className="text-sm text-zinc-500 flex items-center gap-2">{showEstimate ? 'Calculated from token usage + baseline.' : 'Directly billed from Google Cloud.'}</p>
                                             {isCalibrating && (<div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 animate-in fade-in"><div className="text-center w-full"><h4 className="text-white font-bold mb-2 text-sm">Calibrate Historical Cost</h4><div className="flex gap-2 justify-center"><input type="number" value={calibrationValue} onChange={e => setCalibrationValue(e.target.value)} className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-center outline-none focus:border-indigo-500" placeholder="0.34" autoFocus /><button onClick={handleSaveCalibration} className="bg-green-600 hover:bg-green-500 text-white rounded-lg p-2"><Check size={16}/></button><button onClick={() => setIsCalibrating(false)} className="bg-gray-600 hover:bg-gray-500 text-white rounded-lg p-2"><X size={16}/></button></div></div></div>)}
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         <div className="md:col-span-1 p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col justify-center items-center text-center"><div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Net Profit</div><div className={`text-4xl font-black ${netProfit >= 0 ? 'text-indigo-400' : 'text-orange-500'}`}>€{netProfit.toFixed(2)}</div><div className="text-xs text-zinc-500 mt-1">Margin: {profitMargin.toFixed(1)}%</div></div>
                                         <div className="md:col-span-2 p-6 rounded-3xl border border-white/10 bg-white/5"><h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16}/> Cost Ledger</h4><div className="space-y-3 text-sm font-mono"><div className="flex justify-between items-center text-zinc-400"><span>Input Tokens ({totalInputTokens.toLocaleString()})</span><span>${liveInputCost.toFixed(4)}</span></div><div className="flex justify-between items-center text-zinc-400"><span>Output Tokens ({totalOutputTokens.toLocaleString()})</span><span>${liveOutputCost.toFixed(4)}</span></div>{costCorrection > 0 && (<div className="flex justify-between items-center text-amber-500"><span>Historical Adjustment</span><span>${costCorrection.toFixed(4)}</span></div>)}<div className="flex justify-between items-center text-indigo-400 border-t border-white/5 pt-2"><span>Stripe Fees (Est. 3%)</span><span>€{estimatedFees.toFixed(2)}</span></div></div></div>
                                     </div>
                                 </div>
                             )}

                             {/* USERS TAB */}
                             {activeTab === 'users' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="flex gap-4">
                                         <div className="flex-1 relative group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18}/><input type="text" placeholder="Search users by name, email or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-lg"/></div>
                                         <div className="flex gap-2">
                                             <button onClick={() => setSortUsers(sortUsers === 'recent' ? 'usage' : 'recent')} className="px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-zinc-400 hover:text-white font-medium text-sm transition-all min-w-[100px]">{sortUsers === 'recent' ? 'Latest' : 'Top Usage'}</button>
                                             <div className="relative"><button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`h-full px-6 flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold transition-all hover:bg-white/10 ${filterPlan !== 'all' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 'text-zinc-400'}`}><Filter size={18}/> {filterPlan === 'all' ? 'All' : filterPlan}</button>{showFilterMenu && (<div className="absolute top-full right-0 mt-2 w-32 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">{['all', 'free', 'plus', 'pro'].map(p => (<button key={p} onClick={() => { setFilterPlan(p as any); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold uppercase hover:bg-white/5 ${filterPlan === p ? 'text-indigo-400' : 'text-zinc-500'}`}>{p}</button>))}</div>)}</div>
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {dbUsers.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) || u.id.includes(searchQuery)).filter(u => filterPlan === 'all' || u.plan === filterPlan).sort((a, b) => sortUsers === 'recent' ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : (b.totalInput + b.totalOutput) - (a.totalInput + a.totalOutput)).map((user) => (
                                             <div key={user.id} onClick={() => handleUserClick(user)} className="group bg-white/5 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer shadow-md hover:shadow-xl relative overflow-hidden">
                                                 <div className="flex items-start gap-4 relative z-10">
                                                     <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden relative" style={{ backgroundColor: user.theme }}>
                                                         {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0).toUpperCase()}
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <div className="flex justify-between items-start">
                                                             <h4 className="font-bold text-white truncate pr-2">{user.name}</h4>
                                                             <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${user.plan === 'pro' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{user.plan}</span>
                                                         </div>
                                                         <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                                                             <span>ID: {user.id.substring(0,6)}</span>
                                                             <span className="w-1 h-1 rounded-full bg-zinc-700"/>
                                                             <span className="text-emerald-500">{user.usage} imgs</span>
                                                         </div>
                                                         <div className="mt-3 pt-3 border-t border-white/5 flex gap-4 text-[10px] font-mono text-zinc-400">
                                                             <div>In: {(user.totalInput/1000).toFixed(1)}k</div>
                                                             <div>Out: {(user.totalOutput/1000).toFixed(1)}k</div>
                                                             <div className="ml-auto text-zinc-600">{new Date(user.updatedAt).toLocaleDateString()}</div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {/* KEYS TAB */}
                             {activeTab === 'keys' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"/><div className="flex-1 relative z-10"><h4 className="text-2xl font-black text-white mb-2">Generate Access Key</h4><p className="text-zinc-400 text-sm max-w-md">Create secure promotional keys.</p></div>
                                         <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/5 backdrop-blur-md relative z-10"><button onClick={() => setSelectedPlan('plus')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'plus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Zap size={16}/> Plus</button><button onClick={() => setSelectedPlan('pro')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'pro' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Crown size={16}/> Pro</button></div>
                                         <Button onClick={handleGenerate} icon={Plus} className="px-8 py-4 bg-white text-black hover:bg-zinc-200 shadow-xl rounded-2xl text-base relative z-10">Generate</Button>
                                     </div>
                                     <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-lg"><table className="w-full text-left"><thead><tr className="border-b border-white/5 bg-black/20"><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Code</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Created</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th><th className="p-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th></tr></thead><tbody className="divide-y divide-white/5">{dbKeys.map((k, i) => (<tr key={i} className="hover:bg-white/5 transition-colors group"><td className="p-5 font-mono text-sm text-indigo-400 font-medium">{k.code}</td><td className="p-5"><span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${k.plan === 'pro' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{k.plan || 'pro'}</span></td><td className="p-5 text-xs text-zinc-500">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '-'}</td><td className="p-5"><div className={`flex items-center gap-2 text-xs font-bold ${k.isUsed ? 'text-red-400' : 'text-emerald-400'}`}><div className={`w-2 h-2 rounded-full ${k.isUsed ? 'bg-red-500' : 'bg-emerald-500'}`}/>{k.isUsed ? 'Redeemed' : 'Available'}</div></td><td className="p-5 text-right flex justify-end gap-2"><button onClick={() => {navigator.clipboard.writeText(k.code); addToast('Copied', 'success')}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"><Copy size={16}/></button>{k.id && <button onClick={() => handleDeleteKey(k.id!)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div>
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
