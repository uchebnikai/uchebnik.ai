import React, { useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowRight, LayoutGrid, Shield, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUBJECTS } from '../constants';
import { SubjectId } from '../types';
import { DynamicIcon } from '../components/ui/UI';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const { userSettings, setShowAdminAuth, setActiveSubject } = useAppContext();
  const [view, setView] = React.useState<'landing' | 'grid'>('landing');
  const navigate = useNavigate();

  useEffect(() => {
    setActiveSubject(null);
  }, []);

  const handleStart = (subject: any) => {
    setActiveSubject(subject);
    navigate(`/chat/${subject.id}`);
  };

  return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden ${userSettings.customBackground ? 'bg-transparent' : 'bg-white dark:bg-zinc-950'}`}>
      {!userSettings.customBackground && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none"></div>}
      
      {view === 'landing' ? (
        <div className="max-w-5xl w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10 animate-in fade-in zoom-in-95 duration-700">
          <button onClick={() => setShowAdminAuth(true)} className="absolute top-0 right-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors"><Shield size={16} /></button>
          <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6 px-2">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-indigo-500/20 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 md:mb-6 backdrop-blur-xl shadow-lg"><Sparkles size={12} className="text-indigo-500" /><span>AI Учебен Асистент 2.0</span></div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 tracking-tighter leading-[1.1] md:leading-[1] font-display">Здравей{userSettings.userName ? `, ${userSettings.userName}` : ''}.</h1>
            <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed px-4">Твоят интелигентен помощник за училище. Какво ще учим днес?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full px-4 md:px-12 max-w-4xl">
            <button onClick={() => handleStart(SUBJECTS[0])} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-zinc-900 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-accent-700 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out overflow-hidden ring-4 ring-transparent hover:ring-indigo-500/20">
               <div className="relative z-10 flex flex-col h-full justify-between"><div className="bg-white/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md"><MessageSquare size={24} className="md:w-8 md:h-8" /></div><div><h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-3">Общ Чат</h3><p className="opacity-70 text-base md:text-lg font-medium">Попитай каквото и да е.</p></div><div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm bg-white/20 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">Старт <ArrowRight size={14} className="md:w-4 md:h-4" /></div></div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-accent-500 blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            </button>
            <button onClick={() => setView('grid')} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-white dark:bg-zinc-900 border border-indigo-500/10 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98]">
               <div className="relative z-10 flex flex-col h-full justify-between"><div className="bg-indigo-50 dark:bg-indigo-500/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"><LayoutGrid size={24} className="md:w-8 md:h-8" /></div><div><h3 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2 md:mb-3">Предмети</h3><p className="text-zinc-500 mt-1 md:mt-2 text-base md:text-lg font-medium">Математика, История...</p></div><div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm text-zinc-600 dark:text-zinc-300 bg-gray-100 dark:bg-white/5 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">Разгледай <ArrowRight size={14} className="md:w-4 md:h-4" /></div></div>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl w-full py-8 md:py-12 px-4 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
           <button onClick={() => setView('landing')} className="mb-8 md:mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold group"><div className="p-3 bg-white dark:bg-zinc-900 rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div> Назад към начало</button>
           <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-8 md:mb-10 tracking-tight px-2">Избери Предмет</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map((s, i) => (
                <button key={s.id} onClick={() => handleStart(s)} style={{animationDelay: `${i*50}ms`}} className="group flex flex-col items-center text-center p-6 md:p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[32px] border border-indigo-500/20 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 animate-in fade-in fill-mode-backwards">
                   <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl ${s.color} text-white flex items-center justify-center mb-4 md:mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}><DynamicIcon name={s.icon} className="w-8 h-8 md:w-10 md:h-10" /></div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl mb-2">{s.name}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">Натисни за старт</p>
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};