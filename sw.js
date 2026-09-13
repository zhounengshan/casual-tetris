const CACHE='casual-tetris-v7';
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

function patchHTML(html){
  html=html.replace('↻ 重新开始','↻ 重置');
  html=html.replace(
    "const COL={I:'#22d3ee',J:'#3b82f6',L:'#fb923c',O:'#facc15',S:'#22c55e',T:'#a855f7',Z:'#ef4444'},SH={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};",
    "const COL={I:'#22d3ee',J:'#3b82f6',L:'#fb923c',O:'#facc15',S:'#22c55e',T:'#a855f7',Z:'#ef4444',B:'#f97316'},SH={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]],B:[[1]]};"
  );
  html=html.replace(
    "function mk(t=type()){let m=clone(SH[t]);return{t,m,x:Math.floor((C-m[0].length)/2),y:-1}}",
    "function mk(t){if(!t)t=Math.random()<.05?'B':type();let m=clone(SH[t]);return{t,m,x:Math.floor((C-m[0].length)/2),y:-1}}"
  );
  html=html.replace(
    "function lock(){p.m.forEach((r,y)=>r.forEach((v,x)=>{if(v&&p.y+y>=0)b[p.y+y][p.x+x]=p.t}));soundfx('land');let c=clear();if(c){combo++;let base=[0,10,30,50,80][c]||0,pts=base*(combo>1?2:1);score+=pts;lines+=c;levelLines+=c;toast(c,combo,pts);soundfx(c===4?'tetris':'clear')}else combo=0;if(score>best){best=score;localStorage.setItem('casualTetrisBest',best)}if(c&&levelLines>=goalFor()){winLevel();sync();draw();return}p=n;n=mk();p.x=Math.floor((C-p.m[0].length)/2);p.y=-1;if(hit())over();sync()}",
    "function lock(){if(p.t==='B'){let bx=p.x,by=p.y;for(let yy=Math.max(0,by-1);yy<=Math.min(R-1,by+1);yy++)for(let xx=Math.max(0,bx-1);xx<=Math.min(C-1,bx+1);xx++)b[yy][xx]=null;combo=0;let e=$('#toast');e.textContent='💣 BOOM！炸开 3×3';e.classList.remove('show');void e.offsetWidth;e.classList.add('show');soundfx('tetris');p=n;n=mk();p.x=Math.floor((C-p.m[0].length)/2);p.y=-1;if(hit())over();sync();draw();return}p.m.forEach((r,y)=>r.forEach((v,x)=>{if(v&&p.y+y>=0)b[p.y+y][p.x+x]=p.t}));soundfx('land');let c=clear();if(c){combo++;let base=[0,10,30,50,80][c]||0,pts=base*(combo>1?2:1);score+=pts;lines+=c;levelLines+=c;toast(c,combo,pts);soundfx(c===4?'tetris':'clear')}else combo=0;if(score>best){best=score;localStorage.setItem('casualTetrisBest',best)}if(c&&levelLines>=goalFor()){winLevel();sync();draw();return}p=n;n=mk();p.x=Math.floor((C-p.m[0].length)/2);p.y=-1;if(p.t==='B'){let e=$('#toast');e.textContent='💣 炸弹来了！';e.classList.remove('show');void e.offsetWidth;e.classList.add('show')}if(hit())over();sync()}"
  );
  html=html.replace('</head>',STANDALONE_FIX+'\n</head>');
  return html;
}

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
    const html=patchHTML(await fresh.text());
    return new Response(html,{status:fresh.status,statusText:fresh.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }catch(err){
    const cached=await caches.match('./index.html');
    if(!cached)throw err;
    const html=patchHTML(await cached.text());
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