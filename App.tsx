import React, { useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, Slide, ChartData, GeometryData, UserSettings, Session } from './types';
import { SUBJECTS, AI_MODELS } from './constants';
import { generateResponse } from './services/geminiService';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { 
  Menu, X, Send, Image as ImageIcon, Loader2, ChevronRight, Download, Sparkles, Moon, Sun, Book, Copy, Check, Mic, MicOff, Share2, BellRing, BarChart2, LineChart as LineChartIcon, Ruler, ThumbsUp, ThumbsDown, Trash2, Settings, Type, Cpu, RotateCcw, User, Brain, FileJson, MessageSquare, Volume2, Square, Upload, ArrowRight, LayoutGrid, Folder, ChevronDown, ArrowLeft, Database, Eye, Code, Projector, History, Plus, Edit2, Clock, Calendar, Phone, PhoneOff, Heart, MoreHorizontal, ArrowUpRight, Lock, Unlock, Shield, Key, LogOut, CheckCircle, XCircle, Palette, Monitor, Reply, Crown, Zap, AlertTriangle, Info, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import pptxgen from "pptxgenjs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import * as LucideIcons from 'lucide-react';
import { Session as SupabaseSession } from '@supabase/supabase-js';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon className={className} /> : <LucideIcons.HelpCircle className={className} />;
};

// --- Theme Helpers ---

const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 }; // fallback Indigo 500
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
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
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

const adjustBrightness = (col: {r:number, g:number, b:number}, percent: number) => {
    let R = col.r * (1 + percent / 100);
    let G = col.g * (1 + percent / 100);
    let B = col.b * (1 + percent / 100);
    R = Math.round(R < 255 ? R : 255);
    G = Math.round(G < 255 ? G : 255);
    B = Math.round(B < 255 ? B : 255);
    return `${R} ${G} ${B}`;
};

// --- Security / Key Logic ---

const SECRET_SALT = "UCH_2025_SECURE_SALT_VS";

const generateChecksum = (core: string): string => {
  let hash = 0;
  const str = core + SECRET_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and take last 4 chars
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
};

const isValidKey = (key: string): boolean => {
  // Master Key
  if (key === "UCH-PRO-2025") return true;

  // Algorithmic Key: UCH-{CORE}-{CHECKSUM}
  const parts = key.split('-');
  if (parts.length !== 3) return false;
  if (parts[0] !== 'UCH') return false;
  
  const core = parts[1];
  const checksum = parts[2];
  
  return generateChecksum(core) === checksum;
};

// --- Components ---

const Button = ({ children, onClick, className, variant = 'primary', icon: Icon, disabled }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-500/20",
    secondary: "glass-button text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-white/10",
    ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const isWebCode = lang === 'html' || lang === 'xml';
  
  if (inline) {
    return <code className="bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words whitespace-pre-wrap" {...props}>{children}</code>;
  }

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-indigo-500/20 bg-white/50 dark:bg-black/30 shadow-sm backdrop-blur-sm w-full max-w-full">
       <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 dark:bg-white/5 border-b border-indigo-500/10">
          <div className="flex items-center gap-2">
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
             </div>
             <span className="ml-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">{lang || 'КОД'}</span>
          </div>

          {isWebCode && (
             <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-0.5 rounded-lg">
                <button onClick={() => setView('code')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Код</button>
                <button onClick={() => setView('preview')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Преглед</button>
             </div>
          )}
       </div>

       {view === 'code' ? (
          <div className="relative group/copy">
            <pre className="p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed custom-scrollbar bg-transparent max-w-full">
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
       ) : (
          <div className="w-full h-[400px] bg-white border-t border-gray-200">
             <iframe srcDoc={String(children)} title="Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-modals" />
          </div>
       )}
    </div>
  );
};

const ChartRenderer = ({ data }: { data: ChartData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><BarChart2 size={18} /></div>
        <span>Визуализирай данни</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Графика"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'line' ? (
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'var(--tooltip-bg, #fff)' }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GeometryRenderer = ({ data }: { data: GeometryData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Ruler size={18} /></div>
        <span>Покажи чертеж</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Чертеж"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="w-full overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-indigo-500/20 p-4 flex justify-center" dangerouslySetInnerHTML={{__html: data.svg}} />
    </div>
  );
};

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1280; // Balanced size for AI and storage

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to JPEG 0.7
           resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
           resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string); // Fallback
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// --- Main App ---

interface GeneratedKey {
  code: string;
  isUsed: boolean;
}

export const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- State ---
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
  const [isDarkMode, setIsDarkMode] = useState(true); // Default Dark Mode
  const [showSettings, setShowSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [homeView, setHomeView] = useState<'landing' | 'subjects_grid'>('landing');
  const [memoryUsage, setMemoryUsage] = useState(0); 
  const MAX_MEMORY = 50000; 
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Pro Feature Lock & Admin
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  
  // Key Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');

  // Voice State (Video removed as per request)
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
    preferredModel: 'gemini-2.5-flash',
    themeColor: '#6366f1', // Default Indigo
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
  
  // Refs for State management to handle stale closures
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
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Auth Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

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

      // Default to Dark Mode if not set
      if (!savedSettings) {
         setIsDarkMode(true);
      }
    }
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    
    const loadVoices = () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices(); };
    if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
  }, []);

  useEffect(() => { try { localStorage.setItem('uchebnik_sessions', JSON.stringify(sessions)); } catch(e) { console.error("Session storage error", e); } }, [sessions]);
  useEffect(() => { try { localStorage.setItem('uchebnik_settings', JSON.stringify(userSettings)); } catch(e) { console.error("Settings storage error", e); } }, [userSettings]);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  // Apply Theme Colors
  useEffect(() => {
    if (userSettings.themeColor) {
      const rgb = hexToRgb(userSettings.themeColor);
      const root = document.documentElement;
      
      // Update primary palette variables
      root.style.setProperty('--primary-50', adjustBrightness(rgb, 90));
      root.style.setProperty('--primary-100', adjustBrightness(rgb, 80));
      root.style.setProperty('--primary-200', adjustBrightness(rgb, 60));
      root.style.setProperty('--primary-300', adjustBrightness(rgb, 40));
      root.style.setProperty('--primary-400', adjustBrightness(rgb, 20));
      root.style.setProperty('--primary-500', `${rgb.r} ${rgb.g} ${rgb.b}`);
      root.style.setProperty('--primary-600', adjustBrightness(rgb, -10));
      root.style.setProperty('--primary-700', adjustBrightness(rgb, -20));
      root.style.setProperty('--primary-800', adjustBrightness(rgb, -30));
      root.style.setProperty('--primary-900', adjustBrightness(rgb, -40));
      root.style.setProperty('--primary-950', adjustBrightness(rgb, -50));

      // Calculate Accent Color (Hue Shift)
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const accentHsl = { ...hsl, h: (hsl.h + 35) % 360 }; // +35 degree shift
      const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);

      // Update accent palette variables
      root.style.setProperty('--accent-50', adjustBrightness(accentRgb, 90));
      root.style.setProperty('--accent-100', adjustBrightness(accentRgb, 80));
      root.style.setProperty('--accent-200', adjustBrightness(accentRgb, 60));
      root.style.setProperty('--accent-300', adjustBrightness(accentRgb, 40));
      root.style.setProperty('--accent-400', adjustBrightness(accentRgb, 20));
      root.style.setProperty('--accent-500', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
      root.style.setProperty('--accent-600', adjustBrightness(accentRgb, -10));
      root.style.setProperty('--accent-700', adjustBrightness(accentRgb, -20));
      root.style.setProperty('--accent-800', adjustBrightness(accentRgb, -30));
      root.style.setProperty('--accent-900', adjustBrightness(accentRgb, -40));
      root.style.setProperty('--accent-950', adjustBrightness(accentRgb, -50));
    }

    // Toggle custom-bg-active class
    if (userSettings.customBackground) {
      document.body.classList.add('custom-bg-active');
    } else {
      document.body.classList.remove('custom-bg-active');
    }
  }, [userSettings.themeColor, userSettings.customBackground]);

  useEffect(() => {
    if(activeSessionId) {
      const s = sessions.find(s => s.id === activeSessionId);
      setMemoryUsage(s ? s.messages.reduce((acc, msg) => acc + (msg.text?.length || 0), 0) : 0);
    }
  }, [sessions, activeSessionId]);
  
  // Sync Refs
  useEffect(() => { activeSubjectRef.current = activeSubject; if(activeSubject && isVoiceCallActive) endVoiceCall(); }, [activeSubject]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { isVoiceCallActiveRef.current = isVoiceCallActive; }, [isVoiceCallActive]);
  useEffect(() => { voiceCallStatusRef.current = voiceCallStatus; }, [voiceCallStatus]);
  useEffect(() => { loadingSubjectsRef.current = loadingSubjects; }, [loadingSubjects]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId, isImageProcessing]);

  // Handle Mute Logic
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

  // Trigger voice recognition when call becomes active
  useEffect(() => {
    if (isVoiceCallActive) {
      setVoiceCallStatus('listening');
      startVoiceRecognition();
    }
  }, [isVoiceCallActive]);

  // --- Logic Helpers ---
  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
  
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
    return newSession;
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleSubjectChange = (subject: SubjectConfig) => {
    if (activeSubject?.id === subject.id) { if (window.innerWidth < 1024) setSidebarOpen(false); return; }
    if (unreadSubjects.has(subject.id)) { const newUnread = new Set(unreadSubjects); newUnread.delete(subject.id); setUnreadSubjects(newUnread); }
    setActiveSubject(subject); setActiveMode(subject.modes[0]); setInputValue(''); setSelectedImages([]); setIsImageProcessing(false); setReplyingTo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const subSessions = sessions.filter(s => s.subjectId === subject.id).sort((a, b) => b.lastModified - a.lastModified);
    if (subSessions.length > 0) setActiveSessionId(subSessions[0].id); else createNewSession(subject.id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    // Focus the input if possible
    // Note: React 19 / refs logic. Using a simple timeout to ensure render cycle handles it.
    setTimeout(() => {
       // Just ensuring focus
    }, 100);
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    const currentSubject = activeSubjectRef.current;
    const currentSessionId = activeSessionIdRef.current;
    const currentMode = activeModeRef.current;
    const currentSessionsList = sessionsRef.current;
    const currentLoading = loadingSubjectsRef.current;

    const textToSend = overrideText || inputValue;
    
    // Only block if no text AND no images AND no override images
    if ((!textToSend.trim() && selectedImages.length === 0 && (!overrideImages || overrideImages.length === 0)) || !currentSubject || !currentSessionId) return;
    
    if (currentLoading[currentSubject.id]) return;

    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    const currentSubId = currentSubject.id;
    const currentImgs = overrideImages || [...selectedImages];
    const sessId = currentSessionId;

    // Capture reply context
    const replyContext = replyingTo;
    setReplyingTo(null); // Clear reply state

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
            let newTitle = s.title;
            if (s.messages.length <= 1 && s.title === 'Нов разговор' && textToSend) newTitle = textToSend.substring(0, 30) + (textToSend.length > 30 ? '...' : '');
            return { ...s, messages: [...s.messages, newUserMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50), title: newTitle };
        }
        return s;
    }));

    setInputValue(''); setSelectedImages([]); if(fileInputRef.current) fileInputRef.current.value = '';
    setLoadingSubjects(prev => ({ ...prev, [currentSubId]: true }));

    // Prepare Prompt with Reply Context
    let finalPrompt = textToSend;
    if (replyContext) {
        // We prepend the context so the AI knows what is being referred to.
        // We do NOT modify the history objects themselves, only the current prompt sent to the AI.
        const snippet = replyContext.text.substring(0, 300) + (replyContext.text.length > 300 ? '...' : '');
        const roleName = replyContext.role === 'user' ? 'User' : 'Assistant';
        finalPrompt = `[Replying to ${roleName}'s message: "${snippet}"]\n\n${textToSend}`;
    }

    if (userSettings.responseLength === 'concise') finalPrompt += " (Short answer)"; else finalPrompt += " (Detailed answer)";
    if (userSettings.creativity === 'strict') finalPrompt += " (Strict)"; else if (userSettings.creativity === 'creative') finalPrompt += " (Creative)";
    
    try {
      const sessionMessages = currentSessionsList.find(s => s.id === sessId)?.messages || [];
      const historyForAI = [...sessionMessages, newUserMsg];

      // Model selection logic with Lock check
      let preferredModel = userSettings.preferredModel;
      
      // If Auto is selected but Pro is locked, fallback to Flash immediately
      if (preferredModel === 'auto' && !isProUnlocked) {
        preferredModel = 'gemini-2.5-flash';
      }
      // If Pro is strictly selected but locked, fallback to Flash
      if (preferredModel === 'gemini-3-pro-preview' && !isProUnlocked) {
        preferredModel = 'gemini-2.5-flash';
      }

      const response = await generateResponse(currentSubId, currentMode, finalPrompt, currentImgs, historyForAI, preferredModel);

      setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'model', text: response.text, isError: response.isError, type: response.type as Message['type'], 
        slidesData: response.slidesData, chartData: response.chartData, geometryData: response.geometryData, images: response.images || [], timestamp: Date.now()
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

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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

  // Background Image Upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Resize to prevent massive base64 strings
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
        handleCopy(text, 'share-fallback'); // Fallback to copy
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
          else if (activeSubjectRef.current) createNewSession(activeSubjectRef.current.id);
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
                     const welcomeText = s.subjectId === SubjectId.GENERAL ? `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!` : `Здравей${greetingName}! Аз съм твоят помощник по **${SUBJECTS.find(sub=>sub.id === s.subjectId)?.name}**.`
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

  // Voice & TTS
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
    setIsVoiceCallActive(true); 
    // Effect will handle the rest
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
           
           // Removed Video Frame Capture

           // Send audio text
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

  const handleDownloadPPTX = (slides: Slide[]) => {
      const p = new pptxgen();
      p.defineSlideMaster({
          title: 'MASTER', background: { color: 'FFFFFF' },
          objects: [ {rect:{x:0,y:0,w:'100%',h:0.15,fill:{color:'4F46E5'}}}, {text: {text: "uchebnik.ai", options: {x: 0.5, y: '90%', fontSize: 10, color: 'D1D5DB'}}}, ],
          slideNumber: { x: '95%', y: '90%', fontSize: 10, color: '6B7280' }
      });
      const cover = p.addSlide({masterName:'MASTER'});
      cover.addText(SUBJECTS.find(s=>s.id === activeSubject?.id)?.name || "Презентация", {x:1, y:2, w:'80%', fontSize:44, bold:true, color:'111827', align:'center'});
      if(userSettings.userName) cover.addText(`Автор: ${userSettings.userName}`, {x:1, y:3.5, w:'80%', fontSize:18, color:'4B5563', align:'center'});
      slides.forEach(s => {
          const slide = p.addSlide({masterName:'MASTER'});
          slide.addText(s.title, {x:0.5, y:0.8, w:'90%', fontSize:28, bold:true, color:'1F2937', fontFace:'Arial'});
          slide.addText(s.content.map(t=>({text:t, options:{bullet:true, breakLine:true}})), {x:0.5, y:1.8, w:'90%', h:'60%', fontSize:18, color:'374151', fontFace:'Arial', lineSpacing:32});
          if(s.notes) slide.addNotes(s.notes);
      });
      p.writeFile({fileName: 'Presentation.pptx'});
  };

  const handleRate = (messageId: string, rating: 'up' | 'down') => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) { return { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, rating } : m) }; }
      return s;
    }));
  };

  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };
  
  const handleExportData = () => {
    const dataStr = JSON.stringify({ sessions, userSettings }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `uchebnik-backup-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { const data = JSON.parse(event.target?.result as string); if (data.sessions) setSessions(data.sessions); if (data.userSettings) setUserSettings(data.userSettings); addToast('Данните са възстановени успешно!', 'success'); } catch (err) { addToast('Грешка при зареждане на файл.', 'error'); }
    };
    reader.readAsText(file); if(importInputRef.current) importInputRef.current.value = '';
  };

  const handleUnlockSubmit = () => {
    const key = unlockKeyInput.trim();
    
    if (isValidKey(key)) {
       setIsProUnlocked(true);
       localStorage.setItem('uchebnik_pro_status', 'unlocked');
       setUserSettings(prev => ({ ...prev, preferredModel: 'gemini-3-pro-preview' }));
       setShowUnlockModal(false);
       setUnlockKeyInput('');
       addToast("Успешно отключихте Pro Плана! Всички функции са достъпни.", 'success');
       
       // Note: We don't mark as "used" in localStorage here because
       // this key might be from another device. We trust the algorithm.
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
    // Generate a random 8-character string (Core)
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
    
    // Sign it
    const checksum = generateChecksum(randomCore);
    const newKeyCode = `UCH-${randomCore}-${checksum}`;
    
    // Save to local history for Admin's reference
    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false };
    const updatedKeys = [newKeyObj, ...generatedKeys];
    setGeneratedKeys(updatedKeys);
    localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
  };

  const renderLightbox = () => {
    if (!zoomedImage) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setZoomedImage(null)}>
        <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"><X size={24} /></button>
        <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500"><Shield size={32}/></div>
                <h2 className="text-xl font-bold">Админ Панел</h2>
             </div>
             <input 
               type="password" 
               value={adminPasswordInput}
               onChange={e => setAdminPasswordInput(e.target.value)}
               placeholder="Въведете парола"
               className="w-full bg-gray-100 dark:bg-black p-3 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold"
               autoFocus
             />
             <Button onClick={handleAdminLogin} className="w-full py-3">Вход</Button>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center pb-4 border-b border-indigo-500/10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500"/> Админ Панел</h2>
                <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Генерирай нов Premium ключ за достъп до Gemini 3.0 Pro.</p>
                <Button onClick={generateKey} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" icon={Key}>Генерирай Ключ</Button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/40 rounded-xl p-4 space-y-2 min-h-[200px]">
                {generatedKeys.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">Няма генерирани ключове</p>
                ) : (
                  generatedKeys.map((keyObj, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border animate-in slide-in-from-top-2 border-indigo-500/10`}>
                       <div className="flex flex-col">
                         <code className={`font-mono font-bold text-indigo-500`}>{keyObj.code}</code>
                         <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 text-emerald-500`}>
                            <CheckCircle size={10}/> Генериран
                         </span>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(keyObj.code); addToast('Копирано!', 'success'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Copy size={16}/></button>
                    </div>
                  ))
                )}
             </div>
             
             <Button variant="ghost" onClick={() => setShowAdminPanel(false)} className="w-full">Затвори</Button>
           </div>
        </div>
      );
    }

    return null;
  };

  const renderUnlockModal = () => {
    if (!showUnlockModal) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
          <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/30"><Crown size={32} fill="currentColor"/></div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Отключи Pro Плана</h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Получете достъп до Gemini 3.0 Pro и персонализиран дизайн.</p>
            </div>
          </div>
          <input
            type="text"
            value={unlockKeyInput}
            onChange={e => setUnlockKeyInput(e.target.value)}
            placeholder="Въведете вашия код"
            className="w-full bg-gray-100 dark:bg-black p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider"
            autoFocus
          />
          <Button onClick={handleUnlockSubmit} className="w-full py-4 text-base shadow-lg shadow-indigo-500/30 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none">Активирай Pro</Button>
        </div>
      </div>
    );
  };

  // --- Renders ---

  const renderSidebar = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-[320px] 
          ${userSettings.customBackground ? 'bg-white/30 dark:bg-black/40 backdrop-blur-2xl border-white/10' : 'bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-white/5'}
          border-r transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
          <div className="p-6 pb-2">
            <button onClick={() => { setActiveSubject(null); if(isMobile) setSidebarOpen(false); }} className="flex items-center gap-3 w-full group mb-8">
               <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles size={20} fill="currentColor" />
               </div>
               <div className="text-left">
                  <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight font-display">uchebnik.ai</h1>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${isProUnlocked ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500'}`}>
                    {isProUnlocked ? 'ПРОФЕСИОНАЛЕН ПЛАН' : 'БЕЗПЛАТЕН ПЛАН'}
                  </p>
               </div>
            </button>
            <div className="space-y-1">
              <button onClick={() => handleSubjectChange(SUBJECTS[0])} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/30'}`}>
                   <div className={`p-1.5 rounded-lg ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}><MessageSquare size={18} /></div>
                   <span className="font-bold text-sm">Общ Чат</span>
                   {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             <div className="flex items-center justify-between px-2 py-3 mt-2">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Предмети</span>
             </div>
             <div className="space-y-1">
                {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                  <button key={s.id} onClick={() => handleSubjectChange(s)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 border ${activeSubject?.id === s.id ? 'bg-indigo-50 dark:bg-white/10 border-indigo-500/30 text-indigo-700 dark:text-white font-semibold' : 'border-transparent text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <div className={`p-1.5 rounded-lg transition-colors ${activeSubject?.id === s.id ? 'bg-indigo-100 dark:bg-white/20 text-indigo-600 dark:text-white' : 'bg-gray-100 dark:bg-white/5'}`}>
                        <DynamicIcon name={s.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-sm truncate flex-1 text-left">{s.name}</span>
                    {unreadSubjects.has(s.id) && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                    {loadingSubjects[s.id] && activeSubject?.id !== s.id && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                  </button>
                ))}
             </div>
          </div>

          <div className={`p-4 border-t ${userSettings.customBackground ? 'border-white/10 bg-black/10' : 'border-gray-100 dark:border-white/5 bg-white/30 dark:bg-black/20'} space-y-3 backdrop-blur-md flex flex-col justify-center`}>
             
             {!isProUnlocked && (
               <button onClick={() => setShowUnlockModal(true)} className="w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient-xy" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="relative z-10 flex items-center justify-between text-white">
                     <div>
                        <h3 className="font-black text-lg tracking-tight">PRO PLAN</h3>
                        <p className="text-xs font-medium text-indigo-100 opacity-90">Отключи пълния потенциал</p>
                     </div>
                     <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <ArrowRight size={16} />
                     </div>
                  </div>
               </button>
             )}

             <Button variant="ghost" className="w-full justify-center text-sm font-medium h-11 hover:bg-white/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400" onClick={() => setShowSettings(true)}>
                 <Settings size={18} />
                 <span>Настройки</span>
             </Button>
             
             {/* Logout Button */}
             <Button variant="ghost" className="w-full justify-center text-sm font-medium h-11 hover:bg-red-500/10 text-red-500 dark:text-red-400" onClick={handleLogout}>
                 <LogOut size={18} />
                 <span>Изход</span>
             </Button>

             <a href="https://discord.gg/4SB2NGPq8h" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95 group">
                <svg width="20" height="20" viewBox="0 0 127 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.07 72.07 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.15 105.15 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96a75.2 75.2 0 0 0 6.57-12.8 69.1 69.1 0 0 1-10.46-5.01c.96-.71 1.9-1.44 2.81-2.19 26.25 12.31 54.54 12.31 80.8 0 .91.75 1.85 1.48 2.81 2.19a69.1 69.1 0 0 1-10.47 5.01 75.2 75.2 0 0 0 6.57 12.8A105.73 105.73 0 0 0 126.6 80.22c2.96-23.97-2.1-47.57-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60.08 31 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Zm42.2 0C78.38 65.69 73.2 60.08 73.2 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Z" fill="currentColor"/></svg>
                Влез в Discord
             </a>
             <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-medium pt-1">
                Създадено от 
                <a href="https://www.instagram.com/vanyoy/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Vanyo</a> 
                & 
                <a href="https://www.instagram.com/s_ivanov6/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Svetlyo</a>
             </div>
          </div>
        </aside>
      </>
    );
  };

  const renderWelcome = () => (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden ${userSettings.customBackground ? 'bg-transparent' : 'bg-white dark:bg-zinc-950'}`}>
      {!userSettings.customBackground && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none"></div>}
      
      {homeView === 'landing' ? (
        <div className="max-w-5xl w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10 animate-in fade-in zoom-in-95 duration-700">
          
          {/* Admin Panel Button */}
          <button onClick={() => setShowAdminAuth(true)} className="absolute top-0 right-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors">
              <Shield size={16} />
          </button>

          <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6 px-2">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-indigo-500/20 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 md:mb-6 backdrop-blur-xl shadow-lg">
                <Sparkles size={12} className="text-indigo-500" />
                <span>AI Учебен Асистент 2.0</span>
             </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 tracking-tighter leading-[1.1] md:leading-[1] font-display">
              Здравей{userSettings.userName ? `, ${userSettings.userName}` : ''}.
            </h1>
            <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed px-4">Твоят интелигентен помощник за училище. Какво ще учим днес?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full px-4 md:px-12 max-w-4xl">
            {/* CORRECTED GENERAL CHAT CARD */}
            <button onClick={() => handleSubjectChange(SUBJECTS[0])} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-zinc-900 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-accent-700 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out overflow-hidden ring-4 ring-transparent hover:ring-indigo-500/20">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-white/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md"><MessageSquare size={24} className="md:w-8 md:h-8" /></div>
                  <div><h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-3">Общ Чат</h3><p className="opacity-70 text-base md:text-lg font-medium">Попитай каквото и да е.</p></div>
                  <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm bg-white/20 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">Старт <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
               </div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-accent-500 blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            </button>

            <button onClick={() => setHomeView('subjects_grid')} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-white dark:bg-zinc-900 border border-indigo-500/10 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98]">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"><LayoutGrid size={24} className="md:w-8 md:h-8" /></div>
                  <div><h3 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2 md:mb-3">Предмети</h3><p className="text-zinc-500 mt-1 md:mt-2 text-base md:text-lg font-medium">Математика, История...</p></div>
                  <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm text-zinc-600 dark:text-zinc-300 bg-gray-100 dark:bg-white/5 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">Разгледай <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
               </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl w-full py-8 md:py-12 px-4 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
           <button onClick={() => setHomeView('landing')} className="mb-8 md:mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold group"><div className="p-3 bg-white dark:bg-zinc-900 rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div> Назад към начало</button>
           <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-8 md:mb-10 tracking-tight px-2">Избери Предмет</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={{animationDelay: `${i*50}ms`}} className="group flex flex-col items-center text-center p-6 md:p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[32px] border border-indigo-500/20 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 animate-in fade-in fill-mode-backwards">
                   <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl ${s.color} text-white flex items-center justify-center mb-4 md:mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}><DynamicIcon name={s.icon} className="w-8 h-8 md:w-10 md:h-10" /></div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl mb-2">{s.name}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">Натисни за старт</p>
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );

  const renderHistoryDrawer = () => {
    if (!historyDrawerOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setHistoryDrawerOpen(false)} />
        <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-indigo-500/20 backdrop-blur-3xl">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><History size={24} className="text-indigo-500"/> История</h2>
              <button onClick={() => setHistoryDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
           </div>
           
           <div className="space-y-4">
             {sessions.length === 0 && <p className="text-center text-gray-400 py-10">Няма запазени разговори.</p>}
             {sessions.map(s => (
               <div key={s.id} className={`group p-4 rounded-2xl border transition-all ${activeSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/20'}`}>
                  {renameSessionId === s.id ? (
                    <div className="flex items-center gap-2">
                       <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} className="flex-1 bg-white dark:bg-black px-2 py-1 rounded border border-indigo-300 outline-none text-sm"/>
                       <button onClick={() => renameSession(s.id, renameValue)} className="p-1.5 text-green-600 bg-green-50 rounded-lg"><Check size={14}/></button>
                       <button onClick={() => setRenameSessionId(null)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><X size={14}/></button>
                    </div>
                  ) : (
                    <div onClick={() => { setActiveSessionId(s.id); setHistoryDrawerOpen(false); if(activeSubject?.id !== s.subjectId) { const sub = SUBJECTS.find(sub => sub.id === s.subjectId); if(sub) setActiveSubject(sub); } }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-sm truncate pr-2 text-zinc-800 dark:text-zinc-200">{s.title}</h3>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setRenameSessionId(s.id); setRenameValue(s.title); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Trash2 size={12}/></button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-2">{s.preview}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                         <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10`}>{SUBJECTS.find(sub => sub.id === s.subjectId)?.name}</span>
                         <span>{new Date(s.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  const renderVoiceCallOverlay = () => {
    if (!isVoiceCallActive) return null;
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden">
        
        {/* Controls Header */}
        <div className="absolute top-6 right-6 z-20">
           <button onClick={endVoiceCall} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"><X size={28}/></button>
        </div>
        
        {/* Main Visualizer */}
        <div className="relative mb-12 z-10">
           <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 backdrop-blur-sm border border-white/10 ${voiceCallStatus === 'listening' ? 'bg-indigo-600/80 shadow-[0_0_100px_rgba(79,70,229,0.6)] scale-110' : voiceCallStatus === 'speaking' ? 'bg-emerald-500/80 shadow-[0_0_100px_rgba(16,185,129,0.6)] scale-105' : 'bg-zinc-800/80'}`}>
               {voiceCallStatus === 'listening' ? <Mic size={64} className="text-white animate-pulse"/> : 
                voiceCallStatus === 'speaking' ? <Volume2 size={64} className="text-white animate-bounce"/> :
                <Loader2 size={64} className="text-white animate-spin"/>}
           </div>
           {voiceCallStatus === 'listening' && (
              <>
                 <div className="absolute inset-0 border border-white/30 rounded-full animate-ping"/>
                 <div className="absolute inset-0 border border-indigo-500/50 rounded-full animate-ping delay-300"/>
              </>
           )}
        </div>

        {/* Text Status */}
        <div className="z-10 text-center mb-16 space-y-2">
           <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
              {voiceCallStatus === 'listening' ? "Слушам те..." : 
               voiceCallStatus === 'processing' ? "Мисля..." : 
               voiceCallStatus === 'speaking' ? "Говоря..." : 
               voiceMuted ? "Заглушен" : "Свързване..."}
           </h2>
           <p className="text-white/60 text-lg font-medium tracking-wide">
              {activeSubject?.name} • Разговорен режим
           </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-6 z-10">
           <button onClick={() => setVoiceMuted(!voiceMuted)} className={`p-6 rounded-full transition-all backdrop-blur-md border border-white/10 ${voiceMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {voiceMuted ? <MicOff size={32}/> : <Mic size={32}/>}
           </button>
           
           <button onClick={endVoiceCall} className="p-6 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg shadow-red-600/40 transition-all hover:scale-105 border border-red-500">
              <PhoneOff size={32}/>
           </button>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className={`flex-1 flex flex-col relative h-full ${userSettings.customBackground ? 'bg-transparent' : 'bg-[#f9fafb] dark:bg-[#09090b]'}`}>
      <header className={`sticky top-0 lg:top-4 mx-0 lg:mx-8 z-30 h-16 lg:h-18 
        ${userSettings.customBackground ? 'bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/10' : 'bg-white/80 dark:bg-black/80 lg:bg-white/70 lg:dark:bg-black/60 backdrop-blur-xl border-white/20 dark:border-white/10'} 
        border-b lg:border lg:shadow-sm lg:rounded-3xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 pt-safe`}>
         <div className="flex items-center gap-3 lg:gap-5 overflow-hidden flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 shrink-0"><Menu size={24}/></button>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${activeSubject?.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}><DynamicIcon name={activeSubject?.icon || 'Book'} className="w-5 h-5 lg:w-6 lg:h-6"/></div>
            <div className="overflow-hidden min-w-0 flex-1">
               <h2 className="font-bold text-zinc-900 dark:text-white leading-none text-base lg:text-lg tracking-tight truncate pr-2">{activeSubject?.name}</h2>
               <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar max-w-full">
                  {activeSubject?.modes.map(m => ( <button key={m} onClick={() => setActiveMode(m)} className={`text-[10px] lg:text-[11px] font-bold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full transition-all whitespace-nowrap ${activeMode === m ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>{m === AppMode.SOLVE ? 'Решаване' : m === AppMode.LEARN ? 'Учене' : m === AppMode.DRAW ? 'Рисуване' : m === AppMode.PRESENTATION ? 'Презентация' : 'Чат'}</button>))}
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-2">
             <Button variant="secondary" onClick={startVoiceCall} className="w-10 h-10 lg:w-12 lg:h-12 p-0 rounded-full border-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30" icon={Phone} />
             <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
             <Button variant="primary" onClick={() => activeSubject && createNewSession(activeSubject.id)} className="h-9 lg:h-10 px-3 lg:px-4 text-xs lg:text-sm rounded-xl shadow-none"><Plus size={16} className="lg:w-[18px] lg:h-[18px]"/><span className="hidden sm:inline">Нов</span></Button>
             <Button variant="ghost" onClick={() => setHistoryDrawerOpen(true)} className="w-9 h-9 lg:w-10 lg:h-10 p-0 rounded-full" icon={History} />
         </div>
      </header>

      {/* Overlays */}
      {renderHistoryDrawer()}
      {renderVoiceCallOverlay()}

      <div className={`flex-1 overflow-y-auto px-2 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth ${userSettings.textSize === 'large' ? 'text-lg' : userSettings.textSize === 'small' ? 'text-sm' : 'text-base'}`}>
         <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-40 pt-2 lg:pt-4">
            {currentMessages.map((msg) => (
               <div key={msg.id} id={msg.id} className={`flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-700 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`relative px-5 py-4 lg:px-8 lg:py-6 max-w-[90%] md:max-w-[85%] lg:max-w-[75%] backdrop-blur-md shadow-sm break-words overflow-hidden min-w-0 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-accent-600 text-white rounded-[24px] lg:rounded-[32px] rounded-br-none shadow-xl shadow-indigo-500/20' : 'glass-panel text-zinc-800 dark:text-zinc-200 rounded-[24px] lg:rounded-[32px] rounded-bl-none border-indigo-500/20'}`}>
                     
                     {/* Quote Block for Replies */}
                     {msg.replyToId && (() => {
                        const rMsg = currentMessages.find(m => m.id === msg.replyToId);
                        if (rMsg) return (
                           <div className="mb-3 pl-3 border-l-2 border-current/30 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => document.getElementById(rMsg.id)?.scrollIntoView({behavior:'smooth', block:'center'})}>
                              <div className="font-bold mb-0.5">{rMsg.role === 'user' ? 'Ти' : 'uchebnik.ai'}</div>
                              <div className="truncate italic">{rMsg.text ? rMsg.text.substring(0, 100) : (rMsg.images?.length ? '[Изображение]' : '')}</div>
                           </div>
                        )
                     })()}

                     {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x">
                            {msg.images.map((img, i) => ( img && typeof img === 'string' ? ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-40 lg:h-56 rounded-2xl object-cover border border-white/20 snap-center shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"/> ) : null ))}
                        </div>
                     )}
                     
                     {msg.type === 'slides' && msg.slidesData && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-4 border-b border-indigo-500/20"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-500"/> Генерирана Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-lg shadow-emerald-500/20"><Download size={14}/> Изтегли PPTX</button></div>
                           <div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-white/40 dark:bg-black/40 p-5 rounded-2xl border border-indigo-500/10"><h4 className="font-bold mb-3 text-base text-indigo-600 dark:text-indigo-400">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div>
                        </div>
                     )}

                     {msg.text && <div className="markdown-content w-full break-words overflow-hidden"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>{msg.text}</ReactMarkdown></div>}
                     {msg.chartData && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && <GeometryRenderer data={msg.geometryData} />}
                     
                     <div className={`text-[10px] mt-2 lg:mt-4 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-60`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        {msg.role === 'user' && <Check size={12} />}
                     </div>
                  </div>

                  <div className={`flex gap-1 px-4 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     {/* Action Buttons */}
                     <div className="flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-indigo-500/20 rounded-full p-1.5 shadow-sm mt-1">
                        {msg.role === 'model' && (
                           <>
                             <button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp size={14} className="lg:w-4 lg:h-4"/></button>
                             <button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown size={14} className="lg:w-4 lg:h-4"/></button>
                             <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 self-center"/>
                           </>
                        )}
                        <button onClick={() => handleReply(msg)} className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Отговор"><Reply size={14} className="lg:w-4 lg:h-4"/></button>
                        <button onClick={() => handleSpeak(msg.text, msg.id)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${speakingMessageId === msg.id ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`}>{speakingMessageId === msg.id ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleShare(msg.text)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Share2 size={14} className="lg:w-4 lg:h-4"/></button>
                     </div>
                  </div>
               </div>
            ))}
            
            {loadingSubjects[activeSubject.id] && (
               <div className="flex gap-4 pl-4 animate-in fade-in duration-500">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white dark:bg-zinc-900 border border-indigo-500/20 flex items-center justify-center shadow-sm"><Sparkles size={18} className="text-indigo-500 animate-pulse-slow"/></div>
                  <div className="bg-white/50 dark:bg-white/5 px-6 py-4 rounded-[24px] lg:rounded-[32px] rounded-bl-sm border border-indigo-500/20 flex items-center gap-2 backdrop-blur-md">
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"/>
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-100"/>
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200"/>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-6 lg:h-10"/>
         </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-2 lg:px-4 pointer-events-none z-40 flex justify-center pb-safe">
         <div className="w-full max-w-3xl pointer-events-auto mb-4 lg:mb-6">
            
            {/* Reply Banner */}
            {replyingTo && (
               <div className="mb-2 mx-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 fade-in">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Reply size={16}/>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Отговор на {replyingTo.role === 'user' ? 'теб' : 'uchebnik.ai'}</span>
                        <span className="text-sm font-medium truncate text-zinc-800 dark:text-zinc-200">{replyingTo.text || "Изображение"}</span>
                     </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                     <X size={16}/>
                  </button>
               </div>
            )}

            <div className={`relative 
               ${userSettings.customBackground ? 'bg-white/50 dark:bg-black/50 border-white/20' : 'bg-white/80 dark:bg-zinc-900/80 border-white/10'}
               backdrop-blur-xl border shadow-2xl rounded-[28px] transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white dark:focus-within:bg-black p-2 flex items-end gap-2 ${activeSubject && loadingSubjects[activeSubject.id] ? 'opacity-70 pointer-events-none' : ''}`}>
               
               {/* Attach Button */}
               <button onClick={() => fileInputRef.current?.click()} disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors">
                  <ImageIcon size={20} strokeWidth={2}/>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />

               {/* Voice Button - Moved here */}
               <button onClick={toggleListening} disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>
                  {isListening ? <MicOff size={20}/> : <Mic size={20} strokeWidth={2}/>}
               </button>

               {/* Textarea */}
               <div className="flex-1 py-2">
                   <textarea 
                      value={inputValue}
                      onChange={e => {
                          setInputValue(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                      }}
                      onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !(activeSubject && loadingSubjects[activeSubject.id])){e.preventDefault(); handleSend();}}} 
                      placeholder={replyingTo ? "Напиши отговор..." : "Напиши съобщение..."}
                      disabled={activeSubject ? loadingSubjects[activeSubject.id] : false}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-900 dark:text-zinc-100 placeholder-gray-400 resize-none max-h-32 min-h-[24px] leading-6"
                      rows={1}
                      style={{ height: '24px' }}
                   />
               </div>

               {/* Send Button */}
               <button onClick={() => handleSend()} disabled={(!inputValue.trim() && !selectedImages.length) || (activeSubject && loadingSubjects[activeSubject.id])} className="flex-none w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                  <ArrowUpRight size={22} strokeWidth={2.5} />
               </button>

               {/* Image Preview Overlay */}
               {selectedImages.length > 0 && (
                   <div className="absolute bottom-full left-0 mb-2 ml-2 flex gap-2">
                      {selectedImages.map((img, i) => ( 
                          <div key={i} className="relative group shrink-0 animate-in zoom-in-95">
                              <img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg"/>
                              <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                          </div>
                      ))}
                   </div>
               )}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium opacity-60">AI може да допуска грешки.</p>
         </div>
      </div>
    </div>
  );

  // --- Auth Gate ---
  if (authLoading) {
      return (
        <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-foreground">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
      );
  }

  if (!session) {
      return <Auth />;
  }

  return (
    <div className={`flex h-[100dvh] w-full overflow-hidden font-sans transition-colors duration-700 
      ${userSettings.customBackground ? 'bg-black/10' : 'bg-background'} 
      ${userSettings.textSize === 'large' ? 'text-lg' : userSettings.textSize === 'small' ? 'text-sm' : 'text-base'}`}>
      
      {/* Custom Background Image - Rendered behind everything but before content */}
      {userSettings.customBackground && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-700 animate-in fade-in" 
          style={{ backgroundImage: `url(${userSettings.customBackground})` }}
        >
          {/* Optional dark overlay for better text contrast if needed */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px]"></div>
        </div>
      )}

      {notification && <div className="fixed top-6 right-6 z-[100] glass-card p-4 rounded-2xl flex gap-4 animate-in slide-in-from-right duration-500 cursor-pointer hover:scale-105 transition-transform border border-indigo-500/20 shadow-2xl" onClick={() => { const s = SUBJECTS.find(sub => sub.id === notification.subjectId); if(s) handleSubjectChange(s); setNotification(null); }}><div className="bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-500/40"><BellRing size={20}/></div><div><p className="font-bold text-sm">Ново съобщение</p><p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p></div></div>}
      
      {/* Toast Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/50' :
            toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400/50' :
            'bg-zinc-800/90 text-white border-white/10'
          }`}>
             {toast.type === 'success' ? <CheckCircle size={20}/> : toast.type === 'error' ? <AlertCircle size={20}/> : <Info size={20}/>}
             <p className="font-medium text-sm">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-3xl border border-indigo-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <AlertTriangle size={24}/>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{confirmModal.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{confirmModal.message}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setConfirmModal(null)} className="py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Отказ</button>
                 <button onClick={confirmModal.onConfirm} className="py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Потвърди</button>
              </div>
           </div>
        </div>
      )}
      
      {renderAdminPanel()}
      {renderUnlockModal()}
      {renderSidebar()}
      
      <main className="flex-1 flex flex-col h-full relative w-full transition-all duration-500">
         {activeSubject ? renderChat() : renderWelcome()}
      </main>

      {renderLightbox()}

      {/* Settings Modal - Redesigned */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className={`w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${userSettings.customBackground ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl' : 'bg-white/90 dark:bg-black/90 backdrop-blur-2xl'}`}>
              <div className="p-8 border-b border-indigo-500/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                 <h2 className="text-3xl font-bold flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400"><Settings size={28}/></div> Настройки</h2>
                 <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-12">
                 
                 {/* Personalization Section */}
                 <section className="relative">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Palette size={16}/> Персонализация</h3>
                    <div className={`space-y-6 transition-all duration-300 ${!isProUnlocked ? 'opacity-40 blur-[2px] pointer-events-none select-none grayscale' : ''}`}>
                        {/* Theme Color */}
                        <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-lg">Основен Цвят</span>
                                <span className="text-xs text-gray-500">Избери цвета на бутоните и акцентите</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                  type="color" 
                                  value={userSettings.themeColor || '#6366f1'} 
                                  onChange={(e) => setUserSettings({...userSettings, themeColor: e.target.value})}
                                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                />
                                <button onClick={() => setUserSettings({...userSettings, themeColor: '#6366f1'})} className="text-xs font-bold text-gray-500 hover:text-indigo-500 underline">Възстанови</button>
                            </div>
                        </div>

                        {/* Custom Background */}
                        <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-lg">Фон</span>
                                    <span className="text-xs text-gray-500">Качи свое изображение за фон</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => backgroundInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 dark:bg-white/10 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-white/20 transition-colors">
                                        Качи
                                    </button>
                                    {userSettings.customBackground && (
                                        <button onClick={() => setUserSettings({...userSettings, customBackground: null})} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors">
                                            Премахни
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
                            </div>
                            
                            {userSettings.customBackground && (
                                <div className="h-32 w-full rounded-2xl overflow-hidden relative border border-gray-200 dark:border-white/10">
                                    <img src={userSettings.customBackground} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold backdrop-blur-[2px]">Преглед</div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {!isProUnlocked && (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                          <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-indigo-500/20 shadow-xl max-w-xs mx-auto animate-in zoom-in-95">
                             <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto shadow-lg shadow-indigo-500/40">
                                <Lock size={24} />
                             </div>
                             <h4 className="font-bold text-lg mb-2">Pro Функция</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-300 mb-4 font-medium">Отключете Pro плана, за да персонализирате дизайна.</p>
                             <button onClick={() => setShowUnlockModal(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                                 <Zap size={14} fill="currentColor"/> Отключи Pro
                             </button>
                          </div>
                       </div>
                    )}
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutGrid size={16}/> Външен вид</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 hover:border-indigo-500/30 transition-colors"><div className="flex items-center gap-4"><div className="p-3 bg-gray-100 dark:bg-black rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400">{isDarkMode ? <Moon size={22}/> : <Sun size={22}/>}</div><span className="font-bold text-lg">Тъмен режим</span></div><button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-16 h-9 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}><span className={`absolute top-1 left-1 bg-white w-7 h-7 rounded-full transition-transform shadow-sm ${isDarkMode ? 'translate-x-7' : ''}`}/></button></div>
                       <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-indigo-500/20 flex flex-col gap-3"><span className="font-bold text-lg">Размер на текста</span><div className="flex bg-gray-50 dark:bg-black p-1.5 rounded-2xl shadow-inner">{['small', 'normal', 'large'].map(s => (<button key={s} onClick={() => setUserSettings({...userSettings, textSize: s as any})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${userSettings.textSize === s ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{s === 'small' ? 'A' : s === 'normal' ? 'AA' : 'AAA'}</button>))}</div></div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Brain size={16}/> AI Персонализация</h3>
                    <div className="space-y-6">
                        <div className="p-2 bg-white dark:bg-white/5 rounded-2xl border border-indigo-500/20">
                           <input type="text" value={userSettings.userName} onChange={e => setUserSettings({...userSettings, userName: e.target.value})} placeholder="Как да те наричам?" className="w-full p-4 bg-transparent outline-none font-bold text-xl text-center placeholder-gray-300 dark:placeholder-gray-600 text-zinc-900 dark:text-white"/>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           {AI_MODELS.map(m => {
                             const isLocked = m.id === 'gemini-3-pro-preview' && !isProUnlocked;
                             return (
                               <button 
                                 key={m.id} 
                                 onClick={() => {
                                   if (isLocked) {
                                     setShowUnlockModal(true);
                                   } else {
                                     setUserSettings({...userSettings, preferredModel: m.id as any});
                                   }
                                 }} 
                                 className={`p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] relative overflow-hidden group/model
                                    ${userSettings.preferredModel === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10'}
                                    ${isLocked ? 'opacity-60 cursor-pointer border-dashed border-gray-400 dark:border-gray-600' : ''}
                                 `}
                               >
                                 <div className="font-bold text-sm mb-2 flex items-center justify-between">
                                   {m.name}
                                   {isLocked && <Lock size={14} className="text-gray-400 group-hover/model:text-red-400 transition-colors"/>}
                                   {!isLocked && userSettings.preferredModel === m.id && <Check size={14} className="text-white"/>}
                                 </div>
                                 <div className={`text-[11px] leading-tight ${userSettings.preferredModel === m.id ? 'opacity-90' : 'text-gray-400'}`}>
                                    {isLocked ? (
                                      <>
                                        <span className="group-hover/model:hidden">{m.description}</span>
                                        <span className="hidden group-hover/model:block text-indigo-500 font-bold">Кликнете, за да отключите</span>
                                      </>
                                    ) : (
                                      m.description
                                    )}
                                 </div>
                               </button>
                             );
                           })}
                        </div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16}/> Данни & Памет</h3>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-indigo-500/20 space-y-6">
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-gray-500"><span>Заета памет (текущ чат)</span><span>{Math.round((memoryUsage/MAX_MEMORY)*100)}%</span></div>
                           <div className="h-4 bg-gray-100 dark:bg-black rounded-full overflow-hidden"><div style={{width: `${Math.min((memoryUsage/MAX_MEMORY)*100, 100)}%`}} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000 ease-out"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Button variant="secondary" onClick={handleExportData} icon={Download} className="text-xs py-4">Архивирай</Button>
                            <Button variant="secondary" onClick={() => importInputRef.current?.click()} icon={Upload} className="text-xs py-4">Възстанови</Button>
                            <input type="file" ref={importInputRef} onChange={handleImportData} className="hidden" accept=".json"/>
                        </div>
                        <Button variant="secondary" onClick={handleClearMemory} className="w-full text-xs py-4 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30">Изчисти текущия чат</Button>
                    </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;