import React, { useRef, useState } from 'react';
import { 
  X, User, Upload, Lock, Check, Palette, Plus, Moon, Sun, 
  ImageIcon, Edit2, Cpu, ChevronDown, Database, Trash2, 
  ArrowRight, Settings, CreditCard, Loader2, Globe, 
  Layout, Smartphone, Monitor, Sparkles, LogOut, Volume2, 
  Keyboard, Type, Download, Zap, Brain, MessageCircle, Gift, Copy,
  Eye, EyeOff
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserSettings, UserPlan } from '../../types';
import { getDynamicColorStyle } from '../../styles/theme';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';
import { supabase } from '../../supabaseClient';
import { LANGUAGES, t } from '../../utils/translations';
import { VOICES, DEFAULT_AVATAR } from '../../constants';

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
    { label: "🎤 Rapper", prompt: "Speak in rhymes and flow like a rapper. Keep it cool and rhythmic." },
    { label: "👵 Grandma", prompt: "Act like a sweet, caring grandmother. Call the user 'dear' and offer cookies (virtually)." },
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
  isDarkMode,
  setIsDarkMode,
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
    { id: 'system', label: 'Система', icon: Settings },
    { id: 'data', label: t('data', userSettings.language), icon: Database },
  ];

  const isPro = userPlan === 'pro';
  const currentLang = LANGUAGES.find(l => l.code === userSettings.language) || LANGUAGES[0];

  return (
  <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className={`bg-white/80 dark:bg-[#121212]/90 backdrop-blur-3xl w-full max-w-5xl h-[85vh] rounded-[32px] border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row ${MODAL_ENTER}`}>
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-gray-50/50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-white/5 flex flex-col">
         <div className="p-6 pb-2 md:pb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-800 dark:text-white font-display">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Settings size={18} />
                </div>
                <span>{t('settings', userSettings.language)}</span>
            </h2>
            <button onClick={() => setShowSettings(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
         </div>

         <div className="flex md:flex-col overflow-x-auto md:overflow-visible px-4 md:px-3 gap-2 md:gap-1 pb-4 md:pb-0 scrollbar-hide">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal ${
                        activeTab === tab.id 
                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-500 dark:text-indigo-400' : 'opacity-70'} />
                    {tab.label}
                </button>
            ))}
         </div>

         <div className="mt-auto p-4 hidden md:block">
             <div className="text-xs text-gray-400 text-center font-medium">Uchebnik AI v1.9</div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
          
          <button onClick={() => setShowSettings(false)} className="hidden md:block absolute top-6 right-6 p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition-colors z-50">
              <X size={20}/>
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-24">
              
              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                  <div className={`space-y-8 max-w-2xl mx-auto ${FADE_IN}`}>
                      <div className="text-center md:text-left">
                          <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('profile', userSettings.language)}</h3>
                          <p className="text-gray-500">Управлявайте вашата лична информация и абонамент.</p>
                      </div>

                      <div className="flex flex-col items-center md:items-start gap-6">
                          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                              <div className="w-28 h-28 rounded-[2rem] p-1 border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-indigo-500 transition-colors">
                                  <img src={editProfile.avatar || DEFAULT_AVATAR} className="w-full h-full rounded-[1.8rem] object-cover bg-gray-50 dark:bg-zinc-800"/>
                              </div>
                              <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 size={24} className="text-white"/>
                              </div>
                              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('first_name', userSettings.language)}</label>
                              <input value={editProfile.firstName} onChange={e => setEditProfile({...editProfile, firstName: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium"/>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('last_name', userSettings.language)}</label>
                              <input value={editProfile.lastName} onChange={e => setEditProfile({...editProfile, lastName: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium"/>
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('email', userSettings.language)}</label>
                              <input value={editProfile.email} onChange={e => setEditProfile({...editProfile, email: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium"/>
                          </div>
                          
                          <div className="col-span-1 md:col-span-2 pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-indigo-500"/> Смяна на парола</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('current_password', userSettings.language)}</label>
                                      <div className="relative">
                                          <input 
                                            type={showCurrentPassword ? "text" : "password"} 
                                            value={editProfile.currentPassword} 
                                            onChange={e => setEditProfile({...editProfile, currentPassword: e.target.value})} 
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 outline-none focus:border-indigo-500 transition-all font-medium" 
                                            placeholder="••••••••"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                                          >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('new_password', userSettings.language)}</label>
                                      <div className="relative">
                                          <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={editProfile.password} 
                                            onChange={e => setEditProfile({...editProfile, password: e.target.value})} 
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 outline-none focus:border-indigo-500 transition-all font-medium" 
                                            placeholder="••••••••"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                                          >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {isPremium && (
                        <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                             <div className="relative z-10 flex justify-between items-center">
                                 <div>
                                     <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Вашият план</div>
                                     <h4 className="text-2xl font-black">{userPlan === 'pro' ? 'Pro Plan' : 'Plus Plan'}</h4>
                                     {userSettings.proExpiresAt && (
                                         <p className="text-xs text-indigo-100 mt-1 font-medium bg-white/20 px-2 py-0.5 rounded w-fit">
                                             Expires: {new Date(userSettings.proExpiresAt).toLocaleDateString()}
                                         </p>
                                     )}
                                 </div>
                                 <Button 
                                    disabled={true}
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-none opacity-80"
                                >
                                    Очаквайте скоро
                                 </Button>
                             </div>
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"/>
                        </div>
                      )}

                      <div className="flex justify-end pt-4">
                          <Button onClick={handleUpdateAccount} className="px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20" icon={Check}>{t('save_changes', userSettings.language)}</Button>
                      </div>
                  </div>
              )}

              {/* ... other tabs ... */}
              {activeTab === 'appearance' && (
                  <div className={`space-y-8 max-w-2xl mx-auto ${FADE_IN}`}>
                      <div>
                          <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('personalization', userSettings.language)}</h3>
                          <p className="text-gray-500">Направете приложението свое.</p>
                      </div>

                      {/* Language */}
                      <section className="space-y-4">
                          <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <Globe size={18} className="text-indigo-500"/> {t('language', userSettings.language)}
                          </label>
                          <div className="relative">
                              <button 
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="w-full flex items-center justify-between bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-left"
                              >
                                  <div className="flex items-center gap-3">
                                      <img 
                                        src={`https://flagcdn.com/w40/${currentLang.countryCode}.png`} 
                                        srcSet={`https://flagcdn.com/w80/${currentLang.countryCode}.png 2x`}
                                        width="24" 
                                        alt={currentLang.countryCode} 
                                        className="rounded-md object-cover shadow-sm"
                                      />
                                      <span>{currentLang.label}</span>
                                  </div>
                                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`}/>
                              </button>
                              
                              {isLangOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-50 animate-in slide-in-from-top-2">
                                    <div className="p-2 grid grid-cols-1 gap-1">
                                        {LANGUAGES.map(lang => (
                                            <button 
                                                key={lang.code}
                                                onClick={() => {
                                                    setUserSettings((prev: any) => ({...prev, language: lang.code}));
                                                    setIsLangOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${userSettings.language === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <img 
                                                    src={`https://flagcdn.com/w40/${lang.countryCode}.png`} 
                                                    width="20" 
                                                    alt={lang.countryCode} 
                                                    className="rounded shadow-sm"
                                                />
                                                {lang.label}
                                                {userSettings.language === lang.code && <Check size={16} className="ml-auto"/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                              )}
                              
                              {isLangOpen && <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />}
                          </div>
                      </section>

                      {/* Theme Colors */}
                      <section className={`space-y-4 p-6 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 ${!isPremium ? 'opacity-70' : ''}`}>
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Palette size={18} className="text-pink-500"/> {t('theme_color', userSettings.language)}
                              </label>
                              {!isPremium && <span className="px-2 py-1 bg-gray-200 dark:bg-white/10 rounded text-[10px] font-bold text-gray-500 uppercase">Plus / Pro required</span>}
                          </div>
                          <div className={`flex flex-wrap gap-4 ${!isPremium ? 'pointer-events-none' : ''}`}>
                              {PRESET_COLORS.map(c => (
                                  <button 
                                    key={c} 
                                    onClick={() => setUserSettings((prev: any) => ({...prev, themeColor: c}))} 
                                    className={`w-12 h-12 rounded-full transition-all shadow-sm flex items-center justify-center relative ${userSettings.themeColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 dark:ring-offset-zinc-900' : 'hover:scale-105'}`} 
                                    style={getDynamicColorStyle(c)}
                                  >
                                      {userSettings.themeColor === c && <Check size={20} className="text-white drop-shadow-md"/>}
                                  </button>
                              ))}

                              <div className="relative group">
                                  <input
                                      type="color"
                                      value={userSettings.themeColor}
                                      onChange={(e) => setUserSettings((prev: any) => ({...prev, themeColor: e.target.value}))}
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                      title="Choose custom color"
                                  />
                                  <div 
                                      className={`w-12 h-12 rounded-full transition-all shadow-sm flex items-center justify-center relative overflow-hidden ${
                                          isCustomColor 
                                          ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 dark:ring-offset-zinc-900' 
                                          : 'border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-indigo-500 hover:scale-105'
                                      }`}
                                      style={isCustomColor ? { backgroundColor: userSettings.themeColor } : {}}
                                  >
                                      {isCustomColor ? (
                                          <Check size={20} className="text-white drop-shadow-md"/>
                                      ) : (
                                          <Plus size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                      )}
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* Fonts */}
                      <section className={`space-y-4 p-6 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 ${!isPremium ? 'opacity-70' : ''}`}>
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Type size={18} className="text-blue-500"/> Шрифт
                              </label>
                              {!isPremium && <span className="px-2 py-1 bg-gray-200 dark:bg-white/10 rounded text-[10px] font-bold text-gray-500 uppercase">Plus / Pro required</span>}
                          </div>
                          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${!isPremium ? 'pointer-events-none' : ''}`}>
                              <button onClick={() => setUserSettings({...userSettings, fontFamily: 'inter'})} className={`py-3 px-4 rounded-xl border font-sans font-medium transition-all ${userSettings.fontFamily === 'inter' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                  Standard (Inter)
                              </button>
                              <button onClick={() => setUserSettings({...userSettings, fontFamily: 'dyslexic'})} className={`py-3 px-4 rounded-xl border font-medium transition-all ${userSettings.fontFamily === 'dyslexic' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`} style={{fontFamily: '"Comic Sans MS", cursive'}}>
                                  Dyslexia Friendly
                              </button>
                              <button onClick={() => setUserSettings({...userSettings, fontFamily: 'mono'})} className={`py-3 px-4 rounded-xl border font-mono font-medium transition-all ${userSettings.fontFamily === 'mono' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                  Monospace / Code
                              </button>
                          </div>
                      </section>

                      {/* Mode Toggle */}
                      <section className="flex items-center justify-between p-5 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl">
                          <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                  {isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}
                              </div>
                              <div>
                                  <div className="font-bold text-sm text-gray-900 dark:text-white">Тема на интерфейса</div>
                                  <div className="text-xs text-gray-500">{isDarkMode ? t('dark_mode', userSettings.language) : t('light_mode', userSettings.language)}</div>
                              </div>
                          </div>
                          <button 
                            onClick={() => setIsDarkMode(!isDarkMode)} 
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                          >
                              <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </section>

                      {/* Chat Backgrounds */}
                      <section className={`space-y-4 ${!isPremium ? 'opacity-70' : ''}`}>
                           <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <ImageIcon size={18} className="text-emerald-500"/> {t('chat_bg', userSettings.language)}
                              </label>
                              {!isPremium && <span className="px-2 py-1 bg-gray-200 dark:bg-white/10 rounded text-[10px] font-bold text-gray-500 uppercase">Plus / Pro required</span>}
                           </div>
                           
                           <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!isPremium ? 'pointer-events-none' : ''}`}>
                               <div 
                                   onClick={() => isPremium && backgroundInputRef.current?.click()}
                                   className={`aspect-video rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${
                                        isCustomBackground
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                                        : 'border-dashed border-gray-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50 dark:bg-black/20'
                                   }`}
                               >
                                   {isCustomBackground ? (
                                       <>
                                           <img src={userSettings.customBackground!} className="absolute inset-0 w-full h-full object-cover" alt="Custom Background" />
                                           <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                                           
                                           <div className="absolute inset-0 flex items-center justify-center z-20">
                                                <div className="bg-indigo-500 text-white rounded-full p-1 shadow-lg transform group-hover:scale-0 transition-transform duration-200">
                                                    <Check size={16} />
                                                </div>
                                           </div>

                                           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 group-hover:scale-100">
                                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-full shadow-sm mb-2"><Upload size={20} className="text-white"/></div>
                                                <span className="text-xs font-bold text-white shadow-sm">Промени</span>
                                           </div>
                                       </>
                                   ) : (
                                       <>
                                           <div className="p-2 bg-white dark:bg-white/5 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Upload size={18}/></div>
                                           <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-500">Upload</span>
                                       </>
                                   )}
                                   <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*"/>
                               </div>

                               {PRESET_BACKGROUNDS.map((bg, idx) => (
                                   <button 
                                       key={idx}
                                       onClick={() => setUserSettings((prev: any) => ({...prev, customBackground: bg}))}
                                       className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${userSettings.customBackground === bg ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-indigo-500/50'}`}
                                   >
                                       <img src={bg} className="w-full h-full object-cover" loading="lazy" />
                                       {userSettings.customBackground === bg && (
                                           <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                               <div className="bg-indigo-500 text-white rounded-full p-1"><Check size={14}/></div>
                                           </div>
                                       )}
                                   </button>
                               ))}
                           </div>
                           
                           {userSettings.customBackground && (
                               <div className="flex justify-end">
                                    <button 
                                       onClick={() => setUserSettings((prev: any) => ({...prev, customBackground: null}))} 
                                       className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                                   >
                                       <Trash2 size={14}/> {t('remove', userSettings.language)} Background
                                   </button>
                               </div>
                           )}
                      </section>
                  </div>
              )}

              {/* ... other tabs ... */}
          </div>
      </div>
    </div>
  </div>
  );
};