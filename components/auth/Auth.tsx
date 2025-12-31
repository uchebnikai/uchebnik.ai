import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, AlertCircle, Calendar, Eye, EyeOff, ArrowLeft, GraduationCap, Brain, Zap, ShieldCheck, X } from 'lucide-react';
import { INPUT_AUTH } from '../../styles/ui';
import { FADE_IN, SLIDE_UP, ZOOM_IN } from '../../animations/transitions';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';

interface AuthProps {
  isModal?: boolean;
  onSuccess?: () => void;
  initialMode?: AuthMode;
  onNavigate?: (view: any) => void;
}

export const Auth = ({ isModal = false, onSuccess, initialMode = 'login', onNavigate }: AuthProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Registration Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 200);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        if (new Date(birthDate) > new Date()) {
            throw new Error("Датата на раждане не може да бъде в бъдещето.");
        }
        const referralCode = localStorage.getItem('uchebnik_invite_code');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              birth_date: birthDate,
              referral_code: referralCode || null
            },
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setSuccessMsg('Регистрацията е успешна! Проверете имейла си за линк за потвърждение.');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        handleClose();
      } else if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Изпратен е имейл за възстановяване на паролата.');
      } else if (mode === 'update_password') {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setSuccessMsg('Паролата е обновена успешно!');
          setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Database error') || err.message.includes('saving new user'))) {
          setError('Възникна системна грешка при регистрацията (DB). Моля, опитайте отново по-късно.');
      } else {
          setError(err.message || 'Възникна грешка.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            client_id: '632370938906-f6daog6qh4aqtaic1o2bao63t4gceomd.apps.googleusercontent.com',
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Грешка при вход с Google.');
      setLoading(false);
    }
  };

  React.useEffect(() => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
          setMode('update_password');
      }
  }, []);

  const handleFooterNavigate = (view: any) => {
    if (onNavigate) {
      onNavigate(view);
      handleClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-[#09090b] flex flex-col md:flex-row overflow-hidden ${isExiting ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-500'}`}>
        
        {/* Left Side: Immersive Branding */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[#0d0d0f] relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            
            <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-4 mb-8 group cursor-default">
                    <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500" alt="Logo" />
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter font-display leading-none">Uchebnik AI</h1>
                    </div>
                </div>

                <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-10">
                    Учи по-лесно с изкуствен интелект
                </h2>

                <div className="grid grid-cols-1 gap-8">
                    {[
                        { icon: GraduationCap, title: 'За училище и университет', desc: 'Персонализирана помощ за всяка образователна степен.' },
                        { icon: Brain, title: 'Интелигентни решения', desc: 'Подробни обяснения стъпка по стъпка за всяка задача.' },
                        { icon: ShieldCheck, title: 'Сигурно и надеждно', desc: 'Вашите данни са защитени и винаги под ръка.' }
                    ].map((feature, i) => (
                        <div key={i} className="flex gap-5 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all duration-300 border border-white/5">
                                <feature.icon size={22} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-1">{feature.title}</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-y-auto custom-scrollbar">
            {/* Mobile Header */}
            <div className="md:hidden p-6 flex justify-between items-center bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" className="w-8 h-8 rounded-lg" alt="Logo" />
                    <span className="font-display font-black text-white text-lg">Uchebnik AI</span>
                </div>
                {onSuccess && (
                    <button onClick={handleClose} className="p-2 text-zinc-400"><X size={20}/></button>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className={`w-full max-w-md ${isExiting ? 'animate-out zoom-out-95 duration-200' : `${SLIDE_UP} duration-500`}`}>
                    
                    {onSuccess && (
                        <button 
                            onClick={handleClose} 
                            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white mb-10 transition-all group font-bold text-sm"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                            Назад към сайта
                        </button>
                    )}

                    <div className="mb-10">
                        <h3 className="text-3xl font-black text-white tracking-tight mb-2">
                            {mode === 'login' && 'Добре дошли отново'}
                            {mode === 'register' && 'Създаване на акаунт'}
                            {mode === 'forgot_password' && 'Забравена парола'}
                            {mode === 'update_password' && 'Нова парола'}
                        </h3>
                        <p className="text-zinc-500 font-medium">
                            {mode === 'login' && 'Влезте, за да продължите ученето.'}
                            {mode === 'register' && 'Присъединете се към бъдещето на образованието.'}
                            {mode === 'forgot_password' && 'Въведете имейла си за възстановяване.'}
                            {mode === 'update_password' && 'Изберете сигурна парола.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
                            <CheckCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {(mode === 'login' || mode === 'register') && (
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold shadow-xl transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 group"
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png" className="w-5 h-5" alt="Google" />
                                <span>Продължи с Google</span>
                            </button>
                        )}

                        {(mode === 'login' || mode === 'register') && (
                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px bg-white/5 flex-1" />
                                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">или с имейл</span>
                                <div className="h-px bg-white/5 flex-1" />
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Име</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                                placeholder="Иван"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Фамилия</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                                placeholder="Иванов"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Дата на раждане</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            required
                                            max={today}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode !== 'update_password' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Имейл адрес</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {mode !== 'forgot_password' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Парола</label>
                                    {mode === 'login' && (
                                        <button 
                                            type="button" 
                                            onClick={() => setMode('forgot_password')} 
                                            className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
                                        >
                                            Забравена парола?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3 mt-4 group"
                        >
                            {loading ? <Loader2 size={22} className="animate-spin" /> : (
                                <>
                                    <span>
                                        {mode === 'login' && 'Вход в системата'}
                                        {mode === 'register' && 'Регистрация'}
                                        {mode === 'forgot_password' && 'Изпрати линк'}
                                        {mode === 'update_password' && 'Обнови парола'}
                                    </span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        {mode === 'login' && (
                            <p className="text-zinc-500 text-sm font-medium">
                                Нямате акаунт?{' '}
                                <button onClick={() => setMode('register')} className="text-white font-bold hover:underline">
                                    Създайте нов безплатно
                                </button>
                            </p>
                        )}
                        {mode === 'register' && (
                            <p className="text-zinc-500 text-sm font-medium">
                                Вече имате акаунт?{' '}
                                <button onClick={() => setMode('login')} className="text-white font-bold hover:underline">
                                    Влезте тук
                                </button>
                            </p>
                        )}
                        {(mode === 'forgot_password' || mode === 'update_password') && (
                            <button onClick={() => setMode('login')} className="text-zinc-400 font-bold hover:text-white text-sm transition-colors flex items-center gap-2 mx-auto">
                                <ArrowLeft size={16}/> Назад към вход
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 mt-auto text-center flex flex-col items-center gap-4 border-t border-white/5">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <button onClick={() => handleFooterNavigate('about')} className="hover:text-white transition-colors">За нас</button>
                    <button onClick={() => handleFooterNavigate('privacy')} className="hover:text-white transition-colors">Поверителност</button>
                    <button onClick={() => handleFooterNavigate('terms')} className="hover:text-white transition-colors">Условия</button>
                    <button onClick={() => handleFooterNavigate('contact')} className="hover:text-white transition-colors">Контакти</button>
                </div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                    © {new Date().getFullYear()} Uchebnik AI. Всички права запазени.
                </div>
            </div>
        </div>
    </div>
  );
};