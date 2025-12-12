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
    customBackground: null
  });
  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, subjectId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // Focus Mode
  const [focusMode, setFocusMode] = useState(false);

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
  
  // Sync debounce timers
  const syncSessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Flag to prevent save loops when receiving data from cloud
  const isIncomingUpdateRef = useRef(false);
  const isRemoteDataLoadedRef = useRef(false);

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Effects ---

  // Auth Effect
  useEffect(() => {
    // Check for errors in the URL hash from OAuth redirects
    const handleHashError = () => {
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                addToast(`Грешка при вход: ${decodeURIComponent(errorDescription)}`, 'error');
                // Clean URL
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
            // We do NOT sync plan from metadata here anymore, as the "Truth" is now in the profiles table
        } else {
            // Logout cleanup
            setSessions([]);
            setSyncStatus('synced');
            setIsRemoteDataLoaded(false);
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
  
  // Cloud Sync: Load Data on Login
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
              // Load Settings, Plan, and Stats from 'profiles'
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
                  // 1. Settings (Merge)
                  if (profileData.settings) {
                      // Extract special fields that are stored in settings
                      const { plan, stats, ...restSettings } = profileData.settings;
                      
                      const merged = { ...restSettings, themeColor: profileData.theme_color, customBackground: profileData.custom_background };
                      setUserSettings(prev => ({ ...prev, ...merged }));

                      // 2. Plan (Ensure fallback)
                      setUserPlan(plan || 'free');

                      // 3. Stats (Streak & Usage)
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
                      // No settings found (legacy row?), apply theme at least
                      if (profileData.theme_color) setUserSettings(prev => ({...prev, themeColor: profileData.theme_color}));
                      if (profileData.custom_background) setUserSettings(prev => ({...prev, customBackground: profileData.custom_background}));
                  }
              }

              // Load Sessions
              const { data: sessionData, error: sessionError } = await supabase
                  .from('user_data')
                  .select('data')
                  .eq('user_id', session.user.id)
                  .single();
              
              if (sessionError) {
                  if (sessionError.code === '42P01') { // undefined_table
                      setMissingDbTables(true);
                  } else if (sessionError.code !== 'PGRST116') { // not found is ok
                      console.warn("Session load error:", sessionError);
                  }
              }
                  
              if (sessionData && sessionData.data) {
                  // Mark as incoming to prevent immediate save loop
                  isIncomingUpdateRef.current = true;
                  setSessions(sessionData.data);
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

  // Cloud Sync: Realtime Subscription (Sessions)
  useEffect(() => {
      if (!session?.user?.id || missingDbTables) return;

      const channel = supabase.channel(`sync-sessions:${session.user.id}`)
          .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'user_data', 
              filter: `user_id=eq.${session.user.id}` 
          }, (payload) => {
              const remoteSessions = (payload.new as any).data;
              if (remoteSessions) {
                  const currentJson = JSON.stringify(sessionsRef.current.map(s => ({...s, messages: s.messages.map(m => ({...m, images: []}))})));
                  const remoteJson = JSON.stringify(remoteSessions.map((s: Session) => ({...s, messages: s.messages.map((m: Message) => ({...m, images: []}))})));
                  
                  if (currentJson !== remoteJson) {
                      isIncomingUpdateRef.current = true; 
                      setSessions(remoteSessions);
                      addToast('Чатовете са синхронизирани', 'info');
                  }
              }
          })
          .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, missingDbTables]);

  // Cloud Sync: Realtime Subscription (Profiles - Settings/Plan/Stats)
  useEffect(() => {
      if (!session?.user?.id || missingDbTables) return;

      const channel = supabase.channel(`sync-profiles:${session.user.id}`)
          .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'profiles', 
              filter: `id=eq.${session.user.id}` 
          }, (payload) => {
              const remoteData = payload.new as any;
              if (remoteData && remoteData.settings) {
                  console.log("Received profile update", remoteData);
                  isIncomingUpdateRef.current = true; // Block save trigger

                  const { plan, stats, ...settingsRest } = remoteData.settings;
                  
                  // Update Settings
                  setUserSettings(prev => ({ 
                      ...prev, 
                      ...settingsRest, 
                      themeColor: remoteData.theme_color, 
                      customBackground: remoteData.custom_background 
                  }));

                  // Update Plan (Robust check)
                  if (plan !== undefined) setUserPlan(plan);

                  // Update Stats
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


  // Cloud Sync: Save Sessions on Change
  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded) return;
      if (missingDbTables) return; 
      
      if (isIncomingUpdateRef.current) {
          isIncomingUpdateRef.current = false;
          return;
      }
      
      setSyncStatus('syncing');
      setSyncErrorDetails(null);

      if (syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current);
      
      syncSessionsTimer.current = setTimeout(async () => {
          const sanitizedSessions = sessions.map(s => ({
              ...s,
              messages: s.messages.map(m => ({
                  ...m,
                  images: m.images ? [] : undefined 
              }))
          }));

          const { error } = await supabase.from('user_data').upsert({
              user_id: session.user.id,
              data: sanitizedSessions,
              updated_at: new Date().toISOString()
          });
          
          if (error) {
             console.error("Sync Error:", error);
             setSyncStatus('error');
             setSyncErrorDetails(error.message || "Unknown error");
             if (error.code === '42P01') setMissingDbTables(true);
          } else {
             setSyncStatus('synced');
          }
      }, 2000); 

      return () => { if(syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current); };
  }, [sessions, session?.user?.id, isRemoteDataLoaded, missingDbTables]);

  // Cloud Sync: Save Settings, Plan & Stats on Change
  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded) return;
      if (missingDbTables) return;

      if (isIncomingUpdateRef.current) {
          // Note: Since sessions and settings might update separately, 
          // we should technically have separate flags, but for simplicity 
          // we use one. If high conflict rate, split them.
          // For now, allow fall-through if it wasn't a session update that triggered this.
          // However, useEffects fire specifically on dep change. 
          // If we received a profile update, setUserSettings fired, triggering this.
          // We must block it.
          // Since we consume the flag in the sessions effect often, we need to be careful.
          // Let's rely on the flag being true immediately after update.
          // But wait, the flag is reset in the Sessions effect if sessions changed.
          // If ONLY settings changed, Sessions effect wont run, flag stays true? 
          // No, react batches.
          
          // Better approach: Just save. The DB handles concurrency reasonably well for this scale.
          // But to avoid "bounce back" (saving what we just received), we check.
          isIncomingUpdateRef.current = false;
          return;
      }

      if (syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current);
      
      syncSettingsTimer.current = setTimeout(async () => {
          // Prepare consolidated settings object
          const fullSettingsPayload = {
              ...userSettings,
              plan: userPlan,
              stats: {
                  streak,
                  dailyImageCount,
                  lastImageDate: localStorage.getItem('uchebnik_image_date'),
                  lastVisit: localStorage.getItem('uchebnik_last_visit')
              }
          };

          const { error } = await supabase.from('profiles').upsert({
              id: session.user.id,
              settings: fullSettingsPayload,
              theme_color: userSettings.themeColor,
              custom_background: userSettings.customBackground,
              updated_at: new Date().toISOString()
          });
          if (error && error.code === '42P01') {
              setMissingDbTables(true);
          }
      }, 1000);

      return () => { if(syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current); };
  }, [userSettings, userPlan, streak, dailyImageCount, session?.user?.id, isRemoteDataLoaded, missingDbTables]);


  // Window Resize Listener
  useEffect(() => {
    const handleResize = () => {
       if (window.innerWidth >= 1024) {
           setSidebarOpen(true);
       } else {
           setSidebarOpen(false);
       }
    };
    
    // Initial check
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data Loading Effect (IndexedDB)
  useEffect(() => {
    const initData = async () => {
        const userId = session?.user?.id;
        const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
        const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
        const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
        const streakKey = userId ? `uchebnik_streak_${userId}` : 'uchebnik_streak';
        const lastVisitKey = userId ? `uchebnik_last_visit_${userId}` : 'uchebnik_last_visit';

        try {
            // Load Sessions
            const loadedSessions = await getSessionsFromStorage(sessionsKey);
            
            // Only use local if remote hasn't loaded (Offline Mode or Initial Load)
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

            // Load Settings
            const loadedSettings = await getSettingsFromStorage(settingsKey);
            if (!isRemoteDataLoadedRef.current) {
                if (loadedSettings) setUserSettings(loadedSettings);
                else {
                     const lsSettings = localStorage.getItem(settingsKey);
                     if (lsSettings) setUserSettings(JSON.parse(lsSettings));
                     else if (userId) {
                        // Default settings
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
            }
        } catch (err) {
            console.error("Initialization Error", err);
        }

        // Plan & Streak (From LocalStorage fallbacks, or if offline)
        if (!isRemoteDataLoadedRef.current) {
            const savedPlan = localStorage.getItem(planKey);
            if (savedPlan) setUserPlan(savedPlan as UserPlan);
            else {
                // Legacy Guest Pro check
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
        // Note: dailyImageCount and streak are handled via remote sync preferentially now
        // But we still maintain local logic for offline support / responsiveness
        
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

            // Streak Logic
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
  }, [session, isRemoteDataLoaded]); // Depend on isRemoteDataLoaded to avoid overwriting remote data with local stale data

  // Persist Data (IndexedDB)
  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      saveSessionsToStorage(key, sessions);
  }, [sessions, session]);

  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      saveSettingsToStorage(key, userSettings);
  }, [userSettings, session]);

  useEffect(() => {
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
      try { localStorage.setItem(key, userPlan); } catch(e) {}
  }, [userPlan, session]);

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  
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

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
        if(audioRef.current) audioRef.current.pause();
    }
  }, []);

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
        welcomeText = `Здравей${greetingName}! Аз съм Uchebnik AI. Попитай ме каквото и да е!`;
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

    const tempAiMsgId = (Date.now() + 1).toString();
    const tempAiMsg: Message = {
       id: tempAiMsgId,
       role: 'model',
       text: "",
       timestamp: Date.now(),
       reasoning: "",
       isStreaming: true
    };

    setSessions(prev => prev.map(s => {
        if (s.id === sessId) {
            return { 
                ...s, 
                messages: [...s.messages, newUserMsg, tempAiMsg], 
                lastModified: Date.now(), 
                preview: textToSend.substring(0, 50), 
                role: userRole || undefined 
            };
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
      if (preferredModel === 'auto') {
          preferredModel = 'tngtech/deepseek-r1t2-chimera:free';
      }

      // We remove the loading spinner immediately because we are showing the stream
      setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));

      const response = await generateResponse(
          currentSubId, 
          currentMode, 
          finalPrompt, 
          currentImgs, 
          historyForAI, 
          preferredModel,
          (textChunk, reasoningChunk) => {
              // Real-time update
              setSessions(prev => prev.map(s => {
                  if (s.id === sessId) {
                      return {
                          ...s,
                          messages: s.messages.map(m => {
                              if (m.id === tempAiMsgId) {
                                  return { ...m, text: textChunk, reasoning: reasoningChunk, isStreaming: true };
                              }
                              return m;
                          })
                      };
                  }
                  return s;
              }));
          }
      );
      
      if (currentImgs.length > 0) {
          incrementImageCount(currentImgs.length);
      }

      // Final update with complete response object (which might include slides/tests data)
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
                          isStreaming: false
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
       const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "Възникна грешка. Моля опитайте отново.", isError: true, timestamp: Date.now(), isStreaming: false };
       // Replace the temp message with error or append error?
       // Let's replace the temp message if it exists, or append if not found (though it should exist)
       setSessions(prev => prev.map(s => {
           if (s.id === sessId) {
               return { 
                   ...s, 
                   messages: s.messages.map(m => m.id === tempAiMsgId ? errorMsg : m) 
               };
           }
           return s;
       }));
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

  const handleCameraCapture = (base64Image: string) => {
    if (!session) {
        setShowAuthModal(true);
        return;
    }
    if (!checkImageLimit(1)) return;
    setSelectedImages(prev => [...prev, base64Image]);
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
                         welcomeText = `Здравей${greetingName}! Аз съм Uchebnik AI. Попитай ме каквото и да е!`;
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
        // Force stop if taking too long (race condition fix)
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
  
  const handleUnlockSubmit = async () => {
    setUnlockLoading(true);
    const key = unlockKeyInput.trim();
    
    // Use async validation which checks DB
    const result = await redeemKey(key, session?.user?.id);
    
    if (result.valid) {
       const newPlan = targetPlan || result.plan || 'pro';
       setUserPlan(newPlan);
       if (newPlan !== 'free') {
            setUserSettings(prev => ({ ...prev, preferredModel: 'tngtech/deepseek-r1t2-chimera:free' }));
       }
       setShowUnlockModal(false);
       setUnlockKeyInput('');
       addToast(`Успешно активирахте план ${newPlan.toUpperCase()}!`, 'success');
       
       // Sync to Supabase if logged in
       if (session) {
           await supabase.auth.updateUser({
               data: { plan: newPlan }
           });
       }
    } else {
       addToast(result.error || "Невалиден ключ.", 'error');
    }
    setUnlockLoading(false);
  };

  const handleAdminLogin = async () => {
    const isValid = await verifyAdminPassword(adminPasswordInput);
    if (isValid) {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setAdminPasswordInput('');
      addToast("Успешен вход в админ панела", 'success');
    } else {
      addToast("Грешна парола!", 'error');
    }
  };

  const generateKey = async () => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
    const checksum = generateChecksum(randomCore);
    const newKeyCode = `UCH-${randomCore}-${checksum}`;
    
    // Register in DB for tracking
    await registerKeyInDb(newKeyCode, 'pro');

    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false };
    const updatedKeys = [newKeyObj, ...generatedKeys];
    setGeneratedKeys(updatedKeys);
    localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
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
      {/* Background Image Layer */}
      {userSettings.customBackground && (
         <div 
           className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500 ${focusMode ? 'brightness-[0.2] grayscale' : ''}`}
           style={getBackgroundImageStyle(userSettings.customBackground)}
         />
      )}

      {/* Global Aurora Background (Visible when no custom background) */}
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

      {/* Exit Focus Mode Button */}
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
          />
      )}
      
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden transition-all duration-300 z-10">
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

        {/* Sync Error Modal */}
        {(syncStatus === 'error' && syncErrorDetails) || missingDbTables ? (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-2 fade-in">
                <div className={`backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md border ${missingDbTables ? 'bg-amber-600/90 border-amber-500/50' : 'bg-red-500/90 border-red-400/50'}`}>
                    {missingDbTables ? <Database size={20} className="shrink-0"/> : <AlertCircle size={20} className="shrink-0"/>}
                    <div className="flex-1 text-xs">
                        <span className="font-bold block mb-0.5">{missingDbTables ? 'Database Setup Required' : 'Sync Error'}</span>
                        <span className="opacity-90">
                            {missingDbTables 
                                ? 'Tables missing. Please run the SQL setup script in Supabase.' 
                                : syncErrorDetails || 'Could not save to cloud.'}
                        </span>
                    </div>
                    {!missingDbTables && <button onClick={() => setSyncStatus('synced')} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16}/></button>}
                </div>
            </div>
        ) : null}

        {/* Dynamic View Rendering */}
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
                />
            </div>
        )}
      </main>

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