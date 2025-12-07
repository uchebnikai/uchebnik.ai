import React, { useState } from 'react';
import { Sparkles, MessageSquare, Trash2, Plus, School, GraduationCap, Briefcase, ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut, ArrowRight, ChevronUp } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SUBJECTS } from '../../constants';
import { SubjectId, AppMode, Session, UserRole, UserSettings, UserPlan, SubjectConfig } from '../../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  userSettings: UserSettings;
  userPlan: UserPlan;
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: 'landing' | 'school_select' | 'student_subjects' | 'teacher_subjects') => void;
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
  userRole
}: SidebarProps) => {
    
    const [schoolFolderOpen, setSchoolFolderOpen] = useState(true); 
    const [studentsFolderOpen, setStudentsFolderOpen] = useState(false);
    const [teachersFolderOpen, setTeachersFolderOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-[300px] 
          lg:m-4 lg:rounded-[2.5rem] bg-black/60 backdrop-blur-2xl border border-white/10
          transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl`}>
          
          <div className="p-6 pb-2">
            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className="flex items-center gap-4 w-full group mb-8">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform duration-300 border border-white/20">
                  <Sparkles size={24} fill="currentColor" />
               </div>
               <div className="text-left">
                  <h1 className="font-bold text-xl text-white tracking-tight font-display drop-shadow-md">uchebnik.ai</h1>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${userPlan === 'pro' ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : userPlan === 'plus' ? 'text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]' : 'text-gray-500'}`}>
                    {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'plus' ? 'PLUS PLAN' : 'FREE PLAN'}
                  </p>
               </div>
            </button>
            <div className="space-y-2">
              <button onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                   <div className={`p-1.5 rounded-lg ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}><MessageSquare size={18} /></div>
                   <span className="font-bold text-sm tracking-wide">Общ Чат</span>
                   {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute right-4 w-2 h-2 bg-neon-pink rounded-full animate-pulse shadow-[0_0_10px_#ff0096]" />}
              </button>
              
              {/* General Chat Sessions List */}
              {activeSubject?.id === SubjectId.GENERAL && (
                  <div className="ml-4 mt-2 space-y-1 border-l border-white/10 pl-3 animate-in slide-in-from-top-2">
                     {sessions.filter(s => s.subjectId === SubjectId.GENERAL).map(s => (
                         <div key={s.id} className="flex items-center group/session">
                            <button 
                                onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                {s.title}
                            </button>
                            <button onClick={() => deleteSession(s.id)} className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                         </div>
                     ))}
                     <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                        <Plus size={12}/> Нов чат
                     </button>
                  </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             {/* School Folder */}
             <div className="mt-4">
                 <button onClick={() => setSchoolFolderOpen(!schoolFolderOpen)} className="w-full flex items-center justify-between px-3 py-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                     <div className="flex items-center gap-3">
                         <School size={16} />
                         <span className="text-xs font-bold uppercase tracking-widest">Училище</span>
                     </div>
                     <ChevronDown size={14} className={`transition-transform duration-300 ${schoolFolderOpen ? 'rotate-180' : ''}`}/>
                 </button>
                 
                 {schoolFolderOpen && (
                     <div className="pl-2 space-y-2 mt-2 animate-in slide-in-from-top-2">
                         
                         {/* Students Subfolder */}
                         <div className="bg-white/5 rounded-2xl p-2 border border-white/5">
                             <button onClick={() => setStudentsFolderOpen(!studentsFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-400 hover:text-indigo-400 transition-colors">
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Ученици</span>
                                </div>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${studentsFolderOpen ? 'rotate-180' : ''}`}/>
                             </button>
                             
                             {studentsFolderOpen && (
                                 <div className="space-y-1 mt-2">
                                     {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                         <div key={`student-${s.id}`}>
                                            <button 
                                                onClick={() => { handleSubjectChange(s, 'student'); if(isMobile) setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${activeSubject?.id === s.id && userRole === 'student' ? 'bg-indigo-600/30 text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px] ${s.color}`}></div>
                                                <span className="truncate font-medium">{s.name}</span>
                                            </button>
                                            
                                            {/* Sessions List */}
                                            {activeSubject?.id === s.id && userRole === 'student' && (
                                                <div className="ml-4 pl-2 border-l border-white/10 space-y-0.5 my-1">
                                                    {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'student').map(sess => (
                                                        <div key={sess.id} className="flex items-center group/session">
                                                            <button 
                                                                onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                {sess.title}
                                                            </button>
                                                            <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { createNewSession(s.id, 'student', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                        <Plus size={10}/> Нов чат
                                                    </button>
                                                </div>
                                            )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         {/* Teachers Subfolder */}
                         <div className="bg-white/5 rounded-2xl p-2 border border-white/5">
                             <button onClick={() => setTeachersFolderOpen(!teachersFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-400 hover:text-indigo-400 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Учители</span>
                                </div>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${teachersFolderOpen ? 'rotate-180' : ''}`}/>
                             </button>
                             
                             {teachersFolderOpen && (
                                 <div className="space-y-1 mt-2">
                                     {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                         <div key={`teacher-${s.id}`}>
                                            <button 
                                                onClick={() => { handleSubjectChange(s, 'teacher'); if(isMobile) setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${activeSubject?.id === s.id && userRole === 'teacher' ? 'bg-indigo-600/30 text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px] ${s.color}`}></div>
                                                <span className="truncate font-medium">{s.name}</span>
                                            </button>

                                            {/* Sessions List */}
                                            {activeSubject?.id === s.id && userRole === 'teacher' && (
                                                <div className="ml-4 pl-2 border-l border-white/10 space-y-0.5 my-1">
                                                    {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'teacher').map(sess => (
                                                        <div key={sess.id} className="flex items-center group/session">
                                                            <button 
                                                                onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                {sess.title}
                                                            </button>
                                                            <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { createNewSession(s.id, 'teacher', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                        <Plus size={10}/> Нов чат
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

          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl rounded-b-[2.5rem] space-y-3">
             {userPlan !== 'pro' && (
               <button onClick={() => setShowUnlockModal(true)} className="w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-lg transition-all hover:scale-[1.02] border border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-gradient-xy opacity-80" />
                  <div className="relative z-10 flex items-center justify-between text-white">
                     <div>
                        <h3 className="font-bold text-base tracking-tight drop-shadow-md">Upgrade Plan</h3>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Отключи всичко</p>
                     </div>
                     <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <ArrowRight size={16} />
                     </div>
                  </div>
               </button>
             )}
             
             {session ? (
                 <div className="relative mb-1">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40">
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors text-gray-300">
                                    <Settings size={16} className="text-gray-500"/> Настройки
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors text-gray-300">
                                    <CreditCard size={16} className="text-gray-500"/> План
                                 </button>
                                 <div className="h-px bg-white/10 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> Изход
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10 group">
                         <img 
                           src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                           alt="Profile" 
                           className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg"
                         />
                         <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-sm truncate text-white">
                                {userMeta.firstName && userMeta.lastName 
                                    ? `${userMeta.firstName} ${userMeta.lastName}`
                                    : (userSettings.userName || 'Потребител')}
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {userPlan === 'pro' ? 'Pro Plan' : userPlan === 'plus' ? 'Plus Plan' : 'Free Plan'}
                            </div>
                         </div>
                         <ChevronUp size={16} className={`text-gray-500 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                 </div>
             ) : (
                 <button onClick={() => setShowAuthModal(true)} className="w-full mb-1 flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10">
                     <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"><User size={20}/></div>
                     <div className="text-left">
                         <div className="text-sm">Вход</div>
                         <div className="text-[10px] opacity-60">Запази прогреса си</div>
                     </div>
                 </button>
             )}
          </div>
        </aside>
      </>
    );
};