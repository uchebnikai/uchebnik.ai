
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

interface GeneratedKey {
  code: string;
  isUsed: boolean;
  plan?: 'plus' | 'pro';
}

// Strictly using the allowed Live API model
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-dialog';

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
  
  // NEW: Token Stats State
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

  // Broadcast Modal State
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
    preferredModel: 'gemini-2.5-flash',
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
      setTimeout(() => setInitialAuthMode('login'), 300); // Reset to login after animation
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
  
  // Audio Playback Refs
  const isPlayingAudioRef = useRef(false);
  
  // AbortController for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreamingRef = useRef(false); // Track if streaming is active to pause sync

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const syncSessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isIncomingUpdateRef = useRef(false);
  const isRemoteDataLoadedRef = useRef(false);

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Effects ---

  // Font Application
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

  // Check Daily Quests Date & Language Migration
  useEffect(() => {
      const today = new Date().toDateString();
      const currentQuests = userSettings.dailyQuests?.quests || [];
      
      // Detect English quests (from old cache) to force update to Bulgarian
      const hasEnglish = currentQuests.some(q => 
          q.description.includes('Solve') || 
          q.description.includes('Practice') || 
          q.description.includes('Upload') ||
          q.description.includes('Send')
      );

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

  // Auth & URL Logic (Referrals)
  useEffect(() => {
    const handleAuthRedirects = () => {
        const hash = window.location.hash;
        
        // Handle Error Cases
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                addToast(`Грешка при вход: ${decodeURIComponent(errorDescription)}`, 'error');
            }
            window.history.replaceState(null, '', window.location.pathname);
            return;
        }

        // Handle Success/Action Cases based on Supabase 'type'
        if (hash && hash.includes('type=')) {
            const params = new URLSearchParams(hash.substring(1));
            const type = params.get('type');

            if (type === 'recovery') {
                setShowAuthModal(true);
            } else if (type === 'signup' || type === 'invite') {
                setAuthSuccessType('verification');
                setHomeView('auth_success');
            } else if (type === 'magiclink') {
                setAuthSuccessType('magiclink');
                setHomeView('auth_success');
            } else if (type === 'email_change') {
                setAuthSuccessType('email_change');
                setHomeView('auth_success');
            }
        }
        
        // Check for Referral Code in URL
        const searchParams = new URLSearchParams(window.location.search);
        const refCode = searchParams.get('ref');
        if (refCode) {
            localStorage.setItem('uchebnik_invite_code', refCode);
            addToast(t('referral_applied', userSettings.language) || 'Invite code applied! Sign up to claim reward.', 'success');
            
            // Auto-open registration modal
            setInitialAuthMode('register');
            setShowAuthModal(true);

            // Clean URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    };
    handleAuthRedirects();

    // Data Fetching Logic Consolidated
    const loadLocalStorageData = async () => {
        const sessionsKey = 'uchebnik_sessions';
        const settingsKey = 'uchebnik_settings';
        const planKey = 'uchebnik_user_plan';
        const lastVisitKey = 'uchebnik_last_visit';

        try {
            const loadedSessions = await getSessionsFromStorage(sessionsKey);
            if (loadedSessions && loadedSessions.length > 0) setSessions(loadedSessions);
            else {
                const lsSessions = localStorage.getItem(sessionsKey);
                if (lsSessions) {
                    try {
                        const parsed = JSON.parse(lsSessions);
                        setSessions(parsed);
                        await saveSessionsToStorage(sessionsKey, parsed);
                    } catch(e){}
                }
            }
            
            const loadedSettings = await getSettingsFromStorage(settingsKey);
            if (loadedSettings) setUserSettings(loadedSettings);
            else {
                 const lsSettings = localStorage.getItem(settingsKey);
                 if (lsSettings) setUserSettings(JSON.parse(lsSettings));
            }
        } catch (err) { console.error("Initialization Error", err); }

        const savedPlan = localStorage.getItem(planKey);
        if (savedPlan) setUserPlan(savedPlan as UserPlan);
        else {
           const oldPro = localStorage.getItem('uchebnik_pro_status');
           if (oldPro === 'unlocked') {
               setUserPlan('pro');
               localStorage.setItem('uchebnik_user_plan', 'pro');
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
        localStorage.setItem(lastVisitKey, today);
    };

    const loadRemoteUserData = async (userId: string) => {
        setIsRemoteDataLoaded(false);
        isRemoteDataLoadedRef.current = false;
        setSyncStatus('syncing');
        setMissingDbTables(false);
        
        const dbStart = performance.now();
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('settings, theme_color, custom_background, referral_code, pro_expires_at, xp, level')
                .eq('id', userId)
                .single();
            
            if (profileError && profileError.code === '42P01') {
                setMissingDbTables(true);
                throw new Error("Missing tables");
            }

            if (profileData) {
                // Merge new referral fields + XP/Level
                const referralCode = profileData.referral_code;
                const proExpiresAt = profileData.pro_expires_at;
                const xp = profileData.xp || 0;
                const level = profileData.level || 1;

                if (profileData.settings) {
                    const { plan, stats, ...restSettings } = profileData.settings;
                    const merged = { ...restSettings, themeColor: profileData.theme_color, customBackground: profileData.custom_background, referralCode, proExpiresAt, xp, level };
                    
                    if (!merged.language) merged.language = 'bg';
                    if (!merged.teachingStyle) merged.teachingStyle = 'normal';
                    if (merged.socraticMode === undefined) merged.socraticMode = false;
                    if (!merged.customPersona) merged.customPersona = '';
                    if (merged.christmasMode === undefined) merged.christmasMode = false;
                    if (!merged.preferredVoice) merged.preferredVoice = DEFAULT_VOICE;
                    
                    // Daily Quests init in profile load
                    const today = new Date().toDateString();
                    if (!merged.dailyQuests || merged.dailyQuests.date !== today) {
                        merged.dailyQuests = {
                            date: today,
                            quests: generateDailyQuests()
                        };
                    }

                    setUserSettings(prev => ({ ...prev, ...merged }));
                    
                    let effectivePlan = plan;
                    if (proExpiresAt && new Date(proExpiresAt) < new Date()) {
                        if (plan !== 'free') {
                            effectivePlan = 'free';
                            console.warn("Pro plan expired.");
                        }
                    }
                    
                    if (effectivePlan) setUserPlan(effectivePlan);
                    
                    if (stats) {
                        setTotalInputTokens(stats.totalInputTokens || 0);
                        setTotalOutputTokens(stats.totalOutputTokens || 0);
                        setCostCorrection(stats.costCorrection || 0);
                        
                        if (stats.lastImageDate === today) {
                            setDailyImageCount(stats.dailyImageCount || 0);
                        } else {
                            setDailyImageCount(0);
                        }
                    }
                } else {
                    if (profileData.theme_color) setUserSettings(prev => ({...prev, themeColor: profileData.theme_color}));
                    if (profileData.custom_background) setUserSettings(prev => ({...prev, customBackground: profileData.custom_background}));
                    setUserSettings(prev => ({...prev, referralCode, proExpiresAt, xp, level}));
                }
            }

            const { data: sessionData, error: sessionError } = await supabase
                .from('user_data')
                .select('data')
                .eq('user_id', userId)
                .single();
            
            if (sessionError) {
                if (sessionError.code === '42P01') {
                    setMissingDbTables(true);
                } else if (sessionError.code !== 'PGRST116') {
                    console.warn("Session load error:", sessionError);
                }
            }
                
            if (sessionData && sessionData.data) {
                isIncomingUpdateRef.current = true;
                const remoteSessions = sessionData.data;
                setSessions(prev => {
                    const localOnly = prev.filter(p => !remoteSessions.find((r: Session) => r.id === p.id));
                    return [...localOnly, ...remoteSessions].sort((a: Session, b: Session) => b.lastModified - a.lastModified);
                });
            }
            setSyncStatus('synced');
            
            localStorage.setItem('sys_monitor_db', JSON.stringify({
                status: 'operational',
                latency: Math.round(performance.now() - dbStart),
                timestamp: Date.now()
            }));

        } catch (err) {
            console.error("Failed to load remote data", err);
            localStorage.setItem('sys_monitor_db', JSON.stringify({
                status: 'down',
                latency: Math.round(performance.now() - dbStart),
                timestamp: Date.now()
            }));
        } finally {
            setIsRemoteDataLoaded(true);
            isRemoteDataLoadedRef.current = true;
        }
    };

    const initializeApp = async (session: SupabaseSession | null) => {
        setSession(session);
        
        if (session) {
            setShowAuthModal(false);
            
            const storedRefCode = localStorage.getItem('uchebnik_invite_code');
            if (storedRefCode) {
                const currentRef = session.user.user_metadata.referral_code;
                if (!currentRef) {
                    const { error } = await supabase.auth.updateUser({
                        data: { referral_code: storedRefCode }
                    });
                    
                    if (!error) {
                        addToast(t('referral_applied', userSettings.language) || "Referral code applied!", "success");
                        localStorage.removeItem('uchebnik_invite_code');
                    } else {
                        console.error("Failed to apply referral code:", error);
                    }
                } else {
                    localStorage.removeItem('uchebnik_invite_code');
                }
            }

            if (session.user.user_metadata) {
                const meta = session.user.user_metadata;
                setUserMeta({ 
                    firstName: meta.first_name || '', 
                    lastName: meta.last_name || '', 
                    avatar: meta.avatar_url || '' 
                });
                setEditProfile({ 
                    firstName: meta.first_name || '', 
                    lastName: meta.last_name || '', 
                    avatar: meta.avatar_url || '', 
                    email: session.user.email || '', 
                    password: '', 
                    currentPassword: '' 
                });

                setUserSettings(prev => {
                    const fullName = meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
                    if (!prev.userName && fullName) return { ...prev, userName: fullName };
                    return prev;
                });
            }

            // Await remote data BEFORE closing loader to prevent flash
            await loadRemoteUserData(session.user.id);

        } else {
            // If no user, load local storage
            setSessions([]);
            setSyncStatus('synced');
            setIsRemoteDataLoaded(false);
            await loadLocalStorageData();
        }
        
        setAuthLoading(false); // Only now reveal the UI
    };

    supabase.auth.getSession().then(({ data: { session } }) => initializeApp(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Re-run initialization on state change, but careful not to flicker
      // If already loaded and session ID matches, skip full reload?
      // For simplicity, we rerun logic but since authLoading is false, user sees updates reactively.
      // However, for initial load, the promise above handles it.
      if (!authLoading) {
          setSession(session);
          if (session) {
              loadRemoteUserData(session.user.id);
          }
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Realtime Broadcast Listener
  useEffect(() => {
      const channel = supabase.channel('global-broadcasts')
          .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'broadcasts' },
              (payload) => {
                  const newBroadcast = payload.new as { message: string, type: 'toast' | 'modal' };
                  if (newBroadcast.type === 'modal') {
                      setBroadcastModal({ isOpen: true, message: newBroadcast.message });
                  } else {
                      addToast(newBroadcast.message, 'info'); 
                  }
                  if (userSettings.sound) {
                      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [userSettings.sound]);

  // Subscriptions and Saving Effects
  useEffect(() => {
      if (!session?.user?.id || missingDbTables) return;
      const channel = supabase.channel(`sync-sessions:${session.user.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_data', filter: `user_id=eq.${session.user.id}` }, (payload) => {
              const remoteSessions = (payload.new as any).data;
              if (remoteSessions) {
                  const currentJson = JSON.stringify(sessionsRef.current.map(s => ({...s, messages: s.messages.map(m => ({...m, images: []}))})));
                  const remoteJson = JSON.stringify(remoteSessions.map((s: Session) => ({...s, messages: s.messages.map((m: Message) => ({...m, images: []}))})));
                  
                  if (currentJson !== remoteJson) {
                      isIncomingUpdateRef.current = true; 
                      setSessions(prev => {
                          const merged = remoteSessions.map((rSession: Session) => {
                              const lSession = prev.find(s => s.id === rSession.id);
                              if (!lSession) return rSession;
                              return {
                                  ...rSession,
                                  messages: rSession.messages.map((rMsg: Message) => {
                                      const lMsg = lSession.messages.find(m => m.id === rMsg.id);
                                      if (lMsg?.images?.length && (!rMsg.images || rMsg.images.length === 0)) {
                                          return { ...rMsg, images: lMsg.images };
                                      }
                                      return rMsg;
                                  })
                              };
                          });
                          const localOnly = prev.filter(p => !remoteSessions.find((r: Session) => r.id === p.id));
                          return [...localOnly, ...merged].sort((a: Session, b: Session) => b.lastModified - a.lastModified);
                      });
                  }
              }
          })
          .subscribe();
      return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, missingDbTables, userSettings.language]);

  useEffect(() => {
      if (!session?.user?.id || missingDbTables) return;
      
      const channel = supabase.channel(`sync-profiles:${session.user.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload) => {
              const remoteData = payload.new as any;
              
              const oldExpiry = userSettings.proExpiresAt;
              const newExpiry = remoteData.pro_expires_at;
              
              if (newExpiry && (!oldExpiry || new Date(newExpiry) > new Date(oldExpiry))) {
                  addToast(t('referral_reward_toast', userSettings.language) || "Friend verified! You earned 3 days of Pro! 🎉", 'success');
                  if (userSettings.sound) {
                      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
                  }
              }

              if (remoteData && remoteData.settings) {
                  isIncomingUpdateRef.current = true;
                  const { plan, stats, ...settingsRest } = remoteData.settings;
                  
                  const xp = remoteData.xp || 0;
                  const level = remoteData.level || 1;

                  setUserSettings(prev => ({ 
                      ...prev, 
                      ...settingsRest, 
                      themeColor: remoteData.theme_color, 
                      custom_background: remoteData.custom_background,
                      referralCode: remoteData.referral_code,
                      proExpiresAt: remoteData.pro_expires_at,
                      xp,
                      level
                  }));
                  
                  if (plan) setUserPlan(plan);
                  
                  if (stats) {
                      if (stats.costCorrection !== undefined) setCostCorrection(stats.costCorrection);
                      
                      const today = new Date().toDateString();
                      if (stats.lastImageDate === today) {
                          setDailyImageCount(stats.dailyImageCount || 0);
                      } else {
                          setDailyImageCount(0);
                      }
                  }
              }
          })
          .subscribe();
      return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, missingDbTables, userSettings.proExpiresAt]);

  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded) return;
      if (missingDbTables) return; 
      if (isIncomingUpdateRef.current) { isIncomingUpdateRef.current = false; return; }
      
      if (isStreamingRef.current) return;

      setSyncStatus('syncing');
      setSyncErrorDetails(null);
      if (syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current);
      syncSessionsTimer.current = setTimeout(async () => {
          const sanitizedSessions = sessions.map(s => ({
              ...s, messages: s.messages.map(m => ({ ...m, images: m.images ? [] : undefined }))
          }));
          const { error } = await supabase.from('user_data').upsert({
              user_id: session.user.id, data: sanitizedSessions, updated_at: new Date().toISOString()
          });
          if (error) { setSyncStatus('error'); setSyncErrorDetails(error.message || "Unknown error"); if (error.code === '42P01') setMissingDbTables(true); } else { setSyncStatus('synced'); }
      }, 2000); 
      return () => { if(syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current); };
  }, [sessions, session?.user?.id, isRemoteDataLoaded, missingDbTables]);

  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded) return;
      if (missingDbTables) return;
      if (isIncomingUpdateRef.current) { isIncomingUpdateRef.current = false; return; }
      if (syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current);
      syncSettingsTimer.current = setTimeout(async () => {
          const fullSettingsPayload = {
              ...userSettings, plan: userPlan,
              stats: { 
                  dailyImageCount, 
                  lastImageDate: localStorage.getItem('uchebnik_image_date'), 
                  lastVisit: localStorage.getItem('uchebnik_last_visit'),
                  totalInputTokens,
                  totalOutputTokens,
                  costCorrection
              }
          };
          const { referralCode, proExpiresAt, xp, level, ...settingsToSave } = fullSettingsPayload;

          const { error } = await supabase.from('profiles').upsert({
              id: session.user.id, 
              settings: settingsToSave, 
              theme_color: userSettings.themeColor, 
              custom_background: userSettings.customBackground,
              xp: userSettings.xp, // Sync dedicated columns
              level: userSettings.level,
              updated_at: new Date().toISOString()
          });
          if (error && error.code === '42P01') { setMissingDbTables(true); }
      }, 1000);
      return () => { if(syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current); };
  }, [userSettings, userPlan, dailyImageCount, totalInputTokens, totalOutputTokens, costCorrection, session?.user?.id, isRemoteDataLoaded, missingDbTables]);

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
       if (window.innerWidth >= 1024) { setSidebarOpen(true); } else { setSidebarOpen(false); }
    };
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist Data
  useEffect(() => { const userId = session?.user?.id; const key = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions'; saveSessionsToStorage(key, sessions); }, [sessions, session]);
  useEffect(() => { const userId = session?.user?.id; const key = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings'; saveSettingsToStorage(key, userSettings); }, [userSettings, session]);
  useEffect(() => { const userId = session?.user?.id; const key = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan'; try { localStorage.setItem(key, userPlan); } catch(e) {} }, [userPlan, session]);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  useEffect(() => { activeSubjectRef.current = activeSubject; if(activeSubject && isVoiceCallActive) endVoiceCall(); }, [activeSubject]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { isVoiceCallActiveRef.current = isVoiceCallActive; }, [isVoiceCallActive]);
  useEffect(() => { voiceCallStatusRef.current = voiceCallStatus; }, [voiceCallStatus]);
  useEffect(() => { loadingSubjectsRef.current = loadingSubjects; }, [loadingSubjects]);

  useEffect(() => {
    if (pendingHomeInput && activeSubject?.id === SubjectId.GENERAL && activeSessionId) {
       handleSend(pendingHomeInput.text, pendingHomeInput.images);
       setPendingHomeInput(null);
    }
  }, [activeSubject, activeSessionId, pendingHomeInput]);

  useEffect(() => {
    if (session && isRemoteDataLoaded && pendingChatInput) {
        const subject = SUBJECTS.find(s => s.id === pendingChatInput.subjectId);
        if (subject && activeSubjectRef.current?.id !== subject.id) {
             setActiveSubject(subject);
             setActiveMode(pendingChatInput.mode);
        }
        
        const relevantSessions = sessions.filter(s => s.subjectId === pendingChatInput.subjectId).sort((a,b) => b.lastModified - a.lastModified);
        let targetSessionId = relevantSessions[0]?.id;
        
        if (!targetSessionId) {
            const newSession = createNewSession(pendingChatInput.subjectId, undefined, pendingChatInput.mode);
            targetSessionId = newSession.id;
        } else {
            setActiveSessionId(targetSessionId);
        }

        setTimeout(() => {
            handleSend(pendingChatInput.text, pendingChatInput.images);
            setPendingChatInput(null);
        }, 300);
    }
  }, [session, isRemoteDataLoaded, pendingChatInput, sessions]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId, isImageProcessing, showSubjectDashboard]);

  // Voice Call Cleanup on Unmount
  useEffect(() => {
    return () => {
      endVoiceCall();
    }
  }, []);

  // --- Logic Helpers ---
  const checkImageLimit = (count = 1): boolean => {
      let limit = 4;
      if (userPlan === 'plus') limit = 12;
      if (userPlan === 'pro') limit = 9999;
      if (dailyImageCount + count > limit) { setShowUnlockModal(true); return false; }
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
    
    const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
    const subjectName = subjectConfig ? t(`subject_${subjectId}`, userSettings.language) : "Subject";
    
    const getModeName = (m: AppMode) => {
        switch(m) {
            case AppMode.SOLVE: return t('mode_solve', userSettings.language); 
            case AppMode.LEARN: return t('mode_learn', userSettings.language);
            case AppMode.TEACHER_TEST: return t('mode_test', userSettings.language);
            case AppMode.TEACHER_PLAN: return t('mode_plan', userSettings.language);
            case AppMode.TEACHER_RESOURCES: return t('mode_resources', userSettings.language);
            default: return "Chat";
        }
    };
    
    let sessionBaseName = subjectName;
    if (initialMode && initialMode !== AppMode.CHAT) { sessionBaseName = getModeName(initialMode); }
    
    const existingCount = sessions.filter(s => s.subjectId === subjectId && s.role === (role || userRole || undefined) && s.mode === initialMode).length;
    const sessionTitle = subjectId === SubjectId.GENERAL ? `${t('chat_general', userSettings.language)} #${existingCount + 1}` : `${sessionBaseName} #${existingCount + 1}`;
    
    const newSession: Session = {
      id: crypto.randomUUID(), subjectId, title: sessionTitle, createdAt: Date.now(), lastModified: Date.now(), preview: '...', messages: [], role: role || userRole || undefined, mode: initialMode
    };

    if (subjectId === SubjectId.GENERAL) { 
        welcomeText = `${t('hello', userSettings.language)}${greetingName}! ${t('app_name', userSettings.language)}. ${t('ask_anything', userSettings.language)}`;
    } else {
        if (role === 'teacher' || role === 'uni_teacher') { 
             welcomeText = `${t('hello', userSettings.language)}! ${t('subtitle', userSettings.language)} **${subjectName}**.`; 
        } else { 
             welcomeText = `${t('hello', userSettings.language)}${greetingName}! ${t('subtitle', userSettings.language)} **${subjectName}**.`; 
        }
    }
    newSession.messages.push({ id: 'welcome-' + Date.now(), role: 'model', timestamp: Date.now(), text: welcomeText });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleUpdateAccount = async () => {
      try {
          const updates: any = { data: { first_name: editProfile.firstName, last_name: editProfile.lastName, full_name: `${editProfile.firstName} ${editProfile.lastName}`.trim(), avatar_url: editProfile.avatar } };
          const isEmailChange = editProfile.email !== session?.user?.email;
          const isPasswordChange = !!editProfile.password;
          if (isEmailChange || isPasswordChange) {
              if (!editProfile.currentPassword) { addToast('Моля, въведете текущата си парола, за да запазите промените по акаунта.', 'error'); return; }
              const { error: signInError } = await supabase.auth.signInWithPassword({ email: session?.user?.email || '', password: editProfile.currentPassword });
              if (signInError) { addToast('Грешна текуща парола.', 'error'); return; }
          }
          if (isEmailChange) { updates.email = editProfile.email; }
          if (isPasswordChange) { updates.password = editProfile.password; }
          const { error } = await supabase.auth.updateUser(updates, { emailRedirectTo: window.location.origin });
          if (error) throw error;

          // Sync with profiles table immediately for Admin/Leaderboard visibility
          if (session?.user?.id) {
              const { error: profileError } = await supabase.from('profiles').update({
                  avatar_url: editProfile.avatar,
                  updated_at: new Date().toISOString()
              }).eq('id', session.user.id);
              
              if (profileError) console.error("Failed to sync avatar to profiles", profileError);
          }

          setUserMeta({ firstName: editProfile.firstName, lastName: editProfile.lastName, avatar: editProfile.avatar });
          setUserSettings(prev => ({...prev, userName: updates.data.full_name}));
          let successMessage = 'Профилът е обновен успешно!';
          if (isEmailChange) { successMessage += ' Моля, проверете имейла си за потвърждение на промяната.'; }
          setEditProfile(prev => ({ ...prev, password: '', currentPassword: '' }));
          addToast(successMessage, 'success');
      } catch (error: any) { addToast(error.message || 'Грешка при обновяване на профила.', 'error'); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try { const resized = await resizeImage(file, 300, 0.7); setEditProfile(prev => ({ ...prev, avatar: resized })); } catch (err) { addToast('Грешка при качване на снимка', 'error'); }
      }
  };

  const handleSubjectChange = (subject: SubjectConfig, role?: UserRole) => {
    const targetRole = role || userRole;
    if (activeSubject?.id === subject.id && !showSubjectDashboard && userRole === targetRole) { 
        if (window.innerWidth < 1024) setSidebarOpen(false); 
        return; 
    }
    if (unreadSubjects.has(subject.id)) { const newUnread = new Set(unreadSubjects); newUnread.delete(subject.id); setUnreadSubjects(newUnread); }
    if (role) setUserRole(role);
    if (subject.id === SubjectId.GENERAL) {
        setActiveSubject(subject); setActiveMode(AppMode.CHAT); setShowSubjectDashboard(false); setUserRole(null);
    } else {
        setActiveSubject(subject); setShowSubjectDashboard(true);
    }
    setInputValue(''); setSelectedImages([]); setIsImageProcessing(false); setReplyingTo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (subject.id === SubjectId.GENERAL) {
        const subSessions = sessions.filter(s => s.subjectId === subject.id).sort((a, b) => b.lastModified - a.lastModified);
        if (subSessions.length > 0) setActiveSessionId(subSessions[0].id); else createNewSession(subject.id);
    } else { setActiveSessionId(null); }
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleStartMode = (mode: AppMode) => {
      if (!activeSubject) return;
      setActiveMode(mode); setShowSubjectDashboard(false);
      const relevantSessions = sessions.filter(s => s.subjectId === activeSubject.id && s.role === userRole && s.mode === mode).sort((a, b) => b.lastModified - a.lastModified);
      if (relevantSessions.length > 0) { setActiveSessionId(relevantSessions[0].id); } else { createNewSession(activeSubject.id, userRole || undefined, mode); }
  };

  const handleReply = (msg: Message) => { setReplyingTo(msg); };

  const handleStopGeneration = () => {
    // 1. Abort the network request
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    // 2. Clear watchdog
    if (responseWatchdogRef.current) {
        clearTimeout(responseWatchdogRef.current);
        responseWatchdogRef.current = null;
    }
    
    // 3. Update loading states
    if (activeSubject) {
        setLoadingSubjects(prev => ({ ...prev, [activeSubject.id]: false }));
    }
    isStreamingRef.current = false; 
    
    // 4. Stop Voice listening
    if (isListening) {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }

    // 5. Explicitly update the message in the session to stop showing the streaming indicator
    if (activeSessionId) {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: s.messages.map(m => {
                        // Find any message that is currently marked as streaming and turn it off
                        if (m.isStreaming) {
                            return { 
                                ...m, 
                                isStreaming: false,
                                text: m.text + (m.text ? "" : " (Stopped)") // Append text if empty to show something
                            };
                        }
                        return m;
                    })
                };
            }
            return s;
        }));
    }
  };

  // Grant XP Logic - Refactored to use functional update
  const grantXP = (amount: number) => {
      const boostedAmount = calculateXPWithBoost(amount, userPlan);
      
      setUserSettings(prev => {
          const newXP = prev.xp + boostedAmount;
          const newLevel = calculateLevel(newXP);
          
          if (newLevel > prev.level) {
              setTimeout(() => {
                  addToast(`Поздравления! Достигнахте ниво ${newLevel}! 🎉`, 'success');
                  if (prev.sound) {
                      new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(()=>{});
                  }
              }, 0);
          }
          
          return {
              ...prev,
              xp: newXP,
              level: newLevel
          };
      });
  };

  // Update Daily Quests logic wrapper - Now functional update based
  const updateQuests = (updates: { type: 'message' | 'image' | 'voice', amount?: number }[], subjectId: string) => {
      setUserSettings(prev => {
          if (!prev.dailyQuests) return prev;

          let currentQuests = [...prev.dailyQuests.quests];
          let totalXpGained = 0;
          let newCompleted: string[] = [];

          updates.forEach(({ type, amount = 1 }) => {
              const res = updateQuestProgress(currentQuests, type, subjectId, amount);
              currentQuests = res.updatedQuests;
              totalXpGained += res.xpGained;
              newCompleted.push(...res.completedQuests);
          });

          if (totalXpGained === 0 && JSON.stringify(currentQuests) === JSON.stringify(prev.dailyQuests.quests)) {
              return prev;
          }

          const questXP = calculateXPWithBoost(totalXpGained, userPlan); 
          const newXP = prev.xp + questXP;
          const newLevel = calculateLevel(newXP);

          if (newCompleted.length > 0) {
              setTimeout(() => {
                  newCompleted.forEach(desc => addToast(`Мисия изпълнена: ${desc} (+ XP)`, 'success'));
              }, 0);
          }
          if (newLevel > prev.level) {
              setTimeout(() => {
                  addToast(`Поздравления! Достигнахте ниво ${newLevel}! 🎉`, 'success');
                  if (prev.sound) new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(()=>{});
              }, 500);
          }

          return {
              ...prev,
              xp: newXP,
              level: newLevel,
              dailyQuests: {
                  ...prev.dailyQuests!,
                  quests: currentQuests
              }
          };
      });
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    if (!session) { 
        const currentSubId = activeSubjectRef.current?.id || SubjectId.GENERAL;
        const currentMode = activeModeRef.current || AppMode.CHAT;
        const textToSend = overrideText || inputValue;
        const currentImgs = overrideImages || [...selectedImages];
        
        setPendingChatInput({ 
            text: textToSend, 
            images: currentImgs,
            subjectId: currentSubId,
            mode: currentMode
        });
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
    if (isListening) { 
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setIsListening(false); 
    }
    const currentSubId = currentSubject.id;
    const currentImgs = overrideImages || [...selectedImages];
    const sessId = currentSessionId;
    if (currentImgs.length > 0 && !checkImageLimit(currentImgs.length)) { return; }
    const replyContext = replyingTo; setReplyingTo(null);
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, images: currentImgs, timestamp: Date.now(), replyToId: replyContext?.id };
    const tempAiMsgId = (Date.now() + 1).toString();
    const tempAiMsg: Message = { id: tempAiMsgId, role: 'model', text: "", timestamp: Date.now(), reasoning: "", isStreaming: true };
    setSessions(prev => prev.map(s => {
        if (s.id === sessId) { return { ...s, messages: [...s.messages, newUserMsg, tempAiMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50), role: userRole || undefined }; }
        return s;
    }));
    setInputValue(''); setSelectedImages([]); if(fileInputRef.current) fileInputRef.current.value = '';
    
    // Start Loading and Setup Controller
    isStreamingRef.current = true;
    setLoadingSubjects(prev => ({ ...prev, [currentSubId]: true }));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Watchdog logic
    const startWatchdog = () => {
        if (responseWatchdogRef.current) clearTimeout(responseWatchdogRef.current);
        responseWatchdogRef.current = setTimeout(() => {
            if (abortControllerRef.current === controller) {
                console.warn("AI Response Watchdog Timeout - Aborting");
                controller.abort();
                const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: t('error', userSettings.language) + " (Timeout)", isError: true, timestamp: Date.now(), isStreaming: false };
                setSessions(prev => prev.map(s => { if (s.id === sessId) { return { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? errorMsg : m) }; } return s; }));
                setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
            }
        }, 25000); 
    };

    startWatchdog();

    // --- PROGRESS & XP LOGIC ---
    // Handle generic XP
    let earnedXP = XP_PER_MESSAGE;
    if (currentImgs.length > 0) earnedXP += (currentImgs.length * XP_PER_IMAGE);
    grantXP(earnedXP);

    // Handle Quests (Batch Update to avoid race conditions)
    if (currentImgs.length > 0) {
        incrementImageCount(currentImgs.length);
    }
    const questUpdates: {type: 'message'|'image'|'voice', amount: number}[] = [];
    if (currentImgs.length > 0) {
        questUpdates.push({ type: 'image', amount: currentImgs.length });
    }
    questUpdates.push({ type: 'message', amount: 1 });
    
    updateQuests(questUpdates, currentSubId);
    // ---------------------------

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
      
      let selectedModel = 'gemini-2.5-flash'; 

      if (!userSettings.preferredModel || userSettings.preferredModel === 'auto') {
          if (userPlan === 'plus' || userPlan === 'pro') {
              selectedModel = 'gemini-3-flash';
          } else {
              selectedModel = 'gemini-2.5-flash';
          }
      } else {
          selectedModel = userSettings.preferredModel;
          // Ensure fallback if somehow an invalid model is selected
          if (selectedModel !== 'gemini-2.5-flash' && selectedModel !== 'gemini-3-flash') {
              selectedModel = 'gemini-2.5-flash';
          }
          if (selectedModel === 'gemini-3-flash' && userPlan === 'free') {
              selectedModel = 'gemini-2.5-flash';
          }
      }
      
      const effectiveTeachingStyle = (currentMode === AppMode.LEARN && userSettings.socraticMode) 
          ? 'socratic' 
          : userSettings.teachingStyle;

      const response = await generateResponse(
          currentSubId, 
          currentMode, 
          finalPrompt, 
          currentImgs, 
          historyForAI, 
          selectedModel, 
          (textChunk, reasoningChunk) => {
              startWatchdog(); 
              // Note: Direct REST fetch in generateResponse might not stream chunks granularly in this implementation
              // depending on the fetch reader logic, but the promise resolves with full text.
          },
          controller.signal,
          userSettings.language,
          effectiveTeachingStyle, 
          userSettings.customPersona 
      );

      if (controller.signal.aborted) return "";

      if (response.usage) {
          setTotalInputTokens(prev => prev + response.usage!.inputTokens);
          setTotalOutputTokens(prev => prev + response.usage!.outputTokens);
      }

      setSessions(prev => prev.map(s => {
          if (s.id === sessId) {
              const updatedMessages = s.messages.map(m => {
                  if (m.id === tempAiMsgId) {
                      return { 
                          ...m, 
                          text: response.text, 
                          reasoning: response.reasoning, 
                          isError: response.isError, 
                          type: response.type, 
                          slidesData: response.slidesData, 
                          testData: response.testData, 
                          chartData: response.chartData, 
                          geometryData: response.geometryData, 
                          imageAnalysis: response.imageAnalysis, 
                          sources: response.sources, 
                          isStreaming: false,
                          usage: response.usage
                      };
                  }
                  return m;
              });
              return { ...s, messages: updatedMessages, lastModified: Date.now(), preview: response.text.substring(0, 50) };
          }
          return s;
      }));
      
      if (activeSubjectRef.current?.id !== currentSubId) {
         setUnreadSubjects(prev => new Set(prev).add(currentSubId));
         if (userSettings.notifications) { setNotification({ message: `Нов отговор: ${t(`subject_${currentSubId}`, userSettings.language)}`, subjectId: currentSubId }); setTimeout(() => setNotification(null), 4000); }
      } else if (userSettings.notifications && userSettings.sound) { new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(()=>{}); }
      return response.text;
    } catch (error: any) {
       console.error("HandleSend Error:", error);
       
       if (error.name === 'AbortError' || controller.signal.aborted) {
           return "Aborted";
       }

       const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: t('error', userSettings.language), isError: true, timestamp: Date.now(), isStreaming: false };
       setSessions(prev => prev.map(s => { if (s.id === sessId) { return { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? errorMsg : m) }; } return s; }));
       return "Error.";
    } finally {
       isStreamingRef.current = false;
       if (responseWatchdogRef.current) clearTimeout(responseWatchdogRef.current);
       setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
       abortControllerRef.current = null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session) { setShowAuthModal(true); e.target.value = ''; return; }
    const files = e.target.files;
    if (files && files.length > 0) {
      if (!checkImageLimit(files.length)) { e.target.value = ''; return; }
      setIsImageProcessing(true);
      try { const processedImages = await Promise.all(Array.from(files).map(file => resizeImage(file as File, 800, 0.6))); setSelectedImages(prev => [...prev, ...processedImages]); } catch (err) { console.error("Image processing error", err); addToast("Грешка при обработката на изображението.", "error"); } finally { setIsImageProcessing(false); }
      e.target.value = '';
    }
  };
  
  const handleImagesAdd = (newImages: string[]) => {
      if (!session) { setShowAuthModal(true); return; }
      if (!checkImageLimit(newImages.length)) return;
      setSelectedImages(prev => [...prev, ...newImages]);
  };

  // Camera capture is now unified into file upload via native behavior, separate logic removed

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        let finalImage: string;
        if (file.type === 'image/gif') {
            finalImage = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
        } else { finalImage = await resizeImage(file, 4096, 0.95); }
        setUserSettings(prev => ({ ...prev, customBackground: finalImage }));
      } catch (err) { console.error("Background processing error", err); addToast("Грешка при обработката на фона.", "error"); }
    }
    e.target.value = '';
  };

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }); };
  const handleDeleteMessage = (mId: string) => activeSessionId && setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.id !== mId) } : s));
  
  const handleShare = async (text: string) => {
    if (navigator.share) { try { await navigator.share({ text }); } catch (err) { console.error("Error sharing:", err); } } else { handleCopy(text, 'share-fallback'); addToast('Текстът е копиран!', 'success'); }
  };

  const deleteSession = (sId: string) => { 
    setConfirmModal({
      isOpen: true, title: t('delete', userSettings.language), message: 'Сигурни ли сте, че искате да изтриете този чат? Това действие е необратимо.',
      onConfirm: () => {
        const nextSessions = sessionsRef.current.filter(s => s.id !== sId);
        setSessions(nextSessions); 
        if(sId === activeSessionIdRef.current) {
          const nextInSubject = nextSessions.find(s => s.subjectId === activeSubjectRef.current?.id);
          if(nextInSubject) setActiveSessionId(nextInSubject.id);
          else if (activeSubjectRef.current) { setActiveSessionId(null); setShowSubjectDashboard(true); }
          else setActiveSessionId(null);
        }
        setConfirmModal(null); addToast('Чатът е изтрит', 'success');
      }
    });
  };

  const renameSession = (sId: string, title: string) => { setSessions(prev => prev.map(s => { if (s.id === sId) return { ...s, title }; return s; })); setRenameSessionId(null); };
  
  const handleDeleteAllChats = () => {
    setConfirmModal({
        isOpen: true, 
        title: t('delete_all_chats', userSettings.language), 
        message: 'Сигурни ли сте, че искате да изтриете всички чатове? Това ще изтрие цялата ви история завинаги. Това действие е необратимо.',
        onConfirm: () => {
             setSessions([]);
             setActiveSessionId(null);
             if (activeSubjectRef.current?.id === SubjectId.GENERAL) { createNewSession(SubjectId.GENERAL); } else { setShowSubjectDashboard(true); }
             addToast('Всички чатове са изтрити', 'success');
             setConfirmModal(null);
        }
    });
  };

  const startVoiceCall = async () => { 
    if (!session) { setShowAuthModal(true); return; } 
    
    if (userPlan === 'free') {
        setShowUnlockModal(true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (e) {
        addToast('Моля, разрешете достъп до микрофона.', 'error');
        return;
    }

    setIsVoiceCallActive(true); 
    startLiveSession();
  };
  
  const endVoiceCall = () => { 
      setIsVoiceCallActive(false); 
      setVoiceCallStatus('idle'); 
      if (liveSessionRef.current) {
          liveSessionRef.current.close();
          liveSessionRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
  };

  const startLiveSession = async () => {
      setVoiceCallStatus('listening');
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      try {
          const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
          const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          audioContextRef.current = inputAudioContext; 

          const inputNode = inputAudioContext.createGain();
          const outputNode = outputAudioContext.createGain();
          
          let nextStartTime = 0;
          const sources = new Set<AudioBufferSourceNode>();

          // IMPORTANT: Live API (Multimodal Live) is handled by the SDK.
          // This model string MUST be supported by the SDK's live.connect method.
          // We are adhering to "gemini-2.5-flash-native-audio-dialog" as requested.
          const sessionPromise = ai.live.connect({
              model: LIVE_MODEL, 
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: userSettings.preferredVoice }
                      }
                  },
                  systemInstruction: `You are a helpful assistant talking to the user about ${activeSubjectRef.current?.name || 'General Topic'}. Be concise and conversational.`
              },
              callbacks: {
                  onopen: async () => {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      const source = inputAudioContext.createMediaStreamSource(stream);
                      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                      
                      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                          if (voiceMutedRef.current) return;
                          
                          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                          const pcmBlob = createBlob(inputData);
                          
                          sessionPromise.then((session) => {
                              session.sendRealtimeInput({ media: pcmBlob });
                          });
                      };
                      
                      source.connect(scriptProcessor);
                      scriptProcessor.connect(inputAudioContext.destination);
                  },
                  onmessage: async (message: LiveServerMessage) => {
                      const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                      
                      if (base64Audio) {
                          setVoiceCallStatus('speaking');
                          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                          
                          const audioBuffer = await decodeAudioData(
                              decode(base64Audio),
                              outputAudioContext,
                              24000,
                              1
                          );
                          
                          const source = outputAudioContext.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(outputNode);
                          source.connect(outputAudioContext.destination);
                          
                          source.addEventListener('ended', () => {
                              sources.delete(source);
                              if (sources.size === 0) setVoiceCallStatus('listening');
                          });
                          
                          source.start(nextStartTime);
                          nextStartTime += audioBuffer.duration;
                          sources.add(source);
                          
                          // Optional: Grant small XP for voice interaction
                          grantXP(XP_PER_VOICE / 10); 
                          
                          if (activeSubjectRef.current) {
                              updateQuests([{ type: 'voice', amount: 1 }], activeSubjectRef.current.id);
                          }
                      }
                      
                      if (message.serverContent?.interrupted) {
                          sources.forEach(s => { s.stop(); sources.delete(s); });
                          nextStartTime = 0;
                          setVoiceCallStatus('listening');
                      }
                  },
                  onclose: () => {
                      endVoiceCall();
                  },
                  onerror: (e) => {
                      console.error("Live Session Error", e);
                      addToast("Грешка при връзката с Live AI.", "error");
                      endVoiceCall();
                  }
              }
          });
          
          liveSessionRef.current = await sessionPromise;

      } catch (e) {
          console.error("Start Live Session Failed", e);
          addToast("Неуспешно стартиране на разговор.", "error");
          endVoiceCall();
      }
  };

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
          int16[i] = data[i] * 32768;
      }
      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return {
          data: btoa(binary),
          mimeType: 'audio/pcm;rate=16000',
      };
  }

  function decode(base64: string) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
              channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
      }
      return buffer;
  }

  const toggleListening = () => {
    if (!session) { setShowAuthModal(true); return; }
    if(isListening) { 
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setIsListening(false); 
        return; 
    }
    
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) { addToast('Гласовата услуга не се поддържа от този браузър.', 'error'); return; }
    
    if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    const rec = new SR();
    rec.lang = activeSubject?.id === SubjectId.ENGLISH ? 'en-US' : activeSubject?.id === SubjectId.FRENCH ? 'fr-FR' : (userSettings.language === 'en' ? 'en-US' : 'bg-BG');
    rec.interimResults = true; 
    rec.continuous = false;
    startingTextRef.current = inputValue;

    rec.onresult = (e: any) => {
        let f = '', inter = '';
        for(let i=e.resultIndex; i<e.results.length; ++i) e.results[i].isFinal ? f+=e.results[i][0].transcript : inter+=e.results[i][0].transcript;
        setInputValue((startingTextRef.current + ' ' + f + inter).trim());
    };
    
    rec.onstart = () => setIsListening(true); 
    rec.onend = () => setIsListening(false);
    rec.onerror = (e: any) => { 
        console.error("Mic error:", e.error);
        if(e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            addToast('Не мога да започна запис. Моля, уверете се, че сте позволили достъп до микрофона.', 'error');
        } else {
            addToast('Проблем с микрофона. Моля, опитайте отново.', 'info');
        }
        setIsListening(false); 
    };

    recognitionRef.current = rec; 
    try {
        rec.start();
    } catch (err) {
        console.error("Start speech failed:", err);
        setIsListening(false);
    }
  };

  const handleRate = (messageId: string, rating: 'up' | 'down') => { if (!activeSessionId) return; setSessions(prev => prev.map(s => { if (s.id === activeSessionId) { return { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, rating } : m) }; } return s; })); };
  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };
  
  const handleUnlockSubmit = async () => {
    setUnlockLoading(true); const key = unlockKeyInput.trim();
    const result = await redeemKey(key, session?.user?.id);
    if (result.valid) {
       const newPlan = targetPlan || result.plan || 'pro';
       setUserPlan(newPlan);
       if (newPlan !== 'free') { setUserSettings(prev => ({ ...prev, preferredModel: 'auto' })); }
       setShowUnlockModal(false); setUnlockKeyInput('');
       addToast(`Успешно активирахте план ${newPlan.toUpperCase()}!`, 'success');
       if (session) { await supabase.auth.updateUser({ data: { plan: newPlan } }); }
    } else { addToast(result.error || "Невалиден ключ.", 'error'); }
    setUnlockLoading(false);
  };

  const handleAdminLogin = async () => { const isValid = await verifyAdminPassword(adminPasswordInput); if (isValid) { setShowAdminAuth(false); setShowAdminPanel(true); setAdminPasswordInput(''); addToast("Успешен вход в админ панела", 'success'); } else { addToast("Грешна парола!", 'error'); } };

  const generateKey = async (plan: 'plus' | 'pro' = 'pro') => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); const checksum = generateChecksum(randomCore); const newKeyCode = `UCH-${randomCore}-${checksum}`;
    await registerKeyInDb(newKeyCode, plan);
    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false, plan };
    const updatedKeys = [newKeyObj, ...generatedKeys];
    setGeneratedKeys(updatedKeys);
    localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
  };
  
  const handleQuickStart = (message: string, images: string[] = []) => {
      setPendingHomeInput({ text: message, images });
      handleSubjectChange(SUBJECTS[0]); 
  };

  if (authLoading) {
    return (
       <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
       </div>
    );
  }

  const isPremium = userPlan === 'plus' || userPlan === 'pro';

  return (
    <div className="flex h-full w-full relative overflow-hidden text-foreground">
      <Snowfall active={!!userSettings.christmasMode} />
      
      {broadcastModal && broadcastModal.isOpen && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setBroadcastModal(null)}>
              <div className="bg-[#09090b] border border-indigo-500/30 w-full max-w-md p-8 rounded-[32px] shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setBroadcastModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                  <div className="flex flex-col items-center gap-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <Radio size={32} className="text-white animate-pulse" />
                      </div>
                      <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white tracking-tight">System Message</h2>
                          <div className="text-lg text-gray-300 font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                              {broadcastModal.message}
                          </div>
                      </div>
                      <button onClick={() => setBroadcastModal(null)} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">Close</button>
                  </div>
              </div>
          </div>
      )}
      
      {!userSettings.customBackground && (
        <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.4]' : ''} ${userSettings.christmasMode ? 'opacity-0' : 'opacity-100'}`}></div>
      )}

      {userSettings.customBackground && (
         <div 
           className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.2] grayscale' : ''} ${userSettings.christmasMode ? 'opacity-0' : 'opacity-100'}`}
           style={getBackgroundImageStyle(userSettings.customBackground)}
         />
      )}

      <div 
        className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.2] grayscale' : ''} ${userSettings.christmasMode ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url('https://i.ibb.co/WNmGnfdC/Gemini-Generated-Image-g5c7r7g5c7r7g5c7.png')` }}
      />

      {!userSettings.customBackground && !userSettings.christmasMode && (
        <>
            <div className={`fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow transition-opacity ${focusMode ? 'opacity-20' : 'opacity-100'}`} />
            <div className={`fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow delay-1000 transition-opacity ${focusMode ? 'opacity-20' : 'opacity-100'}`} />
        </>
      )}
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => { if(e.target === e.currentTarget) closeAuthModal() }}>
           <div className="relative w-full max-w-md">
              <button onClick={closeAuthModal} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20}/></button>
              <Auth isModal={true} onSuccess={closeAuthModal} initialMode={initialAuthMode} />
           </div>
        </div>
      )}

      {focusMode && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in">
              <button onClick={() => setFocusMode(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/10">
                  <Minimize size={18}/> Exit Focus
              </button>
          </div>
      )}

      {!focusMode && (
          <Sidebar 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            userSettings={userSettings}
            setUserSettings={setUserSettings}
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
            setShowReferralModal={setShowReferralModal}
            setShowSettings={setShowSettings}
            handleLogout={handleLogout}
            setShowAuthModal={setShowAuthModal}
            addToast={addToast}
            setShowSubjectDashboard={setShowSubjectDashboard}
            userRole={userRole}
            streak={0} // Streak is removed
            syncStatus={syncStatus}
            homeView={homeView}
            dailyImageCount={dailyImageCount}
            setShowLeaderboard={setShowLeaderboard}
            setShowQuests={setShowQuests}
            setShowReportModal={setShowReportModal}
          />
      )}
      
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden transition-all duration-300 z-10">
        {(syncStatus === 'error' && syncErrorDetails) || missingDbTables ? (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-2 fade-in">
                <div className={`backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md border ${missingDbTables ? 'bg-amber-600/90 border-amber-500/50' : 'bg-red-500/90 border-red-400/50'}`}>
                    {missingDbTables ? <Database size={20} className="shrink-0"/> : <AlertCircle size={20} className="shrink-0"/>}
                    <div className="flex-1 text-xs">
                        <span className="font-bold block mb-0.5">{missingDbTables ? 'Database Setup Required' : t('sync_error', userSettings.language)}</span>
                        <span className="opacity-90">
                            {missingDbTables 
                                ? 'Run SQL commands to update schema.' 
                                : syncErrorDetails || t('error', userSettings.language)}
                        </span>
                    </div>
                    {!missingDbTables && <button onClick={() => setSyncStatus('synced')} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16}/></button>}
                </div>
            </div>
        ) : null}

        {homeView === 'auth_success' ? (
            <AuthSuccess 
                type={authSuccessType || 'generic'} 
                onContinue={() => {
                    setHomeView('landing');
                    setAuthSuccessType(null);
                    window.history.replaceState(null, '', window.location.pathname);
                }}
                userSettings={userSettings}
            />
        ) : !activeSubject ? (
            homeView === 'terms' ? <TermsOfService onBack={() => setHomeView('landing')} userSettings={userSettings} /> :
            homeView === 'privacy' ? <PrivacyPolicy onBack={() => setHomeView('landing')} userSettings={userSettings} /> :
            homeView === 'cookies' ? <CookiePolicy onBack={() => setHomeView('landing')} userSettings={userSettings} /> :
            homeView === 'about' ? <About onBack={() => setHomeView('landing')} userSettings={userSettings} /> :
            homeView === 'contact' ? <Contact onBack={() => setHomeView('landing')} userSettings={userSettings} /> :
            <WelcomeScreen 
                homeView={homeView}
                userMeta={userMeta}
                userSettings={userSettings}
                handleSubjectChange={(s) => handleSubjectChange(s)}
                setHomeView={setHomeView}
                setUserRole={setUserRole}
                setShowAdminAuth={setShowAdminAuth}
                onQuickStart={handleQuickStart}
                setSidebarOpen={setSidebarOpen}
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
            <div className={`flex-1 flex flex-col relative h-full bg-transparent`}>
                {!focusMode && (
                    <ChatHeader 
                        setSidebarOpen={setSidebarOpen}
                        activeSubject={activeSubject}
                        setActiveSubject={setActiveSubject}
                        setUserSettings={setUserSettings}
                        userRole={userRole}
                        activeMode={activeMode}
                        startVoiceCall={startVoiceCall}
                        createNewSession={createNewSession}
                        setHistoryDrawerOpen={setHistoryDrawerOpen}
                        userSettings={userSettings}
                        setFocusMode={setFocusMode}
                    />
                )}
                
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
                    userSettings={userSettings}
                    onChangeVoice={(v) => setUserSettings({...userSettings, preferredVoice: v})}
                />

                <MessageList 
                    currentMessages={currentMessages}
                    userSettings={userSettings}
                    setZoomedImage={setZoomedImage}
                    handleRate={handleRate}
                    handleReply={handleReply}
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
                    setUserSettings={setUserSettings}
                    activeMode={activeMode}
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
                    onStopGeneration={handleStopGeneration}
                    onImagesAdd={handleImagesAdd}
                />
            </div>
        )}
      </main>

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
            userSettings={userSettings}
            addToast={addToast}
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
            handleDeleteAllChats={handleDeleteAllChats}
            addToast={addToast}
            userPlan={userPlan}
        />
        <ReferralModal 
            isOpen={showReferralModal} 
            onClose={() => setShowReferralModal(false)}
            userSettings={userSettings}
            addToast={addToast}
        />
        <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUserId={session?.user?.id}
        />
        <DailyQuestsModal
            isOpen={showQuests}
            onClose={() => setShowQuests(false)}
            quests={userSettings.dailyQuests?.quests || []}
        />
        <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            userSettings={userSettings}
            addToast={addToast}
            userId={session?.user?.id}
        />
        <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
        
        <ConfirmModal 
            isOpen={!!confirmModal}
            title={confirmModal?.title || ''}
            message={confirmModal?.message || ''}
            onConfirm={confirmModal?.onConfirm || (() => {})}
            onCancel={() => setConfirmModal(null)}
        />

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${TOAST_CONTAINER} ${t.type === 'error' ? TOAST_ERROR : t.type === 'success' ? TOAST_SUCCESS : TOAST_INFO}`}>
             {t.type === 'error' ? <AlertCircle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : t.message.includes('Friend verified') ? <Gift size={18} className="text-amber-500" /> : <Info size={18}/>}
             <span className="font-medium text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};