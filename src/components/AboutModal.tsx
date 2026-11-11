import { X, Bot, Shield, CheckCircle2, Star, Send } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">О проекте AGENT ANALYTICS</h3>
              <p className="text-xs text-slate-400">Интеллектуальная система OSINT и мониторинга Telegram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Main Description */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Назначение платформы</span>
            </h4>
            <p>
              AGENT ANALYTICS — это многофункциональный комплекс для <b>деанонимизации, поиска по открытым базам данных и защиты сообществ</b>. 
              Система индексирует открытые источники в режиме реального времени, сопоставляя номера телефонов, никнеймы, цифровые следы и историю активности.
            </p>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ключевой функционал
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                '🔍 Поиск по ID, @username и номерам',
                '📊 Интерактивные HTML-досье цели',
                '📱 Определение оператора и HLR-статуса',
                '📸 Биометрический поиск лица (AI HUD)',
                '🧠 ИИ-аналитик личности «Марыям»',
                '🛡 Автомодерация спама в группах',
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diamonds & Rates */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/20 to-purple-950/20 border border-amber-500/20 space-y-1.5">
            <span className="font-bold text-amber-300 block">💎 Внутренняя валюта — Алмазы</span>
            <p className="text-slate-400">
              • 150 алмазов = 1 USD<br />
              • Пополнение: CryptoBot, OxaPay, карты СНГ<br />
              • Ежедневный бонус: +10 алмазов в боте
            </p>
          </div>

          {/* Official Contacts & Links */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Официальные контакты
            </h4>

            {/* Glowing Telegram Contact Cards */}
            <a
              href="https://t.me/amorfatti00"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">Амор Фатти</span>
                  <span className="text-[11px] text-white/80 font-mono">@amorfatti00 • Администратор</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/20">Связаться</span>
            </a>

            <a
              href="https://t.me/Agent_analytics"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-lg shadow-purple-600/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">AGENT ANALYTICS Channel</span>
                  <span className="text-[11px] text-white/80 font-mono">@Agent_analytics • Официальный канал</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/20">Подписаться</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
