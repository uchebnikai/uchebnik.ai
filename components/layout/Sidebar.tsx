import React, { useState } from 'react';
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, CloudOff, RefreshCw, Cloud, PanelLeftClose, PanelLeftOpen, LogIn, Snowflake, Gift, Trophy, Target, AlertTriangle, Sparkles, PartyPopper, Shield } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SUBJECTS, DEFAULT_AVATAR } from '../../constants';
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
  streak: number; // Deprecated, kept for interface compat but unused
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
    
    // Internal State for Folders
    const [schoolFolderOpen, setSchoolFolderOpen] = useState(true); 
    const [studentsFolderOpen, setStudentsFolderOpen] = useState(false);
    const [teachersFolderOpen, setTeachersFolderOpen] = useState(false);
    
    // University Folders
    const [uniFolderOpen, setUniFolderOpen] = useState(true);
    const [uniStudentsFolderOpen, setUniStudentsFolderOpen] = useState(false);
    const [uniTeachersFolderOpen, setUniTeachersFolderOpen] = useState(false);

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    // Usage Logic
    const maxImages = userPlan === 'free' ? 4 : (userPlan === 'plus' ? 12 : 9999);
    const usagePercent = Math.min((dailyImageCount / maxImages) * 100, 100);
    const isNearLimit = usagePercent >= 75;
    
    const shouldShowReferral = userPlan === 'free';

    // Gamification Logic
    const currentRank = getRank(userSettings.level);
    const stats = getLevelStats(userSettings.xp, userSettings.level);
    const RankIcon = currentRank.icon;

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

          <div className="flex-1-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             {/* General Chat */}
             <div className="space-y-1 mt-2 mb-4 shrink-0">
                  <button 
                    onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} 
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/30'}`}
                    title="Общ Чат"
                  >
                       <div className={`p-1.5 rounded-lg shrink-0 ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}><MessageSquare size={18} /></div>
                       {!collapsed && <span className="font-bold text-sm">{t('chat_general', userSettings.language)}</span>}
                       {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </button>
                  
                  {activeSubject?.id === SubjectId.GENERAL && !collapsed && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-indigo-500/20 pl-2 animate-in slide-in-from-top-2">
                         {sessions.filter(s => s.subjectId === SubjectId.GENERAL).map(s => (
                             <div key={s.id} className="flex items-center group/session">
                                <button 
                                    onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                    className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-indigo-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                >
                                    {s.title}
                                </button>
                                <button onClick={() => deleteSession(s.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                             </div>
                         ))}
                         <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                            <Plus size={12}/> {t('new_chat', userSettings.language)}
                         </button>
                      </div>
                  )}
             </div>

             {/* Gamification Grid */}
             {session && (
                 <div className={`mt-2 mb-2 ${collapsed ? 'space-y-2' : 'grid grid-cols-2 gap-2'}`}>
                     <button 
                        onClick={() => setShowLeaderboard && setShowLeaderboard(true)}
                        className={`flex items-center justify-center ${collapsed ? 'py-3 w-full' : 'py-3 px-1'} rounded-2xl transition-all group glass-button border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 flex-col gap-1 shadow-sm`}
                        title="Класация"
                     >
                         <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                             <Trophy size={14} />
                         </div>
                         {!collapsed && <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Класация</span>}
                     </button>

                     <button 
                        onClick={() => setShowQuests && setShowQuests(true)}
                        className={`flex items-center justify-center ${collapsed ? 'py-3 w-full' : 'py-3 px-1'} rounded-2xl transition-all group glass-button border border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/10 flex-col gap-1 shadow-sm`}
                        title="Дневни Мисии"
                     >
                         <div className="w-6 h-6 rounded-md bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                             <Target size={14} />
                         </div>
                         {!collapsed && <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">Мисии</span>}
                     </button>
                 </div>
             )}

             {collapsed ? (
                 <div className="mt-4 flex flex-col items-center gap-4 w-full animate-in fade-in">
                     <button 
                        onClick={() => { setActiveSubject(null); setHomeView('school_select'); setUserRole(null); }}
                        className={`p-3 rounded-xl transition-all ${homeView === 'school_select' || homeView === 'student_subjects' || homeView === 'teacher_subjects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-500'}`}
                        title={t('school', userSettings.language)}
                     >
                        <School size={20} />
                     </button>
                     <button 
                        onClick={() => { setActiveSubject(null); setHomeView('university_select'); setUserRole(null); }}
                        className={`p-3 rounded-xl transition-all ${homeView === 'university_select' || homeView === 'uni_student_subjects' || homeView === 'uni_teacher_subjects' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-emerald-500'}`}
                        title={t('university', userSettings.language)}
                     >
                        <Briefcase size={20} />
                     </button>
                 </div>
             ) : (
                 <div className="mt-2 space-y-2">
                     {/* SCHOOL SECTION */}
                     <div>
                        <button onClick={() => { setActiveSubject(null); setHomeView('school_select'); setUserRole(null); setSchoolFolderOpen(!schoolFolderOpen); }} className="w-full flex items-center justify-between px-2 py-3 text-gray-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors">
                            <div className="flex items-center gap-2">
                                <School size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('school', userSettings.language)}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${schoolFolderOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {schoolFolderOpen && (
                            <div className="pl-4 space-y-1 animate-in slide-in-from-top-2">
                                {/* Students Subfolder */}
                                <div className="border-l border-indigo-500/10 pl-2">
                                    <div className="flex items-center justify-between w-full px-2 py-2 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('student_subjects'); setUserRole('student'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex-1 text-left"
                                        >
                                            <GraduationCap size={14} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('students', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setStudentsFolderOpen(!studentsFolderOpen)} className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${studentsFolderOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                    </div>
                                    {studentsFolderOpen && (
                                        <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')).map(s => (
                                                <div key={`student-${s.id}`}>
                                                    <button 
                                                        onClick={() => { handleSubjectChange(s, 'student'); if(isMobile) setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'student' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${s.color} shrink-0`}></div>
                                                        <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Teachers Subfolder */}
                                <div className="border-l border-indigo-500/10 pl-2 mt-2">
                                    <div className="flex items-center justify-between w-full px-2 py-2 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('teacher_subjects'); setUserRole('teacher'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex-1 text-left"
                                        >
                                            <Briefcase size={14} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('teachers', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setTeachersFolderOpen(!teachersFolderOpen)} className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${teachersFolderOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                    </div>
                                    {teachersFolderOpen && (
                                        <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')).map(s => (
                                                <div key={`teacher-${s.id}`}>
                                                    <button 
                                                        onClick={() => { handleSubjectChange(s, 'teacher'); if(isMobile) setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'teacher' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                        <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                     </div>
                     
                     {/* UNIVERSITY SECTION */}
                     <div className="pt-2">
                        <button onClick={() => { setActiveSubject(null); setHomeView('university_select'); setUserRole(null); setUniFolderOpen(!uniFolderOpen); }} className="w-full flex items-center justify-between px-2 py-3 text-gray-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors">
                            <div className="flex items-center gap-2">
                                <Briefcase size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('university', userSettings.language)}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${uniFolderOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        {uniFolderOpen && (
                            <div className="pl-4 space-y-1 animate-in slide-in-from-top-2">
                                <div className="border-l border-emerald-500/10 pl-2">
                                    <div className="flex items-center justify-between w-full px-2 py-2 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('uni_student_subjects'); setUserRole('uni_student'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors flex-1 text-left"
                                        >
                                            <GraduationCap size={14} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('uni_students', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setUniStudentsFolderOpen(!uniStudentsFolderOpen)} className="p-1 text-gray-400 hover:text-emerald-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${uniStudentsFolderOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                    </div>
                                    {uniStudentsFolderOpen && (
                                        <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('university')).map(s => (
                                                <div key={`uni-student-${s.id}`}>
                                                    <button 
                                                        onClick={() => { handleSubjectChange(s, 'uni_student'); if(isMobile) setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'uni_student' ? 'bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${s.color} shrink-0`}></div>
                                                        <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
             )}
          </div>

          <div className={`p-4 border-t border-white/10 bg-white/20 dark:bg-black/20 space-y-2 backdrop-blur-md flex flex-col justify-center shrink-0`}>
             {/* Christmas Toggle */}
             {globalConfig?.showChristmasButton && (
                 <button 
                    onClick={() => setUserSettings((prev: UserSettings) => ({...prev, christmasMode: !prev.christmasMode, newYearMode: false}))}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-4'} py-3 lg:py-3.5 rounded-2xl transition-all relative overflow-hidden group shadow-md hover:shadow-lg active:scale-95 mb-0.5
                    ${userSettings.christmasMode 
                        ? 'bg-gradient-to-r from-red-600 via-red-500 to-green-600 text-white shadow-red-500/20' 
                        : 'bg-white/50 dark:bg-black/40 border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                 >
                     {userSettings.christmasMode && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />}
                     
                     <div className="flex items-center gap-3 relative z-10">
                         <div className={`p-1.5 rounded-lg ${userSettings.christmasMode ? 'bg-white/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                            <Snowflake size={20} className={userSettings.christmasMode ? "animate-[spin_3s_linear_infinite]" : ""} fill={userSettings.christmasMode ? "currentColor" : "none"}/>
                         </div>
                         {!collapsed && (
                             <div className="flex flex-col text-left">
                                 <span className="font-bold text-sm">Коледен Режим</span>
                                 <span className={`text-[10px] ${userSettings.christmasMode ? 'text-white/80' : 'text-red-400'}`}>
                                     {userSettings.christmasMode ? 'Включен 🎄' : 'Изключен'}
                                 </span>
                             </div>
                         )}
                     </div>

                     {!collapsed && (
                        <div className={`relative z-10 w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${userSettings.christmasMode ? 'bg-black/20' : 'bg-gray-200 dark:bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${userSettings.christmasMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                     )}
                 </button>
             )}

             {/* New Year Toggle */}
             {globalConfig?.showNewYearButton && (
                 <button 
                    onClick={() => setUserSettings((prev: UserSettings) => ({...prev, newYearMode: !prev.newYearMode, christmasMode: false}))}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-4'} py-3 lg:py-3.5 rounded-2xl transition-all relative overflow-hidden group shadow-md hover:shadow-lg active:scale-95 mb-1
                    ${userSettings.newYearMode 
                        ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white shadow-indigo-500/20' 
                        : 'bg-white/50 dark:bg-black/40 border border-blue-200 dark:border-blue-900/30 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}
                 >
                     {userSettings.newYearMode && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />}
                     
                     <div className="flex items-center gap-3 relative z-10">
                         <div className={`p-1.5 rounded-lg ${userSettings.newYearMode ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                            <PartyPopper size={20} className={userSettings.newYearMode ? "animate-bounce" : ""} fill={userSettings.newYearMode ? "currentColor" : "none"}/>
                         </div>
                         {!collapsed && (
                             <div className="flex flex-col text-left">
                                 <span className="font-bold text-sm">Честита 2026!</span>
                                 <span className={`text-[10px] ${userSettings.newYearMode ? 'text-indigo-200' : 'text-blue-400'}`}>
                                     {userSettings.newYearMode ? 'Нова година ✨' : 'Изключен'}
                                 </span>
                             </div>
                         )}
                     </div>

                     {!collapsed && (
                        <div className={`relative z-10 w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${userSettings.newYearMode ? 'bg-black/20' : 'bg-gray-200 dark:bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${userSettings.newYearMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                     )}
                 </button>
             )}

             {/* Referral Button - Highly Visible - Only show if shouldShowReferral is true AND logged in */}
             {session && !collapsed && shouldShowReferral && (
               <button onClick={() => setShowReferralModal(true)} className={`w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-500 to-orange-500 text-white`}>
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                            {t('referrals', userSettings.language) || "Покани Приятел"}
                        </h3>
                        <p className="text-[10px] font-medium opacity-90">Вземи безплатен Pro</p>
                     </div>
                     <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <Gift size={16} />
                     </div>
                  </div>
               </button>
             )}
             
             {/* Small Referral Icon - Collapsed */}
             {session && collapsed && shouldShowReferral && (
                 <button onClick={() => setShowReferralModal(true)} className="w-full flex justify-center mb-1 group relative">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                         <Gift size={18}/>
                     </div>
                 </button>
             )}

             {session && (
                 <div className="relative mb-1">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className={`absolute bottom-full ${collapsed ? 'left-14 w-60' : 'left-0 w-full'} mb-2 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40`}>
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <Settings size={16} className="text-gray-500"/> {t('settings', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <CreditCard size={16} className="text-gray-500"/> {t('manage_plan', userSettings.language)}
                                 </button>
                                 <button onClick={() => {setShowReportModal && setShowReportModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors text-amber-500 hover:text-amber-600">
                                    <AlertTriangle size={16} /> Докладвай проблем
                                 </button>
                                 <button onClick={() => {setActiveSubject(null); setHomeView('terms'); setProfileMenuOpen(false); if(isMobile) setSidebarOpen(false);}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <FileText size={16} className="text-gray-500"/> {t('terms', userSettings.language)}
                                 </button>
                                 <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> {t('logout', userSettings.language)}
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-3 w-full p-2.5 lg:p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-indigo-500/10 group ${collapsed ? 'justify-center' : ''}`}>
                         <div className="relative shrink-0">
                             <img 
                               src={userMeta.avatar || DEFAULT_AVATAR} 
                               alt="Profile" 
                               className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 ${currentRank.color === '#cd7f32' ? 'border-orange-700' : 'border-current'}`}
                               style={{ borderColor: currentRank.color }}
                             />
                             <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/20">
                                 <div className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${currentRank.gradient}`}>
                                     <RankIcon size={18} className="text-white"/>
                                 </div>
                             </div>
                         </div>
                         {!collapsed && (
                             <>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-bold text-[13px] lg:text-sm truncate text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        {userMeta.firstName && userMeta.lastName 
                                            ? `${userMeta.firstName} ${userMeta.lastName}`
                                            : (userSettings.userName || 'Потребител')}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-black bg-gradient-to-r ${currentRank.gradient}`}>
                                            Lvl {userSettings.level}
                                        </span>
                                    </div>
                                    {/* XP Progress */}
                                    <div className="mt-1.5">
                                        <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${currentRank.gradient}`} 
                                                style={{ width: `${stats.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <ChevronUp size={16} className={`text-gray-400 transition-transform duration-300 shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
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