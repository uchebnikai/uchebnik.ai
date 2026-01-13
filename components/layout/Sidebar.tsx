
import React, { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, CloudOff, RefreshCw, Cloud, PanelLeftClose, PanelLeftOpen, LogIn, Snowflake, Gift, Trophy, Target, AlertTriangle, Sparkles, PartyPopper, Shield, Clock } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SUBJECTS } from '../../constants';
import { SubjectId, AppMode, Session, UserRole, UserSettings, UserPlan, SubjectConfig, HomeViewType } from '../../types';
import { t } from '../../utils/translations';
import { getRank, getLevelStats } from '../../utils/gamification';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  userSettings: UserSettings;
  setUserSettings: (val: any) => void; 
  userPlan: UserPlan;
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: HomeViewType) => void;
  setUserRole: (role: UserRole | null) => void;
  handleSubjectChange: (subject: SubjectConfig, role?: UserRole) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  sessions: Session[];
  deleteSession: (id: string) => void;
  createNewSession: (subjectId: SubjectId, role?: UserRole, initialMode?: AppMode) => void;
  unreadSubjects: Set<string>;
  activeMode: AppMode;
  userMeta: any;
  session: any;
  setShowUnlockModal: (val: boolean) => void;
  setShowReferralModal: (val: boolean) => void; 
  setShowSettings: (val: boolean) => void;
  handleLogout: () => void;
  setShowAuthModal: (val: boolean) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setShowSubjectDashboard: (val: boolean) => void;
  userRole: UserRole | null;
  streak: number; 
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  homeView: HomeViewType;
  dailyImageCount?: number; 
  setShowLeaderboard?: (val: boolean) => void;
  setShowQuests?: (val: boolean) => void;
  setShowReportModal?: (val: boolean) => void;
  globalConfig: any;
  isAdmin?: boolean;
}

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  userSettings,
  setUserSettings,
  userPlan,
  activeSubject,
  setActiveSubject,
  setHomeView,
  setUserRole,
  handleSubjectChange,
  activeSessionId,
  setActiveSessionId,
  sessions,
  deleteSession,
  createNewSession,
  unreadSubjects,
  activeMode,
  userMeta,
  session,
  setShowUnlockModal,
  setShowReferralModal,
  setShowSettings,
  handleLogout,
  setShowAuthModal,
  addToast,
  setShowSubjectDashboard,
  userRole,
  syncStatus = 'synced',
  homeView,
  dailyImageCount = 0,
  setShowLeaderboard,
  setShowQuests,
  setShowReportModal,
  globalConfig,
  isAdmin = false
}: SidebarProps) => {
    
    // Collapsible sections
    const [sectionsOpen, setSectionsOpen] = useState({
        general: true,
        school: true,
        uni: true
    });

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const toggleCollapse = () => setCollapsed(!collapsed);
    const toggleSection = (section: keyof typeof sectionsOpen) => {
        setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Group sessions by category for easy access in sidebar
    const categorizedSessions = useMemo(() => {
        return {
            general: sessions.filter(s => s.subjectId === SubjectId.GENERAL),
            school: sessions.filter(s => {
                const sub = SUBJECTS.find(sub => sub.id === s.subjectId);
                return sub?.categories.includes('school') && s.subjectId !== SubjectId.GENERAL;
            }),
            uni: sessions.filter(s => {
                const sub = SUBJECTS.find(sub => sub.id === s.subjectId);
                return sub?.categories.includes('university') && s.subjectId !== SubjectId.GENERAL;
            })
        };
    }, [sessions]);

    // Usage Logic
    const maxImages = userPlan === 'free' ? 4 : (userPlan === 'plus' ? 12 : 9999);
    const shouldShowReferral = userPlan === 'free';

    // Gamification Logic
    const currentRank = getRank(userSettings.level);
    const stats = getLevelStats(userSettings.xp, userSettings.level);
    const RankIcon = currentRank.icon;

    // Helper to render session list
    const renderSessionList = (sectionSessions: Session[]) => {
        if (collapsed) return null;
        return (
            <div className="mt-1 space-y-0.5 border-l-2 border-zinc-200 dark:border-white/5 ml-4 pl-2 animate-in slide-in-from-top-2">
                {sectionSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center group/session">
                        <button 
                            onClick={() => { 
                                const sub = SUBJECTS.find(sub => sub.id === s.subjectId);
                                if (sub) {
                                    setActiveSubject(sub);
                                    setUserRole(s.role || null);
                                    setShowSubjectDashboard(false);
                                }
                                setActiveSessionId(s.id); 
                                if(isMobile) setSidebarOpen(false); 
                            }}
                            className={`flex-1 text-left px-3 py-1.5 rounded-lg text-[11px] font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-indigo-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            title={s.title}
                        >
                            {s.title}
                        </button>
                        <button onClick={() => deleteSession(s.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                    </div>
                ))}
                {sectionSessions.length > 5 && (
                    <div className="px-3 py-1 text-[10px] text-zinc-400 font-medium italic">
                        + {sectionSessions.length - 5} още в историята
                    </div>
                )}
            </div>
        );
    };

    const isSchoolActive = activeSubject?.categories.includes('school') && activeSubject.id !== SubjectId.GENERAL;
    const isUniActive = activeSubject?.categories.includes('university') && activeSubject.id !== SubjectId.GENERAL;

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 
          bg-white/95 dark:bg-black/95 lg:bg-white/60 lg:dark:bg-black/60 backdrop-blur-2xl border-r border-white/20 dark:border-white/10
          transition-all duration-300 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${collapsed ? 'lg:w-[88px]' : 'lg:w-[320px]'} w-[280px]
          shadow-2xl lg:shadow-none h-full`}>
          
          <div className={`p-4 pb-2 flex items-center shrink-0 ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className={`flex items-center gap-3 group ${collapsed ? 'justify-center' : ''}`}>
               <img 
                  src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" 
                  alt="Uchebnik AI Logo" 
                  className={`rounded-2xl object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 ${collapsed ? 'w-10 h-10' : 'w-10 h-10'}`} 
               />
               {!collapsed && (
                   <div className="text-left">
                      <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight font-display">Uchebnik AI</h1>
                      <div className="flex items-center gap-2">
                          <p className={`text-[10px] font-bold tracking-widest uppercase ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-500' : 'text-gray-500'}`}>
                            {userPlan === 'pro' ? 'PRO' : userPlan === 'plus' ? 'PLUS' : 'FREE'}
                          </p>
                      </div>
                   </div>
               )}
            </button>
            
            <div className="flex items-center gap-2">
                {isAdmin && !collapsed && (
                    <button onClick={() => setShowSettings(true)} className="flex p-2 text-zinc-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <Shield size={18} />
                    </button>
                )}
                <button onClick={toggleCollapse} className="hidden lg:flex p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             
             {/* Main Navigation Sections */}
             <div className="mt-4 space-y-4">
                
                {/* 1. GENERAL CHAT */}
                <div className="space-y-1">
                    <button 
                        onClick={() => { 
                            if (collapsed) { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }
                            else toggleSection('general'); 
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/5'}`}
                    >
                        <div className={`p-1.5 rounded-lg shrink-0 ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}>
                            <MessageSquare size={18} />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left font-bold text-xs">{t('chat_general', userSettings.language)}</span>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${sectionsOpen.general ? 'rotate-180' : ''}`}/>
                            </>
                        )}
                    </button>
                    {sectionsOpen.general && activeSubject?.id === SubjectId.GENERAL && renderSessionList(categorizedSessions.general)}
                </div>

                {/* 2. SCHOOL SPACE */}
                <div className="space-y-1">
                    <button 
                        onClick={() => { 
                            if (collapsed) { setActiveSubject(null); setHomeView('school_select'); setUserRole(null); }
                            else toggleSection('school'); 
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all border ${isSchoolActive ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'glass-button border-blue-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/5'}`}
                    >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSchoolActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-blue-600 dark:text-blue-400'}`}>
                            <School size={18} />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left font-bold text-xs">{t('school', userSettings.language)}</span>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setHomeView('school_select'); setActiveSubject(null); setShowSubjectDashboard(false); }}
                                        className={`p-1 rounded-md transition-colors ${isSchoolActive ? 'hover:bg-white/20' : 'hover:bg-blue-500/10 text-blue-500'}`}
                                        title="Избор на предмет"
                                    >
                                        <Plus size={14}/>
                                    </button>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${sectionsOpen.school ? 'rotate-180' : ''}`}/>
                                </div>
                            </>
                        )}
                    </button>
                    {sectionsOpen.school && (isSchoolActive || categorizedSessions.school.length > 0) && !collapsed && (
                        <div className="space-y-2">
                             {renderSessionList(categorizedSessions.school)}
                             <button 
                                onClick={() => { setHomeView('school_select'); setActiveSubject(null); }}
                                className="ml-7 flex items-center gap-2 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-wider py-1"
                            >
                                <Plus size={12}/> Нов предмет
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. UNIVERSITY SPACE */}
                <div className="space-y-1">
                    <button 
                        onClick={() => { 
                            if (collapsed) { setActiveSubject(null); setHomeView('university_select'); setUserRole(null); }
                            else toggleSection('uni'); 
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all border ${isUniActive ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' : 'glass-button border-emerald-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/5'}`}
                    >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isUniActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400'}`}>
                            <Briefcase size={18} />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left font-bold text-xs">{t('university', userSettings.language)}</span>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setHomeView('university_select'); setActiveSubject(null); setShowSubjectDashboard(false); }}
                                        className={`p-1 rounded-md transition-colors ${isUniActive ? 'hover:bg-white/20' : 'hover:bg-emerald-500/10 text-emerald-500'}`}
                                        title="Избор на предмет"
                                    >
                                        <Plus size={14}/>
                                    </button>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${sectionsOpen.uni ? 'rotate-180' : ''}`}/>
                                </div>
                            </>
                        )}
                    </button>
                    {sectionsOpen.uni && (isUniActive || categorizedSessions.uni.length > 0) && !collapsed && (
                        <div className="space-y-2">
                             {renderSessionList(categorizedSessions.uni)}
                             <button 
                                onClick={() => { setHomeView('university_select'); setActiveSubject(null); }}
                                className="ml-7 flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors uppercase tracking-wider py-1"
                            >
                                <Plus size={12}/> Нов предмет
                            </button>
                        </div>
                    )}
                </div>
             </div>

             {/* Gamification Grid */}
             {session && (
                 <div className={`mt-6 mb-2 ${collapsed ? 'space-y-2' : 'grid grid-cols-2 gap-2'}`}>
                     <button 
                        onClick={() => setShowLeaderboard && setShowLeaderboard(true)}
                        className={`flex items-center justify-center ${collapsed ? 'py-3 w-full' : 'py-3 px-1'} rounded-xl transition-all group glass-button border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 flex-col gap-1 shadow-sm`}
                        title="Класация"
                     >
                         <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 transition-colors">
                             <Trophy size={14} />
                         </div>
                         {!collapsed && <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Класация</span>}
                     </button>

                     <button 
                        onClick={() => setShowQuests && setShowQuests(true)}
                        className={`flex items-center justify-center ${collapsed ? 'py-3 w-full' : 'py-3 px-1'} rounded-xl transition-all group glass-button border border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/10 flex-col gap-1 shadow-sm`}
                        title="Дневни Мисии"
                     >
                         <div className="w-6 h-6 rounded-md bg-pink-500/10 flex items-center justify-center text-pink-500 transition-colors">
                             <Target size={14} />
                         </div>
                         {!collapsed && <span className="text-[9px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">Мисии</span>}
                     </button>
                 </div>
             )}
          </div>

          <div className={`p-4 border-t border-white/10 bg-white/20 dark:bg-black/20 space-y-2 backdrop-blur-md flex flex-col justify-center shrink-0`}>
             
             {/* Seasonal Buttons */}
             {!collapsed && (globalConfig?.showChristmasButton || globalConfig?.showNewYearButton) && (
                 <div className="flex gap-2 mb-2">
                    {globalConfig?.showChristmasButton && (
                        <button 
                            onClick={() => setUserSettings((prev: UserSettings) => ({...prev, christmasMode: !prev.christmasMode, newYearMode: false}))}
                            className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all border ${userSettings.christmasMode ? 'bg-red-600 border-red-500 text-white shadow-inner' : 'bg-white/40 dark:bg-black/20 border-white/10 text-red-500'}`}
                            title="Коледен режим"
                        >
                            <Snowflake size={18} className={userSettings.christmasMode ? "animate-spin-slow" : ""}/>
                        </button>
                    )}
                    {globalConfig?.showNewYearButton && (
                        <button 
                            onClick={() => setUserSettings((prev: UserSettings) => ({...prev, newYearMode: !prev.newYearMode, christmasMode: false}))}
                            className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all border ${userSettings.newYearMode ? 'bg-blue-900 border-blue-800 text-white shadow-inner' : 'bg-white/40 dark:bg-black/20 border-white/10 text-blue-500'}`}
                            title="Новогодишен режим"
                        >
                            <PartyPopper size={18} className={userSettings.newYearMode ? "animate-bounce" : ""}/>
                        </button>
                    )}
                 </div>
             )}

             {/* Referral Link */}
             {session && !collapsed && shouldShowReferral && (
               <button onClick={() => setShowReferralModal(true)} className={`w-full mb-1 group relative overflow-hidden rounded-2xl p-3 text-left shadow-lg transition-all hover:scale-[1.02] bg-gradient-to-r from-amber-500 to-orange-500 text-white`}>
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-xs tracking-tight">Покани Приятел</h3>
                        <p className="text-[9px] font-medium opacity-90">Вземи безплатен Pro</p>
                     </div>
                     <Gift size={16} />
                  </div>
               </button>
             )}
             
             {session && (
                 <div className="relative mb-1">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className={`absolute bottom-full ${collapsed ? 'left-14 w-60' : 'left-0 w-full'} mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40`}>
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <Settings size={16} className="text-gray-500"/> {t('settings', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <CreditCard size={16} className="text-gray-500"/> {t('manage_plan', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowReportModal && setShowReportModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors text-amber-500 hover:text-amber-600">
                                    <AlertTriangle size={16} /> Докладвай проблем
                                 </button>
                                 <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> {t('logout', userSettings.language)}
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-indigo-500/10 group ${collapsed ? 'justify-center' : ''}`}>
                         <div className="relative shrink-0">
                             <img 
                               src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                               alt="Profile" 
                               className={`w-9 h-9 rounded-full object-cover border-2 shadow-sm`}
                               style={{ borderColor: currentRank.color }}
                             />
                             <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/20">
                                 <div className={`w-3 h-3 rounded-full flex items-center justify-center bg-gradient-to-br ${currentRank.gradient}`}>
                                     <RankIcon size={12} className="text-white"/>
                                 </div>
                             </div>
                         </div>
                         {!collapsed && (
                             <>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-bold text-[12px] truncate text-zinc-900 dark:text-zinc-100">
                                        {userMeta.firstName && userMeta.lastName 
                                            ? `${userMeta.firstName} ${userMeta.lastName}`
                                            : (userSettings.userName || 'Потребител')}
                                    </div>
                                    <div className="mt-1">
                                        <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${currentRank.gradient}`} 
                                                style={{ width: `${stats.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <ChevronUp size={14} className={`text-gray-400 transition-transform duration-300 shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                             </>
                         )}
                    </button>
                 </div>
             )}
          </div>
        </aside>
        <style>{`
            .animate-spin-slow {
                animation: spin 10s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
      </>
    );
};
