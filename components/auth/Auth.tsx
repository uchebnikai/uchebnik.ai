import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { GLASS_PANEL, INPUT_AUTH } from '../../styles/ui';
import { ZOOM_IN } from '../../animations/transitions';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';

interface AuthProps {
  isModal?: boolean;
  onSuccess?: () => void;
}

export const Auth = ({ isModal = false, onSuccess }: AuthProps) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              birth_date: birthDate
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
        if (onSuccess) onSuccess();
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
      setError(err.message || 'Възникна грешка.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
          setMode('update_password');
      }
  }, []);

  return (
    <div className={`flex items-center justify-center w-full relative ${isModal ? 'bg-transparent p-0' : 'bg-transparent min-h-screen overflow-hidden'}`}>
        {!isModal && (
            <div className="absolute inset-0 bg-black/50 z-0" />
        )}

      <div className={`w-full max-w-md p-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl ${ZOOM_IN} relative z-10 ${isModal ? '' : 'mx-4'}`}>
        <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-6 border border-white/20">
                <Sparkles size={40} fill="currentColor" />
            </div>
          <h1 className="text-4xl font-black text-center tracking-tight text-white font-display drop-shadow-md">
             uchebnik.ai
          </h1>
          <p className="text-gray-400 mt-2 text-center text-sm font-medium tracking-wide">
            {mode === 'login' && 'Влезте в акаунта си'}
            {mode === 'register' && 'Създайте нов акаунт'}
            {mode === 'forgot_password' && 'Възстановяване на парола'}
            {mode === 'update_password' && 'Въведете нова парола'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-500/30 text-red-200 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={INPUT_AUTH}
                        placeholder="Име"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={INPUT_AUTH}
                        placeholder="Фамилия"
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-1">
                  <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className={`${INPUT_AUTH} text-gray-300`}
                      />
                  </div>
              </div>
            </>
          )}

          {mode !== 'update_password' && (
            <div className="space-y-1">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={INPUT_AUTH}
                    placeholder="Email"
                    />
                </div>
            </div>
          )}

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={INPUT_AUTH}
                    placeholder="Парола"
                    />
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                    {mode === 'login' && 'Вход'}
                    {mode === 'register' && 'Регистрация'}
                    {mode === 'forgot_password' && 'Изпрати линк'}
                    {mode === 'update_password' && 'Обнови парола'}
                    {!loading && <ArrowRight size={18} />}
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3 text-center text-sm">
          {mode === 'login' && (
            <>
              <p className="text-gray-400">
                Нямате акаунт?{' '}
                <button onClick={() => setMode('register')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                  Регистрация
                </button>
              </p>
              <button onClick={() => setMode('forgot_password')} className="text-gray-500 hover:text-white transition-colors text-xs">
                Забравена парола?
              </button>
            </>
          )}

          {mode === 'register' && (
            <p className="text-gray-400">
              Имате акаунт?{' '}
              <button onClick={() => setMode('login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                Вход
              </button>
            </p>
          )}

          {(mode === 'forgot_password' || mode === 'update_password') && (
            <button onClick={() => setMode('login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
              Назад към вход
            </button>
          )}
        </div>
      </div>
    </div>
  );
};