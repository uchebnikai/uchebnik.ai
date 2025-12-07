import React, { useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, Slide, UserSettings, Session, UserPlan, UserRole } from './types';
import { SUBJECTS } from './constants';
import { generateResponse } from './services/geminiService';
import { supabase } from './supabaseClient';
import { Auth } from './components/auth/Auth';
import { 
  Loader2, X, AlertCircle, CheckCircle, Info
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
  const [homeView, setHomeView] = useState<'landing' | 'school_select' | 'student_subjects' | 'teacher_subjects'>('landing');

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

  // Data Loading Effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = session?.user?.id;
      const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';

      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      else setSessions([]);

      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) setUserSettings(JSON.parse(savedSettings));
      else {
          if (userId) {
             setUserSettings({
                userName: session?.user?.user_metadata?.full_name || '', 
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
          }
      }
      
      const savedPlan = localStorage.getItem(planKey);
      if (savedPlan) setUserPlan(savedPlan as UserPlan);
      else {
          if (!userId) {
              const oldPro = localStorage.getItem('uchebnik_pro_status');
              if (oldPro === 'unlocked') {
                  setUserPlan('pro');
                  localStorage.setItem('uchebnik_user_plan', 'pro');
              } else {
                  setUserPlan('free');
              }
          } else {
              setUserPlan('free'); 
          }
      }

      const savedAdminKeys = localStorage.getItem('uchebnik_admin_keys');
      if (savedAdminKeys) setGeneratedKeys(JSON.parse(savedAdminKeys));

      const today = new Date().toDateString();
      const lastUsageDate = localStorage.getItem('uchebnik_image_date');
      const lastUsageCount = localStorage.getItem('uchebnik_image_count');

      if (lastUsageDate !== today) {
          setDailyImageCount(0);
          localStorage.setItem('uchebnik_image_date', today);
          localStorage.setItem('uchebnik_image_count', '0');
      } else {
          setDailyImageCount(parseInt(lastUsageCount || '0'));
      }

      if (!savedSettings) {
         setIsDarkMode(true);
      }
    }
    
    const loadVoices = () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices(); };
    if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
    
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarOpen(true);
  }, [session]);

  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      try { localStorage.setItem(key, JSON.stringify(sessions)); } catch(e) { console.error("Session storage error", e); } 
  }, [sessions, session]);

  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      try { localStorage.setItem(key, JSON.stringify(userSettings)); } catch(e) { console.error("Settings storage error", e); } 
  }, [userSettings, session]);

  useEffect(() => {
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
      try { localStorage.setItem(key, userPlan); } catch(e) {}
  }, [userPlan, session]);

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  useEffect(() => {
    if(activeSessionId) {
      const s = sessions.find(s => s.id === activeSessionId);
      setMemoryUsage(s ? s.messages.reduce((acc, msg) => acc + (msg.text?.length || 0), 0) : 0);
    }
  }, [sessions, activeSessionId]);
  
  useEffect(() => { activeSubjectRef.current = activeSubject; if(activeSubject && isVoiceCallActive) endVoiceCall(); }, [activeSubject]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { isVoiceCallActiveRef.current = isVoiceCallActive; }, [isVoiceCallActive]);
  useEffect(() => { voiceCallStatusRef.current = voiceCallStatus; }, [voiceCallStatus]);
  useEffect(() => { loadingSubjectsRef.current = loadingSubjects; }, [loadingSubjects]);

  useEffect(() => {
    if (pendingHomeMessage && activeSubject?.id === SubjectId.GENERAL && activeSessionId) {
       handleSend(pendingHomeMessage);
       setPendingHomeMessage(null);
    }
  }, [activeSubject, activeSessionId, pendingHomeMessage]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId, isImageProcessing, showSubjectDashboard]);

  useEffect(() => {
    voiceMutedRef.current = voiceMuted;
    if (isVoiceCallActive) {
      if (voiceMuted) {
         if (voiceCallStatus === 'listening') {
             voiceCallRecognitionRef.current?.stop();
         }
      } else {
         if (voiceCallStatus === 'listening' || voiceCallStatus === 'idle') {
             startVoiceRecognition();
         }
      }
    }
  }, [voiceMuted, isVoiceCallActive]);

  useEffect(() => {
    if (isVoiceCallActive) {
      setVoiceCallStatus('listening');
      startVoiceRecognition();
    }
  }, [isVoiceCallActive]);

  // --- Logic Helpers ---
  const checkImageLimit = (count = 1): boolean => {
      let limit = 4;
      if (userPlan === 'plus') limit = 12;
      if (userPlan === 'pro') limit = 9999;

      if (dailyImageCount + count > limit) {
          addToast(`Достигнахте лимита за изображения за деня (${limit}). Ъпгрейднете плана си за повече.`, 'error');
          return false;
      }
      return true;
  };

  const incrementImageCount = (count = 1) => {
      const newCount = dailyImageCount + count;
      setDailyImageCount(newCount);
      localStorage.setItem('uchebnik_image_count', newCount.toString());
  };

  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
  
  const createNewSession = (subjectId: SubjectId, role?: UserRole, initialMode?: AppMode) => {
    const greetingName = userSettings.userName ? `, ${userSettings.userName}` : '';
    let welcomeText = "";
    const subjectName = SUBJECTS.find(s => s.id === subjectId)?.name;

    const getModeName = (m: AppMode) => {
        switch(m) {
            case AppMode.SOLVE: return "Решаване";
            case AppMode.LEARN: return "Учене";
            case AppMode.TEACHER_TEST: return "Тест";
            case AppMode.TEACHER_PLAN: return "План";
            case AppMode.TEACHER_RESOURCES: return "Ресурси";
            case AppMode.DRAW: return "Рисуване";
            case AppMode.PRESENTATION: return "Презентация";
            case AppMode.CHAT: return "Чат";
            default: return "Чат";
        }
    };

    let sessionBaseName = subjectName;
    if (initialMode) {
        sessionBaseName = getModeName(initialMode);
    }
    
    const existingCount = sessions.filter(s => s.subjectId === subjectId && s.role === (role || userRole || undefined) && s.mode === initialMode).length;
    
    const sessionTitle = subjectId === SubjectId.GENERAL 
        ? `Общ Чат #${existingCount + 1}`
        : `${sessionBaseName} #${existingCount + 1}`;

    const newSession: Session = {
      id: crypto.randomUUID(), 
      subjectId, 
      title: sessionTitle, 
      createdAt: Date.now(), 
      lastModified: Date.now(), 
      preview: 'Начало', 
      messages: [], 
      role: role || userRole || undefined,
      mode: initialMode
    };

    if (subjectId === SubjectId.GENERAL) {
        welcomeText = `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!`;
    } else {
        if (role === 'teacher') {
             welcomeText = `Здравейте, колега! Аз съм Вашият AI асистент по **${subjectName}**. Как мога да Ви съдействам?`;
        } else {
             welcomeText = `Здравей${greetingName}! Аз съм твоят помощник по **${subjectName}**.`;
        }
    }

    newSession.messages.push({
        id: 'welcome-' + Date.now(), role: 'model', timestamp: Date.now(),
        text: welcomeText
    });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleUpdateAccount = async () => {
      try {
          const updates: any = {
              data: {
                  first_name: editProfile.firstName,
                  last_name: editProfile.lastName,
                  full_name: `${editProfile.firstName} ${editProfile.lastName}`.trim(),
                  avatar_url: editProfile.avatar
              }
          };

          const isEmailChange = editProfile.email !== session?.user?.email;
          const isPasswordChange = !!editProfile.password;

          if (isEmailChange || isPasswordChange) {
              if (!editProfile.currentPassword) {
                  addToast('Моля, въведете текущата си парола, за да запазите промените по акаунта.', 'error');
                  return;
              }
              const { error: signInError } = await supabase.auth.signInWithPassword({
                  email: session?.user?.email || '',
                  password: editProfile.currentPassword
              });
              if (signInError) {
                  addToast('Грешна текуща парола.', 'error');
                  return;
              }
          }

          if (isEmailChange) { updates.email = editProfile.email; }
          if (isPasswordChange) { updates.password = editProfile.password; }

          const { error } = await supabase.auth.updateUser(updates, { emailRedirectTo: window.location.origin });
          if (error) throw error;

          setUserMeta({ firstName: editProfile.firstName, lastName: editProfile.lastName, avatar: editProfile.avatar });
          setUserSettings(prev => ({...prev, userName: updates.data.full_name}));
          
          let successMessage = 'Профилът е обновен успешно!';
          if (isEmailChange) { successMessage += ' Моля, проверете имейла си за потвърждение на промяната.'; }
          
          setEditProfile(prev => ({ ...prev, password: '', currentPassword: '' }));
          addToast(successMessage, 'success');
      } catch (error: any) {
          addToast(error.message || 'Грешка при обновяване на профила.', 'error');
      }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resized = await resizeImage(file);
              setEditProfile(prev => ({ ...prev, avatar: resized }));
          } catch (err) {
              addToast('Грешка при качване на снимка', 'error');
          }
      }
  };

  const handleSubjectChange = (subject: SubjectConfig, role?: UserRole) => {
    const targetRole = role || userRole;
    if (activeSubject?.id === subject.id && !showSubjectDashboard && userRole === targetRole) { 
        if (window.innerWidth < 1024) setSidebarOpen(false); 
        return; 
    }

    if (unreadSubjects.has(subject.id)) { 
        const newUnread = new Set(unreadSubjects); newUnread.delete(subject.id); setUnreadSubjects(newUnread); 
    }
    
    if (role) setUserRole(role);

    if (subject.id === SubjectId.GENERAL) {
        setActiveSubject(subject);
        setActiveMode(AppMode.CHAT);
        setShowSubjectDashboard(false);
        setUserRole(null);
    } else {
        setActiveSubject(subject);
        setShowSubjectDashboard(true);
    }
    
    setInputValue(''); 
    setSelectedImages([]); 
    setIsImageProcessing(false); 
    setReplyingTo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (subject.id === SubjectId.GENERAL) {
        const subSessions = sessions.filter(s => s.subjectId === subject.id).sort((a, b) => b.lastModified - a.lastModified);
        if (subSessions.length > 0) setActiveSessionId(subSessions[0].id); else createNewSession(subject.id);
    } else {
        setActiveSessionId(null);
    }

    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleStartMode = (mode: AppMode) => {
      if (!activeSubject) return;
      setActiveMode(mode);
      setShowSubjectDashboard(false);
      
      const relevantSessions = sessions.filter(s => s.subjectId === activeSubject.id && s.role === userRole && s.mode === mode).sort((a, b) => b.lastModified - a.lastModified);
      if (relevantSessions.length > 0) {
          setActiveSessionId(relevantSessions[0].id);
      } else {
          createNewSession(activeSubject.id, userRole || undefined, mode);
      }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    if (!session) {
        setShowAuthModal(true);
        return;
    }

    const currentSubject = activeSubjectRef.current;
    const currentSessionId = activeSessionIdRef.current;
    const currentMode = activeModeRef.current;
    const currentSessionsList = sessionsRef.current;
    const currentLoading = loadingSubjectsRef.current;

    const textToSend = overrideText || inputValue;
    
    if ((!textToSend.trim() && selectedImages.length === 0 && (!overrideImages || overrideImages.length === 0)) || !currentSubject || !currentSessionId) return;
    
    if (currentLoading[currentSubject.id]) return;

    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    const currentSubId = currentSubject.id;
    const currentImgs = overrideImages || [...selectedImages];
    const sessId = currentSessionId;

    if (currentImgs.length > 0 && !checkImageLimit(currentImgs.length)) {
        return;
    }

    const replyContext = replyingTo;
    setReplyingTo(null);

    const newUserMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: textToSend, 
        images: currentImgs, 
        timestamp: Date.now(),
        replyToId: replyContext?.id
    };

    setSessions(prev => prev.map(s => {
        if (s.id === sessId) {
            return { ...s, messages: [...s.messages, newUserMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50), role: userRole || undefined };
        }
        return s;
    }));

    setInputValue(''); setSelectedImages([]); if(fileInputRef.current) fileInputRef.current.value = '';
    setLoadingSubjects(prev => ({ ...prev, [currentSubId]: true }));

    let finalPrompt = textToSend;
    if (replyContext) {
        const snippet = replyContext.text.substring(0, 300) + (replyContext.text.length > 300 ? '...' : '');
        const roleName = replyContext.role === 'user' ? 'User' : 'Assistant';
        finalPrompt = `[Replying to ${roleName}'s message: "${snippet}"]\n\n${textToSend}`;
    }

    if (userSettings.responseLength === 'concise') finalPrompt += " (Short answer)"; else finalPrompt += " (Detailed answer)";
    if (userSettings.creativity === 'strict') finalPrompt += " (Strict)"; else if (userSettings.creativity === 'creative') finalPrompt += " (Creative)";
    
    try {
      const sessionMessages = currentSessionsList.find(s => s.id === sessId)?.messages || [];
      const historyForAI = [...sessionMessages, newUserMsg];

      let preferredModel = userSettings.preferredModel;
      
      if (preferredModel === 'auto' && userPlan === 'free') {
        preferredModel = 'gemini-2.5-flash';
      }
      if (preferredModel === 'gemini-3-pro-preview' && userPlan === 'free') {
        preferredModel = 'gemini-2.5-flash';
      }

      const response = await generateResponse(currentSubId, currentMode, finalPrompt, currentImgs, historyForAI, preferredModel);
      
      if (currentImgs.length > 0) {
          incrementImageCount(currentImgs.length);
      }

      setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'model', text: response.text, isError: response.isError, type: response.type as Message['type'], 
        slidesData: response.slidesData, testData: response.testData, chartData: response.chartData, geometryData: response.geometryData, images: response.images || [], timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, messages: [...s.messages, newAiMsg], lastModified: Date.now(), preview: response.text.substring(0, 50) } : s));

      if (activeSubjectRef.current?.id !== currentSubId) {
         setUnreadSubjects(prev => new Set(prev).add(currentSubId));
         if (userSettings.notifications) { 
             setNotification({ message: `Нов отговор: ${SUBJECTS.find(s => s.id === currentSubId)?.name}`, subjectId: currentSubId }); 
             setTimeout(() => setNotification(null), 4000); 
         }
      } else if (userSettings.notifications && userSettings.sound) {
         new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(()=>{});
      }
      return response.text;
    } catch (error) {
       console.error("HandleSend Error:", error);
       setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
       const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "Възникна грешка. Моля опитайте отново.", isError: true, timestamp: Date.now() };
       setSessions(prev => prev.map(s => s.id === sessId ? { ...s, messages: [...s.messages, errorMsg] } : s));
       return "Възникна грешка.";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session) {
        setShowAuthModal(true);
        e.target.value = '';
        return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      if (!checkImageLimit(files.length)) {
          e.target.value = '';
          return;
      }
      
      setIsImageProcessing(true);
      try {
        const processedImages = await Promise.all(
          Array.from(files).map(file => resizeImage(file as File))
        );
        setSelectedImages(prev => [...prev, ...processedImages]);
      } catch (err) {
        console.error("Image processing error", err);
        addToast("Грешка при обработката на изображението.", "error");
      } finally {
        setIsImageProcessing(false);
      }
      e.target.value = '';
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file);
        setUserSettings(prev => ({ ...prev, customBackground: resized }));
      } catch (err) {
        console.error("Background processing error", err);
        addToast("Грешка при обработката на фона.", "error");
      }
    }
    e.target.value = '';
  };

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }); };
  const handleDeleteMessage = (mId: string) => activeSessionId && setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.id !== mId) } : s));
  
  const handleShare = async (text: string) => {
    if (navigator.share) {
        try {
            await navigator.share({ text });
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        handleCopy(text, 'share-fallback');
        addToast('Текстът е копиран!', 'success');
    }
  };

  const deleteSession = (sId: string) => { 
    setConfirmModal({
      isOpen: true,
      title: 'Изтриване на чат',
      message: 'Сигурни ли сте, че искате да изтриете този чат? Това действие е необратимо.',
      onConfirm: () => {
        const nextSessions = sessionsRef.current.filter(s => s.id !== sId);
        setSessions(nextSessions); 
        if(sId === activeSessionIdRef.current) {
          const nextInSubject = nextSessions.find(s => s.subjectId === activeSubjectRef.current?.id);
          if(nextInSubject) setActiveSessionId(nextInSubject.id);
          else if (activeSubjectRef.current) {
               setActiveSessionId(null);
               setShowSubjectDashboard(true);
          }
          else setActiveSessionId(null);
        }
        setConfirmModal(null);
        addToast('Чатът е изтрит', 'success');
      }
    });
  };

  const renameSession = (sId: string, title: string) => { setSessions(prev => prev.map(s => s.id === sId ? { ...s, title } : s)); setRenameSessionId(null); };
  
  const handleClearMemory = () => {
    setConfirmModal({
        isOpen: true,
        title: 'Изчистване на паметта',
        message: 'Сигурни ли сте? Това ще изтрие историята на текущия чат.',
        onConfirm: () => {
             if (activeSessionIdRef.current && activeSubjectRef.current) {
                setSessions(prev => prev.map(s => {
                   if (s.id === activeSessionIdRef.current) {
                     const greetingName = userSettings.userName ? `, ${userSettings.userName}` : '';
                     let welcomeText = "";
                     const subjectName = SUBJECTS.find(sub=>sub.id === s.subjectId)?.name;
                     if(s.subjectId === SubjectId.GENERAL) {
                         welcomeText = `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!`;
                     } else {
                         if(s.role === 'teacher') {
                             welcomeText = `Здравейте, колега! Аз съм Вашият AI асистент по **${subjectName}**. Как мога да Ви съдействам?`;
                         } else {
                             welcomeText = `Здравей${greetingName}! Аз съм твоят помощник по **${subjectName}**.`;
                         }
                     }
                     return { ...s, messages: [{ id: 'reset-'+Date.now(), role: 'model', text: welcomeText, timestamp: Date.now() }] };
                   }
                   return s;
                }));
                addToast('Паметта е изчистена', 'success');
              }
             setConfirmModal(null);
        }
    });
  };

  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); 
    if(audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }

    let hasEnded = false;
    const safeOnEnd = () => {
        if(hasEnded) return;
        hasEnded = true;
        if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
        utteranceRef.current = null;
        if(onEnd) onEnd();
    };

    const estimatedDuration = Math.max(3000, (text.length / 10) * 1000 + 2000); 
    speakingTimeoutRef.current = setTimeout(() => {
        console.warn("Speech synthesis timed out, forcing next turn.");
        safeOnEnd();
    }, estimatedDuration);

    const clean = text.replace(/[*#`_\[\]]/g, '').replace(/\$\$.*?\$\$/g, 'формула').replace(/http\S+/g, '');
    let lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    
    if ((!v && lang.startsWith('bg')) || !window.speechSynthesis) {
        const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(clean)}&tl=${lang.split('-')[0]}`);
        audioRef.current = a; 
        a.onended = safeOnEnd;
        a.onerror = (e) => { console.error("Audio error", e); safeOnEnd(); };
        a.play().catch((e) => { console.error("Audio play error", e); safeOnEnd(); });
    } else {
        const u = new SpeechSynthesisUtterance(clean); 
        u.lang = lang; 
        if(v) u.voice = v; 
        utteranceRef.current = u;
        u.onend = safeOnEnd;
        u.onerror = (e) => { console.error("Speech Synthesis Error", e); utteranceRef.current = null; safeOnEnd(); }
        window.speechSynthesis.speak(u);
    }
  };
  const handleSpeak = (txt: string, id: string) => { if(speakingMessageId === id) { window.speechSynthesis.cancel(); if(audioRef.current) audioRef.current.pause(); setSpeakingMessageId(null); return; } setSpeakingMessageId(id); speakText(txt, () => setSpeakingMessageId(null)); };

  const startVoiceCall = () => { 
    if (!session) {
        setShowAuthModal(true);
        return;
    }
    setIsVoiceCallActive(true); 
  };
  
  const endVoiceCall = () => { 
      setIsVoiceCallActive(false); 
      setVoiceCallStatus('idle'); 
      voiceCallRecognitionRef.current?.stop(); 
      window.speechSynthesis.cancel(); 
      utteranceRef.current = null;
      if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
  };

  const startVoiceRecognition = () => {
     if (voiceMutedRef.current) {
        setVoiceCallStatus('idle');
        voiceCallStatusRef.current = 'idle';
        return;
     }

     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if(!SR) { addToast('Гласовото разпознаване не се поддържа.', 'error'); endVoiceCall(); return; }
     
     try { voiceCallRecognitionRef.current?.stop(); } catch(e) {}

     const rec = new SR();
     rec.lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
     rec.continuous = false;
     rec.interimResults = false;
     
     rec.onstart = () => { 
         if(voiceMutedRef.current) { rec.stop(); return; }
         setVoiceCallStatus('listening');
         voiceCallStatusRef.current = 'listening';
     };
     
     rec.onresult = async (e: any) => {
        if(voiceMutedRef.current) return;

        const t = e.results[0][0].transcript;
        if(t.trim()) {
           setVoiceCallStatus('processing'); 
           voiceCallStatusRef.current = 'processing';
           
           const res = await handleSend(t);
           
           if(res) { 
               setVoiceCallStatus('speaking'); 
               voiceCallStatusRef.current = 'speaking';
               speakText(res, () => { 
                   if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } 
               }); 
           } else { 
               if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } 
           }
        }
     };
     
     rec.onend = () => { 
         if(isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) {
             try { rec.start(); } catch(e){} 
         } 
     };
     rec.onerror = (e: any) => {
        if(e.error === 'no-speech' && isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) {
            try { rec.start(); } catch(e){} 
        } else { console.log("Recognition error", e.error); }
     }

     voiceCallRecognitionRef.current = rec; 
     try { rec.start(); } catch(e) { console.error(e); }
  };

  const toggleListening = () => {
    if (!session) {
        setShowAuthModal(true);
        return;
    }
    if(isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) { addToast('Няма поддръжка.', 'error'); return; }
    const rec = new SR();
    rec.lang = activeSubject?.id === SubjectId.ENGLISH ? 'en-US' : activeSubject?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
    rec.interimResults = true; rec.continuous = true;
    startingTextRef.current = inputValue;
    rec.onresult = (e: any) => {
        let f = '', inter = '';
        for(let i=e.resultIndex; i<e.results.length; ++i) e.results[i].isFinal ? f+=e.results[i][0].transcript : inter+=e.results[i][0].transcript;
        setInputValue((startingTextRef.current + ' ' + f + inter).trim());
    };
    rec.onstart = () => setIsListening(true); rec.onend = () => setIsListening(false);
    rec.onerror = (e: any) => { if(e.error === 'service-not-allowed') addToast('Гласовата услуга е недостъпна.', 'error'); setIsListening(false); };
    recognitionRef.current = rec; rec.start();
  };

  const handleRate = (messageId: string, rating: 'up' | 'down') => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) { return { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, rating } : m) }; }
      return s;
    }));
  };

  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };
  
  const handleUnlockSubmit = () => {
    const key = unlockKeyInput.trim();
    if (isValidKey(key)) {
       const newPlan = targetPlan || 'pro';
       setUserPlan(newPlan);
       if (newPlan !== 'free') {
            setUserSettings(prev => ({ ...prev, preferredModel: 'gemini-3-pro-preview' }));
       }
       setShowUnlockModal(false);
       setUnlockKeyInput('');
       addToast(`Успешно активирахте план ${newPlan.toUpperCase()}!`, 'success');
    } else {
       addToast("Невалиден ключ.", 'error');
    }
  };

  const handleAdminLogin = () => {
    if (adminPasswordInput === "VS09091615!") {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setAdminPasswordInput('');
      addToast("Успешен вход в админ панела", 'success');
    } else {
      addToast("Грешна парола!", 'error');
    }
  };

  const generateKey = () => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
    const checksum = generateChecksum(randomCore);
    const newKeyCode = `UCH-${randomCore}-${checksum}`;
    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false };
    const updatedKeys = [newKeyObj, ...generatedKeys];
    setGeneratedKeys(updatedKeys);
    localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
  };

  if (authLoading) {
    return (
       <div className="h-screen w-full flex items-center justify-center bg-black text-white">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
       </div>
    );
  }

  const isPremium = userPlan === 'plus' || userPlan === 'pro';

  return (
    <div className="flex h-screen w-full relative overflow-hidden text-gray-100 bg-zinc-950 font-sans">
      {/* Global Background Layer */}
      <div className="aurora-bg">
         <div className="aurora-orb orb-1"></div>
         <div className="aurora-orb orb-2"></div>
         <div className="aurora-orb orb-3"></div>
      </div>

      {/* User Custom Background Override */}
      {userSettings.customBackground && (
         <div 
           className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-700 opacity-60 mix-blend-overlay"
           style={getBackgroundImageStyle(userSettings.customBackground)}
         />
      )}
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => { if(e.target === e.currentTarget) setShowAuthModal(false) }}>
           <div className="relative w-full max-w-md">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white transition-colors"><X size={20}/></button>
              <Auth isModal={true} onSuccess={() => setShowAuthModal(false)} />
           </div>
        </div>
      )}

      {/* Floating Sidebar Container */}
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
        handleLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
        addToast={addToast}
        setShowSubjectDashboard={setShowSubjectDashboard}
        userRole={userRole}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden transition-all duration-300 z-10 lg:py-4 lg:pr-4">
        
        {/* Holographic Content Wrapper */}
        <div className="flex-1 flex flex-col relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <AdminPanel 
                showAdminAuth={showAdminAuth}
                setShowAdminAuth={setShowAdminAuth}
                showAdminPanel={showAdminPanel}
                setShowAdminPanel={setShowAdminPanel}
                adminPasswordInput={adminPasswordInput}
                setAdminPasswordInput={setAdminPasswordInput}
                handleAdminLogin={handleAdminLogin}
                generateKey={generateKey}
                generatedKeys={generatedKeys}
                addToast={addToast}
            />
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
                handleUpdateAccount={handleUpdateAccount}
                handleAvatarUpload={handleAvatarUpload}
                userSettings={userSettings}
                setUserSettings={setUserSettings}
                isPremium={isPremium}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                handleBackgroundUpload={handleBackgroundUpload}
                handleClearMemory={handleClearMemory}
            />
            <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
            
            <ConfirmModal 
                isOpen={!!confirmModal}
                title={confirmModal?.title || ''}
                message={confirmModal?.message || ''}
                onConfirm={confirmModal?.onConfirm || (() => {})}
                onCancel={() => setConfirmModal(null)}
            />

            {/* Dynamic View Rendering */}
            {!activeSubject ? (
                <WelcomeScreen 
                    homeView={homeView}
                    userMeta={userMeta}
                    userSettings={userSettings}
                    handleSubjectChange={(s) => handleSubjectChange(s)}
                    setHomeView={setHomeView}
                    setUserRole={setUserRole}
                    setShowAdminAuth={setShowAdminAuth}
                />
            ) : showSubjectDashboard ? (
                <SubjectDashboard 
                    activeSubject={activeSubject}
                    setActiveSubject={setActiveSubject}
                    setHomeView={setHomeView}
                    userRole={userRole}
                    userSettings={userSettings}
                    handleStartMode={handleStartMode}
                />
            ) : (
                <div className="flex-1 flex flex-col relative h-full">
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
                        setActiveSubject={setActiveSubject}
                    />
                    <VoiceCallOverlay 
                        isVoiceCallActive={isVoiceCallActive}
                        voiceCallStatus={voiceCallStatus}
                        voiceMuted={voiceMuted}
                        setVoiceMuted={setVoiceMuted}
                        endVoiceCall={endVoiceCall}
                        activeSubject={activeSubject}
                    />

                    <MessageList 
                        currentMessages={currentMessages}
                        userSettings={userSettings}
                        setZoomedImage={setZoomedImage}
                        handleRate={handleRate}
                        handleReply={handleReply}
                        handleSpeak={handleSpeak}
                        speakingMessageId={speakingMessageId}
                        handleCopy={handleCopy}
                        copiedId={copiedId}
                        handleShare={handleShare}
                        loadingSubject={!!loadingSubjects[activeSubject.id]}
                        activeSubject={activeSubject}
                        messagesEndRef={messagesEndRef}
                    />

                    <ChatInputArea 
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        userSettings={userSettings}
                        fileInputRef={fileInputRef}
                        loadingSubject={!!loadingSubjects[activeSubject.id]}
                        handleImageUpload={handleImageUpload}
                        toggleListening={toggleListening}
                        isListening={isListening}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        handleSend={() => handleSend()}
                        selectedImages={selectedImages}
                        handleRemoveImage={handleRemoveImage}
                    />
                </div>
            )}
        </div>
      </main>

      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${TOAST_CONTAINER} ${t.type === 'error' ? TOAST_ERROR : t.type === 'success' ? TOAST_SUCCESS : TOAST_INFO}`}>
             {t.type === 'error' ? <AlertCircle size={20}/> : t.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>}
             <span className="font-semibold text-sm tracking-wide">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};