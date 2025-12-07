import React from 'react';
import { Menu, Phone, Plus, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SubjectConfig, UserRole, AppMode, SubjectId, UserSettings } from '../../types';

interface ChatHeaderProps {
  setSidebarOpen: (val: boolean) => void;
  activeSubject: SubjectConfig | null;
  userRole: UserRole | null;
  activeMode: AppMode;
  startVoiceCall: () => void;
  createNewSession: (id: SubjectId, role?: UserRole, mode?: AppMode) => void;
  setHistoryDrawerOpen: (val: boolean) => void;
  userSettings: UserSettings;
}

export const ChatHeader = ({
  setSidebarOpen,
  activeSubject,
  userRole,
  activeMode,
  startVoiceCall,
  createNewSession,
  setHistoryDrawerOpen,
  userSettings
}: ChatHeaderProps) => {
    return (
      <header className="absolute top-6 left-0 right-0 z-30 px-4 md:px-8 flex justify-center pointer-events-none">
         <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl h-16 flex items-center justify-between px-2 pr-3 pointer-events-auto">
             
             <div className="flex items-center gap-3 overflow-hidden min-w-0 pl-1">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 rounded-full hover:bg-white/10 text-gray-400 shrink-0 transition-colors"><Menu size={20}/></button>
                <div className={`w-10 h-10 rounded-full ${activeSubject?.color} flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shrink-0 border border-white/20`}><DynamicIcon name={activeSubject?.icon || 'Book'} className="w-5 h-5"/></div>
                <div className="overflow-hidden min-w-0 flex flex-col justify-center">
                   <h2 className="font-bold text-white leading-tight text-sm tracking-wide truncate">{activeSubject?.name}</h2>
                   {activeSubject?.id !== SubjectId.GENERAL && (
                       <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider truncate">
                           {activeMode === AppMode.SOLVE ? 'Решаване' : 
                            activeMode === AppMode.LEARN ? 'Учене' : 
                            activeMode === AppMode.TEACHER_TEST ? 'Тест' : 
                            activeMode === AppMode.TEACHER_PLAN ? 'План' : 'Чат'}
                       </div>
                   )}
                </div>
             </div>

             <div className="flex items-center gap-2 shrink-0">
                 <button onClick={startVoiceCall} className="w-10 h-10 rounded-full flex items-center justify-center text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"><Phone size={18} /></button>
                 <div className="h-4 w-px bg-white/10 mx-1" />
                 <button onClick={() => activeSubject && createNewSession(activeSubject.id, userRole || undefined, activeMode)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2"><Plus size={14}/><span className="hidden sm:inline">Нов</span></button>
                 <button onClick={() => setHistoryDrawerOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><History size={18} /></button>
             </div>

         </div>
      </header>
    );
};