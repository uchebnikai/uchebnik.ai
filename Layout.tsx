import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/Settings';
import { AdminPanel, UnlockModal, HistoryDrawer } from './components/Modals';
import { VoiceOverlay } from './components/Voice';
import { Lightbox } from './components/Lightbox';
import { useAppContext } from './context/AppContext';
import { BellRing, Loader2 } from 'lucide-react';
import { SUBJECTS } from './constants';
import { Auth } from './Auth';

export const Layout = () => {
  const { notification, setNotification, setActiveSubject, userSettings, authLoading, session } = useAppContext();

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
      
      {userSettings.customBackground && (
        <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-700 animate-in fade-in" style={{ backgroundImage: `url(${userSettings.customBackground})` }}>
          <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px]"></div>
        </div>
      )}

      {notification && <div className="fixed top-6 right-6 z-[100] glass-card p-4 rounded-2xl flex gap-4 animate-in slide-in-from-right duration-500 cursor-pointer hover:scale-105 transition-transform border border-indigo-500/20 shadow-2xl" onClick={() => { const s = SUBJECTS.find(sub => sub.id === notification.subjectId); if(s) setActiveSubject(s); setNotification(null); }}><div className="bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-500/40"><BellRing size={20}/></div><div><p className="font-bold text-sm">Ново съобщение</p><p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p></div></div>}
      
      <AdminPanel />
      <UnlockModal />
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full relative w-full transition-all duration-500">
         <Outlet />
      </main>

      <SettingsModal />
      <HistoryDrawer />
      <VoiceOverlay />
      <Lightbox />
    </div>
  );
};