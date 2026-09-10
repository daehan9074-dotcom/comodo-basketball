/* =========================================================
 *  코모도 농구 참석자 - Service Worker
 *
 *  역할: HTML·로고 등 정적 파일을 캐시해 재방문 시 네트워크 없이 즉시 표시
 *
 *  ⚠️ index.html 을 수정한 뒤에는 아래 CACHE 버전을 반드시 올려주세요.
 *     (komodo-v3 → komodo-v4 → ...)  안 올리면 방문자에게 옛 화면이 계속 보입니다.
 * ========================================================= */

const CACHE = 'komodo-v8';

// 미리 받아둘 파일. 실패해도 설치는 계속 진행됩니다.
const ASSETS = ['./', './index.html', './logo.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();   // 새 버전을 즉시 대기 상태에서 해제
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 구글 Apps Script 등 외부 요청은 절대 건드리지 않는다 (항상 최신 데이터를 받아야 함)
  if (url.origin !== self.location.origin) return;

  // stale-while-revalidate: 캐시를 즉시 주고, 뒤에서 최신본을 받아 캐시를 갱신
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached || caches.match('./index.html'));

      return cached || network;
    })
  );
});
