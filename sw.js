const CACHE = 'spartan-tracker-v40';
const ASSETS = ['./','./index.html','./styles.css?v=40','./app-v4.mjs?v=40','./core.mjs','./ui.mjs','./firebase-config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spartan-tracker-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 const local=url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);
 const staticCdn=(url.origin==='https://www.gstatic.com'&&url.pathname.startsWith('/firebasejs/12.16.0/'))||url.origin==='https://fonts.googleapis.com'||url.origin==='https://fonts.gstatic.com';
 if(!local&&!staticCdn)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok||response.type==='opaque'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return caches.match('./index.html');return Response.error();}));
});
