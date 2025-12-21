
import React from 'react';
import { CheckCircle, Mail, Key, Sparkles, ArrowRight } from 'lucide-react';
import { t } from '../../utils/translations';
import { UserSettings } from '../../types';
import { GLASS_PANEL } from '../../styles/ui';
import { ZOOM_IN } from '../../animations/transitions';

interface AuthSuccessProps {
  type: 'verification' | 'magiclink' | 'email_change' | 'generic';
  onContinue: () => void;
  userSettings: UserSettings;
}

export const AuthSuccess = ({ type, onContinue, userSettings }: AuthSuccessProps) => {
  
  const getConfig = () => {
    switch (type) {
      case 'verification':
        return {
          icon: <Mail size={48} className="text-white" />,
          color: 'bg-green-500',
          shadow: 'shadow-green-500/30',
          title: t('auth_success_email_title', userSettings.language),
          desc: t('auth_success_email_desc', userSettings.language)
        };
      case 'magiclink':
        return {
          icon: <Sparkles size={48} className="text-white" />,
          color: 'bg-indigo-500',
          shadow: 'shadow-indigo-500/30',
          title: t('auth_success_magic_title', userSettings.language),
          desc: t('auth_success_magic_desc', userSettings.language)
        };
      default:
        return {
          icon: <CheckCircle size={48} className="text-white" />,
          color: 'bg-blue-500',
          shadow: 'shadow-blue-500/30',
          title: t('auth_success_default_title', userSettings.language),
          desc: t('auth_success_default_desc', userSettings.language)
        };
    }
  };

  const config = getConfig();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className={`absolute top-[20%] left-[20%] w-64 h-64 rounded-full ${config.color} opacity-20 blur-[100px] pointer-events-none`} />
      
      <div className={`w-full max-w-md p-8 ${GLASS_PANEL} ${ZOOM_IN} duration-700 flex flex-col items-center text-center relative z-10`}>
        
        <div className={`w-24 h-24 rounded-[2rem] ${config.color} flex items-center justify-center shadow-2xl ${config.shadow} mb-8 animate-in zoom-in-50 duration-500`}>
          {config.icon}
        </div>

        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight font-display">
          {config.title}
        </h1>
        
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-8 leading-relaxed">
          {config.desc}
        </p>

        <button
          onClick={onContinue}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group ${config.color} ${config.shadow}`}
        >
          {t('continue_to_app', userSettings.language)}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

      </div>
    </div>
  );
};
