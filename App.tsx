import React, { useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, Slide, UserSettings, Session, UserPlan, UserRole, HomeViewType } from './types';
import { SUBJECTS } from './constants';
import { generateResponse } from './services/aiService';
import { supabase } from './supabaseClient';
import { Auth } from './components/auth/Auth';
import { 
  Loader2, X, AlertCircle, CheckCircle, Info, Menu
} from 'lucide-react';

import { Session as SupabaseSession } from '@supabase/supabase-js';

// Utils
import { resizeImage } from './utils/image';
import { generateChecksum, isValidKey } from './utils/security';
import { useTheme } from './hooks/useTheme';
import { getBackgroundImageStyle } from './styles/utils';
import { TOAST_CONTAINER, TOAST_ERROR, TOAST_SUCCESS, TOAST_INFO } from './styles/ui';

// Components
import { Lightbox } from './components/ui/Lightbox';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { UpgradeModal } from './components/subscription/UpgradeModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { HistoryDrawer } from './components/history/HistoryDrawer';
import { VoiceCallOverlay } from './components/voice/VoiceCallOverlay';
import { Sidebar } from './components/layout/Sidebar';
import { SubjectDashboard } from './components/dashboard/SubjectDashboard';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { ChatInputArea } from './components/chat/ChatInputArea';
import { TermsOfService, PrivacyPolicy, CookiePolicy, About, Contact } from './components/pages/StaticPages';

interface GeneratedKey {
  code: string;
  isUsed: boolean;
}

export const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- State ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectConfig | null>(null);
  const [showSubjectDashboard, setShowSubjectDashboard] = useState(false); 
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.SOLVE);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [homeInputValue, setHomeInputValue] = useState('');
  const [pendingHomeMessage, setPendingHomeMessage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default Dark Mode
  const [showSettings, setShowSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Revised Home Views
  const [homeView, setHomeView] = useState<HomeViewType>('landing');

  const [memoryUsage, setMemoryUsage] = useState(0); 
  const MAX_MEMORY = 50000; 
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Profile State
  const [userMeta, setUserMeta] = useState({ firstName: '', lastName: '', avatar: '' });
  const [editProfile, setEditProfile] = useState({ firstName: '', lastName: '', avatar: '', email: '', password: '', currentPassword: '' });

  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Plans & Limits
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [dailyImageCount, setDailyImageCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  
  // Key Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [targetPlan, setTargetPlan] = useState<UserPlan | null>(null);

  // Voice State
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceMuted, setVoiceMuted] = useState(false);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    userName: '', 
    gradeLevel: '8-12', 
    textSize: 'normal', 
    haptics: true, 
    notifications: true, 
    sound: true, 
    reduceMotion: false, 
    responseLength: 'concise', 
    creativity: 'balanced', 
    languageLevel: 'standard', 
    preferredModel: 'auto',
    themeColor: '#6366f1',
    customBackground: null
  });
  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, subjectId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // --- Toast & Confirm State ---
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info'}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const addToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, {id, message, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const voiceCallRecognitionRef = useRef<any>(null);
  const startingTextRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const activeSubjectRef = useRef(activeSubject);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeModeRef = useRef(activeMode);
  const isVoiceCallActiveRef = useRef(isVoiceCallActive);
  const voiceMutedRef = useRef(voiceMuted);
  const voiceCallStatusRef = useRef(voiceCallStatus);
  const loadingSubjectsRef = useRef(loadingSubjects);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingTimeoutRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Effects ---

  // Auth Effect
  useEffect(() => {
    const syncProfile = (session: SupabaseSession | null) => {
        setSession(session);
        setAuthLoading(false);
        if (session) {
            setShowAuthModal(false);
        }
        if (session?.user?.user_metadata) {
            const meta = session.user.user_metadata;
            const firstName = meta.first_name || '';
            const lastName = meta.last_name || '';
            const avatar = meta.avatar_url || '';
            const email = session.user.email || '';
            
            setUserMeta({ firstName, lastName, avatar });
            setEditProfile({ firstName, lastName, avatar, email, password: '', currentPassword: '' });

            setUserSettings(prev => {
                const fullName = meta.full_name || `${firstName} ${lastName}`.trim();
                if (!prev.userName && fullName) return { ...prev, userName: fullName };
                return prev;
            });
        }
    };

    supabase.auth.getSession().then(({ data: { session } }) => syncProfile(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Loading Effect & Streak Logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = session?.user?.id;
      const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
      const streakKey = userId ? `uchebnik_streak_${userId}` : 'uchebnik_streak';
      const lastVisitKey = userId ? `uchebnik_last_visit_${userId}` : 'uchebnik_last_visit';

      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      else setSessions([]);

      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) setUserSettings(JSON.parse(savedSettings));

      const savedPlan = localStorage.getItem(planKey);
      if (savedPlan) setUserPlan(JSON.parse(savedPlan) as UserPlan);

      // Streak Logic
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem(lastVisitKey);
      const savedStreak = parseInt(localStorage.getItem(streakKey) || '0', 10);
      
      if (lastVisit !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastVisit === yesterday.toDateString()) {
              // Streak continues
              const newStreak = savedStreak + 1;
              setStreak(newStreak);
              localStorage.setItem(streakKey, newStreak.toString());
          } else {
              // Streak broken, reset to 1
              setStreak(1);
              localStorage.setItem(streakKey, '1');
          }
          localStorage.setItem(lastVisitKey, today);
      } else {
          setStreak(savedStreak);
      }
    }
  }, [session?.user?.id]); // Re-run when user ID changes (login/logout)

  // Persist Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = session?.user?.id;
      const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';

      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      localStorage.setItem(settingsKey, JSON.stringify(userSettings));
      localStorage.setItem(planKey, JSON.stringify(userPlan));
    }
  }, [sessions, userSettings, userPlan, session?.user?.id]);

  // Dark Mode
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  // Refs sync
  useEffect(() => {
    activeSubjectRef.current = activeSubject;
    sessionsRef.current = sessions;
    activeSessionIdRef.current = activeSessionId;
    activeModeRef.current = activeMode;
    isVoiceCallActiveRef.current = isVoiceCallActive;
    voiceMutedRef.current = voiceMuted;
    voiceCallStatusRef.current = voiceCallStatus;
    loadingSubjectsRef.current = loadingSubjects;
  }, [activeSubject, sessions, activeSessionId, activeMode, isVoiceCallActive, voiceMuted, voiceCallStatus, loadingSubjects]);

  // --- Handlers ---

  const handleSubjectChange = (subject: SubjectConfig, role: UserRole = 'student') => {
    setActiveSubject(subject);
    setUserRole(role);
    setHomeView('landing'); // Will be hidden by activeSubject check
    
    // Find last active session for this subject/role or create new
    const existingSession = sessions.find(s => s.subjectId === subject.id && s.role === role);
    if (existingSession) {
       setActiveSessionId(existingSession.id);
    } else {
       createNewSession(subject.id, role);
    }
    
    // Reset view specific states
    setSidebarOpen(false);
    setShowSubjectDashboard(true);
  };

  const createNewSession = (subjectId: SubjectId, role: UserRole = 'student', initialMode?: AppMode) => {
    const newSession: Session = {
      id: Date.now().toString(),
      subjectId,
      title: 'Нов разговор',
      createdAt: Date.now(),
      lastModified: Date.now(),
      messages: [],
      preview: 'Натисни за да започнеш...',
      role,
      mode: initialMode || AppMode.SOLVE
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveMode(initialMode || AppMode.SOLVE);
  };

  const updateSession = (sessionId: string, updater: (s: Session) => Session) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  };

  const deleteSession = (id: string) => {
      if (sessions.length <= 1) {
          addToast("Не може да изтриете единствената сесия.", 'error');
          return;
      }
      setConfirmModal({
          isOpen: true,
          title: "Изтриване на чат?",
          message: "Сигурни ли сте? Това действие е необратимо.",
          onConfirm: () => {
              const newSessions = sessions.filter(s => s.id !== id);
              setSessions(newSessions);
              if (activeSessionId === id) {
                  setActiveSessionId(newSessions[0]?.id || null);
              }
              setConfirmModal(null);
          }
      });
  };

  const renameSession = (id: string, newTitle: string) => {
      updateSession(id, s => ({...s, title: newTitle}));
      setRenameSessionId(null);
  };

  const handleStartMode = (mode: AppMode) => {
      setActiveMode(mode);
      setShowSubjectDashboard(false);
      // Ensure current session mode is updated
      if (activeSessionId) {
          updateSession(activeSessionId, s => ({...s, mode}));
      }
  };

  // --- Core Logic ---

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImages.length) || loadingSubjects[activeSubject?.id || '']) return;

    if (!activeSessionId && activeSubject) {
        // Should have been created by handleSubjectChange, but safety net
        createNewSession(activeSubject.id, userRole || 'student');
    }

    const currentSubId = activeSubject?.id || SubjectId.GENERAL;
    const currentSessionId = activeSessionIdRef.current;
    
    if (!currentSessionId) return;

    // Plan Limits
    if (userPlan === 'free' && selectedImages.length > 0) {
        if (dailyImageCount >= 4) {
            addToast("Достигнахте лимита за изображения (Free Plan).", 'error');
            setShowUnlockModal(true);
            return;
        }
        setDailyImageCount(prev => prev + selectedImages.length);
    }

    setLoadingSubjects(prev => ({...prev, [currentSubId]: true}));
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now(),
      images: selectedImages,
      replyToId: replyingTo?.id
    };

    setInputValue('');
    setSelectedImages([]);
    setReplyingTo(null);

    // Optimistic Update
    updateSession(currentSessionId, s => ({
        ...s,
        messages: [...s.messages, userMsg],
        lastModified: Date.now(),
        preview: userMsg.text.substring(0, 50) + '...'
    }));

    // Scroll to bottom
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // AI Call
    const sessionHistory = sessions.find(s => s.id === currentSessionId)?.messages || [];
    
    try {
        const aiMsg = await generateResponse(
            currentSubId,
            activeMode,
            userMsg.text,
            userMsg.images,
            sessionHistory, // History now includes text only usually, logic inside service handles image context
            userSettings.preferredModel
        );

        updateSession(currentSessionId, s => ({
            ...s,
            messages: [...s.messages, aiMsg],
            lastModified: Date.now(),
            preview: aiMsg.text.substring(0, 50) + '...'
        }));
        
        // Auto-title if it's the first exchange
        const currentSess = sessionsRef.current.find(s => s.id === currentSessionId);
        if (currentSess && currentSess.messages.length <= 2 && currentSess.title === 'Нов разговор') {
            // Simple heuristic or could ask AI for summary
            const newTitle = userMsg.text.substring(0, 20) || 'Разговор';
            renameSession(currentSessionId, newTitle);
        }

    } catch (err) {
        console.error(err);
        addToast("Възникна грешка при комуникацията с AI.", 'error');
    } finally {
        setLoadingSubjects(prev => ({...prev, [currentSubId]: false}));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       setIsImageProcessing(true);
       const newImages: string[] = [];
       for (let i = 0; i < e.target.files.length; i++) {
           try {
              const base64 = await resizeImage(e.target.files[i]);
              newImages.push(base64);
           } catch (err) {
              console.error(err);
              addToast("Грешка при обработка на изображение.", 'error');
           }
       }
       setSelectedImages(prev => [...prev, ...newImages]);
       setIsImageProcessing(false);
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Voice Logic (Simplified for brevity, assumes standard Web Speech API)
  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
              addToast("Браузърът не поддържа гласово разпознаване.", 'error');
              return;
          }
          const recognition = new SpeechRecognition();
          recognition.lang = 'bg-BG';
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognition.start();
          setIsListening(true);
          recognitionRef.current = recognition;
      }
  };

  const startVoiceCall = () => {
      setIsVoiceCallActive(true);
      setVoiceCallStatus('listening');
      // ... Implementation of full duplex voice loop would go here
      // For this demo, we just show overlay
  };
  
  const endVoiceCall = () => {
      setIsVoiceCallActive(false);
      setVoiceCallStatus('idle');
      voiceCallRecognitionRef.current?.stop();
      if (utteranceRef.current) window.speechSynthesis.cancel();
  };

  // TTS
  const handleSpeak = (text: string, id: string) => {
      if (speakingMessageId === id) {
          window.speechSynthesis.cancel();
          setSpeakingMessageId(null);
          return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'bg-BG';
      u.onend = () => setSpeakingMessageId(null);
      setSpeakingMessageId(id);
      window.speechSynthesis.speak(u);
      utteranceRef.current = u;
  };

  // Admin & Unlock
  const handleUnlockSubmit = () => {
      if (isValidKey(unlockKeyInput)) {
          setUserPlan(targetPlan || 'pro');
          addToast(`Успешно активирахте ${targetPlan || 'pro'} план!`, 'success');
          setShowUnlockModal(false);
          setUnlockKeyInput('');
      } else {
          addToast("Невалиден код.", 'error');
      }
  };

  const generateKey = () => {
      const core = Math.random().toString(36).substring(2, 10).toUpperCase();
      const checksum = generateChecksum(core);
      const code = `UCH-${core}-${checksum}`;
      setGeneratedKeys(prev => [{code, isUsed: false}, ...prev]);
  };
  
  // --- Render ---

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-indigo-500" size={40}/></div>;

  const currentSession = sessions.find(s => s.id === activeSessionId);
  
  return (
    <div className={`flex h-full text-foreground bg-background transition-colors duration-300 font-sans ${userSettings.textSize} relative overflow-hidden`}>
      
      {/* Modals & Overlays */}
      <UpgradeModal 
        showUnlockModal={showUnlockModal} 
        setShowUnlockModal={setShowUnlockModal}
        targetPlan={targetPlan}
        setTargetPlan={setTargetPlan}
        unlockKeyInput={unlockKeyInput}
        setUnlockKeyInput={setUnlockKeyInput}
        handleUnlockSubmit={handleUnlockSubmit}
        userPlan={userPlan}
      />

      <SettingsModal 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        userMeta={userMeta}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        handleUpdateAccount={async () => {/* Implement update */}}
        handleAvatarUpload={async (e) => {
            /* Basic implementation */
             if(e.target.files?.[0]) {
                 const base64 = await resizeImage(e.target.files[0]);
                 setEditProfile({...editProfile, avatar: base64});
                 setUserMeta({...userMeta, avatar: base64});
             }
        }}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        isPremium={userPlan !== 'free'}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        handleBackgroundUpload={async (e) => {
             if(e.target.files?.[0]) {
                 const base64 = await resizeImage(e.target.files[0]);
                 setUserSettings({...userSettings, customBackground: base64});
             }
        }}
        handleClearMemory={() => {
            if(activeSessionId) updateSession(activeSessionId, s => ({...s, messages: []}));
            setShowSettings(false);
            addToast("Паметта е изчистена.", 'success');
        }}
      />

      <HistoryDrawer 
        historyDrawerOpen={historyDrawerOpen}
        setHistoryDrawerOpen={setHistoryDrawerOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        renameSessionId={renameSessionId}
        setRenameSessionId={setRenameSessionId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        renameSession={renameSession}
        deleteSession={deleteSession}
        activeSubject={activeSubject}
        setActiveSubject={setActiveSubject as any}
      />

      <VoiceCallOverlay 
         isVoiceCallActive={isVoiceCallActive}
         voiceCallStatus={voiceCallStatus}
         voiceMuted={voiceMuted}
         setVoiceMuted={setVoiceMuted}
         endVoiceCall={endVoiceCall}
         activeSubject={activeSubject}
      />

      <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
      
      {confirmModal && (
          <ConfirmModal 
             isOpen={confirmModal.isOpen} 
             title={confirmModal.title} 
             message={confirmModal.message} 
             onConfirm={confirmModal.onConfirm} 
             onCancel={() => setConfirmModal(null)} 
          />
      )}

      {/* Admin Auth & Panel */}
      <AdminPanel 
         showAdminAuth={showAdminAuth}
         setShowAdminAuth={setShowAdminAuth}
         showAdminPanel={showAdminPanel}
         setShowAdminPanel={setShowAdminPanel}
         adminPasswordInput={adminPasswordInput}
         setAdminPasswordInput={setAdminPasswordInput}
         handleAdminLogin={() => {
             if(adminPasswordInput === 'admin123') { setShowAdminAuth(false); setShowAdminPanel(true); } 
             else addToast('Грешна парола', 'error');
         }}
         generateKey={generateKey}
         generatedKeys={generatedKeys}
         addToast={addToast}
      />
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none">
         {toasts.map(t => (
             <div key={t.id} className={`${TOAST_CONTAINER} ${t.type === 'error' ? TOAST_ERROR : t.type === 'success' ? TOAST_SUCCESS : TOAST_INFO}`}>
                 {t.type === 'error' ? <AlertCircle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : <Info size={18}/>}
                 <span className="text-sm font-medium">{t.message}</span>
             </div>
         ))}
      </div>

      {showAuthModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
             <div className="relative w-full max-w-md">
                 <button onClick={() => setShowAuthModal(false)} className="absolute -top-12 right-0 text-white/50 hover:text-white"><X size={24}/></button>
                 <Auth isModal onSuccess={() => {setShowAuthModal(false); addToast("Успешен вход!", 'success');}} />
             </div>
          </div>
      )}

      {/* --- Main Layout --- */}
      
      <Sidebar 
         sidebarOpen={sidebarOpen}
         setSidebarOpen={setSidebarOpen}
         userSettings={userSettings}
         userPlan={userPlan}
         activeSubject={activeSubject}
         setActiveSubject={setActiveSubject}
         setHomeView={setHomeView}
         setUserRole={setUserRole}
         handleSubjectChange={handleSubjectChange}
         activeSessionId={activeSessionId}
         setActiveSessionId={setActiveSessionId}
         sessions={sessions}
         deleteSession={deleteSession}
         createNewSession={createNewSession}
         unreadSubjects={unreadSubjects}
         activeMode={activeMode}
         userMeta={userMeta}
         session={session}
         setShowUnlockModal={setShowUnlockModal}
         setShowSettings={setShowSettings}
         handleLogout={async () => { await supabase.auth.signOut(); setSession(null); }}
         setShowAuthModal={setShowAuthModal}
         addToast={addToast}
         setShowSubjectDashboard={setShowSubjectDashboard}
         userRole={userRole}
         streak={streak}
      />

      <main 
        className="flex-1 flex flex-col relative h-full w-full overflow-hidden" 
        style={getBackgroundImageStyle(userSettings.customBackground)}
      >
        {userSettings.customBackground && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 pointer-events-none z-0" />}

        {/* Dynamic Content Switching */}
        {activeSubject ? (
            <>
               {showSubjectDashboard ? (
                  <SubjectDashboard 
                     activeSubject={activeSubject}
                     setActiveSubject={setActiveSubject}
                     setHomeView={setHomeView}
                     userRole={userRole}
                     userSettings={userSettings}
                     handleStartMode={handleStartMode}
                  />
               ) : (
                  <>
                     <ChatHeader 
                        setSidebarOpen={setSidebarOpen}
                        activeSubject={activeSubject}
                        userRole={userRole}
                        activeMode={activeMode}
                        startVoiceCall={startVoiceCall}
                        createNewSession={createNewSession}
                        setHistoryDrawerOpen={setHistoryDrawerOpen}
                        userSettings={userSettings}
                     />
                     <MessageList 
                        currentMessages={currentSession?.messages || []}
                        userSettings={userSettings}
                        setZoomedImage={setZoomedImage}
                        handleRate={(id, r) => {/*...*/}}
                        handleReply={setReplyingTo}
                        handleSpeak={handleSpeak}
                        speakingMessageId={speakingMessageId}
                        handleCopy={(text, id) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }}
                        copiedId={copiedId}
                        handleShare={() => {/*...*/}}
                        loadingSubject={loadingSubjects[activeSubject.id]}
                        activeSubject={activeSubject}
                        messagesEndRef={messagesEndRef}
                     />
                     <ChatInputArea 
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        userSettings={userSettings}
                        fileInputRef={fileInputRef}
                        loadingSubject={loadingSubjects[activeSubject.id]}
                        handleImageUpload={handleImageUpload}
                        toggleListening={toggleListening}
                        isListening={isListening}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        handleSend={handleSend}
                        selectedImages={selectedImages}
                        handleRemoveImage={handleRemoveImage}
                     />
                  </>
               )}
            </>
        ) : (
            <>
               <div className="lg:hidden absolute top-4 left-4 z-50">
                   <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-white/50 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-500"><Menu size={24}/></button>
               </div>
               
               {/* Static Pages Router */}
               {homeView === 'terms' && <TermsOfService onBack={() => setHomeView('landing')} userSettings={userSettings}/>}
               {homeView === 'privacy' && <PrivacyPolicy onBack={() => setHomeView('landing')} userSettings={userSettings}/>}
               {homeView === 'cookies' && <CookiePolicy onBack={() => setHomeView('landing')} userSettings={userSettings}/>}
               {homeView === 'about' && <About onBack={() => setHomeView('landing')} userSettings={userSettings}/>}
               {homeView === 'contact' && <Contact onBack={() => setHomeView('landing')} userSettings={userSettings}/>}
               
               {(homeView !== 'terms' && homeView !== 'privacy' && homeView !== 'cookies' && homeView !== 'about' && homeView !== 'contact') && (
                  <WelcomeScreen 
                     homeView={homeView}
                     userMeta={userMeta}
                     userSettings={userSettings}
                     handleSubjectChange={handleSubjectChange}
                     setHomeView={setHomeView}
                     setUserRole={setUserRole}
                     setShowAdminAuth={setShowAdminAuth}
                  />
               )}
            </>
        )}

      </main>
    </div>
  );
};