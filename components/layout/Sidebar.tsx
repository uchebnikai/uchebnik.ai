
import React, { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, CloudOff, RefreshCw, Cloud, PanelLeftClose, PanelLeftOpen, LogIn, Snowflake, Gift, Trophy, Target, AlertTriangle, Sparkles, PartyPopper, Shield, BookOpen, UserCircle } from 'lucide-react';
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
    
    const [collapsed, setCollapsed] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['school', 'university']));
    // Added profileMenuOpen state to fix "Cannot find name 'profileMenuOpen'" and its setter errors.
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const toggleCategory = (cat: string) => {
        const next = new Set(expandedCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setExpandedCategories(next);
    };

    // Filter sessions by subject and role
    const getSubjectSessions = (subjectId: SubjectId) => {
        return sessions
            .filter(s => s.subjectId === subjectId && (!userRole || s.role === userRole))
            .sort((a, b) => b.lastModified - a.lastModified);
    };

    const toggleCollapse = () => setCollapsed(!collapsed);

    // Gamification Logic
    const currentRank = getRank(userSettings.level);
    const stats = getLevelStats(userSettings.xp, userSettings.level);
    const RankIcon = currentRank.icon;

    // Render a single subject row with its nested sessions
    const renderSubjectItem = (s: SubjectConfig) => {
        const isCurrentlyActive = activeSubject?.id === s.id;
        const subjectSessions = getSubjectSessions(s.id);
        const hasUnread = unreadSubjects.has(s.id);

        return (
            <div key={s.id} className="space-y-0.5">
                <button 
                    onClick={() => {
                        handleSubjectChange(s, userRole || 'student');
                        if (isMobile && !isCurrentlyActive) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center group/subject transition-all relative overflow-hidden rounded-xl py-2 px-3
                    ${isCurrentlyActive 
                        ? 'bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                >
                    <div className={`p-1.5 rounded-lg shrink-0 mr-3 ${isCurrentlyActive ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        <DynamicIcon name={s.icon} className="w-4 h-4" />
                    </div>
                    {!collapsed && <span className="text-sm truncate flex-1 text-left">{t(`subject_${s.id}`, userSettings.language)}</span>}
                    {hasUnread && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />}
                    {!collapsed && isCurrentlyActive && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 ml-2" />}
                </button>

                {isCurrentlyActive && !collapsed && (
                    <div className="ml-6 border-l-2 border-indigo-500/20 pl-2 py-1 space-y-0.5 animate-in slide-in-from-left-1">
                        {subjectSessions.map(sess => (
                            <div key={sess.id} className="flex items-center group/sess">
                                <button 
                                    onClick={() => {
                                        setActiveSessionId(sess.id);
                                        setShowSubjectDashboard(false);
                                        if (isMobile) setSidebarOpen(false);
                                    }}
                                    className={`flex-1 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    {sess.title}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteSession(sess.id); }} 
                                    className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover/sess:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => { createNewSession(s.id, userRole || undefined, activeMode); if(isMobile) setSidebarOpen(false); }} 
                            className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5"
                        >
                            <Plus size={12}/> {t('new_chat', userSettings.language)}
                        </button>
                    </div>
                )}
            </div>
        );
    };

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
                            {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'plus' ? 'PLUS PLAN' : 'FREE PLAN'}
                          </p>
                      </div>
                   </div>
               )}
            </button>
            
            <div className="flex items-center gap-2">
                {isAdmin && (
                    <button onClick={() => setShowSettings(true)} className="flex p-2 text-zinc-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <Shield size={20} />
                    </button>
                )}
                <button onClick={toggleCollapse} className="hidden lg:flex p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {collapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar space-y-4">
             
             {/* QUICK ACCESS / GENERAL */}
             <div className="space-y-1 mt-2">
                  <button 
                    onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} 
                    className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} rounded-2xl transition-all border
                    ${activeSubject?.id === SubjectId.GENERAL 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                        : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/20'}`}
                  >
                       <div className={`p-1.5 rounded-lg shrink-0 ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm'}`}><MessageSquare size={18} /></div>
                       {!collapsed && <span className="font-bold text-sm">{t('chat_general', userSettings.language)}</span>}
                  </button>
                  
                  {activeSubject?.id === SubjectId.GENERAL && !collapsed && (
                      <div className="ml-6 border-l-2 border-indigo-500/20 pl-2 py-1 space-y-0.5 animate-in slide-in-from-top-2">
                         {getSubjectSessions(SubjectId.GENERAL).map(s => (
                             <div key={s.id} className="flex items-center group/sess">
                                <button 
                                    onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                    className={`flex-1 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    {s.title}
                                </button>
                                <button onClick={() => deleteSession(s.id)} className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover/sess:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                             </div>
                         ))}
                         <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5">
                            <Plus size={12}/> {t('new_chat', userSettings.language)}
                         </button>
                      </div>
                  )}
             </div>

             {/* ROLE TOGGLE - Unified and simpler */}
             {!collapsed && (
                 <div className="p-1 bg-zinc-100 dark:bg-black/40 rounded-xl flex gap-1 border border-white/5">
                     <button 
                        onClick={() => setUserRole('student')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${userRole?.includes('student') || !userRole ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                         <GraduationCap size={14}/> {t('students', userSettings.language)}
                     </button>
                     <button 
                        onClick={() => setUserRole('teacher')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${userRole?.includes('teacher') ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                         <Briefcase size={14}/> {t('teachers', userSettings.language)}
                     </button>
                 </div>
             )}

             {/* SCHOOL SECTION */}
             <div className="space-y-1">
                <button 
                    onClick={() => toggleCategory('school')}
                    className="w-full flex items-center justify-between px-2 py-2 text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors group"
                >
                    <div className="flex items-center gap-2">
                        <School size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('school', userSettings.language)}</span>
                    </div>
                    {!collapsed && <ChevronDown size={12} className={`transition-transform duration-300 ${expandedCategories.has('school') ? 'rotate-180' : ''}`}/>}
                </button>
                
                {expandedCategories.has('school') && (
                    <div className="space-y-0.5 animate-in slide-in-from-top-2">
                        {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')).map(s => renderSubjectItem(s))}
                    </div>
                )}
             </div>
             
             {/* UNIVERSITY SECTION */}
             <div className="space-y-1">
                <button 
                    onClick={() => toggleCategory('university')}
                    className="w-full flex items-center justify-between px-2 py-2 text-zinc-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors group"
                >
                    <div className="flex items-center gap-2">
                        <Briefcase size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('university', userSettings.language)}</span>
                    </div>
                    {!collapsed && <ChevronDown size={12} className={`transition-transform duration-300 ${expandedCategories.has('university') ? 'rotate-180' : ''}`}/>}
                </button>
                
                {expandedCategories.has('university') && (
                    <div className="space-y-0.5 animate-in slide-in-from-top-2">
                        {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('university')).map(s => renderSubjectItem(s))}
                    </div>
                )}
             </div>

             {/* Gamification Grid */}
             {session && !collapsed && (
                 <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                     <button 
                        onClick={() => setShowLeaderboard && setShowLeaderboard(true)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-transparent hover:border-amber-500/20 transition-all group"
                     >
                         <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                             <Trophy size={16} />
                         </div>
                         <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Топ 10</span>
                            <span className="text-[10px] font-bold text-zinc-500">Класация</span>
                         </div>
                     </button>

                     <button 
                        onClick={() => setShowQuests && setShowQuests(true)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-transparent hover:border-pink-500/20 transition-all group"
                     >
                         <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                             <Target size={16} />
                         </div>
                         <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest leading-none mb-1">Мисии</span>
                            <span className="text-[10px] font-bold text-zinc-500">XP Бонус</span>
                         </div>
                     </button>
                 </div>
             )}
          </div>

          <div className="p-4 border-t border-white/10 bg-white/20 dark:bg-black/20 space-y-2 backdrop-blur-md flex flex-col justify-center shrink-0">
             {/* New Year / Seasonal Toggles remain as buttons */}
             {(globalConfig?.showChristmasButton || globalConfig?.showNewYearButton) && !collapsed && (
                 <div className="flex gap-2">
                    {globalConfig?.showChristmasButton && (
                        <button 
                            onClick={() => setUserSettings((prev: UserSettings) => ({...prev, christmasMode: !prev.christmasMode, newYearMode: false}))}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border transition-all ${userSettings.christmasMode ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 border-white/10 text-red-500 hover:bg-red-50'}`}
                        >
                            <Snowflake size={16} className={userSettings.christmasMode ? 'animate-spin' : ''}/>
                        </button>
                    )}
                    {globalConfig?.showNewYearButton && (
                        <button 
                            onClick={() => setUserSettings((prev: UserSettings) => ({...prev, newYearMode: !prev.newYearMode, christmasMode: false}))}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border transition-all ${userSettings.newYearMode ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white dark:bg-white/5 border-white/10 text-blue-500 hover:bg-blue-50'}`}
                        >
                            <PartyPopper size={16} className={userSettings.newYearMode ? 'animate-bounce' : ''}/>
                        </button>
                    )}
                 </div>
             )}

             {session && (
                 <div className="relative">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className={`absolute bottom-full ${collapsed ? 'left-14 w-60' : 'left-0 w-full'} mb-2 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40`}>
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <Settings size={16} className="text-zinc-500"/> {t('settings', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <CreditCard size={16} className="text-zinc-500"/> {t('manage_plan', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowReportModal && setShowReportModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors text-amber-500">
                                    <AlertTriangle size={16} /> Докладвай проблем
                                 </button>
                                 <div className="h-px bg-zinc-100 dark:bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> {t('logout', userSettings.language)}
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-indigo-500/10 group ${collapsed ? 'justify-center' : ''}`}>
                         <div className="relative shrink-0">
                             <img 
                               src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                               alt="Profile" 
                               className="w-10 h-10 rounded-full object-cover border-2"
                               style={{ borderColor: currentRank.color }}
                             />
                             <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/20 shadow-sm">
                                 <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${currentRank.gradient}`}>
                                     <RankIcon size={18} className="text-white"/>
                                 </div>
                             </div>
                         </div>
                         {!collapsed && (
                             <>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">
                                        {userMeta.firstName && userMeta.lastName 
                                            ? `${userMeta.firstName} ${userMeta.lastName}`
                                            : (userSettings.userName || 'Потребител')}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-black bg-gradient-to-r ${currentRank.gradient}`}>
                                            Lvl {userSettings.level}
                                        </span>
                                    </div>
                                </div>
                                <ChevronUp size={16} className={`text-zinc-400 transition-transform duration-300 shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                             </>
                         )}
                    </button>
                 </div>
             )}
          </div>
        </aside>
      </>
    );
};
