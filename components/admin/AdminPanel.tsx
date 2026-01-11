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
  FileText, Briefcase, Target, Languages, Globe, HelpCircle, Trophy, ImageIcon, Upload
} from 'lucide-react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { UserPlan, Session } from '../../types';
import { SUBJECTS, DEFAULT_AVATAR } from '../../constants';
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

// Added missing Report interface
interface Report {
    id: string;
    user_id: string;
    title: string;
    description: string;
    images: string[];
    status: 'open' | 'closed';
    created_at: string;
}

// Added missing FinancialData interface
interface FinancialData {
  balance: number;
  pending: number;
  currency: string;
  totalGrossRecent: number;
  mrr: number;
  googleCloudCost: number;
  googleCloudConnected: boolean;
  lastSync: string;
}

// Added missing AdminPanelProps interface
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
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
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
    
    // Fixed Error: Added missing token state variables
    const [totalInputTokens, setTotalInputTokens] = useState(0);
    const [totalOutputTokens, setTotalOutputTokens] = useState(0);
    
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
                    
                    const mappedUsers: AdminUser[] = users.map((u: any) => {
                        let settings = u.settings;
                        if (typeof settings === 'string') {
                            try { settings = JSON.parse(settings); } catch (e) {}
                        }
                        
                        const uIn = settings?.stats?.totalInputTokens || 0;
                        const uOut = settings?.stats?.totalOutputTokens || 0;
                        
                        tIn += uIn;
                        tOut += uOut;
                        
                        const avatarUrl = u.avatar_url || settings?.avatar || DEFAULT_AVATAR;
                        
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
                    // Fixed Error: Calls to setters now valid
                    setTotalInputTokens(tIn);
                    setTotalOutputTokens(tOut);
                }
            }
        } catch (e) {
            console.error("Admin fetchData Error:", e);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (showAdminPanel) fetchData();
    }, [showAdminPanel, activeTab]);

    if (!showAdminPanel && !showAdminAuth) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in overflow-hidden">
            {showAdminAuth ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm p-8 bg-zinc-900 border border-white/10 rounded-[32px] space-y-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="p-4 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                                <Shield size={32}/>
                            </div>
                            <h2 className="text-2xl font-black text-white">Admin Access</h2>
                        </div>
                        <input 
                            type="password"
                            value={adminPasswordInput}
                            onChange={e => setAdminPasswordInput(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-black p-4 rounded-xl border border-white/10 text-white outline-none focus:border-indigo-500"
                            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                        />
                        <Button onClick={handleAdminLogin} className="w-full py-4">Unlock Panel</Button>
                        <button onClick={() => setShowAdminAuth(false)} className="w-full text-zinc-500 font-bold py-2">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                        <div className="flex items-center gap-4">
                            <Shield className="text-indigo-500" size={24}/>
                            <h1 className="text-xl font-black text-white uppercase tracking-widest">Admin Dashboard</h1>
                        </div>
                        <button onClick={() => setShowAdminPanel(false)} className="p-2 text-zinc-500 hover:text-white"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="p-6 bg-zinc-900 border border-white/10 rounded-2xl">
                                 <div className="text-zinc-500 text-xs font-bold uppercase mb-2">Total Users</div>
                                 <div className="text-3xl font-black text-white">{dbUsers.length}</div>
                             </div>
                             <div className="p-6 bg-zinc-900 border border-white/10 rounded-2xl">
                                 <div className="text-zinc-500 text-xs font-bold uppercase mb-2">Total Input Tokens</div>
                                 <div className="text-3xl font-black text-indigo-400">{totalInputTokens.toLocaleString()}</div>
                             </div>
                             <div className="p-6 bg-zinc-900 border border-white/10 rounded-2xl">
                                 <div className="text-zinc-500 text-xs font-bold uppercase mb-2">Total Output Tokens</div>
                                 <div className="text-3xl font-black text-emerald-400">{totalOutputTokens.toLocaleString()}</div>
                             </div>
                         </div>
                         <div className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                             <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={20}/> Top Users</h2>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead>
                                         <tr className="text-zinc-500 text-xs uppercase border-b border-white/5">
                                             <th className="pb-4">User</th>
                                             <th className="pb-4">Plan</th>
                                             <th className="pb-4">Level/XP</th>
                                             <th className="pb-4">Usage</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-white/5">
                                         {dbUsers.slice(0, 20).map(u => (
                                             <tr key={u.id} className="text-sm">
                                                 <td className="py-4">
                                                     <div className="flex items-center gap-3">
                                                         <img src={u.avatar} className="w-8 h-8 rounded-full"/>
                                                         <div>
                                                             <div className="text-white font-bold">{u.name}</div>
                                                             <div className="text-zinc-500 text-xs">{u.email}</div>
                                                         </div>
                                                     </div>
                                                 </td>
                                                 <td className="py-4 uppercase font-black text-[10px]">{u.plan}</td>
                                                 <td className="py-4">
                                                     <div className="text-white">Lvl {u.level}</div>
                                                     <div className="text-zinc-500 text-xs">{u.xp} XP</div>
                                                 </td>
                                                 <td className="py-4">
                                                     <div className="text-indigo-400 font-mono">I: {u.totalInput}</div>
                                                     <div className="text-emerald-400 font-mono">O: {u.totalOutput}</div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                    </div>
                </div>
            )}
            <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
        </div>
    );
};
