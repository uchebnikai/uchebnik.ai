
import React, { useRef } from 'react';
import { X, User, Upload, Lock, Check, Palette, Plus, Moon, Sun, ImageIcon, Edit2, Cpu, ChevronDown, Database, Trash2, ArrowRight, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserSettings } from '../../types';
import { AI_MODELS } from '../../constants';
import { INPUT_SETTINGS } from '../../styles/ui';
import { getDynamicColorStyle } from '../../styles/theme';
import { MODAL_ENTER } from '../../animations/transitions';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  userMeta: any;
  editProfile: any;
  setEditProfile: (val: any) => void;
  handleUpdateAccount: () => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userSettings: UserSettings;
  setUserSettings: (val: any) => void;
  isPremium: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  handleBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearMemory: () => void;
}

export const SettingsModal = ({
  showSettings,
  setShowSettings,
  userMeta,
  editProfile,
  setEditProfile,
  handleUpdateAccount,
  handleAvatarUpload,
  userSettings,
  setUserSettings,
  isPremium,
  isDarkMode,
  setIsDarkMode,
  handleBackgroundUpload,
  handleClearMemory
}: SettingsModalProps) => {
    
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  if (!showSettings) return null;

  return (
  <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className={`bg-white/70 dark:bg-black/70 backdrop-blur-2xl w-full max-w-2xl h-[85vh] rounded-[32px] border border-white/20 shadow-2xl overflow-hidden flex flex-col ${MODAL_ENTER}`}>
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center bg-white/20 dark:bg-white/5 backdrop-blur-sm sticky top-0 z-10">
         <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-800 dark:text-white font-display">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Settings size={24}/></div>
                Настройки
            </h2>
            <p className="text-sm text-gray-500 font-medium ml-1">Управлявай своя профил и предпочитания</p>
         </div>
         <button onClick={() => setShowSettings(false)} className="p-2.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-zinc-900 dark:hover:text-white"><X size={24}/></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
          
          {/* Account */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <User size={18} className="text-indigo-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Профил</h3>
             </div>
             
             <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-colors">
                            <img src={editProfile.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} className="w-full h-full rounded-full object-cover bg-gray-100"/>
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={20} className="text-white"/>
                        </div>
                    </div>
                    <button onClick={() => avatarInputRef.current?.click()} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">Промени снимка</button>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </div>

                {/* Fields */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Име</label>
                        <input value={editProfile.firstName} onChange={e => setEditProfile({...editProfile, firstName: e.target.value})} className={INPUT_SETTINGS}/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Фамилия</label>
                        <input value={editProfile.lastName} onChange={e => setEditProfile({...editProfile, lastName: e.target.value})} className={INPUT_SETTINGS}/>
                    </div>
                    <div className="col-span-full space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Имейл</label>
                        <input value={editProfile.email} onChange={e => setEditProfile({...editProfile, email: e.target.value})} className={INPUT_SETTINGS}/>
                    </div>
                    
                    <div className="col-span-full pt-4 border-t border-gray-100 dark:border-white/5 mt-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-1 flex items-center gap-2"><Lock size={14}/> Сигурност</h4>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">Въведете текущата парола, за да запазите промени по имейл или парола.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">Текуща Парола</label>
                                <input type="password" value={editProfile.currentPassword} onChange={e => setEditProfile({...editProfile, currentPassword: e.target.value})} className={INPUT_SETTINGS}/>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">Нова Парола</label>
                                <input type="password" value={editProfile.password} onChange={e => setEditProfile({...editProfile, password: e.target.value})} placeholder="Непроменена" className={INPUT_SETTINGS}/>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             <div className="flex justify-end pt-4">
                 <Button onClick={handleUpdateAccount} className="px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20" icon={Check}>Запази Промените</Button>
             </div>
          </section>

          {/* Personalization */}
          <section className="space-y-6 relative">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Palette size={18} className="text-pink-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Персонализация</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Color */}
                <div className={`bg-white/30 dark:bg-white/5 p-5 rounded-2xl border border-white/20 dark:border-white/10 space-y-4 relative ${!isPremium ? 'opacity-80' : ''}`}>
                    <label className="text-sm font-bold flex items-center gap-2">Основен Цвят</label>
                    <div className={`flex flex-wrap gap-3 ${!isPremium ? 'pointer-events-none' : ''}`}>
                        {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(c => (
                            <button key={c} onClick={() => setUserSettings((prev: any) => ({...prev, themeColor: c}))} className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center ${userSettings.themeColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 dark:ring-offset-zinc-900' : 'hover:scale-105'}`} style={getDynamicColorStyle(c)}>
                                {userSettings.themeColor === c && <Check size={16} className="text-white drop-shadow-md"/>}
                            </button>
                        ))}
                         <div className="relative">
                             <input type="color" value={userSettings.themeColor} onChange={e => setUserSettings((prev: any) => ({...prev, themeColor: e.target.value}))} className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer z-10"/>
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400"><Plus size={18}/></div>
                         </div>
                    </div>
                    {!isPremium && (
                        <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                            <div className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Lock size={12}/> Plus/Pro
                            </div>
                        </div>
                    )}
                </div>

                 {/* Dark Mode - Always Free */}
                <div className="bg-white/30 dark:bg-white/5 p-5 rounded-2xl border border-white/20 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold flex items-center gap-2 mb-1">{isDarkMode ? <Moon size={16} className="text-indigo-400"/> : <Sun size={16} className="text-amber-500"/>} Режим</div>
                        <div className="text-xs text-gray-500">{isDarkMode ? 'Тъмна тема' : 'Светла тема'}</div>
                    </div>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Background */}
                <div className={`col-span-full bg-white/30 dark:bg-white/5 p-5 rounded-2xl border border-white/20 dark:border-white/10 space-y-4 relative ${!isPremium ? 'opacity-80' : ''}`}>
                     <div className="flex justify-between items-center">
                        <label className="text-sm font-bold flex items-center gap-2"><ImageIcon size={16}/> Фон на чата</label>
                        {userSettings.customBackground && isPremium && <button onClick={() => setUserSettings((prev: any) => ({...prev, customBackground: null}))} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">Премахни</button>}
                     </div>
                     
                     <div className={`h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden group bg-white/50 dark:bg-black/20 ${!isPremium ? 'pointer-events-none' : ''}`} onClick={() => isPremium && backgroundInputRef.current?.click()}>
                         {userSettings.customBackground ? (
                             <>
                                <img src={userSettings.customBackground} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold flex items-center gap-2"><Edit2 size={16}/> Промени</span>
                                </div>
                             </>
                         ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                 <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full"><Upload size={24}/></div>
                                 <div className="text-center">
                                     <span className="text-sm font-bold block">Качи изображение</span>
                                     <span className="text-xs opacity-70">JPG, PNG до 5MB</span>
                                 </div>
                             </div>
                         )}
                         <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*"/>
                     </div>
                     {!isPremium && (
                        <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                             <div className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Lock size={12}/> Plus/Pro
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </section>

          {/* AI Settings */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Cpu size={18} className="text-emerald-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">AI Настройки</h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                     { label: 'Клас / Ниво', key: 'gradeLevel', options: [['1-4', '1-4 клас'], ['5-7', '5-7 клас'], ['8-12', '8-12 клас'], ['university', 'Студент']] },
                     { label: 'Размер на текста', key: 'textSize', options: [['small', 'Малък'], ['normal', 'Нормален'], ['large', 'Голям']] },
                     { label: 'Дължина на отговора', key: 'responseLength', options: [['concise', 'Кратък'], ['detailed', 'Подробен']] },
                 ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">{field.label}</label>
                        <div className="relative">
                            <select value={(userSettings as any)[field.key]} onChange={e => setUserSettings({...userSettings, [field.key]: e.target.value as any})} className={INPUT_SETTINGS}>
                               {field.options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                 ))}
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">AI Модел</label>
                    <div className="relative">
                        <select value={userSettings.preferredModel} onChange={e => setUserSettings({...userSettings, preferredModel: e.target.value as any})} className={INPUT_SETTINGS}>
                           {AI_MODELS.map(m => (
                               <option key={m.id} value={m.id}>
                                   {m.name}
                               </option>
                           ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    </div>
                 </div>
             </div>
          </section>

          {/* Data */}
          <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Database size={18} className="text-amber-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Данни</h3>
             </div>
             
             <div className="bg-white/30 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                 <button onClick={handleClearMemory} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group text-left">
                     <div className="flex items-center gap-4">
                         <div className="p-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl"><Trash2 size={18}/></div>
                         <div>
                             <div className="text-sm font-bold text-red-600 dark:text-red-400">Изчисти паметта</div>
                             <div className="text-xs text-red-400/70">Изтрий всички съобщения в текущия чат</div>
                         </div>
                     </div>
                     <ArrowRight size={18} className="text-red-300 group-hover:text-red-500 transition-colors"/>
                </button>
             </div>
          </section>

      </div>
    </div>
  </div>
  );
};