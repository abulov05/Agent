import { useState } from 'react';
import { X, Search, Camera, ShieldCheck, Lock, ExternalLink, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { InstagramResult } from '../types';
import { searchInstagram } from '../services/api';

interface InstagramModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export function InstagramModal({ onClose, initialQuery = '' }: InstagramModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InstagramResult | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchInstagram(query.trim());
      setResult(data);
    } catch (e) {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">OSINT Instagram</h3>
              <p className="text-xs text-slate-400">Сбор метаданных, связанных телефонов, email и социальных связей</p>
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
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Instagram username, ID или телефон..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 focus:border-rose-500/50 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Ищем...' : 'Найти'}</span>
            </button>
          </form>
        </div>

        {/* Result Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Парсинг профиля и перекрёстных упоминаний...</p>
            </div>
          ) : result === null ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Укажите имя профиля (например @username) без символа @
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <img
                  src={result.avatar}
                  alt={result.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-rose-500/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-slate-100 truncate">{result.full_name}</h4>
                    {result.is_verified && (
                      <span className="text-blue-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-rose-400 font-medium block">@{result.username}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>ID: {result.user_id}</span>
                    <span>•</span>
                    <span>{result.joined_date}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-base font-bold text-slate-100 font-mono block">
                    {result.posts?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Публикаций</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-base font-bold text-slate-100 font-mono block">
                    {result.followers?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Подписчиков</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-base font-bold text-slate-100 font-mono block">
                    {result.following?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Подписок</span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
                {result.bio && (
                  <p className="text-slate-300 leading-relaxed italic border-l-2 border-rose-500 pl-3 py-0.5">
                    "{result.bio}"
                  </p>
                )}
                {result.website && (
                  <div className="flex items-center gap-2 text-slate-300 pt-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <a href={result.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">
                      {result.website}
                    </a>
                  </div>
                )}
                {result.location && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{result.location}</span>
                  </div>
                )}
                {result.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-emerald-400">{result.phone}</span>
                  </div>
                )}
                {result.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono">{result.email}</span>
                  </div>
                )}
              </div>

              {/* Related Accounts */}
              {result.related_accounts && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Связанные аккаунты
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {result.related_accounts.map((acc, i) => (
                      <a
                        key={i}
                        href={acc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-xs text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{acc.icon}</span>
                          <span className="font-medium truncate">{acc.platform}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              <a
                href={`https://instagram.com/${result.username}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
              >
                <span>Открыть профиль Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
