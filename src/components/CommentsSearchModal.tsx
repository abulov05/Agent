import { useState } from 'react';
import { X, Search, Copy, Check, ExternalLink, MessageSquare, User, Lock } from 'lucide-react';
import { CommentMessage } from '../types';
import { searchComments } from '../services/api';

interface CommentsSearchModalProps {
  onClose: () => void;
  userId: number;
  initialQuery?: string;
  onSelectUser?: (uid: number) => void;
}

export function CommentsSearchModal({ onClose, userId, initialQuery = '', onSelectUser }: CommentsSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CommentMessage[] | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setLoading(true);
    try {
      const data = await searchComments(userId, query.trim());
      setResults(data.results || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!results || !results.length) return;
    const text = results
      .map(
        (m, i) =>
          `[Сообщение #${i + 1}]\n👤 ${m.first_name || ''} ${m.last_name || ''} (@${m.username || '—'})\n🆔 ID: ${m.user_id}\n📌 Чат: ${m.chat_title || m.chat || '—'}\n📅 ${m.message_date || m.date || '—'}\n💬 ${m.message_text || m.text || ''}\n`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Поиск по ключевым словам</h3>
              <p className="text-xs text-slate-400">Глубокий поиск в комментариях и сообщениях по миллионам записей</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Слово или фраза (например: Москва, крипта, работа, телефон...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 focus:border-amber-500/50 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Ищем...' : 'Найти'}</span>
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-[11px] text-slate-400">
            <span className="text-slate-500 shrink-0">Частые запросы:</span>
            {['Москва', 'Крипта', 'Таджикистан', 'Работа', 'Разработка'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Сканирование индекса сообщений...</p>
            </div>
          ) : results === null ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Введите ключевое слово выше для запуска поиска
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-semibold text-slate-300">Ничего не найдено</p>
              <p className="text-xs text-slate-500">Попробуйте изменить формулировку запроса</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Найдено записей: {results.length}
                </span>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Скопировано!' : 'Копировать всё'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {results.map((item, idx) => {
                  const author = `${item.first_name || ''} ${item.last_name || ''}`.trim() || `ID: ${item.user_id}`;
                  const isPrivate = item.message_link?.includes('/c/');

                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-colors space-y-3"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {author.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-200 block truncate">{author}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.username ? `@${item.username}` : `ID: ${item.user_id}`}
                            </span>
                          </div>
                        </div>

                        {onSelectUser && (
                          <button
                            onClick={() => {
                              onSelectUser(item.user_id);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[11px] font-semibold border border-blue-500/20 transition-all flex items-center gap-1 shrink-0"
                          >
                            <User className="w-3 h-3" />
                            <span>Профиль</span>
                          </button>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                        {item.message_text || item.text}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="text-amber-400 font-medium truncate max-w-[240px]">
                          📌 {item.chat_title || item.chat || 'Тематический чат'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500">{(item.message_date || item.date || '').slice(0, 16)}</span>
                          {item.message_link && !isPrivate ? (
                            <a
                              href={item.message_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                            >
                              <span>Чат</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Приват</span>
                            </span>
                          )}
                        </div>
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
