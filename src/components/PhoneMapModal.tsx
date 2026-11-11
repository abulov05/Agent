import { useEffect, useRef } from 'react';
import { PhoneCheckResult } from '../types';
import { X, MapPin, ExternalLink, MessageSquare, PhoneCall } from 'lucide-react';

interface PhoneMapModalProps {
  info: PhoneCheckResult;
  onClose: () => void;
  isDark: boolean;
}

export function PhoneMapModal({ info, onClose, isDark }: PhoneMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const lat = info.lat || 38.5598;
    const lon = info.lon || 68.7870;

    // Load leaflet if available on window or dynamic import
    let isMounted = true;

    async function initMap() {
      try {
        const L = (window as any).L || (await import('leaflet')).default;
        if (!isMounted || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [lat, lon],
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
        });

        const tileUrl = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping"></div>
              <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                📱
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([lat, lon], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: inherit; font-size: 13px; padding: 4px;">
              <b>${info.flag} ${info.phone}</b><br/>
              <span style="color: #64748b;">${info.operator} • ${info.region}</span>
            </div>
          `)
          .openPopup();

        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 300);
      } catch (err) {
        console.error("Leaflet init error", err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [info, isDark]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{info.flag}</span>
                <span className="font-mono">{info.phone}</span>
              </h3>
              <p className="text-xs text-slate-400">{info.country} • {info.operator}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Viewport */}
        <div className="relative h-72 w-full bg-slate-950">
          <div ref={mapContainerRef} className="h-full w-full" />
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono shadow-md">
            Координаты: {info.lat?.toFixed(4)}, {info.lon?.toFixed(4)}
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block mb-1">Регион & Город</span>
              <span className="font-medium text-slate-200">{info.region || '—'}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block mb-1">Часовой пояс</span>
              <span className="font-mono font-medium text-slate-200">{info.tz || '—'}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block mb-1">HLR Статус сети</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {info.type}
              </span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block mb-1">Оператор связи</span>
              <span className="font-medium text-slate-200">{info.operator}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2">
            {info.telegram_link && (
              <a
                href={info.telegram_link}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-98"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Открыть Telegram</span>
              </a>
            )}
            {info.whatsapp_link && (
              <a
                href={info.whatsapp_link}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Чат</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
