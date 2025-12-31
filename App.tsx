
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { SubjectConfig, SubjectId, AppMode, Message, Slide, UserSettings, Session, UserPlan, UserRole, HomeViewType } from './types';
import { SUBJECTS, VOICES, DEFAULT_VOICE } from './constants';
import { generateResponse } from './services/aiService';
import { createBlob as createAudioBlob } from './services/audioService'; 
import { supabase } from './supabaseClient';
import { Auth } from './components/auth/Auth';
import { AuthSuccess } from './components/auth/AuthSuccess';
import { 
  Loader2, X, AlertCircle, CheckCircle, Info, Minimize, Database, Radio, Gift
} from 'lucide-react';

import { Session as SupabaseSession } from '@supabase/supabase-js';

// Utils
import { resizeImage } from './utils/image';
import { generateChecksum, verifyAdminPassword, redeemKey, registerKeyInDb } from './utils/security';
import { saveSessionsToStorage, getSessionsFromStorage, saveSettingsToStorage, getSettingsFromStorage } from './utils/storage';
import { useTheme } from './hooks/useTheme';
import { getBackgroundImageStyle } from './styles/utils';
import { TOAST_CONTAINER, TOAST_ERROR, TOAST_SUCCESS, TOAST_INFO } from './styles/ui';
import { t } from './utils/translations';
import { calculateLevel, XP_PER_MESSAGE, XP_PER_IMAGE, XP_PER_VOICE, calculateXPWithBoost, generateDailyQuests, updateQuestProgress } from './utils/gamification';

// Components
import { Lightbox } from './components/ui/Lightbox';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { UpgradeModal } from './components/subscription/UpgradeModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ReferralModal } from './components/referrals/ReferralModal';
import { LeaderboardModal } from './components/gamification/LeaderboardModal';
import { DailyQuestsModal } from './components/gamification/DailyQuestsModal';
import { HistoryDrawer } from './components/history/HistoryDrawer';
import { VoiceCallOverlay } from './components/voice/VoiceCallOverlay';
import { Sidebar } from './components/layout/Sidebar';
import { SubjectDashboard } from './components/dashboard/SubjectDashboard';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { ChatInputArea } from './components/chat/ChatInputArea';
import { TermsOfService, PrivacyPolicy, CookiePolicy, About, Contact } from './components/pages/StaticPages';
import { Snowfall } from './components/ui/Snowfall';
import { ReportModal } from './components/support/ReportModal';
import { AdSenseContainer } from './components/ads/AdSenseContainer';
import { IosInstallPrompt } from './components/ui/IosInstallPrompt';

interface GeneratedKey {
  code: string;
  isUsed: boolean;
  plan?: 'plus' | 'pro';
}

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

const DEMO_RESPONSE = `Анализирах вашия въпрос и подготвих детайлно решение. За да разберете материята в дълбочина, трябва да разгледаме логическата структура на проблема. Ето първите стъпки от нашия анализ:

1. **Дефиниране на основните параметри**: Първата стъпка е да изолираме ключовите данни и да разберем контекста на запитването.
2. **Избор на методология**: Въз основа на темата, най-подходящият подход е прилагането на доказани научни принципи и логически изводи.
3. **Детайлно разписване**: Тук започваме със самото решаване, като преминаваме през всеки междинен етап за максимална яснота...

Uchebnik AI винаги предоставя пълно обяснение на логиката зад решението, за да можеш не просто да получиш отговора, но и да научиш материала. Влез в профила си, за да отключиш останалата част от това решение и да получиш достъп до всички функции!`;

export const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  
  const [isRemoteDataLoaded, setIsRemoteDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [syncErrorDetails, setSyncErrorDetails] = useState<string | null>(null);
  const [missingDbTables, setMissingDbTables] = useState(false);
  const [authSuccessType, setAuthSuccessType] = useState<'verification' | 'magiclink' | 'email_change' | 'generic' | null>(null);

  // --- State ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectConfig | null>(null);
  const [showSubjectDashboard, setShowSubjectDashboard] = useState(false); 
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.SOLVE);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  const [pendingHomeInput, setPendingHomeInput] = useState<{text: string, images: string[]} | null>(null);
  const [pendingChatInput, setPendingChatInput] = useState<{text: string, images: string[], subjectId: SubjectId, mode: AppMode} | null>(null);
  
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [showSettings, setShowSettings] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const [homeView, setHomeView] = useState<HomeViewType>('landing');

  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [userMeta, setUserMeta] = useState({ firstName: '', lastName: '', avatar: '' });
  const [editProfile, setEditProfile] = useState({ firstName: '', lastName: '', avatar: '', email: '', password: '', currentPassword: '' });

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [dailyImageCount, setDailyImageCount] = useState(0);
  
  // Token Stats
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  const [costCorrection, setCostCorrection] = useState(0);

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [targetPlan, setTargetPlan] = useState<UserPlan | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const [broadcastModal, setBroadcastModal] = useState<{isOpen: boolean, message: string} | null>(null);

  // Voice State
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceMuted, setVoiceMuted] = useState(false);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    userName: '', 
    textSize: 'normal', 
    haptics: true, 
    notifications: true, 
    sound: true, 
    responseLength: 'concise', 
    creativity: 'balanced', 
    languageLevel: 'standard', 
    preferredModel: 'auto',
    themeColor: '#6366f1',
    customBackground: null, 
    language: 'bg',
    teachingStyle: 'normal', 
    socraticMode: false,
    enterToSend: true,
    fontFamily: 'inter',
    customPersona: '',
    christmasMode: false,
    preferredVoice: DEFAULT_VOICE,
    referralCode: '',
    proExpiresAt: '',
    xp: 0,
    level: 1,
    dailyQuests: {
        date: new Date().toDateString(),
        quests: generateDailyQuests()
    }
  });

  const currentMessages = activeSessionId 
    ? sessions.find(s => s.id === activeSessionId)?.messages || [] 
    : [];

  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, subjectId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [focusMode, setFocusMode] = useState(false);

  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info'}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const addToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, {id, message, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const closeAuthModal = () => {
      setShowAuthModal(false);
      setTimeout(() => setInitialAuthMode('login'), 300); 
  };

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const startingTextRef = useRef<string>('');
  
  const activeSubjectRef = useRef(activeSubject);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeModeRef = useRef(activeMode);
  const isVoiceCallActiveRef = useRef(isVoiceCallActive);
  const voiceMutedRef = useRef(voiceMuted);
  const voiceCallStatusRef = useRef(voiceCallStatus);
  const loadingSubjectsRef = useRef(loadingSubjects);
  
  const isPlayingAudioRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreamingRef = useRef(false); 

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const syncSessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isIncomingUpdateRef = useRef(false);
  const isRemoteDataLoadedRef = useRef(false);

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Effects ---

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

  useEffect(() => {
      document.body.classList.remove('font-dyslexic', 'font-mono');
      if (userSettings.fontFamily === 'dyslexic') {
          document.body.style.fontFamily = '"Comic Sans MS", "Chalkboard SE", sans-serif'; 
      } else if (userSettings.fontFamily === 'mono') {
          document.body.classList.add('font-mono');
          document.body.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      } else {
          document.body.style.fontFamily = '';
      }
  }, [userSettings.fontFamily]);

  useEffect(() => {
      const today = new Date().toDateString();
      const currentQuests = userSettings.dailyQuests?.quests || [];
      const hasEnglish = currentQuests.some(q => q.description.includes('Solve') || q.description.includes('Practice'));

      if (!userSettings.dailyQuests || userSettings.dailyQuests.date !== today || hasEnglish) {
          setUserSettings(prev => ({
              ...prev,
              dailyQuests: {
                  date: today,
                  quests: generateDailyQuests()
              }
          }));
      }
  }, [userSettings.dailyQuests]);

  useEffect(() => {
    const handleAuthRedirects = () => {
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get('error_description');
            if (errorDescription) addToast(`Грешка при вход: ${decodeURIComponent(errorDescription)}`, 'error');
            window.history.replaceState(null, '', window.location.pathname);
            return;
        }

        if (hash && hash.includes('type=')) {
            const params = new URLSearchParams(hash.substring(1));
            const type = params.get('type');
            if (type === 'recovery') setShowAuthModal(true);
            else if (['signup', 'invite', 'magiclink', 'email_change'].includes(type!)) {
                setAuthSuccessType(type === 'signup' ? 'verification' : type as any);
                setHomeView('auth_success');
            }
        }
        
        const searchParams = new URLSearchParams(window.location.search);
        const refCode = searchParams.get('ref');
        if (refCode) {
            localStorage.setItem('uchebnik_invite_code', refCode);
            addToast('Invite code applied! Sign up to claim reward.', 'success');
            setInitialAuthMode('register');
            setShowAuthModal(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    };
    handleAuthRedirects();

    const loadLocalStorageData = async () => {
        const sessionsKey = 'uchebnik_sessions';
        const settingsKey = 'uchebnik_settings';
        try {
            const loadedSessions = await getSessionsFromStorage(sessionsKey);
            if (loadedSessions && loadedSessions.length > 0) setSessions(loadedSessions);
            const loadedSettings = await getSettingsFromStorage(settingsKey);
            if (loadedSettings) setUserSettings(loadedSettings);
        } catch (err) { console.error("Init Error", err); }

        const savedPlan = localStorage.getItem('uchebnik_user_plan');
        if (savedPlan) setUserPlan(savedPlan as UserPlan);
        
        const today = new Date().toDateString();
        const lastUsageDate = localStorage.getItem('uchebnik_image_date');
        if (lastUsageDate !== today) {
            setDailyImageCount(0);
            localStorage.setItem('uchebnik_image_date', today);
            localStorage.setItem('uchebnik_image_count', '0');
        } else {
            setDailyImageCount(parseInt(localStorage.getItem('uchebnik_image_count') || '0'));
        }
    };

    const loadRemoteUserData = async (userId: string) => {
        setIsRemoteDataLoaded(false);
        isRemoteDataLoadedRef.current = false;
        setSyncStatus('syncing');
        try {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (profileData) {
                const referralCode = profileData.referral_code;
                const proExpiresAt = profileData.pro_expires_at;
                const xp = profileData.xp || 0;
                const level = profileData.level || 1;
                if (profileData.settings) {
                    const { plan, stats, ...restSettings } = profileData.settings;
                    setUserSettings(prev => ({ ...prev, ...restSettings, themeColor: profileData.theme_color, customBackground: profileData.custom_background, referralCode, proExpiresAt, xp, level }));
                    if (plan) setUserPlan(plan);
                    if (stats) {
                        setTotalInputTokens(stats.totalInputTokens || 0);
                        setTotalOutputTokens(stats.totalOutputTokens || 0);
                        setCostCorrection(stats.costCorrection || 0);
                    }
                }
            }
            const { data: sessionData } = await supabase.from('user_data').select('data').eq('user_id', userId).single();
            if (sessionData && sessionData.data) {
                isIncomingUpdateRef.current = true;
                setSessions(prev => {
                    const remote = sessionData.data;
                    const localOnly = prev.filter(p => !remote.find((r: Session) => r.id === p.id));
                    return [...localOnly, ...remote].sort((a, b) => b.lastModified - a.lastModified);
                });
            }
            setSyncStatus('synced');
        } catch (err) {
            console.error("Remote load error", err);
        } finally {
            setIsRemoteDataLoaded(true);
            isRemoteDataLoadedRef.current = true;
        }
    };

    const initializeApp = async (session: SupabaseSession | null) => {
        setSession(session);
        if (session) {
            setShowAuthModal(false);
            const storedRef = localStorage.getItem('uchebnik_invite_code');
            if (storedRef && !session.user.user_metadata.referral_code) {
                await supabase.auth.updateUser({ data: { referral_code: storedRef } });
                localStorage.removeItem('uchebnik_invite_code');
            }
            if (session.user.user_metadata) {
                const meta = session.user.user_metadata;
                setUserMeta({ firstName: meta.first_name || '', lastName: meta.last_name || '', avatar: meta.avatar_url || '' });
                setEditProfile({ firstName: meta.first_name || '', lastName: meta.last_name || '', avatar: meta.avatar_url || '', email: session.user.email || '', password: '', currentPassword: '' });
                setUserSettings(prev => {
                    const fullName = meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
                    return prev.userName ? prev : { ...prev, userName: fullName };
                });
            }
            await loadRemoteUserData(session.user.id);
        } else {
            setSessions([]);
            setSyncStatus('synced');
            setIsRemoteDataLoaded(false);
            await loadLocalStorageData();
        }
        setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => initializeApp(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!authLoading) {
          setSession(session);
          if (session) loadRemoteUserData(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      const channel = supabase.channel('global-broadcasts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
          const newB = payload.new as any;
          if (newB.type === 'modal') setBroadcastModal({ isOpen: true, message: newB.message });
          else addToast(newB.message, 'info');
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
      if (!session?.user?.id || missingDbTables || !isRemoteDataLoaded || isStreamingRef.current) return;
      if (isIncomingUpdateRef.current) { isIncomingUpdateRef.current = false; return; }
      setSyncStatus('syncing');
      if (syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current);
      syncSessionsTimer.current = setTimeout(async () => {
          const sanitized = sessions.map(s => ({ ...s, messages: s.messages.map(m => ({ ...m, images: m.images ? [] : undefined })) }));
          await supabase.from('user_data').upsert({ user_id: session.user.id, data: sanitized, updated_at: new Date().toISOString() });
          setSyncStatus('synced');
      }, 2000);
      return () => { if(syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current); };
  }, [sessions, session?.user?.id, isRemoteDataLoaded]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(true); else setSidebarOpen(false); };
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (pendingHomeInput && activeSubject?.id === SubjectId.GENERAL && activeSessionId) {
       handleSend(pendingHomeInput.text, pendingHomeInput.images);
       setPendingHomeInput(null);
    }
  }, [activeSubject, activeSessionId, pendingHomeInput]);

  useEffect(() => {
    if (session && isRemoteDataLoaded && pendingChatInput) {
        const subject = SUBJECTS.find(s => s.id === pendingChatInput.subjectId);
        if (subject) { setActiveSubject(subject); setActiveMode(pendingChatInput.mode); }
        const relevant = sessions.filter(s => s.subjectId === pendingChatInput.subjectId).sort((a,b) => b.lastModified - a.lastModified);
        if (relevant[0]) setActiveSessionId(relevant[0].id); else createNewSession(pendingChatInput.subjectId, undefined, pendingChatInput.mode);
        setTimeout(() => { handleSend(pendingChatInput.text, pendingChatInput.images); setPendingChatInput(null); }, 300);
    }
  }, [session, isRemoteDataLoaded, pendingChatInput]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId, isImageProcessing, showSubjectDashboard]);

  const checkImageLimit = (count = 1): boolean => {
      let limit = userPlan === 'free' ? 4 : (userPlan === 'plus' ? 12 : 9999);
      if (dailyImageCount + count > limit) { setShowUnlockModal(true); return false; }
      return true;
  };

  const incrementImageCount = (count = 1) => {
      const newCount = dailyImageCount + count;
      setDailyImageCount(newCount);
      localStorage.setItem('uchebnik_image_count', newCount.toString());
  };

  const createNewSession = (subjectId: SubjectId, role?: UserRole, initialMode?: AppMode) => {
    const sub = SUBJECTS.find(s => s.id === subjectId);
    const sTitle = `${sub ? t(`subject_${sub.id}`, userSettings.language) : 'Subject'} #${sessions.length + 1}`;
    const newSession: Session = {
      id: crypto.randomUUID(), subjectId, title: sTitle, createdAt: Date.now(), lastModified: Date.now(), preview: '...', messages: [], role: role || userRole || undefined, mode: initialMode
    };
    const welcome = `${t('hello', userSettings.language)}${userSettings.userName ? ', ' + userSettings.userName : ''}! ${t('app_name', userSettings.language)}. ${t('ask_anything', userSettings.language)}`;
    newSession.messages.push({ id: 'welcome-' + Date.now(), role: 'model', timestamp: Date.now(), text: welcome });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const handleSubjectChange = (subject: SubjectConfig, role?: UserRole) => {
    if (activeSubject?.id === subject.id && !showSubjectDashboard && userRole === role) { 
        if (window.innerWidth < 1024) setSidebarOpen(false); 
        return; 
    }
    if (unreadSubjects.has(subject.id)) { const next = new Set(unreadSubjects); next.delete(subject.id); setUnreadSubjects(next); }
    if (role) setUserRole(role);
    setActiveSubject(subject);
    if (subject.id === SubjectId.GENERAL) { setActiveMode(AppMode.CHAT); setShowSubjectDashboard(false); setUserRole(null); } else { setShowSubjectDashboard(true); }
    setInputValue(''); setSelectedImages([]); setIsImageProcessing(false); setReplyingTo(null);
    if (subject.id === SubjectId.GENERAL) {
        const subS = sessions.filter(s => s.subjectId === subject.id).sort((a,b) => b.lastModified - a.lastModified);
        if (subS[0]) setActiveSessionId(subS[0].id); else createNewSession(subject.id);
    } else { setActiveSessionId(null); }
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleStartMode = (mode: AppMode) => {
      if (!activeSubject) return;
      setActiveMode(mode); setShowSubjectDashboard(false);
      const rel = sessions.filter(s => s.subjectId === activeSubject.id && s.role === userRole && s.mode === mode).sort((a,b) => b.lastModified - a.lastModified);
      if (rel[0]) setActiveSessionId(rel[0].id); else createNewSession(activeSubject.id, userRole || undefined, mode);
  };

  const deleteSession = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Изтриване на чат',
      message: 'Сигурни ли сте, че искате да изтриете този разговор?',
      onConfirm: () => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) setActiveSessionId(null);
        addToast('Чатът е изтрит.', 'success');
        setConfirmModal(null);
      }
    });
  };

  const renameSession = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, lastModified: Date.now() } : s));
    setRenameSessionId(null);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    if (activeSubject) setLoadingSubjects(prev => ({ ...prev, [activeSubject.id]: false }));
    isStreamingRef.current = false;
    if (activeSessionId) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.isStreaming ? { ...m, isStreaming: false, text: m.text || "Stopped." } : m) } : s));
    }
  };

  const grantXP = (amount: number) => {
      const boosted = calculateXPWithBoost(amount, userPlan);
      setUserSettings(prev => {
          const newXP = prev.xp + boosted;
          const newLvl = calculateLevel(newXP);
          if (newLvl > prev.level) addToast(`Достигнахте ниво ${newLvl}! 🎉`, 'success');
          return { ...prev, xp: newXP, level: newLvl };
      });
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    const currentSubject = activeSubjectRef.current;
    const currentSessionId = activeSessionIdRef.current;
    const textToSend = overrideText || inputValue;
    const currentImgs = overrideImages || [...selectedImages];

    if (!session) { 
        if ((!textToSend.trim() && currentImgs.length === 0) || !currentSubject || !currentSessionId) return;

        const currentSess = sessionsRef.current.find(s => s.id === currentSessionId);
        const userMsgCount = currentSess?.messages.filter(m => m.role === 'user').length || 0;
        
        if (userMsgCount >= 1) {
            addToast("Моля, влезте в профила си, за да продължите чата.", "info");
            setShowAuthModal(true);
            return;
        }

        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, images: currentImgs, timestamp: Date.now() };
        const tempAiMsgId = (Date.now() + 1).toString();
        const tempAiMsg: Message = { id: tempAiMsgId, role: 'model', text: "", timestamp: Date.now(), isDemo: true, isStreaming: true };

        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newUserMsg, tempAiMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50) } : s));
        setInputValue(''); setSelectedImages([]);
        setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: true }));
        
        let currentText = "";
        const chars = DEMO_RESPONSE.split("");
        let charIndex = 0;
        
        const typeInterval = setInterval(() => {
            if (charIndex < chars.length) {
                const batchSize = Math.floor(Math.random() * 6) + 4; 
                currentText += chars.slice(charIndex, charIndex + batchSize).join("");
                charIndex += batchSize;
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? { ...m, text: currentText } : m) } : s));
            } else {
                clearInterval(typeInterval);
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? { ...m, isStreaming: false } : m), lastModified: Date.now(), preview: DEMO_RESPONSE.substring(0, 50) } : s));
                setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: false }));
            }
        }, 35);
        return; 
    }

    const currentMode = activeModeRef.current;
    if ((!textToSend.trim() && currentImgs.length === 0) || !currentSubject || !currentSessionId) return;
    if (loadingSubjects[currentSubject.id]) return;
    
    if (currentImgs.length > 0 && !checkImageLimit(currentImgs.length)) return;
    
    const replyContext = replyingTo; setReplyingTo(null);
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, images: currentImgs, timestamp: Date.now(), replyToId: replyContext?.id };
    const tempAiMsgId = (Date.now() + 1).toString();
    const tempAiMsg: Message = { id: tempAiMsgId, role: 'model', text: "", timestamp: Date.now(), reasoning: "", isStreaming: true };
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newUserMsg, tempAiMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50) } : s));
    setInputValue(''); setSelectedImages([]);
    
    isStreamingRef.current = true;
    setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: true }));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    grantXP(XP_PER_MESSAGE + (currentImgs.length * XP_PER_IMAGE));
    if (currentImgs.length > 0) incrementImageCount(currentImgs.length);
    updateQuestProgress(userSettings.dailyQuests?.quests || [], 'message', currentSubject.id);

    try {
      const historyForAI = sessionsRef.current.find(s => s.id === currentSessionId)?.messages || [];
      const response = await generateResponse(currentSubject.id, currentMode, textToSend, currentImgs, historyForAI, userSettings.preferredModel, (txt) => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? { ...m, text: txt } : m) } : s));
      }, controller.signal, userSettings.language, userSettings.teachingStyle, userSettings.customPersona);

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? { ...m, ...response, isStreaming: false } : m), lastModified: Date.now(), preview: response.text.substring(0, 50) } : s));
    } catch (e: any) {
       console.error("AI Error", e);
    } finally {
       isStreamingRef.current = false;
       setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: false }));
       abortControllerRef.current = null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (!session) {
          setIsImageProcessing(true);
          const processed = await Promise.all(Array.from(files).map(file => resizeImage(file as File, 800, 0.6)));
          setSelectedImages(prev => [...prev, ...processed]);
          setIsImageProcessing(false);
          return;
      }
      if (!checkImageLimit(files.length)) return;
      setIsImageProcessing(true);
      const processed = await Promise.all(Array.from(files).map(file => resizeImage(file as File, 800, 0.6)));
      setSelectedImages(prev => [...prev, ...processed]);
      setIsImageProcessing(false);
    }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className="flex h-full w-full relative overflow-hidden text-foreground">
      <Snowfall active={!!userSettings.christmasMode} />
      {!userSettings.customBackground && <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.4]' : ''}`} />}
      {userSettings.customBackground && <div className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.2] grayscale' : ''}`} style={getBackgroundImageStyle(userSettings.customBackground)} />}
      
      {showAuthModal && <Auth isModal={false} onSuccess={closeAuthModal} initialMode={initialAuthMode} onNavigate={setHomeView} />}

      {!focusMode && session && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userSettings={userSettings} setUserSettings={setUserSettings} userPlan={userPlan} activeSubject={activeSubject} setActiveSubject={setActiveSubject} setHomeView={setHomeView} setUserRole={setUserRole} handleSubjectChange={handleSubjectChange} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId} sessions={sessions} deleteSession={deleteSession} createNewSession={createNewSession} unreadSubjects={unreadSubjects} activeMode={activeMode} userMeta={userMeta} session={session} setShowUnlockModal={setShowUnlockModal} setShowReferralModal={setShowReferralModal} setShowSettings={setShowSettings} handleLogout={() => supabase.auth.signOut()} setShowAuthModal={setShowAuthModal} addToast={addToast} setShowSubjectDashboard={setShowSubjectDashboard} userRole={userRole} streak={0} syncStatus={syncStatus} homeView={homeView} dailyImageCount={dailyImageCount} setShowLeaderboard={setShowLeaderboard} setShowQuests={setShowQuests} setShowReportModal={setShowReportModal} />
      )}
      
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden z-10">
        {homeView === 'auth_success' ? (
            <AuthSuccess type={authSuccessType || 'generic'} onContinue={() => { setHomeView('landing'); setAuthSuccessType(null); }} userSettings={userSettings} />
        ) : !activeSubject ? (
            <WelcomeScreen homeView={homeView} userMeta={userMeta} userSettings={userSettings} handleSubjectChange={handleSubjectChange} setHomeView={setHomeView} setUserRole={setUserRole} setShowAdminAuth={setShowAdminAuth} onQuickStart={(txt, imgs) => { setPendingHomeInput({text: txt, images: imgs||[]}); handleSubjectChange(SUBJECTS[0]); }} setSidebarOpen={setSidebarOpen} setShowAuthModal={setShowAuthModal} session={session} setShowSettings={setShowSettings} />
        ) : showSubjectDashboard ? (
            <SubjectDashboard activeSubject={activeSubject} setActiveSubject={setActiveSubject} setHomeView={setHomeView} userRole={userRole} userSettings={userSettings} handleStartMode={handleStartMode} />
        ) : (
            <div className={`flex-1 flex flex-col relative h-full bg-transparent`}>
                {!focusMode && <ChatHeader setSidebarOpen={setSidebarOpen} activeSubject={activeSubject} setActiveSubject={setActiveSubject} setUserSettings={setUserSettings} userRole={userRole} activeMode={activeMode} startVoiceCall={() => {}} createNewSession={createNewSession} setHistoryDrawerOpen={setHistoryDrawerOpen} userSettings={userSettings} setFocusMode={setFocusMode} isGuest={!session} />}
                <AdSenseContainer userPlan={userPlan} />
                <MessageList currentMessages={currentMessages} userSettings={userSettings} setZoomedImage={setZoomedImage} handleRate={() => {}} handleReply={setReplyingTo} handleCopy={(t,id) => {navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000)}} copiedId={copiedId} handleShare={() => {}} loadingSubject={!!loadingSubjects[activeSubject.id]} activeSubject={activeSubject} messagesEndRef={messagesEndRef} setShowAuthModal={setShowAuthModal} isGuest={!session} />
                <ChatInputArea replyingTo={replyingTo} setReplyingTo={setReplyingTo} userSettings={userSettings} setUserSettings={setUserSettings} activeMode={activeMode} fileInputRef={fileInputRef} loadingSubject={!!loadingSubjects[activeSubject.id]} handleImageUpload={handleImageUpload} toggleListening={() => {}} isListening={isListening} inputValue={inputValue} setInputValue={setInputValue} handleSend={() => handleSend()} selectedImages={selectedImages} handleRemoveImage={(idx) => setSelectedImages(prev => prev.filter((_,i)=>i!==idx))} onStopGeneration={handleStopGeneration} onImagesAdd={(imgs) => setSelectedImages(prev => [...prev, ...imgs])} />
            </div>
        )}
      </main>

      <UpgradeModal showUnlockModal={showUnlockModal} setShowUnlockModal={setShowUnlockModal} targetPlan={targetPlan} setTargetPlan={setTargetPlan} unlockKeyInput={unlockKeyInput} setUnlockKeyInput={setUnlockKeyInput} handleUnlockSubmit={() => {}} userPlan={userPlan} userSettings={userSettings} addToast={addToast} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} userMeta={userMeta} editProfile={editProfile} setEditProfile={setEditProfile} handleUpdateAccount={() => {}} handleAvatarUpload={() => {}} userSettings={userSettings} setUserSettings={setUserSettings} isPremium={userPlan!=='free'} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} handleBackgroundUpload={() => {}} handleDeleteAllChats={() => {}} addToast={addToast} userPlan={userPlan} />
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} userSettings={userSettings} addToast={addToast} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} currentUserId={session?.user?.id} />
      <DailyQuestsModal isOpen={showQuests} onClose={() => setShowQuests(false)} quests={userSettings.dailyQuests?.quests || []} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} userSettings={userSettings} addToast={addToast} userId={session?.user?.id} />
      <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
      <ConfirmModal isOpen={!!confirmModal} title={confirmModal?.title || ''} message={confirmModal?.message || ''} onConfirm={confirmModal?.onConfirm || (()=>{})} onCancel={() => setConfirmModal(null)} />

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

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${TOAST_CONTAINER} ${t.type === 'error' ? TOAST_ERROR : t.type === 'success' ? TOAST_SUCCESS : TOAST_INFO}`}>
             {t.type === 'error' ? <AlertCircle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : <Info size={18}/>}
             <span className="font-medium text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      <IosInstallPrompt />
    </div>
  );
};
