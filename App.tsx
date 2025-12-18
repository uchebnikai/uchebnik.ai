
import React, { useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, Slide, UserSettings, Session, UserPlan, UserRole, HomeViewType } from './types';
import { SUBJECTS } from './constants';
import { generateResponse } from './services/aiService';
import { supabase } from './supabaseClient';
import { Auth } from './components/auth/Auth';
import { 
  Loader2, X, AlertCircle, CheckCircle, Info, Minimize, Database
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
  const [isRemoteDataLoaded, setIsRemoteDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [syncErrorDetails, setSyncErrorDetails] = useState<string | null>(null);
  const [missingDbTables, setMissingDbTables] = useState(false);

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
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const [homeView, setHomeView] = useState<HomeViewType>('landing');

  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [userMeta, setUserMeta] = useState({ firstName: '', lastName: '', avatar: '' });
  const [editProfile, setEditProfile] = useState({ firstName: '', lastName: '', avatar: '', email: '', password: '', currentPassword: '' });

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [dailyImageCount, setDailyImageCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [targetPlan, setTargetPlan] = useState<UserPlan | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

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
    customBackground: null,
    language: 'bg'
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
  
  // AbortController for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const syncSessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isIncomingUpdateRef = useRef(false);
  const isRemoteDataLoadedRef = useRef(false);

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Effects ---

  // Auth Effect
  useEffect(() => {
    const handleHashError = () => {
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                addToast(`Грешка при вход: ${decodeURIComponent(errorDescription)}`, 'error');
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    };
    handleHashError();

    const syncProfile = (session: SupabaseSession | null) => {
        setSession(session);
        setAuthLoading(false);
        if (session) {
            setShowAuthModal(false);
        } else {
            setSessions([]);
            setSyncStatus('synced');
            setIsRemoteDataLoaded(false);
        }

        if (session?.user?.user_metadata) {
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
    };

    supabase.auth.getSession().then(({ data: { session } }) => syncProfile(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Cloud Sync Effects
  useEffect(() => {
      if (!session?.user?.id) {
          setIsRemoteDataLoaded(false);
          isRemoteDataLoadedRef.current = false;
          return;
      }
      
      const loadRemoteData = async () => {
          setIsRemoteDataLoaded(false);
          isRemoteDataLoadedRef.current = false;
          setSyncStatus('syncing');
          setMissingDbTables(false);
          
          try {
              const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('settings, theme_color, custom_background')
                  .eq('id', session.user.id)
                  .single();
              
              if (profileError && profileError.code === '42P01') {
                  setMissingDbTables(true);
                  throw new Error("Missing tables");
              }

              if (profileData) {
                  if (profileData.settings) {
                      const { plan, stats, ...restSettings } = profileData.settings;
                      const merged = { ...restSettings, themeColor: profileData.theme_color, customBackground: profileData.custom_background };
                      // Ensure language is set
                      if (!merged.language) merged.language = 'bg';
                      setUserSettings(prev => ({ ...prev, ...merged }));
                      if (plan) setUserPlan(plan);
                      if (stats) {
                          setStreak(stats.streak || 0);
                          const today = new Date().toDateString();
                          if (stats.lastImageDate === today) {
                              setDailyImageCount(stats.dailyImageCount || 0);
                          } else {
                              setDailyImageCount(0);
                          }
                      }
                  } else {
                      if (profileData.theme_color) setUserSettings(prev => ({...prev, themeColor: profileData.theme_color}));
                      if (profileData.custom_background) setUserSettings(prev => ({...prev, customBackground: profileData.custom_background}));
                  }
              }

              const { data: sessionData, error: sessionError } = await supabase
                  .from('user_data')
                  .select('data')
                  .eq('user_id', session.user.id)
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
          } catch (err) {
              console.error("Failed to load remote data", err);
          } finally {
              setIsRemoteDataLoaded(true);
              isRemoteDataLoadedRef.current = true;
          }
      };
      
      loadRemoteData();
  }, [session?.user?.id]);

  // Subscriptions
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
                      addToast(t('synced', userSettings.language), 'info');
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
              if (remoteData && remoteData.settings) {
                  isIncomingUpdateRef.current = true;
                  const { plan, stats, ...settingsRest } = remoteData.settings;
                  setUserSettings(prev => ({ ...prev, ...settingsRest, themeColor: remoteData.theme_color, custom_background: remoteData.custom_background }));
                  if (plan) setUserPlan(plan);
                  if (stats) {
                      setStreak(stats.streak || 0);
                      const today = new Date().toDateString();
                      if (stats.lastImageDate === today) {
                          setDailyImageCount(stats.dailyImageCount || 0);
                      } else {
                          setDailyImageCount(0);
                      }
                  }
                  addToast('Настройките са синхронизирани', 'info');
              }
          })
          .subscribe();
      return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, missingDbTables]);

  // Saving Effects
  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded) return;
      if (missingDbTables) return; 
      if (isIncomingUpdateRef.current) { isIncomingUpdateRef.current = false; return; }
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
              stats: { streak, dailyImageCount, lastImageDate: localStorage.getItem('uchebnik_image_date'), lastVisit: localStorage.getItem('uchebnik_last_visit') }
          };
          const { error } = await supabase.from('profiles').upsert({
              id: session.user.id, settings: fullSettingsPayload, theme_color: userSettings.themeColor, custom_background: userSettings.customBackground, updated_at: new Date().toISOString()
          });
          if (error && error.code === '42P01') { setMissingDbTables(true); }
      }, 1000);
      return () => { if(syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current); };
  }, [userSettings, userPlan, streak, dailyImageCount, session?.user?.id, isRemoteDataLoaded, missingDbTables]);

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
       if (window.innerWidth >= 1024) { setSidebarOpen(true); } else { setSidebarOpen(false); }
    };
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialization Data Loading
  useEffect(() => {
    const initData = async () => {
        const userId = session?.user?.id;
        const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
        const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
        const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
        const streakKey = userId ? `uchebnik_streak_${userId}` : 'uchebnik_streak';
        const lastVisitKey = userId ? `uchebnik_last_visit_${userId}` : 'uchebnik_last_visit';

        try {
            const loadedSessions = await getSessionsFromStorage(sessionsKey);
            if (!isRemoteDataLoadedRef.current) {
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
            }
            const loadedSettings = await getSettingsFromStorage(settingsKey);
            if (!isRemoteDataLoadedRef.current) {
                if (loadedSettings) setUserSettings(loadedSettings);
                else {
                     const lsSettings = localStorage.getItem(settingsKey);
                     if (lsSettings) setUserSettings(JSON.parse(lsSettings));
                     else if (userId) {
                        setUserSettings({
                            userName: session?.user?.user_metadata?.full_name || '', gradeLevel: '8-12', textSize: 'normal', haptics: true, notifications: true, sound: true, reduceMotion: false, responseLength: 'concise', creativity: 'balanced', languageLevel: 'standard', preferredModel: 'auto', themeColor: '#6366f1', customBackground: null, language: 'bg'
                        });
                     }
                }
            }
        } catch (err) { console.error("Initialization Error", err); }

        if (!isRemoteDataLoadedRef.current) {
            const savedPlan = localStorage.getItem(planKey);
            if (savedPlan) setUserPlan(savedPlan as UserPlan);
            else {
               if (!userId) {
                   const oldPro = localStorage.getItem('uchebnik_pro_status');
                   if (oldPro === 'unlocked') {
                       setUserPlan('pro');
                       localStorage.setItem('uchebnik_user_plan', 'pro');
                   }
               }
            }
        }
        const savedAdminKeys = localStorage.getItem('uchebnik_admin_keys');
        if (savedAdminKeys) setGeneratedKeys(JSON.parse(savedAdminKeys));

        const today = new Date().toDateString();
        if (!isRemoteDataLoadedRef.current) {
            const lastUsageDate = localStorage.getItem('uchebnik_image_date');
            const lastUsageCount = localStorage.getItem('uchebnik_image_count');
            if (lastUsageDate !== today) {
                setDailyImageCount(0);
                localStorage.setItem('uchebnik_image_date', today);
                localStorage.setItem('uchebnik_image_count', '0');
            } else {
                setDailyImageCount(parseInt(lastUsageCount || '0'));
            }
            const lastVisit = localStorage.getItem(lastVisitKey);
            const savedStreak = parseInt(localStorage.getItem(streakKey) || '0', 10);
            if (lastVisit !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastVisit === yesterday.toDateString()) {
                    const newStreak = savedStreak + 1;
                    setStreak(newStreak);
                    localStorage.setItem(streakKey, newStreak.toString());
                } else {
                    setStreak(1);
                    localStorage.setItem(streakKey, '1');
                }
                localStorage.setItem(lastVisitKey, today);
            } else {
                setStreak(savedStreak);
            }
        }
    };
    initData();
    const loadVoices = () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices(); };
    if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
  }, [session, isRemoteDataLoaded]);

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

  // Voice Effects
  useEffect(() => {
    voiceMutedRef.current = voiceMuted;
    if (isVoiceCallActive) {
      if (voiceMuted) { if (voiceCallStatus === 'listening') { voiceCallRecognitionRef.current?.stop(); } } 
      else { if (voiceCallStatus === 'listening' || voiceCallStatus === 'idle') { startVoiceRecognition(); } }
    }
  }, [voiceMuted, isVoiceCallActive]);

  useEffect(() => { return () => { window.speechSynthesis.cancel(); if(audioRef.current) audioRef.current.pause(); } }, []);

  // --- Logic Helpers ---
  const checkImageLimit = (count = 1): boolean => {
      let limit = 4;
      if (userPlan === 'plus') limit = 12;
      if (userPlan === 'pro') limit = 9999;
      if (dailyImageCount + count > limit) { addToast(`Достигнахте лимита за изображения за деня (${limit}). Ъпгрейднете плана си за повече.`, 'error'); return false; }
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
    
    // We use t() but we need the raw name/desc for the session title initially. 
    // Session titles are stored, so they will be in the language they were created in.
    const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
    const subjectName = subjectConfig ? t(`subject_${subjectId}`, userSettings.language) : "Subject";
    
    const getModeName = (m: AppMode) => {
        // Translation keys for modes
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
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    // Force stop loading state for active subject immediately
    if (activeSubject) {
        setLoadingSubjects(prev => ({ ...prev, [activeSubject.id]: false }));
    }
    
    // Also stop listening if active
    if (isListening) {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }
    
    // Stop speaking if active
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
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
    setLoadingSubjects(prev => ({ ...prev, [currentSubId]: true }));
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      let preferredModel = 'gemini-2.5-flash';
      if (userPlan === 'plus') preferredModel = 'gemini-2.5-flash';
      if (userPlan === 'pro') preferredModel = 'gemini-2.5-flash';
      
      const response = await generateResponse(
          currentSubId, 
          currentMode, 
          finalPrompt, 
          currentImgs, 
          historyForAI, 
          preferredModel, 
          (textChunk, reasoningChunk) => {
              setSessions(prev => prev.map(s => {
                  if (s.id === sessId) {
                      return { ...s, messages: s.messages.map(m => {
                              if (m.id === tempAiMsgId) { return { ...m, text: textChunk, reasoning: reasoningChunk, isStreaming: true }; }
                              return m;
                          }) };
                  }
                  return s;
              }));
          },
          controller.signal,
          userSettings.language // Pass Language
      );

      if (currentImgs.length > 0) { incrementImageCount(currentImgs.length); }
      setSessions(prev => prev.map(s => {
          if (s.id === sessId) {
              const updatedMessages = s.messages.map(m => {
                  if (m.id === tempAiMsgId) {
                      return { ...m, text: response.text, reasoning: response.reasoning, isError: response.isError, type: response.type, slidesData: response.slidesData, testData: response.testData, chartData: response.chartData, geometryData: response.geometryData, imageAnalysis: response.imageAnalysis, isStreaming: false };
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
       // Only show error message if it wasn't an intentional abort
       if (error.name !== 'AbortError' && !controller.signal.aborted) {
           const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: t('error', userSettings.language), isError: true, timestamp: Date.now(), isStreaming: false };
           setSessions(prev => prev.map(s => { if (s.id === sessId) { return { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? errorMsg : m) }; } return s; }));
           return "Error.";
       }
       return "";
    } finally {
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

  const handleCameraCapture = (base64Image: string) => {
    if (!session) { setShowAuthModal(true); return; }
    if (!checkImageLimit(1)) return;
    setSelectedImages(prev => [...prev, base64Image]);
  };

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

  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); 
    if(audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
    let hasEnded = false;
    const safeOnEnd = () => { if(hasEnded) return; hasEnded = true; if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; } utteranceRef.current = null; if(onEnd) onEnd(); };
    const estimatedDuration = Math.max(3000, (text.length / 10) * 1000 + 2000); 
    speakingTimeoutRef.current = setTimeout(() => { safeOnEnd(); }, estimatedDuration);
    const clean = text.replace(/[*#`_\[\]]/g, '').replace(/\$\$.*?\$\$/g, 'формула').replace(/http\S+/g, '');
    let lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : (userSettings.language === 'en' ? 'en-US' : 'bg-BG');
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if ((!v && lang.startsWith('bg')) || !window.speechSynthesis) {
        const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(clean)}&tl=${lang.split('-')[0]}`);
        audioRef.current = a; a.onended = safeOnEnd; a.onerror = (e) => { console.error("Audio error", e); safeOnEnd(); }; a.play().catch((e) => { console.error("Audio play error", e); safeOnEnd(); });
    } else {
        const u = new SpeechSynthesisUtterance(clean); u.lang = lang; if(v) u.voice = v; utteranceRef.current = u; u.onend = safeOnEnd; u.onerror = (e) => { console.error("Speech Synthesis Error", e); utteranceRef.current = null; safeOnEnd(); }
        window.speechSynthesis.speak(u);
    }
  };
  const handleSpeak = (txt: string, id: string) => { if(speakingMessageId === id) { window.speechSynthesis.cancel(); if(audioRef.current) audioRef.current.pause(); setSpeakingMessageId(null); return; } setSpeakingMessageId(id); speakText(txt, () => setSpeakingMessageId(null)); };

  const startVoiceCall = () => { 
    if (!session) { setShowAuthModal(true); return; } 
    setIsVoiceCallActive(true); 
    startVoiceRecognition();
  };
  
  const endVoiceCall = () => { setIsVoiceCallActive(false); setVoiceCallStatus('idle'); if(voiceCallRecognitionRef.current) { voiceCallRecognitionRef.current.onend = null; voiceCallRecognitionRef.current.stop(); } window.speechSynthesis.cancel(); utteranceRef.current = null; if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; } };

  const startVoiceRecognition = () => {
     if (voiceMutedRef.current) { setVoiceCallStatus('idle'); voiceCallStatusRef.current = 'idle'; return; }
     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if(!SR) { addToast('Гласовото разпознаване не се поддържа.', 'error'); endVoiceCall(); return; }
     
     try { if(voiceCallRecognitionRef.current) { voiceCallRecognitionRef.current.onend = null; voiceCallRecognitionRef.current.stop(); } } catch(e) {}
     
     const rec = new SR();
     rec.lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : (userSettings.language === 'en' ? 'en-US' : 'bg-BG');
     rec.continuous = false; 
     rec.interimResults = false;
     rec.onstart = () => { if(voiceMutedRef.current) { rec.stop(); return; } setVoiceCallStatus('listening'); voiceCallStatusRef.current = 'listening'; };
     rec.onresult = async (e: any) => {
        if(voiceMutedRef.current) return;
        const t = e.results[0][0].transcript;
        if(t.trim()) {
           setVoiceCallStatus('processing'); voiceCallStatusRef.current = 'processing';
           const res = await handleSend(t);
           if(res) { setVoiceCallStatus('speaking'); voiceCallStatusRef.current = 'speaking'; speakText(res, () => { if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } }); } else { if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } }
        }
     };
     rec.onend = () => { 
        if(isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) { 
            try { rec.start(); } catch(e){}
        } 
     };
     rec.onerror = (e: any) => { 
        console.error("Voice Recognition Error:", e.error);
        if(e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            addToast('Гласовата услуга е заета. Моля, опитайте след малко.', 'error');
            endVoiceCall();
        } else if(e.error === 'no-speech' && isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) { 
            try { rec.start(); } catch(e){}
        } 
     }
     voiceCallRecognitionRef.current = rec; 
     try {
         rec.start();
     } catch (e) { console.error(e); }
  };

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
    
    // Clean up
    if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    const rec = new SR();
    rec.lang = activeSubject?.id === SubjectId.ENGLISH ? 'en-US' : activeSubject?.id === SubjectId.FRENCH ? 'fr-FR' : (userSettings.language === 'en' ? 'en-US' : 'bg-BG');
    rec.interimResults = true; 
    rec.continuous = false; // iOS Safari hates continuous = true
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

  const generateKey = async () => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); const checksum = generateChecksum(randomCore); const newKeyCode = `UCH-${randomCore}-${checksum}`;
    await registerKeyInDb(newKeyCode, 'pro');
    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false };
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
      {userSettings.customBackground && (
         <div 
           className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500 ${focusMode ? 'brightness-[0.2] grayscale' : ''}`}
           style={getBackgroundImageStyle(userSettings.customBackground)}
         />
      )}

      {!userSettings.customBackground && (
        <>
            <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none z-0 transition-all duration-500 ${focusMode ? 'brightness-[0.4]' : ''}`}></div>
            <div className={`fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow transition-opacity ${focusMode ? 'opacity-20' : ''}`} />
            <div className={`fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow delay-1000 transition-opacity ${focusMode ? 'opacity-20' : ''}`} />
        </>
      )}
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => { if(e.target === e.currentTarget) setShowAuthModal(false) }}>
           <div className="relative w-full max-w-md">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20}/></button>
              <Auth isModal={true} onSuccess={() => setShowAuthModal(false)} />
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
            streak={streak}
            syncStatus={syncStatus}
            homeView={homeView}
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
                                ? 'Tables missing. Please run the SQL setup script in Supabase.' 
                                : syncErrorDetails || t('error', userSettings.language)}
                        </span>
                    </div>
                    {!missingDbTables && <button onClick={() => setSyncStatus('synced')} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16}/></button>}
                </div>
            </div>
        ) : null}

        {!activeSubject ? (
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
                    onCameraCapture={handleCameraCapture}
                    onStopGeneration={handleStopGeneration}
                />
            </div>
        )}
      </main>

        {/* Modals moved outside of main to properly overlay sidebar */}
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
             {t.type === 'error' ? <AlertCircle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : <Info size={18}/>}
             <span className="font-medium text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
