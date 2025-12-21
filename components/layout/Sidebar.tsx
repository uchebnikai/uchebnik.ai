
import React, { useState } from 'react';
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, Flame, CloudOff, RefreshCw, Cloud, PanelLeftClose, PanelLeftOpen, LayoutDashboard, Landmark, Zap, Lock, LogIn, Snowflake } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SUBJECTS } from '../../constants';
import { SubjectId, AppMode, Session, UserRole, UserSettings, UserPlan, SubjectConfig, HomeViewType } from '../../types';
import { t } from '../../utils/translations';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  userSettings: UserSettings;
  setUserSettings: (val: any) => void; // Added setter
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
  setShowSettings,
  handleLogout,
  setShowAuthModal,
  addToast,
  setShowSubjectDashboard,
  userRole,
  streak,
  syncStatus = 'synced',
  homeView,
  dailyImageCount = 0
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

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 
          bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-r border-white/20 dark:border-white/10
          transition-all duration-300 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${collapsed ? 'lg:w-[88px]' : 'lg:w-[320px]'} w-[280px]
          shadow-2xl lg:shadow-none`}>
          
          <div className={`p-4 pb-2 flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
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
                {/* Collapse Toggle (Desktop Only) */}
                <button onClick={toggleCollapse} className="hidden lg:flex p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {collapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}
                </button>
            </div>
          </div>

          <div className="space-y-1 px-4 mt-2">
              <button 
                onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} 
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/30'}`}
                title="Общ Чат"
              >
                   <div className={`p-1.5 rounded-lg shrink-0 ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}><MessageSquare size={18} /></div>
                   {!collapsed && <span className="font-bold text-sm">{t('chat_general', userSettings.language)}</span>}
                   {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
              
              {/* General Chat Sessions List */}
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
                            <button onClick={() => deleteSession(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                         </div>
                     ))}
                     <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                        <Plus size={12}/> {t('new_chat', userSettings.language)}
                     </button>
                  </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
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
                        <Landmark size={20} />
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
                                                    {activeSubject?.id === s.id && userRole === 'student' && (
                                                        <div className="ml-4 pl-2 border-l border-indigo-500/20 space-y-0.5 my-1">
                                                            {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'student').map(sess => (
                                                                <div key={sess.id} className="flex items-center group/session">
                                                                    <button 
                                                                        onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                        className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                                    >
                                                                        {sess.title}
                                                                    </button>
                                                                    <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { createNewSession(s.id, 'student', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                                <Plus size={10}/> {t('new_chat', userSettings.language)}
                                                            </button>
                                                        </div>
                                                    )}
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
                                                    {activeSubject?.id === s.id && userRole === 'teacher' && (
                                                        <div className="ml-4 pl-2 border-l border-indigo-500/20 space-y-0.5 my-1">
                                                            {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'teacher').map(sess => (
                                                                <div key={sess.id} className="flex items-center group/session">
                                                                    <button 
                                                                        onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                        className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                                    >
                                                                        {sess.title}
                                                                    </button>
                                                                    <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { createNewSession(s.id, 'teacher', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                                <Plus size={10}/> {t('new_chat', userSettings.language)}
                                                            </button>
                                                        </div>
                                                    )}
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
                                <Landmark size={18} />
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
                                                    {activeSubject?.id === s.id && userRole === 'uni_student' && (
                                                        <div className="ml-4 pl-2 border-l border-emerald-500/20 space-y-0.5 my-1">
                                                            {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'uni_student').map(sess => (
                                                                <div key={sess.id} className="flex items-center group/session">
                                                                    <button 
                                                                        onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                        className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-emerald-600 dark:text-white bg-emerald-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                                    >
                                                                        {sess.title}
                                                                    </button>
                                                                    <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { createNewSession(s.id, 'uni_student', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                                                                <Plus size={10}/> {t('new_chat', userSettings.language)}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Uni Teachers Subfolder */}
                                <div className="border-l border-emerald-500/10 pl-2 mt-2">
                                    <div className="flex items-center justify-between w-full px-2 py-2 group">
                                        <button 
                                            onClick={() => { setActiveSubject(null); setHomeView('uni_teacher_subjects'); setUserRole('uni_teacher'); if(isMobile) setSidebarOpen(false); }}
                                            className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors flex-1 text-left"
                                        >
                                            <Briefcase size={14} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('uni_professors', userSettings.language)}</span>
                                        </button>
                                        <button onClick={() => setUniTeachersFolderOpen(!uniTeachersFolderOpen)} className="p-1 text-gray-400 hover:text-emerald-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${uniTeachersFolderOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                    </div>
                                    {uniTeachersFolderOpen && (
                                        <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                            {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes('university')).map(s => (
                                                <div key={`uni-teacher-${s.id}`}>
                                                    <button 
                                                        onClick={() => { handleSubjectChange(s, 'uni_teacher'); if(isMobile) setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'uni_teacher' ? 'bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                        <span className="truncate">{t(`subject_${s.id}`, userSettings.language)}</span>
                                                    </button>
                                                    {activeSubject?.id === s.id && userRole === 'uni_teacher' && (
                                                        <div className="ml-4 pl-2 border-l border-emerald-500/20 space-y-0.5 my-1">
                                                            {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'uni_teacher').map(sess => (
                                                                <div key={sess.id} className="flex items-center group/session">
                                                                    <button 
                                                                        onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                        className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-emerald-600 dark:text-white bg-emerald-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                                    >
                                                                        {sess.title}
                                                                    </button>
                                                                    <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => { createNewSession(s.id, 'uni_teacher', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                                                                <Plus size={10}/> {t('new_chat', userSettings.language)}
                                                            </button>
                                                        </div>
                                                    )}
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

          <div className={`p-4 border-t border-white/10 bg-white/20 dark:bg-black/20 space-y-3 backdrop-blur-md flex flex-col justify-center`}>
             {/* Christmas Toggle - Prominent & Over Login */}
             <button 
                onClick={() => setUserSettings((prev: UserSettings) => ({...prev, christmasMode: !prev.christmasMode}))}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-4'} py-3.5 rounded-2xl transition-all relative overflow-hidden group shadow-md hover:shadow-lg active:scale-95 mb-1
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

             {/* Usage Progress Bar for Non-Pro Users - ONLY IF LOGGED IN */}
             {session && userPlan !== 'pro' && !collapsed && (
               <div className="px-1 mb-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <span className={isNearLimit ? "text-red-500" : "text-gray-500"}>
                          {dailyImageCount} / {maxImages} Снимки
                      </span>
                      <span className="text-indigo-500">Дневен Лимит</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                        style={{width: `${usagePercent}%`}}
                      />
                  </div>
                  {isNearLimit && <p className="text-[10px] text-red-500 mt-1 font-medium animate-pulse">Лимитът наближава!</p>}
               </div>
             )}

             {/* Upgrade Plan Card - ONLY IF LOGGED IN */}
             {session && userPlan !== 'pro' && !collapsed && (
               <button onClick={() => setShowUnlockModal(true)} className={`w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isNearLimit ? 'animate-pulse-slow ring-2 ring-red-500/50' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient-xy" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="relative z-10 flex items-center justify-between text-white">
                     <div>
                        <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                            {t('upgrade_plan', userSettings.language)}
                            {isNearLimit && <Lock size={14} />}
                        </h3>
                        <p className="text-xs font-medium text-indigo-100 opacity-90">{t('unlock_potential', userSettings.language)}</p>
                     </div>
                     <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <ArrowRight size={16} />
                     </div>
                  </div>
               </button>
             )}
             
             {/* Small Upgrade Icon - ONLY IF LOGGED IN */}
             {session && userPlan !== 'pro' && collapsed && (
                 <button onClick={() => setShowUnlockModal(true)} className="w-full flex justify-center mb-1 group relative">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg">
                         <CreditCard size={18}/>
                     </div>
                     {isNearLimit && <div className="absolute top-0 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></div>}
                 </button>
             )}
             
             {session ? (
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
                                 <button onClick={() => {setActiveSubject(null); setHomeView('terms'); setProfileMenuOpen(false); if(isMobile) setSidebarOpen(false);}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <FileText size={16} className="text-gray-500"/> {t('terms', userSettings.language)}
                                 </button>
                                  <button onClick={() => {addToast('Моля, използвайте формата за контакт.', 'info'); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <HelpCircle size={16} className="text-gray-500"/> {t('help', userSettings.language)}
                                 </button>
                                 <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> {t('logout', userSettings.language)}
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-indigo-500/10 group ${collapsed ? 'justify-center' : ''}`}>
                         <img 
                           src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                           alt="Profile" 
                           className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10"
                         />
                         {!collapsed && (
                             <>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">
                                        {userMeta.firstName && userMeta.lastName 
                                            ? `${userMeta.firstName} ${userMeta.lastName}`
                                            : (userSettings.userName || 'Потребител')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-500' : 'text-gray-500'}`}>
                                            {userPlan === 'pro' ? 'Pro Plan' : userPlan === 'plus' ? 'Plus Plan' : 'Free Plan'}
                                        </div>
                                        {streak > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-1.5 py-0.5 rounded-full animate-in zoom-in">
                                                <Flame size={10} fill="currentColor" className="animate-pulse" /> {streak}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 opacity-60 mt-1">
                                        {syncStatus === 'syncing' && <><RefreshCw size={10} className="animate-spin"/> {t('syncing', userSettings.language)}</>}
                                        {syncStatus === 'synced' && <><Cloud size={10} className="text-emerald-500"/> {t('synced', userSettings.language)}</>}
                                        {syncStatus === 'error' && <><CloudOff size={10} className="text-red-500"/> {t('sync_error', userSettings.language)}</>}
                                    </div>
                                </div>
                                <ChevronUp size={16} className={`text-gray-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                             </>
                         )}
                    </button>
                 </div>
             ) : (
                 <button onClick={() => setShowAuthModal(true)} className={`w-full mb-1 flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-500/25 active:scale-95 group relative overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                     <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shrink-0 relative z-10"><LogIn size={20}/></div>
                     {!collapsed && (
                         <div className="text-left relative z-10">
                             <div className="text-sm">{t('login', userSettings.language)}</div>
                             <div className="text-[10px] opacity-80 font-medium">Запази прогреса си</div>
                         </div>
                     )}
                 </button>
             )}
          </div>
        </aside>
      </>
    );
};
