import React from 'react';
import { ArrowLeft, Zap, Book, CheckCircle, FileJson } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SubjectConfig, UserRole, UserSettings, AppMode } from '../../types';
import { ZOOM_IN } from '../../animations/transitions';

interface SubjectDashboardProps {
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: 'school_select') => void;
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
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center justify-center relative w-full h-full`}>
         <button onClick={() => { setActiveSubject(null); setHomeView('school_select'); }} className="absolute top-6 left-6 p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20 backdrop-blur-md"><ArrowLeft size={24}/></button>

         <div className={`max-w-4xl w-full text-center space-y-8 ${ZOOM_IN}`}>
             <div className={`w-28 h-28 mx-auto rounded-[2.5rem] ${activeSubject.color} flex items-center justify-center text-white shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/20 relative`}>
                 <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] blur-xl opacity-50 animate-pulse"/>
                 <DynamicIcon name={activeSubject.icon} className="w-14 h-14 relative z-10" />
             </div>
             
             <div>
                 <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight mb-2 drop-shadow-xl">{activeSubject.name}</h1>
                 <p className="text-xl text-indigo-200 font-medium">{isStudent ? 'Какво ще правим днес?' : 'Инструменти за учителя'}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                 {isStudent ? (
                     <>
                         <button onClick={() => handleStartMode(AppMode.SOLVE)} className="group p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3rem] text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:border-indigo-500/30 backdrop-blur-md">
                             <div className="p-4 bg-indigo-600 rounded-3xl w-fit mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                 <Zap size={28} className="text-white"/>
                             </div>
                             <h3 className="text-3xl font-bold mb-2 text-white">За решаване</h3>
                             <p className="text-gray-400 font-medium text-lg">Помощ със задачи и упражнения.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.LEARN)} className="group p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3rem] text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 backdrop-blur-md">
                             <div className="p-4 bg-emerald-600 rounded-3xl w-fit mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                 <Book size={28} className="text-white"/>
                             </div>
                             <h3 className="text-3xl font-bold mb-2 text-white">За учене</h3>
                             <p className="text-gray-400 font-medium text-lg">Обяснения на уроци и концепции.</p>
                         </button>
                     </>
                 ) : (
                     <>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_TEST)} className="group p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3rem] text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:border-indigo-500/30 backdrop-blur-md">
                             <div className="p-4 bg-indigo-600 rounded-3xl w-fit mb-6 shadow-lg shadow-indigo-500/30">
                                 <CheckCircle size={28} className="text-white"/>
                             </div>
                             <h3 className="text-3xl font-bold mb-2 text-white">Създай Тест</h3>
                             <p className="text-gray-400 font-medium text-lg">Генерирай въпроси и отговори.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_PLAN)} className="group p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3rem] text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:border-amber-500/30 backdrop-blur-md">
                             <div className="p-4 bg-amber-500 rounded-3xl w-fit mb-6 shadow-lg shadow-amber-500/30">
                                 <FileJson size={28} className="text-white"/>
                             </div>
                             <h3 className="text-3xl font-bold mb-2 text-white">План на урок</h3>
                             <p className="text-gray-400 font-medium text-lg">Структурирай урока и целите.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_RESOURCES)} className="col-span-full group p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3rem] text-left hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] hover:border-pink-500/30 backdrop-blur-md flex items-center gap-8">
                             <div className="p-4 bg-pink-500 rounded-3xl w-fit shadow-lg shadow-pink-500/30 shrink-0">
                                 <LightbulbIcon size={28}/>
                             </div>
                             <div>
                                <h3 className="text-3xl font-bold mb-1 text-white">Идеи и Ресурси</h3>
                                <p className="text-gray-400 font-medium text-lg">Интерактивни задачи и материали.</p>
                             </div>
                         </button>
                     </>
                 )}
             </div>
         </div>
      </div>
    );
};