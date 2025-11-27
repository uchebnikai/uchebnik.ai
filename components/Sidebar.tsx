import React from 'react';
import { Sparkles, MessageSquare, Settings, LogOut, Loader2 } from 'lucide-react';
import { SUBJECTS } from '../constants';
import { SubjectId } from '../types';
import { useAppContext } from '../context/AppContext';
import { DynamicIcon } from './ui/UI';
import { Button } from './ui/UI';
import { useNavigate } from 'react-router-dom';

export const Sidebar = () => {
  const { 
    sidebarOpen, setSidebarOpen, activeSubject, unreadSubjects, loadingSubjects, userSettings, isProUnlocked, 
    setShowSettings, handleLogout, setActiveSubject 
  } = useAppContext();
  const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const handleSubjectClick = (subject: any) => {
    setActiveSubject(subject);
    navigate(`/chat/${subject.id}`);
    if (isMobile) setSidebarOpen(false);
  };
  
  const goHome = () => {
    setActiveSubject(null);
    navigate('/');
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-[320px] 
        ${userSettings.customBackground ? 'bg-white/30 dark:bg-black/40 backdrop-blur-2xl border-white/10' : 'bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-white/5'}
        border-r transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="p-6 pb-2">
          <button onClick={goHome} className="flex items-center gap-3 w-full group mb-8">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <Sparkles size={20} fill="currentColor" />
             </div>
             <div className="text-left">
                <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight font-display">uchebnik.ai</h1>
                <p className={`text-[10px] font-bold tracking-widest uppercase ${isProUnlocked ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  {isProUnlocked ? 'ПРОФЕСИОНАЛЕН ПЛАН' : 'БЕЗПЛАТЕН ПЛАН'}
                </p>
             </div>
          </button>
          <div className="space-y-1">
            <button onClick={() => handleSubjectClick(SUBJECTS[0])} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/30'}`}>
                 <div className={`p-1.5 rounded-lg ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}><MessageSquare size={18} /></div>
                 <span className="font-bold text-sm">Общ Чат</span>
                 {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
           <div className="flex items-center justify-between px-2 py-3 mt-2">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Предмети</span>
           </div>
           <div className="space-y-1">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                <button key={s.id} onClick={() => handleSubjectClick(s)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 border ${activeSubject?.id === s.id ? 'bg-indigo-50 dark:bg-white/10 border-indigo-500/30 text-indigo-700 dark:text-white font-semibold' : 'border-transparent text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                  <div className={`p-1.5 rounded-lg transition-colors ${activeSubject?.id === s.id ? 'bg-indigo-100 dark:bg-white/20 text-indigo-600 dark:text-white' : 'bg-gray-100 dark:bg-white/5'}`}>
                      <DynamicIcon name={s.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-sm truncate flex-1 text-left">{s.name}</span>
                  {unreadSubjects.has(s.id) && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                  {loadingSubjects[s.id] && activeSubject?.id !== s.id && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </button>
              ))}
           </div>
        </div>

        <div className={`p-4 border-t ${userSettings.customBackground ? 'border-white/10 bg-black/10' : 'border-gray-100 dark:border-white/5 bg-white/30 dark:bg-black/20'} space-y-3 backdrop-blur-md flex flex-col justify-center`}>
           <Button variant="ghost" className="w-full justify-center text-sm font-medium h-11 hover:bg-white/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400" onClick={() => setShowSettings(true)}>
               <Settings size={18} />
               <span>Настройки</span>
           </Button>
           
           <Button variant="ghost" className="w-full justify-center text-sm font-medium h-11 hover:bg-red-500/10 text-red-500 dark:text-red-400" onClick={handleLogout}>
               <LogOut size={18} />
               <span>Изход</span>
           </Button>

           <a href="https://discord.gg/4SB2NGPq8h" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95 group">
              <svg width="20" height="20" viewBox="0 0 127 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.07 72.07 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.15 105.15 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96a75.2 75.2 0 0 0 6.57-12.8 69.1 69.1 0 0 1-10.46-5.01c.96-.71 1.9-1.44 2.81-2.19 26.25 12.31 54.54 12.31 80.8 0 .91.75 1.85 1.48 2.81 2.19a69.1 69.1 0 0 1-10.47 5.01 75.2 75.2 0 0 0 6.57 12.8A105.73 105.73 0 0 0 126.6 80.22c2.96-23.97-2.1-47.57-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60.08 31 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Zm42.2 0C78.38 65.69 73.2 60.08 73.2 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Z" fill="currentColor"/></svg>
              Влез в Discord
           </a>
        </div>
      </aside>
    </>
  );
};