import { useState } from 'react';
import { TelegramUser } from '../types';
import { DEMO_USER, setStoredUser } from '../services/api';
import { ShieldCheck, Send, KeyRound, ArrowRight, UserCheck, Sparkles, ExternalLink } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: TelegramUser) => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Введите Telegram ID или @username');
      return;
    }
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 600);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      setError('Введите проверочный код');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user: TelegramUser = {
        id: parseInt(identifier.replace(/\D/g, '')) || 710278988,
        first_name: identifier.startsWith('@') ? identifier.slice(1) : "Пользователь",
        username: identifier.startsWith('@') ? identifier.slice(1) : undefined,
      };
      setStoredUser(user);
      onSuccess(user);
    }, 600);
  };

  const handleQuickDemo = () => {
    setStoredUser(DEMO_USER);
    onSuccess(DEMO_USER);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-600/25 border border-white/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">AGENT ANALYTICS</h1>
          <p className="text-xs text-slate-400">
            Профессиональная система OSINT-анализа и разведки в Telegram
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleGetCode} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Telegram ID или @username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Например: 710278988 или @username"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Узнать свой ID можно в боте{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  @userinfobot
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Отправка...' : 'Получить код подтверждения'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://t.me/dev1_robot"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Открыть бота @dev1_robot</span>
            </a>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Код подтверждения из Telegram
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl text-lg font-mono text-center tracking-[8px] text-blue-400 outline-none transition-colors"
                autoFocus
              />
              <span className="text-[11px] text-slate-500 block mt-1 text-center">
                Код отправлен в чат с ботом. Действует 5 минут.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Проверка...' : 'Войти в систему'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Назад к вводу ID
            </button>
          </form>
        )}

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-blue-900/40 hover:from-indigo-900/60 hover:to-blue-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Быстрый демо-вход (Мехроб Абулов)</span>
          </button>
          <p className="text-[11px] text-slate-500">
            Мгновенный доступ для тестирования без необходимости авторизации через Telegram
          </p>
        </div>
      </div>
    </div>
  );
}
