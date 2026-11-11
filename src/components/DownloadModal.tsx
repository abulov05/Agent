import { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Apple,
  Chrome,
  FolderArchive,
  CheckCircle2,
  ExternalLink,
  Bot,
  Terminal,
  FileText,
  Share2,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadModalProps {
  onClose: () => void;
}

export function DownloadModal({ onClose }: DownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'pwa' | 'zip' | 'dossier'>('pwa');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  const { isInstallable, isInstalled, isIOS, isAndroid, triggerInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    setInstallStatus('Ожидание подтверждения...');
    const result = await triggerInstall();
    if (result === 'accepted') {
      setInstallStatus('✅ Приложение успешно установлено на ваш экран!');
    } else if (result === 'dismissed') {
      setInstallStatus('Установка отклонена.');
    } else {
      setInstallStatus('Используйте инструкцию ниже для ручной установки.');
    }
  };

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();

      // Readme instructions
      const readmeContent = `# AGENT ANALYTICS — OSINT Intelligence Suite

Профессиональная платформа для OSINT-расследований, поиска данных по номеру телефона, биометрического распознавания лиц и Telegram-аналитики.

## Быстрый запуск на компьютере:

1. Распакуйте архив в любую папку.
2. Откройте терминал в папке проекта.
3. Установите зависимости:
   \`\`\`bash
   npm install
   \`\`\`
4. Запустите локальный сервер разработки:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Откройте в браузере: http://localhost:3000

## Telegram бот:
Официальный бот: https://t.me/dev1_robot
`;

      zip.file('README.md', readmeContent);

      // Package configuration
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: 'agent-analytics-osint',
            version: '2.5.0',
            private: true,
            type: 'module',
            scripts: {
              dev: 'vite --port=3000 --host=0.0.0.0',
              build: 'vite build',
              preview: 'vite preview',
              lint: 'tsc --noEmit',
            },
            dependencies: {
              '@google/genai': '^2.4.0',
              '@tailwindcss/vite': '^4.3.3',
              'canvas-confetti': '^1.9.4',
              jszip: '^3.10.2',
              leaflet: '^1.9.4',
              'lucide-react': '^0.546.0',
              motion: '^12.23.24',
              react: '^19.0.1',
              'react-dom': '^19.0.1',
              vite: '^8.3.0',
              'vite-plugin-pwa': '^2.0.0',
            },
            devDependencies: {
              '@types/leaflet': '^1.9.22',
              '@types/node': '^22.14.0',
              '@types/react': '^19.3.0',
              '@types/react-dom': '^19.3.0',
              tailwindcss: '^4.3.3',
              typescript: '^7.0.2',
            },
          },
          null,
          2
        )
      );

      // Sample project structure info
      const srcFolder = zip.folder('src');
      if (srcFolder) {
        srcFolder.file(
          'index.css',
          `@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n`
        );
        srcFolder.file(
          'info.txt',
          `AGENT ANALYTICS v2.5.0 OSINT Intelligence Suite\nАрхив экспортирован из приложения.`
        );
      }

      // Generate the ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-analytics-osint-v2.5.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipSuccess(true);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleExportSampleDossier = () => {
    const sampleData = {
      agency: 'AGENT ANALYTICS INTELLIGENCE',
      timestamp: new Date().toISOString(),
      subject: {
        id: 74920194,
        username: '@durov',
        first_name: 'Pavel',
        last_name: 'Durov',
        verified: true,
        premium: true,
        phone_carrier: 'MegaFon / MTS / Tele2',
        geo_location: {
          country: 'United Arab Emirates',
          city: 'Dubai',
          coordinates: [25.2048, 55.2708],
        },
      },
      osint_summary: {
        total_channels_created: 14,
        messages_analyzed: 45290,
        leak_mentions: 0,
        threat_level: 'LOW',
        fraud_risk_score: '0.02',
      },
      export_version: '2.5-ENTERPRISE',
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier_74920194_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                СКАЧАТЬ И УСТАНОВИТЬ
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  PWA & ZIP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Установка на iPhone, Android, запуск в Telegram или код
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pwa'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>На телефон</span>
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'zip'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Код (.ZIP)</span>
          </button>
          <button
            onClick={() => setActiveTab('dossier')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'dossier'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Экспорт досье</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* Direct Install Button if supported */}
              {isInstallable && !isInstalled && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/50 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300">
                      Ваш браузер поддерживает прямую установку!
                    </span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    Установить приложение на рабочий стол
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Приложение уже установлено в автономном режиме (PWA Standalone)!
                  </span>
                </div>
              )}

              {installStatus && (
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono text-center">
                  {installStatus}
                </div>
              )}

              {/* iOS Safari Instruction */}
              <div
                className={`p-4 rounded-2xl bg-slate-950 border ${
                  isIOS ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-slate-800'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="w-5 h-5 text-slate-100" />
                    <span className="text-xs font-bold text-slate-200">
                      Инструкция для iPhone (iOS Safari)
                    </span>
                  </div>
                  {isIOS && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Ваше устройство
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </div>
                    <span>
                      Откройте эту страницу в браузере <strong>Safari</strong> на iPhone.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </div>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Нажмите кнопку <strong className="text-cyan-300">«Поделиться»</strong>
                      <Share2 className="w-3.5 h-3.5 inline text-cyan-400" /> в нижней панели
                      Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </div>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Прокрутите вниз и выберите{' '}
                      <strong className="text-cyan-300">«На экран «Домой»»</strong>
                      <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      4
                    </div>
                    <span>
                      Нажмите <strong>«Добавить»</strong> в правом верхнем углу. Иконка появится на
                      рабочем столе!
                    </span>
                  </div>
                </div>
              </div>

              {/* Android Chrome Instruction */}
              <div
                className={`p-4 rounded-2xl bg-slate-950 border ${
                  isAndroid ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-slate-800'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Инструкция для Android (Chrome / Samsung)
                    </span>
                  </div>
                  {isAndroid && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Ваше устройство
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </div>
                    <span>
                      Откройте страницу в <strong>Google Chrome</strong> на Android.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </div>
                    <span>
                      Нажмите меню из трех точек <strong>(⋮)</strong> в верхнем правом углу.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </div>
                    <span>
                      Нажмите <strong>«Установить приложение»</strong> или «Добавить на гл. экран».
                    </span>
                  </div>
                </div>
              </div>

              {/* Telegram Bot Link */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      Telegram Mini App
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Запуск прямо внутри мессенджера
                    </span>
                  </div>
                </div>
                <a
                  href="https://t.me/dev1_robot"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <span>@dev1_robot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      Полный архив проекта (.ZIP)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Включает package.json, стили, конфигурацию и документацию
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Вы можете скачать исходный код в один клик. Архив генерируется прямо в вашем
                  браузере без ограничений.
                </p>

                <button
                  onClick={handleDownloadZip}
                  disabled={isGeneratingZip}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingZip ? 'Сборка архива...' : 'Скачать .ZIP архив проекта'}
                </button>

                {zipSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Архив `agent-analytics-osint-v2.5.zip` успешно скачан!</span>
                  </div>
                )}
              </div>

              {/* Terminal Instructions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Команды для запуска на компьютере:</span>
                </div>
                <pre className="p-3 rounded-xl bg-black border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`# 1. Распакуйте архив и перейдите в папку
npm install

# 2. Запустите в режиме разработки
npm run dev`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'dossier' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      Экспорт досье и отчетов
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Формат JSON с метаданными, геолокацией и рисками
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Скачайте готовое аналитическое досье в формате JSON для дальнейшего анализа или
                  передачи в другие OSINT инструменты.
                </p>

                <button
                  onClick={handleExportSampleDossier}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Скачать досье (.JSON)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>AGENT ANALYTICS v2.5.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
