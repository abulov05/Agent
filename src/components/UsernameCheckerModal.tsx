import { useState } from 'react';
import { X, Search, Globe, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { checkUsernamePlatforms } from '../services/api';

interface UsernameCheckerModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export function UsernameCheckerModal({ onClose, initialQuery = '' }: UsernameCheckerModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ name: string; url: string; exists: boolean }[] | null>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.replace('@', '').trim();
    if (!clean) return;

    setLoading(true);
    try {
      const data = await checkUsernamePlatforms(clean);
      setResults(data);
    } catch (e) {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Проверка @username</h3>
              <p className="text-xs text-slate-400">Кросс-платформенная проверка занятости в 8+ сервисах</p>
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
                placeholder="Username без знака @ (например: durov, abulov_m)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 focus:border-emerald-500/50 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Проверка...' : 'Проверить'}</span>
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Опрос платформ по протоколам HEAD/GET...</p>
            </div>
          ) : results === null ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Введите имя пользователя для сканирования социальных платформ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-200 block truncate">{r.name}</span>
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        r.exists ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {r.exists ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-rose-400" />
                          <span>Занят (найден)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-emerald-400" />
                          <span>Свободен</span>
                        </>
                      )}
                    </span>
                  </div>

                  {r.exists && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Открыть профиль"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
