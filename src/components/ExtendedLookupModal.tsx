import { useState } from 'react';
import { X, Search, Database, Copy, Check, ShieldCheck, UserCheck, Phone, Mail, MapPin, CreditCard, Calendar } from 'lucide-react';
import { searchExtended } from '../services/api';

interface ExtendedLookupModalProps {
  onClose: () => void;
  userId: number;
  initialQuery?: string;
  title?: string;
}

export function ExtendedLookupModal({ onClose, userId, initialQuery = '', title = 'Полный пробив по базам' }: ExtendedLookupModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setLoading(true);
    try {
      const data = await searchExtended(userId, query.trim());
      setResults(data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getIconForField = (field: string) => {
    const f = field.toLowerCase();
    if (f.includes('фио') || f.includes('имя')) return <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />;
    if (f.includes('телефон') || f.includes('тел')) return <Phone className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (f.includes('email') || f.includes('почт')) return <Mail className="w-4 h-4 text-amber-400 shrink-0" />;
    if (f.includes('адрес') || f.includes('город')) return <MapPin className="w-4 h-4 text-rose-400 shrink-0" />;
    if (f.includes('карт') || f.includes('банк')) return <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />;
    if (f.includes('рожд') || f.includes('дата') || f.includes('др')) return <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />;
    return <Database className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const copyRecord = (item: any, idx: number) => {
    const text = Object.entries(item)
      .filter(([k]) => k !== 'database')
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">Поиск по закрытым утечкам, СДЭК, операторам и государственным реестрам</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ФИО, номер телефона, паспорт, email или ИНН..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 focus:border-rose-500/50 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Пробиваем...' : 'Пробить'}</span>
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Сборка досье и сопоставление по таблицам утечек...</p>
            </div>
          ) : results === null ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Введите данные цели для начала всестороннего анализа
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-semibold text-slate-300">По данному запросу записей не найдено</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Найдено записей: {results.length}
                </span>
              </div>

              <div className="space-y-4">
                {results.map((rec, idx) => {
                  const dbName = rec.database || `База данных #${idx + 1}`;
                  const mainName = rec['ФИО'] || rec['ИМЯ'] || `Запись #${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all shadow-md"
                    >
                      {/* Top Header of Record */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border-b border-slate-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{mainName}</h4>
                            <span className="text-[11px] text-slate-400 block truncate">{dbName}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => copyRecord(rec, idx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors shrink-0"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIdx === idx ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>

                      {/* Fields Table */}
                      <div className="p-3.5 space-y-2 text-xs">
                        {Object.entries(rec)
                          .filter(([k]) => k !== 'database')
                          .map(([key, val]: any) => (
                            <div
                              key={key}
                              className="flex items-start gap-2.5 py-1.5 border-b border-slate-800/60 last:border-0"
                            >
                              <div className="mt-0.5">{getIconForField(key)}</div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
                                  {key}
                                </span>
                                <span className="text-xs font-medium text-slate-200 break-words">
                                  {String(val)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
