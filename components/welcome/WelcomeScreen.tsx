
import React, { useState, useRef } from 'react';
import { Shield, MessageSquare, ArrowRight, School, GraduationCap, Briefcase, ArrowLeft, ArrowUpRight, Search, ImageIcon, Camera, Mic, MicOff, X, Menu } from 'lucide-react';
import { SubjectConfig, UserRole, UserSettings, HomeViewType, SubjectId } from '../../types';
import { SUBJECTS } from '../../constants';
import { DynamicIcon } from '../ui/DynamicIcon';
import { ZOOM_IN, SLIDE_UP, FADE_IN } from '../../animations/transitions';
import { getStaggeredDelay } from '../../animations/utils';
import { CameraModal } from '../ui/CameraModal';
import { resizeImage } from '../../utils/image';

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
  setSidebarOpen
}: WelcomeScreenProps) => {

    const [inputValue, setInputValue] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showCamera, setShowCamera] = useState(false);
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

    const handleCameraCapture = (base64Image: string) => {
        setSelectedImages(prev => [...prev, base64Image]);
        setShowCamera(false);
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
            alert('Гласовото разпознаване не се поддържа от този браузър.');
            return;
        }

        // Clean up any existing instance
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            try { recognitionRef.current.stop(); } catch(e){}
        }

        const rec = new SR();
        rec.lang = 'bg-BG'; 
        rec.interimResults = true;
        rec.continuous = false; // Important for mobile browsers
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
    <div className={`flex flex-col h-full w-full overflow-hidden items-center bg-transparent relative`}>
      
      {showCamera && (
          <CameraModal 
              onClose={() => setShowCamera(false)}
              onCapture={handleCameraCapture}
          />
      )}

      {homeView === 'landing' && (
        <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center">
            <div className={`w-full max-w-5xl flex-1 flex flex-col items-center justify-center relative z-10 ${ZOOM_IN} duration-700 min-h-min py-8`}>
            
            <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden absolute top-0 left-0 p-2 text-zinc-500 hover:text-indigo-500 transition-colors z-50 bg-white/20 dark:bg-black/20 rounded-xl backdrop-blur-md border border-white/10"
            >
                <Menu size={20} />
            </button>

            <button onClick={() => setShowAdminAuth(true)} className="absolute top-0 right-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors z-50">
                <Shield size={16} />
            </button>

            <div className="text-center mb-6 md:mb-10 space-y-3 px-2 w-full mt-4 md:mt-0 shrink-0">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-indigo-500/20 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 backdrop-blur-xl shadow-lg">
                    <img src="/logo.png" className="w-5 h-5 object-contain rounded-md" alt="Logo" />
                    <span>AI Учебен Асистент 2.0</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 tracking-tighter leading-[1.1] md:leading-[1] font-display">
                Здравей{userMeta.firstName ? `, ${userMeta.firstName}` : ''}.
                </h1>
                <p className="text-base md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed px-4">Твоят интелигентен помощник за училище.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-2 md:px-12 max-w-4xl mb-6 md:mb-10 shrink-0">
                <button onClick={() => handleSubjectChange(SUBJECTS[0])} className="group relative h-48 sm:h-64 md:h-80 rounded-[28px] md:rounded-[40px] p-6 md:p-10 text-left bg-zinc-900/80 dark:bg-black/60 backdrop-blur-xl text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out overflow-hidden ring-1 ring-white/10 hover:ring-indigo-500/30 flex flex-col justify-between shrink-0">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="bg-white/10 w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center backdrop-blur-md"><MessageSquare size={20} className="md:w-8 md:h-8" /></div>
                    <div><h3 className="text-2xl md:text-5xl font-bold tracking-tight mb-1 md:mb-3">Общ Чат</h3><p className="opacity-70 text-sm md:text-lg font-medium">Попитай каквото и да е.</p></div>
                    <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm bg-white/20 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">Старт <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-accent-500 blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                </button>

                <button onClick={() => setHomeView('school_select')} className="group relative h-48 sm:h-64 md:h-80 rounded-[28px] md:rounded-[40px] p-6 md:p-10 text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between shrink-0">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="bg-indigo-500/10 w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"><School size={20} className="md:w-8 md:h-8" /></div>
                    <div><h3 className="text-2xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1 md:mb-3">Училище</h3><p className="text-zinc-500 mt-0.5 md:mt-2 text-sm md:text-lg font-medium">Ученици и Учители</p></div>
                    <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm text-zinc-600 dark:text-zinc-300 bg-black/5 dark:bg-white/5 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">Влез <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
                </div>
                </button>
            </div>

            <div className="w-full max-w-2xl px-2 md:px-4 relative z-20 mb-4 md:mb-8 shrink-0">
                {selectedImages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                        {selectedImages.map((img, i) => ( 
                            <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                                <img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg"/>
                                <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-[28px] transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/30 bg-white/60 dark:bg-black/40 p-1.5 md:p-2 flex items-center gap-1 md:gap-2">
                    <div className="flex items-center gap-0.5 pl-1 shrink-0">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors" title="Добави снимка">
                            <ImageIcon size={18} className="md:w-5 md:h-5" strokeWidth={2}/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                        
                        <button onClick={() => setShowCamera(true)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors" title="Сканирай">
                            <Camera size={18} className="md:w-5 md:h-5" strokeWidth={2}/>
                        </button>
                        
                        <button onClick={toggleListening} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-white/10'}`} title="Гласово въвеждане">
                            {isListening ? <MicOff size={18} className="md:w-5 md:h-5"/> : <Mic size={18} className="md:w-5 md:h-5" strokeWidth={2}/>}
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1 shrink-0"></div>

                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Попитай нещо..."
                        className="flex-1 bg-transparent border-none outline-none px-1 md:px-2 py-3 text-sm md:text-base text-zinc-900 dark:text-white placeholder-gray-500 min-w-0"
                    />
                    
                    <button 
                        onClick={() => (inputValue.trim() || selectedImages.length > 0) && onQuickStart(inputValue, selectedImages)}
                        disabled={!inputValue.trim() && selectedImages.length === 0}
                        className="flex-none w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 shrink-0"
                    >
                        <ArrowUpRight size={20} className="md:w-[22px]" strokeWidth={2.5}/>
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2 font-medium opacity-60">AI може да допуска грешки.</p>
            </div>

            <footer className="w-full py-4 text-center mt-auto pb-24 md:pb-4 shrink-0">
                <div className="flex flex-wrap justify-center gap-6 mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    <button onClick={() => setHomeView('about')} className="hover:text-indigo-500 transition-colors">За нас</button>
                    <button onClick={() => setHomeView('contact')} className="hover:text-indigo-500 transition-colors">Контакти</button>
                    <button onClick={() => setHomeView('terms')} className="hover:text-indigo-500 transition-colors">Общи условия</button>
                    <button onClick={() => setHomeView('privacy')} className="hover:text-indigo-500 transition-colors">Поверителност</button>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                    &copy; {new Date().getFullYear()} Uchebnik AI. Created by <a href="https://www.instagram.com/vanyoy/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">Vanyo</a> & <a href="https://www.instagram.com/s_ivanov6/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">Svetlyo</a>.
                </p>
            </footer>
            </div>
        </div>
      )}

      {homeView === 'school_select' && (
        <div className={`max-w-5xl w-full flex-1 flex flex-col items-center justify-center relative z-10 ${SLIDE_UP} duration-500 overflow-y-auto custom-scrollbar p-4 md:p-8`}>
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold z-20 m-4 md:m-8"><ArrowLeft size={20}/> Назад</button>
             <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-8 md:mb-12 tracking-tight mt-16 md:mt-0">Избери Роля</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 md:px-12">
                 <button onClick={() => { setHomeView('student_subjects'); setUserRole('student'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-indigo-600/90 backdrop-blur-xl text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-white/20 rounded-3xl w-fit backdrop-blur-md"><GraduationCap size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2">Ученик</h3><p className="opacity-80 font-medium text-lg">Помощ с уроци и задачи.</p></div>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-50 rounded-[40px]"/>
                 </button>

                 <button onClick={() => { setHomeView('teacher_subjects'); setUserRole('teacher'); }} className="group relative h-64 md:h-72 rounded-[40px] p-8 text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-3xl w-fit"><Briefcase size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white">Учител</h3><p className="text-zinc-500 font-medium text-lg">Тестове, планове и ресурси.</p></div>
                     </div>
                 </button>
             </div>
        </div>
      )}

      {(homeView === 'student_subjects' || homeView === 'teacher_subjects') && (
        <div className={`max-w-7xl w-full py-4 md:py-12 px-2 md:px-4 ${SLIDE_UP} fade-in duration-500 relative z-10 overflow-y-auto custom-scrollbar flex-1`}>
           <button onClick={() => setHomeView('school_select')} className="mb-6 md:mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold group sticky top-0 bg-background/50 backdrop-blur-md py-2 z-20 w-fit rounded-full pr-4"><div className="p-2 md:p-3 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div> Назад към роли</button>
           <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight px-2">{homeView === 'student_subjects' ? 'Ученик' : 'Учител'} • Предмети</h2>
           <p className="text-gray-500 px-2 mb-8 md:mb-10 font-medium">Избери предмет, за да започнеш.</p>

           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={getStaggeredDelay(i)} className={`group flex flex-col items-center text-center p-4 md:p-8 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[24px] md:rounded-[32px] border border-white/30 dark:border-white/10 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 ${FADE_IN} fill-mode-backwards`}>
                   <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl ${s.color} text-white flex items-center justify-center mb-3 md:mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}><DynamicIcon name={s.icon} className="w-6 h-6 md:w-10 md:h-10" /></div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-sm md:text-xl mb-1 md:mb-2">{s.name}</h3>
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
