import { useState } from 'react';
import { X, Search, Database, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { checkLeakDatabases } from '../services/api';

interface BaseCheckerModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export function BaseCheckerModal({ onClose, initialQuery = '' }: BaseCheckerModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await checkLeakDatabases(query.trim());
      setStats(res.stats);
    } catch (e) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const totalHits = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;
  const maxHit = stats ? Math.max(...Object.values(stats), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Чекер присутствия в базах</h3>
              <p className="text-xs text-slate-400">Проверка наличия совпадений по коллекциям утечек</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleCheck} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Телефон, email, ФИО, логин или паспорт..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 focus:border-purple-500/50 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Проверка...' : 'Проверить'}</span>
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Сопоставление с индексами баз данных...</p>
            </div>
          ) : stats === null ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Введите идентификатор для проверки распределения по базам
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Всего совпадений в базах</span>
                  <span className="text-xl font-bold font-mono text-purple-300">
                    {totalHits} записей
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                  {Object.keys(stats).length} баз
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2.5">
                {Object.entries(stats).map(([dbName, count]) => {
                  const pct = Math.round((count / maxHit) * 100);
                  return (
                    <div
                      key={dbName}
                      className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 truncate">{dbName}</span>
                        <span className="font-mono font-bold text-purple-400 ml-2">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
