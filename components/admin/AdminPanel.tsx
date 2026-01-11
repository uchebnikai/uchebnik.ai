
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Settings, PartyPopper, Bell, Gift, Megaphone, Link as LinkIcon,
  Loader2, ExternalLink, Info, Sparkles, Star, Heart, MapPin, 
  Calendar, Camera, Code, Calculator, Binary, Pill, Layout, 
  FileText, Briefcase, Target, Languages, Globe, HelpCircle, Trophy, ImageIcon, Upload,
  ArrowDownWideNarrow, SortAsc, UserPlus, History, SortDesc
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, Session } from '../../types';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SUBJECTS } from '../../constants';
import { t } from '../../utils/translations';
import { Lightbox } from '../ui/Lightbox';
import { DynamicIcon } from '../ui/DynamicIcon';
import { resizeImage } from '../../utils/image';

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
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  globalConfig: any;
  setGlobalConfig: (val: any) => void;
}

const PRESET_ICONS = ['Bell', 'Sparkles', 'Zap', 'Gift', 'Shield', 'AlertTriangle', 'Megaphone', 'Info', 'Trophy', 'Target', 'Star', 'Heart'];

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
    const [filterStatus, setFilterStatus] = useState<'all' | 'online'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortUsers, setSortUsers] = useState<'activity' | 'newest' | 'oldest' | 'usage' | 'level' | 'name'>('activity');

    // Heatmap State
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
    const [heatmapRange, setHeatmapRange] = useState<number>(7);
    const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastTitle, setBroadcastTitle] = useState('Важно известие');
    const [broadcastSender, setBroadcastSender] = useState('Екипът на Uchebnik AI');
    const [broadcastType, setBroadcastType] = useState<'toast' | 'modal'>('toast');
    const [broadcastIcon, setBroadcastIcon] = useState('Bell');
    const [broadcastColor, setBroadcastColor] = useState('#6366f1');
    const [broadcastBgImage, setBroadcastBgImage] = useState('');
    const [broadcastSchedule, setBroadcastSchedule] = useState('');
    const [broadcastButtons, setBroadcastButtons] = useState<{label: string, url: string}[]>([]);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [iconSearchTerm, setIconSearchTerm] = useState('');
    const [visibleIconCount, setVisibleIconCount] = useState(150);
    const broadcastBgInputRef = useRef<HTMLInputElement>(null);

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

    // Optimized Icon Picker logic with incremental loading
    const filteredIconsList = useMemo(() => {
        const iconNames = Object.keys(LucideIcons).filter(name => !name.includes('Icon') && name.length > 2);
        if (!iconSearchTerm.trim()) return iconNames;
        const search = iconSearchTerm.toLowerCase();
        return iconNames.filter(name => name.toLowerCase().includes(search));
    }, [iconSearchTerm]);

    // Slice the filtered list for rendering to avoid DOM lag
    const renderedIcons = useMemo(() => {
        return filteredIconsList.slice(0, visibleIconCount);
    }, [filteredIconsList, visibleIconCount]);

    // Handle search change - reset count for performance
    useEffect(() => {
        setVisibleIconCount(150);
    }, [iconSearchTerm]);

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

    const isUserOnline = (updatedAt: string) => {
        if (!updatedAt) return false;
        const diff = new Date().getTime() - new Date(updatedAt).getTime();
        return diff < 5 * 60 * 1000;
    };

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
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            const { error } = await supabase.from('broadcasts').insert({
                message: broadcastMsg,
                title: broadcastTitle,
                type: broadcastType,
                sender_name: broadcastSender,
                icon_name: broadcastIcon,
                color_theme: broadcastColor,
                background_image: broadcastBgImage || null,
                scheduled_for: broadcastSchedule || null,
                buttons: broadcastButtons
            });

            if (error) throw error;
            
            setBroadcastMsg('');
            setBroadcastButtons([]);
            setBroadcastSchedule('');
            setBroadcastBgImage('');
            addToast('Съобщението е изпратено успешно!', 'success');
        } catch (e: any) {
            console.error("Broadcast failed:", e);
            if (e.code === '42P01') {
                addToast('Грешка: Таблица "broadcasts" липсва.', 'error');
            } else if (e.message.includes('column "background_image" does not exist')) {
                addToast('Грешка: Трябва да добавите SQL колона "background_image".', 'error');
            } else {
                addToast('Грешка при изпращане.', 'error');
            }
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleBroadcastBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type === 'image/gif') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setBroadcastBgImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Use resizeImage for other formats to optimize, but keep high enough for full width
            resizeImage(file, 1280, 0.7).then(setBroadcastBgImage);
        }
    };

    const handleAddBroadcastButton = () => {
        if (broadcastButtons.length >= 2) return;
        setBroadcastButtons([...broadcastButtons, { label: '', url: '' }]);
    };

    const handleRemoveBroadcastButton = (idx: number) => {
        setBroadcastButtons(broadcastButtons.filter((_, i) => i !== idx));
    };

    const handleUpdateButtonLink = (idx: number, field: 'label' | 'url', val: string) => {
        const next = [...broadcastButtons];
        next[idx][field] = val;
        setBroadcastButtons(next);
    };

    const handleToggleGlobalOption = async (key: string, val: boolean) => {
        // Construct the new configuration locally first
        const newConfig = { ...globalConfig, [key]: val };
        
        // Update local state immediately for snappy UI
        setGlobalConfig(newConfig);

        try {
            // Force an upsert by key. If the record exists, it updates 'value'. If not, it inserts.
            const { error } = await supabase
                .from('global_settings')
                .upsert(
                    { key: 'site_config', value: newConfig, updated_at: new Date().toISOString() },
                    { onConflict: 'key' }
                );
            
            if (error) throw error;
            addToast('Настройките са запазени в облака.', 'success');
        } catch (e) {
            console.error("Failed to save global config", e);
            addToast('Грешка при запис в базата. Моля, опитайте отново по-късно.', 'error');
        }
    };

    const fetchData = async () => {
        setLoadingData(true);
        try {
            if (['users', 'dashboard', 'finance', 'reports'].includes(activeTab)) {
                const dbStart = performance.now();
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(500); 
                const dbLatency = Math.round(performance.now() - dbStart);
                
                updateHealthItem('Основна БД', !error, dbLatency, Date.now());
                
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
                        
                        // Robust naming fallback
                        let displayName = settings?.userName;
                        const isNameGeneric = !displayName || displayName === 'Потребител' || displayName === 'Анонимен' || displayName === 'Anonymous' || displayName === 'Scholar';
                        
                        if (isNameGeneric && u.email) {
                            displayName = u.email.split('@')[0];
                        } else if (!displayName) {
                            displayName = 'Анонимен';
                        }

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
                            createdAt: u.created_at,
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
                const { data: reports, error: reportsError } = await supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (reportsError) {
                    console.error("Reports error", reportsError);
                } else if (reports) {
                    const enrichedReports = reports.map(r => {
                        const user = dbUsers.find(u => u.id === r.user_id);
                        return {
                            ...r,
                            user_email: user?.email || 'Неизвестен',
                            user_name: user?.name || 'Анонимен'
                        };
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
                const finStart = performance.now();
                const { data, error } = await supabase.functions.invoke('get-financial-stats');
                const finLatency = Math.round(performance.now() - finStart);

                if (!error && data) {
                    setFinancials(data);
                    updateHealthItem('Плащания', data.balance !== undefined, finLatency, Date.now());
                } else {
                    updateHealthItem('Плащания', false, 0, Date.now());
                }
            }

            if (['status', 'dashboard'].includes(activeTab)) {
                try {
                    const aiLogStr = localStorage.getItem('sys_monitor_ai');
                    if (aiLogStr) {
                        const aiLog = JSON.parse(aiLogStr);
                        const isRecent = (Date.now() - aiLog.timestamp) < 24 * 60 * 60 * 1000;
                        if (isRecent) {
                            updateHealthItem('AI Модели', aiLog.status === 'operational', aiLog.latency, aiLog.timestamp);
                            updateHealthItem('Гласови Услуги', aiLog.status === 'operational', Math.round(aiLog.latency * 1.1), aiLog.timestamp);
                        } else {
                            setSystemHealth(prev => prev.map(s => (s.name.includes('AI') || s.name.includes('Voice')) ? {...s, status: 'unknown'} : s));
                        }
                    }
                } catch(e) {}

                try {
                    const dbLogStr = localStorage.getItem('sys_monitor_db');
                    if (dbLogStr) {
                        const dbLog = JSON.parse(dbLogStr);
                        setSystemHealth(prev => {
                            const dbItem = prev.find(s => s.name.includes('Основна БД'));
                            if (dbItem && dbItem.lastCheck === 0) {
                                return prev.map(s => {
                                    if(s.name.includes('Основна БД') || s.name.includes('Съхранение')) {
                                        const normalizedStatus = dbLog.status === 'outage' ? 'down' : dbLog.status;
                                        return { ...s, status: normalizedStatus, latency: dbLog.latency, lastCheck: dbLog.timestamp };
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
            console.error("Admin fetchData Error:", e);
        } finally {
            setLoadingData(false);
        }
    };

    const updateHealthItem = (namePart: string, isUp: boolean, latency: number, timestamp: number) => {
        setSystemHealth(prev => prev.map(item => {
            if (item.name.includes(namePart)) {
                return {
                    ...item,
                    status: isUp ? 'operational' : 'down',
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
                    addToast('Калибрацията е запазена успешно', 'success');
                }
            }
        } else { addToast('Невалидна сума', 'error'); }
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser || !editForm) return;
        try {
            const currentSettings = selectedUser.rawSettings || {};
            
            const updatedSettings = { 
                ...currentSettings, 
                userName: editForm.name, 
                plan: editForm.plan, 
                stats: { ...(currentSettings.stats || {}), dailyImageCount: editForm.usage } 
            };

            const { error } = await supabase.from('profiles').update({ 
                settings: updatedSettings, 
                xp: editForm.xp,
                level: editForm.level,
                updated_at: new Date().toISOString() 
            }).eq('id', selectedUser.id);

            if (error) throw error;
            
            const updatedUser: AdminUser = { 
                ...selectedUser, 
                name: editForm.name, 
                plan: editForm.plan, 
                usage: editForm.usage,
                xp: editForm.xp,
                level: editForm.level,
                rawSettings: updatedSettings 
            };
            
            setDbUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser); 
            addToast('Промените са запазени успешно!', 'success');
        } catch (e) { addToast('Грешка при запазване.', 'error'); }
    };

    const handleResolveReport = async (reportId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
            const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', reportId);
            
            if (error) throw error;
            
            setDbReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            addToast(`Статусът е променен на ${newStatus === 'resolved' ? 'Решен' : 'Отворен'}`, 'success');
        } catch (e) {
            console.error("Resolve error", e);
            addToast("Грешка при обновяване на статус", "error");
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm("Сигурни ли сте?")) return;
        try {
            const { error } = await supabase.from('reports').delete().eq('id', reportId);
            if (error) throw error;
            setDbReports(prev => prev.filter(r => r.id !== reportId));
            addToast("Докладът е изтрит", "success");
        } catch (e) {
            addToast("Грешка при изтриване", "error");
        }
    };

    const handleUserClick = (user: AdminUser) => {
        setSelectedUser(user);
        setEditForm({ 
            name: user.name, 
            plan: user.plan, 
            usage: user.usage,
            xp: user.xp,
            level: user.level
        });
    };

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

    const UptimeBar = ({ status }: { status: string }) => (
        <div className="flex gap-0.5 h-8 mt-2 w-full max-w-sm opacity-80">
            {Array.from({ length: 40 }).map((_, i) => (
                <div 
                    key={i} 
                    className={`flex-1 rounded-sm transition-all duration-500 ${
                        status === 'unknown' ? 'bg-zinc-700' :
                        status === 'down' ? 'bg-red-500' : 
                        status === 'degraded' ? (i > 30 ? 'bg-amber-500' : 'bg-green-500') : 
                        'bg-green-500'
                    } ${i < 30 ? 'opacity-40' : 'opacity-100'}`} 
                />
            ))}
        </div>
    );

    const COLOR_MAP: Record<string, string> = {
        'indigo-500': '#6366f1',
        'blue-500': '#3b82f6',
        'red-500': '#ef4444',
        'emerald-500': '#10b981',
        'amber-500': '#f59e0b',
        'purple-500': '#a855f7',
        'pink-500': '#ec4899',
    };

    const getHexColor = (colorClass: string) => {
        const key = colorClass.replace('bg-', '');
        return COLOR_MAP[key] || '#6b7280';
    };

    const filteredAndSortedUsers = useMemo(() => {
        let result = dbUsers.filter(u => {
            const matchesSearch = !searchQuery || 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) || 
                u.id.includes(searchQuery);
            
            const matchesPlan = filterPlan === 'all' || u.plan === filterPlan;
            const matchesStatus = filterStatus === 'all' || (filterStatus === 'online' && isUserOnline(u.updatedAt));

            return matchesSearch && matchesPlan && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sortUsers) {
                case 'activity':
                    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
                case 'newest':
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                case 'oldest':
                    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                case 'usage':
                    const usageA = (a.totalInput || 0) + (a.totalOutput || 0);
                    const usageB = (b.totalInput || 0) + (b.totalOutput || 0);
                    return usageB - usageA;
                case 'level':
                    return (b.level || 0) - (a.level || 0);
                case 'name':
                    return a.name.localeCompare(b.name, 'bg');
                default:
                    return 0;
            }
        });
    }, [dbUsers, searchQuery, filterPlan, filterStatus, sortUsers]);

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
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
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
                         <div className="flex justify-between items-center mb-4"><h3 className="text-white font-mono font-bold flex items-center gap-2"><Terminal size={18}/> Сурови Данни (JSON)</h3><button onClick={() => setShowRawData(null)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={18}/></button></div>
                         <pre className="flex-1 overflow-auto custom-scrollbar bg-black/50 p-4 rounded-xl text-green-400 font-mono text-xs leading-relaxed">{showRawData}</pre>
                     </div>
                 </div>
             )}

             {/* Sidebar */}
             <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6 backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between md:justify-start gap-3 px-2 mb-4 md:mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Shield size={18} fill="currentColor"/>
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">Админ Панел</h2>
                            <div className="text-[10px] text-zinc-500 font-mono">v4.3 • Advanced Sorting</div>
                        </div>
                    </div>
                    <button onClick={() => setShowAdminPanel(false)} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                    <div className="hidden md:block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1 mt-2 pl-2">Анализи</div>
                    <button onClick={() => {setActiveTab('dashboard'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <LayoutDashboard size={18}/> <span className="hidden md:inline">Преглед</span>
                    </button>
                    
                    <div className="hidden md:block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1 mt-4 pl-2">Управление</div>
                    <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Users size={18}/> <span className="hidden md:inline">Потребители</span>
                    </button>
                    <button onClick={() => {setActiveTab('keys'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Key size={18}/> <span className="hidden md:inline">Ключове</span>
                    </button>
                    <button onClick={() => {setActiveTab('reports'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Flag size={18}/> <span className="hidden md:inline">Доклади</span>
                    </button>

                    <div className="hidden md:block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1 mt-4 pl-2">Система</div>
                    <button onClick={() => {setActiveTab('status'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'status' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity size={18}/> <span className="hidden md:inline">Статус</span>
                    </button>
                    <button onClick={() => {setActiveTab('finance'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'finance' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <DollarSign size={18}/> <span className="hidden md:inline">Финанси</span>
                    </button>
                    <button onClick={() => {setActiveTab('broadcast'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white/10 text-white border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <AlertCircle size={18}/> <span className="hidden md:inline">Известия</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 hidden md:block">
                    <button 
                        onClick={() => setShowAdminPanel(false)} 
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                    >
                        <LogOut size={18}/> Изход
                    </button>
                </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black/80">
                 {/* Header */}
                 <div className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/5 backdrop-blur-sm shrink-0">
                     <div className="flex items-center gap-4">
                         {selectedUser && (
                             <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                                 <ArrowLeft size={20}/>
                             </button>
                         )}
                         <div>
                             <h3 className="text-lg md:text-xl font-bold text-white capitalize flex items-center gap-2">
                                 {selectedUser ? 'Профил на потребител' : 
                                  activeTab === 'dashboard' ? 'Общ преглед' :
                                  activeTab === 'users' ? 'Управление на потребители' :
                                  activeTab === 'keys' ? 'Ключове за достъп' :
                                  activeTab === 'reports' ? 'Потребителски доклади' :
                                  activeTab === 'status' ? 'Системен статус' :
                                  activeTab === 'finance' ? 'Финансов отчет' :
                                  'Глобални известия'}
                             </h3>
                             <p className="text-xs text-zinc-500 mt-0.5 hidden md:block">{selectedUser ? `Редактиране на ${selectedUser.name}` : 'Системен преглед и управление'}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <button onClick={() => {fetchData(); if(activeTab==='dashboard') fetchSubjectStats();}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Обнови данни">
                             <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/>
                         </button>
                     </div>
                 </div>

                 {/* Content Scroll Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-20 md:pb-8">
                     
                     {/* USER DETAIL VIEW */}
                     {selectedUser && editForm ? (
                         <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right fade-in duration-300">
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"/>
                                 <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                                     <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative bg-black/20 shrink-0">
                                         {selectedUser.avatar ? (
                                             <img src={selectedUser.avatar} className="w-full h-full object-cover"/>
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: selectedUser.theme }}>
                                                 {selectedUser.name.charAt(0).toUpperCase()}
                                             </div>
                                         )}
                                         <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                                             <div className={`w-3 h-3 rounded-full ${isUserOnline(selectedUser.updatedAt) ? 'bg-green-500' : 'bg-zinc-500'} border-2 border-black`}/>
                                         </div>
                                     </div>
                                     
                                     <div className="flex-1 space-y-2 w-full">
                                         <div className="flex items-center gap-3">
                                             <h2 className="text-2xl md:text-4xl font-black text-white truncate">{selectedUser.name}</h2>
                                             <div className="flex flex-col gap-1">
                                                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border text-center ${
                                                     selectedUser.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                                     selectedUser.plan === 'plus' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 
                                                     'bg-zinc-800 text-zinc-400 border-white/10'
                                                 }`}>
                                                     {selectedUser.plan}
                                                 </span>
                                             </div>
                                         </div>
                                         <div className="flex flex-col gap-1 text-sm text-zinc-400">
                                             <div className="flex items-center gap-2 truncate"><Mail size={14}/> {selectedUser.email || 'Скрит'}</div>
                                             <div className="flex items-center gap-2 font-mono truncate"><Hash size={14}/> {selectedUser.id}</div>
                                             <div className="flex items-center gap-2 font-mono text-amber-500 truncate"><Crown size={14}/> Ниво {selectedUser.level} ({selectedUser.xp} XP)</div>
                                         </div>
                                     </div>

                                     <div className="flex flex-col gap-3 w-full md:w-auto">
                                         <Button onClick={handleSaveUserChanges} icon={Save} className="bg-white text-black hover:bg-zinc-200 shadow-xl w-full justify-center">Запази промените</Button>
                                         <div className="flex gap-2">
                                             <button onClick={() => setEditForm({...editForm, usage: 0})} className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Нулирай използването">
                                                 <RotateCcw size={18} className="mx-auto"/>
                                             </button>
                                             <button onClick={() => setShowRawData(JSON.stringify(selectedUser.rawSettings, null, 2))} className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Виж JSON">
                                                 <Database size={18} className="mx-auto"/>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="md:col-span-1 space-y-6">
                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
                                         <h4 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-indigo-500"/> Бърза Редакция</h4>
                                         
                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Име</label>
                                             <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"/>
                                         </div>

                                         <div className="space-y-2">
                                             <label className="text-xs font-bold text-zinc-500 uppercase ml-1">План</label>
                                             <div className="grid grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
                                                 {(['free', 'plus', 'pro'] as const).map(plan => (
                                                     <button key={plan} onClick={() => setEditForm({...editForm, plan})} className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${editForm.plan === plan ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                                                         {plan}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-2 gap-3">
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Ниво</label>
                                                 <input type="number" value={editForm.level} onChange={(e) => setEditForm({...editForm, level: parseInt(e.target.value) || 1})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors text-center"/>
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">XP</label>
                                                 <input type="number" value={editForm.xp} onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value) || 0})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors text-center"/>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="md:col-span-2 space-y-6">
                                     <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                                        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                                            <h4 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-indigo-500"/> История на чатовете</h4>
                                            <span className="text-xs text-zinc-500 font-mono">Изисква RLS Policy</span>
                                        </div>
                                        
                                        <div className="flex-1 flex overflow-hidden">
                                            <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar bg-black/10">
                                                {loadingSessions ? (
                                                    <div className="p-4 text-center text-zinc-500 text-sm"><RefreshCw size={16} className="animate-spin inline mr-2"/> Зареждане...</div>
                                                ) : userSessions.length === 0 ? (
                                                    <div className="p-8 text-center text-zinc-500 text-sm">Няма история на чатовете.</div>
                                                ) : (
                                                    userSessions.map(s => (
                                                        <button 
                                                            key={s.id}
                                                            onClick={() => setActiveSessionId(s.id)}
                                                            className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${activeSessionId === s.id ? 'bg-white/10 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                                                        >
                                                            <div className="font-bold text-sm text-white truncate mb-1">{s.title}</div>
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>{t(`subject_${s.subjectId}`, 'bg')}</span>
                                                                <span>{new Date(s.lastModified).toLocaleDateString()}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>

                                            <div className="w-2/3 overflow-y-auto custom-scrollbar bg-[#09090b] p-4 space-y-4">
                                                {activeSessionId ? (
                                                    userSessions.find(s => s.id === activeSessionId)?.messages.map((msg, i) => (
                                                        <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-zinc-200 rounded-bl-none border border-white/5'}`}>
                                                                {msg.text}
                                                            </div>
                                                            <span className="text-[10px] text-zinc-600 mt-1 px-1">
                                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Изберете сесия, за да видите съобщенията</div>
                                                )}
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
                                     
                                     {/* Global Configuration Section */}
                                     <div className="bg-white/5 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group">
                                         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none"/>
                                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                             <Settings size={20} className="text-indigo-400"/> Глобални настройки на сайта
                                         </h3>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 transition-all hover:border-indigo-500/30">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
                                                         <Snowflake size={20}/>
                                                     </div>
                                                     <div>
                                                         <div className="text-sm font-bold text-white">Коледен бутон</div>
                                                         <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Видим за всички</div>
                                                     </div>
                                                 </div>
                                                 <button 
                                                    onClick={() => handleToggleGlobalOption('showChristmasButton', !globalConfig.showChristmasButton)}
                                                    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${globalConfig.showChristmasButton ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                                 >
                                                     <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${globalConfig.showChristmasButton ? 'translate-x-6' : 'translate-x-0'}`} />
                                                 </button>
                                             </div>

                                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 transition-all hover:border-indigo-500/30">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                                                         <PartyPopper size={20}/>
                                                     </div>
                                                     <div>
                                                         <div className="text-sm font-bold text-white">Бутон 2026</div>
                                                         <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Новогодишен режим</div>
                                                     </div>
                                                 </div>
                                                 <button 
                                                    onClick={() => handleToggleGlobalOption('showNewYearButton', !globalConfig.showNewYearButton)}
                                                    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${globalConfig.showNewYearButton ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                                 >
                                                     <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${globalConfig.showNewYearButton ? 'translate-x-6' : 'translate-x-0'}`} />
                                                 </button>
                                             </div>
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                                         <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-blue-400"><Users size={24}/><span className="font-bold text-sm uppercase tracking-wider">Общо Потребители</span></div>
                                                 <div className="text-4xl font-black text-white">{dbUsers.length}</div>
                                             </div>
                                             <Users size={100} className="absolute -bottom-4 -right-4 text-blue-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-emerald-400"><DollarSign size={24}/><span className="font-bold text-sm uppercase tracking-wider">Приходи</span></div>
                                                 <div className="text-4xl font-black text-white">€{revenue.toFixed(2)}</div>
                                             </div>
                                             <DollarSign size={100} className="absolute -bottom-4 -right-4 text-emerald-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-orange-400"><Activity size={24}/><span className="font-bold text-sm uppercase tracking-wider">Активни Днес</span></div>
                                                 <div className="text-4xl font-black text-white">{dbUsers.filter(u => u.lastVisit === new Date().toLocaleDateString('bg-BG')).length}</div>
                                             </div>
                                             <Activity size={100} className="absolute -bottom-4 -right-4 text-orange-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-purple-400"><Brain size={24}/><span className="font-bold text-sm uppercase tracking-wider">Общо Токени</span></div>
                                                 <div className="text-4xl font-black text-white">{(totalInputTokens + totalOutputTokens).toLocaleString()}</div>
                                             </div>
                                             <Brain size={100} className="absolute -bottom-4 -right-4 text-purple-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                     </div>

                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                             <h3 className="text-xl font-bold text-white flex items-center gap-2"><PieChartIcon size={20} className="text-indigo-500"/> Популярност на Предметите</h3>
                                             <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                                                 {[1, 7, 30, 36500].map(d => (
                                                     <button key={d} onClick={() => setHeatmapRange(d)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${heatmapRange === d ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                                                         {d === 1 ? 'Днес' : d === 36500 ? 'Всичко' : `${d} Дни`}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                         
                                         {subjectStats.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                                 {isHeatmapLoading ? <RefreshCw className="animate-spin mb-2"/> : <PieChartIcon size={32} className="mb-2 opacity-50"/>}
                                                 <p>{isHeatmapLoading ? "Зареждане на данни..." : "Няма налични данни."}</p>
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
                                                             <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val: number) => [`${val} сесии`, 'Използване']}/>
                                                         </PieChart>
                                                     </ResponsiveContainer>
                                                 </div>
                                                 <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                     {subjectStats.map((stat, i) => (
                                                         <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                             <div className="flex items-center gap-3">
                                                                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: getHexColor(stat.color)}}></div>
                                                                 <span className="text-sm font-bold text-zinc-200">{stat.name}</span>
                                                             </div>
                                                             <div className="text-right">
                                                                 <div className="text-sm font-mono font-bold text-white">{stat.percentage.toFixed(1)}%</div>
                                                                 <div className="text-xs text-zinc-500">{stat.count} сесии</div>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )}

                             {/* REPORTS TAB */}
                             {activeTab === 'reports' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8">
                                         <div className="flex justify-between items-center mb-6">
                                             <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                                 <Flag size={20} className="text-amber-500"/> Доклади за проблеми
                                             </h3>
                                             <div className="text-xs text-zinc-500 font-mono">
                                                 Последни 50 доклада
                                             </div>
                                         </div>

                                         <div className="space-y-4">
                                             {dbReports.length === 0 ? (
                                                 <div className="text-center py-12 text-zinc-500">
                                                     <CheckCircle size={32} className="mx-auto mb-2 opacity-30"/>
                                                     <p>Няма активни доклади.</p>
                                                 </div>
                                             ) : (
                                                 dbReports.map(report => (
                                                     <div key={report.id} className={`p-5 rounded-2xl border transition-all ${report.status === 'resolved' ? 'bg-white/5 border-green-500/20' : 'bg-white/10 border-amber-500/30'}`}>
                                                         <div className="flex justify-between items-start mb-3">
                                                             <div>
                                                                 <div className="flex items-center gap-2">
                                                                     <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${report.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                         {report.status === 'resolved' ? 'Решен' : 'Отворен'}
                                                                     </span>
                                                                     <span className="text-xs text-zinc-500 font-mono">
                                                                         {new Date(report.created_at).toLocaleString('bg-BG')}
                                                                     </span>
                                                                 </div>
                                                                 <h4 className="font-bold text-white text-lg mt-1">{report.title}</h4>
                                                             </div>
                                                             <div className="flex gap-2">
                                                                 <button 
                                                                     onClick={() => handleResolveReport(report.id, report.status)}
                                                                     className={`p-2 rounded-lg transition-colors ${report.status === 'resolved' ? 'text-zinc-500 hover:text-amber-400 bg-white/5' : 'text-green-400 hover:bg-green-500/20 bg-green-500/10'}`}
                                                                     title={report.status === 'resolved' ? 'Маркирай като отворен' : 'Маркирай като решен'}
                                                                 >
                                                                     {report.status === 'resolved' ? <RotateCcw size={16}/> : <CheckSquare size={16}/>}
                                                                 </button>
                                                                 <button 
                                                                     onClick={() => handleDeleteReport(report.id)}
                                                                     className="p-2 text-red-400 hover:bg-red-500/20 bg-red-500/10 rounded-lg transition-colors"
                                                                     title="Изтрий"
                                                                 >
                                                                     <Trash2 size={16}/>
                                                                 </button>
                                                             </div>
                                                         </div>
                                                         
                                                         <p className="text-sm text-zinc-300 mb-4 whitespace-pre-wrap">{report.description}</p>
                                                         
                                                         {report.images && Array.isArray(report.images) && report.images.length > 0 && (
                                                             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                                                 {report.images.map((img, i) => (
                                                                     <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-20 w-20 object-cover rounded-lg border border-white/10 hover:scale-105 transition-transform cursor-pointer bg-black"/>
                                                                 ))}
                                                             </div>
                                                         )}

                                                         <div className="flex items-center gap-2 pt-3 border-t border-white/5 text-xs text-zinc-500">
                                                             <Users size={12}/>
                                                             <span className="font-bold text-zinc-400">{report.user_name}</span>
                                                             <span className="font-mono">({report.user_email})</span>
                                                             <span className="font-mono ml-auto opacity-50">ID: {report.user_id.substring(0, 8)}</span>
                                                         </div>
                                                     </div>
                                                 ))
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* BROADCAST TAB */}
                             {activeTab === 'broadcast' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-12">
                                     <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                         
                                         {/* Editor Column */}
                                         <div className="md:col-span-7 bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                                             <div className="flex items-center gap-4 mb-2">
                                                 <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20"><Radio size={24}/></div>
                                                 <div>
                                                     <h3 className="text-2xl font-bold text-white">Център за известия</h3>
                                                     <p className="text-zinc-500 text-sm">Изпратете съобщение в реално време до всички потребители.</p>
                                                 </div>
                                             </div>

                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Заглавие</label>
                                                     <input 
                                                         value={broadcastTitle}
                                                         onChange={e => setBroadcastTitle(e.target.value)}
                                                         className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                                                         placeholder="Напр. Важно известие"
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">От името на</label>
                                                     <input 
                                                         value={broadcastSender}
                                                         onChange={e => setBroadcastSender(e.target.value)}
                                                         className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                                                         placeholder="Напр. Екипът на Uchebnik AI"
                                                     />
                                                 </div>
                                                 <div className="space-y-2 col-span-full">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Планирай за (Опционално)</label>
                                                     <input 
                                                         type="datetime-local"
                                                         value={broadcastSchedule}
                                                         onChange={e => setBroadcastSchedule(e.target.value)}
                                                         className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                                                     />
                                                 </div>
                                             </div>

                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Съобщение</label>
                                                 <textarea 
                                                     value={broadcastMsg}
                                                     onChange={(e) => setBroadcastMsg(e.target.value)}
                                                     placeholder="Внимание: Планирана поддръжка..."
                                                     className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                                                 />
                                             </div>

                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Икона</label>
                                                 <div className="flex flex-wrap gap-2">
                                                     {PRESET_ICONS.map(icon => (
                                                         <button 
                                                            key={icon} 
                                                            onClick={() => setBroadcastIcon(icon)}
                                                            className={`p-3 rounded-xl border flex items-center justify-center transition-all ${broadcastIcon === icon ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                                                         >
                                                             <DynamicIcon name={icon} className="w-5 h-5"/>
                                                         </button>
                                                     ))}
                                                     <button 
                                                        onClick={() => setIsIconPickerOpen(true)}
                                                        className={`p-3 rounded-xl border border-dashed flex items-center justify-center transition-all ${!PRESET_ICONS.includes(broadcastIcon) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-indigo-400 hover:border-indigo-400/50'}`}
                                                     >
                                                         <Plus size={20}/>
                                                     </button>
                                                 </div>
                                             </div>

                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Цвят на акцента</label>
                                                     <div className="flex flex-wrap gap-2">
                                                         {['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#000000'].map(color => (
                                                             <button 
                                                                key={color} 
                                                                onClick={() => setBroadcastColor(color)}
                                                                className={`w-10 h-10 rounded-xl border-2 transition-all ${broadcastColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                                style={{ backgroundColor: color }}
                                                             />
                                                         ))}
                                                         <input 
                                                            type="color" 
                                                            value={broadcastColor}
                                                            onChange={e => setBroadcastColor(e.target.value)}
                                                            className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer overflow-hidden p-0"
                                                         />
                                                     </div>
                                                 </div>

                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Фон (Upload Image/GIF)</label>
                                                     <div className="flex gap-2">
                                                         <button 
                                                            onClick={() => broadcastBgInputRef.current?.click()}
                                                            className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all relative overflow-hidden bg-black/20 ${broadcastBgImage ? 'border-indigo-500 text-indigo-400' : 'border-white/10 text-zinc-500 hover:border-indigo-400 hover:text-indigo-400'}`}
                                                         >
                                                             {broadcastBgImage ? (
                                                                 <>
                                                                    <img src={broadcastBgImage} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                                                    <div className="relative z-10 flex flex-col items-center">
                                                                        <Check size={20}/>
                                                                        <span className="text-[10px] font-bold">Промени</span>
                                                                    </div>
                                                                 </>
                                                             ) : (
                                                                 <>
                                                                    <Upload size={20}/>
                                                                    <span className="text-[10px] font-bold">Качи файл</span>
                                                                 </>
                                                             )}
                                                         </button>
                                                         {broadcastBgImage && (
                                                             <button 
                                                                onClick={() => setBroadcastBgImage('')}
                                                                className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                                             >
                                                                <Trash2 size={20}/>
                                                             </button>
                                                         )}
                                                     </div>
                                                     <input 
                                                        type="file" 
                                                        ref={broadcastBgInputRef} 
                                                        onChange={handleBroadcastBgUpload} 
                                                        className="hidden" 
                                                        accept="image/*"
                                                     />
                                                 </div>
                                             </div>

                                             <div className="space-y-3">
                                                 <div className="flex justify-between items-center">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Бутони (макс 2)</label>
                                                     {broadcastButtons.length < 2 && (
                                                         <button onClick={handleAddBroadcastButton} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                                             <Plus size={14}/> Добави бутон
                                                         </button>
                                                     )}
                                                 </div>
                                                 
                                                 <div className="space-y-3">
                                                     {broadcastButtons.map((btn, idx) => (
                                                         <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
                                                             <div className="flex justify-between items-center">
                                                                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Бутон {idx + 1}</span>
                                                                 <button onClick={() => handleRemoveBroadcastButton(idx)} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                                                             </div>
                                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                 <input 
                                                                    placeholder="Текст на бутона" 
                                                                    value={btn.label} 
                                                                    onChange={e => handleUpdateButtonLink(idx, 'label', e.target.value)}
                                                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                                 />
                                                                 <div className="relative">
                                                                     <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12}/>
                                                                     <input 
                                                                        placeholder="URL (https://...)" 
                                                                        value={btn.url} 
                                                                        onChange={e => handleUpdateButtonLink(idx, 'url', e.target.value)}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                                     />
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>

                                             <div className="pt-4">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Тип показване</label>
                                                 <div className="grid grid-cols-2 gap-3 mt-2">
                                                     <button 
                                                         onClick={() => setBroadcastType('toast')}
                                                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'toast' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                     >
                                                         <Info size={24}/>
                                                         <span className="font-bold text-sm">Toast (Известие)</span>
                                                     </button>
                                                     <button 
                                                         onClick={() => setBroadcastType('modal')}
                                                         className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'modal' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                     >
                                                         <PieChartIcon size={24}/>
                                                         <span className="font-bold text-sm">Modal (Прозорец)</span>
                                                     </button>
                                                 </div>
                                             </div>

                                             <Button 
                                                 onClick={handleSendBroadcast} 
                                                 disabled={isBroadcasting || !broadcastMsg.trim()}
                                                 className={`w-full py-4 text-base shadow-xl bg-indigo-600 hover:bg-indigo-50 shadow-indigo-500/20`}
                                             >
                                                 {isBroadcasting ? <Loader2 size={20} className="animate-spin mr-2"/> : null}
                                                 {isBroadcasting ? 'Изпращане...' : broadcastSchedule ? 'Планирай известие' : 'Изпрати сега'}
                                             </Button>
                                         </div>

                                         {/* Preview Column */}
                                         <div className="md:col-span-5 sticky top-0 space-y-6">
                                             <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Преглед на живо</h4>
                                             
                                             {broadcastType === 'modal' ? (
                                                 /* Modal Preview - Synchronized with App.tsx actual modal */
                                                 <div className="bg-[#09090b] rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300 ring-1 ring-white/5">
                                                      {broadcastBgImage ? (
                                                          <>
                                                            <img src={broadcastBgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />
                                                          </>
                                                      ) : (
                                                        <div className="absolute inset-x-0 top-0 h-32 opacity-20 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${broadcastColor}, transparent)` }} />
                                                      )}
                                                      
                                                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 relative z-10" style={{ backgroundColor: broadcastColor }}>
                                                          <DynamicIcon name={broadcastIcon} className="w-8 h-8" />
                                                      </div>
                                                      
                                                      <div className="space-y-2 relative z-10">
                                                          <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">{broadcastTitle || "Важно известие"}</h3>
                                                          {broadcastSender && (
                                                              <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-md">
                                                                  <span>{broadcastSender}</span>
                                                              </div>
                                                          )}
                                                          <p className="text-zinc-100 font-medium leading-relaxed mt-4 drop-shadow-md">
                                                              {broadcastMsg || "Тук ще се появи вашето съобщение..."}
                                                          </p>
                                                      </div>

                                                      <div className="flex flex-col gap-3 w-full relative z-10">
                                                          {broadcastButtons.length > 0 ? broadcastButtons.map((btn, i) => (
                                                              <div 
                                                                  key={i} 
                                                                  className="w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border border-white/10"
                                                                  style={{ backgroundColor: broadcastColor }}
                                                              >
                                                                  {btn.label || "Текст на бутона"} <ExternalLink size={16}/>
                                                              </div>
                                                          )) : null}
                                                          <Button variant="secondary" className="w-full py-4 font-bold rounded-2xl !bg-white/10 !text-white hover:!bg-white/20 !border-white/20">
                                                              Затвори
                                                          </Button>
                                                      </div>
                                                 </div>
                                             ) : (
                                                 /* Toast Preview - Synchronized with App.tsx actual toast system */
                                                 <div className="flex flex-col gap-4 items-center justify-center py-20">
                                                     <div className="bg-white/60 dark:bg-[#09090b]/80 border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-2 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300 max-w-sm ring-1 ring-white/5 relative overflow-hidden">
                                                         {broadcastBgImage && (
                                                             <>
                                                                <img src={broadcastBgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
                                                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
                                                             </>
                                                         )}
                                                         <div className="flex items-center gap-3 relative z-10">
                                                            <div className="p-2.5 rounded-xl shrink-0 text-white shadow-lg" style={{ backgroundColor: broadcastColor }}>
                                                                <DynamicIcon name={broadcastIcon} className="w-5 h-5"/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${broadcastBgImage ? 'text-zinc-200' : 'text-zinc-500'}`}>{broadcastTitle || broadcastSender}</p>
                                                                <p className={`text-sm font-bold line-clamp-2 leading-tight ${broadcastBgImage ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>{broadcastMsg || "Тук ще се появи вашето съобщение..."}</p>
                                                            </div>
                                                            <button className={`${broadcastBgImage ? 'text-white/60' : 'text-zinc-500'} ml-2 self-start mt-1`}>
                                                               <X size={14}/>
                                                            </button>
                                                         </div>
                                                         
                                                         {/* Action buttons in Toast preview */}
                                                         {broadcastButtons.length > 0 && (
                                                             <div className="flex gap-2 relative z-10">
                                                                 {broadcastButtons.map((btn, i) => (
                                                                     <div 
                                                                         key={i} 
                                                                         className="flex-1 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest text-center shadow-md border border-white/10"
                                                                         style={{ backgroundColor: broadcastColor }}
                                                                     >
                                                                         {btn.label || "Action"} <ExternalLink size={10}/>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         )}
                                                     </div>
                                                     <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Toast Преглед</p>
                                                 </div>
                                             )}

                                             <p className="text-[10px] text-center text-zinc-600 font-medium px-4">
                                                 Бележка: Това е 1:1 симулация на изгледа. Текстът и бутоните ще изглеждат точно така в реалното приложение.
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* SYSTEM STATUS TAB */}
                             {activeTab === 'status' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 mb-8">
                                         <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-2">
                                             <h2 className="text-3xl font-black text-white">Системно Здраве</h2>
                                             <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
                                                 Мониторинг на живо
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
                                                                     {service.status === 'operational' ? 'Оперативен' : service.status === 'unknown' ? 'Няма активност' : 'Влошен'}
                                                                 </span>
                                                                 <span>•</span>
                                                                 <span>{service.status === 'unknown' ? 'N/A' : `${service.latency}ms`}</span>
                                                                 {service.lastCheck > 0 && (
                                                                     <>
                                                                         <span>•</span>
                                                                         <span>{new Date(service.lastCheck).toLocaleTimeString()}</span>
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
                                 </div>
                             )}

                             {/* FINANCE TAB */}
                             {activeTab === 'finance' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-emerald-400"><div className="p-2 bg-emerald-500/20 rounded-xl"><DollarSign size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">Месечен Приход</span></div>
                                                 <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-emerald-300 text-xs font-bold">MRR</div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">€{revenue.toFixed(2)}</div>
                                             <p className="text-sm text-zinc-500">Базирано на активни Stripe абонаменти.</p>
                                         </div>
                                         <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-red-400"><div className="p-2 bg-red-500/20 rounded-xl"><Cloud size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">AI Разходи</span></div>
                                                 <div className="flex items-center gap-2">{showEstimate && (<button onClick={() => { setCalibrationValue(costCorrection.toString()); setIsCalibrating(true); }} className="text-[10px] text-red-300 hover:text-white underline decoration-dotted font-bold">Корекция?</button>)}</div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">${displayCost.toFixed(4)}</div>
                                             <p className="text-sm text-zinc-500 flex items-center gap-2">{showEstimate ? 'Изчислено от токени + корекция.' : 'Директно от Google Cloud.'}</p>
                                             {isCalibrating && (<div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 animate-in fade-in"><div className="text-center w-full"><h4 className="text-white font-bold mb-2 text-sm">Калибриране на разходи</h4><div className="flex gap-2 justify-center"><input type="number" value={calibrationValue} onChange={e => setCalibrationValue(e.target.value)} className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-center outline-none focus:border-indigo-500" placeholder="0.34" autoFocus /><button onClick={handleSaveCalibration} className="bg-green-600 hover:bg-green-50 text-white rounded-lg p-2"><Check size={16}/></button><button onClick={() => setIsCalibrating(false)} className="bg-gray-600 hover:bg-gray-50 text-white rounded-lg p-2"><X size={16}/></button></div></div></div>)}
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         <div className="md:col-span-1 p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col justify-center items-center text-center"><div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Нетна Печалба</div><div className={`text-4xl font-black ${netProfit >= 0 ? 'text-indigo-400' : 'text-orange-500'}`}>€{netProfit.toFixed(2)}</div><div className="text-xs text-zinc-500 mt-1">Марж: {profitMargin.toFixed(1)}%</div></div>
                                         <div className="md:col-span-2 p-6 rounded-3xl border border-white/10 bg-white/5"><h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><CreditCard size={16}/> Счетоводна Книга</h4><div className="space-y-3 text-sm font-mono"><div className="flex justify-between items-center text-zinc-400"><span>Вход ({totalInputTokens.toLocaleString()})</span><span>${liveInputCost.toFixed(4)}</span></div><div className="flex justify-between items-center text-zinc-400"><span>Изход ({totalOutputTokens.toLocaleString()})</span><span>${liveOutputCost.toFixed(4)}</span></div>{costCorrection > 0 && (<div className="flex justify-between items-center text-amber-500"><span>Историческа Корекция</span><span>${costCorrection.toFixed(4)}</span></div>)}<div className="flex justify-between items-center text-indigo-400 border-t border-white/5 pt-2"><span>Stripe Такси (Прибл. 3%)</span><span>€{estimatedFees.toFixed(2)}</span></div></div></div>
                                     </div>
                                 </div>
                             )}

                             {/* USERS TAB */}
                             {activeTab === 'users' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="flex flex-col md:flex-row gap-4">
                                         <div className="flex-1 relative group">
                                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18}/>
                                             <input type="text" placeholder="Търсене по име, имейл или ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-lg"/>
                                         </div>
                                         
                                         <div className="flex gap-2">
                                             {/* Sort Menu */}
                                             <div className="relative">
                                                 <button 
                                                    onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }} 
                                                    className={`h-full px-6 flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold transition-all hover:bg-white/10 ${sortUsers !== 'activity' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 'text-zinc-400'}`}
                                                 >
                                                     <ArrowDownWideNarrow size={18}/> 
                                                     <span className="hidden sm:inline">Сортирай: {
                                                         sortUsers === 'activity' ? 'Активност' : 
                                                         sortUsers === 'newest' ? 'Нови' : 
                                                         sortUsers === 'oldest' ? 'Стари' : 
                                                         sortUsers === 'usage' ? 'Употреба' : 
                                                         sortUsers === 'level' ? 'Ниво' : 'Име'
                                                     }</span>
                                                 </button>
                                                 {showSortMenu && (
                                                     <div className="absolute top-full right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                                                         {[
                                                             {id: 'activity', label: 'Последна активност', icon: History},
                                                             {id: 'newest', label: 'Регистрация (Нови)', icon: UserPlus},
                                                             {id: 'oldest', label: 'Регистрация (Стари)', icon: Clock},
                                                             {id: 'usage', label: 'Топ Употреба (Tokens)', icon: Activity},
                                                             {id: 'level', label: 'Най-високо Ниво', icon: Trophy},
                                                             {id: 'name', label: 'По Име (А-Я)', icon: SortAsc}
                                                         ].map(s => (
                                                             <button 
                                                                key={s.id} 
                                                                onClick={() => { setSortUsers(s.id as any); setShowSortMenu(false); }} 
                                                                className={`w-full text-left px-4 py-3 text-xs font-bold uppercase hover:bg-white/5 flex items-center gap-2 ${sortUsers === s.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-zinc-500'}`}
                                                             >
                                                                 <s.icon size={14}/> {s.label}
                                                             </button>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>

                                             {/* Filter Menu */}
                                             <div className="relative">
                                                 <button 
                                                    onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }} 
                                                    className={`h-full px-6 flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold transition-all hover:bg-white/10 ${filterPlan !== 'all' || filterStatus !== 'all' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 'text-zinc-400'}`}
                                                 >
                                                     <Filter size={18}/> 
                                                     <span className="hidden sm:inline">Филтри</span>
                                                 </button>
                                                 {showFilterMenu && (
                                                     <div className="absolute top-full right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                                                         <div className="px-4 py-2 border-b border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">План</div>
                                                         {['all', 'free', 'plus', 'pro'].map(p => (
                                                             <button key={p} onClick={() => { setFilterPlan(p as any); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase hover:bg-white/5 ${filterPlan === p ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                                                 {p === 'all' ? 'Всички планове' : p}
                                                             </button>
                                                         ))}
                                                         <div className="px-4 py-2 border-y border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Статус</div>
                                                         {['all', 'online'].map(s => (
                                                             <button key={s} onClick={() => { setFilterStatus(s as any); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase hover:bg-white/5 ${filterStatus === s ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                 {s === 'all' ? 'Всички статуси' : 'Само Онлайн'}
                                                             </button>
                                                         ))}
                                                         <div className="p-2 border-t border-white/5">
                                                             <button onClick={() => { setFilterPlan('all'); setFilterStatus('all'); setShowFilterMenu(false); }} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-zinc-400 transition-colors">Нулирай всички</button>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {filteredAndSortedUsers.length === 0 ? (
                                             <div className="col-span-full py-20 text-center text-zinc-500 space-y-4">
                                                 <Search size={48} className="mx-auto opacity-20"/>
                                                 <p className="font-medium">Няма намерени потребители с тези критерии.</p>
                                             </div>
                                         ) : (
                                             filteredAndSortedUsers.map((user) => (
                                                 <div key={user.id} onClick={() => handleUserClick(user)} className="group bg-white/5 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer shadow-md hover:shadow-xl relative overflow-hidden">
                                                     <div className="flex items-start gap-4 relative z-10">
                                                         <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden relative" style={{ backgroundColor: user.theme }}>
                                                             {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0).toUpperCase()}
                                                             {isUserOnline(user.updatedAt) && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-black animate-pulse shadow-[0_0_10px_#22c55e]"></div>}
                                                         </div>
                                                         <div className="flex-1 min-w-0">
                                                             <div className="flex justify-between items-start">
                                                                 <h4 className="font-bold text-white truncate pr-2">{user.name}</h4>
                                                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${user.plan === 'pro' ? 'bg-amber-500 text-black' : user.plan === 'plus' ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>{user.plan}</span>
                                                             </div>
                                                             <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                                                                 <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(user.createdAt).toLocaleDateString('bg-BG')}</span>
                                                                 <span className="w-1 h-1 rounded-full bg-zinc-700"/>
                                                                 <span className="text-amber-500 font-bold">Lvl {user.level}</span>
                                                             </div>
                                                             <div className="mt-3 pt-3 border-t border-white/5 flex gap-4 text-[10px] font-mono text-zinc-400">
                                                                 <div>In: {(user.totalInput/1000).toFixed(1)}k</div>
                                                                 <div>Out: {(user.totalOutput/1000).toFixed(1)}k</div>
                                                                 <div className="ml-auto text-zinc-600">Активен: {user.lastVisit}</div>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             ))
                                         )}
                                     </div>
                                 </div>
                             )}

                             {/* KEYS TAB */}
                             {activeTab === 'keys' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"/><div className="flex-1 relative z-10"><h4 className="text-2xl font-black text-white mb-2">Генератор на Ключове</h4><p className="text-zinc-400 text-sm max-w-md">Създайте промоционални ключове за достъп.</p></div>
                                         <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/5 backdrop-blur-md relative z-10"><button onClick={() => setSelectedPlan('plus')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'plus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Zap size={16}/> Plus</button><button onClick={() => setSelectedPlan('pro')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'pro' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Crown size={16}/> Pro</button></div>
                                         <Button onClick={handleGenerate} icon={Plus} className="px-8 py-4 bg-white text-black hover:bg-zinc-200 shadow-xl rounded-2xl text-base relative z-10">Генерирай</Button>
                                     </div>
                                     <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-lg"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/5 bg-black/20"><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Код</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">План</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Създаден</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Статус</th><th className="p-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Действие</th></tr></thead><tbody className="divide-y divide-white/5">{dbKeys.map((k, i) => (<tr key={i} className="hover:bg-white/5 transition-colors group"><td className="p-5 font-mono text-sm text-indigo-400 font-medium">{k.code}</td><td className="p-5"><span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${k.plan === 'pro' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{k.plan || 'pro'}</span></td><td className="p-5 text-xs text-zinc-500">{k.createdAt ? new Date(k.createdAt).toLocaleDateString('bg-BG') : '-'}</td><td className="p-5"><div className={`flex items-center gap-2 text-xs font-bold ${k.isUsed ? 'text-red-400' : 'text-emerald-400'}`}><div className={`w-2 h-2 rounded-full ${k.isUsed ? 'bg-red-500' : 'bg-emerald-500'}`}/>{k.isUsed ? 'Изполвван' : 'Активен'}</div></td><td className="p-5 text-right flex justify-end gap-2"><button onClick={() => {navigator.clipboard.writeText(k.code); addToast('Копирано', 'success')}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"><Copy size={16}/></button>{k.id && <button onClick={() => handleDeleteKey(k.id!)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div></div>
                                 </div>
                             )}
                         </>
                     )}
                 </div>
             </div>
             
             {/* Optimized Icon Picker Modal with Infinite Loading */}
             {isIconPickerOpen && (
                 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setIsIconPickerOpen(false)}>
                     <div className="bg-[#0f0f11] border border-white/10 w-full max-w-2xl p-6 rounded-[32px] shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-6 shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                    <Plus size={20}/>
                                </div>
                                <h3 className="text-xl font-bold text-white">Всички икони</h3>
                             </div>
                             <button onClick={() => setIsIconPickerOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
                         </div>
                         
                         <div className="relative mb-6 shrink-0">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                             <input 
                                value={iconSearchTerm}
                                onChange={e => setIconSearchTerm(e.target.value)}
                                placeholder="Търси икона (на английски)..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                                autoFocus
                             />
                         </div>
                         
                         <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-10">
                             <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                 {renderedIcons.map(name => (
                                     <button 
                                        key={name} 
                                        onClick={() => { setBroadcastIcon(name); setIsIconPickerOpen(false); }}
                                        className="aspect-square rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 hover:bg-indigo-500 hover:border-indigo-400 hover:text-white transition-all group p-1 shadow-sm"
                                        title={name}
                                     >
                                         <DynamicIcon name={name} className="w-6 h-6 shrink-0"/>
                                         <span className="text-[7px] font-bold uppercase truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">{name}</span>
                                     </button>
                                 ))}
                             </div>
                             
                             {visibleIconCount < filteredIconsList.length && (
                                 <div className="mt-8 flex justify-center">
                                     <button 
                                        onClick={() => setVisibleIconCount(prev => prev + 150)}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 font-bold text-xs transition-all flex items-center gap-2"
                                     >
                                        Зареди още ({filteredIconsList.length - visibleIconCount} оставащи)
                                        <RefreshCw size={14} />
                                     </button>
                                 </div>
                             )}

                             {filteredIconsList.length === 0 && (
                                 <div className="py-20 text-center text-zinc-500 space-y-2">
                                     <HelpCircle size={32} className="mx-auto opacity-30"/>
                                     <p>Няма икони с такова име.</p>
                                 </div>
                             )}
                         </div>
                         
                         <div className="pt-4 border-t border-white/5 mt-auto shrink-0 flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">
                            <span>Общо икони: {filteredIconsList.length}</span>
                            <span>Показани: {renderedIcons.length}</span>
                         </div>
                     </div>
                 </div>
             )}

             {/* Lightbox for Reports */}
             <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
           </div>
        </div>
      );
    }

    return null;
};
