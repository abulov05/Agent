import { useState, useEffect } from 'react';
import { TelegramUser, UserStats } from '../types';
import { fetchUserAvatar } from '../services/api';
import {
  Search,
  MessageSquare,
  Shield,
  Phone,
  Camera,
  Layers,
  Globe,
  Scan,
  Bot,
  Star,
  Key,
  Clock,
  Eye,
  Trash2,
  Info,
  Crown,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap,
  Download,
} from 'lucide-react';

interface DashboardViewProps {
  user: TelegramUser | null;
  userStats: UserStats | null;
  requestsLeft: number;
  dailyLimit: number;
  isAdminUser: boolean;
  onOpenSearch: (type: string, initialQuery?: string) => void;
  onOpenProfile: (userId: number) => void;
}

export function DashboardView({
  user,
  userStats,
  requestsLeft,
  dailyLimit,
  isAdminUser,
  onOpenSearch,
  onOpenProfile,
}: DashboardViewProps) {
  const [globalQuery, setGlobalQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.photo_url || null);

  useEffect(() => {
    if (user?.id) {
      if (user.photo_url) {
        setAvatarUrl(user.photo_url);
      }
      fetchUserAvatar(user.id)
        .then((url) => {
          if (url) setAvatarUrl(url);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleGlobalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalQuery.trim();
    if (!q) return;

    // Smart query routing
    if (/^\+?\d{10,15}$/.test(q.replace(/\s|-/g, ''))) {
      onOpenSearch('phone-check', q);
    } else if (/^\d{6,12}$/.test(q)) {
      onOpenProfile(parseInt(q));
    } else if (q.startsWith('@')) {
      onOpenSearch('tg-search', q);
    } else if (q.toLowerCase().includes('http') || q.length < 25) {
      onOpenSearch('extended', q);
    } else {
      onOpenSearch('comments', q);
    }
  };

  const hasSubscription = userStats?.has_subscription || isAdminUser;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* User Identity & Avatar Card */}
      {user && (
        <div
          onClick={() => onOpenProfile(user.id)}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition-all group shadow-md"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-400/40 group-hover:border-cyan-400/80 shadow-md shadow-cyan-500/10 shrink-0 transition-all">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.first_name}
                  onError={() => setAvatarUrl(null)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center font-extrabold text-white text-base">
                  {user.first_name?.[0] || 'U'}
                </div>
              )}
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                  {user.first_name} {user.last_name || ''}
                </span>
                {isAdminUser && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono block truncate">
                {user.username ? `@${user.username}` : `ID: ${user.id}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-cyan-300 shrink-0">
            <span className="hidden sm:inline">Досье</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Admin quick bar if admin */}
      {isAdminUser && (
        <button
          onClick={() => onOpenSearch('admin')}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between text-left transition-all hover:border-amber-500/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 block">ПАНЕЛЬ АДМИНИСТРАТОРА</span>
              <span className="text-[11px] text-slate-400">Управление пользователями, начисление алмазов</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      )}

      {/* Quota & Subscription Status Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">Суточный лимит запросов</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-slate-100">
              {hasSubscription ? 'Безлимит ⭐' : `${requestsLeft} из ${dailyLimit}`}
            </span>
            {hasSubscription ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                PRO АКТИВЕН
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Обновление в 00:00</span>
            )}
          </div>
        </div>

        <button
          onClick={() => onOpenSearch('subscription')}
          className="py-2 px-3.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white text-xs font-semibold border border-purple-500/30 transition-all flex items-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5" />
          <span>Тарифы</span>
        </button>
      </div>

      {/* Download & Install Banner */}
      <button
        onClick={() => onOpenSearch('download')}
        className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all group shadow-lg shadow-cyan-950/20 active:scale-98"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 block">
                СКАЧАТЬ ИЛИ УСТАНОВИТЬ
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                PWA / iOS / ZIP
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Установка на телефон, запуск в Telegram-боте или скачивание архива проекта
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold">
          <span className="hidden sm:inline">Открыть</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* Global OSINT Search Bar */}
      <form onSubmit={handleGlobalSubmit} className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={globalQuery}
          onChange={(e) => setGlobalQuery(e.target.value)}
          placeholder="Умный поиск: телефон, @username, ID или ФИО..."
          className="w-full pl-11 pr-24 py-3.5 bg-slate-900 border border-slate-800 focus:border-blue-500/60 rounded-2xl text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors shadow-lg shadow-black/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1"
        >
          <span>Найти</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </form>

      {/* Primary Highlight: Deep Message Keyword Search */}
      <div
        onClick={() => onOpenSearch('comments')}
        className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-rose-950/20 to-slate-900 border border-amber-500/25 hover:border-amber-500/50 cursor-pointer transition-all shadow-xl shadow-amber-950/10 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Поиск по ключевым словам в чатах
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  7.4M сообщений
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Поиск упоминаний, контактов, сделок и обсуждений по всей базе комментариев
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </div>
      </div>

      {/* Category: Базы данных & Пробив */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Базы данных и персональный пробив
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onOpenSearch('extended')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Полный пробив</span>
              <span className="text-[11px] text-slate-400">ФИО, ДР, паспорт, авто</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('name-phone')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">ФИО по номеру</span>
              <span className="text-[11px] text-slate-400">Владелец и договоры</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('base-check')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Чекер по базам</span>
              <span className="text-[11px] text-slate-400">Присутствие в утечках</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('phone-check')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Проверка номера</span>
              <span className="text-[11px] text-slate-400">HLR, оператор и карта</span>
            </div>
          </button>
        </div>
      </div>

      {/* Category: Социальные сети & Биометрия */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Социальные сети и Биометрия
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onOpenSearch('face-scan')}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 hover:border-cyan-500/40 border border-cyan-500/20 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-200 block">Поиск лица (HUD)</span>
              <span className="text-[11px] text-slate-400">AI-сканер черт лица</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('instagram')}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 to-slate-900 hover:border-rose-500/40 border border-rose-500/20 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-200 block">OSINT Instagram</span>
              <span className="text-[11px] text-slate-400">Профиль, фото, связи</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('vk-search')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <span className="font-bold text-xs">VK</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Поиск ВКонтакте</span>
              <span className="text-[11px] text-slate-400">ID, группы, друзья</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('username-check')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Чекер @username</span>
              <span className="text-[11px] text-slate-400">8+ платформ</span>
            </div>
          </button>
        </div>
      </div>

      {/* Category: Инструменты и Сервисы */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Инструменты и безопасность
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onOpenSearch('ai-assistant')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[105px]"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Марыям AI</span>
              <span className="text-[11px] text-slate-400">Голосовой ассистент</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('api-tokens')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[105px]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">API Токены</span>
              <span className="text-[11px] text-slate-400">Ключи для интеграций</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('history')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[105px]"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">История поисков</span>
              <span className="text-[11px] text-slate-400">Журнал 30 дней</span>
            </div>
          </button>

          <button
            onClick={() => onOpenSearch('tracking')}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 group flex flex-col justify-between min-h-[105px]"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Отслеживание</span>
              <span className="text-[11px] text-slate-400">Мониторинг смены данных</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer System List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800">
        <div
          onClick={() => onOpenSearch('about')}
          className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">О проекте и правила сервиса</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => onOpenSearch('delete-data')}
          className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-rose-400">Удалить мои данные из базы</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">200 💎</span>
        </div>
      </div>
    </div>
  );
}
