
import React from 'react';
import { ArrowLeft, Zap, Book, CheckCircle, FileJson, Play } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import { SubjectConfig, UserRole, UserSettings, AppMode, HomeViewType } from '../../types';
import { t } from '../../utils/translations';

interface SubjectDashboardProps {
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: HomeViewType) => void;
  userRole: UserRole | null;
  userSettings: UserSettings;
  handleStartMode: (mode: AppMode) => void;
  onQuickAction?: (prompt: string) => void;
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
  handleStartMode,
  onQuickAction
}: SubjectDashboardProps) => {
    
    if (!activeSubject) return null;
      
    const isStudent = userRole === 'student' || userRole === 'uni_student';
    
    return (
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center relative overflow-x-hidden bg-transparent`}>
         <button onClick={() => { setActiveSubject(null); setHomeView(userRole?.includes('uni') ? 'university_select' : 'school_select'); }} className="absolute top-6 left-6 p-2 text-gray-500 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-md rounded-full transition-colors z-20"><ArrowLeft size={24}/></button>

         <div className="max-w-4xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className={`w-24 h-24 mx-auto rounded-[32px] ${activeSubject.color} flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 rotate-3`}>
                 <DynamicIcon name={activeSubject.icon} className="w-12 h-12" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white font-display tracking-tight">{t(`subject_${activeSubject.id}`, userSettings.language)}</h1>
             <p className="text-xl text-gray-500 dark:text-gray-400">{isStudent ? t('what_to_do', userSettings.language) : t('teacher_tools', userSettings.language)}</p>
             
             {/* Main Modes */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                 {isStudent ? (
                     <>
                         <button onClick={() => handleStartMode(AppMode.SOLVE)} className="group p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <Zap size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">{t('mode_solve', userSettings.language)}</h3>
                             <p className="text-gray-500 font-medium">{t('mode_solve_desc', userSettings.language)}</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.LEARN)} className="group p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-emerald-500/30">
                             <div className="p-3 bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                 <Book size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">{t('mode_learn', userSettings.language)}</h3>
                             <p className="text-gray-500 font-medium">{t('mode_learn_desc', userSettings.language)}</p>
                         </button>
                     </>
                 ) : (
                     <>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_TEST)} className="group p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <CheckCircle size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">{t('mode_test', userSettings.language)}</h3>
                             <p className="text-gray-500 font-medium">{t('mode_test_desc', userSettings.language)}</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_PLAN)} className="group p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-amber-500/30">
                             <div className="p-3 bg-amber-100/50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl w-fit mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                 <FileJson size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">{t('mode_plan', userSettings.language)}</h3>
                             <p className="text-gray-500 font-medium">{t('mode_plan_desc', userSettings.language)}</p>
                         </button>
                     </>
                 )}
             </div>

             {/* Quick Actions Grid (The "1000 Things") */}
             {activeSubject.quickActions && activeSubject.quickActions.length > 0 && (
                 <div className="mt-8 animate-in slide-in-from-bottom-4">
                     <h4 className="text-left text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">Бързи Действия</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                         {activeSubject.quickActions.map(action => (
                             <button
                                key={action.id}
                                onClick={() => onQuickAction && onQuickAction(action.prompt)}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                             >
                                 <div className="p-2 mb-2 rounded-full bg-gray-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200">
                                     <DynamicIcon name={action.icon} className="w-5 h-5"/>
                                 </div>
                                 <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 text-center">{action.label}</span>
                             </button>
                         ))}
                     </div>
                 </div>
             )}
         </div>
      </div>
    );
};
