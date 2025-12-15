
import React from 'react';
import { Shield, X, Copy, CheckCircle, Key } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminPanelProps {
  showAdminAuth: boolean;
  setShowAdminAuth: (val: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (val: string) => void;
  handleAdminLogin: () => void;
  generateKey: () => void;
  generatedKeys: { code: string; isUsed: boolean }[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminPanel = ({
  showAdminAuth,
  setShowAdminAuth,
  showAdminPanel,
  setShowAdminPanel,
  adminPasswordInput,
  setAdminPasswordInput,
  handleAdminLogin,
  generateKey,
  generatedKeys,
  addToast
}: AdminPanelProps) => {
    
    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500"><Shield size={32}/></div>
                <h2 className="text-xl font-bold">Админ Панел</h2>
             </div>
             <input 
               type="password" 
               value={adminPasswordInput}
               onChange={e => setAdminPasswordInput(e.target.value)}
               placeholder="Въведете парола"
               className="w-full bg-white/50 dark:bg-black/40 p-3 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold"
               autoFocus
             />
             <Button onClick={handleAdminLogin} className="w-full py-3">Вход</Button>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full max-w-lg p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center pb-4 border-b border-indigo-500/10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500"/> Админ Панел</h2>
                <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Генерирай нов Premium ключ за достъп до Gemini 3.0 Pro.</p>
                <Button onClick={generateKey} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" icon={Key}>Генерирай Ключ</Button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-black/40 rounded-xl p-4 space-y-2 min-h-[200px]">
                {generatedKeys.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">Няма генерирани ключове</p>
                ) : (
                  generatedKeys.map((keyObj, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 bg-white/60 dark:bg-zinc-800/60 rounded-lg border animate-in slide-in-from-top-2 border-indigo-500/10`}>
                       <div className="flex flex-col">
                         <code className={`font-mono font-bold text-indigo-500`}>{keyObj.code}</code>
                         <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 text-emerald-500`}>
                            <CheckCircle size={10}/> Генериран
                         </span>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(keyObj.code); addToast('Копирано!', 'success'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Copy size={16}/></button>
                    </div>
                  ))
                )}
             </div>
             
             <Button variant="ghost" onClick={() => setShowAdminPanel(false)} className="w-full">Затвори</Button>
           </div>
        </div>
      );
    }

    return null;
};
