import React, { useState } from 'react';
import { X, Shield, Key, CheckCircle, Copy, Lock, History, Edit2, Trash2, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/UI';
import { SUBJECTS } from '../constants';

const SECRET_SALT = "UCH_2025_SECURE_SALT_VS";
const generateChecksum = (core: string): string => {
  let hash = 0; const str = core + SECRET_SALT;
  for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
};
const isValidKey = (key: string): boolean => {
  if (key === "UCH-PRO-2025") return true;
  const parts = key.split('-'); if (parts.length !== 3 || parts[0] !== 'UCH') return false;
  return generateChecksum(parts[1]) === parts[2];
};

export const AdminPanel = () => {
  const { showAdminAuth, setShowAdminAuth, showAdminPanel, setShowAdminPanel, generatedKeys, setGeneratedKeys } = useAppContext();
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => { if (password === "VS09091615!") { setShowAdminAuth(false); setShowAdminPanel(true); setPassword(''); } else alert("Грешна парола!"); };
  const generateKey = () => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newKeyCode = `UCH-${randomCore}-${generateChecksum(randomCore)}`;
    const updatedKeys = [{ code: newKeyCode, isUsed: false }, ...generatedKeys];
    setGeneratedKeys(updatedKeys); localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
  };

  if (showAdminAuth) return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4"><div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500"><Shield size={32}/></div><h2 className="text-xl font-bold">Админ Панел</h2></div>
             <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Въведете парола" className="w-full bg-gray-100 dark:bg-black p-3 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold" autoFocus/>
             <Button onClick={handleAdminLogin} className="w-full py-3">Вход</Button>
          </div>
        </div>
  );

  if (showAdminPanel) return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center pb-4 border-b border-indigo-500/10"><h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500"/> Админ Панел</h2><button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white"><X size={20}/></button></div>
             <div className="space-y-4"><p className="text-sm text-gray-500">Генерирай нов Premium ключ за достъп до Gemini 3.0 Pro.</p><Button onClick={generateKey} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" icon={Key}>Генерирай Ключ</Button></div>
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/40 rounded-xl p-4 space-y-2 min-h-[200px]">
                {generatedKeys.length === 0 ? <p className="text-center text-gray-500 text-sm py-10">Няма генерирани ключове</p> : generatedKeys.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border animate-in slide-in-from-top-2 border-indigo-500/10"><div className="flex flex-col"><code className="font-mono font-bold text-indigo-500">{k.code}</code><span className="text-[10px] font-bold mt-1 flex items-center gap-1 text-emerald-500"><CheckCircle size={10}/> Генериран</span></div><button onClick={() => { navigator.clipboard.writeText(k.code); alert('Копирано!'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Copy size={16}/></button></div>
                ))}
             </div>
             <Button variant="ghost" onClick={() => setShowAdminPanel(false)} className="w-full">Затвори</Button>
           </div>
        </div>
  );
  return null;
};

export const UnlockModal = () => {
  const { showUnlockModal, setShowUnlockModal, setIsProUnlocked, setUserSettings } = useAppContext();
  const [key, setKey] = useState('');

  const handleSubmit = () => {
    if (isValidKey(key.trim())) { setIsProUnlocked(true); localStorage.setItem('uchebnik_pro_status', 'unlocked'); setUserSettings(prev => ({ ...prev, preferredModel: 'gemini-3-pro-preview' })); setShowUnlockModal(false); setKey(''); alert("Успешно отключихте Gemini 3.0 Pro!"); } else alert("Невалиден ключ.");
  };

  if (!showUnlockModal) return null;
  return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
          <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
          <div className="flex flex-col items-center gap-4 text-center"><div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500 shadow-lg shadow-indigo-500/20"><Lock size={32}/></div><div><h2 className="text-xl font-bold">Отключи Pro</h2><p className="text-sm text-gray-500 mt-1">Въведете вашия продуктов ключ.</p></div></div>
          <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="Въведете Ключ" className="w-full bg-gray-100 dark:bg-black p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider" autoFocus/>
          <Button onClick={handleSubmit} className="w-full py-4 text-base shadow-indigo-500/30">Отключи</Button>
        </div>
      </div>
  );
};

export const HistoryDrawer = () => {
  const { historyDrawerOpen, setHistoryDrawerOpen, sessions, activeSessionId, setActiveSessionId, setActiveSubject, renameSession, deleteSession } = useAppContext();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  if (!historyDrawerOpen) return null;
  return (
      <div className="fixed inset-0 z-[60] flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setHistoryDrawerOpen(false)} />
        <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-indigo-500/20 backdrop-blur-3xl">
           <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold flex items-center gap-2"><History size={24} className="text-indigo-500"/> История</h2><button onClick={() => setHistoryDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button></div>
           <div className="space-y-4">
             {sessions.length === 0 && <p className="text-center text-gray-400 py-10">Няма запазени разговори.</p>}
             {sessions.map(s => (
               <div key={s.id} className={`group p-4 rounded-2xl border transition-all ${activeSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/20'}`}>
                  {renameId === s.id ? (
                    <div className="flex items-center gap-2"><input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} className="flex-1 bg-white dark:bg-black px-2 py-1 rounded border border-indigo-300 outline-none text-sm"/><button onClick={() => { renameSession(s.id, renameVal); setRenameId(null); }} className="p-1.5 text-green-600 bg-green-50 rounded-lg"><Check size={14}/></button><button onClick={() => setRenameId(null)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><X size={14}/></button></div>
                  ) : (
                    <div onClick={() => { setActiveSessionId(s.id); setHistoryDrawerOpen(false); setActiveSubject(SUBJECTS.find(sub => sub.id === s.subjectId) || null); }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1"><h3 className="font-bold text-sm truncate pr-2 text-zinc-800 dark:text-zinc-200">{s.title}</h3><div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1"><button onClick={(e) => { e.stopPropagation(); setRenameId(s.id); setRenameVal(s.title); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500"><Edit2 size={12}/></button><button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Trash2 size={12}/></button></div></div>
                      <p className="text-xs text-gray-400 truncate mb-2">{s.preview}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium"><span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10`}>{SUBJECTS.find(sub => sub.id === s.subjectId)?.name}</span><span>{new Date(s.lastModified).toLocaleDateString()}</span></div>
                    </div>
                  )}
               </div>
             ))}
           </div>
        </div>
      </div>
  );
};