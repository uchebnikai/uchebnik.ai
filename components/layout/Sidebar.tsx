
import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp, FileText, Flame, CloudOff, RefreshCw, Cloud, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SUBJECTS } from '../../constants';
import { SubjectId, AppMode, Session, UserRole, UserSettings, UserPlan, SubjectConfig, HomeViewType } from '../../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  userSettings: UserSettings;
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
  setHistoryDrawerOpen?: (val: boolean) => void;
}

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  userSettings,
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
  setHistoryDrawerOpen
}: SidebarProps) => {
    
    // Internal State
    const [schoolFolderOpen, setSchoolFolderOpen] = useState(true); 
    const [studentsFolderOpen, setStudentsFolderOpen] = useState(false);
    const [teachersFolderOpen, setTeachersFolderOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    const isVisible = isMobile ? sidebarOpen : isHovered;

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        
        {/* Hover detection wrapper */}
        <div 
            className={`fixed inset-y-0 left-0 z-50 h-full flex items-start pointer-events-none`}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="pointer-events-auto relative h-full flex" 
                onMouseEnter={() => setIsHovered(true)}
            >
                {/* Trigger Zone */}
                <div className={`w-6 h-full absolute left-0 top-0 z-[60] bg-transparent ${isVisible ? 'hidden' : 'block'}`} />

                <aside className={`
                    ${isCollapsed ? 'w-[90px]' : 'w-[280px] lg:w-[320px]'} h-full
                    bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-r border-white/20 dark:border-white/10
                    transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col 
                    shadow-2xl
                    ${isVisible ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className={`${isCollapsed ? 'p-4 flex flex-col items-center gap-4' : 'p-6 pb-2'}`}>
                        {/* 1. Header (Logo + Toggle) */}
                        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'gap-3 w-full group mb-6 justify-between'}`}>
                            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                                <img 
                                    src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" 
                                    alt="Uchebnik AI Logo" 
                                    className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} rounded-2xl object-contain drop-shadow-md hover:scale-110 transition-transform duration-300`} 
                                />
                                {!isCollapsed && (
                                    <div className="text-left">
                                        <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight font-display">Uchebnik AI</h1>
                                        <p className={`text-[10px] font-bold tracking-widest uppercase ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-500' : 'text-gray-500'}`}>
                                            {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'plus' ? 'PLUS PLAN' : 'FREE PLAN'}
                                        </p>
                                    </div>
                                )}
                            </button>
                            
                            <button 
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className={`text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${isCollapsed ? '' : ''}`}
                                title={isCollapsed ? "Expand" : "Collapse"}
                            >
                                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                            </button>
                        </div>
                        
                        <div className={`space-y-2 ${isCollapsed ? 'w-full flex flex-col items-center mt-2' : ''}`}>
                            {/* 2. General Chat (Second Icon) */}
                            <button 
                                onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} 
                                className={`
                                    flex items-center transition-all relative group
                                    ${isCollapsed 
                                        ? 'justify-center w-12 h-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10' 
                                        : 'w-full gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10'
                                    }
                                    ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}
                                `}
                                title={isCollapsed ? "Общ Чат" : ""}
                            >
                                <MessageSquare size={isCollapsed ? 22 : 18} className={activeSubject?.id === SubjectId.GENERAL ? 'text-white' : 'text-current'}/>
                                {!isCollapsed && <span className="font-bold text-sm">Общ Чат</span>}
                                {!isCollapsed && unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                {isCollapsed && unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </button>

                            {/* 3. Search (Third Icon) */}
                            <button 
                                onClick={() => { if(setHistoryDrawerOpen) setHistoryDrawerOpen(true); if(isMobile) setSidebarOpen(false); }} 
                                className={`
                                    flex items-center transition-all group
                                    ${isCollapsed 
                                        ? 'justify-center w-12 h-12 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white' 
                                        : 'w-full gap-3 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white'
                                    }
                                `}
                                title={isCollapsed ? "Търсене" : ""}
                            >
                                <Search size={isCollapsed ? 22 : 18} />
                                {!isCollapsed && <span className="font-bold text-sm">Търсене</span>}
                            </button>

                            {/* General Chat Sessions List (Expanded Only) */}
                            {!isCollapsed && activeSubject?.id === SubjectId.GENERAL && (
                                <div className="ml-4 mt-2 space-y-0.5 border-l-2 border-indigo-500/20 pl-2 animate-in slide-in-from-top-2">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 pl-2">Скорошни</div>
                                    {sessions.filter(s => s.subjectId === SubjectId.GENERAL).slice(0, 5).map(s => (
                                        <div key={s.id} className="flex items-center group/session">
                                            <button 
                                                onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                                className={`flex-1 text-left px-3 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                            >
                                                {s.title}
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                        <Plus size={12}/> Нов чат
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Scroll Area (Hidden in Slim Mode as per instructions "show only...") */}
                    {!isCollapsed && (
                        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                            {/* School Folder */}
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                <button onClick={() => setSchoolFolderOpen(!schoolFolderOpen)} className="w-full flex items-center justify-between px-2 py-3 text-gray-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <School size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Училище</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${schoolFolderOpen ? 'rotate-180' : ''}`}/>
                                </button>
                                
                                {schoolFolderOpen && (
                                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-2">
                                        
                                        {/* Students Subfolder */}
                                        <div className="border-l border-indigo-500/10 pl-2">
                                            <button onClick={() => setStudentsFolderOpen(!studentsFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={14} />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">Ученици</span>
                                                </div>
                                                <ChevronDown size={12} className={`transition-transform duration-300 ${studentsFolderOpen ? 'rotate-180' : ''}`}/>
                                            </button>
                                            
                                            {studentsFolderOpen && (
                                                <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                                    {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                                        <div key={`student-${s.id}`}>
                                                            <button 
                                                                onClick={() => { handleSubjectChange(s, 'student'); if(isMobile) setSidebarOpen(false); }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'student' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                                <span className="truncate">{s.name}</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Teachers Subfolder */}
                                        <div className="border-l border-indigo-500/10 pl-2 mt-2">
                                            <button onClick={() => setTeachersFolderOpen(!teachersFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={14} />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">Учители</span>
                                                </div>
                                                <ChevronDown size={12} className={`transition-transform duration-300 ${teachersFolderOpen ? 'rotate-180' : ''}`}/>
                                            </button>
                                            
                                            {teachersFolderOpen && (
                                                <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                                    {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                                        <div key={`teacher-${s.id}`}>
                                                            <button 
                                                                onClick={() => { handleSubjectChange(s, 'teacher'); if(isMobile) setSidebarOpen(false); }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'teacher' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                                <span className="truncate">{s.name}</span>
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
                    
                    {/* Spacer when collapsed to push footer down */}
                    {isCollapsed && <div className="flex-1" />}

                    <div className={`p-4 border-t border-white/10 bg-white/20 dark:bg-black/20 space-y-3 backdrop-blur-md flex flex-col justify-center`}>
                        {userPlan !== 'pro' && !isCollapsed && (
                        <button onClick={() => setShowUnlockModal(true)} className="w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient-xy" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="relative z-10 flex items-center justify-between text-white">
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">Upgrade Plan</h3>
                                    <p className="text-xs font-medium text-indigo-100 opacity-90">Отключи пълния потенциал</p>
                                </div>
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </button>
                        )}
                        
                        {session ? (
                            <div className="relative mb-1">
                                {profileMenuOpen && !isCollapsed && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40">
                                            <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                                <Settings size={16} className="text-gray-500"/> Настройки
                                            </button>
                                            <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                                <CreditCard size={16} className="text-gray-500"/> Управление на плана
                                            </button>
                                            <button onClick={() => {setActiveSubject(null); setHomeView('terms'); setProfileMenuOpen(false); if(isMobile) setSidebarOpen(false);}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                                <FileText size={16} className="text-gray-500"/> Общи условия
                                            </button>
                                            <button onClick={() => {addToast('Свържете се с нас в Discord за помощ.', 'info'); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                                <HelpCircle size={16} className="text-gray-500"/> Помощ
                                            </button>
                                            <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                                <LogOut size={16}/> Изход
                                            </button>
                                        </div>
                                    </>
                                )}
                                
                                <button 
                                    onClick={() => isCollapsed ? setIsCollapsed(false) : setProfileMenuOpen(!profileMenuOpen)} 
                                    className={`
                                        flex items-center transition-all duration-200 border border-transparent hover:border-indigo-500/10 group
                                        ${isCollapsed 
                                            ? 'justify-center w-12 h-12 p-0 mx-auto rounded-full hover:bg-white/10' 
                                            : 'gap-3 w-full p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <img 
                                    src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                                    alt="Profile" 
                                    className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} rounded-full object-cover border border-gray-200 dark:border-white/10`}
                                    />
                                    {!isCollapsed && (
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
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-1.5 py-0.5 rounded-full">
                                                            <Flame size={10} fill="currentColor" /> {streak}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronUp size={16} className={`text-gray-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowAuthModal(true)} 
                                className={`
                                    flex items-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95
                                    ${isCollapsed 
                                        ? 'justify-center w-12 h-12 p-0 mx-auto rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white' 
                                        : 'w-full mb-1 gap-3 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold'
                                    }
                                `}
                            >
                                <div className={`${isCollapsed ? 'w-full h-full' : 'w-10 h-10'} rounded-full bg-white/20 flex items-center justify-center border border-white/20`}><User size={20}/></div>
                                {!isCollapsed && (
                                    <div className="text-left">
                                        <div className="text-sm">Вход</div>
                                        <div className="text-[10px] opacity-80">Запази прогреса си</div>
                                    </div>
                                )}
                            </button>
                        )}

                        {!isCollapsed && (
                            <a href="https://discord.gg/4SB2NGPq8h" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95 group">
                                <svg width="20" height="20" viewBox="0 0 127 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.07 72.07 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.15 105.15 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96a75.2 75.2 0 0 0 6.57-12.8 69.1 69.1 0 0 1-10.46-5.01c.96-.71 1.9-1.44 2.81-2.19 26.25 12.31 54.54 12.31 80.8 0 .91.75 1.85 1.48 2.81 2.19a69.1 69.1 0 0 1-10.47 5.01 75.2 75.2 0 0 0 6.57 12.8A105.73 105.73 0 0 0 126.6 80.22c2.96-23.97-2.1-47.57-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60.08 31 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Zm42.2 0C78.38 65.69 73.2 60.08 73.2 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Z" fill="currentColor"/></svg>
                                Влез в Discord
                            </a>
                        )}
                    </div>
                </aside>
            </div>
        </div>
      </>
    );
};
