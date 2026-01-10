
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ChevronRight, Edit2, Save, Database, 
  Terminal, ArrowLeft, Mail,
  Clock, Hash, AlertTriangle, Check, DollarSign,
  CreditCard,
  Cloud, Cpu, AlertCircle, RotateCcw, 
  BarChart2, Wifi, HardDrive, Brain, LayoutDashboard,
  PieChart as PieChartIcon, MessageSquare, Flag, CheckSquare,
  Eye, EyeOff, Lock, Radio, LogOut, Snowflake,
  Settings, PartyPopper, Bell, Megaphone, Info, ExternalLink, Volume2, VolumeX, TriangleAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, Session } from '../../types';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SUBJECTS } from '../../constants';
import { t } from '../../utils/translations';
import { Lightbox } from '../ui/Lightbox';
import { DynamicIcon } from '../ui/DynamicIcon';

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
  xp: number;
  level: number;
  lastVisit: string;
  createdAt: string;
  theme: string;
  usage: number; 
  rawSettings: any;
  updatedAt: string;
  totalInput: number;
  totalOutput: number;
  stripeId?: string;
  proExpiresAt?: string;
}

interface Report {
    id: string;
    user_id: string;
    title: string;
    description: string;
    images: string[];
    status: 'open' | 'resolved';
    created_at: string;
    user_email?: string; 
    user_name?: string; 
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
  showAdminAuth: boolean;
  setShowAdminAuth: (val: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (val: string) => void;
  handleAdminLogin: () => void;
  generateKey: (plan: 'plus' | 'pro') => void;
  generatedKeys: GeneratedKey[];
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  globalConfig: any;
  setGlobalConfig: (val: any) => void;
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
  addToast,
  globalConfig,
  setGlobalConfig
}: AdminPanelProps) => {
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'status' | 'finance' | 'users' | 'keys' | 'broadcast' | 'reports'>('dashboard');
    const [dbKeys, setDbKeys] = useState<GeneratedKey[]>([]);
    const [dbUsers, setDbUsers] = useState<AdminUser[]>([]);
    const [dbReports, setDbReports] = useState<Report[]>([]);
    const [financials, setFinancials] = useState<FinancialData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>('pro');
    const [searchQuery, setSearchQuery] = useState('');
    const [showRawData, setShowRawData] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    
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
    const [heatmapRange, setHeatmapRange] = useState<number>(7);
    const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

    // Broadcast State (Enhanced)
    const [broadcastForm, setBroadcastForm] = useState({
        message: '',
        type: 'toast' as 'toast' | 'modal',
        senderName: 'Uchebnik AI',
        variant: 'info' as 'info' | 'success' | 'warning' | 'danger',
        icon: 'Bell',
        actionText: '',
        actionUrl: '',
        soundEnabled: true,
        scheduledAt: ''
    });
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // User Details & Chat
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [userSessions, setUserSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Initial State - will be updated by real checks
    const [systemHealth, setSystemHealth] = useState<SystemService[]>([
        { name: 'Основна БД (Supabase)', status: 'unknown', latency: 0, uptime: 100, icon: Database, lastCheck: 0 },
        { name: 'AI Модели (Gemini)', status: 'unknown', latency: 0, uptime: 100, icon: Brain, lastCheck: 0 },
        { name: 'Гласови Услуги (Live API)', status: 'unknown', latency: 0, uptime: 100, icon: Wifi, lastCheck: 0 },
        { name: 'Съхранение на Данни', status: 'unknown', latency: 0, uptime: 100, icon: HardDrive, lastCheck: 0 },
        { name: 'Плащания (Stripe)', status: 'unknown', latency: 0, uptime: 100, icon: CreditCard, lastCheck: 0 },
    ]);

    useEffect(() => {
        if (showAdminPanel) {
            fetchData();
        }
    }, [showAdminPanel, activeTab]);

    // Fetch Heatmap Data when range changes
    useEffect(() => {
        if (showAdminPanel && activeTab === 'dashboard') {
            fetchSubjectStats();
        }
    }, [heatmapRange, showAdminPanel, activeTab]);

    // Fetch User Chat History when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchUserChatHistory(selectedUser.id);
        } else {
            setUserSessions([]);
            setActiveSessionId(null);
        }
    }, [selectedUser]);

    const fetchUserChatHistory = async (userId: string) => {
        setLoadingSessions(true);
        try {
            const { data, error } = await supabase
                .from('user_data')
                .select('data')
                .eq('user_id', userId)
                .single();
            
            if (error) {
                console.error("Failed to load user chat history:", error);
                setUserSessions([]);
            } else if (data && data.data) {
                setUserSessions(data.data);
                if (data.data.length > 0) {
                    setActiveSessionId(data.data[0].id);
                }
            }
        } catch (e) {
            console.error("Chat History Error", e);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchSubjectStats = async () => {
        setIsHeatmapLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_subject_usage', { days_lookback: heatmapRange });
            
            if (error || !data) {
                setSubjectStats([]);
            } else {
                const total = data.reduce((acc: number, curr: any) => acc + curr.count, 0);
                const stats: SubjectStat[] = data.map((item: any) => {
                    const subjectConfig = SUBJECTS.find(s => s.id === item.subject_id);
                    return {
                        subject_id: item.subject_id,
                        count: item.count,
                        percentage: total > 0 ? (item.count / total) * 100 : 0,
                        name: subjectConfig ? t(`subject_${subjectConfig.id}`, 'bg') : item.subject_id,
                        color: subjectConfig?.color || 'bg-gray-500'
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
        if (!broadcastForm.message.trim()) return;
        setIsBroadcasting(true);
        try {
            const { error } = await supabase.from('broadcasts').insert({
                message: broadcastForm.message,
                type: broadcastForm.type,
                sender_name: broadcastForm.senderName,
                variant: broadcastForm.variant,
                icon: broadcastForm.icon,
                action_text: broadcastForm.actionText,
                action_url: broadcastForm.actionUrl,
                sound_enabled: broadcastForm.soundEnabled,
                scheduled_at: broadcastForm.scheduledAt || null
            });

            if (error) throw error;
            
            setBroadcastForm(prev => ({...prev, message: '', actionText: '', actionUrl: '', scheduledAt: ''}));
            addToast('Съобщението е изпратено успешно!', 'success');
        } catch (e: any) {
            console.error("Broadcast failed:", e);
            if (e.code === '42P01') {
                addToast('Грешка: Таблица "broadcasts" липсва в базата данни.', 'error');
            } else {
                addToast('Грешка при изпращане. Проверете връзката си.', 'error');
            }
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleToggleGlobalOption = async (key: string, val: boolean) => {
        const newConfig = { ...globalConfig, [key]: val };
        setGlobalConfig(newConfig);
        try {
            const { error } = await supabase
                .from('global_settings')
                .upsert(
                    { key: 'site_config', value: newConfig, updated_at: new Date().toISOString() },
                    { onConflict: 'key' }
                );
            if (error) throw error;
            addToast('Настройките са запазени.', 'success');
        } catch (e) {
            console.error("Failed to save global config", e);
            addToast('Грешка при запис.', 'error');
        }
    };

    const fetchData = async () => {
        setLoadingData(true);
        try {
            if (['users', 'dashboard', 'finance', 'reports'].includes(activeTab)) {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(100); 
                
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

                        const avatarUrl = u.avatar_url || settings?.avatar || '';
                        let displayName = settings?.userName;
                        const isNameGeneric = !displayName || ['Потребител', 'Анонимен', 'Anonymous', 'Scholar'].includes(displayName);
                        
                        if (isNameGeneric && u.email) displayName = u.email.split('@')[0];
                        else if (!displayName) displayName = 'Анонимен';

                        return {
                            id: u.id,
                            email: u.email, 
                            name: displayName,
                            avatar: avatarUrl,
                            plan: settings?.plan || 'free',
                            xp: u.xp || 0,
                            level: u.level || 1,
                            usage: settings?.stats?.dailyImageCount || 0,
                            lastVisit: settings?.stats?.lastVisit || new Date(u.updated_at).toLocaleDateString('bg-BG'),
                            createdAt: u.created_at || u.updated_at,
                            theme: u.theme_color || '#6366f1',
                            rawSettings: settings,
                            updatedAt: u.updated_at,
                            totalInput: uIn,
                            totalOutput: uOut,
                            stripeId: u.stripe_customer_id,
                            proExpiresAt: u.pro_expires_at
                        };
                    });
                    setDbUsers(mappedUsers);
                    setTotalInputTokens(tIn);
                    setTotalOutputTokens(tOut);
                }
            }

            if (activeTab === 'reports') {
                const { data: reports, error: reportsError } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
                if (reports) {
                    const enrichedReports = reports.map(r => {
                        const user = dbUsers.find(u => u.id === r.user_id);
                        return { ...r, user_email: user?.email || 'Неизвестен', user_name: user?.name || 'Анонимен' };
                    });
                    setDbReports(enrichedReports);
                }
            }

            if (['keys', 'dashboard'].includes(activeTab)) {
                const { data: keys, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false }).limit(50);
                if (!error && keys) {
                    setDbKeys(keys.map(k => ({ id: k.id, code: k.code, isUsed: k.is_used, plan: k.plan, createdAt: k.created_at })));
                }
            }

            if (['finance', 'status', 'dashboard'].includes(activeTab)) {
                const { data, error } = await supabase.functions.invoke('get-financial-stats');
                if (!error && data) setFinancials(data);
            }
        } catch (e) {
            console.error("Admin fetchData Error:", e);
        } finally {
            setLoadingData(false);
        }
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
        } catch (e) { addToast('Грешна при изтриване', 'error'); }
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
                    addToast('Калибрацията е запазена.', 'success');
                }
            }
        } else addToast('Невалидна сума', 'error');
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser || !editForm) return;
        try {
            const currentSettings = selectedUser.rawSettings || {};
            const updatedSettings = { ...currentSettings, userName: editForm.name, plan: editForm.plan, stats: { ...(currentSettings.stats || {}), dailyImageCount: editForm.usage } };
            const { error } = await supabase.from('profiles').update({ settings: updatedSettings, xp: editForm.xp, level: editForm.level, updated_at: new Date().toISOString() }).eq('id', selectedUser.id);
            if (error) throw error;
            const updatedUser: AdminUser = { ...selectedUser, name: editForm.name, plan: editForm.plan, usage: editForm.usage, xp: editForm.xp, level: editForm.level, rawSettings: updatedSettings };
            setDbUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser); 
            addToast('Запазено!', 'success');
        } catch (e) { addToast('Грешка.', 'error'); }
    };

    const handleUserClick = (user: AdminUser) => {
        setSelectedUser(user);
        setEditForm({ name: user.name, plan: user.plan, usage: user.usage, xp: user.xp, level: user.level });
    };

    const revenue = financials ? financials.mrr / 100 : 0; 
    const billedCloudCost = financials?.googleCloudCost || 0;
    const liveInputCost = (totalInputTokens / 1000000) * PRICE_INPUT_1M;
    const liveOutputCost = (totalOutputTokens / 1000000) * PRICE_OUTPUT_1M;
    const estimatedLiveUsage = liveInputCost + liveOutputCost;
    const showEstimate = billedCloudCost === 0;
    const displayCost = showEstimate ? (estimatedLiveUsage + costCorrection) : billedCloudCost;
    const netProfit = revenue - displayCost - (revenue * 0.03);

    const getHexColor = (colorClass: string) => {
        const key = colorClass.replace('bg-', '');
        return COLOR_MAP[key] || '#6b7280';
    };

    const COLOR_MAP: Record<string, string> = { 'indigo-500': '#6366f1', 'blue-500': '#3b82f6', 'red-500': '#ef4444', 'emerald-500': '#10b981', 'amber-500': '#f59e0b', 'purple-500': '#a855f7', 'pink-500': '#ec4899' };

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
                    <h2 className="text-xl font-bold text-white mb-1">Администраторски достъп</h2>
                    <p className="text-zinc-500 text-sm">Въведете парола за достъп</p>
                </div>
                <div className="w-full space-y-3">
                    <div className="relative w-full">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={adminPasswordInput} 
                            onChange={e => setAdminPasswordInput(e.target.value)} 
                            placeholder="••••••••" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest pr-10" 
                            autoFocus 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <Button onClick={handleAdminLogin} className="w-full py-3 bg-white text-black hover:bg-zinc-200">Вход</Button>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-7xl h-full md:h-[90vh] bg-[#09090b] md:bg-[#09090b]/95 border-none md:border border-white/10 rounded-none md:rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-2xl relative">
             {showRawData && (
                 <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setShowRawData(null)}>
                     <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-4"><h3 className="text-white font-mono font-bold flex items-center gap-2"><Terminal size={18}/> JSON</h3><button onClick={() => setShowRawData(null)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={18}/></button></div>
                         <pre className="flex-1 overflow-auto custom-scrollbar bg-black/50 p-4 rounded-xl text-green-400 font-mono text-xs leading-relaxed">{showRawData}</pre>
                     </div>
                 </div>
             )}

             <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6 backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between md:justify-start gap-3 px-2 mb-4 md:mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                            <Shield size={18} fill="currentColor"/>
                        </div>
                        <h2 className="font-bold text-white text-sm">Админ Панел</h2>
                    </div>
                    <button onClick={() => setShowAdminPanel(false)} className="md:hidden p-2 text-zinc-400 hover:text-white"><X size={20}/></button>
                </div>
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><LayoutDashboard size={18}/> Общ преглед</button>
                    <button onClick={() => setActiveTab('users')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><Users size={18}/> Потребители</button>
                    <button onClick={() => setActiveTab('keys')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><Key size={18}/> Ключове</button>
                    <button onClick={() => setActiveTab('reports')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'reports' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><Flag size={18}/> Доклади</button>
                    <button onClick={() => setActiveTab('finance')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'finance' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><DollarSign size={18}/> Финанси</button>
                    <button onClick={() => setActiveTab('broadcast')} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === 'broadcast' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white'}`}><Megaphone size={18}/> Известия</button>
                </nav>
                <div className="mt-auto pt-6 border-t border-white/5 hidden md:block">
                    <button onClick={() => setShowAdminPanel(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"><LogOut size={18}/> Изход</button>
                </div>
             </div>

             <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black/80">
                 <div className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/5 backdrop-blur-sm shrink-0">
                     <div className="flex items-center gap-4">
                         {selectedUser && <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white"><ArrowLeft size={20}/></button>}
                         <h3 className="text-lg md:text-xl font-bold text-white capitalize">{selectedUser ? 'Профил' : activeTab}</h3>
                     </div>
                     <button onClick={() => {fetchData(); fetchSubjectStats();}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"><RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-20 md:pb-8">
                     {selectedUser && editForm ? (
                         <div className="max-w-5xl mx-auto space-y-6">
                             {/* User Details UI... (skipped for brevity as no changes requested there) */}
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                                 <div className="w-24 h-24 rounded-full overflow-hidden bg-black/20 shrink-0">
                                     <img src={selectedUser.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} className="w-full h-full object-cover"/>
                                 </div>
                                 <div className="flex-1">
                                     <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                                     <p className="text-zinc-500 text-sm">{selectedUser.email}</p>
                                 </div>
                                 <Button onClick={handleSaveUserChanges} icon={Save}>Запази</Button>
                             </div>
                         </div>
                     ) : (
                         <>
                             {activeTab === 'dashboard' && (
                                 <div className="space-y-8 animate-in fade-in">
                                     <div className="bg-white/5 border border-indigo-500/20 rounded-3xl p-6">
                                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><Settings size={20}/> Глобални настройки</h3>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                 <div className="flex items-center gap-3"><div className="p-2.5 bg-red-500/10 rounded-xl text-red-400"><Snowflake size={20}/></div><div><div className="text-sm font-bold text-white">Коледен бутон</div></div></div>
                                                 <button onClick={() => handleToggleGlobalOption('showChristmasButton', !globalConfig.showChristmasButton)} className={`w-12 h-6 rounded-full flex items-center px-1 ${globalConfig.showChristmasButton ? 'bg-indigo-600' : 'bg-zinc-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${globalConfig.showChristmasButton ? 'translate-x-6' : ''}`} /></button>
                                             </div>
                                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                 <div className="flex items-center gap-3"><div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><PartyPopper size={20}/></div><div><div className="text-sm font-bold text-white">Бутон 2026</div></div></div>
                                                 <button onClick={() => handleToggleGlobalOption('showNewYearButton', !globalConfig.showNewYearButton)} className={`w-12 h-6 rounded-full flex items-center px-1 ${globalConfig.showNewYearButton ? 'bg-indigo-600' : 'bg-zinc-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${globalConfig.showNewYearButton ? 'translate-x-6' : ''}`} /></button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'broadcast' && (
                                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                                     <div className="lg:col-span-7 space-y-6">
                                         <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8">
                                             <div className="flex items-center gap-4 mb-8"><div className="p-3 bg-red-500/10 rounded-xl text-red-500"><Megaphone size={24}/></div><h3 className="text-2xl font-black text-white">Известия</h3></div>
                                             <div className="space-y-6">
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">От името на</label><input value={broadcastForm.senderName} onChange={e => setBroadcastForm({...broadcastForm, senderName: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Админ"/></div>
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Икона</label><div className="flex gap-2 flex-wrap">{['Bell', 'Megaphone', 'Zap', 'Info', 'AlertTriangle', 'Gift', 'PartyPopper', 'Radio'].map(icon => (<button key={icon} onClick={() => setBroadcastForm({...broadcastForm, icon})} className={`p-2.5 rounded-xl border transition-all ${broadcastForm.icon === icon ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/20 border-white/5 text-zinc-500 hover:text-white'}`}><DynamicIcon name={icon} className="w-5 h-5"/></button>))}</div></div>
                                                 </div>
                                                 <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Текст</label><textarea value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white min-h-[100px] resize-none" placeholder="Въведете съобщение..."/></div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Тип</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setBroadcastForm({...broadcastForm, type: 'toast'})} className={`py-3 rounded-xl border text-xs font-bold ${broadcastForm.type === 'toast' ? 'bg-indigo-600 text-white' : 'bg-black/20 text-zinc-500'}`}>Toast</button><button onClick={() => setBroadcastForm({...broadcastForm, type: 'modal'})} className={`py-3 rounded-xl border text-xs font-bold ${broadcastForm.type === 'modal' ? 'bg-indigo-600 text-white' : 'bg-black/20 text-zinc-500'}`}>Modal</button></div></div>
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Цвят</label><div className="grid grid-cols-4 gap-2">{(['info', 'success', 'warning', 'danger'] as const).map(v => (<button key={v} onClick={() => setBroadcastForm({...broadcastForm, variant: v})} className={`h-10 rounded-xl border ${broadcastForm.variant === v ? 'ring-2 ring-white' : ''} ${v==='info'?'bg-indigo-500':v==='success'?'bg-emerald-500':v==='warning'?'bg-amber-500':'bg-red-500'}`}/>))}</div></div>
                                                 </div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Бутон - Текст</label><input value={broadcastForm.actionText} onChange={e => setBroadcastForm({...broadcastForm, actionText: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Научи повече"/></div>
                                                     <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Бутон - Линк</label><input value={broadcastForm.actionUrl} onChange={e => setBroadcastForm({...broadcastForm, actionUrl: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..."/></div>
                                                 </div>
                                                 <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">График (Опционално)</label><input type="datetime-local" value={broadcastForm.scheduledAt} onChange={e => setBroadcastForm({...broadcastForm, scheduledAt: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                                                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl"><div className="flex items-center gap-3"><Volume2 size={18}/><span className="text-sm font-bold text-white">Звуков сигнал</span></div><button onClick={() => setBroadcastForm({...broadcastForm, soundEnabled: !broadcastForm.soundEnabled})} className={`w-12 h-6 rounded-full flex items-center px-1 ${broadcastForm.soundEnabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${broadcastForm.soundEnabled ? 'translate-x-6' : ''}`}/></button></div>
                                                 <Button onClick={handleSendBroadcast} disabled={isBroadcasting || !broadcastForm.message.trim()} className="w-full py-4 text-base font-black bg-indigo-600">{isBroadcasting ? 'Изпращане...' : 'Изпрати известието'}</Button>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="lg:col-span-5 flex flex-col gap-6">
                                         <div className="bg-black/20 border border-white/5 rounded-3xl p-6 h-full flex flex-col items-center">
                                             <h4 className="text-xs font-black text-zinc-500 uppercase mb-8">Преглед</h4>
                                             {broadcastForm.type === 'toast' ? (
                                                 <div className={`w-full p-4 rounded-2xl border flex items-center gap-4 ${broadcastForm.variant==='info'?'bg-indigo-500/20 border-indigo-500/40 text-indigo-400':broadcastForm.variant==='success'?'bg-emerald-500/20 border-emerald-500/40 text-emerald-400':broadcastForm.variant==='warning'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-red-500/20 border-red-500/40 text-red-400'}`}><DynamicIcon name={broadcastForm.icon} className="w-5 h-5"/><div className="text-sm font-medium">{broadcastForm.message || 'Съобщение...'}</div></div>
                                             ) : (
                                                 <div className="w-full bg-[#111] border border-white/10 rounded-[32px] p-6 text-center gap-6 flex flex-col items-center">
                                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${broadcastForm.variant==='info'?'bg-indigo-600':broadcastForm.variant==='success'?'bg-emerald-600':broadcastForm.variant==='warning'?'bg-amber-600':'bg-red-600'}`}><DynamicIcon name={broadcastForm.icon} className="w-7 h-7"/></div>
                                                     <div className="space-y-1"><h3 className="text-lg font-black text-white">Известие</h3><span className="text-[9px] font-black uppercase text-zinc-500">От: {broadcastForm.senderName}</span><p className="text-zinc-400 text-xs mt-2">{broadcastForm.message || 'Съобщение...'}</p></div>
                                                     {broadcastForm.actionText && <div className={`w-full py-3 rounded-xl font-bold text-white text-xs ${broadcastForm.variant==='info'?'bg-indigo-600':broadcastForm.variant==='success'?'bg-emerald-600':broadcastForm.variant==='warning'?'bg-amber-600':'bg-red-600'}`}>{broadcastForm.actionText}</div>}
                                                 </div>
                                             )}
                                         </div>
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
