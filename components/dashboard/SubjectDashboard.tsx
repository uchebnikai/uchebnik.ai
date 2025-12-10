
import React from 'react';
import { ArrowLeft, Zap, Book, CheckCircle, FileJson } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SubjectConfig, UserRole, UserSettings, AppMode, HomeViewType } from '../../types';

interface SubjectDashboardProps {
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: HomeViewType) => void;
  userRole: UserRole | null;
  userSettings: UserSettings;
  handleStartMode: (mode: AppMode) => void;
}

const LightbulbIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
);

export const SubjectDashboard = ({
  activeSubject,
  setActiveSubject,
  setHomeView,
  userRole,
  userSettings,
  handleStartMode
}: SubjectDashboardProps) => {
    
    if (!activeSubject) return null;
      
    const isStudent = userRole === 'student';
    
    return (
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center relative overflow-x-hidden bg-transparent`}>
         <button onClick={() => { setActiveSubject(null); setHomeView('school_select'); }} className="absolute top-6 left-6 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors z-20"><ArrowLeft size={24}/></button>

         <div className="max-w-3xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className={`w-24 h-24 mx-auto rounded-[32px] ${activeSubject.color} flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 rotate-3`}>
                 <DynamicIcon name={activeSubject.icon} className="w-12 h-12" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white font-display tracking-tight">{activeSubject.name}</h1>
             <p className="text-xl text-gray-500 dark:text-gray-400">{isStudent ? 'Какво ще правим днес?' : 'Инструменти за учителя'}</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                 {isStudent ? (
                     <>
                         <button onClick={() => handleStartMode(AppMode.SOLVE)} className="group p-6 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <Zap size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">За решаване</h3>
                             <p className="text-gray-500 font-medium">Помощ със задачи и упражнения.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.LEARN)} className="group p-6 bg-white dark:bg-zinc-900 border border-emerald-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-emerald-500/30">
                             <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                 <Book size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">За учене</h3>
                             <p className="text-gray-500 font-medium">Обяснения на уроци и концепции.</p>
                         </button>
                     </>
                 ) : (
                     <>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_TEST)} className="group p-6 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <CheckCircle size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">Създай Тест</h3>
                             <p className="text-gray-500 font-medium">Генерирай въпроси и отговори за проверка.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_PLAN)} className="group p-6 bg-white dark:bg-zinc-900 border border-amber-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-amber-500/30">
                             <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl w-fit mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                 <FileJson size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">План на урок</h3>
                             <p className="text-gray-500 font-medium">Структурирай урока и целите.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_RESOURCES)} className="col-span-full group p-6 bg-white dark:bg-zinc-900 border border-pink-500/10 rounded-3xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl hover:shadow-2xl hover:border-pink-500/30">
                             <div className="p-3 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-2xl w-fit mb-4 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                 <LightbulbIcon size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">Идеи и Ресурси</h3>
                             <p className="text-gray-500 font-medium">Интерактивни задачи и материали.</p>
                         </button>
                     </>
                 )}
             </div>
         </div>
      </div>
    );
};
