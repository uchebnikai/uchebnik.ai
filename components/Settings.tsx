import React, { useRef } from 'react';
import { Settings, X, Palette, LayoutGrid, Brain, Database, Moon, Sun, Lock, Check, Download, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AI_MODELS } from '../constants';
import { Button } from './ui/UI';

export const SettingsModal = () => {
  const { showSettings, setShowSettings, userSettings, setUserSettings, isDarkMode, setIsDarkMode, isProUnlocked, setShowUnlockModal, memoryUsage, handleExportData, handleClearMemory, importInputRef, handleImportData } = useAppContext();
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  if (!showSettings) return null;

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { alert("Изображението е твърде голямо. Моля, изберете файл под 4MB."); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setUserSettings(prev => ({ ...prev, customBackground: reader.result as string })); };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className={`w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${userSettings.customBackground ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl' : 'bg-white/90 dark:bg-black/90 backdrop-blur-2xl'}`}>
              <div className="p-8 border-b border-indigo-500/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                 <h2 className="text-3xl font-bold flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400"><Settings size={28}/></div> Настройки</h2>
                 <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-12">
                 
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Palette size={16}/> Персонализация</h3>
                    <div className="space-y-6">
                        <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-lg">Основен Цвят</span>
                                <span className="text-xs text-gray-500">Избери цвета на бутоните и акцентите</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="color" value={userSettings.themeColor || '#6366f1'} onChange={(e) => setUserSettings({...userSettings, themeColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"/>
                                <button onClick={() => setUserSettings({...userSettings, themeColor: '#6366f1'})} className="text-xs font-bold text-gray-500 hover:text-indigo-500 underline">Възстанови</button>
                            </div>
                        </div>
                        <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1"><span className="font-bold text-lg">Фон</span><span className="text-xs text-gray-500">Качи свое изображение за фон</span></div>
                                <div className="flex gap-2">
                                    <button onClick={() => backgroundInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 dark:bg-white/10 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-white/20 transition-colors">Качи</button>
                                    {userSettings.customBackground && (<button onClick={() => setUserSettings({...userSettings, customBackground: null})} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors">Премахни</button>)}
                                </div>
                                <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
                            </div>
                            {userSettings.customBackground && (<div className="h-32 w-full rounded-2xl overflow-hidden relative border border-gray-200 dark:border-white/10"><img src={userSettings.customBackground} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[2px]">Преглед</div></div>)}
                        </div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutGrid size={16}/> Външен вид</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 hover:border-indigo-500/30 transition-colors"><div className="flex items-center gap-4"><div className="p-3 bg-gray-100 dark:bg-black rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400">{isDarkMode ? <Moon size={22}/> : <Sun size={22}/>}</div><span className="font-bold text-lg">Тъмен режим</span></div><button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-16 h-9 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}><span className={`absolute top-1 left-1 bg-white w-7 h-7 rounded-full transition-transform shadow-sm ${isDarkMode ? 'translate-x-7' : ''}`}/></button></div>
                       <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 flex flex-col gap-3"><span className="font-bold text-lg">Размер на текста</span><div className="flex bg-gray-50 dark:bg-black p-1.5 rounded-2xl shadow-inner">{['small', 'normal', 'large'].map(s => (<button key={s} onClick={() => setUserSettings({...userSettings, textSize: s as any})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${userSettings.textSize === s ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{s === 'small' ? 'A' : s === 'normal' ? 'AA' : 'AAA'}</button>))}</div></div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Brain size={16}/> AI Персонализация</h3>
                    <div className="space-y-6">
                        <div className="p-2 bg-white dark:bg-white/5 rounded-2xl border border-indigo-500/20">
                           <input type="text" value={userSettings.userName} onChange={e => setUserSettings({...userSettings, userName: e.target.value})} placeholder="Как да те наричам?" className="w-full p-4 bg-transparent outline-none font-bold text-xl text-center placeholder-gray-300 dark:placeholder-gray-600 text-zinc-900 dark:text-white"/>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           {AI_MODELS.map(m => {
                             const isLocked = m.id === 'gemini-3-pro-preview' && !isProUnlocked;
                             return (
                               <button key={m.id} onClick={() => { if (isLocked) setShowUnlockModal(true); else setUserSettings({...userSettings, preferredModel: m.id as any}); }} className={`p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] relative overflow-hidden group/model ${userSettings.preferredModel === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10'} ${isLocked ? 'opacity-60 cursor-pointer border-dashed border-gray-400 dark:border-gray-600' : ''}`}>
                                 <div className="font-bold text-sm mb-2 flex items-center justify-between">{m.name}{isLocked && <Lock size={14} className="text-gray-400 group-hover/model:text-red-400 transition-colors"/>}{!isLocked && userSettings.preferredModel === m.id && <Check size={14} className="text-white"/>}</div>
                                 <div className={`text-[11px] leading-tight ${userSettings.preferredModel === m.id ? 'opacity-90' : 'text-gray-400'}`}>{isLocked ? (<><span className="group-hover/model:hidden">{m.description}</span><span className="hidden group-hover/model:block text-indigo-500 font-bold">Кликнете, за да отключите</span></>) : (m.description)}</div>
                               </button>
                             );
                           })}
                        </div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16}/> Данни & Памет</h3>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-indigo-500/20 space-y-6">
                        <div className="space-y-2"><div className="flex justify-between text-xs font-bold text-gray-500"><span>Заета памет (текущ чат)</span><span>{Math.round((memoryUsage/50000)*100)}%</span></div><div className="h-4 bg-gray-100 dark:bg-black rounded-full overflow-hidden"><div style={{width: `${Math.min((memoryUsage/50000)*100, 100)}%`}} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000 ease-out"/></div></div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Button variant="secondary" onClick={handleExportData} icon={Download} className="text-xs py-4">Архивирай</Button>
                            <Button variant="secondary" onClick={() => importInputRef.current?.click()} icon={Upload} className="text-xs py-4">Възстанови</Button>
                            <input type="file" ref={importInputRef} onChange={handleImportData} className="hidden" accept=".json"/>
                        </div>
                        <Button variant="secondary" onClick={handleClearMemory} className="w-full text-xs py-4 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30">Изчисти текущия чат</Button>
                    </div>
                 </section>
              </div>
           </div>
        </div>
  );
};