// Service worker: menyimpan aplikasi (shell) agar bisa dibuka offline setelah dimuat sekali.
// Data keuangan tidak pernah disimpan di cache ini; data hidup di IndexedDB.
const CACHE = 'my-finance-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/styles.css',
  './js/app.js',
  './js/state.js',
  './js/core/money.js',
  './js/core/ledger.js',
  './js/core/validate.js',
  './js/core/csv.js',
  './js/core/importer.js',
  './js/core/security.js',
  './js/database/db.js',
  './js/services/finance.js',
  './js/services/defaults.js',
  './js/ui/dom.js',
  './js/ui/charts.js',
  './js/ui/rows.js',
  './js/ui/lock-screen.js',
  './js/views/dashboard.js',
  './js/views/accounts.js',
  './js/views/transactions.js',
  './js/views/history.js',
  './js/views/reports.js',
  './js/views/logs.js',
  './js/views/data.js',
  './js/views/settings.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    }),
  );
});
