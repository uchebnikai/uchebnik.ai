import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { 
  SubjectId, 
  AppMode, 
  Session, 
  UserRole, 
  UserSettings, 
  UserPlan, 
  SubjectConfig, 
  HomeViewType, 
  Message 
} from './types';
import { SUBJECTS } from './constants';
import { Sidebar } from './components/layout/Sidebar';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { ChatInputArea } from './components/chat/ChatInputArea';
import { Auth } from './components/auth/Auth';
import { SettingsModal } from './components/settings/SettingsModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { UpgradeModal } from './components/subscription/UpgradeModal';
import { HistoryDrawer } from './components/history/HistoryDrawer';
import { VoiceCallOverlay } from './components/voice/VoiceCallOverlay';
import { Lightbox } from './components/ui/Lightbox';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { generateResponse } from './services/aiService';
import { useTheme } from './hooks/useTheme';
import { getSessionsFromStorage, saveSessionsToStorage, getSettingsFromStorage, saveSettingsToStorage } from './utils/storage';
import { verifyAdminPassword, redeemKey, generateChecksum } from './utils/security';
import { 
  TermsOfService, 
  PrivacyPolicy, 
  CookiePolicy, 
  About, 
  Contact 
} from './components/pages/StaticPages';
import { X } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  gradeLevel: '5-7',
  textSize: 'normal',
  haptics: true,
  notifications: true,
  sound: true,
  reduceMotion: false,
  responseLength: 'detailed',
  creativity: 'balanced',
  languageLevel: 'standard',
  preferredModel: 'auto',
  themeColor: '#6366f1',
  customBackground: null
};

export const App = () => {
  // Auth & Profile
  const [session, setSession] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<any>({ firstName: '', lastName: '', avatar: null });
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Settings & Theme
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  useTheme(userSettings);

  // UI State
  const [homeView, setHomeView] = useState<HomeViewType>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Chat State
  const [activeSubject, setActiveSubject] = useState<SubjectConfig | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice State
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceMuted, setVoiceMuted] = useState(false);

  // Upgrade State
  const [targetPlan, setTargetPlan] = useState<UserPlan | null>(null);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');

  // Admin State
  const [generatedKeys, setGeneratedKeys] = useState<{ code: string; isUsed: boolean }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for Stripe Success session_id in URL
  useEffect(() => {
      const query = new URLSearchParams(window.location.search);
      if (query.get('session_id') && session) {
          addToast('Абонаментът е активиран успешно! Благодарим ви.', 'success');
          fetchProfile(session.user.id);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, [session]);

  // Data persistence
  useEffect(() => {
    const loadData = async () => {
      const key = session?.user?.id || 'guest';
      const storedSessions = await getSessionsFromStorage(key);
      setSessions(storedSessions);
      const storedSettings = await getSettingsFromStorage(key);
      if (storedSettings) setUserSettings(storedSettings);
    };
    loadData();
  }, [session]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUserMeta({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatar: data.avatar_url
      });
      setUserPlan(data.plan || 'free');
    }
  };

  const addToast = (msg: string, type: 'success' | 'error' | 'info') => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (type === 'success' || type === 'error') {
      alert(msg);
    }
  };

  const createNewSession = (subjectId: SubjectId, role?: UserRole, initialMode?: AppMode) => {
    const newSession: Session = {
      id: Date.now().toString(),
      subjectId,
      title: 'Нов разговор',
      createdAt: Date.now(),
      lastModified: Date.now(),
      messages: [],
      preview: '',
      role: role || userRole || undefined,
      mode: initialMode || activeMode
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    const sub = SUBJECTS.find(s => s.id === subjectId);
    if (sub) setActiveSubject(sub);
    setHomeView('chat_view' as any);
  };

  const handleSubjectChange = (subject: SubjectConfig, role?: UserRole) => {
    setActiveSubject(subject);
    if (role) setUserRole(role);
    
    const lastSession = sessions.find(s => s.subjectId === subject.id && (!role || s.role === role));
    if (lastSession) {
      setActiveSessionId(lastSession.id);
      setActiveMode(lastSession.mode || AppMode.CHAT);
    } else {
      createNewSession(subject.id, role);
    }
    setHomeView('chat_view' as any);
  };

  const handleSend = async (customText?: string, customImages?: string[]) => {
    const text = customText || inputValue;
    const images = customImages || selectedImages;
    
    if (!text.trim() && images.length === 0) return;
    
    const sessId = activeSessionId || Date.now().toString();
    if (!activeSessionId) {
        createNewSession(activeSubject?.id || SubjectId.GENERAL);
    }

    setSessions(prev => prev.map(s => s.id === (activeSessionId || sessId) ? {
        ...s,
        messages: [...s.messages, {
            id: Date.now().toString(),
            role: 'user',
            text,
            images,
            timestamp: Date.now(),
            replyToId: replyingTo?.id
        }]
    } : s));

    setInputValue('');
    setSelectedImages([]);
    setReplyingTo(null);
    setLoadingSubject(true);

    try {
      const currentSession = sessions.find(s => s.id === activeSessionId || s.id === sessId);
      const history = currentSession?.messages || [];
      const model = userSettings.preferredModel === 'auto' 
        ? (userPlan === 'pro' ? 'google/gemma-3-27b-it:free' : userPlan === 'plus' ? 'google/gemma-3-12b-it:free' : 'google/gemma-3-4b-it:free')
        : userSettings.preferredModel;

      const aiResponse = await generateResponse(
        activeSubject?.id || SubjectId.GENERAL,
        activeMode,
        text,
        images,
        history,
        model
      );

      setSessions(prev => prev.map(s => s.id === (activeSessionId || sessId) ? {
          ...s,
          messages: [...s.messages, aiResponse],
          lastModified: Date.now(),
          preview: aiResponse.text.substring(0, 50)
      } : s));
    } catch (err) {
      addToast('Грешка при комуникация с AI.', 'error');
    } finally {
      setLoadingSubject(false);
    }
  };

  const handleStripeCheckout = async (plan: 'plus' | 'pro') => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    
    const priceId = plan === 'plus' ? 'price_1SfPSpE0C0vexh9Cg2YUGPah' : 'price_1SfPTEE0C0vexh9C9RZMvkHB';
    
    try {
      console.log(`Иницииране на плащане за план: ${plan}, Price ID: ${priceId}`);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId, 
          userId: session.user.id, 
          email: session.user.email 
        }
      });
      
      if (error) {
        // Показване на тялото на грешката, за да се разбере какво се случва
        console.error('Full Supabase Error:', error);
        let msg = 'Грешка в Edge функцията.';
        try {
           const details = await error.context.json();
           msg += ` Детайли: ${details.error || JSON.stringify(details)}`;
        } catch(e) {}
        throw new Error(msg);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Функцията не върна URL за плащане. Проверете дали STRIPE_SECRET_KEY е добавен в Supabase Secrets.');
      }
    } catch (err: any) {
      console.error('Checkout Implementation Error:', err);
      addToast(err.message || 'Грешка при плащането. Моля, проверете Supabase logs.', 'error');
    }
  };

  const handleManageBilling = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: session.user.id }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      addToast(err.message || 'Грешка при отваряне на портала за управление.', 'error');
    }
  };

  const handleUnlockSubmit = async () => {
    const result = await redeemKey(unlockKeyInput, session?.user?.id);
    if (result.valid) {
      setUserPlan(result.plan || 'pro');
      addToast(`Успешно активиран ${result.plan} план!`, 'success');
      setShowUnlockModal(false);
      if (session) fetchProfile(session.user.id);
    } else {
      addToast(result.error || 'Невалиден код.', 'error');
    }
  };

  const handleAdminLogin = async () => {
    const isValid = await verifyAdminPassword(adminPasswordInput);
    if (isValid) {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
    } else {
      addToast('Грешна парола.', 'error');
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  };

  const generateKey = () => {
    const core = Math.random().toString(36).substring(2, 10).toUpperCase();
    const checksum = generateChecksum(core);
    const code = `UCH-${core}-${checksum}`;
    setGeneratedKeys(prev => [{ code, isUsed: false }, ...prev]);
  };

  const handleDeleteAllChats = () => {
    setSessions([]);
    setActiveSessionId(null);
    saveSessionsToStorage(session?.user?.id || 'guest', []);
    setShowSettings(false);
    addToast('Всички чатове бяха изтрити.', 'success');
  };

  // Автоматично запазване на сесии
  useEffect(() => {
    if (sessions.length > 0) {
        saveSessionsToStorage(session?.user?.id || 'guest', sessions);
    }
  }, [sessions, session]);

  // Автоматично запазване на настройки
  useEffect(() => {
    saveSettingsToStorage(session?.user?.id || 'guest', userSettings);
  }, [userSettings, session]);

  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

  return (
    <div className={`flex h-screen w-full bg-background transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
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
        deleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        createNewSession={createNewSession}
        unreadSubjects={new Set()}
        activeMode={activeMode}
        userMeta={userMeta}
        session={session}
        setShowUnlockModal={setShowUnlockModal}
        setShowSettings={setShowSettings}
        handleLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
        addToast={addToast}
        setShowSubjectDashboard={() => {}}
        userRole={userRole}
        streak={3}
        homeView={homeView}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {homeView === 'landing' || homeView === 'school_select' || homeView === 'student_subjects' || homeView === 'teacher_subjects' ? (
          <WelcomeScreen 
            homeView={homeView}
            userMeta={userMeta}
            userSettings={userSettings}
            handleSubjectChange={handleSubjectChange}
            setHomeView={setHomeView}
            setUserRole={setUserRole}
            setShowAdminAuth={setShowAdminAuth}
            onQuickStart={handleSend}
            setSidebarOpen={setSidebarOpen}
          />
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
        ) : (
          <div className="flex flex-col h-full">
            <ChatHeader 
              setSidebarOpen={setSidebarOpen}
              activeSubject={activeSubject}
              userRole={userRole}
              activeMode={activeMode}
              startVoiceCall={() => setIsVoiceCallActive(true)}
              createNewSession={createNewSession}
              setHistoryDrawerOpen={setHistoryDrawerOpen}
              userSettings={userSettings}
              setFocusMode={setFocusMode}
            />
            <MessageList 
              currentMessages={currentMessages}
              userSettings={userSettings}
              setZoomedImage={setZoomedImage}
              handleRate={() => {}}
              handleReply={setReplyingTo}
              handleSpeak={() => {}}
              speakingMessageId={speakingMessageId}
              handleCopy={() => {}}
              copiedId={copiedId}
              handleShare={() => {}}
              loadingSubject={loadingSubject}
              activeSubject={activeSubject}
              messagesEndRef={messagesEndRef}
            />
            <ChatInputArea 
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              userSettings={userSettings}
              fileInputRef={useRef(null)}
              loadingSubject={loadingSubject}
              handleImageUpload={(e) => {}}
              toggleListening={() => setIsListening(!isListening)}
              isListening={isListening}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSend={handleSend}
              selectedImages={selectedImages}
              handleRemoveImage={(i) => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
              onCameraCapture={(img) => setSelectedImages(prev => [...prev, img])}
            />
          </div>
        )}
      </main>

      {showAuthModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4">
              <div className="relative w-full max-w-md">
                <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white z-10"><X size={24}/></button>
                <Auth isModal onSuccess={() => setShowAuthModal(false)} />
              </div>
          </div>
      )}

      <SettingsModal 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        userMeta={userMeta}
        editProfile={userMeta}
        setEditProfile={setUserMeta}
        handleUpdateAccount={() => {}}
        handleAvatarUpload={() => {}}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        isPremium={userPlan !== 'free'}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        handleBackgroundUpload={() => {}}
        handleDeleteAllChats={handleDeleteAllChats}
        handleManageBilling={handleManageBilling}
      />

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
        onStripeCheckout={handleStripeCheckout}
      />

      <HistoryDrawer 
        historyDrawerOpen={historyDrawerOpen}
        setHistoryDrawerOpen={setHistoryDrawerOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        renameSessionId={null}
        setRenameSessionId={() => {}}
        renameValue=""
        setRenameValue={() => {}}
        renameSession={() => {}}
        deleteSession={() => {}}
        activeSubject={activeSubject}
        setActiveSubject={setActiveSubject}
      />

      <VoiceCallOverlay 
        isVoiceCallActive={isVoiceCallActive}
        voiceCallStatus={voiceCallStatus}
        voiceMuted={voiceMuted}
        setVoiceMuted={setVoiceMuted}
        endVoiceCall={() => setIsVoiceCallActive(false)}
        activeSubject={activeSubject}
      />

      <Lightbox image={zoomedImage} onClose={() => setZoomedImage(null)} />
      
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Изтриване на чат"
        message="Сигурни ли сте, че искате да изтриете този чат? Това действие е необратимо."
        onConfirm={() => {}}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
