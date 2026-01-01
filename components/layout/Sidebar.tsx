
import React, { useState } from 'react';
/* Fixed: Added missing Sparkles and Landmark imports from lucide-react */
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, CloudOff, RefreshCw, Cloud, PanelLeftClose, PanelLeftOpen, LogIn, Snowflake, Gift, Trophy, Target, AlertTriangle, LayoutGrid, LayoutDashboard, Sparkles, Landmark } from 'lucide-react';
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
  streak: number; // Deprecated, kept for interface compat but unused
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  homeView: HomeViewType;
  dailyImageCount?: number; 
  setShowLeaderboard?: (val: boolean) => void;
  setShowQuests?: (val: boolean) => void;
  setShowReportModal?: (val: boolean) => void;
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
  setShowReportModal
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
    
    // Gamification Logic
    const currentRank = getRank(userSettings.level);
    const stats = getLevelStats(userSettings.xp, userSettings.level);
    const RankIcon = currentRank.icon;

    const isActiveChat = activeSubject?.id === SubjectId.GENERAL;
    const iLandmark = homeView === 'landing' && !activeSubject;

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 
          bg-white/60 dark:bg-[#0c0c0e]/80 backdrop-blur-3xl border-r border-white/20 dark:border-white/5
          transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${collapsed ? 'lg:w-[88px]' : 'lg:w-[320px]'} w-[280px]
          shadow-2xl lg:shadow-none`}>
          
          {/* Sidebar Header */}
          <div className={`p-5 pb-4 flex items-center ${collapsed ? 'justify-center flex-col gap-6' : 'justify-between'}`}>
            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className={`flex items-center gap-3 group transition-transform active:scale-95 ${collapsed ? 'justify-center' : ''}`}>
               <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-all duration-500">
                  <Sparkles size={20} fill="currentColor"/>
               </div>
               {!collapsed && (
                   <div className="text-left">
                      <h1 className="font-black text-lg text-zinc-900 dark:text-white tracking-tighter font-display leading-tight">Uchebnik AI</h1>
                      <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Системата е онлайн</span>
                      </div>
                   </div>
               )}
            </button>
            
            {!collapsed && (
                <button onClick={toggleCollapse} className="hidden lg:flex p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <PanelLeftClose size={20}/>
                </button>
            )}
          </div>

          <div className="px-4 py-2 space-y-1">
              {/* Dashboard / Home Link */}
              <button 
                onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} 
                className={`w-full flex items-center ${collapsed ? 'justify-center py-3.5' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all group border ${iLandmark ? 'bg-zinc-900/50 border-white/10 text-white shadow-xl' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`}
              >
                   <div className={`p-1.5 rounded-lg transition-colors ${iLandmark ? 'text-indigo-400 bg-indigo-400/10' : 'text-zinc-500 group-hover:text-indigo-400'}`}><LayoutDashboard size={20} /></div>
                   {!collapsed && <span className="font-bold text-sm tracking-tight">Табло</span>}
              </button>

              {/* General Chat Link */}
              <button 
                onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} 
                className={`w-full flex items-center ${collapsed ? 'justify-center py-3.5' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all group border ${isActiveChat ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`}
              >
                   <div className={`p-1.5 rounded-lg transition-colors ${isActiveChat ? 'bg-white/20' : 'text-zinc-500 group-hover:text-indigo-400'}`}><MessageSquare size={20} /></div>
                   {!collapsed && <span className="font-bold text-sm tracking-tight">{t('chat_general', userSettings.language)}</span>}
              </button>
              
              {isActiveChat && !collapsed && (
                  <div className="ml-5 mt-2 space-y-1 border-l border-indigo-500/30 pl-3 animate-in slide-in-from-left-2 duration-300">
                     {sessions.filter(s => s.subjectId === SubjectId.GENERAL).map(s => (
                         <div key={s.id} className="flex items-center group/session relative">
                            <button 
                                onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold truncate transition-all ${activeSessionId === s.id ? 'bg-indigo-500/10 text-white border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            >
                                {s.title}
                            </button>
                            <button onClick={() => deleteSession(s.id)} className="absolute right-1 p-1.5 text-zinc-500 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-all"><Trash2 size={14}/></button>
                         </div>
                     ))}
                     <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mt-2 group/new">
                        <div className="p-1 bg-indigo-500/10 rounded-lg group-hover/new:bg-indigo-500/20 transition-colors"><Plus size={14} strokeWidth={3}/></div>
                        {t('new_chat', userSettings.language)}
                     </button>
                  </div>
              )}
          </div>

          {/* Section Divider */}
          {!collapsed && <div className="mx-6 h-px bg-white/5 my-4" />}

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             {collapsed ? (
                 <div className="mt-4 flex flex-col items-center gap-6 w-full animate-in fade-in">
                     <button onClick={toggleCollapse} className="p-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all"><PanelLeftOpen size={20}/></button>
                     <button 
                        onClick={() => { setActiveSubject(null); setHomeView('school_select'); setUserRole(null); }}
                        className={`p-3.5 rounded-2xl transition-all ${homeView.includes('school') || (userRole === 'student' || userRole === 'teacher') ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-indigo-400'}`}
                        title={t('school', userSettings.language)}
                     >
                        <School size={22} />
                     </button>
                     <button 
                        onClick={() => { setActiveSubject(null); setHomeView('university_select'); setUserRole(null); }}
                        className={`p-3.5 rounded-2xl transition-all ${homeView.includes('uni') || (userRole === 'uni_student' || userRole === 'uni_teacher') ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-emerald-400'}`}
                        title={t('university', userSettings.language)}
                     >
                        <Landmark size={22} />
                     </button>
                 </div>
             ) : (
                 <div className="space-y-4">
                     {/* SCHOOL SECTION */}
                     <div className="space-y-1">
                        <button onClick={() => { setActiveSubject(null); setHomeView('school_select'); setUserRole(null); setSchoolFolderOpen(!schoolFolderOpen); }} className="w-full flex items-center justify-between px-2 py-2 text-zinc-500 hover:text-indigo-400 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors"><School size={16} /></div>
                                <span className="text-xs font-black uppercase tracking-[0.15em]">{t('school', userSettings.language)}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-500 ${schoolFolderOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {schoolFolderOpen && (
                            <div className="pl-3 space-y-1 animate-in slide-in-from-top-2 duration-300">
                                {/* Students Subfolder */}
                                <div className="pl-2">
                                    <div className="flex items-center justify-between w-full py-1.5 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('student_subjects'); setUserRole('student'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 hover:text-white transition-colors flex-1 text-left"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t('students', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setStudentsFolderOpen(!studentsFolderOpen)} className="p-1 text-zinc-600 hover:text-white transition-colors">
                                            <Plus size={14} className={`transition-transform duration-500 ${studentsFolderOpen ? 'rotate-45' : ''}`}/>
                                        </button>
                                    </div>
                                    {studentsFolderOpen && (
                                        <div className="space-y-0.5 mt-1 border-l border-white/5 pl-2 animate-in slide-in-from-left-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')).map(s => (
                                                <div key={`student-${s.id}`}>
                                                    <button 
                                                        onClick={() => { handleSubjectChange(s, 'student'); if(isMobile) setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${activeSubject?.id === s.id && userRole === 'student' ? 'bg-indigo-600 text-white font-bold shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${s.color} shrink-0 shadow-sm shadow-black/50`}></div>
                                                        <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Teachers Subfolder */}
                                <div className="pl-2">
                                    <div className="flex items-center justify-between w-full py-1.5 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('teacher_subjects'); setUserRole('teacher'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 hover:text-white transition-colors flex-1 text-left"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t('teachers', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setTeachersFolderOpen(!teachersFolderOpen)} className="p-1 text-zinc-600 hover:text-white transition-colors">
                                            <Plus size={14} className={`transition-transform duration-500 ${teachersFolderOpen ? 'rotate-45' : ''}`}/>
                                        </button>
                                    </div>
                                    {teachersFolderOpen && (
                                        <div className="space-y-0.5 mt-1 border-l border-white/5 pl-2 animate-in slide-in-from-left-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('school')).map(s => (
                                                <button 
                                                    key={`teacher-${s.id}`}
                                                    onClick={() => { handleSubjectChange(s, 'teacher'); if(isMobile) setSidebarOpen(false); }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${activeSubject?.id === s.id && userRole === 'teacher' ? 'bg-indigo-600 text-white font-bold shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${s.color} shadow-sm shadow-black/50`}></div>
                                                    <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                     </div>
                     
                     {/* UNIVERSITY SECTION */}
                     <div className="space-y-1">
                        <button onClick={() => { setActiveSubject(null); setHomeView('university_select'); setUserRole(null); setUniFolderOpen(!uniFolderOpen); }} className="w-full flex items-center justify-between px-2 py-2 text-zinc-500 hover:text-emerald-400 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors"><Landmark size={16} /></div>
                                <span className="text-xs font-black uppercase tracking-[0.15em]">{t('university', userSettings.language)}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-500 ${uniFolderOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        {uniFolderOpen && (
                            <div className="pl-3 space-y-1 animate-in slide-in-from-top-2 duration-300">
                                <div className="pl-2">
                                    <div className="flex items-center justify-between w-full py-1.5 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('uni_student_subjects'); setUserRole('uni_student'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 hover:text-white transition-colors flex-1 text-left"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t('uni_students', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setUniStudentsFolderOpen(!uniStudentsFolderOpen)} className="p-1 text-zinc-600 hover:text-white transition-colors">
                                            <Plus size={14} className={`transition-transform duration-500 ${uniStudentsFolderOpen ? 'rotate-45' : ''}`}/>
                                        </button>
                                    </div>
                                    {uniStudentsFolderOpen && (
                                        <div className="space-y-0.5 mt-1 border-l border-white/5 pl-2 animate-in slide-in-from-left-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('university')).map(s => (
                                                <button 
                                                    key={`uni-student-${s.id}`}
                                                    onClick={() => { handleSubjectChange(s, 'uni_student'); if(isMobile) setSidebarOpen(false); }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${activeSubject?.id === s.id && userRole === 'uni_student' ? 'bg-emerald-600 text-white font-bold shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${s.color} shrink-0 shadow-sm shadow-black/50`}></div>
                                                    <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                </button>
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

          {/* Gamification Bottom Section */}
          {!collapsed && session && (
              <div className="px-5 py-4 bg-white/5 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                 <Trophy size={16}/>
                             </div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Твоят Ранг</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">{currentRank.name}</span>
                  </div>
                  
                  <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                          <span>Уровень {userSettings.level}</span>
                          <span className="text-zinc-500">{Math.floor(stats.percentage)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div 
                              className={`h-full bg-gradient-to-r ${currentRank.gradient} transition-all duration-1000 ease-out relative`}
                              style={{ width: `${stats.percentage}%` }}
                          >
                             <div className="absolute inset-0 bg-white/20 animate-pulse"/>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setShowLeaderboard?.(true)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest transition-all">Класация</button>
                          <button onClick={() => setShowQuests?.(true)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest transition-all">Мисии</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Sidebar Footer Controls */}
          <div className={`p-4 border-t border-white/10 bg-zinc-950/20 space-y-3 backdrop-blur-3xl flex flex-col justify-center`}>
             {/* Referral Shortcut */}
             {session && !collapsed && userPlan === 'free' && (
               <button onClick={() => setShowReferralModal(true)} className={`w-full group relative overflow-hidden rounded-2xl p-4 text-left shadow-lg transition-all active:scale-95 bg-gradient-to-r from-amber-500 to-orange-600 text-white`}>
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <h3 className="font-black text-xs tracking-tight uppercase flex items-center gap-2">Вземи Pro Безплатно</h3>
                        <p className="text-[10px] font-bold opacity-80 mt-0.5">Покани приятел за 3 дни Pro</p>
                     </div>
                     <Gift size={20} className="opacity-80 group-hover:rotate-12 transition-transform duration-500"/>
                  </div>
               </button>
             )}
             
             {session && (
                 <div className="relative">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className={`absolute bottom-full ${collapsed ? 'left-16 w-64' : 'left-0 w-full'} mb-4 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40 backdrop-blur-3xl`}>
                                 <div className="p-4 border-b border-white/5 bg-white/5">
                                    <div className="font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-3">Настройки</div>
                                    <div className="space-y-1">
                                        <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-3 py-2.5 hover:bg-white/5 text-sm font-bold text-zinc-300 flex items-center gap-3 transition-colors rounded-xl">
                                            <Settings size={18} className="text-zinc-500"/> {t('settings', userSettings.language)}
                                        </button>
                                        <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-3 py-2.5 hover:bg-white/5 text-sm font-bold text-zinc-300 flex items-center gap-3 transition-colors rounded-xl">
                                            <CreditCard size={18} className="text-zinc-500"/> {t('manage_plan', userSettings.language)}
                                        </button>
                                    </div>
                                 </div>
                                 <div className="p-4 space-y-1">
                                    <button onClick={() => {setShowReportModal && setShowReportModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-3 py-2.5 hover:bg-amber-500/10 text-sm font-bold text-amber-500 flex items-center gap-3 transition-colors rounded-xl">
                                        <AlertTriangle size={18} /> Докладвай проблем
                                    </button>
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 text-sm font-bold text-red-500 flex items-center gap-3 transition-colors rounded-xl">
                                        <LogOut size={18}/> {t('logout', userSettings.language)}
                                    </button>
                                 </div>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/5 group ${collapsed ? 'justify-center' : ''}`}>
                         <div className="relative shrink-0">
                             <img 
                               src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                               alt="Profile" 
                               className="w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-[#0c0c0e] ring-indigo-500/50"
                             />
                             <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5 border border-white/10">
                                 <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${currentRank.gradient}`}>
                                     <RankIcon size={8} className="text-white"/>
                                 </div>
                             </div>
                         </div>
                         {!collapsed && (
                             <>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-black text-sm truncate text-white tracking-tight">
                                        {userMeta.firstName ? `${userMeta.firstName} ${userMeta.lastName}` : (userSettings.userName || 'Ученик')}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LVL {userSettings.level}</span>
                                        <div className="w-1 h-1 rounded-full bg-zinc-700"/>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{currentRank.name}</span>
                                    </div>
                                </div>
                                <ChevronUp size={18} className={`text-zinc-600 transition-transform duration-500 ${profileMenuOpen ? 'rotate-180' : ''}`} />
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
