
import React from 'react';
import { X, Gift, Copy, CheckCircle, Users } from 'lucide-react';
import { UserSettings } from '../../types';
import { t } from '../../utils/translations';
import { MODAL_ENTER } from '../../animations/transitions';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ReferralModal = ({ isOpen, onClose, userSettings, addToast }: ReferralModalProps) => {
  if (!isOpen) return null;

  const referralLink = userSettings.referralCode 
    ? `${window.location.origin}/?ref=${userSettings.referralCode}` 
    : 'Loading...';

  const handleCopyReferral = () => {
      navigator.clipboard.writeText(referralLink);
      addToast(t('referral_link_copied', userSettings.language) || "Link copied!", 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Background Effects */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/30 blur-[80px] rounded-full pointer-events-none" />

        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors z-20">
            <X size={20}/>
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 rotate-3 transform hover:rotate-6 transition-transform">
                <Gift size={40} className="text-white" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Покани Приятел</h2>
            <p className="text-zinc-400 mb-8 max-w-xs">
                Подари на приятел 3 дни Pro план и получи същото, когато се регистрира!
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-8">
                <div className="flex-1 truncate text-left">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Твоят уникален линк</div>
                    <div className="text-white font-mono text-sm truncate">{referralLink}</div>
                </div>
                <button 
                    onClick={handleCopyReferral}
                    className="shrink-0 bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                >
                    <Copy size={16}/> {t('copy', userSettings.language)}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">1</div>
                    <span className="text-xs font-medium text-zinc-400">Изпрати линк</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">2</div>
                    <span className="text-xs font-medium text-zinc-400">Приятел влиза</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"><CheckCircle size={16}/></div>
                    <span className="text-xs font-bold text-white">И двамата печелите!</span>
                </div>
            </div>
        </div>
        
        {userSettings.proExpiresAt && (
            <div className="bg-amber-500/10 border-t border-amber-500/20 p-4 text-center">
                <p className="text-xs text-amber-300 font-medium">
                    Активен Pro до: {new Date(userSettings.proExpiresAt).toLocaleDateString()}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
