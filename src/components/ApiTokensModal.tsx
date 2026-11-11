import { useState } from 'react';
import { X, Key, Copy, Check, Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';

interface ApiTokensModalProps {
  onClose: () => void;
}

export function ApiTokensModal({ onClose }: ApiTokensModalProps) {
  const [tokens, setTokens] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aa_user_api_tokens');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        token: "aa_live_894f201e79b9401ab6c231",
        label: "Primary Production Key",
        requests_total: 1000,
        requests_used: 142,
        created_at: "2026-11-01",
        expires_at: "2026-12-01",
      },
    ];
  });

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const copy = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleBuyToken = (reqCount: number, priceUsd: number) => {
    setBuying(true);
    setTimeout(() => {
      const newToken = {
        token: "aa_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        label: `Пакет ${reqCount} запросов`,
        requests_total: reqCount,
        requests_used: 0,
        created_at: new Date().toISOString().slice(0, 10),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      };

      const updated = [newToken, ...tokens];
      setTokens(updated);
      localStorage.setItem('aa_user_api_tokens', JSON.stringify(updated));
      setBuying(false);
    }, 800);
  };

  const deleteToken = (tok: string) => {
    const updated = tokens.filter((t) => t.token !== tok);
    setTokens(updated);
    localStorage.setItem('aa_user_api_tokens', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">API Токены разработчика</h3>
              <p className="text-xs text-slate-400">Интеграция поиска и OSINT в ваши внешние скрипты и боты</p>
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
          {/* Active Tokens */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Активные ключи доступа ({tokens.length})
            </h4>

            {tokens.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                У вас нет активных API токенов
              </div>
            ) : (
              tokens.map((t) => (
                <div
                  key={t.token}
                  className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{t.label}</span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {t.requests_used} / {t.requests_total} запросов
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800/80">
                    <span className="font-mono text-xs text-slate-300 flex-1 truncate">{t.token}</span>
                    <button
                      onClick={() => copy(t.token)}
                      className="text-slate-400 hover:text-white"
                      title="Скопировать"
                    >
                      {copiedToken === t.token ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteToken(t.token)}
                      className="text-slate-500 hover:text-rose-400 ml-1"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Создан: {t.created_at}</span>
                    <span>Действует до: {t.expires_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Buy Packages */}
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Приобрести пакет запросов API
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { req: 100, price: 1 },
                { req: 500, price: 4 },
                { req: 1000, price: 7 },
                { req: 5000, price: 30 },
              ].map((p) => (
                <button
                  key={p.req}
                  disabled={buying}
                  onClick={() => handleBuyToken(p.req, p.price)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-all active:scale-98"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{p.req} запросов</span>
                    <span className="text-[11px] text-emerald-400 font-mono">{p.price} USD</span>
                  </div>
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
