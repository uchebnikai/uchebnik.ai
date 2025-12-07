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
      <header className={`sticky top-0 lg:top-4 mx-0 lg:mx-8 z-30 h-16 lg:h-18 
        ${userSettings.customBackground ? 'bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/10' : 'bg-white/80 dark:bg-black/80 lg:bg-white/70 lg:dark:bg-black/60 backdrop-blur-xl border-white/20 dark:border-white/10'} 
        border-b lg:border lg:shadow-sm lg:rounded-3xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 pt-safe`}>
         <div className="flex items-center gap-3 lg:gap-5 overflow-hidden flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 shrink-0"><Menu size={24}/></button>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${activeSubject?.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}><DynamicIcon name={activeSubject?.icon || 'Book'} className="w-5 h-5 lg:w-6 lg:h-6"/></div>
            <div className="overflow-hidden min-w-0 flex-1">
               <h2 className="font-bold text-zinc-900 dark:text-white leading-none text-base lg:text-lg tracking-tight truncate pr-2">{activeSubject?.name}</h2>
               {activeSubject?.id === SubjectId.GENERAL ? (
                   <div className="text-xs text-gray-500 font-medium mt-1">Chat Assistant</div>
               ) : (
                   <div className="text-xs text-gray-500 font-medium mt-1 flex gap-2">
                       {userRole === 'student' ? 'Ученик' : 'Учител'} • 
                       {activeMode === AppMode.SOLVE ? ' Решаване' : 
                        activeMode === AppMode.LEARN ? ' Учене' : 
                        activeMode === AppMode.TEACHER_TEST ? ' Тест' : 
                        activeMode === AppMode.TEACHER_PLAN ? ' План' : ' Чат'}
                   </div>
               )}
            </div>
         </div>
         <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-2">
             <Button variant="secondary" onClick={startVoiceCall} className="w-10 h-10 lg:w-12 lg:h-12 p-0 rounded-full border-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30" icon={Phone} />
             <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
             <Button variant="primary" onClick={() => activeSubject && createNewSession(activeSubject.id, userRole || undefined, activeMode)} className="h-9 lg:h-10 px-3 lg:px-4 text-xs lg:text-sm rounded-xl shadow-none"><Plus size={16} className="lg:w-[18px] lg:h-[18px]"/><span className="hidden sm:inline">Нов</span></Button>
             <Button variant="ghost" onClick={() => setHistoryDrawerOpen(true)} className="w-9 h-9 lg:w-10 lg:h-10 p-0 rounded-full" icon={History} />
         </div>
      </header>
    );
};