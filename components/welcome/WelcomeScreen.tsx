import React from 'react';
import { Shield, Sparkles, MessageSquare, ArrowRight, School, GraduationCap, Briefcase, ArrowLeft } from 'lucide-react';
import { SubjectConfig, UserRole, UserSettings, SubjectId } from '../../types';
import { SUBJECTS } from '../../constants';
import { DynamicIcon } from '../ui/DynamicIcon';
import { ZOOM_IN, SLIDE_UP, FADE_IN } from '../../animations/transitions';
import { getStaggeredDelay } from '../../animations/utils';

interface WelcomeScreenProps {
  homeView: 'landing' | 'school_select' | 'student_subjects' | 'teacher_subjects';
  userMeta: any;
  userSettings: UserSettings;
  handleSubjectChange: (subject: SubjectConfig) => void;
  setHomeView: (view: 'landing' | 'school_select' | 'student_subjects' | 'teacher_subjects') => void;
  setUserRole: (role: UserRole) => void;
  setShowAdminAuth: (val: boolean) => void;
}

export const WelcomeScreen = ({
  homeView,
  userMeta,
  userSettings,
  handleSubjectChange,
  setHomeView,
  setUserRole,
  setShowAdminAuth
}: WelcomeScreenProps) => {

    return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center relative overflow-x-hidden w-full h-full`}>
      
      {homeView === 'landing' && (
        <div className={`max-w-6xl w-full flex flex-col items-center justify-center min-h-[70vh] relative z-10 ${ZOOM_IN}`}>
          
          <button onClick={() => setShowAdminAuth(true)} className="absolute top-0 right-0 p-3 text-white/20 hover:text-indigo-400 transition-colors">
              <Shield size={18} />
          </button>

          <div className="text-center mb-16 md:mb-24 space-y-6 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
             
             <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg shadow-indigo-500/10">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <span>AI Учебен Асистент 2.0</span>
             </div>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white tracking-tighter leading-[1] font-display drop-shadow-2xl">
              Здравей{userMeta.firstName ? `, ${userMeta.firstName}` : ''}.
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                Твоят интелигентен помощник за училище. <br className="hidden md:block"/>
                <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Какво ще учим днес?</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4">
            {/* General Chat */}
            <button onClick={() => handleSubjectChange(SUBJECTS[0])} className="group relative h-72 md:h-80 rounded-[2.5rem] p-10 text-left bg-gradient-to-br from-[#0a0a0b] to-[#121214] border border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 overflow-hidden hover:border-indigo-500/30">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-indigo-600/20 w-16 h-16 rounded-3xl flex items-center justify-center backdrop-blur-md border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]"><MessageSquare size={32} className="text-indigo-400" /></div>
                  <div>
                      <h3 className="text-4xl font-bold text-white mb-2">Общ Чат</h3>
                      <p className="text-gray-400 text-lg">Попитай каквото и да е.</p>
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm text-white bg-white/10 w-fit px-6 py-3 rounded-full backdrop-blur-md border border-white/10 group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">Старт <ArrowRight size={16} /></div>
               </div>
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </button>

            {/* School Menu Entry */}
            <button onClick={() => setHomeView('school_select')} className="group relative h-72 md:h-80 rounded-[2.5rem] p-10 text-left bg-gradient-to-br from-[#0a0a0b] to-[#121214] border border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 overflow-hidden hover:border-cyan-500/30">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-cyan-600/20 w-16 h-16 rounded-3xl flex items-center justify-center backdrop-blur-md border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]"><School size={32} className="text-cyan-400" /></div>
                  <div>
                      <h3 className="text-4xl font-bold text-white mb-2">Училище</h3>
                      <p className="text-gray-400 text-lg">Ученици и Учители</p>
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm text-white bg-white/10 w-fit px-6 py-3 rounded-full backdrop-blur-md border border-white/10 group-hover:bg-cyan-600 group-hover:border-cyan-500 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">Влез <ArrowRight size={16} /></div>
               </div>
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/20 blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </button>
          </div>

          <footer className="w-full py-8 text-center mt-auto opacity-40 hover:opacity-100 transition-opacity absolute bottom-0">
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                  Created by Vanyo & Svetlyo
              </p>
          </footer>
        </div>
      )}

      {/* School Selection View */}
      {homeView === 'school_select' && (
        <div className={`max-w-5xl w-full flex flex-col items-center justify-center min-h-[70vh] relative z-10 ${SLIDE_UP}`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-4 md:left-0 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"><ArrowLeft size={16}/> Назад</button>
             <h2 className="text-5xl md:text-7xl font-black text-white mb-16 tracking-tighter">Избери Роля</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
                 {/* Student */}
                 <button onClick={() => { setHomeView('student_subjects'); setUserRole('student'); }} className="group relative h-80 rounded-[3rem] p-10 text-left bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/20 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all backdrop-blur-md">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-5 bg-indigo-500 rounded-3xl w-fit shadow-[0_0_40px_rgba(99,102,241,0.4)]"><GraduationCap size={40} className="text-white"/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-white">Ученик</h3><p className="text-indigo-200 font-medium text-lg">Помощ с уроци и задачи.</p></div>
                     </div>
                     <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"/>
                 </button>

                 {/* Teacher */}
                 <button onClick={() => { setHomeView('teacher_subjects'); setUserRole('teacher'); }} className="group relative h-80 rounded-[3rem] p-10 text-left bg-gradient-to-br from-zinc-900/40 to-black border border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all backdrop-blur-md">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-5 bg-zinc-700 rounded-3xl w-fit shadow-[0_0_40px_rgba(255,255,255,0.1)]"><Briefcase size={40} className="text-white"/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-white">Учител</h3><p className="text-gray-400 font-medium text-lg">Тестове, планове и ресурси.</p></div>
                     </div>
                     <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"/>
                 </button>
             </div>
        </div>
      )}

      {/* Subjects Grid */}
      {(homeView === 'student_subjects' || homeView === 'teacher_subjects') && (
        <div className={`max-w-[90rem] w-full py-8 md:py-12 px-4 ${SLIDE_UP} relative z-10`}>
           <button onClick={() => setHomeView('school_select')} className="mb-12 flex items-center gap-3 text-gray-400 hover:text-white transition-colors font-semibold group uppercase text-xs tracking-widest"><div className="p-2 bg-white/5 rounded-full border border-white/10 group-hover:-translate-x-1 transition-transform"><ArrowLeft size={14} /></div> Назад</button>
           
           <div className="mb-12">
               <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{homeView === 'student_subjects' ? 'Ученик' : 'Учител'} <span className="text-indigo-500">.</span></h2>
               <p className="text-gray-400 font-medium text-lg">Избери предмет, за да започнеш.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={getStaggeredDelay(i)} className={`group relative h-56 flex flex-col items-center justify-center text-center p-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 hover:border-indigo-500/40 shadow-lg hover:shadow-[0_0_40px_rgba(79,70,229,0.15)] transition-all duration-300 hover:-translate-y-2 ${FADE_IN}`}>
                   <div className={`w-20 h-20 rounded-3xl ${s.color} text-white flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-white/20`}><DynamicIcon name={s.icon} className="w-10 h-10" /></div>
                   <h3 className="font-bold text-white text-xl mb-1">{s.name}</h3>
                   
                   <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};