import { useState } from 'react';
import { X, Eye, Plus, Trash2, ShieldCheck, User } from 'lucide-react';

interface TrackingModalProps {
  onClose: () => void;
  userDiamonds?: number;
}

export function TrackingModal({ onClose, userDiamonds = 180 }: TrackingModalProps) {
  const [trackList, setTrackList] = useState<any[]>([
    { target_user_id: 189445201, name: 'Алексей Смирнов', end_date: '2026-11-24' },
    { target_user_id: 923847120, name: 'Рустам Каримов', end_date: '2026-11-20' },
  ]);
  const [newTargetId, setNewTargetId] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetId) return;

    const newItem = {
      target_user_id: parseInt(newTargetId) || 710278988,
      name: `Объект ${newTargetId}`,
      end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    };

    setTrackList([newItem, ...trackList]);
    setNewTargetId('');
  };

  const handleRemove = (id: number) => {
    setTrackList(trackList.filter((t) => t.target_user_id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Мониторинг целей (Tracking)</h3>
              <p className="text-xs text-slate-400">Уведомления о смене имени, юзернейма и активности</p>
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
          {/* Rate card */}
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Стоимость трекинга</span>
              <span className="text-sm font-bold text-purple-300">20 алмазов / 7 дней</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Ваш баланс:</span>
              <span className="text-sm font-bold font-mono text-amber-400">💎 {userDiamonds}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newTargetId}
              onChange={(e) => setNewTargetId(e.target.value)}
              placeholder="Telegram ID цели (например: 12345678)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!newTargetId}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold shrink-0"
            >
              Активировать
            </button>
          </form>

          {/* Tracked items list */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Наблюдаемые цели ({trackList.length})
            </h4>

            {trackList.length === 0 ? (
              <div className="p-6 text-center text-slate-500">Нет активных целей на отслеживании</div>
            ) : (
              trackList.map((item) => (
                <div
                  key={item.target_user_id}
                  className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">{item.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {item.target_user_id} • до {item.end_date}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.target_user_id)}
                    className="p-2 text-slate-500 hover:text-rose-400"
                    title="Снять с наблюдения"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
