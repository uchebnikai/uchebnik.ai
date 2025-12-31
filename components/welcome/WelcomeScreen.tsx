
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
        // Restrict to exactly 1 interaction in the mockup
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
        
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

    // --- LOGGED IN DASHBOARD VIEW ---
    if (session && homeView === 'landing') {
        const greetingName = userSettings.userName ? userSettings.userName.split(' ')[0] : 'Uchebnik';

        return (
            <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col relative">
                <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 w-full max-w-7xl mx-auto min-h-[calc(100vh-140px)]">
                    
                    {/* Greeting */}
                    <div className="text-center mb-10 lg:mb-14 animate-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-5xl lg:text-7xl font-black text-zinc-900 dark:text-white tracking-tight mb-4 font-display drop-shadow-xl">
                            {t('hello', userSettings.language)}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-white">{greetingName}</span>.
                        </h1>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                            {t('subtitle', userSettings.language)}
                        </p>
                    </div>

                    {/* Navigation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-14">
                        <button 
                            onClick={() => handleSubjectChange(SUBJECTS[0])}
                            className="group relative bg-[#121214]/60 hover:bg-[#18181b]/80 border border-white/5 hover:border-indigo-500/30 rounded-[32px] p-8 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl backdrop-blur-md text-left flex flex-col items-start h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                            <div className="w-14 h-14 bg-white/5 text-indigo-300 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <MessageSquare size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('chat_general', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-sm font-medium mb-8 flex-1">Попитай ме каквото и да е за училище или университет.</p>
                            <div className="px-6 py-2.5 bg-white/5 hover:bg-indigo-500 text-zinc-300 hover:text-white rounded-full font-bold text-xs flex items-center gap-2 transition-all group-hover:pl-8 border border-white/5 self-start">
                                {t('start', userSettings.language)} <ArrowRight size={14} />
                            </div>
                        </button>

                        <button 
                            onClick={() => setHomeView('school_select')}
                            className="group relative bg-[#121214]/60 hover:bg-[#18181b]/80 border border-white/5 hover:border-blue-500/30 rounded-[32px] p-8 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl backdrop-blur-md text-left flex flex-col items-start h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                            <div className="w-14 h-14 bg-white/5 text-blue-300 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <School size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('school', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-sm font-medium mb-8 flex-1">{t('students', userSettings.language)} & {t('teachers', userSettings.language)}</p>
                            <div className="px-6 py-2.5 bg-white/5 hover:bg-blue-600 text-zinc-300 hover:text-white rounded-full font-bold text-xs flex items-center gap-2 transition-all group-hover:pl-8 border border-white/5 self-start">
                                {t('enter', userSettings.language)} <ArrowRight size={14} />
                            </div>
                        </button>

                        <button 
                            onClick={() => setHomeView('university_select')}
                            className="group relative bg-[#121214]/60 hover:bg-[#18181b]/80 border border-white/5 hover:border-emerald-500/30 rounded-[32px] p-8 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl backdrop-blur-md text-left flex flex-col items-start h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                            <div className="w-14 h-14 bg-white/5 text-emerald-300 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <Landmark size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('university', userSettings.language)}</h3>
                            <p className="text-zinc-500 text-sm font-medium mb-8 flex-1">{t('uni_students', userSettings.language)} & {t('uni_professors', userSettings.language)}</p>
                            <div className="px-6 py-2.5 bg-white/5 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded-full font-bold text-xs flex items-center gap-2 transition-all group-hover:pl-8 border border-white/5 self-start">
                                {t('enter', userSettings.language)} <ArrowRight size={14} />
                            </div>
                        </button>
                    </div>

                    {/* Quick Input Bar */}
                    <div className="w-full max-w-2xl relative z-20">
                        {selectedImages.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 px-2 justify-center">
                                {selectedImages.map((img, i) => ( 
                                    <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                                        <img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white/10 shadow-lg"/>
                                        <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative bg-[#09090b]/80 border border-white/10 rounded-full p-2 pl-5 flex items-center gap-3 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 backdrop-blur-xl">
                            <div className="flex items-center gap-1">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                    <ImageIcon size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                                <button onClick={toggleListening} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}>
                                    {isListening ? <MicOff size={20}/> : <Mic size={20} strokeWidth={2}/>}
                                </button>
                            </div>
                            <div className="w-px h-6 bg-white/10"></div>
                            <input 
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('ask_anything', userSettings.language)}
                                className="flex-1 bg-transparent border-none outline-none py-3 text-base text-zinc-200 placeholder-zinc-600 font-medium"
                            />
                            <button 
                                onClick={() => (inputValue.trim() || selectedImages.length > 0) && onQuickStart(inputValue, selectedImages)}
                                disabled={!inputValue.trim() && selectedImages.length === 0}
                                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 disabled:opacity-30 disabled:bg-white/5 disabled:text-zinc-500 transition-all active:scale-95 shrink-0"
                            >
                                <ArrowUpRight size={20} />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium tracking-wide">
                            {t('ai_warning', userSettings.language)}
                        </p>
                    </div>
                </div>

                <div className="w-full py-8 flex flex-col items-center gap-6 border-t border-white/5 bg-black/20 backdrop-blur-sm mt-auto">
                    <div className="flex flex-wrap justify-center gap-8 text-xs font-bold text-zinc-500">
                        <button onClick={() => setHomeView('about')} className="hover:text-zinc-300 transition-colors">{t('about_us', userSettings.language)}</button>
                        <button onClick={() => setHomeView('contact')} className="hover:text-zinc-300 transition-colors">{t('contact', userSettings.language)}</button>
                        <button onClick={() => setHomeView('terms')} className="hover:text-zinc-300 transition-colors">{t('terms', userSettings.language)}</button>
                        <button onClick={() => setHomeView('privacy')} className="hover:text-zinc-300 transition-colors">{t('privacy', userSettings.language)}</button>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600">
                        <p>&copy; 2025 Uchebnik AI. Всички права запазени.</p>
                        <p>Designed with ❤️ by Vanyo, Светльо & Белла.</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- LOGGED OUT LANDING VIEW ---
    return (
    <div className={`flex flex-col h-full w-full items-center bg-transparent relative selection:bg-indigo-500/30 overflow-hidden`}>
      {homeView === 'landing' && (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center">
            
            <nav className="w-full flex items-center justify-between p-6 px-8 md:px-12 shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" />
                        <span className="font-display font-black text-xl tracking-tight hidden sm:inline">Uchebnik AI</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowAdminAuth(true)} className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors">
                        <Shield size={18} />
                    </button>
                    <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {t('enter', userSettings.language)}
                    </button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 px-8 md:px-12 py-12 md:py-20 lg:py-28 items-start lg:items-center relative">
                <div className={`lg:col-span-6 flex flex-col items-start text-left ${SLIDE_RIGHT} duration-1000 lg:mb-32`}>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] text-zinc-900 dark:text-white font-display mb-6">
                        {t('landing_hero_title', userSettings.language)}
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mb-10 leading-relaxed">
                        {t('landing_hero_desc', userSettings.language)}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => handleSubjectChange(SUBJECTS[0])} 
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
                        >
                            {t('landing_cta_main', userSettings.language)}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                        <div className="flex -space-x-3 items-center ml-2">
                            {[1,2,3,4].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?u=user${i}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 object-cover shadow-sm" />
                            ))}
                            <span className="pl-6 text-sm font-bold text-zinc-500">+100 ученици</span>
                        </div>
                    </div>
                </div>

                <div className={`lg:col-span-6 relative flex items-center justify-center gap-12 md:gap-28 ${ZOOM_IN} duration-1000 delay-300 hidden lg:flex lg:mb-40`}>
                    {/* PHONE MOCKUP */}
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

                            {/* CHAT CONTENT */}
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

                            {/* MOCK INPUT AREA */}
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
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 ${isMockDisabled ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600'}`}
                                >
                                    {isMockDisabled ? <ArrowRight size={16}/> : <Send size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* NEW: SIDE FEATURES GRID (Right of phone) */}
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
                    <p>Designed with ❤️ by Vanyo, Светльо & Белла.</p>
                </div>
            </footer>
        </div>
      )}

      {homeView === 'school_select' && (
        <div className={`max-w-5xl w-full flex-1 flex flex-col items-center justify-center relative z-10 ${SLIDE_UP} duration-500 overflow-y-auto custom-scrollbar p-4 md:p-8`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold z-20 m-4 md:m-8"><ArrowLeft size={20}/> {t('back', userSettings.language)}</button>
             <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-8 md:mb-12 tracking-tight mt-16 md:mt-0">{t('select_role', userSettings.language)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 md:px-12">
                 <button onClick={() => { setHomeView('student_subjects'); setUserRole('student'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-indigo-600/90 backdrop-blur-xl text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-white/20 rounded-3xl w-fit backdrop-blur-md group-hover:scale-110 transition-transform duration-300"><GraduationCap size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2">{t('role_student', userSettings.language)}</h3><p className="opacity-80 font-medium text-lg">{t('desc_student', userSettings.language)}</p></div>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-50 rounded-[40px]"/>
                 </button>
                 <button onClick={() => { setHomeView('teacher_subjects'); setUserRole('teacher'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-3xl w-fit group-hover:scale-110 transition-transform duration-300"><Briefcase size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white">{t('role_teacher', userSettings.language)}</h3><p className="text-zinc-500 font-medium text-lg">{t('desc_teacher', userSettings.language)}</p></div>
                     </div>
                 </button>
             </div>
        </div>
      )}

      {homeView === 'university_select' && (
        <div className={`max-w-5xl w-full flex-1 flex flex-col items-center justify-center relative z-10 ${SLIDE_UP} duration-500 overflow-y-auto custom-scrollbar p-4 md:p-8`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold z-20 m-4 md:m-8"><ArrowLeft size={20}/> {t('back', userSettings.language)}</button>
             <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-8 md:mb-12 tracking-tight mt-16 md:mt-0">{t('select_role_uni', userSettings.language)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 md:px-12">
                 <button onClick={() => { setHomeView('uni_student_subjects'); setUserRole('uni_student'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-emerald-600/90 backdrop-blur-xl text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-white/20 rounded-3xl w-fit backdrop-blur-md group-hover:scale-110 transition-transform duration-300"><GraduationCap size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2">{t('role_uni_student', userSettings.language)}</h3><p className="opacity-80 font-medium text-lg">{t('desc_uni_student', userSettings.language)}</p></div>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-50 rounded-[40px]"/>
                 </button>
                 <button onClick={() => { setHomeView('uni_teacher_subjects'); setUserRole('uni_teacher'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-gray-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 rounded-3xl w-fit group-hover:scale-110 transition-transform duration-300"><Briefcase size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white">{t('role_uni_professor', userSettings.language)}</h3><p className="text-zinc-500 font-medium text-lg">{t('desc_uni_professor', userSettings.language)}</p></div>
                     </div>
                 </button>
             </div>
        </div>
      )}

      {(homeView === 'student_subjects' || homeView === 'teacher_subjects' || homeView === 'uni_student_subjects' || homeView === 'uni_teacher_subjects') && (
        <div className={`max-w-7xl w-full py-4 md:py-12 px-2 md:px-4 ${SLIDE_UP} duration-500 relative z-10 overflow-y-auto custom-scrollbar flex-1`}>
           <button onClick={() => setHomeView(homeView.includes('uni') ? 'university_select' : 'school_select')} className="mb-6 md:mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold group sticky top-0 bg-background/50 backdrop-blur-md py-2 z-20 w-fit rounded-full pr-4"><div className="p-2 md:p-3 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div> {t('back_to_roles', userSettings.language)}</button>
           <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight px-2">
               {homeView === 'student_subjects' ? t('role_student', userSettings.language) : 
                homeView === 'teacher_subjects' ? t('role_teacher', userSettings.language) : 
                homeView === 'uni_student_subjects' ? t('role_uni_student', userSettings.language) : t('role_uni_professor', userSettings.language)} • {t('select_subject', userSettings.language)}
           </h2>
           <p className="text-gray-500 px-2 mb-8 md:mb-10 font-medium">{t('choose_subject', userSettings.language)}</p>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL && s.categories.includes(homeView.includes('uni') ? 'university' : 'school')).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={getStaggeredDelay(i)} className={`group flex flex-col items-center text-center p-4 md:p-8 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[24px] md:rounded-[32px] border border-white/30 dark:border-white/10 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 ${FADE_IN} fill-mode-backwards`}>
                   <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl ${s.color} text-white flex items-center justify-center mb-3 md:mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}><DynamicIcon name={s.icon} className="w-6 h-6 md:w-10 md:h-10" /></div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-sm md:text-xl mb-1 md:mb-2">{t(`subject_${s.id}`, userSettings.language)}</h3>
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
