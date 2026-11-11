import { useState } from 'react';
import { X, ShieldAlert, Gift, PlusCircle, Check } from 'lucide-react';

interface AdminModalProps {
  onClose: () => void;
  onRefreshStats?: () => void;
}

export function AdminModal({ onClose, onRefreshStats }: AdminModalProps) {
  const [targetId, setTargetId] = useState('');
  const [diamondsAmount, setDiamondsAmount] = useState('100');
  const [subDays, setSubDays] = useState('30');
  const [status, setStatus] = useState<string | null>(null);

  const handleAddDiamonds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    setStatus(`✅ Начислено ${diamondsAmount} алмазов пользователю ${targetId}`);
    setTimeout(() => setStatus(null), 3000);
  };

  const handleGiftSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    setStatus(`⭐ Подписка на ${subDays} дней успешно выдана пользователю ${targetId}`);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Панель управления (Admin)</h3>
              <p className="text-xs text-slate-400">Ручное начисление баланса и подарков</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {status && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium">
              {status}
            </div>
          )}

          {/* Form: Add Diamonds */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Пополнить баланс алмазов</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Telegram ID пользователя</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="Например: 710278988"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Количество алмазов</label>
                <input
                  type="number"
                  value={diamondsAmount}
                  onChange={(e) => setDiamondsAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-mono"
                />
              </div>
              <button
                onClick={handleAddDiamonds}
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Начислить алмазы
              </button>
            </div>
          </div>

          {/* Form: Gift Sub */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-400" />
              <span>Подарить подписку PRO</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Дней подписки</label>
                <input
                  type="number"
                  value={subDays}
                  onChange={(e) => setSubDays(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-mono"
                />
              </div>
              <button
                onClick={handleGiftSub}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Подарить подписку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
