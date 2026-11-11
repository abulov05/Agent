import { X, Bell, Shield, Info, CheckCircle2 } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const notifs = [
    {
      id: 1,
      title: "🚀 Обновление индекса 2026.11",
      message: "Добавлено 1.2M новых сообщений из закрытых чатов разработчиков и IT-сообществ.",
      time: "2 часа назад",
      type: "update",
    },
    {
      id: 2,
      title: "⭐ Подписка активна",
      message: "Ваш тариф AGENT PRO продлен на 30 дней. Все лимиты на поиск сняты.",
      time: "Вчера в 18:30",
      type: "success",
    },
    {
      id: 3,
      title: "🔒 Безопасность сессии",
      message: "Успешный вход в мини-приложение через Telegram WebApp протокол.",
      time: "3 дня назад",
      type: "security",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Центр уведомлений</h3>
              <p className="text-xs text-slate-400">События аккаунта и обновления баз данных</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {notifs.map((n) => (
            <div
              key={n.id}
              className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{n.title}</span>
                <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
