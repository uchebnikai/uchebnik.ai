
import React, { useRef, useState } from 'react';
import { 
  X, User, Upload, Lock, Check, Palette, Plus, Moon, Sun, 
  ImageIcon, Edit2, Cpu, ChevronDown, Database, Trash2, 
  ArrowRight, Settings, CreditCard, Loader2, Globe, 
  Layout, Smartphone, Monitor, Sparkles, LogOut, Volume2, 
  Keyboard, Type, Download, Zap, Brain, MessageCircle, Gift, Copy,
  Eye, EyeOff, Shield, Activity, HelpCircle, BookOpen, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserSettings, UserPlan } from '../../types';
import { getDynamicColorStyle } from '../../styles/theme';
import { MODAL_ENTER, FADE_IN, SLIDE_UP } from '../../animations/transitions';
import { supabase } from '../../supabaseClient';
import { LANGUAGES, t } from '../../utils/translations';
import { VOICES } from '../../constants';

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
  handleBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAllChats: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  userPlan: UserPlan;
}

type SettingsTab = 'account' | 'appearance' | 'ai' | 'system' | 'data';

const PRESET_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6'];

const PRESET_BACKGROUNDS = [
  "https://applescoop.org/image/wallpapers/mac/anime-cartoon-style-mountains-digital-art-crescent-waterfall-2025-best-ultra-hd-high-resolution-4k-desktop-backgrounds-wallpapers-for-mac-linux-and-windows-pc-11-03-2025-1741731277-hd-wallpaper.jpeg",
  "https://i.pinimg.com/originals/a0/2d/03/a02d03a01afa19720a22cc3dbc17407e.jpg",
  "https://wallpapercat.com/w/full/5/c/0/2117697-3840x2160-desktop-4k-dark-wallpaper.jpg",
  "https://www.pixelstalk.net/wp-content/uploads/2025/07/Anime-Hello-Kitty-backgrounds-designed-for-fans-of-the-beloved-character.jpg",
  "https://i.ibb.co/67HHXjjx/924e9515a89877de9a879ad812e7362e.gif",
  "https://i.pinimg.com/originals/21/b6/9f/21b69fbf3c3762775fd6878971633329.gif"
];

const CUSTOM_PERSONAS = [
    { label: "🤓 Albert Einstein", prompt: "Act like Albert Einstein. Be eccentric, brilliant, and use physics analogies." },
    { label: "🏴‍☠️ Pirate", prompt: "Talk like a pirate! Use words like 'matey', 'ahoy', and 'treasure'. Be adventurous." },
    { label: " Rapper", prompt: "Speak in rhymes and flow like a rapper. Keep it cool and rhythmic." },
    { label: " Grandma", prompt: "Act like a sweet, caring grandmother. Call the user 'dear' and offer cookies (virtually)." },
    { label: "💻 Senior Dev", prompt: "Act like a grumpy but helpful Senior Developer. Be concise, technical, and slightly sarcastic." }
];

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
  handleBackgroundUpload,
  handleDeleteAllChats,
  addToast,
  userPlan
}: SettingsModalProps) => {
    
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isCustomColor = !PRESET_COLORS.includes(userSettings.themeColor);
  const isCustomBackground = userSettings.customBackground && !PRESET_BACKGROUNDS.includes(userSettings.customBackground);

  const handleExportData = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "uchebnik_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast("Данните са експортирани успешно.", "success");
  };

  if (!showSettings) return null;

  const tabs = [
    { id: 'account', label: t('profile', userSettings.language), icon: User },
    { id: 'appearance', label: t('personalization', userSettings.language), icon: Palette },
    { id: 'ai', label: t('ai_settings', userSettings.language), icon: Sparkles },
    { id: 'system', label: 'Система', icon: Smartphone },
    { id: 'data', label: t('data', userSettings.language), icon: Database },
  ];

  const isPro = userPlan === 'pro';
  const currentLang = LANGUAGES.find(l => l.code === userSettings.language) || LANGUAGES[0];
  const isDarkMode = userSettings.isDarkMode;

  const SettingGroup = ({ title, icon: Icon, children, premiumOnly = false }: any) => (
      <div className={`space-y-4 ${premiumOnly && !isPremium ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                  {Icon && <Icon size={16} className="text-indigo-500" />}
                  <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">{title}</h4>
              </div>
              {premiumOnly && !isPremium && (
                  <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20">Pro Only</span>
              )}
          </div>
          <div className="bg-white/50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 shadow-sm backdrop-blur-sm">
              {children}
          </div>
      </div>
  );

  return (
  <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
    <div className={`bg-[#f8fafc] dark:bg-[#09090b] w-full max-w-6xl h-full md:h-[85vh] rounded-none md:rounded-[40px] border-none md:border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row ${MODAL_ENTER}`}>
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-white/40 dark:bg-black/40 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/5 flex flex-col backdrop-blur-3xl shrink-0">
         <div className="p-8 pb-4 md:pb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Settings size={22} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
                    {t('settings', userSettings.language)}
                </h2>
            </div>
            <button onClick={() => setShowSettings(false)} className="md:hidden p-2.5 bg-black/5 dark:bg-white/5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={24}/></button>
         </div>

         <div className="flex md:flex-col overflow-x-auto md:overflow-visible px-4 md:px-4 gap-2 md:gap-1.5 pb-6 md:pb-0 no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal group relative overflow-hidden ${
                        activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <tab.icon size={20} className={`shrink-0 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-zinc-400 group-hover:text-indigo-500'}`} />
                    <span className="relative z-10">{tab.label}</span>
                    {activeTab === tab.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/20 rounded-l-full" />}
                </button>
            ))}
         </div>

         <div className="mt-auto p-8 hidden md:block border-t border-zinc-200 dark:border-white/5">
             <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-black text-xs">AI</div>
                <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Software</div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">v1.9 Stable</div>
                </div>
             </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
          
          <button onClick={() => setShowSettings(false)} className="hidden md:block absolute top-8 right-8 p-3 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-2xl text-zinc-500 dark:text-zinc-400 transition-all hover:scale-110 active:scale-95 z-50 shadow-sm border border-white/5">
              <X size={24} strokeWidth={2.5}/>
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 pb-32">
              
              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                  <div className={`space-y-10 max-w-3xl mx-auto ${FADE_IN}`}>
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 pb-4 border-b border-zinc-200 dark:border-white/10">
                          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                              <div className="w-32 h-32 rounded-[2.5rem] p-1.5 border-4 border-white dark:border-zinc-800 shadow-2xl relative bg-zinc-100 dark:bg-zinc-800 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                  <img src={editProfile.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} className="w-full h-full rounded-[2rem] object-cover"/>
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                      <Upload size={24} className="text-white mb-1"/>
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Промени</span>
                                  </div>
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-[#f8fafc] dark:border-[#09090b] z-20">
                                <Edit2 size={16} />
                              </div>
                              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                          </div>
                          <div className="flex-1 text-center md:text-left space-y-1">
                              <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{t('profile', userSettings.language)}</h3>
                              <p className="text-zinc-500 font-medium">{t('email', userSettings.language)}: {editProfile.email}</p>
                              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20">{userPlan} Plan</span>
                                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/20">Level {userSettings.level}</span>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SettingGroup title="Лична информация" icon={User}>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('first_name', userSettings.language)}</label>
                                        <input value={editProfile.firstName} onChange={e => setEditProfile({...editProfile, firstName: e.target.value})} className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('last_name', userSettings.language)}</label>
                                        <input value={editProfile.lastName} onChange={e => setEditProfile({...editProfile, lastName: e.target.value})} className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner"/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('email', userSettings.language)}</label>
                                    <input value={editProfile.email} onChange={e => setEditProfile({...editProfile, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner"/>
                                </div>
                              </div>
                          </SettingGroup>

                          <SettingGroup title="Сигурност" icon={Lock}>
                              <div className="space-y-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('current_password', userSettings.language)}</label>
                                      <div className="relative">
                                          <input 
                                            type={showCurrentPassword ? "text" : "password"} 
                                            value={editProfile.currentPassword} 
                                            onChange={e => setEditProfile({...editProfile, currentPassword: e.target.value})} 
                                            className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3.5 pr-12 outline-none focus:border-indigo-500 transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner" 
                                            placeholder="••••••••"
                                          />
                                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none">
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                          </button>
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('new_password', userSettings.language)}</label>
                                      <div className="relative">
                                          <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={editProfile.password} 
                                            onChange={e => setEditProfile({...editProfile, password: e.target.value})} 
                                            className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3.5 pr-12 outline-none focus:border-indigo-500 transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner" 
                                            placeholder="••••••••"
                                          />
                                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none">
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </SettingGroup>
                      </div>

                      <div className="flex items-center justify-between p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[32px] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
                               <div className="space-y-2">
                                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider">Вашият Абонамент</div>
                                   <h4 className="text-3xl font-black">{userPlan.toUpperCase()} Plan</h4>
                                   {userSettings.proExpiresAt && (
                                       <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold">
                                           <Activity size={14} /> Изтича на {new Date(userSettings.proExpiresAt).toLocaleDateString()}
                                       </div>
                                   )}
                               </div>
                               <button disabled className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all opacity-80 cursor-not-allowed">
                                   Управление
                               </button>
                           </div>
                           <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"/>
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                          <button onClick={() => setShowSettings(false)} className="px-8 py-4 rounded-2xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Отказ</button>
                          <Button onClick={handleUpdateAccount} className="px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/20 text-base" icon={Check}>{t('save_changes', userSettings.language)}</Button>
                      </div>
                  </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                  <div className={`space-y-10 max-w-3xl mx-auto ${FADE_IN}`}>
                      <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{t('personalization', userSettings.language)}</h3>
                          <p className="text-zinc-500 font-medium">Персонализирайте визуалното усещане на Uchebnik AI.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SettingGroup title="Локализация" icon={Globe}>
                              <div className="space-y-4">
                                  <p className="text-xs text-zinc-500 font-medium px-1">Изберете език за интерфейса и AI отговорите.</p>
                                  <div className="relative">
                                      <button 
                                        onClick={() => setIsLangOpen(!isLangOpen)}
                                        className="w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none transition-all shadow-inner group"
                                      >
                                          <div className="flex items-center gap-4">
                                              <div className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5">
                                                <img src={`https://flagcdn.com/w40/${currentLang.countryCode}.png`} className="w-8 h-6 object-cover rounded-sm"/>
                                              </div>
                                              <span className="font-bold text-zinc-800 dark:text-zinc-100">{currentLang.label}</span>
                                          </div>
                                          <ChevronDown size={20} className={`text-zinc-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`}/>
                                      </button>
                                      
                                      {isLangOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[28px] shadow-2xl max-h-80 overflow-y-auto custom-scrollbar z-[100] animate-in slide-in-from-top-4 p-3 grid grid-cols-1 gap-1">
                                            {LANGUAGES.map(lang => (
                                                <button 
                                                    key={lang.code}
                                                    onClick={() => { setUserSettings((prev: any) => ({...prev, language: lang.code})); setIsLangOpen(false); }}
                                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-all ${userSettings.language === lang.code ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 font-bold'}`}
                                                >
                                                    <img src={`https://flagcdn.com/w40/${lang.countryCode}.png`} className="w-6 h-4 object-cover rounded shadow-sm" />
                                                    <span className="flex-1 text-left">{lang.label}</span>
                                                    {userSettings.language === lang.code && <Check size={18} strokeWidth={3}/>}
                                                </button>
                                            ))}
                                        </div>
                                      )}
                                      {isLangOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsLangOpen(false)} />}
                                  </div>
                              </div>
                          </SettingGroup>

                          <SettingGroup title="Режим на екрана" icon={isDarkMode ? Moon : Sun}>
                               <div className="space-y-4">
                                   <p className="text-xs text-zinc-500 font-medium px-1">Изберете между светла и тъмна тема.</p>
                                   <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner">
                                       <button onClick={() => setUserSettings({...userSettings, isDarkMode: false})} className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${!isDarkMode ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-md font-black' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold'}`}>
                                           <Sun size={24} strokeWidth={!isDarkMode ? 2.5 : 2} />
                                           <span className="text-[10px] uppercase tracking-widest">Светъл</span>
                                       </button>
                                       <button onClick={() => setUserSettings({...userSettings, isDarkMode: true})} className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${isDarkMode ? 'bg-white dark:bg-zinc-800 text-indigo-500 shadow-md font-black' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold'}`}>
                                           <Moon size={24} strokeWidth={isDarkMode ? 2.5 : 2} />
                                           <span className="text-[10px] uppercase tracking-widest">Тъмен</span>
                                       </button>
                                   </div>
                               </div>
                          </SettingGroup>
                      </div>

                      <SettingGroup title="Цветови акценти" icon={Palette} premiumOnly>
                          <div className="space-y-6">
                              <p className="text-xs text-zinc-500 font-medium px-1">Променете основния цвят на интерфейса.</p>
                              <div className="flex flex-wrap gap-4">
                                  {PRESET_COLORS.map(c => (
                                      <button 
                                        key={c} 
                                        onClick={() => setUserSettings((prev: any) => ({...prev, themeColor: c}))} 
                                        className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center relative overflow-hidden group ${userSettings.themeColor === c ? 'ring-4 ring-offset-4 ring-indigo-600 dark:ring-offset-zinc-900 scale-110' : 'hover:scale-105 active:scale-95'}`} 
                                        style={getDynamicColorStyle(c)}
                                      >
                                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          {userSettings.themeColor === c && (
                                              <div className="bg-white text-zinc-900 rounded-full p-1 shadow-2xl animate-in zoom-in duration-300">
                                                  <Check size={18} strokeWidth={3}/>
                                              </div>
                                          )}
                                      </button>
                                  ))}

                                  <div className="relative group">
                                      <input type="color" value={userSettings.themeColor} onChange={(e) => setUserSettings((prev: any) => ({...prev, themeColor: e.target.value}))} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20" />
                                      <div className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center relative overflow-hidden border-4 border-dashed ${isCustomColor ? 'ring-4 ring-offset-4 ring-indigo-600 dark:ring-offset-zinc-900 scale-110' : 'border-zinc-300 dark:border-white/20 hover:border-indigo-600'}`} style={isCustomColor ? { backgroundColor: userSettings.themeColor } : {}}>
                                          {isCustomColor ? (
                                              <div className="bg-white text-zinc-900 rounded-full p-1 shadow-2xl"><Check size={18} strokeWidth={3}/></div>
                                          ) : (
                                              <Plus size={24} className="text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </SettingGroup>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SettingGroup title="Шрифтове" icon={Type} premiumOnly>
                              <div className="grid grid-cols-1 gap-2.5">
                                  {[
                                      { id: 'inter', label: 'Inter (Default)', font: 'font-sans' },
                                      { id: 'dyslexic', label: 'OpenDyslexic', font: 'font-serif', custom: {fontFamily: '"Comic Sans MS", cursive'} },
                                      { id: 'mono', label: 'JetBrains Mono', font: 'font-mono' }
                                  ].map((font) => (
                                      <button 
                                        key={font.id} 
                                        onClick={() => setUserSettings({...userSettings, fontFamily: font.id})} 
                                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${userSettings.fontFamily === font.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500/50'}`}
                                      >
                                          <span className={`text-base font-bold ${font.font}`} style={font.custom}>{font.label}</span>
                                          {userSettings.fontFamily === font.id && <Check size={18} strokeWidth={3}/>}
                                      </button>
                                  ))}
                              </div>
                          </SettingGroup>

                          <SettingGroup title="Размер на текста" icon={Layout}>
                               <div className="flex gap-2 items-end px-3 py-6 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner">
                                  <button onClick={() => setUserSettings({...userSettings, textSize: 'small'})} className={`flex-1 flex flex-col items-center gap-1 transition-all ${userSettings.textSize === 'small' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                      <div className="text-sm font-black uppercase tracking-widest">Aa</div>
                                      <span className="text-[10px] font-bold">Small</span>
                                  </button>
                                  <div className="w-px h-8 bg-zinc-300 dark:bg-white/10" />
                                  <button onClick={() => setUserSettings({...userSettings, textSize: 'normal'})} className={`flex-1 flex flex-col items-center gap-1 transition-all ${userSettings.textSize === 'normal' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                      <div className="text-xl font-black uppercase tracking-widest">Aa</div>
                                      <span className="text-[10px] font-bold">Normal</span>
                                  </button>
                                  <div className="w-px h-8 bg-zinc-300 dark:bg-white/10" />
                                  <button onClick={() => setUserSettings({...userSettings, textSize: 'large'})} className={`flex-1 flex flex-col items-center gap-1 transition-all ${userSettings.textSize === 'large' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                      <div className="text-3xl font-black uppercase tracking-widest">Aa</div>
                                      <span className="text-[10px] font-bold">Large</span>
                                  </button>
                              </div>
                          </SettingGroup>
                      </div>

                      <SettingGroup title="Фон на чата" icon={ImageIcon} premiumOnly>
                          <div className="space-y-6">
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                   <div onClick={() => isPremium && backgroundInputRef.current?.click()} className={`aspect-video rounded-2xl border-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group relative overflow-hidden shadow-md ${isCustomBackground ? 'border-indigo-600 shadow-xl shadow-indigo-500/20' : 'border-dashed border-zinc-300 dark:border-white/10 hover:border-indigo-500 bg-zinc-50 dark:bg-black/40'}`}>
                                       {isCustomBackground ? (
                                           <>
                                               <img src={userSettings.customBackground!} className="absolute inset-0 w-full h-full object-cover"/>
                                               <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <Upload size={24} className="text-white mb-1"/>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Качи нов</span>
                                               </div>
                                           </>
                                       ) : (
                                           <>
                                               <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Upload size={22} className="text-indigo-500"/></div>
                                               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom</span>
                                           </>
                                       )}
                                       <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*"/>
                                   </div>

                                   {PRESET_BACKGROUNDS.map((bg, idx) => (
                                       <button 
                                           key={idx}
                                           onClick={() => setUserSettings((prev: any) => ({...prev, customBackground: bg}))}
                                           className={`relative aspect-video rounded-2xl overflow-hidden border-4 transition-all group shadow-md hover:scale-105 active:scale-95 ${userSettings.customBackground === bg ? 'border-indigo-600 shadow-xl shadow-indigo-500/20 scale-105' : 'border-transparent hover:border-indigo-500/50'}`}
                                       >
                                           <img src={bg} className="w-full h-full object-cover" loading="lazy" />
                                           {userSettings.customBackground === bg && (
                                               <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center backdrop-blur-[2px]">
                                                   <div className="bg-white text-zinc-900 rounded-full p-1 shadow-2xl animate-in zoom-in duration-300"><Check size={18} strokeWidth={3}/></div>
                                               </div>
                                           )}
                                       </button>
                                   ))}
                               </div>
                               
                               {userSettings.customBackground && (
                                   <div className="flex justify-end">
                                        <button onClick={() => setUserSettings((prev: any) => ({...prev, customBackground: null}))} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-2 px-4 py-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 transition-colors">
                                           <Trash2 size={14}/> Премахни фон
                                       </button>
                                   </div>
                               )}
                          </div>
                      </SettingGroup>
                  </div>
              )}

              {/* AI INTELLIGENCE TAB */}
              {activeTab === 'ai' && (
                  <div className={`space-y-10 max-w-3xl mx-auto ${FADE_IN}`}>
                      <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{t('ai_settings', userSettings.language)}</h3>
                          <p className="text-zinc-500 font-medium">Конфигурирайте мозъка на вашия асистент.</p>
                      </div>

                      <SettingGroup title="Изкуствен Интелект" icon={Cpu}>
                          <div className="grid grid-cols-1 gap-4">
                              {[
                                  { id: 'auto', label: 'Автоматичен (Auto)', desc: 'Интелигентен избор на модел според сложността на задачата.', icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                  { id: 'gemini-2.5-flash', label: 'Standard AI (Fast)', desc: 'Бърз, лек и икономичен. Идеален за ежедневни въпроси.', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                  { id: 'gemini-3-flash-preview', label: 'Advanced AI (Gen 3)', desc: 'Висок интелект и разширена логика. За най-трудните задачи.', icon: Brain, color: 'text-amber-500', bg: 'bg-amber-500/10', premium: true }
                              ].map((model) => (
                                  <button
                                      key={model.id}
                                      onClick={() => (!model.premium || isPremium) ? setUserSettings({...userSettings, preferredModel: model.id}) : addToast('Изисква Plus или Pro план.', 'info')}
                                      className={`p-6 rounded-[28px] text-left border-2 transition-all flex items-center gap-6 relative overflow-hidden group ${userSettings.preferredModel === model.id
                                          ? 'bg-white dark:bg-zinc-800 border-indigo-600 shadow-2xl shadow-indigo-500/10'
                                          : `bg-zinc-50 dark:bg-black/30 border-transparent hover:border-zinc-200 dark:hover:border-white/10 ${model.premium && !isPremium ? 'opacity-50 grayscale' : ''}`}`}
                                  >
                                      <div className={`shrink-0 w-16 h-16 rounded-2xl ${model.bg} ${model.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner`}>
                                          <model.icon size={32} strokeWidth={2.5}/>
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-1">
                                              <h5 className={`font-black text-lg ${userSettings.preferredModel === model.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{model.label}</h5>
                                              {model.premium && !isPremium && <span className="bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Pro Only</span>}
                                          </div>
                                          <p className="text-sm text-zinc-500 font-medium leading-relaxed">{model.desc}</p>
                                      </div>
                                      {userSettings.preferredModel === model.id && (
                                          <div className="shrink-0 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                              <Check size={20} strokeWidth={3}/>
                                          </div>
                                      )}
                                  </button>
                              ))}
                          </div>
                      </SettingGroup>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SettingGroup title="Избор на Глас" icon={Volume2} premiumOnly>
                              <div className="grid grid-cols-2 gap-3">
                                  {VOICES.map(voice => (
                                      <button
                                          key={voice.id}
                                          onClick={() => isPremium ? setUserSettings({...userSettings, preferredVoice: voice.id}) : addToast('Изисква Pro план.', 'info')}
                                          className={`p-4 rounded-2xl text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                                              userSettings.preferredVoice === voice.id
                                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                                              : 'bg-zinc-50 dark:bg-black/30 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                          }`}
                                      >
                                          {userSettings.preferredVoice === voice.id && <Volume2 size={16}/>}
                                          {voice.name.split(' ')[0]}
                                      </button>
                                  ))}
                              </div>
                          </SettingGroup>

                          <SettingGroup title="Стил на отговор" icon={HelpCircle}>
                               <div className="space-y-4">
                                   <div className="flex bg-zinc-50 dark:bg-black/40 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner overflow-x-auto no-scrollbar">
                                       {[
                                           { id: 'normal', icon: Brain },
                                           { id: 'socratic', icon: HelpCircle },
                                           { id: 'eli5', icon: Gift },
                                           { id: 'academic', icon: BookOpen },
                                           { id: 'motivational', icon: Sparkles },
                                       ].map((style) => (
                                           <button
                                               key={style.id}
                                               onClick={() => setUserSettings({...userSettings, teachingStyle: style.id})}
                                               title={style.id}
                                               className={`flex-1 min-w-[50px] aspect-square flex items-center justify-center rounded-xl transition-all ${userSettings.teachingStyle === style.id 
                                                   ? 'bg-indigo-600 text-white shadow-xl scale-110 rotate-3' 
                                                   : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                                           >
                                               <style.icon size={20} />
                                           </button>
                                       ))}
                                   </div>
                                   <div className="px-2">
                                       <div className="text-sm font-black text-zinc-800 dark:text-zinc-200 capitalize">{userSettings.teachingStyle}</div>
                                       <p className="text-[10px] text-zinc-500 font-medium">Контролира начина, по който AI обяснява концепциите.</p>
                                   </div>
                               </div>
                          </SettingGroup>
                      </div>

                      <SettingGroup title="Персонализирана Роля (Persona)" icon={User} premiumOnly={!isPro}>
                          <div className="space-y-5">
                              <p className="text-xs text-zinc-500 font-medium leading-relaxed">Дефинирайте специфично поведение на AI. Това ще замени стандартния стил.</p>
                              <div className="relative group">
                                  <textarea 
                                      value={userSettings.customPersona || ''}
                                      onChange={(e) => setUserSettings({...userSettings, customPersona: e.target.value})}
                                      placeholder='Пример: "Ти си Шерлок Холмс. Използвай дедукция и говори загадъчно."'
                                      className={`w-full bg-zinc-50 dark:bg-black/50 border-2 rounded-[28px] p-6 text-sm lg:text-base font-bold text-zinc-800 dark:text-zinc-100 min-h-[160px] outline-none transition-all shadow-inner resize-none ${!isPro ? 'cursor-not-allowed opacity-50' : 'focus:border-indigo-600 border-transparent'}`}
                                      disabled={!isPro}
                                  />
                                  {!isPro && (
                                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                          <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10"><Lock size={12}/> Pro Only Feature</div>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-wrap gap-2.5">
                                  {CUSTOM_PERSONAS.map((p, i) => (
                                      <button 
                                          key={i} 
                                          onClick={() => isPro && setUserSettings({...userSettings, customPersona: p.prompt})}
                                          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm ${!isPro ? 'opacity-40 grayscale cursor-not-allowed' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600'}`}
                                      >
                                          {p.label}
                                      </button>
                                  ))}
                                  {userSettings.customPersona && (
                                      <button onClick={() => setUserSettings({...userSettings, customPersona: ''})} className="px-5 py-2.5 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95">
                                          Изчисти
                                      </button>
                                  )}
                              </div>
                          </div>
                      </SettingGroup>
                  </div>
              )}

              {/* SYSTEM TAB */}
              {activeTab === 'system' && (
                  <div className={`space-y-10 max-w-3xl mx-auto ${FADE_IN}`}>
                      <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Настройки на системата</h3>
                          <p className="text-zinc-500 font-medium">Контролирайте взаимодействието и обратната връзка.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                          {[
                              { id: 'enterToSend', title: 'Enter за изпращане', desc: 'Бързо изпращане на съобщения. Изключете, ако предпочитате нов ред.', icon: Keyboard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                              { id: 'haptics', title: 'Haptic Feedback', desc: 'Вибрация при натискане на бутони (за мобилни устройства).', icon: Smartphone, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                              { id: 'sound', title: 'Звукови Ефекти', desc: 'Звук при получаване на съобщение или приключване на задача.', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                          ].map((item) => (
                              <div key={item.id} className="group flex items-center justify-between p-6 bg-white/50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 dark:hover:border-white/20">
                                  <div className="flex items-center gap-6">
                                      <div className={`p-4 rounded-2xl ${item.bg} ${item.color} shadow-inner shrink-0 group-hover:scale-110 transition-transform`}>
                                          <item.icon size={24} strokeWidth={2.5}/>
                                      </div>
                                      <div className="space-y-1">
                                          <div className="font-black text-lg text-zinc-900 dark:text-white leading-tight">{item.title}</div>
                                          <div className="text-sm text-zinc-500 font-medium">{item.desc}</div>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => setUserSettings({...userSettings, [item.id]: !userSettings[item.id as keyof UserSettings]})} 
                                    className={`w-16 h-9 rounded-full transition-all flex items-center px-1 shadow-inner ${userSettings[item.id as keyof UserSettings] ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                  >
                                      <div className={`w-7 h-7 rounded-full bg-white shadow-xl transition-transform duration-300 ${userSettings[item.id as keyof UserSettings] ? 'translate-x-7' : 'translate-x-0'}`} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* DATA TAB */}
              {activeTab === 'data' && (
                  <div className={`space-y-10 max-w-3xl mx-auto ${FADE_IN}`}>
                      <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{t('data', userSettings.language)}</h3>
                          <p className="text-zinc-500 font-medium">Контролирайте вашите разговори и данни.</p>
                      </div>

                      <div className="space-y-8">
                          <button onClick={handleExportData} className="w-full flex items-center justify-between p-8 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-500/20 group relative overflow-hidden">
                             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="flex items-center gap-6 relative z-10 text-left">
                                 <div className="p-4 bg-white/20 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><Download size={28} strokeWidth={2.5}/></div>
                                 <div className="space-y-1">
                                     <div className="font-black text-xl leading-tight">Експорт на данни</div>
                                     <div className="text-sm text-indigo-100 font-medium">Изтегли цялата си история и настройки като JSON файл.</div>
                                 </div>
                             </div>
                             <ArrowRight size={24} className="text-indigo-200 group-hover:translate-x-2 transition-transform relative z-10 shrink-0"/>
                          </button>

                          <div className="rounded-[40px] border border-red-500/20 overflow-hidden shadow-2xl shadow-red-500/5 bg-red-500/5">
                              <div className="p-10 border-b border-red-500/10 space-y-2">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-2"><AlertTriangle size={12}/> Зона на опасност</div>
                                  <h4 className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">Изтриване на данни</h4>
                                  <p className="text-red-500/60 font-medium leading-relaxed">Следните действия са необратими и ще премахнат информацията завинаги от нашите сървъри.</p>
                              </div>
                              <button onClick={handleDeleteAllChats} className="w-full flex items-center justify-between p-10 hover:bg-red-500/10 transition-all group text-left">
                                 <div className="flex items-center gap-6">
                                     <div className="p-4 bg-white dark:bg-black/20 text-red-600 rounded-2xl shadow-xl group-hover:scale-110 transition-transform"><Trash2 size={28} strokeWidth={2.5}/></div>
                                     <div className="space-y-1">
                                         <div className="font-black text-xl text-zinc-900 dark:text-white leading-tight">{t('delete_all_chats', userSettings.language)}</div>
                                         <div className="text-sm text-zinc-500 font-medium">{t('delete_history_desc', userSettings.language)}</div>
                                     </div>
                                 </div>
                                 <div className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">Изтрий</div>
                            </button>
                          </div>
                      </div>
                      
                      <div className="p-8 rounded-[32px] bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-center">
                          <p className="text-sm text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                              Вашите данни са криптирани и се съхраняват съгласно GDPR регламента. Ние уважаваме вашето право на "забравяне".
                          </p>
                      </div>
                  </div>
              )}

          </div>
      </div>
    </div>
  </div>
  );
};
