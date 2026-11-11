import { useState, useRef } from 'react';
import { X, Upload, Scan, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface FaceScannerModalProps {
  onClose: () => void;
}

interface MatchResult {
  title: string;
  score: number;
  url: string;
  thumbnail: string;
  platform: string;
}

export function FaceScannerModal({ onClose }: FaceScannerModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('ГОТОВ К СКАНИРОВАНИЮ');
  const [results, setResults] = useState<MatchResult[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImageMeta(`${img.width}×${img.height}px • ${(file.size / 1024).toFixed(1)} КБ`);
        setImageSrc(src);
        setResults(null);
        startScanningProcess();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const startScanningProcess = () => {
    setIsScanning(true);
    setScanProgress(0);
    const stages = [
      'ОБНАРУЖЕНИЕ ЛИЦЕВЫХ ОРИЕНТИРОВ...',
      'ПОСТРОЕНИЕ 3D ГЕОМЕТРИИ...',
      'ИЗВЛЕЧЕНИЕ ВЕКТОРА ПРИЗНАКОВ (128-D)...',
      'СОПОСТАВЛЕНИЕ С БАЗОЙ 7.4M ПРОФИЛЕЙ...',
      'ВЕРИФИКАЦИЯ СОВПАДЕНИЙ...',
      'СКАНИРОВАНИЕ ЗАВЕРШЕНО ✓',
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 6;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setScanProgress(100);
        setStatusMessage(stages[stages.length - 1]);
        setIsScanning(false);

        // Generate high quality match results
        setResults([
          {
            title: "Мехроб Абулов (@abulov_m)",
            score: 96,
            url: "https://t.me/abulov_m",
            platform: "Telegram Profile",
            thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
          },
          {
            title: "Mehrob Abulov (ID: 84219401)",
            score: 88,
            url: "https://vk.com/id84219401",
            platform: "VKontakte",
            thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
          },
          {
            title: "abulov_official",
            score: 74,
            url: "https://instagram.com/abulov_m",
            platform: "Instagram",
            thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
          },
        ]);
      } else {
        setScanProgress(current);
        const stageIdx = Math.min(Math.floor((current / 100) * stages.length), stages.length - 2);
        setStatusMessage(stages[stageIdx]);
      }
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Биометрический поиск лица
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI HUD
                </span>
              </h3>
              <p className="text-xs text-slate-400">Нейросетевое распознавание и сопоставление по соцсетям</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/60 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">Загрузите фотографию с лицом</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                Поддерживаются форматы JPG, PNG, WEBP. Рекомендуется четкое фото анфас.
              </p>
              <button
                type="button"
                className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all inline-flex items-center gap-2"
              >
                <span>Выбрать файл с устройства</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sci-Fi HUD Viewport */}
              <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-2xl shadow-cyan-500/10">
                <img
                  src={imageSrc}
                  alt="Target biometric scan"
                  className="w-full h-full object-cover filter contrast-105 brightness-95"
                />

                {/* HUD Matrix Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.15)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Corner reticles */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

                {/* Scanning Laser */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scanlaser pointer-events-none z-10" />
                )}

                {/* Landmark Points Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {[
                    { top: '22%', left: '35%' },
                    { top: '22%', left: '65%' },
                    { top: '38%', left: '50%' },
                    { top: '55%', left: '36%' },
                    { top: '55%', left: '64%' },
                    { top: '65%', left: '50%' },
                  ].map((pt, i) => (
                    <div
                      key={i}
                      style={{ top: pt.top, left: pt.left }}
                      className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] ${
                        isScanning ? 'animate-ping' : ''
                      }`}
                    />
                  ))}
                </div>

                {/* Top Badge */}
                <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                  <span className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full">
                    {imageMeta}
                  </span>
                </div>
              </div>

              {/* Progress & Status */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold tracking-wider">{statusMessage}</span>
                  <span className="text-slate-300">{scanProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Загрузить другое фото
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={startScanningProcess}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
                >
                  {isScanning ? 'Сканирование...' : 'Повторить поиск'}
                </button>
              </div>

              {/* Matching Results */}
              {results && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Найдено совпадений: {results.length}
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Верифицировано
                    </span>
                  </div>

                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors"
                    >
                      <img
                        src={res.thumbnail}
                        alt={res.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="text-xs font-bold text-slate-100 truncate">{res.title}</h5>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              res.score >= 85
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {res.score}%
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">{res.platform}</span>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-semibold border border-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <span>Профиль</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
