
import React from 'react';
import { X, Gift, Copy, CheckCircle, Users, Crown, Zap, MessageCircle } from 'lucide-react';
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
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-5 rotate-3 transform hover:rotate-6 transition-transform">
                <Gift size={32} className="text-white" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Покани Приятел</h2>
            <p className="text-zinc-400 mb-6 max-w-xs">
                Покани приятел и получи 3 дни Pro план безплатно, когато той се регистрира!
            </p>

            {/* Pro Benefits Showcase */}
            <div className="w-full bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-5 mb-6 text-left relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-amber-500/10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <Crown size={80} fill="currentColor" />
                </div>
                
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Crown size={14} fill="currentColor"/> Какво печелиш с Pro?
                </h3>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 bg-amber-500/20 rounded-full text-amber-500"><Zap size={12} fill="currentColor"/></div>
                        <span className="text-sm font-medium text-zinc-200">Неограничени снимки</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 bg-amber-500/20 rounded-full text-amber-500"><Crown size={12} fill="currentColor"/></div>
                        <span className="text-sm font-medium text-zinc-200">Най-мощният AI</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 bg-amber-500/20 rounded-full text-amber-500"><MessageCircle size={12} fill="currentColor"/></div>
                        <span className="text-sm font-medium text-zinc-200">Гласов режим</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 bg-amber-500/20 rounded-full text-amber-500"><CheckCircle size={12} /></div>
                        <span className="text-sm font-medium text-zinc-200">AI Роли & Персони</span>
                    </div>
                </div>
            </div>

            <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-6">
                <div className="flex-1 truncate text-left">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Твоят уникален линк</div>
                    <div className="text-white font-mono text-sm truncate select-all">{referralLink}</div>
                </div>
                <button 
                    onClick={handleCopyReferral}
                    className="shrink-0 bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors active:scale-95"
                >
                    <Copy size={16}/> {t('copy', userSettings.language)}
                </button>
            </div>

            <div className="flex justify-between w-full text-center gap-4 px-2">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-400">1</div>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mt-1">Изпрати</span>
                </div>
                <div className="h-px bg-white/10 flex-1 mt-4"></div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-400">2</div>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mt-1">Приятел влиза</span>
                </div>
                <div className="h-px bg-white/10 flex-1 mt-4"></div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]"><Crown size={14} fill="currentColor"/></div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mt-1">Pro за теб!</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
