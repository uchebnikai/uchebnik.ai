
import React, { useState, useRef, useEffect } from 'react';
import { Shield, MessageSquare, ArrowRight, School, GraduationCap, Briefcase, ArrowLeft, ArrowUpRight, Search, ImageIcon, Mic, MicOff, X, Menu, Landmark, Sparkles, BookOpen, Brain, Zap, CheckCircle2, Users, LayoutDashboard, Settings, MapPin, Mail, Globe, MoreVertical, Paperclip, Send, Lock, Star, Trophy, Target, AlertTriangle } from 'lucide-react';
import { SubjectConfig, UserRole, UserSettings, HomeViewType, SubjectId } from '../../types';
import { SUBJECTS } from '../../constants';
import { DynamicIcon } from '../ui/DynamicIcon';
import { ZOOM_IN, SLIDE_UP, FADE_IN, SLIDE_RIGHT } from '../../animations/transitions';
import { getStaggeredDelay } from '../../animations/utils';
import { resizeImage } from '../../utils/image';
import { t } from '../../utils/translations';

interface WelcomeScreenProps {
  homeView: HomeViewType;
  userMeta: any;
  userSettings: UserSettings;
  handleSubjectChange: (subject: SubjectConfig) => void;
  setHomeView: (view: HomeViewType) => void;
  setUserRole: (role: UserRole) => void;
  setShowAdminAuth: (val: boolean) => void;
  onQuickStart: (message: string, images?: string[]) => void;
  setSidebarOpen: (val: boolean) => void;
  setShowAuthModal: (val: boolean) => void;
  session?: any;
  setShowSettings?: (val: boolean) => void;
}

interface MockMessage {
    role: 'user' | 'model';
    text: string | React.ReactNode;
}

export const WelcomeScreen = ({
  homeView,
  userMeta,
  userSettings,
  handleSubjectChange,
  setHomeView,
  setUserRole,
  setShowAdminAuth,
  onQuickStart,
  setSidebarOpen,
  setShowAuthModal,
  session,
  setShowSettings
}: WelcomeScreenProps) => {

    const [inputValue, setInputValue] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const startingTextRef = useRef('');

    // --- Mock Chat State for Landing Page Mockup ---
    const [mockInputValue, setMockInputValue] = useState('');
    const [mockMessages, setMockMessages] = useState<MockMessage[]>([
        { role: 'user', text: 'Здравей! Трябва ми помощ със задача по органична химия... 🧪' },
        { 
            role: 'model', 
            text: (
                <div className="flex flex-col gap-2">
                    <span>Разбира се! Ето формулата за моларна маса, която ти трябва:</span>
                    <div className="mt-1 p-3 bg-zinc-200 dark:bg-white/10 rounded-2xl flex items-center justify-center border border-black/5 shadow-inner backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-serif text-xl italic tracking-wider text-zinc-800 dark:text-white">
                            <span>M</span>
                            <span>=</span>
                            <div className="flex flex-col items-center">
                                <span className="border-b border-black/30 dark:border-white/60 px-1 leading-none">m</span>
                                <span className="leading-none text-sm">n</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ]);
    const [isMockTyping, setIsMockTyping] = useState(false);
    const isMockDisabled = mockMessages.length >= 4;

    const handleMockSend = () => {
        if (!mockInputValue.trim() || isMockTyping || isMockDisabled) return;
        
        const userMsg = mockInputValue;
        setMockMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setMockInputValue('');
        setIsMockTyping(true);

        setTimeout(() => {
            setMockMessages(prev => [...prev, { 
                role: 'model', 
                text: 'Това е само началото! Влез в профила си, за да получиш пълното решение на всяка задача абсолютно безплатно. ✨' 
            }]);
            setIsMockTyping(false);
        }, 1200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if(inputValue.trim() || selectedImages.length > 0) {
                onQuickStart(inputValue, selectedImages);
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (files.length + selectedImages.length > 4) {
                alert("Максимум 4 снимки на съобщение.");
                e.target.value = '';
                return;
            }
            try {
                const processedImages = await Promise.all(
                    Array.from(files).map(file => resizeImage(file as File, 800, 0.6))
                );
                setSelectedImages(prev => [...prev, ...processedImages]);
            } catch (err) {
                console.error("Image processing error", err);
            }
            e.target.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }
        
        const SR = (window as any).SpeechRecognition || (window as any).webkitRecognition;
        if (!SR) {
            alert('Гласовата услуга не се поддържа от този браузър.');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            try { recognitionRef.current.stop(); } catch(e){}
        }

        const rec = new SR();
        rec.lang = userSettings.language === 'en' ? 'en-US' : (userSettings.language === 'bg' ? 'bg-BG' : userSettings.language); 
        rec.interimResults = true;
        rec.continuous = false;
        startingTextRef.current = inputValue;

        rec.onresult = (e: any) => {
            let f = '', inter = '';
            for(let i = e.resultIndex; i < e.results.length; ++i) {
                e.results[i].isFinal ? f += e.results[i][0].transcript : inter += e.results[i][0].transcript;
            }
            setInputValue((startingTextRef.current + ' ' + f + inter).trim());
        };

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (e: any) => {
            console.error("Mic error:", e.error);
            if(e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                alert('Не мога да започна запис. Моля, уверете се, че сте позволили достъп до микрофона в настройките.');
            }
            setIsListening(false);
        };
        
        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (err) {
            console.error("Speech recognition start error:", err);
            setIsListening(false);
        }
    };

    if (session && homeView === 'landing') {
        const greetingName = userSettings.userName ? userSettings.userName.split(' ')[0] : 'Scholar';

        return (
            <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col relative pb-safe">
                
                {/* Admin Access & Settings for Logged In Users */}
                <div className="absolute top-6 left-6 z-30 flex gap-2">
                    <button onClick={() => setShowAdminAuth(true)} className="p-2.5 bg-white/10 dark:bg-black/20 hover:bg-white/20 backdrop-blur-md rounded-xl text-zinc-500 hover:text-indigo-500 transition-all border border-white/5 shadow-sm">
                        <Shield size={20} />
                    </button>
                    <button onClick={() => setShowSettings?.(true)} className="md:hidden p-2.5 bg-white/10 dark:bg-black/20 hover:bg-white/20 backdrop-blur-md rounded-xl text-zinc-500 hover:text-indigo-500 transition-all border border-white/5 shadow-sm">
                        <Settings size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 w-full max-w-7xl mx-auto min-h-fit mt-12 mb-12">
                    
                    {/* Premium Dashboard Greeting */}
                    <div className="text-center mb-12 lg:mb-16 animate-in slide-in-from-bottom-6 duration-1000 w-full px-4 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-sm">
                            <Sparkles size={14} className="text-amber-400" fill="currentColor"/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Твоят личен асистент е готов</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6 font-display leading-[1.05]">
                            {t('hello', userSettings.language)}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-indigo-300 to-white drop-shadow-2xl">{greetingName}</span>.
                        </h1>
                        <p className="text-lg lg:text-2xl text-zinc-500 dark:text-zinc-400 font-medium tracking-tight max-w-2xl mx-auto leading-relaxed">
                            {t('subtitle', userSettings.language)} С какво мога да помогна днес?
                        </p>
                    </div>

                    {/* Enhanced Navigation Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-6xl mb-16 px-4">
                        <button 
                            onClick={() => handleSubjectChange(SUBJECTS[0])}
                            className="group relative h-full min-h-[280px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 hover:border-indigo-500/50 rounded-[48px] p-10 transition-all duration-500 hover:-translate-y-3 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl text-left flex flex-col items-start"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-600/20 transition-all duration-500"/>
                            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <MessageSquare size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-black text-white mb-3 tracking-tight">{t('chat_general', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-base font-medium mb-8 leading-relaxed flex-1">Интелигентни отговори за всичко, което те вълнува.</p>
                            <div className="w-full flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-500">Бърз старт</span>
                                <div className="w-12 h-12 bg-white/5 group-hover:bg-indigo-600 text-zinc-400 group-hover:text-white rounded-full flex items-center justify-center transition-all duration-500 border border-white/10 group-hover:border-indigo-500 shadow-xl">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => setHomeView('school_select')}
                            className="group relative h-full min-h-[280px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 hover:border-blue-500/50 rounded-[48px] p-10 transition-all duration-500 hover:-translate-y-3 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl text-left flex flex-col items-start"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-all duration-500"/>
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <School size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-black text-white mb-3 tracking-tight">{t('school', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-base font-medium mb-8 leading-relaxed flex-1">Решения, уроци и тестове за 1-12 клас по всички предмети.</p>
                            <div className="w-full flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-500">Избери предмет</span>
                                <div className="w-12 h-12 bg-white/5 group-hover:bg-blue-600 text-zinc-400 group-hover:text-white rounded-full flex items-center justify-center transition-all duration-500 border border-white/10 group-hover:border-blue-500 shadow-xl">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => setHomeView('university_select')}
                            className="group relative h-full min-h-[280px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 hover:border-emerald-500/50 rounded-[48px] p-10 transition-all duration-500 hover:-translate-y-3 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl text-left flex flex-col items-start"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/10 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:bg-emerald-600/20 transition-all duration-500"/>
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/20 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Landmark size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-black text-white mb-3 tracking-tight">{t('university', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-base font-medium mb-8 leading-relaxed flex-1">Академични ресурси и професионална помощ за студенти.</p>
                            <div className="w-full flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-500">Висше образование</span>
                                <div className="w-12 h-12 bg-white/5 group-hover:bg-emerald-600 text-zinc-400 group-hover:text-white rounded-full flex items-center justify-center transition-all duration-500 border border-white/10 group-hover:border-emerald-500 shadow-xl">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Centered Quick AI Input */}
                    <div className="w-full max-w-2xl relative z-20 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 mb-8">
                        {selectedImages.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 px-2 justify-center no-scrollbar">
                                {selectedImages.map((img, i) => ( 
                                    <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-lg group-hover:bg-indigo-500/40 transition-all" />
                                        <img src={img} className="h-20 w-20 rounded-2xl object-cover border-2 border-white/10 shadow-2xl relative z-10"/>
                                        <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform z-20 border border-white/20"><X size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative group/input">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[30px] rounded-full opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-700 -z-10" />
                            <div className="relative bg-[#0d0d0f]/80 border border-white/10 rounded-[32px] p-2.5 pl-6 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all group-focus-within/input:border-indigo-500/50 backdrop-blur-2xl ring-1 ring-white/5">
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90" title="Добави снимка">
                                        <ImageIcon size={22} />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                                    <button onClick={toggleListening} className={`p-2.5 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`} title="Гласово въвеждане">
                                        {isListening ? <MicOff size={22}/> : <Mic size={22} strokeWidth={2.5}/>}
                                    </button>
                                </div>
                                <div className="w-px h-8 bg-white/10 shrink-0"></div>
                                <input 
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Попитай нещо бързо..."
                                    className="flex-1 bg-transparent border-none outline-none py-3 text-base lg:text-lg text-zinc-100 placeholder-zinc-700 font-bold min-w-0"
                                />
                                <button 
                                    onClick={() => (inputValue.trim() || selectedImages.length > 0) && onQuickStart(inputValue, selectedImages)}
                                    disabled={!inputValue.trim() && selectedImages.length === 0}
                                    className="w-12 h-12 rounded-[20px] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 disabled:opacity-20 disabled:grayscale transition-all active:scale-95 shrink-0 group-hover/input:scale-105"
                                >
                                    <ArrowUpRight size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full py-12 flex flex-col items-center gap-8 border-t border-white/5 bg-zinc-950/40 backdrop-blur-xl mt-auto relative z-20">
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-6">
                        <button onClick={() => setHomeView('about')} className="hover:text-indigo-400 transition-colors">За нас</button>
                        <button onClick={() => setHomeView('contact')} className="hover:text-indigo-400 transition-colors">Контакти</button>
                        <button onClick={() => setHomeView('terms')} className="hover:text-indigo-400 transition-colors">Общи условия</button>
                        <button onClick={() => setHomeView('privacy')} className="hover:text-indigo-400 transition-colors">Поверителност</button>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-[10px] font-bold text-zinc-700 text-center px-6">
                        <p>© 2026 Uchebnik AI. Build v1.9.4 • Premium Access</p>
                    </div>
                </div>
            </div>
        );
    }

    const isUniView = homeView.includes('uni');
    const delayStep = isUniView ? 30 : 45;

    return (
    <div className={`flex flex-col h-full w-full items-center bg-transparent relative selection:bg-indigo-500/30 overflow-hidden`}>
      {homeView === 'landing' && (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center pb-safe">
            
            <nav className="w-full flex items-center justify-between p-6 px-8 md:px-12 shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" />
                        <span className="font-display font-black text-xl tracking-tight hidden sm:inline">Uchebnik AI</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={() => setShowAdminAuth(true)} className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors">
                        <Shield size={18} />
                    </button>
                    <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-xs lg:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {t('enter', userSettings.language)}
                    </button>
                </div>
            </nav>

            <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-6 lg:px-12 py-10 lg:py-28 items-start lg:items-center relative">
                <div className={`lg:col-span-6 flex flex-col items-start text-left ${SLIDE_RIGHT} duration-1000 lg:mb-32`}>
                    <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-zinc-900 dark:text-white font-display mb-6">
                        {t('landing_hero_title', userSettings.language)}
                    </h1>
                    <p className="text-base md:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mb-10 leading-relaxed">
                        {t('landing_hero_desc', userSettings.language)}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => handleSubjectChange(SUBJECTS[0])} 
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base lg:text-lg shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
                        >
                            {t('landing_cta_main', userSettings.language)}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                        <div className="flex -space-x-2 lg:-space-x-3 items-center ml-2">
                            {[1,2,3,4].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?u=user${i}`} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white dark:border-zinc-900 object-cover shadow-sm" />
                            ))}
                            <span className="pl-4 lg:pl-6 text-[10px] lg:text-sm font-bold text-zinc-500">+100 ученици</span>
                        </div>
                    </div>
                </div>

                <div className={`lg:col-span-6 relative flex items-center justify-center gap-12 md:gap-28 ${ZOOM_IN} duration-1000 delay-300 hidden lg:flex lg:mb-40`}>
                    <div className="relative z-10 p-3 bg-white/10 dark:bg-black/40 backdrop-blur-3xl rounded-[56px] border border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.4)] rotate-2 max-w-[320px] xl:max-w-[380px] w-full group shrink-0">
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-30 flex items-center justify-center px-4 overflow-hidden border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"/>
                            <div className="text-[7px] font-black text-white/60 tracking-widest uppercase">UCHEBNIK AI OS</div>
                        </div>

                        <div className="bg-[#f8fafc] dark:bg-[#0c0c0e] rounded-[44px] overflow-hidden aspect-[9/18.5] border border-white/5 shadow-inner flex flex-col relative">
                            <div className="pt-16 pb-4 px-6 bg-white dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 p-1 flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden">
                                        <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-zinc-900 dark:text-white leading-none mb-1 tracking-tight">Uchebnik AI</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">На линия</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400"><Settings size={14}/></div>
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400"><MoreVertical size={14}/></div>
                                </div>
                            </div>

                            <div className="flex-1 p-4 space-y-4 overflow-hidden pb-10">
                                {mockMessages.map((msg, i) => (
                                    <div key={i} className={`p-4 text-[13px] leading-relaxed border border-white/5 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[24px] rounded-br-none font-bold max-w-[85%] ml-auto shadow-xl shadow-indigo-500/20' : 'bg-zinc-100 dark:bg-white/5 rounded-[24px] rounded-bl-none font-medium text-zinc-800 dark:text-zinc-200 max-w-[90%] mr-auto'} ${SLIDE_UP}`}>
                                        {msg.role === 'model' && (
                                            <div className="flex items-center gap-2 mb-1 pb-1 border-b border-black/5 dark:border-white/10">
                                                <Zap size={12} fill="currentColor" className="text-indigo-500"/>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Uchebnik AI</span>
                                            </div>
                                        )}
                                        {msg.text}
                                    </div>
                                ))}
                                {isMockTyping && (
                                    <div className="flex gap-2 items-center text-indigo-500 mr-auto ml-2 animate-pulse">
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce"/>
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]"/>
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.4s]"/>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-white/5 flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400"><Paperclip size={18}/></div>
                                <div className={`flex-1 h-10 rounded-full border flex items-center px-4 relative transition-all ${isMockDisabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10'}`}>
                                    <input 
                                        type="text"
                                        value={mockInputValue}
                                        onChange={(e) => setMockInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleMockSend()}
                                        placeholder={isMockDisabled ? "Регистрирай се за още" : "Напиши..."}
                                        disabled={isMockDisabled}
                                        className="w-full bg-transparent border-none outline-none text-[11px] text-zinc-700 dark:text-zinc-200 font-medium placeholder:italic disabled:opacity-80"
                                    />
                                    {isMockDisabled && <Lock size={12} className="text-indigo-500 ml-2 shrink-0"/>}
                                </div>
                                <button 
                                    onClick={isMockDisabled ? () => setShowAuthModal(true) : handleMockSend} 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 ${isMockDisabled ? 'bg-indigo-50 hover:bg-indigo-600' : 'bg-indigo-600'}`}
                                >
                                    {isMockDisabled ? <ArrowRight size={16}/> : <Send size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-[240px] xl:w-[280px] pt-12">
                        <div className={`p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl ${SLIDE_UP} delay-500`}>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                                <Trophy size={20} />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 tracking-tight">Система за Класации</h4>
                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Печели XP за всяка решена задача и се състезавай с ученици от цяла България.</p>
                        </div>

                        <div className={`p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl ${SLIDE_UP} delay-700`}>
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-500 flex items-center justify-center mb-4">
                                <Target size={20} />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 tracking-tight">Дневни Мисии</h4>
                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Изпълнявай мисии всеки ден, за да трупаш точки и да отключваш нови нива на знание.</p>
                        </div>

                        <div className={`p-6 bg-indigo-600/10 backdrop-blur-xl border border-indigo-500/20 rounded-[32px] shadow-2xl ${SLIDE_UP} delay-900 border-dashed`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                                    <Sparkles size={20} fill="currentColor" />
                                </div>
                                <span className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">НОВА ФУНКЦИЯ</span>
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 tracking-tight">Гласови разговори</h4>
                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Вече можеш да говориш директно с Uchebnik AI за още по-лесно учене на езици.</p>
                        </div>
                    </div>
                </div>

                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/30 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-purple-600/20 blur-[140px] rounded-full animate-pulse-slow delay-700" />
            </section>

            <footer className="w-full py-16 bg-zinc-950 px-8 md:px-12 border-t border-white/5">
                <div className="w-full flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-2">
                            <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" />
                            <span className="font-display font-black text-xl tracking-tight text-white">Uchebnik AI</span>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium text-center md:text-left max-w-xs">Бъдещето на образованието в България, подкрепено от най-новите технологии.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-bold text-zinc-400">
                        <button onClick={() => setHomeView('about')} className="hover:text-white transition-colors">{t('about_us', userSettings.language)}</button>
                        <button onClick={() => setHomeView('contact')} className="hover:text-white transition-colors">{t('contact', userSettings.language)}</button>
                        <button onClick={() => setHomeView('terms')} className="hover:text-white transition-colors">{t('terms', userSettings.language)}</button>
                        <button onClick={() => setHomeView('privacy')} className="hover:text-white transition-colors">{t('privacy', userSettings.language)}</button>
                    </div>
                </div>
                <div className="w-full mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-600">
                    <p>&copy; {new Date().getFullYear()} Uchebnik AI. Всички права запазени.</p>
                    <p>Designed with ❤️ by <a href="https://instagram.com/vanyoy" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Vanyo</a>, <a href="https://instagram.com/s_ivanov6" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Svetlyo</a> & <a href="https://tiktok.com/@bella_kzx" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Bella</a>.</p>
                </div>
            </footer>
        </div>
      )}

      {homeView === 'school_select' && (
        <div className={`max-w-5xl w-full flex-1 flex flex-col items-center justify-center relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-700 overflow-y-auto custom-scrollbar p-6 lg:p-8 pb-safe`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all font-bold z-20 m-6 lg:m-8 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> {t('back', userSettings.language)}
             </button>
             <h2 className="text-3xl lg:text-6xl font-black text-zinc-900 dark:text-white mb-10 lg:mb-16 tracking-tight mt-16 lg:mt-0 text-center px-4 break-words font-display">{t('select_role', userSettings.language)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl px-4">
                 <button onClick={() => { setHomeView('student_subjects'); setUserRole('student'); }} className="group relative h-56 lg:h-80 rounded-[48px] p-8 lg:p-10 text-left bg-[#0c0c0e] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden flex flex-col justify-between">
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                     <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-500/10 text-indigo-400 rounded-[28px] flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-indigo-500/20"><GraduationCap size={40} className="lg:w-12 lg:h-12"/></div>
                     <div><h3 className="text-3xl lg:text-4xl font-black mb-2 text-white font-display tracking-tight">{t('role_student', userSettings.language)}</h3><p className="text-zinc-400 font-medium text-base lg:text-lg leading-relaxed">{t('desc_student', userSettings.language)}</p></div>
                 </button>
                 <button onClick={() => { setHomeView('teacher_subjects'); setUserRole('teacher'); }} className="group relative h-56 lg:h-80 rounded-[48px] p-8 lg:p-10 text-left bg-[#0c0c0e] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden flex flex-col justify-between">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                     <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-500/10 text-blue-400 rounded-[28px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-blue-500/20"><Briefcase size={40} className="lg:w-12 lg:h-12"/></div>
                     <div><h3 className="text-3xl lg:text-4xl font-black mb-2 text-white font-display tracking-tight">{t('role_teacher', userSettings.language)}</h3><p className="text-zinc-400 font-medium text-base lg:text-lg leading-relaxed">{t('desc_teacher', userSettings.language)}</p></div>
                 </button>
             </div>
        </div>
      )}

      {homeView === 'university_select' && (
        <div className={`max-w-5xl w-full flex-1 flex flex-col items-center justify-center relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-700 overflow-y-auto custom-scrollbar p-6 lg:p-8 pb-safe`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all font-bold z-20 m-6 lg:m-8 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> {t('back', userSettings.language)}
             </button>
             <h2 className="text-3xl lg:text-6xl font-black text-zinc-900 dark:text-white mb-10 lg:mb-16 tracking-tight mt-16 lg:mt-0 text-center px-4 break-words font-display">{t('select_role_uni', userSettings.language)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl px-4">
                 <button onClick={() => { setHomeView('uni_student_subjects'); setUserRole('uni_student'); }} className="group relative h-56 lg:h-80 rounded-[48px] p-8 lg:p-10 text-left bg-[#0c0c0e] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden flex flex-col justify-between">
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                     <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500/10 text-emerald-400 rounded-[28px] flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-emerald-500/20"><GraduationCap size={40} className="lg:w-12 lg:h-12"/></div>
                     <div><h3 className="text-3xl lg:text-4xl font-black mb-2 text-white font-display tracking-tight">{t('role_uni_student', userSettings.language)}</h3><p className="text-zinc-400 font-medium text-base lg:text-lg leading-relaxed">{t('desc_uni_student', userSettings.language)}</p></div>
                 </button>
                 <button onClick={() => { setHomeView('uni_teacher_subjects'); setUserRole('uni_teacher'); }} className="group relative h-56 lg:h-80 rounded-[48px] p-8 lg:p-10 text-left bg-[#0c0c0e] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden flex flex-col justify-between">
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                     <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 rounded-[28px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10"><Briefcase size={40} className="lg:w-12 lg:h-12"/></div>
                     <div><h3 className="text-3xl lg:text-4xl font-black mb-2 text-white font-display tracking-tight">{t('role_uni_professor', userSettings.language)}</h3><p className="text-zinc-400 font-medium text-base lg:text-lg leading-relaxed">{t('desc_uni_professor', userSettings.language)}</p></div>
                 </button>
             </div>
        </div>
      )}

      {(homeView === 'student_subjects' || homeView === 'teacher_subjects' || homeView === 'uni_student_subjects' || homeView === 'uni_teacher_subjects') && (
        <div className={`max-w-7xl w-full py-6 md:py-16 px-4 animate-in slide-in-from-bottom-10 fade-in duration-1000 relative z-10 overflow-y-auto custom-scrollbar flex-1 pb-safe`}>
           <button onClick={() => setHomeView(homeView.includes('uni') ? 'university_select' : 'school_select')} className="mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group sticky top-0 bg-background/50 backdrop-blur-xl py-3 z-20 w-fit rounded-full pr-6 border border-white/5 shadow-lg"><div className="p-2 md:p-3 bg-white/5 dark:bg-black/50 backdrop-blur-md rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={20} /></div> {t('back_to_roles', userSettings.language)}</button>
           
           <div className="mb-12 px-2">
                <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter font-display">
                    {homeView === 'student_subjects' ? t('role_student', userSettings.language) : 
                        homeView === 'teacher_subjects' ? t('role_teacher', userSettings.language) : 
                        homeView === 'uni_student_subjects' ? t('role_uni_student', userSettings.language) : t('role_uni_professor', userSettings.language)}
                </h2>
                <div className="flex items-center gap-3">
                    <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs lg:text-sm">{t('select_subject', userSettings.language)}</p>
                </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-8 pb-24">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes(isUniView ? 'university' : 'school')).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={getStaggeredDelay(i, delayStep)} className={`group flex flex-col items-center text-center p-6 lg:p-10 bg-[#0d0d0f]/60 backdrop-blur-2xl rounded-[40px] border border-white/5 hover:border-indigo-500/50 shadow-2xl transition-all duration-500 hover:-translate-y-3 ${FADE_IN} fill-mode-backwards ring-1 ring-white/5`}>
                   <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-[28px] lg:rounded-[36px] ${s.color} text-white flex items-center justify-center mb-6 lg:mb-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-2 ring-white/10`}><DynamicIcon name={s.icon} className="w-8 h-8 lg:w-12 lg:h-12" /></div>
                   <h3 className="font-black text-zinc-900 dark:text-white text-sm lg:text-xl mb-2 line-clamp-2 leading-tight tracking-tight font-display">{t(`subject_${s.id}`, userSettings.language)}</h3>
                   <div className="mt-2 w-0 group-hover:w-12 h-1 bg-indigo-500 rounded-full transition-all duration-500" />
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
