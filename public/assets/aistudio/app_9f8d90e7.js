// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
  API_BASE: "https://edition-debug-relive.ngrok-free.dev",
  API_KEY: "iQbE6w_ZAMu0CeYtvQktTjmsvGL13ssV",
  API_KEY_VERSION: "v9",
  BOT_USERNAME: "dev1_robot",
  ADMIN_ID: 8682108827,
  DAILY_LIMIT: 5
};

const savedVer = localStorage.getItem('aa_key_version');
if (savedVer !== CONFIG.API_KEY_VERSION) {
  localStorage.removeItem('aa_token');
  localStorage.setItem('aa_key_version', CONFIG.API_KEY_VERSION);
}

try {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); tg.disableVerticalSwipes?.(); }
} catch (e) {}

let currentTheme = localStorage.getItem('aa_theme') || 'dark';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('aa_theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
  try {
    const tg = window.Telegram?.WebApp;
    tg?.setHeaderColor?.(theme === 'dark' ? '#000000' : '#ffffff');
    tg?.setBackgroundColor?.(theme === 'dark' ? '#000000' : '#ffffff');
  } catch (e) {}
}
document.documentElement.setAttribute('data-theme', currentTheme);

const $ = id => document.getElementById(id);
const searchInput = $('search-input');
const searchBtn = $('search-btn');
const toasts = $('toasts');
const contentWrap = $('content-wrap');

let APIFY_TOKEN = localStorage.getItem('aa_token') || CONFIG.API_KEY;
let currentTab = 'home';
let currentScreen = { name: 'home', data: null };
let _meCache = { userId: null, data: null, ts: 0 };

// ============================================================
// HELPERS
// ============================================================
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function formatDate(iso) { if (!iso) return '—'; try { const d = new Date(iso); return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear(); } catch(e) { return String(iso).slice(0, 10); } }
function formatTime(iso) { if (!iso) return ''; try { const d = new Date(iso); return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); } catch(e) { return String(iso).slice(0, 16); } }
function toast(msg, type = '') { const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg; toasts.appendChild(el); requestAnimationFrame(() => el.classList.add('show')); setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000); }
function vibrate(ms = 10) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
function formatNumber(n) { if (n == null) return '0'; return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function getTelegramUser() { try { const u = window.Telegram?.WebApp?.initDataUnsafe?.user; if (u) { localStorage.setItem('aa_tg_user', JSON.stringify(u)); return u; } const s = localStorage.getItem('aa_tg_user'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function isAdmin() { const u = getTelegramUser(); return u && u.id === CONFIG.ADMIN_ID; }
function copyToClipboard(text) {
  if (!text) { toast('❌ Нечего копировать', 'error'); return; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => { toast('✅ Скопировано', 'ok'); vibrate(30); }).catch(() => fallbackCopy(text));
    } else { fallbackCopy(text); }
  } catch (e) { fallbackCopy(text); }
}
function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    document.execCommand('copy');
    ta.remove();
    toast('✅ Скопировано', 'ok');
    vibrate(30);
  } catch (e) { toast('❌ Не удалось скопировать', 'error'); }
}
function chatLinkFromId(chatId) { if (!chatId) return null; const s = String(chatId); if (s.startsWith('-100')) return 'https://t.me/c/' + s.slice(4); if (s.startsWith('-')) return 'https://t.me/c/' + s.slice(1); return null; }

// ============================================================
// 📡 ЗАПРОСЫ С АВТОПОВТОРОМ
// ============================================================
async function pubGet(path, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(CONFIG.API_BASE + path, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = await r.text();
      try { return JSON.parse(text); } catch (e) { throw new Error('Не JSON'); }
    } catch (e) {
      lastError = e;
      if (i < retries - 1) { await new Promise(r => setTimeout(r, 2000)); }
    }
  }
  throw lastError;
}
async function pubPost(path, body, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(CONFIG.API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify(body) });
      const text = await r.text();
      try { return JSON.parse(text); } catch (e) { return { success: false, error: 'Не JSON' }; }
    } catch (e) {
      lastError = e;
      if (i < retries - 1) { await new Promise(r => setTimeout(r, 2000)); }
    }
  }
  throw lastError;
}

// ============================================================
// 🔥 ПРОГРЕВ API
// ============================================================
async function waitForAPI(maxWaitMs = 15000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    try {
      const r = await fetch(CONFIG.API_BASE + '/api/public/stats', { headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (r.ok) { console.log(`✅ API готов (попытка ${attempt})`); return true; }
    } catch (e) {}
    const txt = $('loading-text');
    if (txt) txt.textContent = `ПОДКЛЮЧЕНИЕ... (${attempt})`;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function getMe(force = false) {
  const u = getTelegramUser();
  if (!u) return { diamonds: 0, has_subscription: false, days_left: 0, subscription_end: null };
  const now = Date.now();
  if (!force && _meCache.userId === u.id && (now - _meCache.ts) < 5000 && _meCache.data) return _meCache.data;
  try { const data = await pubGet('/api/me/' + u.id); _meCache = { userId: u.id, data, ts: now }; return data; } catch(e) { return { diamonds: 0, has_subscription: false, days_left: 0, subscription_end: null }; }
}
// ============================================================
// AUTH
// ============================================================
function showAuthScreen() { const a = document.getElementById('auth-screen'); const b = document.getElementById('app'); if (a) a.style.display = 'block'; if (b) b.style.display = 'none'; }
function hideAuthScreen() { const a = document.getElementById('auth-screen'); const b = document.getElementById('app'); if (a) a.style.display = 'none'; if (b) b.style.display = 'flex'; }
function setAuthStatus(text, type = '') { const el = document.getElementById('auth-status'); if (!el) return; el.textContent = text; el.className = 'auth-status' + (type ? ' ' + type : ''); }

async function requestAuthCode() {
  const input = document.getElementById('auth-identifier');
  const btn = document.getElementById('auth-get-code-btn');
  const raw = (input.value || '').trim();
  if (!raw) { setAuthStatus('❌ Введите ID или @username', 'err'); return; }
  const isId = /^\d{5,15}$/.test(raw);
  const isUsername = /^@?[a-zA-Z][a-zA-Z0-9_]{2,31}$/.test(raw);
  if (!isId && !isUsername) { setAuthStatus('❌ Введите корректный ID или @username', 'err'); return; }
  btn.disabled = true; btn.textContent = '⏳ Отправка...'; setAuthStatus('');
  try {
    const r = await fetch(CONFIG.API_BASE + '/api/auth/request_code', { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify({ identifier: raw }) });
    const text = await r.text();
    let data = {}; try { data = JSON.parse(text); } catch(e) { data = { success: false, error: 'Не JSON' }; }
    if (data.success) {
      document.getElementById('auth-step-1').style.display = 'none';
      document.getElementById('auth-step-2').style.display = 'block';
      document.getElementById('auth-code').focus();
      setAuthStatus('✅ Код отправлен! Проверьте Telegram', 'ok');
    } else setAuthStatus('❌ ' + (data.error || 'Ошибка'), 'err');
  } catch (e) { setAuthStatus('❌ Ошибка сети: ' + e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = '📩 Получить код'; }
}
async function verifyAuthCode() {
  const codeInput = document.getElementById('auth-code');
  const btn = document.getElementById('auth-verify-btn');
  const code = (codeInput.value || '').trim();
  if (!/^\d{6}$/.test(code)) { setAuthStatus('❌ Код должен быть 6 цифр', 'err'); return; }
  btn.disabled = true; btn.textContent = '⏳ Проверка...'; setAuthStatus('');
  try {
    const r = await fetch(CONFIG.API_BASE + '/api/auth/verify_code', { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify({ code }) });
    const text = await r.text();
    let data = {}; try { data = JSON.parse(text); } catch(e) { data = { success: false, error: 'Не JSON' }; }
    if (data.success && data.user) {
      localStorage.setItem('aa_tg_user', JSON.stringify(data.user));
      _meCache = { userId: null, data: null, ts: 0 };
      hideAuthScreen(); getDailyUsage(); updateRequestsBadge(); updateNotifBadge(); renderScreen('home');
      setInterval(updateNotifBadge, 30000);
      toast('✅ Добро пожаловать!', 'ok');
    } else setAuthStatus('❌ ' + (data.error || 'Неверный код'), 'err');
  } catch (e) { setAuthStatus('❌ Ошибка сети: ' + e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = '✅ Войти'; }
}
function logout() {
  try { window.Telegram?.WebApp?.close?.(); } catch(e) {}
  localStorage.removeItem('aa_tg_user'); localStorage.removeItem('aa_daily_usage');
  _meCache = { userId: null, data: null, ts: 0 }; location.reload();
}

// ============================================================
// DAILY LIMIT
// ============================================================
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function getDailyUsage() { try { const data = localStorage.getItem('aa_daily_usage'); if (!data) return { used: 0, date: todayStr() }; const parsed = JSON.parse(data); if (parsed.date !== todayStr()) return { used: 0, date: todayStr() }; return parsed; } catch (e) { return { used: 0, date: todayStr() }; } }
function saveDailyUsage(usage) { try { localStorage.setItem('aa_daily_usage', JSON.stringify(usage)); } catch (e) {} }
function getRequestsLeft() { if (isAdmin()) return Infinity; const u = getDailyUsage(); return Math.max(0, CONFIG.DAILY_LIMIT - u.used); }
function useRequest() { if (isAdmin()) return true; const u = getDailyUsage(); if (u.used >= CONFIG.DAILY_LIMIT) return false; u.used++; u.date = todayStr(); saveDailyUsage(u); return true; }
async function checkAndUseRequest() {
  if (isAdmin()) return { ok: true, message: '' };
  const me = await getMe();
  if (me && me.has_subscription) return { ok: true, message: '' };
  const left = getRequestsLeft();
  if (left <= 0) return { ok: false, message: '❌ Лимит запросов исчерпан!' };
  useRequest();
  return { ok: true, message: '' };
}
async function updateRequestsBadge() {
  const badge = document.getElementById('requests-badge');
  if (!badge) return;
  if (isAdmin()) { badge.textContent = '👑 Безлимит'; badge.style.background = 'rgba(255,149,0,0.15)'; badge.style.color = 'var(--orange)'; return; }
  const me = await getMe();
  if (me && me.has_subscription) { badge.textContent = '⭐ Безлимит'; badge.style.background = 'rgba(52,199,89,0.15)'; badge.style.color = 'var(--green)'; return; }
  const left = getRequestsLeft();
  badge.textContent = '📊 ' + left + '/' + CONFIG.DAILY_LIMIT;
  if (left === 0) { badge.style.background = 'rgba(255,59,48,0.15)'; badge.style.color = 'var(--red)'; }
  else if (left <= 2) { badge.style.background = 'rgba(255,149,0,0.15)'; badge.style.color = 'var(--orange)'; }
  else { badge.style.background = 'rgba(52,199,89,0.15)'; badge.style.color = 'var(--green)'; }
}
function showLimitModal() { vibrate(); showModal('<div class="modal-title">❌ Лимит запросов исчерпан</div><div class="modal-desc">Вы использовали все <b>' + CONFIG.DAILY_LIMIT + '</b> бесплатных запросов на сегодня.<br><br>⏰ Лимит автоматически обновится через 24 часа.<br><br>⭐ Или купите подписку для безлимитного доступа.</div><button class="btn" onclick="closeModal(); renderScreen(\'subscription\');">⭐ Купить подписку</button><button class="btn secondary" onclick="closeModal()">Понятно</button>'); }

async function updateNotifBadge() {
  const u = getTelegramUser();
  if (!u) return;
  try {
    const data = await pubGet('/api/notifications/' + u.id);
    const count = (data.notifications || []).length;
    const badge = document.getElementById('notif-badge');
    if (badge) { if (count > 0) { badge.textContent = count > 99 ? '99+' : String(count); badge.style.display = 'flex'; } else badge.style.display = 'none'; }
  } catch(e) {}
}

async function apiRequest(path, opts = {}) {
  const headers = { 'Authorization': 'Bearer ' + APIFY_TOKEN, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(opts.headers || {}) };
  const r = await fetch(CONFIG.API_BASE + path, { ...opts, headers });
  if (r.status === 401) throw new Error('Неверный API-токен');
  if (r.status === 403) { let d = ''; try { d = (await r.json()).error || ''; } catch (e) {} throw new Error(d || 'Доступ запрещён'); }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
const apiGetActivity = () => apiRequest('/api/activity');
const apiGetWords = () => apiRequest('/api/words');
const apiGetTopInterlocutors = () => apiRequest('/api/top_interlocutors');
const apiGetUser = (id, inc='all', lim=100) => apiRequest('/api/v1/users/' + id + '?include=' + inc + '&limit=' + lim);
async function apiGetPublicStats() { const r = await fetch(CONFIG.API_BASE + '/api/public/stats', { headers: { 'ngrok-skip-browser-warning': 'true' } }); if (!r.ok) throw new Error('Не удалось'); return r.json(); }

// ============================================================
// ICONS
// ============================================================
const I = {
  user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
  msg:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  star:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  gem:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg>',
  bell:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  gear:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  bot:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>',
  eye:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
  signal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg>',
  key:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  map:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
};

// ============================================================
// NAVIGATION
// ============================================================
function renderScreen(name, data) {
  if (name === 'admin' && !isAdmin()) { toast('❌ Доступ запрещён', 'error'); return renderHome(); }
  currentScreen = { name, data };
  contentWrap.scrollTop = 0;
  switch (name) {
    case 'home':            return renderHome();
    case 'search':          return renderSearchTab();
    case 'stats':           return renderStats();
    case 'me':              return renderMe();
    case 'profile':         return renderProfile(data);
    case 'phone-check':     return renderPhoneCheck();
    case 'phone-full':      return renderPhoneFull();
    case 'vk-search':       return renderVkSearch();
    case 'tg-search':       return renderTgSearch();
    case 'instagram-search': return renderInstagramSearch();
    case 'base-check':      return renderBaseChecker();
    case 'name-phone':      return renderNameByPhone();
    case 'subscription':    return renderSubscription();
    case 'tracking':        return renderTracking();
    case 'delete-data':     return renderDeleteData();
    case 'about':           return renderAbout();
    case 'history':         return renderSearchHistory();
    case 'api-tokens':      return renderApiTokens();
    case 'notifications':   return renderNotifications();
    case 'username-check':  return renderUsernameCheck();
    case 'comments-search': return renderCommentsSearch();
    case 'admin':           return renderAdminPanel();
    default:                return renderHome();
    case 'api-buy':         return renderApiBuy();
    case 'ai-assistant':    return renderAiAssistant();
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const t = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === tab));
    vibrate(8); currentTab = t;
    if (t === 'home')        renderScreen('home');
    else if (t === 'search') renderScreen('search');
    else if (t === 'stats')  renderScreen('stats');
    else if (t === 'me')     renderScreen('me');
  });
});
// ============================================================
// HOME
// ============================================================
async function renderHome() {
  const tgUser = getTelegramUser();
  const admin = isAdmin();

  contentWrap.innerHTML = `
    ${admin ? `<button class="quick-card" onclick="renderScreen('admin')" style="background:linear-gradient(135deg, rgba(255,149,0,0.15), rgba(255,59,48,0.15)); border:1px solid rgba(255,149,0,0.3); flex-direction:row; align-items:center; min-height:auto; padding:16px; margin-bottom:12px; width:100%;"><div class="quick-card-icon orange" style="width:44px;height:44px;">👑</div><div style="margin-left:12px;"><div class="quick-card-title" style="color:var(--orange);">АДМИН ПАНЕЛЬ</div><div class="quick-card-sub">Управление ботом</div></div></button>` : ''}

    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg-elev);border-radius:14px;margin-bottom:12px;">
      <div>
        <div style="font-size:13px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Доступно запросов</div>
        <div style="font-size:12px;color:var(--text-mute);margin-top:2px;">${admin ? 'Безлимитный доступ' : 'Обновление каждые 24 часа'}</div>
      </div>
      <div id="requests-badge" style="padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;"></div>
    </div>

    <div id="me-block"></div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-value" id="my-comments">—</div><div class="stat-label">Моих сообщений</div></div>
      <div class="stat-card"><div class="stat-value" id="my-chats">—</div><div class="stat-label">Моих чатов</div></div>
    </div>

    <div class="section-title">🔎 Поиск по словам</div>
    <div class="quick-grid">
      <button class="quick-card" onclick="renderScreen('comments-search')" style="grid-column: 1 / -1; background:linear-gradient(135deg, rgba(255,149,0,0.1), rgba(255,45,85,0.1)); border:1px solid rgba(255,149,0,0.25);">
        <div class="quick-card-icon" style="background:linear-gradient(135deg,#ff9500,#ff2d55);color:white;">🔎</div>
        <div>
          <div class="quick-card-title">Поиск по ключевому слову</div>
          <div class="quick-card-sub">Ищем в комментариях базы бота · миллионы сообщений</div>
        </div>
      </button>
    </div>

    <div class="section-title">🔍 Пробив по базам</div>
    <div class="quick-grid">
      <button class="quick-card" onclick="renderScreen('phone-full')"><div class="quick-card-icon red">🔍</div><div><div class="quick-card-title">Полный пробив</div><div class="quick-card-sub">ФИО, ДР, телефон, email</div></div></button>
      <button class="quick-card" onclick="renderScreen('name-phone')"><div class="quick-card-icon green">📞</div><div><div class="quick-card-title">ФИО по номеру</div><div class="quick-card-sub">Полный пробив по телефону</div></div></button>
      <button class="quick-card" onclick="renderScreen('base-check')"><div class="quick-card-icon purple">📊</div><div><div class="quick-card-title">Чекер по базам</div><div class="quick-card-sub">В скольких базах есть</div></div></button>
      <button class="quick-card" onclick="renderScreen('phone-check')"><div class="quick-card-icon green">📱</div><div><div class="quick-card-title">Проверка номера</div><div class="quick-card-sub">Страна, оператор, карта</div></div></button>
    </div>

    <div class="section-title">📸 Соцсети</div>
    <div class="quick-grid">
      <button class="quick-card" onclick="renderScreen('vk-search')"><div class="quick-card-icon">🔵</div><div><div class="quick-card-title">Поиск VK</div><div class="quick-card-sub">Профиль ВКонтакте</div></div></button>
      <button class="quick-card" onclick="renderScreen('tg-search')"><div class="quick-card-icon">✈️</div><div><div class="quick-card-title">Поиск Telegram</div><div class="quick-card-sub">ID, username, чаты</div></div></button>
      <button class="quick-card" onclick="renderScreen('instagram-search')" style="background:linear-gradient(135deg, rgba(225,48,108,0.1), rgba(253,203,110,0.1)); border:1px solid rgba(225,48,108,0.25);">
        <div class="quick-card-icon" style="background:linear-gradient(135deg,#e1306c,#fd1d1d,#fcb045);color:white;">📸</div>
        <div><div class="quick-card-title">Осинг Instagram</div><div class="quick-card-sub">Профиль по @username / ID / телефону</div></div>
      </button>
      <button class="quick-card" onclick="renderScreen('username-check')"><div class="quick-card-icon green">🌐</div><div><div class="quick-card-title">Проверка @username</div><div class="quick-card-sub">Все платформы</div></div></button>
    </div>

    <div class="section-title">🎁 Бонусы и связь</div>
    <div class="quick-grid">
      <button class="quick-card" onclick="renderScreen('notifications')"><div class="quick-card-icon orange">🔔</div><div><div class="quick-card-title">Уведомления</div><div class="quick-card-sub">Новые события</div></div></button>
      <button class="quick-card" onclick="renderScreen('subscription')"><div class="quick-card-icon purple">⭐</div><div><div class="quick-card-title">Подписка</div><div class="quick-card-sub">Безлимитный доступ</div></div></button>
      <button class="quick-card" onclick="renderScreen('api-tokens')"><div class="quick-card-icon green">🔑</div><div><div class="quick-card-title">API токены</div><div class="quick-card-sub">Управление токенами</div></div></button>
      <button class="quick-card" onclick="renderScreen('history')"><div class="quick-card-icon pink">📜</div><div><div class="quick-card-title">История</div><div class="quick-card-sub">Последние запросы</div></div></button>
    </div>

<button class="quick-card" onclick="renderScreen('ai-assistant')" style="background:linear-gradient(135deg, rgba(175,82,222,0.15), rgba(0,122,255,0.1)); border:1px solid rgba(175,82,222,0.3);">
  <div class="quick-card-icon purple">🤖</div>
  <div>
    <div class="quick-card-title">AI Помощник</div>
    <div class="quick-card-sub">Спросите Марыям</div>
  </div>
</button>
    <div class="section-title">Инструменты</div>
    <ul class="list">
      <li class="list-item" onclick="renderScreen('tracking')"><div class="list-icon purple">${I.eye}</div><div class="list-content"><div class="list-title">Отслеживание</div><div class="list-sub">20 алмазов / 7 дней</div></div><div class="list-chevron">${I.search}</div></li>
      <li class="list-item" onclick="renderScreen('delete-data')"><div class="list-icon red">${I.trash}</div><div class="list-content"><div class="list-title" style="color:var(--red);">Удалить данные</div><div class="list-sub">200 алмазов</div></div><div class="list-chevron">${I.search}</div></li>
      <li class="list-item" onclick="renderScreen('about')"><div class="list-icon gray">${I.info}</div><div class="list-content"><div class="list-title">О боте</div><div class="list-sub">Возможности и правила</div></div><div class="list-chevron">${I.search}</div></li>
      <li class="list-item" onclick="logout()"><div class="list-icon red">${I.trash}</div><div class="list-content"><div class="list-title" style="color:var(--red);">Выйти</div><div class="list-sub">Сбросить сессию</div></div><div class="list-chevron">${I.search}</div></li>
    </ul>
  `;

  updateRequestsBadge(); updateNotifBadge();
  if (!tgUser) return;

  try {
    const me = await getMe(true);
    if (currentScreen.name !== 'home') return;
    const meBlock = document.getElementById('me-block');
    if (meBlock) {
      const subLine = me.has_subscription ? `<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="color:var(--text-mute);">⭐ Подписка</span><span style="color:var(--green);font-weight:600;">активна до ${formatDate(me.subscription_end)}</span></div>` : `<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="color:var(--text-mute);">⭐ Подписка</span><span style="color:var(--red);font-weight:600;">не активна</span></div>`;
      meBlock.innerHTML = `<div style="background:var(--bg-elev);border-radius:14px;padding:12px 16px;margin-bottom:12px;">${subLine}<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:0.5px solid var(--border-soft);"><span style="color:var(--text-mute);">💎 Баланс</span><span style="color:var(--orange);font-weight:600;">${me.diamonds} алмазов</span></div></div>`;
    }
  } catch (e) {}

  try {
    const u = await apiGetUser(tgUser.id, 'all', 100).catch(() => null);
    if (currentScreen.name !== 'home') return;
    const elComments = document.getElementById('my-comments');
    const elChats = document.getElementById('my-chats');
    if (elComments && elChats) {
      if (u && !u.error) { elComments.textContent = formatNumber((u.comments || []).length); elChats.textContent = formatNumber((u.chats || []).length); }
      else { elComments.textContent = '0'; elChats.textContent = '0'; }
    }
  } catch (e) {}
}

async function loadProfileAvatar(userId) {
  const img = document.getElementById('profile-avatar-img');
  const initials = document.getElementById('profile-avatar-initials');
  if (!img) return;
  try {
    const url = CONFIG.API_BASE + '/api/user_avatar/' + userId + '?t=' + Date.now();
    const r = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    if (!r.ok) return;
    const blob = await r.blob();
    if (!blob.type.startsWith('image/')) return;
    if (blob.size < 100) return;
    img.src = URL.createObjectURL(blob);
    img.style.opacity = '1';
    if (initials) initials.style.display = 'none';
  } catch (e) {}
}

// ============================================================
// 🔎 ПОИСК ПО СЛОВАМ
// ============================================================
function renderCommentsSearch() {
  const u = getTelegramUser();
  if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">🔎 Поиск по ключевому слову</div><div class="chart-wrap" style="background:linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,45,85,0.08)); border:1px solid rgba(255,149,0,0.2);"><div class="field"><label class="field-label">Слово или фраза</label><input type="text" class="field-input" id="cs-query" placeholder="Например: Москва, привет, работа" autocomplete="off"><div class="field-hint">Ищем в миллионах сообщений базы бота</div></div><button class="btn" id="cs-btn" style="background:linear-gradient(135deg,#ff9500,#ff2d55);">🔎 Искать в комментариях</button></div><div id="cs-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  const input = $('cs-query');
  const btn = $('cs-btn');
  setTimeout(() => input.focus(), 100);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doCommentsSearch(); } });
  btn.addEventListener('click', doCommentsSearch);
  async function doCommentsSearch() {
    const query = (input.value || '').trim();
    if (query.length < 2) { toast('Минимум 2 символа', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    btn.disabled = true; btn.textContent = '⏳ Ищем...';
    $('cs-result').innerHTML = renderLoading(`Ищем "${query}" в комментариях...`);
    try {
      const data = await pubPost('/api/search_comments', { user_id: u.id, query, limit: 100 });
      if (!data.success) { $('cs-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const items = data.results || [];
      if (!items.length) { $('cs-result').innerHTML = renderEmpty(`По слову "${query}" ничего не найдено`); return; }
      window._commentsResults = items;
      let html = `<div class="section-title" style="color:var(--green);">✅ Найдено сообщений: ${data.count}</div><button class="btn secondary" onclick="copyAllComments()" style="margin-bottom:12px;">📄 Копировать все (${items.length})</button>`;
      const byUser = {};
      items.forEach(item => { const uid = item.user_id; if (!byUser[uid]) byUser[uid] = { user_id: uid, first_name: item.first_name, last_name: item.last_name, username: item.username, messages: [] }; byUser[uid].messages.push(item); });
      Object.values(byUser).forEach(user => {
        const name = `${user.first_name} ${user.last_name}`.trim() || `Пользователь ${user.user_id}`;
        const uname = user.username ? `@${user.username}` : null;
        const profileLink = uname ? `https://t.me/${uname}` : `tg://user?id=${user.user_id}`;
        html += `<div class="result-card" style="margin-bottom:14px;"><div style="padding:12px 14px;background:var(--bg-elev);border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0a84ff,#bf5af2);color:white;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;">${esc((name[0] || '?').toUpperCase())}</div><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:var(--text);">${esc(name)}</div><div style="font-size:12px;color:var(--text-mute);">${uname ? esc(uname) + ' · ' : ''}ID: ${user.user_id} · 💬 ${user.messages.length}</div></div><button onclick="window.open('${profileLink}','_blank')" style="background:var(--accent);border:none;border-radius:10px;color:white;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;">👤 Профиль</button></div><div style="padding:8px 0;">`;
        user.messages.slice(0, 10).forEach(msg => {
          const chatTitle = esc(msg.chat_title || '—');
          const text = esc(msg.message_text || '');
          const date = esc((msg.message_date || '').slice(0, 16));
          const link = msg.message_link || '';
          const isPrivate = link.includes('/c/');
          let linkHtml = '';
          if (link && !isPrivate) linkHtml = `<a href="${esc(link)}" target="_blank" style="display:inline-block;margin-top:6px;font-size:11px;color:var(--accent);text-decoration:none;background:rgba(0,122,255,0.1);padding:3px 8px;border-radius:6px;">🔗 Открыть</a>`;
          else if (isPrivate) linkHtml = `<button onclick="copyToClipboard('${esc(link)}')" style="display:inline-block;margin-top:6px;font-size:11px;color:var(--text-mute);background:var(--bg-elev);border:0.5px solid var(--border-soft);padding:3px 8px;border-radius:6px;cursor:pointer;">🔒 Приватный · 📋 Копировать</button>`;
          html += `<div style="padding:10px 14px;border-bottom:0.5px solid var(--border-soft);"><div style="font-size:12px;color:var(--accent);font-weight:600;margin-bottom:6px;">📌 ${chatTitle}</div><div style="font-size:13px;color:var(--text);line-height:1.5;">${text}</div>${linkHtml}</div>`;
        });
        if (user.messages.length > 10) html += `<div style="padding:8px 14px;text-align:center;font-size:12px;color:var(--text-mute);">... и ещё ${user.messages.length - 10}</div>`;
        html += `</div></div>`;
      });
      $('cs-result').innerHTML = html;
      vibrate(50);
      toast(`✅ Найдено: ${data.count}`, 'ok');
    } catch (e) { $('cs-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '🔎 Искать в комментариях'; }
  }
}
function copyAllComments() {
  const items = window._commentsResults;
  if (!items || !items.length) { toast('❌ Данные не найдены', 'error'); return; }
  let text = '';
  items.forEach((msg, idx) => {
    const name = `${msg.first_name || ''} ${msg.last_name || ''}`.trim() || `Пользователь ${msg.user_id}`;
    const uname = msg.username ? `@${msg.username}` : '';
    text += `═══ СООБЩЕНИЕ #${idx + 1} ═══\n👤 ${name} ${uname}\n🆔 ID: ${msg.user_id}\n📌 Чат: ${msg.chat_title || '—'}\n📅 Дата: ${(msg.message_date || '').slice(0, 16)}\n💬 ${msg.message_text || ''}\n\n`;
  });
  copyToClipboard(text.trim());
}

// ============================================================
// ПРОЧИЕ
// ============================================================
function renderSearchTab() { contentWrap.innerHTML = `<div class="section-title">Поиск</div><ul class="list"><li class="list-item" onclick="searchInput.focus()"><div class="list-icon">${I.search}</div><div class="list-content"><div class="list-title">Введите запрос в поле выше</div><div class="list-sub">ID, @username или телефон</div></div></li><li class="list-item" onclick="renderScreen('comments-search')"><div class="list-icon orange">🔎</div><div class="list-content"><div class="list-title">Поиск по слову</div><div class="list-sub">Ищем в комментариях базы</div></div><div class="list-chevron">${I.search}</div></li><li class="list-item" onclick="openMyProfile()"><div class="list-icon green">${I.user}</div><div class="list-content"><div class="list-title">Мой профиль</div><div class="list-sub">Найти себя</div></div><div class="list-chevron">${I.search}</div></li></ul>`; setTimeout(() => searchInput.focus(), 100); }

async function renderStats() {
  contentWrap.innerHTML = `
    <div class="section-title">📊 Статистика</div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value" id="bs-users">—</div><div class="stat-label">Пользователей</div></div>
      <div class="stat-card"><div class="stat-value" id="bs-comments">—</div><div class="stat-label">Сообщений</div></div>
      <div class="stat-card"><div class="stat-value" id="bs-chats">—</div><div class="stat-label">Чатов</div></div>
      <div class="stat-card"><div class="stat-value" id="bs-active">—</div><div class="stat-label">Активных</div></div>
    </div>
    <div class="section-title" style="margin-top: 20px;">📁 Типы данных в базе</div>
    <div class="stats-row" style="grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px;">
      <div class="stat-card" style="padding: 12px 8px;">
        <div style="font-size: 22px; margin-bottom: 4px;">🔗</div>
        <div class="stat-value" id="bs-usernames" style="font-size: 20px; color: var(--accent);">—</div>
        <div class="stat-label" style="font-size: 9px;">Юзернеймы</div>
      </div>
      <div class="stat-card" style="padding: 12px 8px;">
        <div style="font-size: 22px; margin-bottom: 4px;">📱</div>
        <div class="stat-value" id="bs-phones" style="font-size: 20px; color: var(--green);">—</div>
        <div class="stat-label" style="font-size: 9px;">Телефоны</div>
      </div>
      <div class="stat-card" style="padding: 12px 8px;">
        <div style="font-size: 22px; margin-bottom: 4px;">🆔</div>
        <div class="stat-value" id="bs-ids" style="font-size: 20px; color: var(--orange);">—</div>
        <div class="stat-label" style="font-size: 9px;">Только ID</div>
      </div>
    </div>
    <div class="section-title">📈 Активность</div>
    <div class="chart-wrap"><div class="chart-canvas-wrap"><canvas id="activityChart"></canvas></div></div>
    <div class="section-title">💬 Топ чатов</div>
    <ul class="list" id="top-chats"><li class="list-item"><div class="list-content"><div class="list-sub">Загрузка...</div></div></li></ul>
    <div class="section-title">🔤 Популярные слова</div>
    <ul class="list" id="top-words"><li class="list-item"><div class="list-content"><div class="list-sub">Загрузка...</div></div></li></ul>
  `;

  try {
    const [stats, activity, chats, words] = await Promise.all([
      apiGetPublicStats().catch(() => ({})), 
      apiGetActivity().catch(() => []), 
      apiGetTopInterlocutors().catch(() => []), 
      apiGetWords().catch(() => [])
    ]);

    setText('bs-users', formatNumber(stats.users || 0)); 
    setText('bs-comments', formatNumber(stats.comments || 0)); 
    setText('bs-chats', formatNumber(stats.chats || 0)); 
    setText('bs-active', formatNumber(stats.started_bot || 0));
    setText('bs-usernames', formatNumber(stats.with_username || 0));
    setText('bs-phones', formatNumber(stats.with_phone || 0));
    setText('bs-ids', formatNumber(stats.only_id || 0));

    setHTML('top-chats', chats.length ? chats.slice(0, 10).map(c => '<li class="list-item"><div class="list-icon">' + I.msg + '</div><div class="list-content"><div class="list-title">' + esc((c.chat || '').slice(0, 28)) + '</div><div class="list-sub">' + formatNumber(c.messages) + ' сообщений</div></div></li>').join('') : '<li class="list-item"><div class="list-content"><div class="list-sub">Нет данных</div></div></li>');
    
    setHTML('top-words', words.length ? words.slice(0, 15).map(w => '<li class="list-item"><div class="list-icon purple">#</div><div class="list-content"><div class="list-title">' + esc(w.word) + '</div></div><div class="list-chevron">' + formatNumber(w.count) + '</div></li>').join('') : '<li class="list-item"><div class="list-content"><div class="list-sub">Нет данных</div></div></li>');

    renderChart(activity);
  } catch (e) {
    console.error("Ошибка загрузки статистики:", e);
  }
}
function renderChart(activity) {
  const canvas = $('activityChart'); if (!canvas || !activity || !activity.length || typeof Chart === 'undefined') return;
  if (window._currentChart) { window._currentChart.destroy(); window._currentChart = null; }
  const isDark = currentTheme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  window._currentChart = new Chart(canvas, { type: 'bar', data: { labels: activity.map(x => (x.date || '').slice(5)), datasets: [{ data: activity.map(x => x.count), backgroundColor: isDark ? 'rgba(10,132,255,0.6)' : 'rgba(0,122,255,0.6)', borderColor: isDark ? '#0a84ff' : '#007aff', borderWidth: 0, borderRadius: 4, barThickness: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: '#8e8e93', font: { size: 10 }, maxTicksLimit: 5 } }, x: { grid: { display: false }, ticks: { color: '#8e8e93', font: { size: 9 }, maxTicksLimit: 8 } } } } });
}
// ============================================================
// 👤 МОЙ TELEGRAM
// ============================================================
function renderMe() {
  const u = getTelegramUser();
  if (!u) {
    contentWrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-mute);">Откройте через Telegram</div>';
    return;
  }

  const fullName = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Без имени';
  const initials = (fullName[0] || '?').toUpperCase();
  const username = u.username ? '@' + u.username : '—';

  contentWrap.innerHTML = `
    <div class="section-title">Мой Telegram</div>
    <div style="display:flex;flex-direction:column;align-items:center;padding:20px 0 24px;">
      <div style="position:relative;width:96px;height:96px;">
        <div id="me-avatar-fallback" style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#0a84ff,#bf5af2);color:white;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;box-shadow:0 8px 24px rgba(0,122,255,0.3);border:3px solid var(--bg);">
          ${esc(initials)}
        </div>
        <img id="me-avatar-img" alt="" style="position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid var(--bg);box-shadow:0 8px 24px rgba(0,122,255,0.3);opacity:0;transition:opacity .25s;">
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-top:14px;">${esc(fullName)}</div>
      ${u.username ? `<div style="font-size:15px;color:var(--accent);margin-top:2px;">@${esc(u.username)}</div>` : ''}
    </div>

    <div class="result-card">
      <div class="result-row">
        <div class="result-icon">${I.user}</div>
        <div class="result-content">
          <div class="result-label">Имя</div>
          <div class="result-value">${esc(u.first_name || '—')} ${esc(u.last_name || '')}</div>
        </div>
      </div>
      <div class="result-row" onclick="copyToClipboard('${esc(username)}')" style="cursor:pointer;">
        <div class="result-icon">${I.user}</div>
        <div class="result-content">
          <div class="result-label">Username</div>
          <div class="result-value">${esc(username)}</div>
        </div>
        <div class="list-chevron">📋</div>
      </div>
      <div class="result-row" onclick="copyToClipboard('${u.id}')" style="cursor:pointer;">
        <div class="result-icon">${I.info}</div>
        <div class="result-content">
          <div class="result-label">ID</div>
          <div class="result-value mono">${u.id}</div>
        </div>
        <div class="list-chevron">📋</div>
      </div>
    </div>

    <div class="section-title">Действия</div>
    <ul class="list">
      <li class="list-item" onclick="openMyProfile()">
        <div class="list-icon">${I.user}</div>
        <div class="list-content"><div class="list-title">Мой профиль</div></div>
        <div class="list-chevron">${I.search}</div>
      </li>
      <li class="list-item" onclick="renderScreen('history')">
        <div class="list-icon purple">📜</div>
        <div class="list-content"><div class="list-title">История поисков</div></div>
        <div class="list-chevron">${I.search}</div>
      </li>
      <li class="list-item" onclick="renderScreen('api-tokens')">
        <div class="list-icon green">${I.key}</div>
        <div class="list-content"><div class="list-title">Мои API токены</div></div>
        <div class="list-chevron">${I.search}</div>
      </li>
      <li class="list-item" onclick="openSettings()">
        <div class="list-icon gray">${I.gear}</div>
        <div class="list-content"><div class="list-title">Настройки</div></div>
        <div class="list-chevron">${I.search}</div>
      </li>
      <li class="list-item" onclick="logout()">
        <div class="list-icon red">${I.trash}</div>
        <div class="list-content">
          <div class="list-title" style="color:var(--red);">Выйти</div>
          <div class="list-sub">Сбросить сессию</div>
        </div>
        <div class="list-chevron">${I.search}</div>
      </li>
    </ul>
  `;

  loadMeAvatar(u.id);
}

async function loadMeAvatar(userId) {
  const img = document.getElementById('me-avatar-img');
  const fallback = document.getElementById('me-avatar-fallback');
  if (!img) return;
  try {
    const url = CONFIG.API_BASE + '/api/user_avatar/' + userId + '?t=' + Date.now();
    const r = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    if (!r.ok) return;
    const blob = await r.blob();
    if (!blob.type.startsWith('image/')) return;
    if (blob.size < 100) return;
    img.src = URL.createObjectURL(blob);
    img.style.opacity = '1';
    if (fallback) fallback.style.opacity = '0';
  } catch (e) {}
}

async function renderSubscription() {
  const u = getTelegramUser(); contentWrap.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-mute);">Загрузка...</div>';
  let status = { has_subscription: false, end_date: null, days_left: 0 }; let plans = [];
  try { if (u) status = await pubGet('/api/subscription/status/' + u.id); const resp = await pubGet('/api/subscription/plans'); plans = resp.plans || []; } catch(e) {}
  const activeBlock = status.has_subscription ? `<div class="result-card" style="background:linear-gradient(135deg, rgba(52,199,89,0.15), rgba(52,199,89,0.05));border:1px solid rgba(52,199,89,0.3);"><div class="result-row" style="border:none;"><div class="result-icon" style="color:var(--green);">${I.check}</div><div class="result-content"><div class="result-label">Подписка активна</div><div class="result-value" style="color:var(--green);">Осталось ${status.days_left} дн.</div><div style="font-size:12px;color:var(--text-mute);margin-top:2px;">до ${formatDate(status.end_date)}</div></div></div></div>` : `<div class="result-card"><div class="result-row"><div class="result-icon" style="color:var(--text-mute);">${I.star}</div><div class="result-content"><div class="result-label">Подписка</div><div class="result-value" style="color:var(--text-mute);">Не активна</div></div></div></div>`;
  const planItems = plans.length ? plans.map(p => `<li class="list-item" onclick="buyPlan('${p.key}','${p.label}',${p.price_usd})"><div class="list-icon orange">${I.star}</div><div class="list-content"><div class="list-title">${esc(p.label)}</div><div class="list-sub">${p.price_usd} USD</div></div><div class="list-chevron">${I.search}</div></li>`).join('') : '';
  contentWrap.innerHTML = `<div class="section-title">⭐ Подписка</div>${activeBlock}<div class="section-title">Планы</div><ul class="list">${planItems}</ul><button class="btn secondary" onclick="renderScreen('home')">← Назад</button>`;
}
async function buyPlan(planKey, planLabel, priceUsd) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate(); showModal(`<div class="modal-title">⭐ ${esc(planLabel)}</div><div class="modal-desc">К оплате: <b>${priceUsd} USD</b></div><div style="text-align:center;padding:20px 0;"><div class="loading-bar" style="margin:0 auto;"></div></div>`);
  try {
    const data = await pubPost('/api/subscription/create', { user_id: u.id, plan_key: planKey });
    if (!data.success) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Ошибка')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal();
    const invoiceId = data.invoice_id, payUrl = data.pay_url;
    showModal(`<div class="modal-title">⭐ Оплата</div><div class="modal-desc">📋 ${esc(data.plan)}<br>💰 ${data.amount_usd} USD</div><button class="btn" id="sub-pay-btn">🏦 Оплатить</button><button class="btn" id="sub-check-btn" style="background:var(--green);">✅ Проверить</button><button class="btn secondary" onclick="closeModal()">Отмена</button>`);
    setTimeout(() => {
      document.getElementById('sub-pay-btn')?.addEventListener('click', () => { try { if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(payUrl); else window.open(payUrl, '_blank'); } catch(e) { window.open(payUrl, '_blank'); } });
      document.getElementById('sub-check-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = '⏳...';
        try { const res = await pubGet('/api/subscription/check/' + invoiceId); if (res.success && res.paid) { closeModal(); toast('✅ Активирована!', 'ok'); _meCache = { userId: null, data: null, ts: 0 }; renderScreen('subscription'); } else { this.disabled = false; this.textContent = '✅ Проверить'; toast('⏳ Ещё не оплачено', 'error'); } } catch(e) { this.disabled = false; this.textContent = '✅ Проверить'; toast('Ошибка', 'error'); }
      });
    }, 100);
  } catch(e) { closeModal(); toast('Ошибка', 'error'); }
}
async function renderTracking() {
  const u = getTelegramUser(); contentWrap.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-mute);">Загрузка...</div>';
  let me = { diamonds: '—' }; let trackList = [];
  try { if (u) me = await getMe(true); } catch(e) {} try { if (u) trackList = await pubGet('/api/tracking/' + u.id); } catch(e) {}
  contentWrap.innerHTML = `<div class="section-title">👀 Отслеживание</div><div class="result-card"><div class="result-row"><div class="result-icon">${I.gem}</div><div class="result-content"><div class="result-label">Баланс</div><div class="result-value accent">${me.diamonds ?? '—'} алмазов</div></div></div></div><div class="chart-wrap"><div class="field"><label class="field-label">ID</label><input type="number" class="field-input" id="tr-id" placeholder="123456789"></div><button class="btn" id="tr-btn">👀 Активировать</button></div><div class="section-title">📋 Активные</div><ul class="list">${trackList && trackList.length ? trackList.map(t => `<li class="list-item"><div class="list-icon purple">👤</div><div class="list-content"><div class="list-title">${t.target_user_id}</div><div class="list-sub">до ${(t.end_date||'').slice(0,10)}</div></div><button class="icon-btn" onclick="removeTracking(${t.target_user_id})" style="color:var(--red);">✕</button></li>`).join('') : '<li class="list-item"><div class="list-content"><div class="list-sub">Нет активных</div></div></li>'}</ul><button class="btn secondary" onclick="renderScreen('home')">← Назад</button>`;
  $('tr-btn')?.addEventListener('click', activateTracking);
}
async function activateTracking() {
  const u = getTelegramUser(); const id = $('tr-id').value.trim();
  if (!u || !id || !/^\d+$/.test(id)) { toast('Введите ID', 'error'); return; }
  const btn = $('tr-btn'); btn.disabled = true; btn.textContent = '⏳...';
  try { const data = await pubPost('/api/tracking/add', { user_id: u.id, target_id: parseInt(id) }); if (data.success) { toast('✅ Активировано!', 'ok'); _meCache = { userId: null, data: null, ts: 0 }; renderScreen('tracking'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); }
  catch(e) { toast('Ошибка', 'error'); }
  finally { btn.disabled = false; btn.textContent = '👀 Активировать'; }
}
async function removeTracking(targetId) { const u = getTelegramUser(); if (!u) return; try { await pubPost('/api/tracking/remove', { user_id: u.id, target_id: targetId }); toast('Удалено', 'ok'); renderScreen('tracking'); } catch(e) {} }
function renderDeleteData() { contentWrap.innerHTML = `<div class="section-title">🗑️ Удаление данных</div><div class="result-card"><div class="result-row"><div class="result-icon">${I.gem}</div><div class="result-content"><div class="result-label">Стоимость</div><div class="result-value accent">200 алмазов</div></div></div></div><div class="chart-wrap" style="background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.2);"><div style="color:var(--red);font-weight:600;margin-bottom:12px;">⚠️ ВНИМАНИЕ</div><div style="color:var(--text-dim);font-size:14px;line-height:1.6;">• Удаляет ВСЕ данные<br>• Очищает историю имён<br>• Удаляет список чатов</div></div><button class="btn danger" id="del-btn">🗑️ Удалить (200 💎)</button><button class="btn secondary" onclick="renderScreen('home')">← Назад</button>`; $('del-btn')?.addEventListener('click', confirmDelete); }
function confirmDelete() {
  vibrate(); showModal('<div class="modal-title">⚠️ Удалить данные?</div><div class="modal-desc">Необратимо. Спишется 200 алмазов.</div><button class="btn danger" id="del-confirm">🗑️ Да, удалить</button><button class="btn secondary" onclick="closeModal()">Отмена</button>');
  setTimeout(() => { document.getElementById('del-confirm')?.addEventListener('click', async () => { const u = getTelegramUser(); if (!u) return; closeModal(); try { const data = await pubPost('/api/delete_data', { user_id: u.id }); if (data.success) { toast('✅ Удалено!', 'ok'); _meCache = { userId: null, data: null, ts: 0 }; renderScreen('home'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); } catch(e) { toast('Ошибка', 'error'); } }); }, 50);
}

function renderAbout() {
  contentWrap.innerHTML = `
    <div style="padding-top:20px;text-align:center;">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#007aff);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:36px;">🤖</div>
      <div style="font-size:22px;font-weight:700;color:var(--text);">AGENT ANALYTICS</div>
      <div style="font-size:14px;color:var(--text-mute);margin-top:4px;">Версия 2.0</div>
    </div>

    <div class="section-title">📊 О ПРОЕКТЕ</div>
    <div class="chart-wrap">
      <div style="color:var(--text-dim);font-size:14px;line-height:1.6;">
        Многофункциональный бот для <b>анализа Telegram</b> и <b>поиска по базам данных</b>. Работает в личных чатах и группах.
      </div>
    </div>

    <div class="section-title">🛡️ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ</div>
    <ul class="list">
      <li class="list-item"><div class="list-icon">🔍</div><div class="list-content"><div class="list-title">Поиск людей</div><div class="list-sub">По ID, @username, номеру телефона</div></div></li>
      <li class="list-item"><div class="list-icon purple">📊</div><div class="list-content"><div class="list-title">HTML-отчёты</div><div class="list-sub">С диаграммами и историей сообщений</div></div></li>
      <li class="list-item"><div class="list-icon green">📱</div><div class="list-content"><div class="list-title">Проверка номера</div><div class="list-sub">Страна, оператор, Telegram, WhatsApp</div></div></li>
      <li class="list-item"><div class="list-icon orange">👥</div><div class="list-content"><div class="list-title">Анализ профиля</div><div class="list-sub">Чаты, группы, каналы, знакомые</div></div></li>
      <li class="list-item"><div class="list-icon pink">📜</div><div class="list-content"><div class="list-title">История имён</div><div class="list-sub">Как менял имя, username, bio</div></div></li>
      <li class="list-item"><div class="list-icon">🤖</div><div class="list-content"><div class="list-title">AI Помощник «Марыям»</div><div class="list-sub">Отвечает на вопросы, помогает в поиске</div></div></li>
    </ul>

    <div class="section-title">🛡️ ДЛЯ ГРУПП</div>
    <ul class="list">
      <li class="list-item"><div class="list-icon red">🚫</div><div class="list-content"><div class="list-title">Автомодерация</div><div class="list-sub">Анти-спам, анти-оскорбления</div></div></li>
      <li class="list-item"><div class="list-icon orange">⚠️</div><div class="list-content"><div class="list-title">Блокировка нарушителей</div><div class="list-sub">После 3 предупреждений — блок на 1 час</div></div></li>
      <li class="list-item"><div class="list-icon green">👋</div><div class="list-content"><div class="list-title">Приветствие новых</div><div class="list-sub">Правила группы для участников</div></div></li>
      <li class="list-item"><div class="list-icon purple">🤖</div><div class="list-content"><div class="list-title">AI Помощник в группах</div><div class="list-sub">Отвечает, если написать «Маям»</div></div></li>
    </ul>

    <div class="section-title">💎 ВАЛЮТА — АЛМАЗЫ</div>
    <div class="chart-wrap">
      <div style="color:var(--text-dim);font-size:14px;line-height:1.8;">
        💎 <b>150 алмазов = 1 USD</b><br>
        💰 Пополнение: <b>CryptoCloud, CryptoBot, OxaPay</b><br>
        🎁 Ежедневный бонус: <b>+10 алмазов</b><br>
        🤝 Реферал: <b>50 алмазов</b> за 1-го друга
      </div>
    </div>

    <div class="section-title">⭐ ПОДПИСКА</div>
    <ul class="list">
      <li class="list-item"><div class="list-icon orange">⭐</div><div class="list-content"><div class="list-title">1 месяц — 5 USD</div><div class="list-sub">Безлимитные запросы</div></div></li>
      <li class="list-item"><div class="list-icon orange">⭐</div><div class="list-content"><div class="list-title">6 месяцев — 20 USD</div><div class="list-sub">Выгода 33%</div></div></li>
      <li class="list-item"><div class="list-icon orange">⭐</div><div class="list-content"><div class="list-title">1 год — 45 USD</div><div class="list-sub">Выгода 40%</div></div></li>
    </ul>

    <div class="section-title">📋 КАК ДОБАВИТЬ В ГРУППУ</div>
    <div class="chart-wrap" style="background:linear-gradient(135deg,rgba(52,199,89,0.1),rgba(0,122,255,0.1));border:1px solid rgba(52,199,89,0.3);">
      <div style="color:var(--text);font-size:14px;line-height:1.8;">
        <b>1.</b> Добавьте бота в группу<br>
        <b>2.</b> Назначьте <b>администратором</b><br>
        <b>3.</b> Включите права: <i>Удаление сообщений</i> и <i>Блокировка</i><br>
        <b>4.</b> Готово — бот следит за порядком ✅<br>
        <br>
        💡 Напишите в группе <b>/grup</b> — бот покажет статистику защиты.
      </div>
    </div>

    <div class="section-title">👑 КОНТАКТЫ</div>

    <a href="https://t.me/amorfatti00" target="_blank" rel="noopener noreferrer" class="tg-contact-btn admin" aria-label="Амор Фатти — Админ">
      <svg class="tg-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      <div class="tg-text">
        <div class="tg-name">Амор Фатти</div>
        <div class="tg-username">@amorfatti00 · Админ</div>
      </div>
    </a>

    <a href="https://t.me/Agent_analytics" target="_blank" rel="noopener noreferrer" class="tg-contact-btn channel" aria-label="AGENT ANALYTICS — Канал">
      <svg class="tg-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      <div class="tg-text">
        <div class="tg-name">AGENT ANALYTICS</div>
        <div class="tg-username">@Agent_analytics · Канал</div>
      </div>
    </a>

    <button class="btn secondary" onclick="renderScreen('home')" style="margin-top:16px;">← На главную</button>
  `;
}

async function renderNotifications() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-mute);">Загрузка...</div>';
  try { const data = await pubGet('/api/notifications/' + u.id); const items = data.notifications || []; if (!items.length) { contentWrap.innerHTML = '<div class="section-title">🔔 Уведомления</div><div class="chart-wrap" style="text-align:center;color:var(--text-mute);">Нет уведомлений</div><button class="btn secondary" onclick="renderScreen(\'home\')">← На главную</button>'; return; } contentWrap.innerHTML = '<div class="section-title">🔔 Уведомления</div>' + items.map(n => `<div class="hist-item" style="border-left-color:var(--accent);"><div class="hist-top"><span>${esc(n.title||'')}</span><span>${esc(formatTime(n.created_at))}</span></div><div style="font-size:14px;color:var(--text);">${esc(n.message||'')}</div></div>`).join('') + '<button class="btn secondary" onclick="renderScreen(\'home\')">← На главную</button>'; } catch(e) { contentWrap.innerHTML = renderError('Ошибка'); }
}

async function renderAdminPanel() {
  if (!isAdmin()) { toast('❌ Доступ запрещён', 'error'); return renderHome(); }
  contentWrap.innerHTML = '<div style="padding-top:20px;text-align:center;"><div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#ff9500,#ff3b30);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:36px;">👑</div><div style="font-size:22px;font-weight:700;color:var(--text);">АДМИН ПАНЕЛЬ</div></div><div class="section-title">📊 Статистика</div><div class="stats-row"><div class="stat-card"><div class="stat-value" id="adm-users">—</div><div class="stat-label">Пользователей</div></div><div class="stat-card"><div class="stat-value" id="adm-comments">—</div><div class="stat-label">Сообщений</div></div></div><div class="section-title">🛠 Управление</div><ul class="list"><li class="list-item" onclick="openAdminAddBalance()"><div class="list-icon orange">💰</div><div class="list-content"><div class="list-title">Пополнить баланс</div></div><div class="list-chevron">' + I.search + '</div></li><li class="list-item" onclick="openAdminGiftSubscription()"><div class="list-icon purple">🎁</div><div class="list-content"><div class="list-title">Подарить подписку</div></div><div class="list-chevron">' + I.search + '</div></li></ul><button class="btn secondary" onclick="renderScreen(\'home\')">← На главную</button>';
  try { const stats = await apiGetPublicStats(); setText('adm-users', formatNumber(stats.users || 0)); setText('adm-comments', formatNumber(stats.comments || 0)); } catch (e) {}
}
function openAdminAddBalance() { showModal('<div class="modal-title">💰 Пополнить</div><div class="field"><label class="field-label">ID</label><input type="number" class="field-input" id="adm-bal-id" placeholder="123456789"></div><div class="field"><label class="field-label">Сумма</label><input type="number" class="field-input" id="adm-bal-sum" placeholder="50"></div><button class="btn" id="adm-bal-go">Начислить</button><button class="btn secondary" onclick="closeModal()">Отмена</button>'); setTimeout(() => document.getElementById('adm-bal-go')?.addEventListener('click', async () => { const id = document.getElementById('adm-bal-id').value.trim(); const sum = document.getElementById('adm-bal-sum').value.trim(); if (!id || !sum) { toast('Введите корректно', 'error'); return; } const u = getTelegramUser(); try { const data = await pubPost('/api/admin/add_balance', { admin_id: u.id, user_id: parseInt(id), amount: parseInt(sum) }); if (data.success) { closeModal(); toast('✅ Начислено!', 'ok'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); } catch(e) { toast('Ошибка', 'error'); } }), 50); }
function openAdminGiftSubscription() { showModal('<div class="modal-title">🎁 Подарить подписку</div><div class="field"><label class="field-label">ID</label><input type="number" class="field-input" id="adm-sub-id" placeholder="123456789"></div><div class="field"><label class="field-label">Дней</label><input type="number" class="field-input" id="adm-sub-days" placeholder="30"></div><button class="btn" id="adm-sub-go">Подарить</button><button class="btn secondary" onclick="closeModal()">Отмена</button>'); setTimeout(() => document.getElementById('adm-sub-go')?.addEventListener('click', async () => { const id = document.getElementById('adm-sub-id').value.trim(); const days = document.getElementById('adm-sub-days').value.trim(); if (!id || !days) { toast('Введите корректно', 'error'); return; } const u = getTelegramUser(); try { const data = await pubPost('/api/admin/gift_subscription', { admin_id: u.id, user_id: parseInt(id), days: parseInt(days) }); if (data.success) { closeModal(); toast('✅ Подарена!', 'ok'); _meCache = { userId: null, data: null, ts: 0 }; } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); } catch(e) { toast('Ошибка', 'error'); } }), 50); }
// ============================================================
// MODALS / SETTINGS
// ============================================================
function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal">' + html + '</div>';
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
function closeModal() { document.querySelectorAll('.modal-overlay').forEach(m => m.remove()); }

function openSettings() {
  showModal('<div class="modal-title">⚙️ Настройки</div><div class="field"><label class="field-label">API Токен</label><input type="password" class="field-input" id="modal-token" value="' + esc(APIFY_TOKEN) + '"></div><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:0.5px solid var(--border-soft);border-bottom:0.5px solid var(--border-soft);margin:12px 0;"><div style="font-size:16px;color:var(--text);font-weight:600;">Тёмная тема</div><label class="toggle"><input type="checkbox" id="modal-theme" ' + (currentTheme === 'dark' ? 'checked' : '') + '><span class="toggle-slider"></span></label></div><button class="btn" onclick="saveSettings()">Сохранить</button><button class="btn danger" onclick="closeModal();logout();" style="margin-top:4px;">🚪 Выйти из аккаунта</button><button class="btn secondary" onclick="closeModal()">Отмена</button>');
  setTimeout(() => { const t = $('modal-theme'); if (t) t.addEventListener('change', e => applyTheme(e.target.checked ? 'dark' : 'light')); }, 50);
}
function saveSettings() { const t = $('modal-token'); if (t) { APIFY_TOKEN = t.value.trim() || APIFY_TOKEN; localStorage.setItem('aa_token', APIFY_TOKEN); } closeModal(); toast('Сохранено', 'ok'); renderScreen(currentScreen.name, currentScreen.data); }
async function openMyProfile() { const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; } renderScreen('profile', u.id); }

// ============================================================
// LOADERS / EMPTY
// ============================================================
function renderLoading(text = 'Ищем...') { return `<div class="chart-wrap" style="text-align:center;"><div class="loading-bar" style="margin:0 auto 12px;"></div><div style="font-size:13px;color:var(--text-mute);">${text}</div></div>`; }
function renderError(msg) { return `<div class="chart-wrap" style="text-align:center;color:var(--red);">❌ ${esc(msg)}</div>`; }
function renderEmpty(msg = 'Ничего не найдено') { return `<div class="chart-wrap" style="text-align:center;"><div style="font-size:40px;margin-bottom:8px;">🔍</div><div style="font-size:15px;font-weight:600;color:var(--text);">${esc(msg)}</div></div>`; }
function fieldIcon(field) { const f = String(field).toLowerCase(); if (f.includes('фио')||f.includes('имя')||f.includes('name')||f.includes('фамил')) return '👤'; if (f.includes('рожд')||f.includes('birth')||f.includes('дата')||f.includes('др')) return '📅'; if (f.includes('телефон')||f.includes('phone')||f.includes('тел')) return '📞'; if (f.includes('почт')||f.includes('email')||f.includes('mail')) return '📧'; if (f.includes('паспорт')||f.includes('passport')) return '🪪'; if (f.includes('адрес')||f.includes('address')||f.includes('город')) return '🏠'; if (f.includes('авто')||f.includes('car')) return '🚗'; if (f.includes('банк')||f.includes('bank')||f.includes('карт')) return '🏦'; if (f.includes('инн')) return '📋'; if (f.includes('снилс')) return '🔢'; if (f.includes('vk')||f.includes('вк')) return '🔵'; if (f.includes('tg')||f.includes('telegram')) return '✈️'; if (f.includes('актуальность')||f.includes('дата обновления')) return '📅'; return '📌'; }

function renderExtendedResults(items, query, targetId) {
  let html = `<div class="section-title" style="color:var(--green);">✅ Найдено записей: ${items.length}</div>`;
  const databases = new Set(); items.forEach(it => { if (it.database) databases.add(it.database); });
  if (databases.size) html += `<div style="background:var(--bg-elev);border-radius:12px;padding:12px 16px;margin-bottom:12px;font-size:13px;color:var(--text-mute);">📊 Найдено в <b style="color:var(--accent);">${databases.size}</b> базах</div>`;
  if (items.length > 1) html += `<button class="btn secondary" onclick="copyAllResults('${targetId}')" style="margin-bottom:12px;">📄 Копировать все записи (${items.length})</button>`;
  const fieldOrder = ['ФИО', 'ИМЯ', 'ДАТА РОЖДЕНИЯ', 'ДР', 'ТЕЛЕФОН', 'ПОЧТА', 'EMAIL', 'ПАСПОРТ', 'АДРЕС', 'ИНН', 'СНИЛС', 'VK', 'FB', 'TG', 'OK', 'INSTAGRAM', 'БАНК', 'КАРТА'];
  function sortKeys(obj) { return Object.keys(obj).sort((a, b) => { const ia = fieldOrder.findIndex(x => String(a).toUpperCase().includes(x)); const ib = fieldOrder.findIndex(x => String(b).toUpperCase().includes(x)); if (ia === -1 && ib === -1) return String(a).localeCompare(String(b)); if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib; }); }
  if (!window._extendedResults) window._extendedResults = {};
  window._extendedResults[targetId] = [];
  items.forEach((item, idx) => {
    const cleanItem = {}; Object.entries(item).forEach(([k, v]) => { if (v === null || v === undefined || v === '') return; if (k === 'database') return; cleanItem[k] = v; });
    if (Object.keys(cleanItem).length === 0) return;
    window._extendedResults[targetId][idx] = cleanItem;
    let mainName = cleanItem['ФИО'] || cleanItem['ИМЯ'] || '';
    if (!mainName) { for (const [k, v] of Object.entries(cleanItem)) { const kl = String(k).toLowerCase(); if (kl.includes('фио') || kl.includes('имя')) { mainName = v; break; } } }
    if (!mainName) mainName = `Запись #${idx + 1}`;
    const dbSource = item.database || '—';
    html += `<div class="result-card" style="margin-bottom:14px;"><div style="padding:12px 16px;background:linear-gradient(135deg, rgba(52,199,89,0.15), rgba(0,122,255,0.1));border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#34c759,#30b14e);color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;">${idx + 1}</div><div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:700;color:var(--text);">👤 ${esc(mainName)}</div><div style="font-size:11px;color:var(--text-mute);margin-top:2px;">🗄 ${esc(String(dbSource).slice(0, 60))}</div></div><button onclick="copyResultItem('${targetId}', ${idx})" style="background:var(--accent);border:none;border-radius:10px;color:white;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;">📋</button></div><div style="padding:0;">`;
    sortKeys(cleanItem).forEach(field => {
      const value = cleanItem[field];
      let display = esc(String(value));
      if (/^https?:\/\//.test(String(value))) display = `<a href="${esc(value)}" target="_blank" style="color:var(--accent);text-decoration:none;word-break:break-all;">${esc(value)}</a>`;
      else if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(String(value))) display = `<a href="mailto:${esc(value)}" style="color:var(--accent);text-decoration:none;">${esc(value)}</a>`;
      else if (/^\+?\d{10,15}$/.test(String(value).replace(/\D/g, '')) && String(value).replace(/\D/g, '').length >= 10) { const digits = String(value).replace(/\D/g, ''); display = `<a href="tel:+${esc(digits)}" style="color:var(--accent);text-decoration:none;">${esc(value)}</a>`; }
      html += `<div style="display:flex;padding:10px 16px;border-bottom:0.5px solid var(--border-soft);gap:12px;"><div style="font-size:16px;flex-shrink:0;width:22px;text-align:center;">${fieldIcon(field)}</div><div style="flex:1;min-width:0;"><div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600;margin-bottom:3px;">${esc(field)}</div><div style="font-size:14px;color:var(--text);word-break:break-word;">${display}</div></div></div>`;
    });
    html += `</div></div>`;
  });
  const el = document.getElementById(targetId); if (el) { el.innerHTML = html; vibrate(50); toast('✅ Найдено: ' + items.length, 'ok'); }
}
function copyResultItem(targetId, idx) { const data = window._extendedResults?.[targetId]?.[idx]; if (!data) { toast('❌ Нет данных', 'error'); return; } let text = ''; Object.entries(data).forEach(([k, v]) => { text += `${k}: ${v}\n`; }); copyToClipboard(text.trim()); }
function copyAllResults(targetId) { const all = window._extendedResults?.[targetId]; if (!all || !all.length) { toast('❌ Нет данных', 'error'); return; } let text = ''; all.forEach((item, idx) => { if (!item) return; text += `═══ ЗАПИСЬ #${idx + 1} ═══\n`; Object.entries(item).forEach(([k, v]) => { text += `${k}: ${v}\n`; }); text += '\n'; }); copyToClipboard(text.trim()); }

function renderTgProfile(r, query, targetId) {
  let html = `<div class="section-title" style="color:var(--green);">✅ Найдено: ${esc(query)}</div><div class="result-card" style="margin-bottom:12px;">`;
  if (r.telegram_id) html += `<div class="result-row"><div class="result-icon">🆔</div><div class="result-content"><div class="result-label">Telegram ID</div><div class="result-value mono accent">${esc(r.telegram_id)}</div></div></div>`;
  if (r.username) html += `<div class="result-row"><div class="result-icon">🔗</div><div class="result-content"><div class="result-label">Username</div><div class="result-value"><a href="https://t.me/${esc(r.username)}" target="_blank" style="color:var(--accent);text-decoration:none;">@${esc(r.username)}</a></div></div></div>`;
  if (r.phone) html += `<div class="result-row"><div class="result-icon">📞</div><div class="result-content"><div class="result-label">Телефон</div><div class="result-value mono">${esc(r.phone)}</div></div></div>`;
  html += `</div>`;
  const el = document.getElementById(targetId); if (el) { el.innerHTML = html; vibrate(50); toast('✅ Найдено', 'ok'); }
}

// ============================================================
// SEARCH SCREENS
// ============================================================
function renderPhoneFull() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">🔍 Полный пробив</div><div class="chart-wrap"><div class="field"><label class="field-label">Телефон, ФИО, email, паспорт</label><input type="text" class="field-input" id="pf-query" placeholder="79939999985"></div><button class="btn" id="pf-btn">🔍 Пробить</button></div><div id="pf-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('pf-btn').addEventListener('click', async () => {
    const query = ($('pf-query').value || '').trim();
    if (query.length < 3) { toast('Минимум 3 символа', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('pf-btn'); btn.disabled = true; btn.textContent = '⏳ Пробиваем...';
    $('pf-result').innerHTML = renderLoading();
    try {
      const data = await pubPost('/api/apisearch/search', { user_id: u.id, query, type: 'extended' });
      if (!data.success) { $('pf-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const items = data.results || [];
      if (!items.length) { $('pf-result').innerHTML = renderEmpty(`По запросу "${query}"`); return; }
      renderExtendedResults(items, query, 'pf-result');
    } catch(e) { $('pf-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '🔍 Пробить'; }
  });
}
function renderNameByPhone() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">📞 Поиск по номеру</div><div class="chart-wrap"><div class="field"><label class="field-label">Номер телефона</label><input type="tel" class="field-input" id="np-phone" placeholder="+79939999985"></div><button class="btn" id="np-btn" style="background:linear-gradient(135deg,#34c759,#30b14e);">📞 Узнать всё</button></div><div id="np-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('np-btn').addEventListener('click', async () => {
    const phone = ($('np-phone').value || '').trim();
    if (phone.replace(/\D/g, '').length < 10) { toast('Введите корректный номер', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('np-btn'); btn.disabled = true; btn.textContent = '⏳...';
    $('np-result').innerHTML = renderLoading();
    try {
      let clean = phone.replace(/\D/g, '');
      if (clean.startsWith('8') && clean.length === 11) clean = '7' + clean.slice(1);
      const data = await pubPost('/api/apisearch/search', { user_id: u.id, query: clean, type: 'extended' });
      if (!data.success) { $('np-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const items = data.results || [];
      if (!items.length) { $('np-result').innerHTML = renderEmpty(`По номеру ${clean}`); return; }
      renderExtendedResults(items, clean, 'np-result');
    } catch(e) { $('np-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '📞 Узнать всё'; }
  });
}
function renderVkSearch() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">🔵 Поиск ВКонтакте</div><div class="chart-wrap"><div class="field"><label class="field-label">VK ID, username или телефон</label><input type="text" class="field-input" id="vk-query" placeholder="durov"></div><button class="btn" id="vk-btn" style="background:linear-gradient(135deg,#0077FF,#00A3FF);">🔵 Найти</button></div><div id="vk-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('vk-btn').addEventListener('click', async () => {
    const query = ($('vk-query').value || '').trim();
    if (!query) { toast('Введите запрос', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('vk-btn'); btn.disabled = true; btn.textContent = '⏳...';
    $('vk-result').innerHTML = renderLoading('Ищем во ВКонтакте...');
    try {
      const data = await pubPost('/api/apisearch/vk_search', { user_id: u.id, query });
      if (!data.success) { $('vk-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const items = data.results || [];
      if (!items.length) { $('vk-result').innerHTML = renderEmpty('Не найдено в VK'); return; }
      let html = `<div class="section-title" style="color:var(--green);">✅ Найдено: ${items.length}</div>`;
      items.forEach((p, idx) => {
        const fields = Object.entries(p).filter(([k, v]) => v && !['photo', 'avatar', 'photo_url'].includes(k.toLowerCase()));
        const photo = p.photo || p.avatar || p.photo_url || '';
        const vkId = p['VK ID'] || p.vk_id || p.id || '';
        const vkUrl = vkId ? (String(vkId).startsWith('id') ? `https://vk.com/${vkId}` : `https://vk.com/id${vkId}`) : '';
        html += `<div class="result-card" style="margin-bottom:12px;"><div style="padding:16px;display:flex;gap:12px;">${photo ? `<img src="${esc(photo)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #0077FF;" onerror="this.style.display='none';">` : `<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#0077FF,#00A3FF);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:26px;">${idx+1}</div>`}<div style="flex:1;min-width:0;">${vkUrl ? `<a href="${esc(vkUrl)}" target="_blank" style="display:inline-block;font-size:13px;color:#0077FF;text-decoration:none;background:rgba(0,119,255,0.1);padding:4px 10px;border-radius:8px;font-weight:600;margin-bottom:8px;">🔗 Открыть VK</a>` : ''}${fields.map(([k, v]) => `<div style="display:flex;gap:8px;padding:4px 0;font-size:13px;border-bottom:0.5px solid var(--border-soft);"><span style="color:var(--text-mute);min-width:110px;flex-shrink:0;">${esc(k)}:</span><span style="color:var(--text);word-break:break-word;">${esc(v)}</span></div>`).join('')}</div></div></div>`;
      });
      $('vk-result').innerHTML = html; vibrate(50); toast('✅ Найдено: ' + items.length, 'ok');
    } catch(e) { $('vk-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '🔵 Найти'; }
  });
}
// ============================================================
// INSTAGRAM / TG / PHONE / BASE / USERNAME
// ============================================================
function renderInstagramSearch() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">📸 OSINT Instagram</div><div class="chart-wrap" style="background:linear-gradient(135deg, rgba(225,48,108,0.08), rgba(253,203,110,0.08)); border:1px solid rgba(225,48,108,0.2);"><div class="field"><label class="field-label">Instagram username, ID или телефон</label><input type="text" class="field-input" id="ig-query" placeholder="username или +79991234567" autocomplete="off"><div class="field-hint">Без @. Можно ввести телефон — попробуем найти связанный аккаунт</div></div><button class="btn" id="ig-btn" style="background:linear-gradient(135deg,#e1306c,#fd1d1d,#fcb045);">📸 Найти</button></div><div id="ig-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('ig-btn').addEventListener('click', async () => {
    const query = ($('ig-query').value || '').trim().replace('@', '');
    if (!query) { toast('Введите запрос', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('ig-btn'); btn.disabled = true; btn.textContent = '⏳ Ищем...';
    $('ig-result').innerHTML = renderLoading('Собираем данные из Instagram...');
    try {
      const data = await pubPost('/api/instagram/search', { user_id: u.id, query });
      if (!data.success) { $('ig-result').innerHTML = renderError(data.error || 'Не найдено'); return; }
      const r = data.result || {};
      let html = `<div class="section-title" style="color:var(--green);">✅ Найдено</div>`;
      if (r.avatar) html += `<div class="vk-card"><img class="vk-avatar" src="${esc(r.avatar)}" onerror="this.style.display='none';" /><div class="vk-info"><div class="vk-name">${esc(r.full_name || r.username || '—')}</div><div class="vk-meta">@${esc(r.username || '—')}</div>${r.is_private ? '<div class="vk-meta" style="color:var(--orange);">🔒 Закрытый профиль</div>' : ''}${r.is_verified ? '<div class="vk-meta" style="color:var(--accent);">✅ Верифицирован</div>' : ''}<a class="vk-link" href="https://instagram.com/${esc(r.username)}" target="_blank">🔗 Открыть Instagram</a></div></div>`;
      const fields = [['📝 Имя', r.full_name],['🔗 Username', r.username ? '@' + r.username : null],['🆔 ID', r.user_id],['📱 Телефон', r.phone],['📧 Email', r.email],['📊 Подписчики', r.followers ? formatNumber(r.followers) : null],['📊 Подписки', r.following ? formatNumber(r.following) : null],['📸 Публикаций', r.posts ? formatNumber(r.posts) : null],['📝 Bio', r.bio],['🌐 Сайт', r.website],['📍 Геолокация', r.location],['🔒 Тип профиля', r.is_private ? 'Закрытый' : 'Публичный'],['✅ Верификация', r.is_verified ? 'Да' : null],['📅 Дата регистрации', r.joined_date]].filter(([_, v]) => v);
      if (fields.length) { html += `<div class="result-card">`; fields.forEach(([label, value]) => { let display = esc(String(value)); if (label.includes('Сайт') && String(value).startsWith('http')) display = `<a href="${esc(value)}" target="_blank" style="color:var(--accent);">${esc(value)}</a>`; html += `<div class="result-row"><div class="result-content"><div class="result-label">${label}</div><div class="result-value">${display}</div></div></div>`; }); html += `</div>`; }
      if (r.related_accounts && r.related_accounts.length) { html += `<div class="section-title">👥 Связанные аккаунты</div><ul class="list">`; r.related_accounts.forEach(acc => { html += `<li class="list-item" onclick="window.open('${esc(acc.url)}','_blank')"><div class="list-icon">${esc(acc.icon || '👤')}</div><div class="list-content"><div class="list-title">${esc(acc.platform)}</div><div class="list-sub">${esc(acc.username || acc.url)}</div></div><div class="list-chevron">🔗</div></li>`; }); html += `</ul>`; }
      $('ig-result').innerHTML = html; vibrate(50); toast('✅ Найдено', 'ok');
    } catch(e) { $('ig-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '📸 Найти'; }
  });
}

function renderTgSearch() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">✈️ Поиск Telegram</div><div class="chart-wrap"><div class="field"><label class="field-label">ID, @username или телефон</label><input type="text" class="field-input" id="tg-query" placeholder="123456789"></div><button class="btn" id="tg-btn" style="background:linear-gradient(135deg,#0088cc,#00aaff);">✈️ Найти</button></div><div id="tg-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('tg-btn').addEventListener('click', async () => {
    const query = ($('tg-query').value || '').trim();
    if (query.length < 2) { toast('Введите запрос', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('tg-btn'); btn.disabled = true; btn.textContent = '⏳...';
    $('tg-result').innerHTML = renderLoading('Ищем в Telegram...');
    try {
      const data = await pubPost('/api/apisearch/tg_search', { user_id: u.id, query: query.replace('@','') });
      if (!data.success) { $('tg-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const r = data.result || {};
      if (!r.telegram_id && !r.username) { $('tg-result').innerHTML = renderEmpty('Не найдено'); return; }
      renderTgProfile(r, query, 'tg-result');
    } catch(e) { $('tg-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '✈️ Найти'; }
  });
}

function renderBaseChecker() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div class="section-title">📊 Чекер по базам</div><div class="chart-wrap"><div class="field"><label class="field-label">Запрос</label><input type="text" class="field-input" id="bc-query" placeholder="79939999985"></div><button class="btn" id="bc-btn" style="background:linear-gradient(135deg,#af52de,#ff2d55);">📊 Проверить</button></div><div id="bc-result"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('bc-btn').addEventListener('click', async () => {
    const query = ($('bc-query').value || '').trim();
    if (query.length < 3) { toast('Введите запрос', 'error'); return; }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('bc-btn'); btn.disabled = true; btn.textContent = '⏳...';
    $('bc-result').innerHTML = renderLoading('Сканируем базы...');
    try {
      const data = await pubPost('/api/apisearch/base_checker', { user_id: u.id, query });
      if (!data.success) { $('bc-result').innerHTML = renderError(data.error || 'Ошибка'); return; }
      const r = data.result || {}; const stats = r.stats || {};
      if (!r.found) { $('bc-result').innerHTML = `<div class="chart-wrap" style="text-align:center;"><div style="font-size:48px;margin-bottom:12px;">❌</div><div style="font-size:18px;font-weight:700;color:var(--red);">Не найдено</div></div>`; return; }
      const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
      let html = `<div class="chart-wrap" style="background:linear-gradient(135deg, rgba(52,199,89,0.15), rgba(0,0,0,0));border:1px solid rgba(52,199,89,0.3);text-align:center;"><div style="font-size:48px;">✅</div><div style="font-size:22px;font-weight:700;color:var(--green);">Найдено в ${entries.length} базах</div></div>`;
      entries.forEach(([name, count]) => { const percent = Math.round((count / entries[0][1]) * 100); html += `<div style="background:var(--bg-elev);border-radius:12px;padding:12px 14px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><div style="font-size:13px;">${esc(name)}</div><div style="font-size:13px;color:var(--accent);font-weight:700;">${count}</div></div><div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${percent}%;background:linear-gradient(90deg,var(--accent),var(--purple));"></div></div></div>`; });
      $('bc-result').innerHTML = html; vibrate(50);
    } catch(e) { $('bc-result').innerHTML = renderError('Ошибка: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = '📊 Проверить'; }
  });
}

function renderUsernameCheck() {
  contentWrap.innerHTML = `<div class="section-title">🌐 Проверка @username</div><div class="chart-wrap"><div class="field"><label class="field-label">Username (без @)</label><input type="text" class="field-input" id="uc-input" placeholder="username"></div><button class="btn" id="uc-btn">🌐 Проверить</button></div><div id="uc-results"></div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  $('uc-btn').addEventListener('click', async () => {
    const username = $('uc-input').value.trim().replace('@', '');
    if (username.length < 2) { toast('Введите username', 'error'); return; }
    const btn = $('uc-btn'); btn.disabled = true; btn.textContent = '⏳...';
    try {
      const data = await pubPost('/api/check_username', { username });
      if (!data.success) { toast('❌ ' + (data.error || 'Ошибка'), 'error'); return; }
      const results = data.results || [];
      $('uc-results').innerHTML = `<div class="section-title">Результаты</div><ul class="list">${results.map(r => { const icon = r.exists === true ? '✅' : (r.exists === false ? '❌' : '⚠️'); const statusText = r.exists === true ? 'Занят' : (r.exists === false ? 'Свободен' : 'Неизвестно'); return `<li class="list-item" onclick="window.open('${esc(r.url)}','_blank')"><div class="list-icon">${icon}</div><div class="list-content"><div class="list-title">${esc(r.name)}</div><div class="list-sub">${statusText}</div></div></li>`; }).join('')}</ul>`;
    } catch(e) { toast('Ошибка', 'error'); }
    finally { btn.disabled = false; btn.textContent = '🌐 Проверить'; }
  });
}

function renderPhoneCheck() {
  contentWrap.innerHTML = `<div class="section-title">📱 Проверка номера</div><div class="chart-wrap"><div class="field"><label class="field-label">Номер</label><input type="tel" class="field-input" id="pc-phone" placeholder="+37379055862"></div><button class="btn" id="pc-check">📱 Проверить</button></div><div id="pc-result"></div><button class="btn secondary" onclick="renderScreen('home')">← Назад</button>`;
  $('pc-check').addEventListener('click', async () => {
    const phone = $('pc-phone').value.trim(); if (!phone) { toast('Введите номер', 'error'); return; }
    const limitCheck = await checkAndUseRequest(); if (!limitCheck.ok) { showLimitModal(); return; }
    const btn = $('pc-check'); btn.disabled = true; btn.textContent = '⏳...';
    try { const data = await pubPost('/api/check_phone', { phone: phone }); if (!data.success) { toast(data.error || 'Ошибка', 'error'); return; } renderPhoneInfo(data.result); }
    catch(e) { toast('Ошибка сети', 'error'); }
    finally { btn.disabled = false; btn.textContent = '📱 Проверить'; }
  });
}
function analyzePhoneNumber(phone) { let clean = phone.replace(/[\s\-\(\)\.]/g, ''); if (clean.startsWith('+')) clean = clean.slice(1); if (clean.length === 11 && clean.startsWith('8')) clean = '7' + clean.slice(1); const countries = { '992': { country: 'Таджикистан', flag: '🇹🇯', region: 'Таджикистан', tz: 'UTC+5', type: 'Мобильный', lat: 38.8610, lon: 71.2761, operators: { '90': 'Beeline TJ', '91': 'Beeline TJ', '92': 'Megafon TJ', '50': 'Tcell', '55': 'Tcell', '77': 'Tcell', '88': 'Tcell', '98': 'Babilon', '99': 'Babilon' } }, '998': { country: 'Узбекистан', flag: '🇺🇿', region: 'Узбекистан', tz: 'UTC+5', type: 'Мобильный', lat: 41.3775, lon: 64.5853, operators: {} }, '7': { country: 'Россия', flag: '🇷🇺', region: 'Россия', tz: 'UTC+3', type: 'Мобильный', lat: 55.7558, lon: 37.6173, operators: { '900': 'Beeline', '901': 'Beeline', '902': 'MegaFon', '903': 'Beeline', '905': 'Beeline', '906': 'Beeline', '909': 'MegaFon', '910': 'MegaFon', '911': 'MegaFon', '912': 'MegaFon', '913': 'MegaFon', '914': 'MegaFon', '915': 'MegaFon', '916': 'MegaFon', '917': 'MegaFon', '918': 'MegaFon', '919': 'MegaFon', '950': 'Tele2', '951': 'Tele2', '952': 'Tele2', '958': 'Tele2', '960': 'Beeline', '961': 'Beeline', '962': 'Beeline', '963': 'Beeline', '964': 'Beeline', '965': 'Beeline', '966': 'Beeline', '967': 'Beeline', '968': 'Beeline', '969': 'Beeline', '980': 'MTS', '981': 'MTS', '982': 'MTS', '983': 'MTS', '984': 'MTS', '985': 'MTS', '986': 'MTS', '987': 'MTS', '988': 'MTS', '989': 'MTS', '995': 'MTS', '996': 'MTS', '997': 'MTS', '999': 'MTS' } } }; let countryInfo = null, len = 0; for (let l = 3; l >= 1; l--) { const prefix = clean.slice(0, l); if (countries[prefix]) { countryInfo = countries[prefix]; len = l; break; } } if (!countryInfo) return { phone, country: 'Неизвестно', flag: '🏴', region: '—', operator: '—', tz: '—', type: 'Неизвестно' }; let operator = '—'; if (countryInfo.operators) { const after = clean.slice(len); for (let o = 3; o >= 2; o--) { if (countryInfo.operators[after.slice(0, o)]) { operator = countryInfo.operators[after.slice(0, o)]; break; } } } return { phone, country: countryInfo.country, flag: countryInfo.flag, region: countryInfo.region, operator, tz: countryInfo.tz, type: countryInfo.type, lat: countryInfo.lat, lon: countryInfo.lon }; }
function renderPhoneInfo(info) {
  const phone = info.phone || ''; const clean = phone.replace(/\D/g, ''); const result = $('pc-result'); if (!result) return;
  const hasCoords = info.lat && info.lon && info.lat !== 0;
  const mapButton = hasCoords ? `<button class="btn" onclick="showPhoneMapCurrent()" style="margin-bottom:8px;">🗺 Показать на карте</button>` : '';
  const tgLink = info.telegram_link || (info.telegram_username ? `https://t.me/${info.telegram_username.replace('@', '')}` : `https://t.me/+${clean}`);
  const waLink = info.whatsapp_link || `https://wa.me/${clean}`;
  result.innerHTML = `<div class="section-title">📱 Информация</div><div class="result-card"><div class="result-row"><div class="result-icon">${I.phone}</div><div class="result-content"><div class="result-label">Номер</div><div class="result-value mono accent">${esc(phone)}</div></div></div><div class="result-row"><div class="result-icon">${I.globe}</div><div class="result-content"><div class="result-label">Страна</div><div class="result-value">${esc(info.flag || '')} ${esc(info.country || '—')}</div></div></div><div class="result-row"><div class="result-icon">${I.signal}</div><div class="result-content"><div class="result-label">Оператор</div><div class="result-value">${esc(info.operator || '—')}</div></div></div><div class="result-row"><div class="result-icon">${I.clock}</div><div class="result-content"><div class="result-label">Часовой пояс</div><div class="result-value">${esc(info.tz || '—')}</div></div></div><div class="result-row"><div class="result-icon">✈️</div><div class="result-content"><div class="result-label">Telegram</div><div class="result-value">${info.telegram_exists ? `✅ <a href="${tgLink}" target="_blank" style="color:var(--accent);">Открыть профиль</a>` : `⚠️ Наличие не подтверждено`}</div></div></div><div class="result-row"><div class="result-icon">💬</div><div class="result-content"><div class="result-label">WhatsApp</div><div class="result-value">${info.whatsapp_exists ? `✅ <a href="${waLink}" target="_blank" style="color:var(--accent);">Открыть чат</a>` : `❌ Не найден`}</div></div></div></div>${mapButton}`;
  window._lastPhoneInfo = info;
}
function showPhoneMap(info) { document.querySelectorAll('.modal-overlay').forEach(m => m.remove()); if (window._phoneMap) { window._phoneMap.remove(); window._phoneMap = null; } const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.id = 'phone-map-modal'; overlay.style.padding = '0'; overlay.style.alignItems = 'flex-end'; overlay.innerHTML = '<div style="background:var(--bg);width:100%;max-width:600px;border-radius:20px 20px 0 0;overflow:hidden;max-height:95vh;display:flex;flex-direction:column;"><div style="padding:16px 20px;border-bottom:0.5px solid var(--border-soft);"><div style="font-size:17px;font-weight:700;">' + esc(info.flag || '') + ' ' + esc(info.phone || '') + '</div><div style="font-size:13px;color:var(--text-mute);">' + esc(info.country || '') + '</div></div><div id="phone-map" style="height:340px;background:var(--bg-elev);"></div><div style="padding:16px 20px;"><button class="btn secondary" onclick="closePhoneMap()">Закрыть</button></div></div>'; document.body.appendChild(overlay); setTimeout(() => initPhoneMap(info.lat, info.lon, info), 150); }
function showPhoneMapCurrent() { if (window._lastPhoneInfo) showPhoneMap(window._lastPhoneInfo); }
function closePhoneMap() { const m = document.getElementById('phone-map-modal'); if (m) m.remove(); if (window._phoneMap) { window._phoneMap.remove(); window._phoneMap = null; } }
function initPhoneMap(lat, lon, info) { if (typeof L === 'undefined') return; const isDark = currentTheme === 'dark'; const mapEl = document.getElementById('phone-map'); if (!mapEl) return; const map = L.map('phone-map', { zoomControl: false, attributionControl: false, center: [lat, lon], zoom: 6, minZoom: 2, maxZoom: 18 }); const tileUrl = isDark ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'; L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map); L.control.zoom({ position: 'bottomright' }).addTo(map); const icon = L.divIcon({ className: '', html: '<div style="width:28px;height:28px;border-radius:50%;background:#007aff;border:3px solid white;box-shadow:0 3px 12px rgba(0,122,255,0.6);"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }); L.marker([lat, lon], { icon }).addTo(map).bindPopup('<b>' + esc(info.country || '') + '</b>').openPopup(); window._phoneMap = map; setTimeout(() => map.invalidateSize(), 250); }
// ============================================================
// 🔍 GLOBAL SEARCH
// ============================================================
async function handleSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  searchBtn.disabled = true;
  vibrate(10);
  try {
    const isId = /^\d{5,15}$/.test(q);
    const isUsername = /^@?[a-zA-Z][a-zA-Z0-9_]{2,31}$/.test(q) && !q.includes(' ') && !/^\+?\d/.test(q);
    const currentUser = getTelegramUser();
    if (isId || isUsername) {
      contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div>${renderLoading('Ищем в базе бота...')}`;
      try {
        const localData = await pubPost('/api/search_local', { query: q, viewer_id: currentUser ? currentUser.id : 0 });
        if (localData.success && localData.user) {
          renderScreen('profile', localData.user.user_id);
          if (currentUser) pubPost('/api/save_local_search', { user_id: currentUser.id, query: q, target_user_id: localData.user.user_id }).catch(() => {});
          return;
        }
      } catch (e) {}
      contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div>${renderLoading('Ищем в Telegram...')}`;
      try {
        const tgData = await pubPost('/api/search_telegram', { query: q });
        if (tgData.success && tgData.user_id) {
          renderScreen('profile', tgData.user_id);
          if (currentUser) pubPost('/api/save_local_search', { user_id: currentUser.id, query: q, target_user_id: tgData.user_id }).catch(() => {});
          toast('✅ Найдено в Telegram', 'ok'); return;
        }
      } catch (e) {}
      contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div><div class="chart-wrap" style="text-align:center;"><div style="font-size:48px;margin-bottom:12px;">🔍</div><div style="font-size:15px;font-weight:600;color:var(--text);">Нигде не найдено</div><div style="font-size:13px;color:var(--text-mute);margin-top:6px;">Ни в базе бота, ни в Telegram</div></div><button class="btn secondary" onclick="renderScreen('home')" style="margin-top:12px;">← На главную</button>`;
      return;
    }
    const limitCheck = await checkAndUseRequest();
    if (!limitCheck.ok) { showLimitModal(); return; }
    contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div>${renderLoading('Ищем по базам...')}`;
    const u = currentUser;
    if (!u) { contentWrap.innerHTML = renderError('Откройте через Telegram'); return; }
    if (isUsername) {
      try {
        const tgData = await pubPost('/api/apisearch/tg_search', { user_id: u.id, query: q.replace('@', '') });
        if (tgData.success && tgData.result && (tgData.result.telegram_id || tgData.result.username)) {
          contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div><div id="search-tg-result"></div><button class="btn secondary" onclick="renderScreen('home')" style="margin-top:12px;">← На главную</button>`;
          renderTgProfile(tgData.result, q, 'search-tg-result'); return;
        }
      } catch (e) {}
    }
    const data = await pubPost('/api/apisearch/search', { user_id: u.id, query: q, type: 'extended' });
    if (!data.success) { contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div>${renderError(data.error || 'Не найдено')}<button class="btn secondary" onclick="renderScreen('home')" style="margin-top:12px;">← На главную</button>`; return; }
    const items = data.results || [];
    if (!items.length) { contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div>${renderEmpty('Ничего не найдено')}<button class="btn secondary" onclick="renderScreen('home')" style="margin-top:12px;">← На главную</button>`; return; }
    contentWrap.innerHTML = `<div class="section-title">🔍 Поиск: ${esc(q)}</div><div id="search-ext-result"></div><button class="btn secondary" onclick="renderScreen('home')" style="margin-top:12px;">← На главную</button>`;
    renderExtendedResults(items, q, 'search-ext-result');
  } catch (e) { toast(e.message || 'Ошибка', 'error'); }
  finally { searchBtn.disabled = false; }
}

// ============================================================
// 📜 HISTORY
// ============================================================
async function renderSearchHistory() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  contentWrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div class="section-title" style="margin:0;">📜 История поисков (30 дней)</div><button onclick="clearAllHistory()" style="background:rgba(255,59,48,0.15);color:var(--red);border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">🗑 Очистить всё</button></div><div id="history-list">${renderLoading('Загружаем историю...')}</div><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
  try {
    const data = await pubGet('/api/history/' + u.id);
    if (!data.success) { setHTML('history-list', renderError(data.error || 'Ошибка')); return; }
    const items = data.items || [];
    if (!items.length) { setHTML('history-list', `<div class="chart-wrap" style="text-align:center;"><div style="font-size:48px;margin-bottom:12px;">📭</div><div style="font-size:15px;font-weight:600;color:var(--text);">История пуста</div></div>`); return; }
    const typeIcons = { 'extended': '🔍', 'vk': '🔵', 'tg': '✈️', 'base': '📊', 'phone': '📞', 'local': '🏠', 'comments': '🔎' };
    const typeLabels = { 'extended': 'Полный пробив', 'vk': 'Поиск VK', 'tg': 'Поиск Telegram', 'base': 'Чекер по базам', 'phone': 'Поиск по номеру', 'local': 'Поиск в базе бота', 'comments': 'Поиск по словам' };
    let html = '';
    items.forEach(item => {
      const icon = typeIcons[item.search_type] || '🔍'; const label = typeLabels[item.search_type] || item.search_type;
      const dateStr = formatTime(item.created_at); const q = item.query || '—'; const count = item.results_count || 0;
      const countColor = count > 0 ? 'var(--green)' : 'var(--text-mute)';
      html += `<div class="hist-item" style="position:relative;"><div onclick="openHistoryItem(${item.id})" style="cursor:pointer;padding-right:40px;"><div class="hist-top"><span>${icon} ${esc(label)}</span><span>${esc(dateStr)}</span></div><div class="hist-target" style="font-size:15px;font-weight:600;color:var(--text);word-break:break-all;">${esc(q)}</div><div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:12px;color:${countColor};">📊 Найдено: <b>${count}</b></span><span style="font-size:12px;color:var(--accent);">Открыть →</span></div></div><button onclick="deleteHistoryItem(${item.id}, event)" style="position:absolute;top:10px;right:10px;background:rgba(255,59,48,0.15);border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--red);cursor:pointer;font-size:16px;">🗑</button></div>`;
    });
    setHTML('history-list', html);
  } catch (e) { setHTML('history-list', renderError('Ошибка: ' + e.message)); }
}
async function deleteHistoryItem(itemId, event) {
  if (event) event.stopPropagation();
  const u = getTelegramUser(); if (!u) return;
  if (!confirm('Удалить эту запись из истории?')) return;
  try { const data = await pubPost('/api/history/delete', { user_id: u.id, item_id: itemId }); if (data.success) { toast('✅ Удалено', 'ok'); vibrate(30); renderScreen('history'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); }
  catch (e) { toast('❌ Ошибка сети', 'error'); }
}
async function clearAllHistory() {
  const u = getTelegramUser(); if (!u) return;
  if (!confirm('⚠️ Удалить ВСЮ историю поисков?\n\nЭто действие необратимо.')) return;
  try { const data = await pubPost('/api/history/clear', { user_id: u.id }); if (data.success) { toast('✅ История очищена', 'ok'); vibrate(50); renderScreen('history'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); }
  catch (e) { toast('❌ Ошибка сети', 'error'); }
}
async function openHistoryItem(itemId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">📜 Загрузка...</div><div class="modal-desc">Загружаю результат из истории</div><div style="text-align:center;padding:20px 0;"><div class="loading-bar" style="margin:0 auto;"></div></div>`);
  try {
    const data = await pubGet('/api/history/' + u.id + '/' + itemId);
    if (!data.success || !data.item) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Запись не найдена')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    const item = data.item; const results = item.results || []; const query = item.query || '';
    if (!results.length) { closeModal(); showModal(`<div class="modal-title">📜 ${esc(query)}</div><div class="modal-desc">Результатов нет</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    const searchType = item.search_type || 'extended';
    closeModal();
    if (searchType === 'local' && results[0] && results[0].user_id) { renderScreen('profile', results[0].user_id); return; }
    if (searchType === 'comments') { showCommentsHistory(results, query); return; }
    showExtendedHistory(results, query);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showExtendedHistory(results, query) {
  let html = `<div class="section-title" style="color:var(--green);">✅ Найдено: ${results.length}</div>`;
  results.forEach((item, idx) => {
    const cleanItem = {}; Object.entries(item).forEach(([k, v]) => { if (v === null || v === undefined || v === '') return; if (k === 'database') return; cleanItem[k] = v; });
    if (Object.keys(cleanItem).length === 0) return;
    let mainName = cleanItem['ФИО'] || cleanItem['ИМЯ'] || '';
    if (!mainName) { for (const [k, v] of Object.entries(cleanItem)) { const kl = String(k).toLowerCase(); if (kl.includes('фио') || kl.includes('имя')) { mainName = v; break; } } }
    if (!mainName) mainName = `Запись #${idx + 1}`;
    html += `<div class="result-card" style="margin-bottom:14px;"><div style="padding:12px 16px;background:linear-gradient(135deg, rgba(52,199,89,0.15), rgba(0,122,255,0.1));border-bottom:0.5px solid var(--border-soft);"><div style="font-size:15px;font-weight:700;color:var(--text);">👤 ${esc(mainName)}</div></div><div style="padding:0;">`;
    Object.entries(cleanItem).forEach(([field, value]) => {
      let display = esc(String(value));
      if (/^https?:\/\//.test(String(value))) display = `<a href="${esc(value)}" target="_blank" style="color:var(--accent);text-decoration:none;word-break:break-all;">${esc(value)}</a>`;
      html += `<div style="display:flex;padding:10px 16px;border-bottom:0.5px solid var(--border-soft);gap:12px;"><div style="flex:1;min-width:0;"><div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600;margin-bottom:3px;">${esc(field)}</div><div style="font-size:14px;color:var(--text);word-break:break-word;">${display}</div></div></div>`;
    });
    html += `</div></div>`;
  });
  showModal(`<div class="modal-title">📜 ${esc(query)}</div><div class="modal-desc" style="margin-bottom:16px;">Результат из истории</div><div style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${html}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
function showCommentsHistory(results, query) {
  const byUser = {}; results.forEach(item => { const uid = item.user_id; if (!byUser[uid]) byUser[uid] = { user_id: uid, first_name: item.first_name, last_name: item.last_name, username: item.username, messages: [] }; byUser[uid].messages.push(item); });
  let html = `<div class="section-title" style="color:var(--green);">✅ Найдено: ${results.length}</div>`;
  Object.values(byUser).forEach(user => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || `Пользователь ${user.user_id}`;
    const uname = user.username ? '@' + user.username : null;
    html += `<div class="result-card" style="margin-bottom:14px;"><div style="padding:12px 14px;background:var(--bg-elev);border-bottom:0.5px solid var(--border-soft);"><div style="font-size:14px;font-weight:600;color:var(--text);">${esc(name)}</div><div style="font-size:12px;color:var(--text-mute);margin-top:2px;">${uname ? esc(uname) + ' · ' : ''}ID: ${user.user_id}</div></div>`;
    user.messages.slice(0, 10).forEach(msg => { const chatTitle = esc(msg.chat_title || '—'); const text = esc(msg.message_text || ''); const date = esc((msg.message_date || '').slice(0, 16)); const link = msg.message_link || ''; let linkHtml = ''; if (link && !link.includes('/c/')) linkHtml = `<a href="${esc(link)}" target="_blank" style="display:inline-block;margin-top:6px;font-size:11px;color:var(--accent);text-decoration:none;background:rgba(0,122,255,0.1);padding:3px 10px;border-radius:6px;">🔗 Открыть</a>`; html += `<div style="padding:10px 14px;border-bottom:0.5px solid var(--border-soft);"><div style="font-size:12px;color:var(--accent);font-weight:600;margin-bottom:6px;">📌 ${chatTitle}</div><div style="font-size:13px;color:var(--text);line-height:1.5;">${text}</div><div style="font-size:11px;color:var(--text-mute);margin-top:4px;">${date}</div>${linkHtml}</div>`; });
    html += `</div>`;
  });
  showModal(`<div class="modal-title">📜 ${esc(query)}</div><div class="modal-desc" style="margin-bottom:16px;">Результат из истории</div><div style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${html}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}

// ============================================================
// 🔑 API TOKENS
// ============================================================
function renderApiBuy() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  const plans = [{ key: '100', label: '100 запросов', price: 1 },{ key: '500', label: '500 запросов', price: 4 },{ key: '1000', label: '1000 запросов', price: 7 },{ key: '5000', label: '5000 запросов', price: 30 }];
  contentWrap.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><button class="icon-btn" onclick="renderScreen('api-tokens')" style="color:var(--text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button><div class="section-title" style="margin:0;">➕ Купить API токен</div></div><div class="chart-wrap" style="background:linear-gradient(135deg, rgba(0,122,255,0.08), rgba(0,210,255,0.08)); border:1px solid rgba(0,122,255,0.2);"><div style="font-size:14px;color:var(--text-dim);line-height:1.5;">🔑 API токен даёт доступ к <b>публичному API</b> бота.<br>💰 Оплата через <b>OxaPay</b> (крипта/карты).<br>📅 Токен действует <b>30 дней</b>.</div></div><div class="section-title">📦 Выберите пакет</div><ul class="list">${plans.map(p => `<li class="list-item" onclick="buyApiToken('${p.key}', '${p.label}', ${p.price})"><div class="list-icon green">🔑</div><div class="list-content"><div class="list-title">${p.label}</div><div class="list-sub">${p.price} USD</div></div><div class="list-chevron">→</div></li>`).join('')}</ul><button class="btn secondary" onclick="renderScreen('api-tokens')">← К моим токенам</button>`;
}
async function deleteApiToken(token, event) {
  if (event) event.stopPropagation();
  const u = getTelegramUser(); if (!u) return;
  if (!confirm('⚠️ Удалить этот API токен?\n\nДействие необратимо.')) return;
  try { const data = await pubPost('/api/api_tokens/delete', { user_id: u.id, token: token }); if (data.success) { toast('✅ Токен удалён', 'ok'); vibrate(30); renderScreen('api-tokens'); } else toast('❌ ' + (data.error || 'Ошибка'), 'error'); }
  catch (e) { toast('❌ Ошибка сети', 'error'); }
}
async function buyApiToken(planKey, planLabel, priceUsd) {
  const u = getTelegramUser(); if (!u) return;
  vibrate(); showModal(`<div class="modal-title">🔑 ${esc(planLabel)}</div><div class="modal-desc">К оплате: <b>${priceUsd} USD</b></div><div style="text-align:center;padding:20px 0;"><div class="loading-bar" style="margin:0 auto;"></div></div>`);
  try {
    const data = await pubPost('/api/api_tokens/buy', { user_id: u.id, plan_key: planKey });
    if (!data.success) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Ошибка')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); showApiPaymentModal(data);
  } catch (e) { closeModal(); toast('Ошибка: ' + e.message, 'error'); }
}
function showApiPaymentModal(data) {
  const { invoice_id, pay_url, plan_label, amount_usd, plan_key } = data;
  showModal(`<div class="modal-title">🔑 Оплата API</div><div class="modal-desc">📦 ${esc(plan_label)}<br>💰 ${amount_usd} USD<br>📝 Счёт: <code style="font-size:11px;">${esc(invoice_id.slice(0, 16))}...</code></div><button class="btn" id="api-pay-btn">🏦 Оплатить</button><button class="btn" id="api-check-btn" style="background:var(--green);">✅ Я оплатил</button><button class="btn secondary" onclick="closeModal()">Отмена</button>`);
  setTimeout(() => {
    document.getElementById('api-pay-btn')?.addEventListener('click', () => { try { if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(pay_url); else window.open(pay_url, '_blank'); } catch (e) { window.open(pay_url, '_blank'); } });
    document.getElementById('api-check-btn')?.addEventListener('click', async function() {
      this.disabled = true; this.textContent = '⏳ Проверяем...';
      try {
        const res = await pubPost('/api/api_tokens/check_payment', { invoice_id: invoice_id, plan_key: plan_key });
        if (res.success && res.paid) {
          closeModal(); toast('✅ Токен активирован!', 'ok'); vibrate(50);
          showModal(`<div class="modal-title">✅ Токен активирован!</div><div class="modal-desc">🔑 Ваш токен:</div><div style="background:var(--bg-elev);border-radius:10px;padding:12px;font-family:monospace;font-size:12px;word-break:break-all;margin-bottom:12px;">${esc(res.token || '')}</div><div style="font-size:13px;color:var(--text-mute);margin-bottom:12px;">📦 Запросов: ${res.requests_total || 0}</div><button class="btn" onclick="copyToClipboard('${esc(res.token || '')}'); closeModal(); renderScreen('api-tokens');">📋 Скопировать и закрыть</button>`);
        } else { this.disabled = false; this.textContent = '✅ Я оплатил'; toast('⏳ Оплата ещё не поступила', 'error'); }
      } catch (e) { this.disabled = false; this.textContent = '✅ Я оплатил'; toast('Ошибка проверки', 'error'); }
    });
  }, 100);
}

// ============================================================
// 🤖 AI ASSISTANT
// ============================================================
let _aiChatHistory = [];
let _aiVoiceRecognition = null;

function renderAiAssistant() {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  try { const saved = localStorage.getItem('aa_ai_chat'); if (saved) _aiChatHistory = JSON.parse(saved).slice(-20); } catch(e) { _aiChatHistory = []; }
  contentWrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div class="section-title" style="margin:0;">🤖 AI Помощник «Марыям»</div><button onclick="clearAiChat()" style="background:rgba(255,59,48,0.15);color:var(--red);border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">🗑 Очистить</button></div><div id="ai-chat-container" style="display:flex;flex-direction:column;gap:10px;padding-bottom:130px;">${renderAiMessages()}</div><div style="position:fixed;bottom:calc(env(safe-area-inset-bottom, 0px) + 60px);left:0;right:0;padding:10px 16px;background:linear-gradient(180deg,transparent,var(--bg) 30%);z-index:50;"><div style="display:flex;gap:8px;align-items:flex-end;max-width:600px;margin:0 auto;"><button onclick="toggleAiVoice()" id="ai-voice-btn" style="width:44px;height:44px;border-radius:50%;background:var(--bg-elev);border:none;color:var(--accent);font-size:18px;flex-shrink:0;cursor:pointer;" title="Голосовой ввод">🎤</button><textarea id="ai-input" placeholder="Спросите что-нибудь..." style="flex:1;min-height:44px;max-height:120px;padding:12px 14px;background:var(--bg-elev);border:none;border-radius:14px;color:var(--text);font-family:inherit;font-size:15px;outline:none;resize:none;" rows="1"></textarea><button onclick="sendAiMessage()" id="ai-send-btn" style="width:44px;height:44px;border-radius:50%;background:var(--accent);border:none;color:white;font-size:18px;flex-shrink:0;cursor:pointer;" title="Отправить">➤</button></div><div style="text-align:center;font-size:11px;color:var(--text-mute);margin-top:6px;">AI может ошибаться. Проверяйте важное.</div></div>`;
  const container = document.getElementById('ai-chat-container');
  setTimeout(() => { container?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);
  const input = document.getElementById('ai-input');
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } });
  input?.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
  if (_aiChatHistory.length === 0) {
    const examples = ['Как пробить человека по номеру?', 'Что такое API токен?', 'Как купить подписку?', 'Расскажи о боте'];
    setTimeout(() => {
      const c = document.getElementById('ai-chat-container');
      if (c && _aiChatHistory.length === 0) {
        c.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-mute);"><div style="font-size:48px;margin-bottom:12px;">🤖</div><div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px;">Привет! Я Марыям</div><div style="font-size:13px;margin-bottom:16px;">Задайте вопрос или выберите пример:</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">${examples.map(ex => `<button onclick="askAiExample('${esc(ex)}')" style="background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:14px;padding:10px 14px;color:var(--text);font-size:13px;cursor:pointer;text-align:left;">${esc(ex)}</button>`).join('')}</div></div>`;
      }
    }, 50);
  }
}
function renderAiMessages() {
  if (!_aiChatHistory.length) return '';
  return _aiChatHistory.map(msg => {
    const isUser = msg.role === 'user';
    return `<div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};"><div style="max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.4;word-break:break-word;${isUser ? 'background:var(--accent);color:white;border-bottom-right-radius:4px;' : 'background:var(--bg-elev);color:var(--text);border-bottom-left-radius:4px;'}">${isUser ? esc(msg.content) : formatAiAnswer(msg.content)}</div></div>`;
  }).join('');
}
function formatAiAnswer(text) { if (!text) return ''; let html = esc(text); html = html.replace(/\n/g, '<br>'); html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); html = html.replace(/\*(.+?)\*/g, '<i>$1</i>'); html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>'); return html; }
function askAiExample(text) { const input = document.getElementById('ai-input'); if (input) { input.value = text; sendAiMessage(); } }
async function sendAiMessage() {
  const u = getTelegramUser(); if (!u) return;
  const input = document.getElementById('ai-input'); const sendBtn = document.getElementById('ai-send-btn'); const question = input?.value.trim(); if (!question) return;
  _aiChatHistory.push({ role: 'user', content: question });
  input.value = ''; input.style.height = 'auto'; saveAiChat(); updateAiChatView();
  if (sendBtn) sendBtn.disabled = true;
  const container = document.getElementById('ai-chat-container');
  if (container) { const typing = document.createElement('div'); typing.id = 'ai-typing'; typing.style.cssText = 'display:flex;justify-content:flex-start;'; typing.innerHTML = `<div style="max-width:85%;padding:12px 18px;border-radius:16px;background:var(--bg-elev);color:var(--text-mute);border-bottom-left-radius:4px;"><span style="animation:blink 1.4s infinite;">●</span><span style="animation:blink 1.4s infinite 0.2s;">●</span><span style="animation:blink 1.4s infinite 0.4s;">●</span></div>`; container.appendChild(typing); container.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
  try {
    const history = _aiChatHistory.slice(0, -1);
    const data = await pubPost('/api/ai/chat', { user_id: u.id, question: question, history: history });
    document.getElementById('ai-typing')?.remove();
    if (data.success && data.answer) { _aiChatHistory.push({ role: 'assistant', content: data.answer }); saveAiChat(); updateAiChatView(); vibrate(30); }
    else { _aiChatHistory.push({ role: 'assistant', content: '❌ ' + (data.error || 'Не удалось получить ответ') }); updateAiChatView(); }
  } catch (e) { document.getElementById('ai-typing')?.remove(); _aiChatHistory.push({ role: 'assistant', content: '❌ Ошибка сети: ' + e.message }); updateAiChatView(); }
  finally { if (sendBtn) sendBtn.disabled = false; }
}
function updateAiChatView() { const container = document.getElementById('ai-chat-container'); if (!container) return; container.innerHTML = renderAiMessages(); container.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
function saveAiChat() { try { localStorage.setItem('aa_ai_chat', JSON.stringify(_aiChatHistory.slice(-20))); } catch(e) {} }
function clearAiChat() { if (!confirm('Очистить всю переписку с AI?')) return; _aiChatHistory = []; localStorage.removeItem('aa_ai_chat'); renderAiAssistant(); toast('✅ Очищено', 'ok'); }
function toggleAiVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { toast('❌ Голосовой ввод не поддерживается', 'error'); return; }
  const btn = document.getElementById('ai-voice-btn');
  if (_aiVoiceRecognition) { _aiVoiceRecognition.stop(); _aiVoiceRecognition = null; if (btn) { btn.style.background = 'var(--bg-elev)'; btn.style.color = 'var(--accent)'; } return; }
  const recognition = new SpeechRecognition(); recognition.lang = 'ru-RU'; recognition.interimResults = true; recognition.continuous = false;
  if (btn) { btn.style.background = 'var(--red)'; btn.style.color = 'white'; }
  recognition.onresult = (event) => { let transcript = ''; for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript; const input = document.getElementById('ai-input'); if (input) input.value = transcript; };
  recognition.onerror = () => { toast('❌ Ошибка распознавания', 'error'); _aiVoiceRecognition = null; if (btn) { btn.style.background = 'var(--bg-elev)'; btn.style.color = 'var(--accent)'; } };
  recognition.onend = () => { _aiVoiceRecognition = null; if (btn) { btn.style.background = 'var(--bg-elev)'; btn.style.color = 'var(--accent)'; } const input = document.getElementById('ai-input'); if (input && input.value.trim()) setTimeout(sendAiMessage, 300); };
  recognition.start(); _aiVoiceRecognition = recognition;
}
// ============================================================
// 👤 PROFILE
// ============================================================
async function renderProfile(userId) {
  contentWrap.innerHTML = '<div style="padding-top:40px;text-align:center;"><div class="loading-bar" style="margin:0 auto;"></div><div style="margin-top:16px;color:var(--text-mute);font-size:13px;">Загрузка профиля...</div></div>';
  try {
    const u = await apiGetUser(userId, 'all', 100);
    if (u.error) throw new Error(u.error);
    let me = { diamonds: '—', has_subscription: false, days_left: 0 };
    try { me = await pubGet('/api/me/' + userId); } catch (e) {}
    const fullName = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Без имени';
    const initials = (fullName[0] || '?').toUpperCase();
    const username = u.username ? '@' + u.username : null;
    const userPhone = u.phone || null;
    const tier = (u.started_bot || me.has_subscription) ? 'PREMIUM' : 'USER';
    const tierColor = (u.started_bot || me.has_subscription) ? 'var(--orange)' : 'var(--accent)';
    const chatsCount = (u.chats || []).length; const commentsCount = (u.comments || []).length;
    const wordsCount = (u.words || []).length; const namesCount = (u.name_history || []).length;
    const friendsCount = (u.friends || []).length; const changesCount = (u.profile_changes || []).length;
    const allChats = u.chats || [];
    const groups = allChats.filter(c => c.type === 'group' || c.type === 'supergroup');
    const channels = allChats.filter(c => c.type === 'channel');
    const chatsBlock = (groups.length || channels.length) ? `
      ${groups.length ? `<div class="section-title">👥 Группы (${groups.length})</div><div class="card-grid">${groups.slice(0, 4).map((c, idx) => { let link = c.link || ''; if (!link && c.chat_id) link = chatLinkFromId(c.chat_id) || ''; const colors = ['blue', 'purple', 'green', 'orange']; const color = colors[idx % colors.length]; return `<div class="card-tile" ${link ? `onclick="window.open('${esc(link)}','_blank')"` : ''}><div class="tile-avatar ${color}">💬</div><div class="tile-info"><div class="tile-name">${esc(c.title || '—')}</div><div class="tile-sub">${link ? '🔗 Открыть' : '🔒 Приватный'}</div></div></div>`; }).join('')}</div>${groups.length > 4 ? `<button class="btn-show-all" onclick="showAllGroups(${u.user_id})">👥 Показать все группы (${groups.length})</button>` : ''}` : ''}
      ${channels.length ? `<div class="section-title">📢 Каналы (${channels.length})</div><div class="card-grid">${channels.slice(0, 4).map((c, idx) => { let link = c.link || ''; if (!link && c.chat_id) link = chatLinkFromId(c.chat_id) || ''; const colors = ['blue', 'purple', 'green', 'orange']; const color = colors[idx % colors.length]; return `<div class="card-tile" ${link ? `onclick="window.open('${esc(link)}','_blank')"` : ''}><div class="tile-avatar ${color}">📢</div><div class="tile-info"><div class="tile-name">${esc(c.title || '—')}</div><div class="tile-sub">${link ? '🔗 Открыть' : '🔒 Приватный'}</div></div></div>`; }).join('')}</div>${channels.length > 4 ? `<button class="btn-show-all" onclick="showAllChannels(${u.user_id})">📢 Показать все каналы (${channels.length})</button>` : ''}` : ''}` : '';
    const avatarBlock = `<div style="position:relative;width:96px;height:96px;margin:0 auto 16px;"><div id="profile-avatar-initials" style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#0a84ff,#bf5af2);color:white;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;box-shadow:0 8px 24px rgba(0,122,255,0.3);border:3px solid var(--bg);">${esc(initials)}</div><img id="profile-avatar-img" alt="" style="position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid var(--bg);box-shadow:0 8px 24px rgba(0,122,255,0.3);opacity:0;transition:opacity .25s;"></div>`;
    const balanceBlock = `<div style="background:var(--bg-elev);border-radius:14px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px;"><div style="font-size:24px;">💎</div><div style="flex:1;"><div style="font-size:13px;color:var(--text-mute);text-transform:uppercase;font-weight:600;">Баланс</div><div style="font-size:18px;color:var(--orange);font-weight:700;margin-top:2px;">${me.diamonds} алмазов</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;"><button class="btn-pair profile" onclick="showAiProfileSummary(${u.user_id})" type="button"><span>ПРОФИЛЬ</span><span class="icon-circle">🧠</span></button><button class="btn-pair sentiment" onclick="showAiProfileSentiment(${u.user_id})" type="button"><span>ЭМОЦИИ</span><span class="icon-circle">😊</span></button><button class="btn-pair language" onclick="showAiProfileLanguage(${u.user_id})" type="button"><span>ЯЗЫК</span><span class="icon-circle">🌐</span></button><button class="btn-pair similar" onclick="showSimilarUsers(${u.user_id})" type="button"><span>ПОХОЖИЕ</span><span class="icon-circle">👥</span></button><button class="btn-pair" onclick="showActivityChart(${u.user_id})" style="background:linear-gradient(135deg,#ff9500,#ff2d55);" type="button"><span>АКТИВНОСТЬ</span><span class="icon-circle">📊</span></button><button class="btn-pair refresh" onclick="refreshUserProfile(${u.user_id})" type="button"><span>ОБНОВИТЬ</span><span class="icon-circle">🔄</span></button></div>`;
    const namesBlock = (u.name_history && u.name_history.length) ? `<div class="section-title">📜 История имён (${namesCount})</div><ul class="list">${u.name_history.slice(0, 30).map(n => `<li class="list-item"><div class="list-icon purple">👤</div><div class="list-content"><div class="list-title">${esc(n.name || '—')}</div><div class="list-sub">${esc(n.date || '')}</div></div></li>`).join('')}</ul>` : '';
    const statsBlock = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0;"><div style="background:var(--bg-elev);border-radius:14px;padding:16px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--text);">${formatNumber(commentsCount)}</div><div style="font-size:10px;color:var(--text-mute);text-transform:uppercase;font-weight:600;">Сообщений</div></div><div style="background:var(--bg-elev);border-radius:14px;padding:16px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--text);">${formatNumber(chatsCount)}</div><div style="font-size:10px;color:var(--text-mute);text-transform:uppercase;font-weight:600;">Чатов</div></div><div style="background:var(--bg-elev);border-radius:14px;padding:16px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--text);">${formatNumber(wordsCount)}</div><div style="font-size:10px;color:var(--text-mute);text-transform:uppercase;font-weight:600;">Слов</div></div></div>`;
    const friendsBlock = (u.friends && u.friends.length) ? `<div class="section-title">👥 Знакомые (${friendsCount})</div><div class="card-grid">${u.friends.slice(0, 6).map((f, idx) => { const fname = f.name || `Пользователь ${f.id}`; const fusername = f.username ? `@${f.username}` : `ID: ${f.id}`; const flink = f.username ? `https://t.me/${f.username}` : `tg://user?id=${f.id}`; const colors = ['blue', 'purple', 'green', 'orange', 'pink']; const color = colors[idx % colors.length]; const initial = (fname[0] || '?').toUpperCase(); return `<div class="card-tile" onclick="window.open('${esc(flink)}','_blank')"><div class="tile-avatar ${color}">${esc(initial)}</div><div class="tile-info"><div class="tile-name">${esc(fname)}</div><div class="tile-sub">${esc(fusername)}</div></div></div>`; }).join('')}</div>${u.friends.length > 6 ? `<button class="btn-show-all" onclick="showAllFriends(${u.user_id})">👥 Показать все (${u.friends.length})</button>` : ''}` : '';
    const wordsBlock = (u.words && u.words.length) ? `<div class="section-title">🔤 Частые слова (${wordsCount})</div><div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:var(--bg-elev);border-radius:14px;margin-bottom:16px;">${u.words.slice(0, 50).map((w, idx) => { const size = idx < 5 ? '16px' : (idx < 15 ? '14px' : '12px'); const color = idx < 5 ? 'var(--accent)' : (idx < 15 ? 'var(--text)' : 'var(--text-mute)'); return `<span style="font-size:${size};color:${color};font-weight:${idx < 5 ? '700' : '500'};">${esc(w.word)}<span style="color:var(--text-mute);font-size:10px;margin-left:2px;">${w.count}</span></span>`; }).join('')}</div>` : '';
    const commentsBlock = (u.comments && u.comments.length) ? `<div class="section-title">💬 Сообщения (${commentsCount})</div><div style="margin-bottom:16px;">${u.comments.slice(0, 30).map(c => { const chatTitle = c.chat || '—'; const text = c.text || ''; const date = (c.date || '').slice(0, 16); let link = c.link || ''; const chatInfo = (u.chats || []).find(ch => ch.title === c.chat || String(ch.chat_id) === String(c.chat_id)); if (chatInfo && chatInfo.username) { const msgIdLink = (link.match(/\/(\d+)$/) || [])[1]; if (msgIdLink) link = 'https://t.me/' + chatInfo.username + '/' + msgIdLink; } const isPrivate = link.includes('/c/'); let linkHtml = ''; if (link && !isPrivate) linkHtml = `<a href="${esc(link)}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--accent);text-decoration:none;background:rgba(0,122,255,0.12);padding:5px 12px;border-radius:8px;font-weight:600;">🔗 Открыть</a>`; else if (isPrivate) linkHtml = `<button onclick="copyToClipboard('${esc(link)}')" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text-mute);background:var(--bg);border:1px solid var(--border-soft);padding:5px 12px;border-radius:8px;cursor:pointer;">🔒 Приватный</button>`; const msgId = 'msg_' + Math.random().toString(36).substr(2, 9); const textForAttr = esc(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); return `<div style="background:var(--bg-elev);border-radius:12px;padding:12px 14px;margin-bottom:8px;"><div style="font-size:12px;color:var(--accent);font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between;gap:8px;"><span>📌 ${esc(chatTitle)}</span><span style="color:var(--text-mute);font-weight:400;white-space:nowrap;">${esc(date)}</span></div><div id="${msgId}" style="font-size:13px;color:var(--text);line-height:1.5;word-break:break-word;">${esc(text)}</div><div id="${msgId}_translated" style="display:none;margin-top:8px;padding:8px 10px;background:rgba(52,199,89,0.08);border-left:3px solid var(--green);border-radius:6px;font-size:13px;color:var(--text);line-height:1.5;"></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">${linkHtml}<button onclick="translateMessage('${msgId}', this)" data-text="${textForAttr}" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--green);background:rgba(52,199,89,0.12);border:1px solid rgba(52,199,89,0.3);padding:5px 12px;border-radius:8px;cursor:pointer;font-weight:600;">🌍 Перевести</button></div></div>`; }).join('')}</div>` : '';
    const changesBlock = (u.profile_changes && u.profile_changes.length) ? `<div class="section-title">🔄 Изменения профиля (${changesCount})</div><ul class="list">${u.profile_changes.slice(0, 20).map(c => { const fieldNames = { 'first_name': 'Имя', 'last_name': 'Фамилия', 'username': 'Username', 'bio': 'Bio', 'phone': 'Телефон' }; const label = fieldNames[c.field] || c.field; return `<li class="list-item" style="display:block;"><div style="font-size:12px;color:var(--text-mute);margin-bottom:4px;">${esc(label)} · ${esc((c.date || '').slice(0, 16))}</div><div style="font-size:13px;color:var(--red);text-decoration:line-through;">❌ ${esc(c.old || '—')}</div><div style="font-size:13px;color:var(--green);font-weight:600;">✅ ${esc(c.new || '—')}</div></li>`; }).join('')}</ul>` : '';
    const actionsBlock = `<div class="section-title">Действия</div><button class="btn secondary" onclick="copyToClipboard('${u.user_id}')" style="margin-bottom:8px;">📋 Скопировать ID</button><button class="btn secondary" onclick="renderScreen('home')">← На главную</button>`;
    contentWrap.innerHTML = `<div style="position:relative;margin:-16px -16px 0;padding:32px 24px 24px;background:linear-gradient(180deg,${tier === 'PREMIUM' ? 'rgba(255,149,0,0.15)' : 'rgba(0,122,255,0.12)'} 0%,transparent 100%);text-align:center;"><button class="icon-btn" onclick="renderScreen('home')" style="position:absolute;left:8px;top:8px;color:var(--text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>${avatarBlock}<div style="font-size:24px;font-weight:700;color:var(--text);">${esc(fullName)}</div>${username ? `<div style="font-size:15px;color:var(--accent);margin-top:4px;">${esc(username)}</div>` : ''}<div style="font-size:13px;color:var(--text-mute);margin-top:6px;">ID: <code>${u.user_id}</code></div>${userPhone ? `<div style="font-size:13px;color:var(--text-mute);margin-top:4px;">📱 <code style="color:var(--orange);">${esc(userPhone)}</code></div>` : ''}<div style="display:inline-block;margin-top:10px;padding:4px 14px;background:${tierColor}20;color:${tierColor};border-radius:20px;font-size:11px;font-weight:700;">⚡ ${tier}</div></div>${balanceBlock}${statsBlock}${chatsBlock}${namesBlock}${friendsBlock}${wordsBlock}${commentsBlock}${changesBlock}${actionsBlock}`;
    loadProfileAvatar(u.user_id);
  } catch (e) {
    contentWrap.innerHTML = '<div style="padding-top:40px;text-align:center;"><div style="font-size:36px;">⚠️</div><div style="font-size:18px;font-weight:600;margin:12px 0 6px;">Не найдено</div><div style="font-size:14px;color:var(--text-mute);margin-bottom:24px;">' + esc(e.message) + '</div><button class="btn secondary" onclick="renderScreen(\'home\')">← На главную</button></div>';
  }
}

// ============================================================
// 🤖 AI FUNCTIONS
// ============================================================
async function showAiProfileSummary(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">🤖 AI-резюме О ЧЕЛОВЕКЕ</div><div class="modal-desc">Марыям анализирует профиль...</div><div style="text-align:center;padding:30px 0;"><div style="width:60px;height:60px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,#af52de,#0a84ff);display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite;">🤖</div><div class="loading-bar" style="margin:0 auto;"></div><div style="font-size:13px;color:var(--text-mute);margin-top:14px;">Анализирую сообщения...</div></div>`);
  try {
    const data = await pubPost('/api/ai/profile_summary', { user_id: userId });
    if (!data.success || !data.summary) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Не удалось создать резюме О ЧЕЛОВЕКЕ')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); vibrate(50); showAiSummaryModal(data.summary, userId);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка сети</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showAiSummaryModal(summary, userId) {
  window._lastAiSummary = summary; window._aiSummaryOriginal = summary;
  const renderContent = (text) => { let html = esc(text); html = html.replace(/\n/g, '<br>'); html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>'); return html; };
  showModal(`<div class="modal-title">🤖 AI-резюме профиля</div><div class="modal-desc" style="margin-bottom:12px;">Анализ от Марыям на основе сообщений пользователя</div><div id="summary-content" style="background:var(--bg-elev);border-radius:14px;padding:16px;font-size:14px;line-height:1.6;color:var(--text);max-height:50vh;overflow-y:auto;margin-bottom:12px;">${renderContent(summary)}</div><button class="btn" id="translate-toggle-btn" onclick="toggleTranslateBar()" style="background:linear-gradient(135deg,#34c759,#00b894);margin-bottom:8px;">🌍 ПЕРЕВЕСТИ</button><div id="translate-bar" style="display:none;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;"><button class="btn" onclick="translateSummary('ru')" style="background:linear-gradient(135deg,#0a84ff,#00c6ff);margin:0;padding:12px 6px;font-size:12px;">🇷🇺 РУС</button><button class="btn" onclick="translateSummary('tj')" style="background:linear-gradient(135deg,#34c759,#00b894);margin:0;padding:12px 6px;font-size:12px;">🇹🇯 ТАДЖ</button><button class="btn" onclick="translateSummary('en')" style="background:linear-gradient(135deg,#af52de,#ff2d55);margin:0;padding:12px 6px;font-size:12px;">🇬🇧 ENG</button></div><button class="btn secondary" onclick="copyLastAiSummary()" style="margin-bottom:8px;">📋 Скопировать резюме</button><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
function copyLastAiSummary() { const text = window._lastAiSummary || ''; if (!text) { toast('❌ Нет текста', 'error'); return; } copyToClipboard(text); }
function toggleTranslateBar() { const bar = document.getElementById('translate-bar'); const btn = document.getElementById('translate-toggle-btn'); if (!bar) return; if (bar.style.display === 'none' || !bar.style.display) { bar.style.display = 'grid'; btn.textContent = '🌍 ВЫБЕРИТЕ ЯЗЫК'; btn.style.opacity = '0.7'; } else { bar.style.display = 'none'; btn.textContent = '🌍 ПЕРЕВЕСТИ'; btn.style.opacity = '1'; } }
async function translateSummary(lang) {
  const contentEl = document.getElementById('summary-content'); if (!contentEl) return;
  vibrate(20);
  const langNames = { 'ru': 'РУССКИЙ', 'tj': 'ТАДЖИКСКИЙ', 'en': 'ENGLISH' };
  const renderContent = (text) => { let html = esc(text); html = html.replace(/\n/g, '<br>'); html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>'); return html; };
  const originalText = contentEl.innerHTML;
  contentEl.innerHTML = '<div style="text-align:center;padding:20px 0;"><div class="loading-bar" style="margin:0 auto;"></div><div style="font-size:12px;color:var(--text-mute);margin-top:10px;">Перевожу на ' + langNames[lang] + '...</div></div>';
  try {
    if (lang === 'ru') { contentEl.innerHTML = renderContent(window._aiSummaryOriginal); window._lastAiSummary = window._aiSummaryOriginal; toast('✅ Показан оригинал', 'ok'); vibrate(30); return; }
    const data = await pubPost('/api/ai/translate', { text: window._aiSummaryOriginal, target_lang: lang });
    if (!data.success || !data.translated) { contentEl.innerHTML = originalText; toast('❌ ' + (data.error || 'Не удалось перевести'), 'error'); return; }
    contentEl.innerHTML = renderContent(data.translated); window._lastAiSummary = data.translated; vibrate(30); toast('✅ Переведено на ' + langNames[lang], 'ok');
  } catch (e) { contentEl.innerHTML = originalText; toast('❌ Ошибка: ' + e.message, 'error'); }
}
async function showAiProfileSentiment(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">😊 Анализ Психология</div><div class="modal-desc">Марыям анализирует эмоции в сообщениях...</div><div style="text-align:center;padding:30px 0;"><div style="width:60px;height:60px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,#ff9500,#ff2d55);display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite;">😊</div><div class="loading-bar" style="margin:0 auto;"></div><div style="font-size:13px;color:var(--text-mute);margin-top:14px;">Анализирую эмоции...</div></div>`);
  try {
    const data = await pubPost('/api/ai/profile_sentiment', { user_id: userId });
    if (!data.success || !data.sentiment) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Не удалось определить психология')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); vibrate(50); showSentimentModal(data.sentiment);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка сети</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showSentimentModal(s) {
  const overallEmoji = { 'positive': '😊', 'neutral': '😐', 'negative': '😡', 'mixed': '🎭' };
  const overallLabel = { 'positive': 'Преимущественно позитив', 'neutral': 'Преимущественно нейтрально', 'negative': 'Преимущественно негатив', 'mixed': 'Смешанные эмоции' };
  const overallColor = { 'positive': 'var(--green)', 'neutral': 'var(--text-mute)', 'negative': 'var(--red)', 'mixed': 'var(--orange)' };
  const emoji = overallEmoji[s.overall] || '😐'; const label = overallLabel[s.overall] || 'Нейтрально'; const color = overallColor[s.overall] || 'var(--text)';
  const positive = s.positive || 0; const neutral = s.neutral || 0; const negative = s.negative || 0;
  showModal(`<div class="modal-title">😊 психология сообщений</div><div class="modal-desc" style="margin-bottom:16px;">Эмоциональный окрас последних 50 сообщений</div><div style="text-align:center;padding:20px 0;border-radius:14px;background:var(--bg-elev);margin-bottom:16px;"><div style="font-size:56px;margin-bottom:8px;">${emoji}</div><div style="font-size:18px;font-weight:700;color:${color};">${label}</div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;"><div style="background:rgba(52,199,89,0.12);border-radius:12px;padding:14px 8px;text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--green);">${positive}%</div><div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600;margin-top:4px;">😊 Позитив</div></div><div style="background:rgba(142,142,147,0.12);border-radius:12px;padding:14px 8px;text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--text-mute);">${neutral}%</div><div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600;margin-top:4px;">😐 Нейтр.</div></div><div style="background:rgba(255,59,48,0.12);border-radius:12px;padding:14px 8px;text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--red);">${negative}%</div><div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600;margin-top:4px;">😡 Негатив</div></div></div><div style="height:12px;border-radius:6px;overflow:hidden;display:flex;background:var(--bg-elev);margin-bottom:16px;"><div style="width:${positive}%;background:var(--green);"></div><div style="width:${neutral}%;background:var(--text-mute);"></div><div style="width:${negative}%;background:var(--red);"></div></div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
async function refreshUserProfile(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  try {
    const data = await pubPost('/api/user/refresh', { user_id: userId });
    if (!data.success) { toast('❌ ' + (data.error || 'Не удалось обновить'), 'error'); return; }
    toast('✅ Профиль обновлён!', 'ok'); vibrate(30); setTimeout(() => renderScreen('profile', userId), 300);
  } catch (e) { toast('❌ Ошибка: ' + e.message, 'error'); }
}
async function showAiProfileLanguage(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">🌐 Определение языка</div><div class="modal-desc">Марыям анализирует языки сообщений...</div><div style="text-align:center;padding:30px 0;"><div style="width:60px;height:60px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,#34c759,#00c6ff);display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite;">🌐</div><div class="loading-bar" style="margin:0 auto;"></div><div style="font-size:13px;color:var(--text-mute);margin-top:14px;">Анализирую языки...</div></div>`);
  try {
    const data = await pubPost('/api/ai/profile_language', { user_id: userId });
    if (!data.success || !data.language) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Не удалось определить язык')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); vibrate(50); showLanguageModal(data.language);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка сети</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showLanguageModal(lang) {
  const langInfo = { 'ru': { flag: '🇷🇺', name: 'Русский' }, 'tj': { flag: '🇹🇯', name: 'Таджикский' }, 'en': { flag: '🇬🇧', name: 'English' }, 'uz': { flag: '🇺🇿', name: 'O\'zbek' }, 'other': { flag: '🌍', name: 'Другой' } };
  const primary = langInfo[lang.primary] || { flag: '🌍', name: 'Другой' };
  const langs = ['ru', 'tj', 'en', 'uz', 'other'].filter(k => (lang[k] || 0) > 0);
  let langRows = '';
  langs.forEach(key => { const info = langInfo[key]; const pct = lang[key] || 0; langRows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid var(--border-soft);"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">${info.flag}</span><span style="font-size:15px;color:var(--text);">${info.name}</span></div><div style="display:flex;align-items:center;gap:10px;"><div style="width:80px;height:6px;background:var(--bg-elev);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#34c759,#00c6ff);"></div></div><span style="font-size:14px;font-weight:700;color:var(--accent);min-width:40px;text-align:right;">${pct}%</span></div></div>`; });
  showModal(`<div class="modal-title">🌐 Язык общения</div><div class="modal-desc" style="margin-bottom:16px;">Анализ последних 50 сообщений</div><div style="text-align:center;padding:20px 0;border-radius:14px;background:var(--bg-elev);margin-bottom:16px;"><div style="font-size:56px;margin-bottom:8px;">${primary.flag}</div><div style="font-size:18px;font-weight:700;color:var(--text);">${primary.name}</div><div style="font-size:13px;color:var(--text-mute);margin-top:4px;">Основной язык общения</div></div><div style="margin-bottom:16px;">${langRows}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
async function translateMessage(msgId, btn) {
  const msgEl = document.getElementById(msgId); const transEl = document.getElementById(msgId + '_translated');
  if (!msgEl || !transEl) return;
  if (document.getElementById('lang-picker-' + msgId)) { document.getElementById('lang-picker-' + msgId).remove(); return; }
  if (transEl.style.display === 'block') { transEl.style.display = 'none'; btn.textContent = '🌍 Перевести'; return; }
  showLanguagePicker(msgId, btn, transEl);
}
function showLanguagePicker(msgId, btn, transEl) {
  const old = document.getElementById('lang-picker-' + msgId); if (old) old.remove();
  const picker = document.createElement('div'); picker.id = 'lang-picker-' + msgId; picker.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;';
  const langs = [{ code: 'ru', flag: '🇷🇺', name: 'РУС', color: 'linear-gradient(135deg,#0a84ff,#00c6ff)' },{ code: 'tj', flag: '🇹🇯', name: 'ТАДЖ', color: 'linear-gradient(135deg,#34c759,#00b894)' },{ code: 'en', flag: '🇬🇧', name: 'ENG', color: 'linear-gradient(135deg,#af52de,#ff2d55)' }];
  langs.forEach(l => { const langBtn = document.createElement('button'); langBtn.textContent = l.flag + ' ' + l.name; langBtn.style.cssText = 'padding:6px 12px;border-radius:8px;border:none;color:white;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;background:' + l.color + ';box-shadow:0 3px 10px rgba(0,0,0,0.2);'; langBtn.addEventListener('click', async () => { picker.remove(); await doTranslate(msgId, btn, transEl, l.code); }); picker.appendChild(langBtn); });
  btn.parentNode.appendChild(picker);
}
async function doTranslate(msgId, btn, transEl, targetLang) {
  const msgEl = document.getElementById(msgId); if (!msgEl) return;
  const text = btn.dataset.text || msgEl.textContent; if (!text.trim()) { toast('❌ Пустое сообщение', 'error'); return; }
  const langNames = { 'ru': 'Русский', 'tj': 'Таджикский', 'en': 'English' };
  const originalText = btn.textContent; btn.disabled = true; btn.textContent = '⏳ Перевожу...';
  try {
    const data = await pubPost('/api/ai/translate', { text: text, target_lang: targetLang });
    if (!data.success || !data.translated) { btn.disabled = false; btn.textContent = originalText; toast('❌ ' + (data.error || 'Не удалось перевести'), 'error'); return; }
    transEl.innerHTML = '🌍 <b>' + langNames[targetLang] + ':</b><br>' + esc(data.translated).replace(/\n/g, '<br>');
    transEl.style.display = 'block'; btn.textContent = '🌍 Скрыть перевод'; btn.disabled = false; vibrate(20);
  } catch (e) { btn.disabled = false; btn.textContent = originalText; toast('❌ Ошибка: ' + e.message, 'error'); }
}
async function showSimilarUsers(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">👥 Похожие пользователи</div><div class="modal-desc">Марыям ищет людей с похожими интересами...</div><div style="text-align:center;padding:30px 0;"><div style="width:60px;height:60px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,#0a84ff,#bf5af2);display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite;">👥</div><div class="loading-bar" style="margin:0 auto;"></div><div style="font-size:13px;color:var(--text-mute);margin-top:14px;">Ищу совпадения...</div></div>`);
  try {
    const data = await pubPost('/api/ai/similar_users', { user_id: userId, limit: 15 });
    if (!data.success) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Не удалось найти')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    const users = data.users || [];
    if (!users.length) { closeModal(); showModal(`<div class="modal-title">👥 Похожие пользователи</div><div class="modal-desc">Пока никого не найдено</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); vibrate(50); showSimilarUsersModal(users, userId);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка сети</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showSimilarUsersModal(users, targetId) {
  const rows = users.map((usr, idx) => {
    const name = `${usr.first_name} ${usr.last_name}`.trim() || `Пользователь ${usr.user_id}`;
    const uname = usr.username ? `@${usr.username}` : '';
    const profileLink = usr.username ? `https://t.me/${usr.username}` : `tg://user?id=${usr.user_id}`;
    const scoreColor = usr.similarity >= 70 ? 'var(--green)' : usr.similarity >= 40 ? 'var(--orange)' : 'var(--text-mute)';
    const wordsHtml = usr.common_words.length ? usr.common_words.slice(0, 3).map(w => `<span style="background:rgba(0,122,255,0.12);color:var(--accent);padding:2px 8px;border-radius:6px;font-size:11px;">${esc(w)}</span>`).join(' ') : '<span style="font-size:11px;color:var(--text-mute);">нет общих слов</span>';
    return `<div style="background:var(--bg-elev);border-radius:12px;padding:12px 14px;margin-bottom:8px;border-left:3px solid ${scoreColor};"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;"><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;color:var(--text);word-break:break-word;">${esc(name)}</div><div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${uname ? esc(uname) + ' · ' : ''}ID: ${usr.user_id}</div></div><div style="text-align:right;flex-shrink:0;"><div style="font-size:18px;font-weight:700;color:${scoreColor};">${usr.similarity}%</div><div style="font-size:9px;color:var(--text-mute);text-transform:uppercase;">схожесть</div></div></div><div style="font-size:11px;color:var(--text-mute);margin-bottom:6px;">💬 ${usr.common_chats} общих чатов</div><div style="margin-bottom:8px;">${wordsHtml}</div><a href="${esc(profileLink)}" target="_blank" style="display:inline-block;font-size:11px;color:var(--accent);text-decoration:none;background:rgba(0,122,255,0.1);padding:5px 12px;border-radius:8px;font-weight:600;">👤 Открыть профиль</a></div>`;
  }).join('');
  showModal(`<div class="modal-title">👥 Похожие пользователи</div><div class="modal-desc" style="margin-bottom:16px;">Найдено ${users.length} совпадений</div><div style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${rows}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
async function showActivityChart(userId) {
  const u = getTelegramUser(); if (!u) { toast('Откройте через Telegram', 'error'); return; }
  vibrate();
  showModal(`<div class="modal-title">📊 График активности</div><div class="modal-desc">Анализирую сообщения...</div><div style="text-align:center;padding:30px 0;"><div style="width:60px;height:60px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,#ff9500,#ff2d55);display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite;">📊</div><div class="loading-bar" style="margin:0 auto;"></div></div>`);
  try {
    const data = await pubPost('/api/ai/activity_chart', { user_id: userId, limit: 200 });
    if (!data.success) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(data.error || 'Не удалось')}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); return; }
    closeModal(); vibrate(50); showActivityModal(data);
  } catch (e) { closeModal(); showModal(`<div class="modal-title">❌ Ошибка</div><div class="modal-desc">${esc(e.message)}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
}
function showActivityModal(data) {
  const hours = data.hours || []; const days = data.days || []; const maxHour = Math.max(...hours, 1); const maxDay = Math.max(...days, 1);
  let hoursHtml = '';
  for (let h = 0; h < 24; h++) { const val = hours[h] || 0; const pct = Math.round((val / maxHour) * 100); const isPeak = h === data.peak_hour; const color = isPeak ? 'linear-gradient(90deg,#ff9500,#ff2d55)' : 'linear-gradient(90deg,#0a84ff,#00c6ff)'; hoursHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><div style="font-size:10px;color:var(--text-mute);width:40px;text-align:right;">${String(h).padStart(2, '0')}:00</div><div style="flex:1;height:14px;background:var(--bg);border-radius:7px;overflow:hidden;"><div style="height:100%;width:${Math.max(pct, 2)}%;background:${color};border-radius:7px;"></div></div><div style="font-size:10px;color:var(--text);width:30px;font-weight:${isPeak ? '700' : '400'};">${val}</div></div>`; }
  const daysNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  let daysHtml = '';
  for (let d = 0; d < 7; d++) { const val = days[d] || 0; const pct = Math.round((val / maxDay) * 100); const isPeak = d === data.peak_day; const color = isPeak ? 'linear-gradient(90deg,#ff9500,#ff2d55)' : 'linear-gradient(90deg,#34c759,#00b894)'; daysHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><div style="font-size:11px;color:var(--text-mute);width:30px;text-align:right;">${daysNames[d]}</div><div style="flex:1;height:14px;background:var(--bg);border-radius:7px;overflow:hidden;"><div style="height:100%;width:${Math.max(pct, 2)}%;background:${color};border-radius:7px;"></div></div><div style="font-size:10px;color:var(--text);width:30px;font-weight:${isPeak ? '700' : '400'};">${val}</div></div>`; }
  showModal(`<div class="modal-title">📊 График активности</div><div class="modal-desc" style="margin-bottom:12px;">Анализ последних ${data.total} сообщений</div><div style="background:var(--bg-elev);border-radius:12px;padding:14px;margin-bottom:12px;"><div style="font-size:14px;font-weight:700;color:var(--orange);margin-bottom:4px;">🎯 Тип: ${esc(data.user_type)}</div><div style="font-size:12px;color:var(--text-mute);">Пик: <b style="color:var(--accent);">${String(data.peak_hour).padStart(2, '0')}:00</b> · День: <b style="color:var(--accent);">${esc(data.peak_day_name)}</b></div></div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">🕐 По часам</div><div style="max-height:220px;overflow-y:auto;margin-bottom:14px;">${hoursHtml}</div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">📅 По дням недели</div><div style="margin-bottom:14px;">${daysHtml}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`);
}
async function showAllFriends(userId) { const data = await apiGetUser(userId, 'all', 100); const friends = data.friends || []; const rows = friends.map((f, idx) => { const fname = f.name || `Пользователь ${f.id}`; const fusername = f.username ? `@${f.username}` : `ID: ${f.id}`; const flink = f.username ? `https://t.me/${f.username}` : `tg://user?id=${f.id}`; const colors = ['blue', 'purple', 'green', 'orange', 'pink']; const color = colors[idx % colors.length]; const initial = (fname[0] || '?').toUpperCase(); return `<div class="card-tile" onclick="window.open('${esc(flink)}','_blank')"><div class="tile-avatar ${color}">${esc(initial)}</div><div class="tile-info"><div class="tile-name">${esc(fname)}</div><div class="tile-sub">${esc(fusername)}</div></div></div>`; }).join(''); showModal(`<div class="modal-title">👥 Знакомые (${friends.length})</div><div class="modal-desc" style="margin-bottom:16px;">Все общие чаты</div><div class="card-grid" style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${rows}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
async function showAllGroups(userId) { const data = await apiGetUser(userId, 'all', 100); const chats = data.chats || []; const groups = chats.filter(c => c.type === 'group' || c.type === 'supergroup'); const rows = groups.map((c, idx) => { let link = c.link || ''; if (!link && c.chat_id) link = chatLinkFromId(c.chat_id) || ''; const colors = ['blue', 'purple', 'green', 'orange']; const color = colors[idx % colors.length]; return `<div class="card-tile" ${link ? `onclick="window.open('${esc(link)}','_blank')"` : ''}><div class="tile-avatar ${color}">💬</div><div class="tile-info"><div class="tile-name">${esc(c.title || '—')}</div><div class="tile-sub">${link ? '🔗 Открыть' : '🔒 Приватный'}</div></div></div>`; }).join(''); showModal(`<div class="modal-title">👥 Группы (${groups.length})</div><div class="modal-desc" style="margin-bottom:16px;">Все группы пользователя</div><div class="card-grid" style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${rows}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }
async function showAllChannels(userId) { const data = await apiGetUser(userId, 'all', 100); const chats = data.chats || []; const channels = chats.filter(c => c.type === 'channel'); const rows = channels.map((c, idx) => { let link = c.link || ''; if (!link && c.chat_id) link = chatLinkFromId(c.chat_id) || ''; const colors = ['blue', 'purple', 'green', 'orange']; const color = colors[idx % colors.length]; return `<div class="card-tile" ${link ? `onclick="window.open('${esc(link)}','_blank')"` : ''}><div class="tile-avatar ${color}">📢</div><div class="tile-info"><div class="tile-name">${esc(c.title || '—')}</div><div class="tile-sub">${link ? '🔗 Открыть' : '🔒 Приватный'}</div></div></div>`; }).join(''); showModal(`<div class="modal-title">📢 Каналы (${channels.length})</div><div class="modal-desc" style="margin-bottom:16px;">Все каналы пользователя</div><div class="card-grid" style="max-height:60vh;overflow-y:auto;margin-bottom:12px;">${rows}</div><button class="btn secondary" onclick="closeModal()">Закрыть</button>`); }

// ============================================================
// 🚀 ЭКСПОРТ В WINDOW
// ============================================================
window.renderScreen = renderScreen;
window.openMyProfile = openMyProfile;
window.openSettings = openSettings;
window.handleSearch = handleSearch;
window.buyPlan = buyPlan;
window.confirmDelete = confirmDelete;
window.closeModal = closeModal;
window.saveSettings = saveSettings;
window.copyToClipboard = copyToClipboard;
window.isAdmin = isAdmin;
window.removeTracking = removeTracking;
window.activateTracking = activateTracking;
window.showPhoneMapCurrent = showPhoneMapCurrent;
window.closePhoneMap = closePhoneMap;
window.openAdminAddBalance = openAdminAddBalance;
window.openAdminGiftSubscription = openAdminGiftSubscription;
window.updateRequestsBadge = updateRequestsBadge;
window.updateNotifBadge = updateNotifBadge;
window.searchInput = searchInput;
window.logout = logout;
window.$ = $;
window.copyResultItem = copyResultItem;
window.copyAllResults = copyAllResults;
window.copyAllComments = copyAllComments;
window.deleteHistoryItem = deleteHistoryItem;
window.clearAllHistory = clearAllHistory;
window.deleteApiToken = deleteApiToken;
window.buyApiToken = buyApiToken;
window.renderApiBuy = renderApiBuy;
window.renderAiAssistant = renderAiAssistant;
window.sendAiMessage = sendAiMessage;
window.clearAiChat = clearAiChat;
window.toggleAiVoice = toggleAiVoice;
window.askAiExample = askAiExample;
window.showAiProfileSummary = showAiProfileSummary;
window.showAiSummaryModal = showAiSummaryModal;
window.copyLastAiSummary = copyLastAiSummary;
window.showAiProfileSentiment = showAiProfileSentiment;
window.showSentimentModal = showSentimentModal;
window.refreshUserProfile = refreshUserProfile;
window.showAiProfileLanguage = showAiProfileLanguage;
window.showLanguageModal = showLanguageModal;
window.showSimilarUsers = showSimilarUsers;
window.showSimilarUsersModal = showSimilarUsersModal;
window.showTranslateMenu = showTranslateMenu;
window.translateSummary = translateSummary;
window.toggleTranslateBar = toggleTranslateBar;
window.translateMessage = translateMessage;
window.showLanguagePicker = showLanguagePicker;
window.doTranslate = doTranslate;
window.renderInstagramSearch = renderInstagramSearch;
window.openHistoryItem = openHistoryItem;
window.showExtendedHistory = showExtendedHistory;
window.showCommentsHistory = showCommentsHistory;
window.showActivityChart = showActivityChart;
window.showAllFriends = showAllFriends;
window.showAllGroups = showAllGroups;
window.showAllChannels = showAllChannels;
window.renderPhotoSearch = renderPhotoSearch;

// ============================================================
// 🎯 ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
$('refresh-btn').addEventListener('click', () => { vibrate(); _meCache = { userId: null, data: null, ts: 0 }; renderScreen(currentScreen.name, currentScreen.data); toast('Обновлено', 'ok'); });
$('settings-btn').addEventListener('click', openSettings);
$('notif-btn').addEventListener('click', () => renderScreen('notifications'));

document.getElementById('auth-get-code-btn')?.addEventListener('click', requestAuthCode);
document.getElementById('auth-verify-btn')?.addEventListener('click', verifyAuthCode);
document.getElementById('auth-back-btn')?.addEventListener('click', () => { document.getElementById('auth-step-1').style.display = 'block'; document.getElementById('auth-step-2').style.display = 'none'; setAuthStatus(''); });
document.getElementById('auth-open-bot-btn')?.addEventListener('click', () => { window.open('https://t.me/dev1_robot', '_blank'); });
document.getElementById('auth-identifier')?.addEventListener('keydown', e => { if (e.key === 'Enter') requestAuthCode(); });
document.getElementById('auth-code')?.addEventListener('keydown', e => { if (e.key === 'Enter') verifyAuthCode(); });

// ============================================================
// 🏁 ЗАПУСК
// ============================================================
window.addEventListener('load', async () => {
  setTimeout(() => { const el = document.getElementById('loading'); if (el) el.classList.add('hidden'); }, 500);
  try {
    const tgUser = getTelegramUser();
    if (!tgUser) { const el = document.getElementById('loading'); if (el) el.remove(); showAuthScreen(); return; }
    await waitForAPI(15000);
    const el = document.getElementById('loading'); if (el) el.remove();
    hideAuthScreen(); getDailyUsage(); updateRequestsBadge(); updateNotifBadge(); renderScreen('home');
    setInterval(updateNotifBadge, 30000);
  } catch (err) {
    console.error('STARTUP ERROR:', err);
    try { const e = document.getElementById('loading'); if (e) e.remove(); } catch(e) {}
    showAuthScreen(); setAuthStatus('⚠️ Ошибка: ' + (err.message || 'unknown'), 'err');
  }
});
// ============================================================
// 🌍 ФИКС: Недостающие функции перевода
// ============================================================
async function showTranslateMenu(userId) {
  const u = getTelegramUser();
  if (!u) { toast('Откройте через Telegram', 'error'); return; }

  vibrate();

  showModal(`
    <div class="modal-title">🌍 Язык перевода</div>
    <div class="modal-desc" style="margin-bottom:16px;">Выберите язык, на который нужно перевести</div>

    <button onclick="closeModal(); translateToLang('ru', ${userId});" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;margin-bottom:10px;border-radius:14px;border:none;background:linear-gradient(135deg,#0a84ff,#00c6ff);color:white;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(10,132,255,0.3);" type="button">
      <span>🇷🇺 РУССКИЙ</span>
      <span style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;">→</span>
    </button>

    <button onclick="closeModal(); translateToLang('tj', ${userId});" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;margin-bottom:10px;border-radius:14px;border:none;background:linear-gradient(135deg,#34c759,#00b894);color:white;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(52,199,89,0.3);" type="button">
      <span>🇹🇯 ТАДЖИКСКИЙ</span>
      <span style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;">→</span>
    </button>

    <button onclick="closeModal(); translateToLang('en', ${userId});" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;margin-bottom:10px;border-radius:14px;border:none;background:linear-gradient(135deg,#af52de,#ff2d55);color:white;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(175,82,222,0.3);" type="button">
      <span>🇬🇧 ENGLISH</span>
      <span style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;">→</span>
    </button>

    <button class="btn secondary" onclick="closeModal()" style="margin-top:8px;">Закрыть</button>
  `);
}

async function translateToLang(lang, userId) {
  vibrate(30);

  const langNames = { 'ru': 'РУССКИЙ', 'tj': 'ТАДЖИКСКИЙ', 'en': 'ENGLISH' };
  const langFlags = { 'ru': '🇷🇺', 'tj': '🇹🇯', 'en': '🇬🇧' };

  showModal(`
    <div class="modal-title">${langFlags[lang]} ${langNames[lang]}</div>
    <div class="modal-desc">Загружаю сообщения...</div>
    <div style="text-align:center;padding:20px 0;">
      <div class="loading-bar" style="margin:0 auto;"></div>
    </div>
  `);

  try {
    const data = await apiGetUser(userId, 'all', 30);
    const comments = data.comments || [];

    if (!comments.length) {
      closeModal();
      showModal(`
        <div class="modal-title">${langFlags[lang]} ${langNames[lang]}</div>
        <div class="modal-desc">У пользователя нет сообщений для перевода</div>
        <button class="btn secondary" onclick="closeModal()">Закрыть</button>
      `);
      return;
    }

    const rows = comments.slice(0, 15).map((c, idx) => {
      const msgId = 'tr_' + idx + '_' + Date.now();
      const textForAttr = esc(c.text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const text = esc((c.text || '').substring(0, 200));
      const date = (c.date || '').slice(0, 16);
      const chat = esc(c.chat || '—');

      return `
        <div style="background:var(--bg-elev);border-radius:12px;padding:12px 14px;margin-bottom:8px;">
          <div style="font-size:11px;color:var(--text-mute);margin-bottom:6px;">
            📌 ${chat} · ${esc(date)}
          </div>
          <div id="${msgId}" style="font-size:13px;color:var(--text);line-height:1.5;margin-bottom:10px;word-break:break-word;">
            ${text}
          </div>
          <div id="${msgId}_translated" style="display:none;margin-bottom:10px;padding:10px 12px;background:rgba(52,199,89,0.08);border-left:3px solid var(--green);border-radius:6px;font-size:13px;color:var(--text);line-height:1.5;word-break:break-word;"></div>
          <button onclick="translateMessage('${msgId}', this)" data-text="${textForAttr}" data-lang="${lang}" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--green);background:rgba(52,199,89,0.12);border:1px solid rgba(52,199,89,0.3);padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-family:inherit;" type="button">
            ${langFlags[lang]} Перевести на ${langNames[lang]}
          </button>
        </div>
      `;
    }).join('');

    closeModal();
    showModal(`
      <div class="modal-title">${langFlags[lang]} ${langNames[lang]}</div>
      <div class="modal-desc" style="margin-bottom:16px;">Нажмите кнопку под сообщением для перевода</div>
      <div style="max-height:55vh;overflow-y:auto;margin-bottom:12px;">
        ${rows}
      </div>
      <button class="btn secondary" onclick="closeModal()" style="margin-bottom:8px;">Закрыть</button>
      <button class="btn secondary" onclick="closeModal(); showTranslateMenu(${userId});" style="background:var(--bg-elev);color:var(--accent);">← Назад к языкам</button>
    `);

  } catch (e) {
    closeModal();
    showModal(`
      <div class="modal-title">❌ Ошибка</div>
      <div class="modal-desc">${esc(e.message)}</div>
      <button class="btn secondary" onclick="closeModal()">Закрыть</button>
    `);
  }
}
// ============================================================
// 📸 ФИКС: Функция поиска лица (Face Search)
// ============================================================
function renderPhotoSearch() {
  contentWrap.innerHTML = `
    <div class="section-title">📸 Поиск лица (Face Search)</div>
    
    <div class="chart-wrap" style="padding:20px;">
      <div class="field">
        <label class="field-label">Загрузите фото с лицом</label>
        <input type="file" id="ps-file" accept="image/*" style="display:none;">
        <button class="btn secondary" id="ps-choose" style="margin-bottom:8px;">📁 Выбрать фото</button>
        <div id="ps-size-info" style="font-size:11px;color:var(--text-mute);text-align:center;"></div>
      </div>
    </div>

    <div id="ps-scanner-container" style="display:none; margin-bottom:16px;">
      <div class="scaner-wrap">
        <div class="scaner-frame">
          <div class="scaner-corners"></div>
          <img id="ps-scanner-img" class="scaner-image" alt="">
          <div class="scaner-grid"></div>
          <div class="scaner-pulse"></div>
          <div class="scaner-line"></div>
          <div class="scaner-points">
            <div class="scaner-point" style="top:12%;left:18%;animation-delay:0s;"></div>
            <div class="scaner-point" style="top:8%;left:45%;animation-delay:0.3s;"></div>
            <div class="scaner-point" style="top:12%;left:78%;animation-delay:0.6s;"></div>
            <div class="scaner-point" style="top:40%;left:8%;animation-delay:0.9s;"></div>
            <div class="scaner-point" style="top:38%;left:32%;animation-delay:1.2s;"></div>
            <div class="scaner-point" style="top:38%;left:65%;animation-delay:1.5s;"></div>
            <div class="scaner-point" style="top:40%;left:88%;animation-delay:1.8s;"></div>
            <div class="scaner-point" style="top:62%;left:22%;animation-delay:2.1s;"></div>
            <div class="scaner-point" style="top:70%;left:50%;animation-delay:2.4s;"></div>
            <div class="scaner-point" style="top:62%;left:78%;animation-delay:2.7s;"></div>
            <div class="scaner-point" style="top:88%;left:38%;animation-delay:3s;"></div>
            <div class="scaner-point" style="top:88%;left:65%;animation-delay:3.3s;"></div>
          </div>
        </div>
        
        <div class="scaner-status">
          <div class="scaner-status-text" id="ps-status-text">СКАНИРОВАНИЕ ЛИЦА...</div>
          <div class="scaner-progress">
            <div class="scaner-progress-bar" id="ps-progress-bar"></div>
          </div>
          <div class="scaner-percent" id="ps-percent">0%</div>
          <div class="scaner-info">
            <span>🔍 Анализ</span>
            <span>🧠 Нейросеть</span>
            <span>📊 Сравнение</span>
          </div>
        </div>
      </div>
    </div>

    <button class="btn" id="ps-btn" disabled style="background:linear-gradient(135deg,#00d4ff,#007aff);">🔍 Найти лицо</button>
    
    <div id="ps-results"></div>
    <button class="btn secondary" onclick="renderScreen('home')">← На главную</button>
  `;

  let imageData = null;

  $('ps-choose').addEventListener('click', () => $('ps-file').click());

  $('ps-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        imageData = canvas.toDataURL('image/jpeg', 0.75);
        const sizeKb = Math.round((imageData.length * 3 / 4) / 1024);
        $('ps-size-info').textContent = `${w}×${h}px · ${sizeKb} КБ`;
        $('ps-scanner-container').style.display = 'block';
        $('ps-scanner-img').src = imageData;
        $('ps-btn').disabled = false;
        let progress = 0;
        const bar = $('ps-progress-bar');
        const percent = $('ps-percent');
        const statusText = $('ps-status-text');
        const statuses = ['ОБНАРУЖЕНИЕ ЛИЦА...', 'АНАЛИЗ ГЕОМЕТРИИ...', 'РАСПОЗНАВАНИЕ ЧЕРТ...', 'СРАВНЕНИЕ С БАЗОЙ...', 'ПОИСК СОВПАДЕНИЙ...', 'ГОТОВО ✓'];
        progress = 0; bar.style.width = '0%'; percent.textContent = '0%';
        const interval = setInterval(() => {
          progress += Math.random() * 8 + 3;
          if (progress >= 100) { progress = 100; clearInterval(interval); statusText.textContent = statuses[statuses.length - 1]; }
          else { const idx = Math.min(Math.floor(progress / 100 * (statuses.length - 1)), statuses.length - 2); statusText.textContent = statuses[idx]; }
          bar.style.width = progress + '%';
          percent.textContent = Math.floor(progress) + '%';
        }, 200);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  $('ps-btn').addEventListener('click', async () => {
    if (!imageData) return;
    const btn = $('ps-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Ищем совпадения...';
    $('ps-results').innerHTML = renderLoading('Отправляем в нейросеть...');
    
    try {
      const data = await pubPost('/api/google_lens_search', { image: imageData });
      setTimeout(() => { $('ps-scanner-container').style.display = 'none'; }, 800);
      
      if (!data.success) {
        $('ps-results').innerHTML = renderError(data.error || 'Ошибка');
        return;
      }
      const results = data.results || [];
      if (!results.length) {
        $('ps-results').innerHTML = renderEmpty('Лицо не найдено');
        return;
      }
      $('ps-results').innerHTML = `<div class="section-title" style="color:var(--green);">🎯 Найдено: ${results.length}</div>` + results.map((r, idx) => {
        const score = r.score || 0;
        let scoreClass = 'low';
        if (score >= 70) scoreClass = 'high';
        else if (score >= 40) scoreClass = 'mid';
        return `
          <div class="face-result">
            ${r.thumbnail ? `<img class="face-thumb" src="${esc(r.thumbnail)}" onerror="this.outerHTML='<div class=\\'face-thumb\\'>👤</div>';">` : `<div class="face-thumb">👤</div>`}
            <div class="face-info">
              <div class="face-name">${esc(r.title || 'Профиль #' + (idx + 1))}</div>
              ${score > 0 ? `<div class="face-score ${scoreClass}">🎯 Схожесть: ${score}%</div>` : ''}
              ${r.url ? `<a class="face-link" href="${esc(r.url)}" target="_blank">🔗 Открыть профиль</a>` : ''}
            </div>
          </div>
        `;
      }).join('');
      vibrate(50);
      toast('✅ Найдено: ' + results.length, 'ok');
    } catch(e) {
      $('ps-results').innerHTML = renderError('Ошибка: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 Найти лицо';
    }
  });
}