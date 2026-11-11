import { useState, useEffect } from 'react';
import { TelegramUser, UserStats, PhoneCheckResult } from './types';
import {
  getStoredUser,
  setStoredUser,
  getUserStats,
  getDailyUsage,
  recordUsage,
  isAdmin,
  DEMO_USER,
  CONFIG,
  checkPhoneInfo,
} from './services/api';

// Components
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import { StatsView } from './components/StatsView';
import { AiAssistantView } from './components/AiAssistantView';

// Modals
import { PhoneMapModal } from './components/PhoneMapModal';
import { FaceScannerModal } from './components/FaceScannerModal';
import { CommentsSearchModal } from './components/CommentsSearchModal';
import { ExtendedLookupModal } from './components/ExtendedLookupModal';
import { InstagramModal } from './components/InstagramModal';
import { BaseCheckerModal } from './components/BaseCheckerModal';
import { UsernameCheckerModal } from './components/UsernameCheckerModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ApiTokensModal } from './components/ApiTokensModal';
import { SearchHistoryModal } from './components/SearchHistoryModal';
import { AboutModal } from './components/AboutModal';
import { AdminModal } from './components/AdminModal';
import { TrackingModal } from './components/TrackingModal';
import { DeleteDataModal } from './components/DeleteDataModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DownloadModal } from './components/DownloadModal';

// Icons
import {
  Home,
  Search,
  BarChart3,
  User,
  Bot,
  Bell,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  ShieldCheck,
  Download,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<TelegramUser | null>(() => getStoredUser() || DEMO_USER);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState(() => getDailyUsage());
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'stats' | 'ai' | 'me'>('home');
  const [inspectedUserId, setInspectedUserId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('aa_theme') !== 'light';
  });

  // Modal Controllers
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalParam, setModalParam] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aa_theme', 'light');
    }
  }, [isDark]);

  // Load User Stats
  useEffect(() => {
    if (user?.id) {
      getUserStats(user.id).then(setUserStats).catch(() => {});
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenSearchModal = async (type: string, query?: string) => {
    // Record request quota
    if (!isAdmin(user) && !userStats?.has_subscription) {
      if (dailyUsage.used >= CONFIG.DAILY_LIMIT) {
        setActiveModal('subscription');
        showToast("⚠️ Суточный лимит исчерпан. Оформите подписку PRO!");
        return;
      }
      recordUsage();
      setDailyUsage(getDailyUsage());
    }

    if (type === 'phone-check') {
      const q = query || '+79939999985';
      showToast(`Проверка номера ${q}...`);
      try {
        const info = await checkPhoneInfo(q);
        setModalParam(info);
        setActiveModal('phone-map');
      } catch (e) {
        showToast("Ошибка проверки номера");
      }
      return;
    }

    setModalParam(query || '');
    setActiveModal(type);
  };

  const handleOpenProfile = (uid: number) => {
    setInspectedUserId(uid);
    setCurrentTab('me');
  };

  const handleLogout = () => {
    setStoredUser(null);
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onSuccess={(u) => setUser(u)} />;
  }

  const isAdminUser = isAdmin(user);
  const requestsLeft = Math.max(0, CONFIG.DAILY_LIMIT - dailyUsage.used);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200 ${!isDark ? 'light-mode bg-slate-50 text-slate-900' : ''}`}>
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => {
              setInspectedUserId(null);
              setCurrentTab('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
              <div className="absolute inset-0 rounded-xl border border-white/30 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-extrabold tracking-tight text-slate-100 block leading-tight">
                AGENT ANALYTICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                INTELLIGENCE SUITE
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Download / Install App */}
            <button
              onClick={() => setActiveModal('download')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Скачать и установить приложение"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Скачать</span>
            </button>

            {/* Balance Pill */}
            <button
              onClick={() => setActiveModal('subscription')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold transition-colors"
            >
              <span>💎</span>
              <span className="font-mono text-amber-400">{userStats?.diamonds || 180}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setActiveModal('notifications')}
              className="relative w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
              title="Уведомления"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
              title="Переключить тему"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'home' && (
          <DashboardView
            user={user}
            userStats={userStats}
            requestsLeft={requestsLeft}
            dailyLimit={CONFIG.DAILY_LIMIT}
            isAdminUser={isAdminUser}
            onOpenSearch={handleOpenSearchModal}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'search' && (
          <DashboardView
            user={user}
            userStats={userStats}
            requestsLeft={requestsLeft}
            dailyLimit={CONFIG.DAILY_LIMIT}
            isAdminUser={isAdminUser}
            onOpenSearch={handleOpenSearchModal}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'stats' && <StatsView />}

        {currentTab === 'ai' && <AiAssistantView />}

        {currentTab === 'me' && (
          <ProfileView
            userId={inspectedUserId || user.id}
            onBack={() => {
              setInspectedUserId(null);
              setCurrentTab('home');
            }}
            isCurrentUser={inspectedUserId === null || inspectedUserId === user.id}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (Thumb-Zone Contract) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-1.5">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center">
          <button
            onClick={() => {
              setInspectedUserId(null);
              setCurrentTab('home');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              currentTab === 'home' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Главная</span>
          </button>

          <button
            onClick={() => {
              handleOpenSearchModal('comments');
            }}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Поиск</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              currentTab === 'ai' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Марыям</span>
          </button>

          <button
            onClick={() => setCurrentTab('stats')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              currentTab === 'stats' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Статистика</span>
          </button>

          <button
            onClick={() => {
              setInspectedUserId(null);
              setCurrentTab('me');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              currentTab === 'me' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Досье</span>
          </button>
        </div>
      </nav>

      {/* Interactive Modals */}
      {activeModal === 'phone-map' && modalParam && (
        <PhoneMapModal
          info={modalParam as PhoneCheckResult}
          onClose={() => setActiveModal(null)}
          isDark={isDark}
        />
      )}

      {activeModal === 'face-scan' && (
        <FaceScannerModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'comments' && (
        <CommentsSearchModal
          userId={user.id}
          initialQuery={typeof modalParam === 'string' ? modalParam : ''}
          onClose={() => setActiveModal(null)}
          onSelectUser={(uid) => {
            setActiveModal(null);
            handleOpenProfile(uid);
          }}
        />
      )}

      {(activeModal === 'extended' || activeModal === 'name-phone' || activeModal === 'tg-search' || activeModal === 'vk-search') && (
        <ExtendedLookupModal
          userId={user.id}
          initialQuery={typeof modalParam === 'string' ? modalParam : ''}
          title={
            activeModal === 'name-phone'
              ? 'Поиск владельца по номеру'
              : activeModal === 'vk-search'
              ? 'Поиск профилей ВКонтакте'
              : activeModal === 'tg-search'
              ? 'Поиск в Telegram'
              : 'Полный пробив по базам'
          }
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'instagram' && (
        <InstagramModal
          initialQuery={typeof modalParam === 'string' ? modalParam : ''}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'base-check' && (
        <BaseCheckerModal
          initialQuery={typeof modalParam === 'string' ? modalParam : ''}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'username-check' && (
        <UsernameCheckerModal
          initialQuery={typeof modalParam === 'string' ? modalParam : ''}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'subscription' && (
        <SubscriptionModal
          onClose={() => setActiveModal(null)}
          userDiamonds={userStats?.diamonds}
        />
      )}

      {activeModal === 'api-tokens' && (
        <ApiTokensModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'history' && (
        <SearchHistoryModal
          onClose={() => setActiveModal(null)}
          onSelectQuery={(q, type) => {
            handleOpenSearchModal(type, q);
          }}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'admin' && (
        <AdminModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'tracking' && (
        <TrackingModal
          onClose={() => setActiveModal(null)}
          userDiamonds={userStats?.diamonds}
        />
      )}

      {activeModal === 'delete-data' && (
        <DeleteDataModal
          onClose={() => setActiveModal(null)}
          userDiamonds={userStats?.diamonds}
        />
      )}

      {activeModal === 'notifications' && (
        <NotificationsModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'download' && (
        <DownloadModal onClose={() => setActiveModal(null)} />
      )}

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
