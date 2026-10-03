const CACHE='tcm-classics-runtime-v1';
const cacheable=url=>url.pathname.includes('/books/ws/')||url.pathname.includes('/search-index/')||url.pathname.includes('/vendor/opencc-js/');
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin||!cacheable(url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),hit=await cache.match(req);
    const refresh=fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);
    if(hit){event.waitUntil(refresh);return hit;}
    const live=await refresh;return live||new Response('offline',{status:503});
  })());
});
