import { useState } from 'react';
import { X, Star, Check, Zap, Shield, Sparkles, ExternalLink, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionModalProps {
  onClose: () => void;
  userDiamonds?: number;
}

export function SubscriptionModal({ onClose, userDiamonds = 180 }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'1m' | '6m' | '1y'>('6m');
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  const plans = [
    {
      id: '1m',
      title: '1 Месяц',
      priceUsd: 5,
      save: null,
      features: ['Безлимитный пробив', 'Поиск по сообщениям', 'Приоритетная очередь'],
    },
    {
      id: '6m',
      title: '6 Месяцев',
      priceUsd: 20,
      save: 'Выгода 33%',
      popular: true,
      features: ['Безлимитный пробив', 'Все базы данных и соцсети', 'Приоритетный AI-анализ', 'Экспорт в HTML'],
    },
    {
      id: '1y',
      title: '1 Год',
      priceUsd: 45,
      save: 'Выгода 40%',
      features: ['Максимальный безлимит', 'Доступ ко всем базам', 'API токен на 500 запросов', 'VIP поддержка 24/7'],
    },
  ];

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaidSuccess(true);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Star className="w-5 h-5 fill-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Тарифы подписки AGENT PRO</h3>
              <p className="text-xs text-slate-400">Снятие суточных лимитов и ускоренный поиск</p>
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
        <div className="p-5 overflow-y-auto space-y-4">
          {paidSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h4 className="text-lg font-bold text-slate-100">Подписка успешно активирована!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Вам открыт полный безлимитный доступ ко всем базам данных, чекерам и ИИ-модулям Марыям.
              </p>
              <button
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Начать расследование
              </button>
            </div>
          ) : (
            <>
              {/* Plans Grid */}
              <div className="space-y-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id as any)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-950/20 border-purple-500 shadow-md shadow-purple-500/10'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p.save && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {p.save}
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-purple-400 bg-purple-500'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-bold text-slate-100">{p.title}</span>
                        </div>
                        <span className="text-base font-bold font-mono text-purple-300">
                          {p.priceUsd} USD
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-300">
                        {p.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 truncate">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment methods */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200 block">Мгновенная оплата</span>
                <p>Принимаются: CryptoBot (USDT, TON), OxaPay, банковские карты СНГ через P2P шлюз.</p>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                {paying ? (
                  <span>Формирование счета OxaPay...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Оплатить {plans.find((p) => p.id === selectedPlan)?.priceUsd} USD</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
