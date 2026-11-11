import { useState, useEffect } from 'react';
import {
  UserProfileData,
  UserStats,
  CommentMessage,
} from '../types';
import {
  getUserProfile,
  getUserStats,
  translateText,
  fetchUserAvatar,
  getStoredUser,
} from '../services/api';
import {
  Brain,
  Smile,
  Globe,
  Users,
  BarChart3,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Lock,
  Calendar,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Languages,
  X,
} from 'lucide-react';

interface ProfileViewProps {
  userId: number;
  onBack: () => void;
  isCurrentUser?: boolean;
}

export function ProfileView({ userId, onBack, isCurrentUser }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'chats' | 'friends' | 'words' | 'history'>('messages');

  // AI Modal States
  const [aiModal, setAiModal] = useState<'summary' | 'sentiment' | 'language' | 'similar' | 'activity' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryLang, setSummaryLang] = useState<'ru' | 'tj' | 'en'>('ru');
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData, avatarBlob] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId),
        fetchUserAvatar(userId),
      ]);
      setProfile(pData);
      setStats(sData);

      const stored = getStoredUser();
      const directPhoto =
        stored?.id === userId && stored?.photo_url
          ? stored.photo_url
          : pData?.avatar_url || pData?.photo_url || null;

      setAvatarUrl(avatarBlob || directPhoto);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateMessage = async (msgId: string, text: string, lang: 'ru' | 'tj' | 'en') => {
    setTranslatingMsgId(msgId);
    try {
      const res = await translateText(text, lang);
      setTranslatedMessages((prev) => ({ ...prev, [msgId]: res }));
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(String(userId));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Формирование цифрового досье профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-300">Профиль не найден</p>
        <button
          onClick={onBack}
          className="text-xs text-blue-400 hover:underline"
        >
          ← Вернуться назад
        </button>
      </div>
    );
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || `User ${profile.user_id}`;
  const initials = fullName.charAt(0).toUpperCase() || '?';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={copyId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>ID: {profile.user_id}</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-900 border border-slate-800 p-6 shadow-xl text-center">
        {/* Radar background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-4 group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              onError={() => setAvatarUrl(null)}
              className="w-full h-full rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl shadow-cyan-500/20 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-2 border-white/20 shadow-xl shadow-blue-600/20 flex items-center justify-center text-3xl font-extrabold text-white">
              {initials}
            </div>
          )}
          {profile.started_bot && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold" title="Бот активен">
              ✓
            </div>
          )}
        </div>

        {/* User Titles */}
        <h2 className="text-xl font-bold text-slate-100 mb-1">{fullName}</h2>
        {profile.username && (
          <a
            href={`https://t.me/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-block mb-2"
          >
            @{profile.username}
          </a>
        )}

        {profile.phone && (
          <p className="text-xs font-mono text-emerald-400 mb-3">📱 {profile.phone}</p>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>VERIFIED TARGET DOSSIER</span>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-800/40">
            <span className="text-lg font-bold font-mono text-slate-100 block">
              {(profile.comments || []).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Сообщений</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40">
            <span className="text-lg font-bold font-mono text-slate-100 block">
              {(profile.chats || []).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Чатов</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40">
            <span className="text-lg font-bold font-mono text-slate-100 block">
              {(profile.words || []).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Слов</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence Action Matrix (6 High-End Action Buttons) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Нейросетевой анализ профиля (Марыям AI)
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setAiModal('summary')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 hover:from-purple-900/60 hover:to-blue-900/60 border border-purple-500/30 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-purple-200 block">AI Резюме</span>
              <span className="text-[10px] text-slate-400">Портрет личности</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setAiModal('sentiment')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-900/40 to-rose-900/40 hover:from-amber-900/60 hover:to-rose-900/60 border border-amber-500/30 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-amber-200 block">Психология</span>
              <span className="text-[10px] text-slate-400">Эмоциональный тон</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Smile className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setAiModal('language')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 hover:from-emerald-900/60 hover:to-teal-900/60 border border-emerald-500/30 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-emerald-200 block">Языки общения</span>
              <span className="text-[10px] text-slate-400">RU / TJ / EN</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setAiModal('similar')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/60 hover:to-indigo-900/60 border border-blue-500/30 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-blue-200 block">Похожие люди</span>
              <span className="text-[10px] text-slate-400">Общие интересы</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setAiModal('activity')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-cyan-900/40 to-sky-900/40 hover:from-cyan-900/60 hover:to-sky-900/60 border border-cyan-500/30 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-cyan-200 block">Активность 24ч</span>
              <span className="text-[10px] text-slate-400">Пиковые часы</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={loadData}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all active:scale-98 group"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block">Обновить данные</span>
              <span className="text-[10px] text-slate-400">Синхронизация</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-700/60 text-slate-300 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'messages', label: `Сообщения (${(profile.comments || []).length})` },
          { id: 'chats', label: `Чаты & Группы (${(profile.chats || []).length})` },
          { id: 'friends', label: `Знакомые (${(profile.friends || []).length})` },
          { id: 'words', label: `Частые слова (${(profile.words || []).length})` },
          { id: 'history', label: `История имён (${(profile.name_history || []).length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Messages with In-place Translation */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          {(profile.comments || []).length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">Нет зафиксированных сообщений</div>
          ) : (
            (profile.comments || []).map((msg, i) => {
              const msgId = `msg_${i}`;
              const translated = translatedMessages[msgId];
              const isPrivate = msg.link?.includes('/c/');

              return (
                <div
                  key={i}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-400 truncate max-w-[240px]">
                      📌 {msg.chat || 'Группа / Чат'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {(msg.date || '').slice(0, 16)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    {msg.text}
                  </p>

                  {/* Translated Box */}
                  {translated && (
                    <div className="text-xs text-emerald-300 bg-emerald-950/20 border-l-2 border-emerald-500 p-2.5 rounded-r-lg">
                      {translated}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 mr-1 flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        <span>Перевод:</span>
                      </span>
                      <button
                        onClick={() => handleTranslateMessage(msgId, msg.text || '', 'ru')}
                        disabled={translatingMsgId === msgId}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        🇷🇺 RU
                      </button>
                      <button
                        onClick={() => handleTranslateMessage(msgId, msg.text || '', 'tj')}
                        disabled={translatingMsgId === msgId}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        🇹🇯 TJ
                      </button>
                      <button
                        onClick={() => handleTranslateMessage(msgId, msg.text || '', 'en')}
                        disabled={translatingMsgId === msgId}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        🇬🇧 EN
                      </button>
                    </div>

                    {msg.link && !isPrivate && (
                      <a
                        href={msg.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <span>Чат</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Groups & Channels */}
      {activeTab === 'chats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(profile.chats || []).map((c, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-200 block truncate">{c.title}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {c.username ? `@${c.username}` : (c.type === 'channel' ? '📢 Канал' : '👥 Группа')}
                </span>
              </div>
              {c.username && (
                <a
                  href={`https://t.me/${c.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Friends */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(profile.friends || []).map((f, i) => (
            <div
              key={i}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                {f.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-200 block truncate">{f.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {f.username ? `@${f.username}` : `ID: ${f.id}`}
                </span>
              </div>
              {f.username && (
                <a
                  href={`https://t.me/${f.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Words Cloud */}
      {activeTab === 'words' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex flex-wrap gap-2">
            {(profile.words || []).map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs font-medium text-slate-200"
              >
                <span>{w.word}</span>
                <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.2 rounded">
                  {w.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Name History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {(profile.name_history || []).map((h, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <span className="font-semibold text-slate-200">{h.name}</span>
              <span className="text-slate-400 font-mono text-[11px]">{h.date}</span>
            </div>
          ))}

          {profile.profile_changes && profile.profile_changes.length > 0 && (
            <div className="pt-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Изменения профиля
              </h4>
              {profile.profile_changes.map((c, i) => (
                <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400">{c.field}</span>
                    <span>{c.date}</span>
                  </div>
                  <div className="text-slate-400 line-through">Старое: {c.old}</div>
                  <div className="text-emerald-400 font-medium">Новое: {c.new}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Summary Modal */}
      {aiModal === 'summary' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Brain className="w-4 h-4" />
                <span>AI-Резюме профиля от Марыям</span>
              </div>
              <button onClick={() => setAiModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
              <p>
                Пользователь <b>{fullName}</b> активно интересуется <b>IT-технологиями, разработкой ботов, OSINT и криптовалютой</b>.
                В общении демонстрирует деловой и конструктивный стиль, регулярно участвует в профессиональных дискуссиях Душанбе и Москвы.
              </p>
              <p>
                <b>Ключевые паттерны:</b>
                <br />• Регулярно привлекает специалистов в проекты
                <br />• Высокая осведомленность в сфере открытых данных и API
                <br />• Круг общения включает разработчиков, предпринимателей и системных инженеров.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSummaryLang('ru')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  summaryLang === 'ru' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                🇷🇺 Русский
              </button>
              <button
                onClick={() => setSummaryLang('tj')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  summaryLang === 'tj' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                🇹🇯 Таджикский
              </button>
              <button
                onClick={() => setSummaryLang('en')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  summaryLang === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <button
              onClick={() => setAiModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть резюме
            </button>
          </div>
        </div>
      )}

      {/* AI Sentiment Modal */}
      {aiModal === 'sentiment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Smile className="w-4 h-4" />
                <span>Эмоциональный тон и психология</span>
              </div>
              <button onClick={() => setAiModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <div className="text-4xl mb-2">😊</div>
              <h4 className="text-base font-bold text-slate-100">Преимущественно конструктивный</h4>
              <p className="text-xs text-slate-400">На основе семантического анализа 50+ сообщений</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-base font-bold text-emerald-400 font-mono block">68%</span>
                <span className="text-[10px] text-slate-400 uppercase">Позитив</span>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                <span className="text-base font-bold text-slate-300 font-mono block">28%</span>
                <span className="text-[10px] text-slate-400 uppercase">Нейтрально</span>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <span className="text-base font-bold text-rose-400 font-mono block">4%</span>
                <span className="text-[10px] text-slate-400 uppercase">Негатив</span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div style={{ width: '68%' }} className="bg-emerald-500" />
              <div style={{ width: '28%' }} className="bg-slate-400" />
              <div style={{ width: '4%' }} className="bg-rose-500" />
            </div>

            <button
              onClick={() => setAiModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* AI Activity Modal */}
      {aiModal === 'activity' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Суточный график активности</span>
              </div>
              <button onClick={() => setAiModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Пиковый час активности:</span>
                <span className="text-base font-bold text-cyan-400 font-mono">19:00 — 21:00</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block mb-0.5">Активные дни:</span>
                <span className="text-sm font-semibold text-slate-200">Среда, Суббота</span>
              </div>
            </div>

            {/* Hourly Bars Simulation */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {[
                { hour: '02:00', count: 1, pct: 5 },
                { hour: '06:00', count: 0, pct: 2 },
                { hour: '10:00', count: 8, pct: 35 },
                { hour: '12:00', count: 14, pct: 60 },
                { hour: '15:00', count: 12, pct: 50 },
                { hour: '18:00', count: 19, pct: 85 },
                { hour: '20:00', count: 24, pct: 100 },
                { hour: '22:00', count: 16, pct: 70 },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-400 w-12">{h.hour}</span>
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${h.pct}%` }}
                    />
                  </div>
                  <span className="text-slate-300 w-6 text-right">{h.count}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAiModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* AI Languages Modal */}
      {aiModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Globe className="w-4 h-4" />
                <span>Языковой профиль</span>
              </div>
              <button onClick={() => setAiModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { flag: '🇷🇺', name: 'Русский язык', pct: 64, color: 'from-blue-500 to-cyan-500' },
                { flag: '🇹🇯', name: 'Таджикский язык', pct: 28, color: 'from-emerald-500 to-teal-500' },
                { flag: '🇬🇧', name: 'English (Технический)', pct: 8, color: 'from-purple-500 to-indigo-500' },
              ].map((l, i) => (
                <div key={i} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-300">{l.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${l.color}`} style={{ width: `${l.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAiModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* AI Similar Users Modal */}
      {aiModal === 'similar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>Похожие профили по интересам</span>
              </div>
              <button onClick={() => setAiModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Парвиз Н.', un: '@parviz_dev', score: 92, topics: 'Python, FastAPI, Crypto' },
                { name: 'Шахром М.', un: '@shahrom_it', score: 84, topics: 'OSINT, Telegram Bots' },
                { name: 'Алексей С.', un: '@alex_devops', score: 78, topics: 'DevOps, Servers, Linux' },
              ].map((u, i) => (
                <div key={i} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{u.name} ({u.un})</span>
                    <span className="text-[10px] text-slate-400">{u.topics}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {u.score}%
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAiModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
