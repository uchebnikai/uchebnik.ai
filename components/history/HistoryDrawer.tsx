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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setHistoryDrawerOpen(false)} />
        <div className="relative w-full max-w-sm bg-black/80 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-white/10 backdrop-blur-2xl">
           <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><History size={24} className="text-indigo-400"/> История</h2>
              <button onClick={() => setHistoryDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><X size={20}/></button>
           </div>
           
           <div className="space-y-4">
             {sessions.length === 0 && <p className="text-center text-gray-500 py-10">Няма запазени разговори.</p>}
             {sessions.map(s => (
               <div key={s.id} className={`group p-4 rounded-2xl border transition-all duration-300 ${activeSessionId === s.id ? 'bg-indigo-600/20 border-indigo-500/40 shadow-[0_0_15px_rgba(79,70,229,0.15)]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}`}>
                  {renameSessionId === s.id ? (
                    <div className="flex items-center gap-2">
                       <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-indigo-500/50 outline-none text-sm text-white"/>
                       <button onClick={() => renameSession(s.id, renameValue)} className="p-2 text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"><Check size={14}/></button>
                       <button onClick={() => setRenameSessionId(null)} className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20"><X size={14}/></button>
                    </div>
                  ) : (
                    <div onClick={() => { setActiveSessionId(s.id); setHistoryDrawerOpen(false); if(activeSubject?.id !== s.subjectId) { const sub = SUBJECTS.find(sub => sub.id === s.subjectId); if(sub) setActiveSubject(sub); } }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-sm truncate pr-2 text-gray-200 group-hover:text-white transition-colors">{s.title}</h3>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setRenameSessionId(s.id); setRenameValue(s.title); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={12}/></button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-3">{s.preview}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                         <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/5`}>{SUBJECTS.find(sub => sub.id === s.subjectId)?.name}</span>
                         <span>{new Date(s.lastModified).toLocaleDateString()}</span>
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