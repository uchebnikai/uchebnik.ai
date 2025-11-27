import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        });
        if (error) throw error;
        setSuccessMsg('Регистрацията е успешна! Проверете имейла си за линк за потвърждение.');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
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

  // Check for password recovery hash in URL
  React.useEffect(() => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
          setMode('update_password');
      }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-[32px] border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500 relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4">
                <Sparkles size={32} fill="currentColor" />
            </div>
          <h1 className="text-3xl font-bold text-center tracking-tight text-foreground font-display">
             uchebnik.ai
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

        <form onSubmit={handleAuth} className="space-y-4">
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
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
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
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
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