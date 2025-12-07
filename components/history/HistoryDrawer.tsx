import React from 'react';
import { History, X, Check, Edit2, Trash2 } from 'lucide-react';
import { Session, SubjectConfig } from '../../types';
import { SUBJECTS } from '../../constants';

interface HistoryDrawerProps {
  historyDrawerOpen: boolean;
  setHistoryDrawerOpen: (val: boolean) => void;
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (val: string | null) => void;
  renameSessionId: string | null;
  setRenameSessionId: (val: string | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  activeSubject: SubjectConfig | null;
  setActiveSubject: (subject: SubjectConfig) => void;
}

export const HistoryDrawer = ({
  historyDrawerOpen,
  setHistoryDrawerOpen,
  sessions,
  activeSessionId,
  setActiveSessionId,
  renameSessionId,
  setRenameSessionId,
  renameValue,
  setRenameValue,
  renameSession,
  deleteSession,
  activeSubject,
  setActiveSubject
}: HistoryDrawerProps) => {
    
    if (!historyDrawerOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setHistoryDrawerOpen(false)} />
        <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-indigo-500/20 backdrop-blur-3xl">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><History size={24} className="text-indigo-500"/> История</h2>
              <button onClick={() => setHistoryDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
           </div>
           
           <div className="space-y-4">
             {sessions.length === 0 && <p className="text-center text-gray-400 py-10">Няма запазени разговори.</p>}
             {sessions.map(s => (
               <div key={s.id} className={`group p-4 rounded-2xl border transition-all ${activeSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/20'}`}>
                  {renameSessionId === s.id ? (
                    <div className="flex items-center gap-2">
                       <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} className="flex-1 bg-white dark:bg-black px-2 py-1 rounded border border-indigo-300 outline-none text-sm"/>
                       <button onClick={() => renameSession(s.id, renameValue)} className="p-1.5 text-green-600 bg-green-50 rounded-lg"><Check size={14}/></button>
                       <button onClick={() => setRenameSessionId(null)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><X size={14}/></button>
                    </div>
                  ) : (
                    <div onClick={() => { setActiveSessionId(s.id); setHistoryDrawerOpen(false); if(activeSubject?.id !== s.subjectId) { const sub = SUBJECTS.find(sub => sub.id === s.subjectId); if(sub) setActiveSubject(sub); } }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-sm truncate pr-2 text-zinc-800 dark:text-zinc-200">{s.title}</h3>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setRenameSessionId(s.id); setRenameValue(s.title); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Trash2 size={12}/></button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-2">{s.preview}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                         <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10`}>{SUBJECTS.find(sub => sub.id === s.subjectId)?.name}</span>
                         <span>{new Date(s.lastModified).toLocaleDateString()}</span>
                         {s.role && <span className={`px-2 py-0.5 rounded-full ${s.role === 'student' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>{s.role === 'student' ? 'Ученик' : 'Учител'}</span>}
                      </div>
                    </div>
                  )}
               </div>
             ))}
           </div>
        </div>
      </div>
    );
};