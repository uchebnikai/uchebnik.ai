
import React, { useState, useRef } from 'react';
// Added missing 'Users' import from lucide-react
import { Shield, MessageSquare, ArrowRight, School, GraduationCap, Briefcase, ArrowLeft, ArrowUpRight, Search, ImageIcon, Mic, MicOff, X, Menu, Landmark, Sparkles, BookOpen, Brain, Zap, CheckCircle2, Users } from 'lucide-react';
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
  session
}: WelcomeScreenProps) => {

    const [inputValue, setInputValue] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const startingTextRef = useRef('');

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

    return (
    <div className={`flex flex-col h-full w-full overflow-x-hidden items-center bg-transparent relative selection:bg-indigo-500/30`}>
      
      {homeView === 'landing' && (
        <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center">
            
            {/* Header / Navbar */}
            <nav className="w-full max-w-7xl flex items-center justify-between p-6 shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSidebarOpen(true)} 
                        className="lg:hidden p-2 text-zinc-500 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" />
                        <span className="font-display font-black text-xl tracking-tight hidden sm:inline">Uchebnik AI</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowAdminAuth(true)} className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors">
                        <Shield size={18} />
                    </button>
                    {!session && (
                        <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                            {t('enter', userSettings.language)}
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 py-12 md:py-24 items-center">
                <div className={`lg:col-span-7 flex flex-col items-start text-left ${SLIDE_RIGHT} duration-1000`}>
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

                <div className={`lg:col-span-5 relative ${ZOOM_IN} duration-1000 delay-300 hidden lg:block`}>
                    {/* Mockup / Visual Element */}
                    <div className="relative z-10 p-2 bg-white/20 dark:bg-black/20 backdrop-blur-3xl rounded-[48px] border border-white/20 shadow-2xl rotate-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-[40px] overflow-hidden aspect-[4/5] border border-white/10 shadow-inner p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-white/5 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-white overflow-hidden">
                                    <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-full h-full object-cover"/>
                                </div>
                                <span className="font-bold text-sm">Uchebnik AI</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl text-xs max-w-[80%]">Как да реша тази задача по физика?</div>
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl text-xs max-w-[85%] ml-auto">Разбира се! Първо нека намерим силата на триене чрез формулата...</div>
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl">
                                    <div className="w-full h-32 bg-indigo-500/10 rounded-xl border border-dashed border-indigo-500/30 flex items-center justify-center">
                                        <Zap size={24} className="text-indigo-500 animate-pulse"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Blobs */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/30 blur-[100px] rounded-full animate-pulse-slow" />
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full animate-pulse-slow delay-700" />
                </div>
            </section>

            {/* Quick Interactive Tool Section */}
            <section className="w-full max-w-4xl px-6 py-12 relative z-20">
                <div className={`bg-white/40 dark:bg-black/40 backdrop-blur-3xl p-4 md:p-6 rounded-[32px] md:rounded-[48px] border border-white/30 dark:border-white/10 shadow-2xl ${SLIDE_UP}`}>
                    <h3 className="text-center text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">{t('ask_anything', userSettings.language)}</h3>
                    
                    {selectedImages.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 px-2">
                            {selectedImages.map((img, i) => ( 
                                <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                                    <img src={img} className="h-20 w-20 rounded-2xl object-cover border-2 border-white dark:border-zinc-800 shadow-xl"/>
                                    <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative bg-white dark:bg-black/60 rounded-3xl p-2 flex items-center gap-2 shadow-inner border border-zinc-100 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                        <div className="flex items-center gap-1 pl-2">
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-2xl transition-colors">
                                <ImageIcon size={22} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                            
                            <button onClick={toggleListening} className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>
                                {isListening ? <MicOff size={22}/> : <Mic size={22}/>}
                            </button>
                        </div>

                        <div className="w-px h-8 bg-zinc-200 dark:bg-white/10 mx-2"></div>

                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('ask_anything', userSettings.language)}
                            className="flex-1 bg-transparent border-none outline-none px-2 py-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400"
                        />
                        
                        <button 
                            onClick={() => (inputValue.trim() || selectedImages.length > 0) && onQuickStart(inputValue, selectedImages)}
                            disabled={!inputValue.trim() && selectedImages.length === 0}
                            className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all active:scale-90 group"
                        >
                            <ArrowUpRight size={28} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                    <p className="text-center text-[11px] text-zinc-400 mt-4 font-medium opacity-70">
                        {t('ai_warning', userSettings.language)}
                    </p>
                </div>
            </section>

            {/* Paths Section */}
            <section className="w-full bg-transparent py-12 md:py-20 px-6 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4 tracking-tight">
                        {t('landing_path_title', userSettings.language)}
                    </h2>
                    <p className="text-zinc-400 text-center max-w-lg mb-10 text-lg">Изберете образователната степен, за да видите специализираните ни инструменти.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                        <button 
                            onClick={() => setHomeView('school_select')} 
                            className="group relative h-[400px] rounded-[56px] p-12 text-left bg-gradient-to-br from-indigo-600 to-indigo-800 overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="p-6 bg-white/20 rounded-[32px] w-fit backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
                                    <School size={56} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-none">{t('school', userSettings.language)}</h3>
                                    <p className="text-white/80 text-xl font-medium max-w-xs">{t('desc_student', userSettings.language)}</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                <GraduationCap size={240} />
                            </div>
                            <div className="absolute bottom-12 right-12 bg-white/20 p-4 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                                <ArrowRight size={32}/>
                            </div>
                        </button>

                        <button 
                            onClick={() => setHomeView('university_select')} 
                            className="group relative h-[400px] rounded-[56px] p-12 text-left bg-zinc-800 border border-white/5 overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] hover:bg-zinc-700/50"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="p-6 bg-emerald-500/10 text-emerald-500 rounded-[32px] w-fit border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Landmark size={56} />
                                </div>
                                <div>
                                    <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-none">{t('university', userSettings.language)}</h3>
                                    <p className="text-zinc-400 text-xl font-medium max-w-xs">{t('desc_uni_student', userSettings.language)}</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-12 opacity-5 text-white group-hover:scale-125 transition-transform duration-1000">
                                <Briefcase size={240} />
                            </div>
                            <div className="absolute bottom-12 right-12 bg-emerald-500/20 p-4 rounded-full text-emerald-500 backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all border border-emerald-500/20">
                                <ArrowRight size={32}/>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            <footer className="w-full py-16 bg-zinc-950 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-2">
                            <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" />
                            <span className="font-display font-black text-xl tracking-tight text-white">Uchebnik AI</span>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium text-center md:text-left max-w-xs">
                            Бъдещето на образованието в България, подкрепено от най-новите технологии.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-bold text-zinc-400">
                        <button onClick={() => setHomeView('about')} className="hover:text-white transition-colors">{t('about_us', userSettings.language)}</button>
                        <button onClick={() => setHomeView('contact')} className="hover:text-white transition-colors">{t('contact', userSettings.language)}</button>
                        <button onClick={() => setHomeView('terms')} className="hover:text-white transition-colors">{t('terms', userSettings.language)}</button>
                        <button onClick={() => setHomeView('privacy')} className="hover:text-white transition-colors">{t('privacy', userSettings.language)}</button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-600">
                    <p>&copy; {new Date().getFullYear()} Uchebnik AI. Всички права запазени.</p>
                    <p>Designed with ❤️ by Vanyo, Svetlyo & Bella.</p>
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
