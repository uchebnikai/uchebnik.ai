import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, 
  ChevronDown, Settings, CreditCard, LogOut, ArrowRight, 
  ChevronUp, FileText, PanelLeftClose, PanelLeftOpen, 
  Snowflake, Gift, Trophy, Target, Shield, Clock, Hash,
  ChevronRight, UserCircle, BookOpen, Layers
} from 'lucide-react';
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
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    
    // Track expanded subjects in the sidebar
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set([SubjectId.GENERAL]));

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const toggleCollapse = () => setCollapsed(!collapsed);

    const toggleSubjectExpansion = (id: string) => {
        const next = new Set(expandedSubjects);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedSubjects(next);
    };

    // Filter sessions for a specific subject and role
    const getFilteredSessions = (subjectId: SubjectId, role?: UserRole) => {
        return sessions.filter(s => s.subjectId === subjectId && (role ? s.role === role : true));
    };

    const currentRank = getRank(userSettings.level);
    const stats = getLevelStats(userSettings.xp, userSettings.level);
    const RankIcon = currentRank.icon;

    const schoolSubjects = useMemo(() => SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')), []);
    const uniSubjects = useMemo(() => SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('university')), []);

    const renderSessionList = (subjectId: SubjectId, role?: UserRole) => {
        const filtered = getFilteredSessions(subjectId, role);
        if (filtered.length === 0) return (
            <p className="text-[10px] text-zinc-500 italic px-3 py-1">Няма предишни чатове</p>
        );

        return (
            <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                {filtered.map(s => (
                    <div key={s.id} className="flex items-center group/session">
                        <button 
                            onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                            className={`flex-1 text-left px-3 py-1.5 rounded-lg text-[11px] font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                        >
                            {s.title}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} 
                            className="p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12}/>
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // Added key property to props type to satisfy TypeScript strict checking when used in JSX.
    const SidebarItem = ({ subject, role, isActive }: { subject: SubjectConfig, role?: UserRole, isActive: boolean, key?: any }) => {
        const isExpanded = expandedSubjects.has(`${subject.id}-${role || 'none'}`) || (isActive && !collapsed);
        const hasUnread = unreadSubjects.has(subject.id);
        
        return (
            <div className="mb-1">
                <button 
                    onClick={() => {
                        handleSubjectChange(subject, role);
                        toggleSubjectExpansion(`${subject.id}-${role || 'none'}`);
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl transition-all relative group border ${isActive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'border-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200'}`}
                >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}`}>
                        <DynamicIcon name={subject.icon} className="w-4 h-4" />
                    </div>
                    {!collapsed && (
                        <>
                            <span className="ml-3 text-xs font-bold truncate flex-1 text-left">{t(`subject_${subject.id}`, userSettings.language)}</span>
                            {hasUnread && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-2" />}
                            <ChevronRight size={14} className={`transition-transform duration-200 opacity-40 ${isExpanded ? 'rotate-90' : ''}`} />
                        </>
                    )}
                </button>
                
                {!collapsed && isExpanded && (
                    <div className="ml-7 mt-1 border-l border-white/5 pl-2 py-1">
                        {renderSessionList(subject.id, role)}
                        <button 
                            onClick={() => { createNewSession(subject.id, role); if(isMobile) setSidebarOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all"
                        >
                            <Plus size={10} strokeWidth={3}/> {t('new_chat', userSettings.language)}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/80 z-[45] backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 
          bg-[#09090b]/95 lg:bg-[#09090b]/40 backdrop-blur-3xl border-r border-white/5
          transition-all duration-300 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${collapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'} w-[280px]
          shadow-2xl lg:shadow-none h-full`}>
          
          {/* Top Branding */}
          <div className={`p-4 flex items-center shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className="flex items-center gap-3 group">
               <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-xl shadow-lg" alt="Logo" />
               {!collapsed && (
                   <div className="text-left">
                      <h1 className="font-bold text-base text-white tracking-tight font-display">Uchebnik AI</h1>
                   </div>
               )}
            </button>
            {!collapsed && (
                <button onClick={toggleCollapse} className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <PanelLeftClose size={18}/>
                </button>
            )}
            {collapsed && (
                <button onClick={toggleCollapse} className="hidden lg:block p-2 text-zinc-600 hover:text-white transition-colors absolute top-14">
                    <PanelLeftOpen size={18}/>
                </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-6">
             
             {/* SECTION: GENERAL */}
             <div>
                {!collapsed && <div className="px-3 mb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{t('chat_general', userSettings.language)}</div>}
                <SidebarItem 
                    subject={SUBJECTS[0]} 
                    isActive={activeSubject?.id === SubjectId.GENERAL} 
                />
             </div>

             {/* SECTION: SCHOOL */}
             <div>
                {!collapsed && (
                    <div className="flex items-center justify-between px-3 mb-2">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <School size={12}/> {t('school', userSettings.language)}
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                            <button 
                                onClick={() => setUserRole('student')}
                                className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${userRole === 'student' || userRole === 'uni_student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                УЧЕНИК
                            </button>
                            <button 
                                onClick={() => setUserRole('teacher')}
                                className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${userRole === 'teacher' || userRole === 'uni_teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                УЧИТЕЛ
                            </button>
                        </div>
                    </div>
                )}
                {schoolSubjects.map(s => (
                    <SidebarItem 
                        key={s.id} 
                        subject={s} 
                        role={userRole === 'teacher' ? 'teacher' : 'student'} 
                        isActive={activeSubject?.id === s.id && (userRole === 'student' || userRole === 'teacher')}
                    />
                ))}
             </div>

             {/* SECTION: UNIVERSITY */}
             <div>
                {!collapsed && (
                    <div className="px-3 mb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <GraduationCap size={12}/> {t('university', userSettings.language)}
                    </div>
                )}
                {uniSubjects.map(s => (
                    <SidebarItem 
                        key={s.id} 
                        subject={s} 
                        role={userRole === 'uni_teacher' ? 'uni_teacher' : 'uni_student'} 
                        isActive={activeSubject?.id === s.id && (userRole === 'uni_student' || userRole === 'uni_teacher')}
                    />
                ))}
             </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/5 bg-black/20 space-y-2 shrink-0">
             
             {session && (
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <button 
                        onClick={() => setShowLeaderboard && setShowLeaderboard(true)}
                        className="flex flex-col items-center justify-center py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
                        title="Класация"
                    >
                        <Trophy size={14} className="text-amber-500 group-hover:scale-110 transition-transform mb-1"/>
                        {!collapsed && <span className="text-[9px] font-black text-zinc-500 uppercase">Класация</span>}
                    </button>
                    <button 
                        onClick={() => setShowQuests && setShowQuests(true)}
                        className="flex flex-col items-center justify-center py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
                        title="Мисии"
                    >
                        <Target size={14} className="text-pink-500 group-hover:scale-110 transition-transform mb-1"/>
                        {!collapsed && <span className="text-[9px] font-black text-zinc-500 uppercase">Мисии</span>}
                    </button>
                 </div>
             )}

             {session && !collapsed && userPlan === 'free' && (
                <button onClick={() => setShowReferralModal(true)} className="w-full relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg active:scale-95 transition-all group mb-2">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift size={16} />
                            <span className="text-xs font-bold">Вземи Pro безплатно</span>
                        </div>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </div>
                </button>
             )}

             {session && (
                 <div className="relative">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className={`absolute bottom-full ${collapsed ? 'left-14 w-56' : 'left-0 w-full'} mb-2 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40`}>
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs font-bold flex items-center gap-3 transition-colors text-zinc-300">
                                    <Settings size={14}/> {t('settings', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs font-bold flex items-center gap-3 transition-colors text-zinc-300">
                                    <CreditCard size={14}/> {t('manage_plan', userSettings.language)}
                                 </button>
                                 {isAdmin && (
                                     <button onClick={() => {addToast("Redirecting to Admin...", "info"); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs font-bold flex items-center gap-3 transition-colors text-indigo-400">
                                        <Shield size={14}/> Admin Panel
                                     </button>
                                 )}
                                 <div className="h-px bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-3 transition-colors">
                                    <LogOut size={14}/> {t('logout', userSettings.language)}
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent ${collapsed ? 'justify-center' : ''}`}>
                         <div className="relative shrink-0">
                             <img 
                               src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                               className="w-8 h-8 rounded-full object-cover border-2"
                               style={{ borderColor: currentRank.color }}
                               alt="User"
                             />
                             <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-gradient-to-br ${currentRank.gradient} ring-2 ring-black`}>
                                 <RankIcon size={8} className="text-white"/>
                             </div>
                         </div>
                         {!collapsed && (
                             <div className="flex-1 min-w-0 text-left">
                                <div className="font-bold text-xs truncate text-white leading-none mb-1">
                                    {userMeta.firstName ? `${userMeta.firstName} ${userMeta.lastName}` : (userSettings.userName || 'Scholar')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${currentRank.gradient}`} style={{ width: `${stats.percentage}%` }} />
                                    </div>
                                    <span className="text-[9px] font-black text-zinc-500">LVL {userSettings.level}</span>
                                </div>
                             </div>
                         )}
                    </button>
                 </div>
             )}
          </div>
        </aside>
      </>
    );
};
