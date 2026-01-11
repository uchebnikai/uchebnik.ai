
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { SubjectConfig, SubjectId, AppMode, Message, Slide, UserSettings, Session, UserPlan, UserRole, HomeViewType } from './types';
import { SUBJECTS, VOICES, DEFAULT_VOICE } from './constants';
import { generateResponse, generateChatTitle } from './services/aiService';
import { createBlob as createAudioBlob } from './services/audioService'; 
import { supabase } from './supabaseClient';
import { Auth } from './components/auth/Auth';
import { AuthSuccess } from './components/auth/AuthSuccess';
import { 
  Loader2, X, AlertCircle, CheckCircle, Info, Minimize, Database, Radio, Gift, Minimize2, 
  ArrowLeft, Zap, Book, FileJson, ExternalLink
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
import { DynamicIcon } from './components/ui/DynamicIcon';
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
import { ChatInputArea as ActualChatInputArea } from './components/chat/ChatInputArea';
import { TermsOfService, PrivacyPolicy, CookiePolicy, About, Contact } from './components/pages/StaticPages';
import { Snowfall } from './components/ui/Snowfall';
import { Fireworks } from './components/ui/Fireworks';
import { ReportModal } from './components/support/ReportModal';
import { AdSenseContainer } from './components/ads/AdSenseContainer';
import { IosInstallPrompt } from './components/ui/IosInstallPrompt';
import { Button } from './components/ui/Button';

interface GeneratedKey {
  code: string;
  isUsed: boolean;
  plan?: 'plus' | 'pro';
}

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

const DEMO_RESPONSE = `Анализирах въпроса ти и подготвих детайлно решение. За да разбереш материята в дълбочина, разгледах логическата структура на проблема. Ето първите стъпки от моя анализ:

1. **Дефиниране на основните параметри**: Първата стъпка е да изолираме ключових данни и да разберем контекста на твоето запитване.
2. **Избор на методология**: Въз основа на темата, най-подходящият подход е прилагането на логически изводи и доказани научни принципи.
3. **Дефинирано разписване**: Тут започваме със самото решаване, като преминаваме през всеки междинен етап за максимална яснота...

Uchebnik AI винаги предоставя пълно обяснение на логиката за решението, за да можеш не просто да получиш отговора, но и да научиш материала. Влез в профила си, за да отключиш останалата част от това решение и да получиш достъп до всички функции абсолютно безплатно!`;

const CHRISTMAS_BG = "https://i.ibb.co/LGxCVX4/Gemini-Generated-Image-gt5habgt5habgt5h.png";
const NEW_YEAR_BG = "https://iili.io/fkvjTrX.png";
const BROADCAST_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

export const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  
  const [isRemoteDataLoaded, setIsRemoteDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [authSuccessType, setAuthSuccessType] = useState<'verification' | 'magiclink' | 'email_change' | 'generic' | null>(null);

  // --- State ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  const [broadcastModal, setBroadcastModal] = useState<{isOpen: boolean, message: string, title?: string, sender_name?: string, icon_name?: string, color_theme?: string, background_image?: string, buttons?: {label: string, url: string}[]} | null>(null);

  const [globalConfig, setGlobalConfig] = useState({ showChristmasButton: true, showNewYearButton: true });

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
    newYearMode: false,
    preferredVoice: DEFAULT_VOICE,
    referralCode: '',
    proExpiresAt: '',
    isDarkMode: true,
    xp: 0,
    level: 1,
    dailyQuests: {
        date: new Date().toDateString(),
        quests: generateDailyQuests()
    },
    stats: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        dailyImageCount: 0
    }
  });

  const currentMessages = activeSessionId 
    ? sessions.find(s => s.id === activeSessionId)?.messages || [] 
    : [];

  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [focusMode, setFocusMode] = useState(false);

  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info', title?: string, icon?: string, sender?: string, color?: string, background_image?: string, buttons?: {label: string, url: string}[]}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const addToast = (message: string, type: 'success'|'error'|'info' = 'info', icon?: string, sender?: string, color?: string, title?: string, buttons?: {label: string, url: string}[], background_image?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, {id, message, type, icon, sender, color, title, buttons, background_image}]);
    const duration = (buttons && buttons.length > 0) ? 12000 : 5000;
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };

  const closeAuthModal = () => {
      setShowAuthModal(false);
      setTimeout(() => setInitialAuthMode('login'), 300); 
  };

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const voiceCallStartTimeRef = useRef<number>(0);
  
  const activeSubjectRef = useRef(activeSubject);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeModeRef = useRef(activeMode);
  const voiceMutedRef = useRef(voiceMuted);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false); 

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const syncSessionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isIncomingUpdateRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const startingTextRef = useRef('');

  // --- Custom Hooks ---
  useTheme(userSettings);

  // --- Admin Logic ---
  const handleAdminLogin = async () => {
    const success = await verifyAdminPassword(adminPasswordInput);
    if (success) {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      addToast('Добре дошли, админ!', 'success');
      setAdminPasswordInput('');
    } else {
      addToast('Грешна парола.', 'error');
    }
  };

  const handleGenerateKey = async (plan: 'plus' | 'pro') => {
    const core = Math.random().toString(36).substring(2, 10).toUpperCase();
    const checksum = generateChecksum(core);
    const code = `UCH-${core}-${checksum}`;
    await registerKeyInDb(code, plan);
    setGeneratedKeys(prev => [{ code, isUsed: false, plan }, ...prev]);
  };

  const handleUnlockSubmit = async () => {
    if (!unlockKeyInput.trim()) {
        addToast('Моля, въведете код.', 'error');
        return;
    }
    
    if (!session?.user?.id) {
        addToast('Трябва да сте влезли в профила си.', 'error');
        return;
    }

    setUnlockLoading(true);
    try {
        const result = await redeemKey(unlockKeyInput, session.user.id);
        if (result.valid && result.plan) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1); 
            const proExpiresAt = expiresAt.toISOString();

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    settings: { ...userSettings, plan: result.plan },
                    pro_expires_at: proExpiresAt 
                })
                .eq('id', session.user.id);

            if (error) throw error;

            setUserPlan(result.plan);
            setUserSettings(prev => ({ 
                ...prev, 
                proExpiresAt: proExpiresAt 
            }));
            
            addToast(`Успешно активиран ${result.plan.toUpperCase()}! 🎉`, 'success');
            setShowUnlockModal(false);
            setTargetPlan(null);
            setUnlockKeyInput('');
        } else {
            addToast(result.error || 'Невалиден код.', 'error');
        }
    } catch (e) {
        console.error("Activation error:", e);
        addToast('Грешка при активиране на кода.', 'error');
    } finally {
        setUnlockLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    setUserMeta({ firstName: editProfile.firstName, lastName: editProfile.lastName, avatar: editProfile.avatar });
    const fullName = `${editProfile.firstName} ${editProfile.lastName}`.trim();
    setUserSettings(prev => ({ ...prev, userName: fullName }));

    if (session?.user?.id) {
        try {
            const { error } = await supabase.from('profiles').update({
                settings: { ...userSettings, userName: fullName },
                avatar_url: editProfile.avatar,
                updated_at: new Date().toISOString()
            }).eq('id', session.user.id);
            
            if (error) throw error;

            await supabase.auth.updateUser({
                data: { 
                    first_name: editProfile.firstName, 
                    last_name: editProfile.lastName, 
                    full_name: fullName,
                    avatar_url: editProfile.avatar
                }
            });

            addToast('Промените са запазени успешно!', 'success');
            setShowSettings(false);
        } catch (e) {
            console.error(e);
            addToast('Грешка при запис в облака.', 'error');
        }
    } else {
        addToast('Промените са запазени локално.', 'success');
        setShowSettings(false);
    }
  };

  const handleDeleteAllChats = () => {
    setConfirmModal({
        isOpen: true,
        title: 'Изтриване на всичко',
        message: 'Сигурни ли сте? Всички ваши разговори ще бъдат изтрити завинаги.',
        onConfirm: async () => {
            setSessions([]);
            setActiveSessionId(null);
            if (session?.user?.id) {
                try {
                    await supabase.from('user_data').update({ data: [], updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
                } catch(e) { console.error(e); }
            }
            addToast('Цялата история е изтрита.', 'success');
            setConfirmModal(null);
            setShowSettings(false);
        }
    });
  };

  const startVoiceCall = async () => {
    if (isVoiceCallActive) return;
    setIsVoiceCallActive(true);
    setVoiceCallStatus('idle');
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) {
      addToast("Липсва API ключ за гласов режим.", "error");
      setIsVoiceCallActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitRecognition || (window as any).AudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        callbacks: {
          onopen: () => {
            setVoiceCallStatus('listening');
            voiceCallStartTimeRef.current = Date.now();
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
              if (voiceMutedRef.current) return;
              const inputData = event.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio) {
              setVoiceCallStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setVoiceCallStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try{s.stop()}catch(e){} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            endVoiceCall();
            addToast("Грешка при гласова връзка.", "error");
          },
          onclose: () => endVoiceCall()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: userSettings.preferredVoice || DEFAULT_VOICE } }
          },
          systemInstruction: `You are in a live voice conversation. Current subject: ${activeSubject?.name}. Keep responses natural and conversational.`
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsVoiceCallActive(false);
      addToast("Неуспешен достъп до микрофон.", "error");
    }
  };

  const endVoiceCall = () => {
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch(e){}
      liveSessionRef.current = null;
    }
    
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(track => track.stop());
      voiceStreamRef.current = null;
    }
    
    // Grant XP based on call duration to prevent abuse
    if (voiceCallStartTimeRef.current > 0) {
        const durationSeconds = (Date.now() - voiceCallStartTimeRef.current) / 1000;
        // Require at least 15 seconds for any XP reward
        if (durationSeconds >= 15) {
            // Grant 2 XP per second, capped at XP_PER_VOICE (60)
            const earnedXP = Math.min(XP_PER_VOICE, Math.floor(durationSeconds * 2));
            grantXP(earnedXP);
            
            // Fix: Missions state update
            setUserSettings(prev => {
                const questResult = updateQuestProgress(prev.dailyQuests?.quests || [], 'voice', activeSubject?.id || '');
                if (questResult.xpGained > 0) {
                    questResult.completedQuests.forEach(q => addToast(`Мисия завършена: ${q}! 🎉`, 'success'));
                    const boostedXP = calculateXPWithBoost(questResult.xpGained, userPlan);
                    const newTotalXP = prev.xp + boostedXP;
                    return { 
                        ...prev, 
                        xp: newTotalXP,
                        level: calculateLevel(newTotalXP),
                        dailyQuests: prev.dailyQuests ? { ...prev.dailyQuests, quests: questResult.updatedQuests } : prev.dailyQuests 
                    };
                }
                return {
                    ...prev,
                    dailyQuests: prev.dailyQuests ? { ...prev.dailyQuests, quests: questResult.updatedQuests } : prev.dailyQuests
                };
            });
        }
        voiceCallStartTimeRef.current = 0;
    }

    sourcesRef.current.forEach(s => { try{s.stop()}catch(e){} });
    sourcesRef.current.clear();
    setIsVoiceCallActive(false);
    setVoiceCallStatus('idle');
  };

  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }
    
    // Ensure microphone access before starting
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Clean up stream immediately as we only needed permission
        stream.getTracks().forEach(t => t.stop());
    } catch (e) {
        addToast('Трябва да позволите достъп до микрофона.', 'error');
        return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      addToast('Гласовата услуга не се поддържа от този браузър.', 'error');
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
        addToast('Липсва достъп до микрофона.', 'error');
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

  useEffect(() => {
    const fetchGlobalConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('value')
                .eq('key', 'site_config')
                .single();
            if (!error && data) {
                setGlobalConfig(data.value);
            }
        } catch(e) {}
    };
    fetchGlobalConfig();
    loadLocalStorageData(); 
  }, []);

  useEffect(() => {
    activeSubjectRef.current = activeSubject;
    sessionsRef.current = sessions;
    activeSessionIdRef.current = activeSessionId;
    activeModeRef.current = activeMode;
    voiceMutedRef.current = voiceMuted;
  }, [activeSubject, sessions, activeSessionId, activeMode, voiceMuted]);

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

  const loadLocalStorageData = async () => {
      const sessionsKey = 'uchebnik_sessions';
      const settingsKey = 'uchebnik_settings';
      try {
          const loadedSessions = await getSessionsFromStorage(sessionsKey);
          if (loadedSessions && loadedSessions.length > 0) setSessions(loadedSessions);
          
          const loadedSettings = await getSettingsFromStorage(settingsKey);
          if (loadedSettings) {
              setUserSettings(prev => ({ ...prev, ...loadedSettings }));
              if ((loadedSettings as any).plan) setUserPlan((loadedSettings as any).plan);
          }
      } catch (err) { console.error("Init Error", err); }

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

  const resetAppState = async () => {
      setSessions([]);
      setActiveSessionId(null);
      setActiveSubject(null);
      setHomeView('landing');
      setShowSubjectDashboard(false);
      setUserRole(null);
      setIsAdmin(false);
      setUserPlan('free');
      setUserMeta({ firstName: '', lastName: '', avatar: '' });
      setIsRemoteDataLoaded(false);
      setSyncStatus('synced');
      await loadLocalStorageData();
  };

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

    const loadRemoteUserData = async (userId: string, authMetadata?: any) => {
        setIsRemoteDataLoaded(false);
        setSyncStatus('syncing');
        try {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (profileError && profileError.code === 'PGRST116') {
                await handleLogout();
                return;
            }
            if (profileData) {
                const referralCode = profileData.referral_code;
                const proExpiresAt = profileData.pro_expires_at;
                const xp = profileData.xp ?? 0;
                const level = profileData.level ?? 1;
                const adminFlag = !!profileData.is_admin;
                
                setIsAdmin(adminFlag);

                if (profileData.settings) {
                    const { plan, stats, xp: _jsonXP, level: _jsonLvl, ...restSettings } = (profileData.settings as any);
                    let currentName = restSettings.userName || '';
                    const isNameGeneric = !currentName || ['Потребител', 'Анонимен', 'Anonymous', 'Scholar'].includes(currentName);
                    
                    if (isNameGeneric && authMetadata) {
                        currentName = authMetadata.full_name || authMetadata.name || `${authMetadata.given_name || ''} ${authMetadata.family_name || ''}`.trim();
                        if (currentName && !isNameGeneric) {
                            await supabase.from('profiles').update({
                                settings: { ...profileData.settings, userName: currentName }
                            }).eq('id', userId);
                        }
                    }

                    setUserSettings(prev => ({ 
                        ...prev, 
                        ...restSettings, 
                        userName: currentName || prev.userName,
                        themeColor: profileData.theme_color || prev.themeColor, 
                        customBackground: profileData.custom_background || prev.customBackground, 
                        referralCode, 
                        proExpiresAt, 
                        xp, 
                        level,
                        stats: stats || prev.stats
                    }));

                    if (plan) setUserPlan(plan);
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
            setIsRemoteDataLoaded(true);
        } catch (err) {
            console.error("Remote load error", err);
            setIsRemoteDataLoaded(true);
        }
    };

    const initializeApp = async (supabaseSession: SupabaseSession | null) => {
        setSession(supabaseSession);
        if (supabaseSession) {
            setShowAuthModal(false);
            const meta = supabaseSession.user.user_metadata;
            const firstName = meta.given_name || meta.first_name || '';
            const lastName = meta.family_name || meta.last_name || '';
            const fullName = meta.full_name || meta.name || `${firstName} ${lastName}`.trim();
            const avatar = meta.avatar_url || meta.picture || '';

            setUserMeta({ firstName, lastName, avatar });
            setEditProfile({ 
                firstName, 
                lastName, 
                avatar, 
                email: supabaseSession.user.email || '', 
                password: '', 
                currentPassword: '' 
            });

            setUserSettings(prev => {
                const isCurrentNameGeneric = !prev.userName || ['Потребител', 'Анонимен', 'Anonymous', 'Scholar'].includes(prev.userName);
                return isCurrentNameGeneric && fullName ? { ...prev, userName: fullName } : prev;
            });

            await loadRemoteUserData(supabaseSession.user.id, meta);
        } else {
            await resetAppState();
        }
        setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => initializeApp(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeApp(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      const channel = supabase.channel('global-broadcasts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
          const newB = payload.new as any;
          
          // Sound effect for broadcasts
          try {
            const audio = new Audio(BROADCAST_SOUND);
            audio.play().catch(() => {});
          } catch(e) {}

          if (newB.type === 'modal') {
              setBroadcastModal({ 
                  isOpen: true, 
                  message: newB.message, 
                  title: newB.title,
                  sender_name: newB.sender_name, 
                  icon_name: newB.icon_name, 
                  color_theme: newB.color_theme, 
                  background_image: newB.background_image,
                  buttons: newB.buttons 
              });
          } else {
              addToast(newB.message, 'info', newB.icon_name, newB.sender_name, newB.color_theme, newB.title, newB.buttons, newB.background_image);
          }
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
  }, []);

  // --- Real-time Session Sync ---
  useEffect(() => {
    if (!session?.user?.id || !isRemoteDataLoaded) return;

    const syncChannel = supabase
        .channel(`user-sync-${session.user.id}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_data',
            filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
            const newData = payload.new.data;
            if (newData && !isStreamingRef.current) {
                // Determine if we should apply the incoming update
                // We compare lengths or logic to decide, but generally "Pull" remote state
                isIncomingUpdateRef.current = true;
                setSessions(newData);
                setSyncStatus('synced');
            }
        })
        .subscribe();

    return () => { supabase.removeChannel(syncChannel); };
  }, [session?.user?.id, isRemoteDataLoaded]);

  // Sync sessions push
  useEffect(() => {
      if (!session?.user?.id || !isRemoteDataLoaded || isStreamingRef.current) return;
      if (isIncomingUpdateRef.current) { isIncomingUpdateRef.current = false; return; }
      setSyncStatus('syncing');
      if (syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current);
      syncSessionsTimer.current = setTimeout(async () => {
          await supabase.from('user_data').upsert({ user_id: session.user.id, data: sessions, updated_at: new Date().toISOString() });
          setSyncStatus('synced');
      }, 2000);
      return () => { if(syncSessionsTimer.current) clearTimeout(syncSessionsTimer.current); };
  }, [sessions, session?.user?.id, isRemoteDataLoaded]);

  // SYNC SETTINGS EFFECT
  useEffect(() => {
      saveSettingsToStorage('uchebnik_settings', userSettings);
      if (!isRemoteDataLoaded || !session?.user?.id) return;

      if (syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current);
      syncSettingsTimer.current = setTimeout(async () => {
          const { xp, level, themeColor, customBackground, ...sanitizedSettings } = userSettings;
          await supabase.from('profiles').update({ 
              settings: { ...sanitizedSettings, plan: userPlan } as any, 
              xp, 
              level,
              theme_color: themeColor,
              custom_background: customBackground,
              updated_at: new Date().toISOString() 
          }).eq('id', session.user.id);
      }, 3000);

      return () => { if(syncSettingsTimer.current) clearTimeout(syncSettingsTimer.current); };
  }, [userSettings, userPlan, session?.user?.id, isRemoteDataLoaded]);

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
    const newSession: Session = {
      id: crypto.randomUUID(), subjectId, title: '...', createdAt: Date.now(), lastModified: Date.now(), preview: '...', messages: [], role: role || userRole || undefined, mode: initialMode
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
      message: 'Сигурни ли сте? Всички ваши разговори ще бъдат изтрити завинаги.',
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

    if (!currentSubject || !currentSessionId) return;

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
    const currentSess = sessionsRef.current.find(s => s.id === currentSessionId);
    const isFirstUserMsg = currentSess && currentSess.messages.filter(m => m.role === 'user').length === 0;

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newUserMsg, tempAiMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50) } : s));
    setInputValue(''); setSelectedImages([]);
    isStreamingRef.current = true;
    setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: true }));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    grantXP(XP_PER_MESSAGE + (currentImgs.length * XP_PER_IMAGE));
    if (currentImgs.length > 0) incrementImageCount(currentImgs.length);
    
    // Unified quest progress update
    setUserSettings(prev => {
        let currentQuests = prev.dailyQuests?.quests || [];
        let totalXPToGrant = 0;
        
        const msgQuestUpdate = updateQuestProgress(currentQuests, 'message', currentSubject.id);
        totalXPToGrant += msgQuestUpdate.xpGained;
        msgQuestUpdate.completedQuests.forEach(q => addToast(`Мисия завършена: ${q}! 🎉`, 'success'));
        currentQuests = msgQuestUpdate.updatedQuests;

        if (currentImgs.length > 0) {
            const imgQuestUpdate = updateQuestProgress(currentQuests, 'image', currentSubject.id, currentImgs.length);
            totalXPToGrant += imgQuestUpdate.xpGained;
            imgQuestUpdate.completedQuests.forEach(q => addToast(`Мисия завършена: ${q}! 🎉`, 'success'));
            currentQuests = imgQuestUpdate.updatedQuests;
        }

        if (totalXPToGrant > 0) {
            const boostedXP = calculateXPWithBoost(totalXPToGrant, userPlan);
            const newXP = prev.xp + boostedXP;
            return {
                ...prev,
                xp: newXP,
                level: calculateLevel(newXP),
                dailyQuests: prev.dailyQuests ? { ...prev.dailyQuests, quests: currentQuests } : prev.dailyQuests
            };
        }

        return {
            ...prev,
            dailyQuests: prev.dailyQuests ? { ...prev.dailyQuests, quests: currentQuests } : prev.dailyQuests
        };
    });

    try {
      if (isFirstUserMsg && textToSend.trim()) {
         generateChatTitle(textToSend).then(title => {
             if (title) setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
         });
      }
      const historyForAI = sessionsRef.current.find(s => s.id === currentSessionId)?.messages || [];
      const response = await generateResponse(currentSubject.id, currentMode, textToSend, currentImgs, historyForAI, userSettings.preferredModel, (txt, reason) => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === tempAiMsgId ? { ...m, text: txt, reasoning: reason } : m) } : s));
      }, controller.signal, userSettings.language, userSettings.teachingStyle, userSettings.customPersona);
      
      // Update token counts in settings for persistence
      if (response.usage) {
          setUserSettings(prev => ({
              ...prev,
              stats: {
                  ...prev.stats,
                  totalInputTokens: (prev.stats?.totalInputTokens || 0) + response.usage!.inputTokens,
                  totalOutputTokens: (prev.stats?.totalOutputTokens || 0) + response.usage!.outputTokens,
              }
          }));
      }

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
      if (session && !checkImageLimit(files.length)) return;
      setIsImageProcessing(true);
      const processed = await Promise.all(Array.from(files).map(file => resizeImage(file as File, 800, 0.6)));
      setSelectedImages(prev => [...prev, ...processed]);
      setIsImageProcessing(false);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
        try {
            const resized = await resizeImage(files[0] as File, 1920, 0.7);
            setUserSettings(prev => ({ ...prev, customBackground: resized }));
            addToast('Фонът е обновен успешно.', 'success');
        } catch (err) {
            console.error(err);
            addToast('Грешка при качване на фон.', 'error');
        }
    }
    e.target.value = '';
  };

  const handleAvatarUploadSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
        try {
            const resized = await resizeImage(files[0] as File, 400, 0.8);
            setEditProfile(prev => ({ ...prev, avatar: resized }));
        } catch (err) {
            console.error(err);
            addToast('Грешка при обработка на аватар.', 'error');
        }
    }
    e.target.value = '';
  };

  const handleLogout = async () => {
    await resetAppState();
    await supabase.auth.signOut();
    addToast('Излязохте успешно.', 'info');
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  const effectiveBg = userSettings.christmasMode && !userSettings.customBackground ? CHRISTMAS_BG : (userSettings.newYearMode && !userSettings.customBackground ? NEW_YEAR_BG : userSettings.customBackground);

  return (
    <div className="flex h-full w-full relative overflow-hidden text-foreground">
      <Snowfall active={!!userSettings.christmasMode} />
      <Fireworks active={!!userSettings.newYearMode} />
      {!effectiveBg && <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.4]' : ''}`} />}
      {effectiveBg && <div className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-1000 ${focusMode ? 'brightness-[0.2] grayscale' : ''}`} style={getBackgroundImageStyle(effectiveBg)} />}
      
      {showAuthModal && <Auth isModal={false} onSuccess={closeAuthModal} initialMode={initialAuthMode} onNavigate={setHomeView} />}

      {!focusMode && session && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userSettings={userSettings} setUserSettings={setUserSettings} userPlan={userPlan} activeSubject={activeSubject} setActiveSubject={setActiveSubject} setHomeView={setHomeView} setUserRole={setUserRole} handleSubjectChange={handleSubjectChange} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId} sessions={sessions} deleteSession={deleteSession} createNewSession={createNewSession} unreadSubjects={unreadSubjects} activeMode={activeMode} userMeta={userMeta} session={session} setShowUnlockModal={setShowUnlockModal} setShowReferralModal={setShowReferralModal} setShowSettings={setShowSettings} handleLogout={handleLogout} setShowAuthModal={setShowAuthModal} addToast={addToast} setShowSubjectDashboard={setShowSubjectDashboard} userRole={userRole} streak={0} syncStatus={syncStatus} homeView={homeView} dailyImageCount={dailyImageCount} setShowLeaderboard={setShowLeaderboard} setShowQuests={setShowQuests} setShowReportModal={setShowReportModal} globalConfig={globalConfig} isAdmin={isAdmin} />
      )}
      
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden z-10">
        {homeView === 'auth_success' ? (
            <AuthSuccess type={authSuccessType || 'generic'} onContinue={() => { setHomeView('landing'); setAuthSuccessType(null); }} userSettings={userSettings} />
        ) : homeView === 'terms' ? (
            <TermsOfService onBack={() => setHomeView('landing')} userSettings={userSettings} />
        ) : homeView === 'privacy' ? (
            <PrivacyPolicy onBack={() => setHomeView('landing')} userSettings={userSettings} />
        ) : homeView === 'cookies' ? (
            <CookiePolicy onBack={() => setHomeView('landing')} userSettings={userSettings} />
        ) : homeView === 'about' ? (
            <About onBack={() => setHomeView('landing')} userSettings={userSettings} />
        ) : homeView === 'contact' ? (
            <Contact onBack={() => setHomeView('landing')} userSettings={userSettings} />
        ) : !activeSubject ? (
            <WelcomeScreen homeView={homeView} userMeta={userMeta} userSettings={userSettings} handleSubjectChange={handleSubjectChange} setHomeView={setHomeView} setUserRole={setUserRole} setShowAdminAuth={setShowAdminAuth} onQuickStart={(txt, imgs) => { setPendingHomeInput({text: txt, images: imgs||[]}); handleSubjectChange(SUBJECTS[0]); }} setSidebarOpen={setSidebarOpen} setShowAuthModal={setShowAuthModal} session={session} setShowSettings={setShowSettings} isAdmin={isAdmin} />
        ) : showSubjectDashboard ? (
            <SubjectDashboard activeSubject={activeSubject} setActiveSubject={setActiveSubject} setHomeView={setHomeView} userRole={userRole} userSettings={userSettings} handleStartMode={handleStartMode} />
        ) : (
            <div className={`flex-1 flex flex-col relative h-full bg-transparent overflow-hidden w-full`}>
                {!focusMode && <ChatHeader setSidebarOpen={setSidebarOpen} activeSubject={activeSubject} setActiveSubject={setActiveSubject} setUserSettings={setUserSettings} userRole={userRole} activeMode={activeMode} startVoiceCall={startVoiceCall} createNewSession={createNewSession} setHistoryDrawerOpen={setHistoryDrawerOpen} userSettings={userSettings} setFocusMode={setFocusMode} isGuest={!session} />}
                <AdSenseContainer userPlan={userPlan} />
                <MessageList currentMessages={currentMessages} userSettings={userSettings} setZoomedImage={setZoomedImage} handleRate={() => {}} handleReply={setReplyingTo} handleCopy={(t,id) => {navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000)}} copiedId={copiedId} handleShare={() => {}} loadingSubject={!!loadingSubjects[activeSubject.id]} activeSubject={activeSubject} messagesEndRef={messagesEndRef} setShowAuthModal={setShowAuthModal} isGuest={!session} />
                <ActualChatInputArea replyingTo={replyingTo} setReplyingTo={setReplyingTo} userSettings={userSettings} setUserSettings={setUserSettings} activeMode={activeMode} fileInputRef={fileInputRef} loadingSubject={!!loadingSubjects[activeSubject.id]} handleImageUpload={handleImageUpload} toggleListening={toggleListening} isListening={isListening} inputValue={inputValue} setInputValue={setInputValue} handleSend={() => handleSend()} selectedImages={selectedImages} handleRemoveImage={(idx) => setSelectedImages(prev => prev.filter((_,i)=>i!==idx))} onStopGeneration={handleStopGeneration} onImagesAdd={(imgs) => setSelectedImages(prev => [...prev, ...imgs])} />
                
                {focusMode && (
                    <button 
                        onClick={() => setFocusMode(false)}
                        className="fixed top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all border border-white/5 shadow-xl animate-in fade-in zoom-in"
                        title="Exit Focus Mode"
                    >
                        <Minimize2 size={24} />
                    </button>
                )}
            </div>
        )}
      </main>

      <UpgradeModal showUnlockModal={showUnlockModal} setShowUnlockModal={setShowUnlockModal} targetPlan={targetPlan} setTargetPlan={setTargetPlan} unlockKeyInput={unlockKeyInput} setUnlockKeyInput={setUnlockKeyInput} handleUnlockSubmit={handleUnlockSubmit} userPlan={userPlan} userSettings={userSettings} addToast={addToast} unlockLoading={unlockLoading} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} userMeta={userMeta} editProfile={editProfile} setEditProfile={setEditProfile} handleUpdateAccount={handleUpdateAccount} handleAvatarUpload={handleAvatarUploadSettings} userSettings={userSettings} setUserSettings={setUserSettings} isPremium={userPlan!=='free'} handleBackgroundUpload={handleBackgroundUpload} handleDeleteAllChats={handleDeleteAllChats} addToast={addToast} userPlan={userPlan} />
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} userSettings={userSettings} addToast={addToast} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} currentUserId={session?.user?.id} />
      <DailyQuestsModal isOpen={showQuests} onClose={() => setShowQuests(false)} quests={userSettings.dailyQuests?.quests || []} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} userSettings={userSettings} addToast={addToast} userId={session?.user?.id} />
      <AdminPanel showAdminAuth={showAdminAuth} setShowAdminAuth={setShowAdminAuth} showAdminPanel={showAdminPanel} setShowAdminPanel={setShowAdminPanel} adminPasswordInput={adminPasswordInput} setAdminPasswordInput={setAdminPasswordInput} handleAdminLogin={handleAdminLogin} generateKey={handleGenerateKey} generatedKeys={generatedKeys as any} addToast={addToast} globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} />
      <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
      <ConfirmModal isOpen={!!confirmModal} title={confirmModal?.title || ''} message={confirmModal?.message || ''} onConfirm={confirmModal?.onConfirm || (()=>{})} onCancel={() => setConfirmModal(null)} />
      
      {/* GLOBAL BROADCAST MODAL - Fully Synchronized with Admin Preview */}
      {broadcastModal?.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-[#09090b] border border-white/10 w-full max-w-md p-8 rounded-[40px] shadow-2xl relative animate-in zoom-in-95 backdrop-blur-xl overflow-hidden ring-1 ring-white/5">
                  {broadcastModal.background_image ? (
                      <>
                        <img src={broadcastModal.background_image} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />
                      </>
                  ) : (
                    <div className="absolute inset-x-0 top-0 h-32 opacity-20 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${broadcastModal.color_theme || '#6366f1'}, transparent)` }} />
                  )}
                  
                  <div className="flex flex-col items-center text-center gap-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30" style={{ backgroundColor: broadcastModal.color_theme || '#6366f1' }}>
                          <DynamicIcon name={broadcastModal.icon_name || 'Bell'} className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                          <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">{broadcastModal.title || "Важно известие"}</h3>
                          {broadcastModal.sender_name && (
                              <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-md">
                                  <span>{broadcastModal.sender_name}</span>
                              </div>
                          )}
                          <p className="text-zinc-100 font-medium leading-relaxed mt-4 drop-shadow-md">
                              {broadcastModal.message}
                          </p>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                          {broadcastModal.buttons && broadcastModal.buttons.length > 0 ? broadcastModal.buttons.map((btn, idx) => (
                              <a 
                                  key={idx} 
                                  href={btn.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border border-white/10"
                                  style={{ backgroundColor: broadcastModal.color_theme || '#6366f1' }}
                              >
                                  {btn.label} <ExternalLink size={16}/>
                              </a>
                          )) : null}
                          <Button onClick={() => setBroadcastModal(null)} variant="secondary" className="w-full py-4 font-bold rounded-2xl !bg-white/10 !text-white hover:!bg-white/20 !border-white/20">
                              Затвори
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <VoiceCallOverlay 
        isVoiceCallActive={isVoiceCallActive} 
        voiceCallStatus={voiceCallStatus} 
        voiceMuted={voiceMuted} 
        setVoiceMuted={setVoiceMuted} 
        endVoiceCall={endVoiceCall} 
        activeSubject={activeSubject} 
        userSettings={userSettings} 
        onChangeVoice={(v) => setUserSettings(prev => ({...prev, preferredVoice: v}))} 
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

      {/* RENDER TOASTS */}
      <div className="fixed top-4 right-4 z-[210] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${TOAST_CONTAINER} ${t.type === 'error' ? TOAST_ERROR : t.type === 'success' ? TOAST_SUCCESS : TOAST_INFO} max-w-sm ring-1 ring-white/5 flex-col items-stretch gap-2 transition-all relative overflow-hidden`}>
             {t.background_image && (
                 <>
                    <img src={t.background_image} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
                 </>
             )}
             <div className="flex items-center gap-3 relative z-10">
                 <div className={`p-2.5 rounded-xl shrink-0 text-white shadow-lg transition-colors`} style={t.color ? {backgroundColor: t.color} : {}}>
                    {t.icon ? <DynamicIcon name={t.icon} className="w-5 h-5"/> : (t.type === 'error' ? <AlertCircle size={20}/> : t.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 truncate ${t.background_image ? 'text-zinc-200' : 'text-zinc-500'}`}>{t.title || t.sender || (t.type === 'info' ? 'Известие' : t.type)}</p>
                    <span className={`font-bold text-sm leading-tight block ${t.background_image ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>{t.message}</span>
                 </div>
                 <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className={`${t.background_image ? 'text-white/60 hover:text-white' : 'text-zinc-500 hover:text-zinc-300'} self-start mt-1 shrink-0`}>
                    <X size={14}/>
                 </button>
             </div>
             
             {/* Toast Action Buttons */}
             {t.buttons && t.buttons.length > 0 && (
                 <div className="flex gap-2 mt-1 relative z-10">
                     {t.buttons.map((btn, idx) => (
                         <a 
                             key={idx} 
                             href={btn.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex-1 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest text-center shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1 border border-white/10"
                             style={{ backgroundColor: t.color || '#6366f1' }}
                         >
                             {btn.label} <ExternalLink size={10}/>
                         </a>
                     ))}
                 </div>
             )}
          </div>
        ))}
      </div>
      <IosInstallPrompt />
    </div>
  );
};
