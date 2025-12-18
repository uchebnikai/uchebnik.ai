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
  
  // Registration Fields
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            // Explicitly pass the client_id to ensure Google receives the correct app ID
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

  // Check for password recovery hash in URL
  React.useEffect(() => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
          setMode('update_password');
      }
  }, []);

  return (
    <div className={`flex items-center justify-center w-full relative ${isModal ? 'bg-transparent p-0' : 'bg-background min-h-screen overflow-hidden'}`}>
        {!isModal && (
            <>
                {/* Background Effects */}
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none" />
            </>
        )}

      <div className={`w-full max-w-md p-8 ${GLASS_PANEL} ${ZOOM_IN} duration-500 relative z-10 ${isModal ? '' : 'mx-4'}`}>
        <div className="flex flex-col items-center mb-8">
            <img src="https://i.ibb.co/LDgTCm9N/6151f23e-b922-4c62-930f-853884bf4c89.png" alt="Logo" className="w-24 h-24 mb-6 rounded-[2rem] object-contain drop-shadow-2xl animate-in zoom-in-50 duration-500" />
          <h1 className="text-3xl font-bold text-center tracking-tight text-foreground font-display">
             Uchebnik AI
          </h1>
          <p className="text-gray-500 mt-2 text-center text-sm font-medium">
            {mode === 'login' && 'Влезте в акаунта си'}
            {mode === 'register' && 'Създайте нов акаунт'}
            {mode === 'forgot_password' && 'Възстановяване на парола'}
            {mode === 'update_password' && 'Въведете нова парола'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
            <>
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-bold shadow-lg border border-gray-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 mb-6 group"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                    <span>{mode === 'register' ? 'Регистрация с Google' : 'Вход с Google'}</span>
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">или с имейл</span>
                    <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                </div>
            </>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Име</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={INPUT_AUTH}
                        placeholder="Иван"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Фамилия</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={INPUT_AUTH}
                        placeholder="Иванов"
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Дата на раждане</label>
                  <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className={`${INPUT_AUTH} text-gray-500`}
                      />
                  </div>
              </div>
            </>
          )}

          {mode !== 'update_password' && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Имейл</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={INPUT_AUTH}
                    placeholder="name@example.com"
                    />
                </div>
            </div>
          )}

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Парола</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={INPUT_AUTH}
                    placeholder="••••••••"
                    />
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
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

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col gap-3 text-center text-sm">
          {mode === 'login' && (
            <>
              <p className="text-gray-500">
                Нямате акаунт?{' '}
                <button onClick={() => setMode('register')} className="text-indigo-500 font-bold hover:underline">
                  Регистрация
                </button>
              </p>
              <button onClick={() => setMode('forgot_password')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">
                Забравена парола?
              </button>
            </>
          )}

          {mode === 'register' && (
            <p className="text-gray-500">
              Имате акаунт?{' '}
              <button onClick={() => setMode('login')} className="text-indigo-500 font-bold hover:underline">
                Вход
              </button>
            </p>
          )}

          {(mode === 'forgot_password' || mode === 'update_password') && (
            <button onClick={() => setMode('login')} className="text-indigo-500 font-bold hover:underline">
              Назад към вход
            </button>
          )}
        </div>
      </div>
    </div>
  );
};