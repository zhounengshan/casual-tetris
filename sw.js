const CACHE='casual-tetris-v5';
const ASSETS=['./index.html','./manifest.webmanifest','./icon.svg'];

const STANDALONE_FIX=`
<style id="standalone-layout-fix">
@media (display-mode: standalone){
  .app{height:min(100%,calc(100vw * 1.78))!important;max-height:780px!important}
}
html.ios-standalone .app{height:min(100%,calc(100vw * 1.78))!important;max-height:780px!important}
</style>
<script>
(function(){
  function fixStandaloneLayout(){
    var standalone=(window.navigator.standalone===true)||window.matchMedia('(display-mode: standalone)').matches;
    document.documentElement.classList.toggle('ios-standalone',standalone);
    if(!standalone)return;
    var app=document.querySelector('.app');
    if(!app)return;
    var w=Math.min(window.innerWidth,440);
    var h=Math.min(window.innerHeight,w*1.78,780);
    app.style.height=h+'px';
  }
  window.addEventListener('resize',fixStandaloneLayout,{passive:true});
  window.addEventListener('orientationchange',fixStandaloneLayout,{passive:true});
  document.addEventListener('DOMContentLoaded',fixStandaloneLayout,{once:true});
  setTimeout(fixStandaloneLayout,60);
})();
<\/script>`;

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

async function navigationResponse(request){
  try{
    const fresh=await fetch(request,{cache:'no-store'});
    if(!fresh.ok)return fresh;
    const type=fresh.headers.get('content-type')||'';
    if(!type.includes('text/html'))return fresh;
    let html=await fresh.text();
    html=html.replace('</head>',STANDALONE_FIX+'\n</head>');
    return new Response(html,{status:fresh.status,statusText:fresh.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }catch(err){
    const cached=await caches.match('./index.html');
    if(!cached)throw err;
    let html=await cached.text();
    html=html.replace('</head>',STANDALONE_FIX+'\n</head>');
    return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
}

self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(navigationResponse(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
