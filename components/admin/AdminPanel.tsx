
import React, { useState, useEffect } from 'react';
import { 
  Shield, X, Copy, CheckCircle, Key, Users, Activity, 
  RefreshCw, Search, Filter, Trash2, Plus, Zap, Crown, 
  ChevronRight, Edit2, Save, MoreHorizontal, Database, 
  Terminal, Calendar, ArrowUpRight, ArrowLeft, Mail,
  Clock, Hash, AlertTriangle, Check, Layers, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard,
  Settings, HelpCircle, ExternalLink, Cloud, Sliders, Cpu, Server, Info, AlertCircle, PenTool, History, Wrench,
  BarChart2, UserCheck, FileText, Smartphone, Wifi, Globe, HardDrive, Lock, Brain, LayoutDashboard,
  RotateCcw, CalendarDays, Coins, Radio, Send, PieChart as PieChartIcon, MessageSquare, Flag, CheckSquare, Square,
  ToggleLeft, ToggleRight, List, FileWarning
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, UserRole, Session, AdminLog, FeatureFlag, ErrorLog } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { SUBJECTS } from '../../constants';
import { t } from '../../utils/translations';
import { Lightbox } from '../ui/Lightbox';

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
    user_email?: string; // joined
    user_name?: string; // joined
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
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'status' | 'finance' | 'users' | 'keys' | 'broadcast' | 'reports' | 'system' | 'logs'>('dashboard');
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
    const [heatmapData, setHeatmapData] = useState<{day: number, hour: number, count: number}[]>([]);

    // Cohorts State
    const [cohortData, setCohortData] = useState<any[]>([]);

    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType, setBroadcastType] = useState<'toast' | 'modal'>('toast');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Logs & Config
    const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [globalXPMultiplier, setGlobalXPMultiplier] = useState(1);
    const [loadingSystem, setLoadingSystem] = useState(false);

    // Refund State
    const [refundId, setRefundId] = useState('');
    const [isRefunding, setIsRefunding] = useState(false);

    // User Details & Chat
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [userSessions, setUserSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Initial State - will be updated by real checks
    const [systemHealth, setSystemHealth] = useState<SystemService[]>([
        { name: 'Core Database (Supabase)', status: 'unknown', latency: 0, uptime: 100, icon: Database, lastCheck: 0 },
        { name: 'AI Models (Gemini)', status: 'unknown', latency: 0, uptime: 100, icon: Brain, lastCheck: 0 },
        { name: 'Voice Services (Live API)', status: 'unknown', latency: 0, uptime: 100, icon: Wifi, lastCheck: 0 },
        { name: 'Object Storage (DB)', status: 'unknown', latency: 0, uptime: 100, icon: HardDrive, lastCheck: 0 },
        { name: 'Payment Gateway (Stripe)', status: 'unknown', latency: 0, uptime: 100, icon: CreditCard, lastCheck: 0 },
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
            fetchHeatmapData();
            fetchCohortData();
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

    useEffect(() => {
        if (activeTab === 'system') fetchSystemConfig();
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const logAdminAction = async (action: string, details: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action,
            details
        });
    };

    const fetchUserChatHistory = async (userId: string) => {
        setLoadingSessions(true);
        try {
            // Note: This requires RLS policy to allow Admins to read other users' user_data
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

    const fetchHeatmapData = async () => {
        // Fetch sessions from user_data table to build a real heatmap
        // Since we can't easily query JSON inside text column 'data' for timestamps without heavy compute,
        // we'll fetch the updated_at of sessions as a proxy or fetch lightweight data
        const { data: userData } = await supabase.from('user_data').select('data').limit(200);
        
        if (userData) {
            const heatmap: Record<string, number> = {};
            
            // Initialize Grid
            for (let d = 0; d < 7; d++) {
                for (let h = 0; h < 24; h++) {
                    heatmap[`${d}-${h}`] = 0;
                }
            }

            // Populate Grid
            userData.forEach((row: any) => {
                const sessions: Session[] = row.data || [];
                sessions.forEach(s => {
                    s.messages.forEach(m => {
                        const date = new Date(m.timestamp);
                        const day = date.getDay(); // 0-6
                        const hour = date.getHours(); // 0-23
                        heatmap[`${day}-${hour}`] = (heatmap[`${day}-${hour}`] || 0) + 1;
                    });
                });
            });

            const result = Object.entries(heatmap).map(([key, count]) => {
                const [day, hour] = key.split('-').map(Number);
                return { day, hour, count };
            });
            setHeatmapData(result);
        }
    };

    const fetchCohortData = async () => {
        // Fetch all users with created_at and last_sign_in (updated_at)
        const { data: users } = await supabase.from('profiles').select('created_at, updated_at');
        
        if (users) {
            const cohorts: Record<string, { total: number, active: number }> = {};
            
            users.forEach((u: any) => {
                const created = new Date(u.created_at || u.updated_at); // Fallback
                const monthKey = `${created.getFullYear()}-${created.getMonth() + 1}`;
                
                if (!cohorts[monthKey]) cohorts[monthKey] = { total: 0, active: 0 };
                cohorts[monthKey].total++;

                // Consider active if updated within last 30 days
                const lastActive = new Date(u.updated_at);
                const diffTime = Math.abs(new Date().getTime() - lastActive.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays <= 30) {
                    cohorts[monthKey].active++;
                }
            });

            const result = Object.entries(cohorts)
                .map(([date, stats]) => ({
                    date,
                    total: stats.total,
                    retention: stats.total > 0 ? (stats.active / stats.total) * 100 : 0
                }))
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setCohortData(result);
        }
    };

    const fetchSubjectStats = async () => {
        setIsHeatmapLoading(true);
        try {
            // Using RPC function to get aggregate stats from JSONB column
            const { data, error } = await supabase.rpc('get_subject_usage', { days_lookback: heatmapRange });
            
            if (error) {
                console.warn("RPC get_subject_usage failed (missing function?):", error);
                // Fallback: Show empty state
                setSubjectStats([]);
            } else if (data) {
                const total = data.reduce((acc: number, curr: any) => acc + curr.count, 0);
                const stats: SubjectStat[] = data.map((item: any) => {
                    const subjectConfig = SUBJECTS.find(s => s.id === item.subject_id);
                    return {
                        subject_id: item.subject_id,
                        count: item.count,
                        percentage: total > 0 ? (item.count / total) * 100 : 0,
                        name: subjectConfig ? t(`subject_${subjectConfig.id}`, 'bg') : item.subject_id,
                        color: subjectConfig?.color || 'bg-gray-500' // Use full class
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

    const fetchSystemConfig = async () => {
        setLoadingSystem(true);
        try {
            const { data: flags } = await supabase.from('feature_flags').select('*');
            if (flags) setFeatureFlags(flags);

            const { data: config } = await supabase.from('app_config').select('*').eq('key', 'global_xp_multiplier').single();
            if (config) setGlobalXPMultiplier(config.value || 1);
        } catch (e) { console.error(e); }
        setLoadingSystem(false);
    };

    const toggleFeatureFlag = async (key: string, currentValue: boolean) => {
        await supabase.from('feature_flags').upsert({ key, enabled: !currentValue });
        setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !currentValue } : f));
        logAdminAction('toggle_flag', { key, value: !currentValue });
        addToast(`Flag ${key} updated`, 'success');
    };

    const updateGlobalXP = async (val: number) => {
        setGlobalXPMultiplier(val);
        await supabase.from('app_config').upsert({ key: 'global_xp_multiplier', value: val });
        logAdminAction('update_global_xp', { value: val });
        addToast(`Global XP Multiplier set to ${val}x`, 'success');
    };

    const fetchLogs = async () => {
        const { data: admin } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (admin) setAdminLogs(admin);

        const { data: errors } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (errors) setErrorLogs(errors);
    };

    const handleRefund = async () => {
        if (!refundId) return;
        setIsRefunding(true);
        try {
            const { data, error } = await supabase.functions.invoke('process-refund', {
                body: { payment_intent_id: refundId } // or charge_id
            });
            
            if (error || !data.success) throw new Error(error?.message || data?.error || "Refund failed");
            
            addToast("Refund processed successfully", "success");
            setRefundId('');
            logAdminAction('process_refund', { id: refundId });
        } catch (e: any) {
            addToast(`Refund Error: ${e.message}`, "error");
        } finally {
            setIsRefunding(false);
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
            logAdminAction('broadcast', { message: broadcastMsg, type: broadcastType });
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
            if (['users', 'dashboard', 'finance', 'reports'].includes(activeTab)) {
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
                            xp: u.xp || 0,
                            level: u.level || 1,
                            usage: settings?.stats?.dailyImageCount || 0,
                            lastVisit: settings?.stats?.lastVisit || new Date(u.updated_at).toLocaleDateString(),
                            createdAt: u.created_at || u.updated_at, // Use updated_at as fallback if created_at is missing
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

            // Fetch Reports
            if (activeTab === 'reports') {
                const { data: reports, error: reportsError } = await supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (reportsError) {
                    console.error("Reports error", reportsError);
                } else if (reports) {
                    // Enrich with user info from already fetched users or fetch individually
                    const enrichedReports = reports.map(r => {
                        const user = dbUsers.find(u => u.id === r.user_id);
                        return {
                            ...r,
                            user_email: user?.email || 'Unknown',
                            user_name: user?.name || 'Anonymous'
                        };
                    });
                    setDbReports(enrichedReports);
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
                                        // Normalize status 'outage' to 'down' if present in localStorage
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
        logAdminAction('generate_key', { plan: selectedPlan });
    };

    const handleDeleteKey = async (id: string) => {
        try {
            await supabase.from('promo_codes').delete().eq('id', id);
            setDbKeys(prev => prev.filter(k => k.id !== id));
            addToast('Ключът е изтрит', 'success');
            logAdminAction('delete_key', { id });
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
            
            const updatedSettings = { 
                ...currentSettings, 
                userName: editForm.name, 
                plan: editForm.plan, 
                stats: { ...(currentSettings.stats || {}), dailyImageCount: editForm.usage } 
            };

            // Update main profile columns AND settings JSON
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
            logAdminAction('update_user', { userId: selectedUser.id, updates: editForm });
            addToast('Промените са запазени успешно!', 'success');
        } catch (e) { addToast('Грешка при запазване.', 'error'); }
    };

    const handleResolveReport = async (reportId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
            const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', reportId);
            
            if (error) throw error;
            
            setDbReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            logAdminAction('resolve_report', { id: reportId, status: newStatus });
            addToast(`Статусът е променен на ${newStatus}`, 'success');
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

    // Helper to check if user is online (active within last 5 minutes)
    const isUserOnline = (updatedAt: string) => {
        const diff = new Date().getTime() - new Date(updatedAt).getTime();
        return diff < 5 * 60 * 1000;
    };

    // Financials & Unit Economics
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
    
    // Unit Economics
    const activeUserCount = dbUsers.length > 0 ? dbUsers.length : 1; 
    const payingUserCount = dbUsers.filter(u => u.plan !== 'free').length || 1;
    const ARPU = revenue / payingUserCount; // Average Revenue Per Paying User
    const ACPU = displayCost / activeUserCount; // Average Cost Per Active User

    // Status Bar Component
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

    // Comprehensive Color Map for all Subjects
    const COLOR_MAP: Record<string, string> = {
        'indigo-500': '#6366f1',
        'indigo-400': '#818cf8',
        'blue-500': '#3b82f6',
        'blue-400': '#60a5fa',
        'blue-600': '#2563eb',
        'blue-700': '#1d4ed8',
        'blue-800': '#1e40af',
        'red-500': '#ef4444',
        'red-400': '#f87171',
        'red-600': '#dc2626',
        'emerald-500': '#10b981',
        'emerald-600': '#059669',
        'emerald-700': '#047857',
        'amber-500': '#f59e0b',
        'amber-600': '#d97706',
        'amber-700': '#b45309',
        'amber-800': '#92400e',
        'yellow-500': '#eab308',
        'orange-500': '#f97316',
        'orange-400': '#fb923c',
        'orange-600': '#ea580c',
        'orange-700': '#c2410c',
        'violet-500': '#8b5cf6',
        'purple-400': '#c084fc',
        'purple-500': '#a855f7',
        'purple-600': '#9333ea',
        'purple-700': '#7e22ce',
        'green-500': '#22c55e',
        'green-600': '#16a34a',
        'green-700': '#15803d',
        'cyan-500': '#06b6d4',
        'cyan-700': '#0e7490',
        'pink-400': '#f472b6',
        'pink-500': '#ec4899',
        'pink-600': '#db2777',
        'rose-400': '#fb7185',
        'slate-500': '#64748b',
        'slate-600': '#475569',
        'slate-800': '#1e293b',
        'zinc-600': '#52525b',
        'stone-500': '#78716c',
        'sky-600': '#0284c7',
        'lime-600': '#65a30d',
        'gray-500': '#6b7280',
    };

    const getHexColor = (colorClass: string) => {
        const key = colorClass.replace('bg-', '');
        return COLOR_MAP[key] || '#6b7280';
    };

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
                    <input type="password" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest" autoFocus />
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
             <div className="w-full md:w-72 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6 backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between md:justify-start gap-3 px-2 mb-4 md:mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Shield size={18} fill="currentColor"/>
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">Контролен Панел</h2>
                            <div className="text-[10px] text-zinc-500 font-mono">v4.0 • Enterprise</div>
                        </div>
                    </div>
                    <button onClick={() => setShowAdminPanel(false)} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                    <button onClick={() => {setActiveTab('dashboard'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <LayoutDashboard size={18}/> <span className="hidden md:inline">Analytics</span><span className="md:hidden">Табло</span>
                    </button>
                    <button onClick={() => {setActiveTab('system'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Sliders size={18}/> <span className="hidden md:inline">System Config</span><span className="md:hidden">Система</span>
                    </button>
                    <button onClick={() => {setActiveTab('reports'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Flag size={18}/> <span className="hidden md:inline">Reports</span><span className="md:hidden">Доклади</span>
                    </button>
                    <button onClick={() => {setActiveTab('status'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'status' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity size={18}/> <span className="hidden md:inline">Health</span><span className="md:hidden">Статус</span>
                    </button>
                    <button onClick={() => {setActiveTab('broadcast'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Radio size={18}/> <span className="hidden md:inline">Broadcast</span><span className="md:hidden">Инфо</span>
                    </button>
                    <button onClick={() => {setActiveTab('finance'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'finance' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <DollarSign size={18}/> <span className="hidden md:inline">Finance</span><span className="md:hidden">Пари</span>
                    </button>
                    <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Users size={18}/> <span className="hidden md:inline">Users</span><span className="md:hidden">Хора</span>
                    </button>
                    <button onClick={() => {setActiveTab('keys'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <Key size={18}/> <span className="hidden md:inline">Access Keys</span><span className="md:hidden">Кодове</span>
                    </button>
                    <button onClick={() => {setActiveTab('logs'); setSelectedUser(null);}} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <List size={18}/> <span className="hidden md:inline">Audit Logs</span><span className="md:hidden">Логове</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 hidden md:block">
                    <button onClick={() => setShowAdminPanel(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <X size={18}/> Изход
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
                                 {activeTab === 'status' ? <div className={`w-2 h-2 rounded-full animate-pulse ${systemHealth.some(s => s.status === 'down') ? 'bg-red-500' : 'bg-green-500'}`}/> : null}
                                 {selectedUser ? 'Профил' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                             </h3>
                             <p className="text-xs text-zinc-500 mt-0.5 hidden md:block">{selectedUser ? `Детайли за ${selectedUser.name}` : 'Конзола за управление'}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <button onClick={() => {fetchData(); if(activeTab==='dashboard') {fetchSubjectStats(); fetchHeatmapData(); fetchCohortData();}}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Обнови данни">
                             <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''}/>
                         </button>
                     </div>
                 </div>

                 {/* Content Scroll Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-20 md:pb-8">
                     
                     {/* USER DETAIL MODAL REPLACEMENT */}
                     {selectedUser && editForm ? (
                         <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right fade-in duration-300">
                             {/* ... Profile Header (Unchanged) ... */}
                             {/* Profile Header */}
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
                                             <div className="flex items-center gap-2 truncate"><Mail size={14}/> {selectedUser.email || 'Email not visible'}</div>
                                             <div className="flex items-center gap-2 font-mono truncate"><Hash size={14}/> {selectedUser.id}</div>
                                             <div className="flex items-center gap-2 font-mono text-amber-500 truncate"><Crown size={14}/> Level {selectedUser.level} ({selectedUser.xp} XP)</div>
                                             {selectedUser.stripeId && <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 truncate"><CreditCard size={12}/> {selectedUser.stripeId}</div>}
                                             {isUserOnline(selectedUser.updatedAt) ? (
                                                 <div className="flex items-center gap-2 text-xs font-bold text-green-400 animate-pulse"><div className="w-2 h-2 rounded-full bg-green-500"/> ONLINE NOW</div>
                                             ) : (
                                                 <div className="text-xs text-zinc-500">Last active: {new Date(selectedUser.updatedAt).toLocaleString()}</div>
                                             )}
                                         </div>
                                     </div>

                                     <div className="flex flex-col gap-3 w-full md:w-auto">
                                         <Button onClick={handleSaveUserChanges} icon={Save} className="bg-white text-black hover:bg-zinc-200 shadow-xl w-full justify-center">Запази</Button>
                                         <div className="flex gap-2">
                                             <button onClick={() => setEditForm({...editForm, usage: 0})} className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Нулирай дневното потребление">
                                                 <RotateCcw size={18} className="mx-auto"/>
                                             </button>
                                             <button onClick={() => setShowRawData(JSON.stringify(selectedUser.rawSettings, null, 2))} className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors" title="View JSON">
                                                 <Database size={18} className="mx-auto"/>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {/* Edit Column */}
                                 <div className="md:col-span-1 space-y-6">
                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
                                         <h4 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-indigo-500"/> Редакция</h4>
                                         
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
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Level</label>
                                                 <input type="number" value={editForm.level} onChange={(e) => setEditForm({...editForm, level: parseInt(e.target.value) || 1})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors text-center"/>
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">XP</label>
                                                 <input type="number" value={editForm.xp} onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value) || 0})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors text-center"/>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-1 gap-4">
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
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><Coins size={20}/><span className="text-xs font-bold uppercase">Цена (Est)</span></div>
                                             <div className="text-xl md:text-2xl font-mono font-bold text-emerald-400 truncate">
                                                 ${((selectedUser.totalInput / 1000000 * PRICE_INPUT_1M) + (selectedUser.totalOutput / 1000000 * PRICE_OUTPUT_1M)).toFixed(5)}
                                             </div>
                                         </div>
                                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                             <div className="flex items-center gap-3 text-zinc-400 mb-2"><Brain size={20}/><span className="text-xs font-bold uppercase">Токени</span></div>
                                             <div className="text-xl md:text-2xl font-mono font-bold text-indigo-400 truncate">
                                                 {(selectedUser.totalInput + selectedUser.totalOutput).toLocaleString()}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                         <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-zinc-500"/> Разпределение</h4>
                                         <div className="space-y-4">
                                             <div>
                                                 <div className="flex justify-between text-xs mb-1">
                                                     <span className="text-zinc-400">Входящи</span>
                                                     <span className="text-white font-mono">{selectedUser.totalInput.toLocaleString()}</span>
                                                 </div>
                                                 <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                     <div className="h-full bg-blue-500" style={{ width: `${(selectedUser.totalInput / (selectedUser.totalInput + selectedUser.totalOutput || 1)) * 100}%` }}/>
                                                 </div>
                                             </div>
                                             <div>
                                                 <div className="flex justify-between text-xs mb-1">
                                                     <span className="text-zinc-400">Изходящи</span>
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

                             {/* CHAT VIEWER */}
                             <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                                <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                                    <h4 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-indigo-500"/> Chat History</h4>
                                    <span className="text-xs text-zinc-500 font-mono">Requires Admin RLS Policy</span>
                                </div>
                                
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Sessions List */}
                                    <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar bg-black/10">
                                        {loadingSessions ? (
                                            <div className="p-4 text-center text-zinc-500 text-sm"><RefreshCw size={16} className="animate-spin inline mr-2"/> Loading...</div>
                                        ) : userSessions.length === 0 ? (
                                            <div className="p-8 text-center text-zinc-500 text-sm">No chat history found.</div>
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

                                    {/* Messages View */}
                                    <div className="w-2/3 overflow-y-auto custom-scrollbar bg-[#09090b] p-4 space-y-4">
                                        {activeSessionId ? (
                                            userSessions.find(s => s.id === activeSessionId)?.messages.map((msg, i) => (
                                                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-zinc-200 rounded-bl-none border border-white/5'}`}>
                                                        {msg.text}
                                                        {msg.images && msg.images.length > 0 && (
                                                            <div className="mt-2 text-xs opacity-70 italic">[Image attached]</div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-600 mt-1 px-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Select a session to view messages</div>
                                        )}
                                    </div>
                                </div>
                             </div>
                         </div>
                     ) : (
                         <>
                             {/* DASHBOARD TAB (Enhanced) */}
                             {activeTab === 'dashboard' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                                         <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-blue-400"><Users size={24}/><span className="font-bold text-sm uppercase tracking-wider">Общо</span></div>
                                                 <div className="text-4xl font-black text-white">{dbUsers.length}</div>
                                             </div>
                                             <Users size={100} className="absolute -bottom-4 -right-4 text-blue-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-emerald-400"><DollarSign size={24}/><span className="font-bold text-sm uppercase tracking-wider">Приходи (MRR)</span></div>
                                                 <div className="text-4xl font-black text-white">€{revenue.toFixed(2)}</div>
                                             </div>
                                             <DollarSign size={100} className="absolute -bottom-4 -right-4 text-emerald-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-indigo-400"><Coins size={24}/><span className="font-bold text-sm uppercase tracking-wider">ARPU</span></div>
                                                 <div className="text-4xl font-black text-white">€{ARPU.toFixed(2)}</div>
                                             </div>
                                             <Coins size={100} className="absolute -bottom-4 -right-4 text-indigo-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                         <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl relative overflow-hidden group">
                                             <div className="relative z-10">
                                                 <div className="flex items-center gap-3 mb-2 text-orange-400"><Activity size={24}/><span className="font-bold text-sm uppercase tracking-wider">ACPU</span></div>
                                                 <div className="text-4xl font-black text-white">€{ACPU.toFixed(2)}</div>
                                             </div>
                                             <Activity size={100} className="absolute -bottom-4 -right-4 text-orange-500/10 group-hover:scale-110 transition-transform"/>
                                         </div>
                                     </div>

                                     {/* Peak Usage Heatmap */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                         <div className="flex justify-between items-center mb-6">
                                             <h3 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp size={20} className="text-red-500"/> Пиково Натоварване (Heatmap)</h3>
                                         </div>
                                         
                                         {heatmapData.length === 0 ? (
                                             <div className="text-center py-12 text-zinc-500">Зареждане на данни...</div>
                                         ) : (
                                             <div className="overflow-x-auto">
                                                 <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1 min-w-[800px]">
                                                     <div className="col-span-1"></div>
                                                     {Array.from({length: 24}).map((_, h) => (
                                                         <div key={h} className="text-[10px] text-zinc-500 text-center">{h}</div>
                                                     ))}
                                                     
                                                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, d) => (
                                                         <React.Fragment key={d}>
                                                             <div className="text-xs text-zinc-400 font-bold pr-2 self-center">{day}</div>
                                                             {Array.from({length: 24}).map((_, h) => {
                                                                 const count = heatmapData.find(x => x.day === d && x.hour === h)?.count || 0;
                                                                 const intensity = Math.min(count * 20, 100); // Scale logic
                                                                 return (
                                                                     <div 
                                                                         key={h} 
                                                                         className="h-8 rounded-sm transition-all hover:ring-1 hover:ring-white/50"
                                                                         style={{ backgroundColor: `rgba(99, 102, 241, ${intensity / 100})`, opacity: intensity > 0 ? 1 : 0.1 }}
                                                                         title={`${count} сесии`}
                                                                     />
                                                                 );
                                                             })}
                                                         </React.Fragment>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>

                                     {/* Retention Cohorts */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8">
                                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Кохорти на Задържане</h3>
                                         <div className="overflow-x-auto">
                                             <table className="w-full text-left border-collapse">
                                                 <thead>
                                                     <tr className="text-zinc-500 text-xs uppercase border-b border-white/5">
                                                         <th className="p-3">Месец</th>
                                                         <th className="p-3 text-center">Нови Потр.</th>
                                                         <th className="p-3 text-center">Активни (30d)</th>
                                                         <th className="p-3 text-center">Задържане</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody>
                                                     {cohortData.map((row, i) => (
                                                         <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                             <td className="p-3 font-mono text-zinc-300">{row.date}</td>
                                                             <td className="p-3 text-center text-white font-bold">{row.total}</td>
                                                             <td className="p-3 text-center text-white">{row.active}</td>
                                                             <td className="p-3">
                                                                 <div className="flex items-center gap-2">
                                                                     <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                                                         <div 
                                                                             className={`h-full ${row.retention > 50 ? 'bg-green-500' : row.retention > 20 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                                                             style={{width: `${row.retention}%`}}
                                                                         />
                                                                     </div>
                                                                     <span className="text-xs font-mono w-10 text-right">{row.retention.toFixed(1)}%</span>
                                                                 </div>
                                                             </td>
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* FINANCE TAB (Enhanced with Refunds) */}
                             {activeTab === 'finance' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     {/* ... Existing Finance Cards ... */}
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-emerald-400"><div className="p-2 bg-emerald-500/20 rounded-xl"><DollarSign size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">Месечен приход</span></div>
                                                 <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-emerald-300 text-xs font-bold">MRR</div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">€{revenue.toFixed(2)}</div>
                                             <p className="text-sm text-zinc-500">Based on active Stripe subscriptions.</p>
                                         </div>
                                         <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[32px] relative overflow-hidden">
                                             <div className="flex justify-between items-start mb-6">
                                                 <div className="flex items-center gap-3 text-red-400"><div className="p-2 bg-red-500/20 rounded-xl"><Cloud size={24}/></div><span className="font-bold uppercase tracking-wider text-xs">Разход за AI</span></div>
                                             </div>
                                             <div className="text-5xl font-black text-white tracking-tight mb-2">${displayCost.toFixed(4)}</div>
                                             <p className="text-sm text-zinc-500 flex items-center gap-2">Based on token usage.</p>
                                         </div>
                                     </div>

                                     {/* Refund Processor */}
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><RotateCcw size={20} className="text-orange-500"/> Обработка на Възстановявания (Refunds)</h3>
                                         <div className="flex gap-4 items-end bg-black/30 p-6 rounded-2xl border border-white/5">
                                             <div className="flex-1 space-y-2">
                                                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Payment Intent ID / Email</label>
                                                 <input 
                                                     value={refundId} 
                                                     onChange={e => setRefundId(e.target.value)} 
                                                     placeholder="pi_3M..." 
                                                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition-colors"
                                                 />
                                             </div>
                                             <Button onClick={handleRefund} disabled={isRefunding || !refundId} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl shadow-lg shadow-orange-500/20 h-[46px]">
                                                 {isRefunding ? 'Обработка...' : 'Възстанови сума'}
                                             </Button>
                                         </div>
                                         <p className="text-xs text-zinc-500 mt-3 ml-2">⚠️ Това действие ще върне пълната сума на клиента чрез Stripe.</p>
                                     </div>
                                 </div>
                             )}

                             {/* SYSTEM CONFIG TAB */}
                             {activeTab === 'system' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ToggleRight size={20} className="text-purple-500"/> Feature Flags</h3>
                                         
                                         {loadingSystem ? (
                                             <div className="text-zinc-500">Loading config...</div>
                                         ) : (
                                             <div className="grid gap-4">
                                                 {featureFlags.length === 0 && <div className="text-zinc-500 italic">No flags found in DB.</div>}
                                                 {featureFlags.map(flag => (
                                                     <div key={flag.key} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                                                         <div>
                                                             <div className="font-bold text-white text-sm">{flag.key}</div>
                                                             <div className="text-xs text-zinc-500">{flag.description}</div>
                                                         </div>
                                                         <button 
                                                             onClick={() => toggleFeatureFlag(flag.key, flag.enabled)}
                                                             className={`w-12 h-6 rounded-full transition-colors relative ${flag.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                                         >
                                                             <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-0'}`}/>
                                                         </button>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>

                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Zap size={20} className="text-amber-500"/> Global Config</h3>
                                         
                                         <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                                             <div>
                                                 <div className="font-bold text-white text-sm">Global XP Multiplier</div>
                                                 <div className="text-xs text-zinc-500">Увеличава спечеления XP за всички потребители.</div>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                 <span className="text-amber-400 font-black font-mono text-lg">{globalXPMultiplier}x</span>
                                                 <div className="flex gap-1">
                                                     <button onClick={() => updateGlobalXP(1)} className={`px-3 py-1 rounded-lg text-xs font-bold ${globalXPMultiplier === 1 ? 'bg-white text-black' : 'bg-white/10 text-zinc-400'}`}>1x</button>
                                                     <button onClick={() => updateGlobalXP(1.5)} className={`px-3 py-1 rounded-lg text-xs font-bold ${globalXPMultiplier === 1.5 ? 'bg-white text-black' : 'bg-white/10 text-zinc-400'}`}>1.5x</button>
                                                     <button onClick={() => updateGlobalXP(2)} className={`px-3 py-1 rounded-lg text-xs font-bold ${globalXPMultiplier === 2 ? 'bg-amber-500 text-black' : 'bg-white/10 text-zinc-400'}`}>2x</button>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* LOGS TAB */}
                             {activeTab === 'logs' && (
                                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                         {/* Admin Activity */}
                                         <div className="bg-white/5 border border-white/5 rounded-3xl p-6 h-[600px] flex flex-col">
                                             <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-indigo-500"/> Admin Activity Log</h3>
                                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 bg-black/30 p-2 rounded-xl border border-white/5">
                                                 {adminLogs.length === 0 && <div className="text-zinc-500 text-center p-4">No logs found.</div>}
                                                 {adminLogs.map(log => (
                                                     <div key={log.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs">
                                                         <div className="flex justify-between mb-1">
                                                             <span className="font-bold text-indigo-400 uppercase">{log.action}</span>
                                                             <span className="text-zinc-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                                                         </div>
                                                         <div className="text-zinc-300 font-mono break-all">{JSON.stringify(log.details)}</div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                         {/* Error Stream */}
                                         <div className="bg-white/5 border border-white/5 rounded-3xl p-6 h-[600px] flex flex-col">
                                             <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileWarning size={20} className="text-red-500"/> Error Log Stream</h3>
                                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 bg-black/30 p-2 rounded-xl border border-white/5">
                                                 {errorLogs.length === 0 && <div className="text-zinc-500 text-center p-4">No errors logged.</div>}
                                                 {errorLogs.map(log => (
                                                     <div key={log.id} className="p-3 bg-red-900/10 rounded-lg border border-red-500/20 text-xs">
                                                         <div className="flex justify-between mb-1">
                                                             <span className="font-bold text-red-400">Error</span>
                                                             <span className="text-zinc-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                                                         </div>
                                                         <div className="text-red-200 mb-2 font-bold">{log.error}</div>
                                                         {log.context && <div className="text-zinc-400 font-mono bg-black/40 p-2 rounded">{JSON.stringify(log.context)}</div>}
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* ... Other Tabs (Keys, Broadcast, Reports, Status) ... */}
                             {/* KEYS TAB */}
                             {activeTab === 'keys' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"/><div className="flex-1 relative z-10"><h4 className="text-2xl font-black text-white mb-2">Генериране на ключ</h4><p className="text-zinc-400 text-sm max-w-md">Създаване на промоционални ключове.</p></div>
                                         <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/5 backdrop-blur-md relative z-10"><button onClick={() => setSelectedPlan('plus')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'plus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Zap size={16}/> Plus</button><button onClick={() => setSelectedPlan('pro')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedPlan === 'pro' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Crown size={16}/> Pro</button></div>
                                         <Button onClick={handleGenerate} icon={Plus} className="px-8 py-4 bg-white text-black hover:bg-zinc-200 shadow-xl rounded-2xl text-base relative z-10">Генерирай</Button>
                                     </div>
                                     <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-lg"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/5 bg-black/20"><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Код</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">План</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Създаден</th><th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Статус</th><th className="p-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Действие</th></tr></thead><tbody className="divide-y divide-white/5">{dbKeys.map((k, i) => (<tr key={i} className="hover:bg-white/5 transition-colors group"><td className="p-5 font-mono text-sm text-indigo-400 font-medium">{k.code}</td><td className="p-5"><span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${k.plan === 'pro' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{k.plan || 'pro'}</span></td><td className="p-5 text-xs text-zinc-500">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '-'}</td><td className="p-5"><div className={`flex items-center gap-2 text-xs font-bold ${k.isUsed ? 'text-red-400' : 'text-emerald-400'}`}><div className={`w-2 h-2 rounded-full ${k.isUsed ? 'bg-red-500' : 'bg-emerald-500'}`}/>{k.isUsed ? 'Използван' : 'Активен'}</div></td><td className="p-5 text-right flex justify-end gap-2"><button onClick={() => {navigator.clipboard.writeText(k.code); addToast('Copied', 'success')}} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"><Copy size={16}/></button>{k.id && <button onClick={() => handleDeleteKey(k.id!)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div></div>
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
                                                 Показване на последните 50
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
                                                                         {report.status}
                                                                     </span>
                                                                     <span className="text-xs text-zinc-500 font-mono">
                                                                         {new Date(report.created_at).toLocaleString()}
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
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                                             <div className="flex items-center gap-4 mb-6">
                                                 <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20"><Radio size={24}/></div>
                                                 <div>
                                                     <h3 className="text-2xl font-bold text-white">Глобално съобщение</h3>
                                                     <p className="text-zinc-500 text-sm">Изпращане на съобщения в реално време до всички.</p>
                                                 </div>
                                             </div>

                                             <div className="space-y-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Съобщение</label>
                                                     <textarea 
                                                         value={broadcastMsg}
                                                         onChange={(e) => setBroadcastMsg(e.target.value)}
                                                         placeholder="Внимание: Планирана поддръжка..."
                                                         className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                                                     />
                                                 </div>

                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Тип</label>
                                                     <div className="grid grid-cols-2 gap-3">
                                                         <button 
                                                             onClick={() => setBroadcastType('toast')}
                                                             className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'toast' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                         >
                                                             <AlertCircle size={24}/>
                                                             <span className="font-bold text-sm">Известие (Toast)</span>
                                                         </button>
                                                         <button 
                                                             onClick={() => setBroadcastType('modal')}
                                                             className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${broadcastType === 'modal' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                                         >
                                                             <Radio size={24}/>
                                                             <span className="font-bold text-sm">Екранен прозорец</span>
                                                         </button>
                                                     </div>
                                                 </div>

                                                 <Button 
                                                     onClick={handleSendBroadcast} 
                                                     disabled={isBroadcasting || !broadcastMsg.trim()}
                                                     className={`w-full py-4 text-base shadow-xl ${broadcastType === 'modal' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                                                     icon={Send}
                                                 >
                                                     {isBroadcasting ? 'Изпращане...' : 'Изпрати'}
                                                 </Button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* SYSTEM STATUS TAB */}
                             {activeTab === 'status' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 mb-8">
                                         <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-2">
                                             <h2 className="text-3xl font-black text-white">Системен статус</h2>
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
                                                                     {service.status === 'operational' ? 'Работи' : service.status === 'unknown' ? 'Няма активност' : 'Проблем'}
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

                             {/* USERS TAB (Existing code reused) */}
                             {activeTab === 'users' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     {/* ... User Search/Filter ... */}
                                     <div className="flex flex-col md:flex-row gap-4">
                                         <div className="flex-1 relative group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18}/><input type="text" placeholder="Търсене по име, имейл или ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-lg"/></div>
                                         <div className="flex gap-2">
                                             <button onClick={() => setSortUsers(sortUsers === 'recent' ? 'usage' : 'recent')} className="px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-zinc-400 hover:text-white font-medium text-sm transition-all min-w-[100px]">{sortUsers === 'recent' ? 'Последни' : 'Топ потребление'}</button>
                                             <div className="relative"><button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`h-full px-6 flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold transition-all hover:bg-white/10 ${filterPlan !== 'all' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 'text-zinc-400'}`}><Filter size={18}/> {filterPlan === 'all' ? 'Всички' : filterPlan}</button>{showFilterMenu && (<div className="absolute top-full right-0 mt-2 w-32 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">{['all', 'free', 'plus', 'pro'].map(p => (<button key={p} onClick={() => { setFilterPlan(p as any); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold uppercase hover:bg-white/5 ${filterPlan === p ? 'text-indigo-400' : 'text-zinc-500'}`}>{p}</button>))}</div>)}</div>
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {dbUsers.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) || u.id.includes(searchQuery)).filter(u => filterPlan === 'all' || u.plan === filterPlan).sort((a, b) => sortUsers === 'recent' ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : (b.totalInput + b.totalOutput) - (a.totalInput + a.totalOutput)).map((user) => (
                                             <div key={user.id} onClick={() => handleUserClick(user)} className="group bg-white/5 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer shadow-md hover:shadow-xl relative overflow-hidden">
                                                 <div className="flex items-start gap-4 relative z-10">
                                                     <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden relative" style={{ backgroundColor: user.theme }}>
                                                         {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0).toUpperCase()}
                                                         {isUserOnline(user.updatedAt) && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-black animate-pulse"></div>}
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <div className="flex justify-between items-start">
                                                             <h4 className="font-bold text-white truncate pr-2">{user.name}</h4>
                                                             <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${user.plan === 'pro' ? 'bg-amber-500 text-black' : user.plan === 'plus' ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>{user.plan}</span>
                                                         </div>
                                                         <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                                                             <span>ID: {user.id.substring(0,6)}</span>
                                                             <span className="w-1 h-1 rounded-full bg-zinc-700"/>
                                                             <span className="text-amber-500 font-bold">Lvl {user.level}</span>
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
                         </>
                     )}
                 </div>
             </div>
             
             {/* Lightbox for Reports */}
             <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
           </div>
        </div>
      );
    }

    return null;
};
