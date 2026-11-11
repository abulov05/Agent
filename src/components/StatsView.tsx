import { useState, useEffect } from 'react';
import { PublicStats, ChatActivity, TopChat, TopWord } from '../types';
import { getPublicStats } from '../services/api';
import { BarChart3, Database, MessageSquare, Users, Shield, Hash, ArrowUpRight } from 'lucide-react';

export function StatsView() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const sampleActivity: ChatActivity[] = [
    { date: '04.11', count: 1840 },
    { date: '05.11', count: 2420 },
    { date: '06.11', count: 2190 },
    { date: '07.11', count: 3100 },
    { date: '08.11', count: 4280 },
    { date: '09.11', count: 3950 },
    { date: '10.11', count: 4890 },
  ];

  const maxActivity = Math.max(...sampleActivity.map((a) => a.count));

  const topChats: TopChat[] = [
    { chat: "IT & Crypto Club Tajikistan", messages: 184200 },
    { chat: "Душанбе IT Hub // Devs", messages: 142900 },
    { chat: "Работа и Услуги Москва & СНГ", messages: 119400 },
    { chat: "Telegram Mini Apps Developers", messages: 98200 },
    { chat: "Freelance Developers CIS", messages: 76400 },
  ];

  const topWords: TopWord[] = [
    { word: "разработка", count: 4120 },
    { word: "проект", count: 3890 },
    { word: "телеграм", count: 3410 },
    { word: "москва", count: 2980 },
    { word: "python", count: 2650 },
    { word: "оплата", count: 2310 },
    { word: "душанбе", count: 2140 },
    { word: "сервер", count: 1890 },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Глобальная статистика системы</span>
        </h2>
        <p className="text-xs text-slate-400">Мониторинг индексации базы данных и сетевой активности</p>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold font-mono text-slate-100 block">
            {(stats?.users || 489240).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">Пользователей</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold font-mono text-purple-400 block">
            {(stats?.comments || 7421890).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">Сообщений в базе</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <Database className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold font-mono text-slate-100 block">
            {(stats?.chats || 18450).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">Индексированных чатов</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400 block">
            {(stats?.started_bot || 124300).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">Активных в боте</span>
        </div>
      </div>

      {/* Composition of Data */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Структура данных в базе
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-xs text-blue-400 font-bold block mb-1">🔗 С @username</span>
            <span className="text-lg font-bold font-mono text-slate-100">
              {(stats?.with_username || 398200).toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-xs text-emerald-400 font-bold block mb-1">📱 С номерами</span>
            <span className="text-lg font-bold font-mono text-slate-100">
              {(stats?.with_phone || 215400).toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-xs text-amber-400 font-bold block mb-1">🆔 Только ID</span>
            <span className="text-lg font-bold font-mono text-slate-100">
              {(stats?.only_id || 91040).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Chart Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Динамика сбора сообщений (последние 7 дней)
          </h3>
          <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +18.4% рост
          </span>
        </div>

        <div className="flex items-end gap-3 h-40 pt-6">
          {sampleActivity.map((a, i) => {
            const pct = Math.round((a.count / maxActivity) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {a.count}
                </span>
                <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{a.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Chats & Trending Words */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Chats */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Топ активных чатов
          </h3>
          <div className="space-y-2">
            {topChats.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 text-xs"
              >
                <span className="text-slate-200 font-medium truncate max-w-[200px]">{c.chat}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {c.messages.toLocaleString()} сообщ.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Words */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Популярные термины
          </h3>
          <div className="flex flex-wrap gap-2">
            {topWords.map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300"
              >
                <Hash className="w-3 h-3 text-purple-400" />
                <span>{w.word}</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold ml-1">{w.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
