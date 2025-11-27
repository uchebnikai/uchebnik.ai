import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, UserSettings, Session, Slide } from '../types';
import { SUBJECTS, AI_MODELS } from '../constants';
import { generateResponse } from '../services/geminiService';
import { supabase } from '../supabaseClient';
import { Session as SupabaseSession } from '@supabase/supabase-js';

// --- Helpers ---
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 99, g: 102, b: 241 };
};

const adjustBrightness = (col: {r:number, g:number, b:number}, percent: number) => {
    let R = col.r * (1 + percent / 100);
    let G = col.g * (1 + percent / 100);
    let B = col.b * (1 + percent / 100);
    R = Math.round(R < 255 ? R : 255);
    G = Math.round(G < 255 ? G : 255);
    B = Math.round(B < 255 ? B : 255);
    return `${R} ${G} ${B}`;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

interface GeneratedKey {
  code: string;
  isUsed: boolean;
}

interface AppContextType {
  session: SupabaseSession | null;
  authLoading: boolean;
  activeSubject: SubjectConfig | null;
  setActiveSubject: (s: SubjectConfig | null) => void;
  activeMode: AppMode;
  setActiveMode: (m: AppMode) => void;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
  isImageProcessing: boolean;
  loadingSubjects: Record<string, boolean>;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  historyDrawerOpen: boolean;
  setHistoryDrawerOpen: (o: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (d: boolean) => void;
  showSettings: boolean;
  setShowSettings: (s: boolean) => void;
  speakingMessageId: string | null;
  setSpeakingMessageId: (id: string | null) => void;
  memoryUsage: number;
  isProUnlocked: boolean;
  setIsProUnlocked: (u: boolean) => void;
  showAdminAuth: boolean;
  setShowAdminAuth: (s: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (s: boolean) => void;
  showUnlockModal: boolean;
  setShowUnlockModal: (s: boolean) => void;
  generatedKeys: GeneratedKey[];
  setGeneratedKeys: React.Dispatch<React.SetStateAction<GeneratedKey[]>>;
  isVoiceCallActive: boolean;
  voiceCallStatus: 'idle' | 'listening' | 'processing' | 'speaking';
  voiceMuted: boolean;
  setVoiceMuted: (m: boolean) => void;
  startVoiceCall: () => void;
  endVoiceCall: () => void;
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  handleSend: (overrideText?: string, overrideImages?: string[]) => Promise<string | undefined>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSpeak: (txt: string, id: string) => void;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleRate: (messageId: string, rating: 'up' | 'down') => void;
  deleteSession: (sId: string) => void;
  renameSession: (sId: string, title: string) => void;
  handleClearMemory: () => void;
  handleLogout: () => void;
  zoomedImage: string | null;
  setZoomedImage: (img: string | null) => void;
  unreadSubjects: Set<string>;
  setUnreadSubjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  notification: { message: string, subjectId: string } | null;
  setNotification: React.Dispatch<React.SetStateAction<{ message: string, subjectId: string } | null>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  createNewSession: (subjectId: SubjectId) => void;
  isListening: boolean;
  toggleListening: () => void;
  recognitionRef: React.MutableRefObject<any>;
  importInputRef: React.RefObject<HTMLInputElement>;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<SubjectConfig | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.SOLVE);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, subjectId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    userName: '', gradeLevel: '8-12', textSize: 'normal', haptics: true, notifications: true, sound: true, reduceMotion: false, responseLength: 'concise', creativity: 'balanced', languageLevel: 'standard', preferredModel: 'gemini-2.5-flash', themeColor: '#6366f1', customBackground: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceCallRecognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingTimeoutRef = useRef<any>(null);

  // Refs for closures
  const activeSubjectRef = useRef(activeSubject);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeModeRef = useRef(activeMode);
  const isVoiceCallActiveRef = useRef(isVoiceCallActive);
  const voiceCallStatusRef = useRef(voiceCallStatus);
  const voiceMutedRef = useRef(voiceMuted);
  const loadingSubjectsRef = useRef(loadingSubjects);
  const startingTextRef = useRef<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSessions = localStorage.getItem('uchebnik_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      const savedSettings = localStorage.getItem('uchebnik_settings');
      if (savedSettings) setUserSettings(JSON.parse(savedSettings));
      const savedProStatus = localStorage.getItem('uchebnik_pro_status');
      if (savedProStatus === 'unlocked') setIsProUnlocked(true);
      const savedAdminKeys = localStorage.getItem('uchebnik_admin_keys');
      if (savedAdminKeys) setGeneratedKeys(JSON.parse(savedAdminKeys));
    }
    const loadVoices = () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices(); };
    if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
  }, []);

  useEffect(() => { localStorage.setItem('uchebnik_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('uchebnik_settings', JSON.stringify(userSettings)); }, [userSettings]);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  useEffect(() => {
    if (userSettings.themeColor) {
      const rgb = hexToRgb(userSettings.themeColor);
      const root = document.documentElement;
      root.style.setProperty('--primary-50', adjustBrightness(rgb, 90));
      root.style.setProperty('--primary-500', `${rgb.r} ${rgb.g} ${rgb.b}`);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const accentHsl = { ...hsl, h: (hsl.h + 35) % 360 };
      const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);
      root.style.setProperty('--accent-500', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
    }
    if (userSettings.customBackground) document.body.classList.add('custom-bg-active'); else document.body.classList.remove('custom-bg-active');
  }, [userSettings.themeColor, userSettings.customBackground]);

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
  useEffect(() => { voiceMutedRef.current = voiceMuted; }, [voiceMuted]);
  useEffect(() => { loadingSubjectsRef.current = loadingSubjects; }, [loadingSubjects]);

  const createNewSession = (subjectId: SubjectId) => {
    const newSession: Session = {
      id: crypto.randomUUID(), subjectId, title: 'Нов разговор', createdAt: Date.now(), lastModified: Date.now(), preview: 'Начало', messages: []
    };
    const greetingName = userSettings.userName ? `, ${userSettings.userName}` : '';
    newSession.messages.push({
        id: 'welcome-' + Date.now(), role: 'model', timestamp: Date.now(),
        text: subjectId === SubjectId.GENERAL ? `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!` : `Здравей${greetingName}! Аз съм твоят помощник по **${SUBJECTS.find(s=>s.id === subjectId)?.name}**.`
    });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    const currentSubject = activeSubjectRef.current;
    const currentSessionId = activeSessionIdRef.current;
    const currentMode = activeModeRef.current;
    const currentSessionsList = sessionsRef.current;
    const currentLoading = loadingSubjectsRef.current;
    const textToSend = overrideText || inputValue;
    
    if ((!textToSend.trim() && selectedImages.length === 0 && (!overrideImages || overrideImages.length === 0)) || !currentSubject || !currentSessionId) return;
    if (currentLoading[currentSubject.id]) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, images: overrideImages || [...selectedImages], timestamp: Date.now() };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50), title: (s.messages.length <= 1 && s.title === 'Нов разговор' && textToSend) ? textToSend.substring(0, 30) : s.title } : s));
    setInputValue(''); setSelectedImages([]); if(fileInputRef.current) fileInputRef.current.value = '';
    setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: true }));

    let finalPrompt = textToSend;
    if (userSettings.responseLength === 'concise') finalPrompt += " (Short answer)"; else finalPrompt += " (Detailed answer)";
    if (userSettings.creativity === 'strict') finalPrompt += " (Strict)"; else if (userSettings.creativity === 'creative') finalPrompt += " (Creative)";
    
    try {
      const sessionMessages = currentSessionsList.find(s => s.id === currentSessionId)?.messages || [];
      let preferredModel = userSettings.preferredModel;
      if (preferredModel === 'auto' && !isProUnlocked) preferredModel = 'gemini-2.5-flash';
      if (preferredModel === 'gemini-3-pro-preview' && !isProUnlocked) preferredModel = 'gemini-2.5-flash';

      const response = await generateResponse(currentSubject.id, currentMode, finalPrompt, overrideImages || [...selectedImages], [...sessionMessages, newUserMsg], preferredModel);

      setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: false }));
      const newAiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', ...response, timestamp: Date.now() };

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastModified: Date.now(), preview: response.text.substring(0, 50) } : s));

      if (activeSubjectRef.current?.id !== currentSubject.id) {
         setUnreadSubjects(prev => new Set(prev).add(currentSubject.id));
         if (userSettings.notifications) { setNotification({ message: `Нов отговор: ${SUBJECTS.find(s => s.id === currentSubject.id)?.name}`, subjectId: currentSubject.id }); setTimeout(() => setNotification(null), 4000); }
      } else if (userSettings.notifications && userSettings.sound) {
         new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(()=>{});
      }
      return response.text;
    } catch (error) {
       console.error("Error", error);
       setLoadingSubjects(prev => ({ ...prev, [currentSubject.id]: false }));
       setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'model', text: "Възникна грешка.", isError: true, timestamp: Date.now() }] } : s));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsImageProcessing(true);
      Promise.all(Array.from(files).map(f => new Promise<string>(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result as string); rd.readAsDataURL(f); })))
      .then(imgs => { setSelectedImages(prev => [...prev, ...imgs]); setIsImageProcessing(false); });
      e.target.value = '';
    }
  };

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }); };
  const deleteSession = (sId: string) => { if(confirm('Сигурни ли сте?')) { const n = sessions.filter(s => s.id !== sId); setSessions(n); if(sId === activeSessionId) setActiveSessionId(null); } };
  const renameSession = (sId: string, title: string) => { setSessions(prev => prev.map(s => s.id === sId ? { ...s, title } : s)); };
  const handleClearMemory = () => { if (confirm('Сигурни ли сте?') && activeSessionId) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [{ id: 'reset-'+Date.now(), role: 'model', text: 'Паметта е изчистена.', timestamp: Date.now() }] } : s)); };
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleRate = (messageId: string, rating: 'up' | 'down') => { if(activeSessionId) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, rating } : m) } : s)); };
  
  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); 
    if(audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); }
    let hasEnded = false;
    const safeOnEnd = () => { if(hasEnded) return; hasEnded = true; clearTimeout(speakingTimeoutRef.current); utteranceRef.current = null; if(onEnd) onEnd(); };
    speakingTimeoutRef.current = setTimeout(() => { safeOnEnd(); }, Math.max(3000, (text.length / 10) * 1000 + 2000));
    const clean = text.replace(/[*#`_\[\]]/g, '').replace(/\$\$.*?\$\$/g, 'формула');
    let lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if ((!v && lang.startsWith('bg')) || !window.speechSynthesis) {
        const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(clean)}&tl=${lang.split('-')[0]}`);
        audioRef.current = a; a.onended = safeOnEnd; a.onerror = safeOnEnd; a.play().catch(safeOnEnd);
    } else {
        const u = new SpeechSynthesisUtterance(clean); u.lang = lang; if(v) u.voice = v; 
        utteranceRef.current = u; u.onend = safeOnEnd; u.onerror = safeOnEnd; window.speechSynthesis.speak(u);
    }
  };
  const handleSpeak = (txt: string, id: string) => { if(speakingMessageId === id) { window.speechSynthesis.cancel(); if(audioRef.current) audioRef.current.pause(); setSpeakingMessageId(null); return; } setSpeakingMessageId(id); speakText(txt, () => setSpeakingMessageId(null)); };
  
  const startVoiceCall = () => { setIsVoiceCallActive(true); setVoiceCallStatus('listening'); startVoiceRecognition(); };
  const endVoiceCall = () => { setIsVoiceCallActive(false); setVoiceCallStatus('idle'); voiceCallRecognitionRef.current?.stop(); window.speechSynthesis.cancel(); };
  const startVoiceRecognition = () => {
     if (voiceMutedRef.current) { setVoiceCallStatus('idle'); return; }
     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if(!SR) { alert('Гласовото разпознаване не се поддържа.'); endVoiceCall(); return; }
     try { voiceCallRecognitionRef.current?.stop(); } catch(e) {}
     const rec = new SR();
     rec.lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
     rec.onstart = () => { if(voiceMutedRef.current) { rec.stop(); return; } setVoiceCallStatus('listening'); };
     rec.onresult = async (e: any) => {
        if(voiceMutedRef.current) return;
        const t = e.results[0][0].transcript;
        if(t.trim()) {
           setVoiceCallStatus('processing'); 
           const res = await handleSend(t);
           if(res) { setVoiceCallStatus('speaking'); speakText(res, () => { if(isVoiceCallActiveRef.current) startVoiceRecognition(); }); } else { if(isVoiceCallActiveRef.current) startVoiceRecognition(); }
        }
     };
     rec.onend = () => { if(isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) try { rec.start(); } catch(e){} };
     voiceCallRecognitionRef.current = rec; try { rec.start(); } catch(e) {}
  };

  const toggleListening = () => {
    if(isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) return;
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
    recognitionRef.current = rec; rec.start();
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ sessions, userSettings }, null, 2);
    const blob = new window.Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `uchebnik-backup-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { try { const data = JSON.parse(event.target?.result as string); if (data.sessions) setSessions(data.sessions); if (data.userSettings) setUserSettings(data.userSettings); alert('Възстановено!'); } catch (err) {} };
    reader.readAsText(file); if(importInputRef.current) importInputRef.current.value = '';
  };

  return (
    <AppContext.Provider value={{
      session, authLoading, activeSubject, setActiveSubject, activeMode, setActiveMode, sessions, setSessions, activeSessionId, setActiveSessionId,
      inputValue, setInputValue, selectedImages, setSelectedImages, isImageProcessing, loadingSubjects, sidebarOpen, setSidebarOpen,
      historyDrawerOpen, setHistoryDrawerOpen, isDarkMode, setIsDarkMode, showSettings, setShowSettings, speakingMessageId, setSpeakingMessageId,
      memoryUsage, isProUnlocked, setIsProUnlocked, showAdminAuth, setShowAdminAuth, showAdminPanel, setShowAdminPanel, showUnlockModal, setShowUnlockModal,
      generatedKeys, setGeneratedKeys, isVoiceCallActive, voiceCallStatus, voiceMuted, setVoiceMuted, startVoiceCall, endVoiceCall,
      userSettings, setUserSettings, handleSend, handleImageUpload, handleSpeak, handleCopy, copiedId, handleRate, deleteSession, renameSession,
      handleClearMemory, handleLogout, zoomedImage, setZoomedImage, unreadSubjects, setUnreadSubjects, notification, setNotification,
      fileInputRef, createNewSession, isListening, toggleListening, recognitionRef, importInputRef, handleImportData, handleExportData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};