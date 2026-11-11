import { useState } from 'react';
import { X, Clock, Trash2, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../types';

interface SearchHistoryModalProps {
  onClose: () => void;
  onSelectQuery: (query: string, type: string) => void;
}

export function SearchHistoryModal({ onClose, onSelectQuery }: SearchHistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('aa_search_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 1,
        search_type: 'extended',
        query: '+7 993 999 99 85',
        results_count: 3,
        created_at: '2026-11-10 19:42',
      },
      {
        id: 2,
        search_type: 'comments',
        query: 'Москва разработчик',
        results_count: 14,
        created_at: '2026-11-09 14:15',
      },
      {
        id: 3,
        search_type: 'instagram',
        query: 'abulov_m',
        results_count: 1,
        created_at: '2026-11-08 10:20',
      },
      {
        id: 4,
        search_type: 'phone',
        query: '+992 90 771 8892',
        results_count: 1,
        created_at: '2026-11-06 18:02',
      },
    ];
  });

  const clearAll = () => {
    if (confirm("Удалить всю историю поисковых запросов?")) {
      setHistory([]);
      localStorage.removeItem('aa_search_history');
    }
  };

  const deleteItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('aa_search_history', JSON.stringify(updated));
  };

  const typeLabels: Record<string, string> = {
    extended: 'Полный пробив',
    comments: 'Поиск по словам',
    instagram: 'Instagram OSINT',
    phone: 'Проверка номера',
    vk: 'Поиск VK',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">История расследований</h3>
              <p className="text-xs text-slate-400">Сохранённые результаты поиска за последние 30 дней</p>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Всего записей: {history.length}</span>
            {history.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить историю</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">История поисков пуста</div>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    onSelectQuery(h.query, h.search_type);
                    onClose();
                  }}
                  className="p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {typeLabels[h.search_type] || h.search_type}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{h.created_at}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-100 block truncate">{h.query}</span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Найдено результатов: {h.results_count}
                    </span>
                  </div>

                  <button
                    onClick={(e) => deleteItem(h.id, e)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
