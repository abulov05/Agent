import { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DeleteDataModalProps {
  onClose: () => void;
  userDiamonds?: number;
}

export function DeleteDataModal({ onClose, userDiamonds = 180 }: DeleteDataModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = () => {
    if (!agreed) return;
    setDeleted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Удаление данных из базы</h3>
              <p className="text-xs text-slate-400">Полная очистка персонального профиля</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {deleted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h4 className="text-sm font-bold text-slate-100">Запрос на удаление принят</h4>
              <p className="text-slate-400">Все связанные сообщения и история имён исключены из выдачи.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-rose-300">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Внимание! Необратимая операция</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Удаление приведет к полной очистке ваших сообщений, истории смены имён и юзернеймов из всех публичных индексов AGENT ANALYTICS.
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
                <span>Стоимость удаления:</span>
                <span className="font-bold font-mono text-amber-400">200 Алмазов</span>
              </div>

              <label className="flex items-start gap-2.5 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-400">
                  Я понимаю, что операция необратима и баланс алмазов будет списан
                </span>
              </label>

              <button
                onClick={handleDelete}
                disabled={!agreed}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold transition-all shadow-lg shadow-rose-600/20"
              >
                Удалить данные (200 💎)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
