/* 라이트 · 다크 모드 (K 요청 2026-11-12) — 모든 페이지 공통.
   처음엔 라이트, 고른 건 기억. <head>에서 먼저 읽어서 화면이 깜빡이지 않게 함 */
(function(){
  var KEY='gm-theme', root=document.documentElement, btn=null;
  var MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a.7.7 0 0 0-.9-.9A9.9 9.9 0 1 0 21.2 15.5a.7.7 0 0 0-.9-.9z"/></svg>';
  var SUN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/></g></svg>';
  var saved=null; try{ saved=localStorage.getItem(KEY); }catch(e){}
  if(saved==='dark') root.setAttribute('data-theme','dark');
  function isDark(){ return root.getAttribute('data-theme')==='dark'; }
  function paint(){
    var d=isDark();
    document.querySelectorAll('.logo img').forEach(function(i){ var src=i.getAttribute('src'); i.setAttribute('src',d?src.replace(/logo\.png$/,'logo-dark.png'):src.replace(/logo-dark\.png$/,'logo.png')); });   // 다크면 노란 로고
    if(!btn) return;
    btn.innerHTML=d?SUN:MOON;                          // 지금 다크면 해(→ 라이트), 라이트면 달(→ 다크)
    btn.setAttribute('aria-pressed',d?'true':'false');
    btn.setAttribute('aria-label',d?'라이트 모드로 바꾸기':'다크 모드로 바꾸기');
  }
  function set(v){
    if(v==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    try{ localStorage.setItem(KEY,v); }catch(e){}
    paint();
    try{ document.dispatchEvent(new CustomEvent('gm-theme',{detail:v})); }catch(e){}
  }
  window.gmTheme={isDark:isDark,set:set};
  function mount(){   // K 요청 2026-11-13: 버튼 없이, 맨 위 로고를 누르면 다크 ↔ 라이트 (숨은 기능, 로고는 첫 페이지로 가지 않음)
    var logo=document.querySelector('.band .brand')||document.querySelector('.band .logo'); if(!logo||logo.__gmTheme) return;
    logo.__gmTheme=true;
    logo.addEventListener('click',function(e){ e.preventDefault(); set(isDark()?'light':'dark'); });
    paint();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  window.addEventListener('storage',function(e){ if(e.key!==KEY) return;   // 다른 창에서 다크/라이트를 바꾸면 이 창도 같이 (2026-11-13)
    if(e.newValue==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme'); paint();
    try{ document.dispatchEvent(new CustomEvent('gm-theme',{detail:e.newValue==='dark'?'dark':'light'})); }catch(x){} });
})();

/* 마스터 볼륨 (K 요청 2026-11-13 "홈페이지 전체 마스터 볼륨") — 모든 페이지 공통.
   맨 위 다크 모드 버튼 왼쪽 스피커 버튼 → 누르면 볼륨 막대(0~100). 고른 값은 기억, 모든 페이지 같이.
   페이지마다 만드는 소리(AudioContext)는 모두 이 볼륨을 거쳐서 나가고, 즉흥연주 백킹 음원(audio)에도 곱해짐 */
(function(){
  var KEY='gm-volume', vol=100, ctxs=[], medias=[];
  try{ var v=parseInt(localStorage.getItem(KEY),10); if(v>=0&&v<=100) vol=v; }catch(e){}
  var g=function(){ return vol/100; };
  // 1) 소리 엔진: 새로 만드는 AudioContext의 destination을 마스터 볼륨 노드로 바꿔 둠
  ['AudioContext','webkitAudioContext'].forEach(function(name){
    var AC=window[name]; if(!AC||AC.__gmWrapped) return;
    var W=function(opts){
      var c=opts?new AC(opts):new AC();
      try{ var m=c.createGain(); m.gain.value=g(); m.connect(c.destination);
        Object.defineProperty(c,'destination',{value:m,configurable:true}); ctxs.push({c:c,m:m}); }catch(e){}
      return c;
    };
    W.prototype=AC.prototype; W.__gmWrapped=true; window[name]=W;
  });
  // 2) 음원 파일(즉흥연주 백킹): 페이지가 정한 볼륨 × 마스터 볼륨
  try{
    var d=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume');
    if(d&&d.set&&!HTMLMediaElement.prototype.__gmVol){
      Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,
        get:function(){ return this.__gmBase!=null?this.__gmBase:d.get.call(this); },
        set:function(v){ this.__gmBase=v; if(medias.indexOf(this)<0) medias.push(this); d.set.call(this,Math.max(0,Math.min(1,v*g()))); }});
      HTMLMediaElement.prototype.__gmVol=d;
    }
  }catch(e){}
  function apply(){
    ctxs.forEach(function(x){ try{ x.m.gain.setTargetAtTime(g(),x.c.currentTime,0.02); }catch(e){ x.m.gain.value=g(); } });
    medias.forEach(function(a){ try{ HTMLMediaElement.prototype.__gmVol.set.call(a,Math.max(0,Math.min(1,(a.__gmBase==null?1:a.__gmBase)*g()))); }catch(e){} });
  }
  // 3) 맨 위 메뉴 아래 오른쪽(즉흥연주 · 화성학 · 메트로놈 밑) 볼륨 막대 — K 요청 2026-11-13
  var ON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.3 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var OFF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var before=100;   // 스피커 버튼으로 끄기 전 값
  function mount(){
    var nav=document.querySelector('.band .nav'); if(!nav||document.querySelector('.vol-row')) return;
    // 초견 · 청음 펼침 메뉴: 누르면 열고 닫힘, 바깥을 누르거나 Esc면 닫힘 (컴퓨터에서 마우스를 올려 여는 것은 theme.css)
    var grps=nav.querySelectorAll('.grp'), shut=function(x){ for(var i=0;i<grps.length;i++) if(grps[i]!==x){ grps[i].classList.remove('open'); grps[i].querySelector('.gbtn').setAttribute('aria-expanded','false'); } };
    for(var gi=0;gi<grps.length;gi++) (function(g){ g.querySelector('.gbtn').addEventListener('click',function(e){ e.stopPropagation(); shut(g); var on=g.classList.toggle('open'); this.setAttribute('aria-expanded',on?'true':'false'); });
      g.addEventListener('mouseenter',function(){ shut(g); });   // 하나를 눌러 열어 둔 채 다른 칸에 마우스를 올리면 먼저 열린 것은 닫음 (둘이 겹쳐 보이던 오류, K 제보 2026-11-16)
    })(grps[gi]);
    document.addEventListener('click',function(e){ if(!e.target.closest||!e.target.closest('.band .nav .grp')) shut(null); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') shut(null); });
    var col=document.createElement('div'); col.className='navcol';
    nav.parentNode.insertBefore(col,nav); col.appendChild(nav);
    var row=document.createElement('div'); row.className='vol-row';
    row.innerHTML='<button type="button" class="vol-btn"></button><input type="range" min="0" max="100" step="5" aria-label="소리 크기"><b class="vol-num"></b><button type="button" class="lvsnd-btn"></button>';
    col.appendChild(row);
    var btn=row.querySelector('.vol-btn'), rg=row.querySelector('input'), num=row.querySelector('.vol-num');
    var paint=function(){ btn.innerHTML=vol?ON:OFF; btn.setAttribute('aria-label',vol?'소리 끄기':'소리 켜기'); rg.value=vol; num.textContent=vol; rg.style.setProperty('--p',vol+'%'); };
    var setV=function(v){ vol=v; try{ localStorage.setItem(KEY,vol); }catch(e){} paint(); apply(); };
    rg.addEventListener('input',function(){ setV(+rg.value); });
    btn.addEventListener('click',function(){ if(vol){ before=vol; setV(0); } else setV(before||100); });
    var fit=function(){   // 볼륨 줄 너비 = 메뉴 너비 (메뉴가 6칸으로 줄어서 2026-11-16부터 메뉴 전체에 맞춤)
      var a=nav.firstElementChild; if(!a) return;
      var w=nav.getBoundingClientRect().right-a.getBoundingClientRect().left;
      if(w>0) row.style.width=Math.round(w/(parseFloat(getComputedStyle(document.documentElement).zoom)||1))+'px';
    };
    fit(); window.addEventListener('resize',fit); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);
    window.__gmVolPaint=paint;
    var lb=row.querySelector('.lvsnd-btn');   // 레벨업 소리 ON/OFF (K 요청 2026-11-13, 처음엔 ON, 모든 페이지 같이 기억)
    var lpaint=function(){ var on=window.gmLvSoundOn(); lb.innerHTML='레벨업 소리<b>'+(on?'ON':'OFF')+'</b>'; lb.setAttribute('aria-pressed',on?'true':'false'); };
    lb.addEventListener('click',function(){ try{ localStorage.setItem('gm-lvsound',window.gmLvSoundOn()?'off':'on'); }catch(e){} lpaint(); });
    window.addEventListener('storage',function(e){ if(e.key==='gm-lvsound') lpaint(); });
    lpaint();
    paint();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(mount,0); }); else setTimeout(mount,0);
  window.addEventListener('storage',function(e){ if(e.key===KEY){ var v=parseInt(e.newValue,10); if(v>=0&&v<=100){ vol=v; apply(); if(window.__gmVolPaint) window.__gmVolPaint(); } } });
})();

/* 아이폰 무음(진동) 모드에서도 소리 나게 (K 제보 2026-11-18 "무음모드일 때 소리가 안 나") — 모든 페이지 공통.
   아이폰은 웹 소리를 기본으로 "알림 소리"처럼 다뤄서 무음 스위치를 켜면 같이 꺼짐.
   1) iOS 16.4 이상: 이 페이지 소리를 "미디어 재생"으로 알려 줌 (유튜브처럼 무음에서도 남)
   2) 그보다 예전 iOS: 처음 화면을 누를 때 소리 없는 음원을 반복 재생해 두면 같은 효과 (페이지를 벗어나면 멈춤) */
(function(){
  var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  try{ if(navigator.audioSession){ navigator.audioSession.type='playback'; return; } }catch(e){}
  if(!ios) return;
  var el=null;
  function silentWav(){   // 0.5초 무음 wav (8kHz 8bit)
    var n=4000, b=new ArrayBuffer(44+n), v=new DataView(b), s=function(o,t){ for(var i=0;i<t.length;i++) v.setUint8(o+i,t.charCodeAt(i)); };
    s(0,'RIFF'); v.setUint32(4,36+n,true); s(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
    v.setUint32(24,8000,true); v.setUint32(28,8000,true); v.setUint16(32,1,true); v.setUint16(34,8,true); s(36,'data'); v.setUint32(40,n,true);
    for(var i=0;i<n;i++) v.setUint8(44+i,128);
    return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));
  }
  function on(){
    try{
      if(!el){ el=document.createElement('audio'); el.setAttribute('playsinline',''); el.setAttribute('x-webkit-airplay','deny'); el.loop=true; el.preload='auto'; el.src=silentWav(); }
      if(document.visibilityState!=='hidden'&&el.paused){ var p=el.play(); if(p&&p.catch) p.catch(function(){}); }
    }catch(e){}
  }
  ['touchend','click','keydown'].forEach(function(t){ window.addEventListener(t,on,true); });
  document.addEventListener('visibilitychange',function(){ if(!el) return; if(document.visibilityState==='hidden') el.pause(); });
})();

/* 단계 레벨 (K 요청 2026-11-13) — 단계마다 · Easy/Hard 따로, 연습한 곡(문제) 수가 경험치.
   다음 레벨까지: LV1→2 2곡, 2→3 3곡 … LV10→11 11곡, 그 뒤로는 2레벨마다 1곡씩 늘어 LV49→50 30곡. 최고 LV 50 (모두 874곡) */
window.gmLevel=function(c){
  var MAX=50, lv=1, used=0;
  var need=function(n){ return n<=10?n+1:11+Math.floor((n-10)/2); };
  while(lv<MAX&&c-used>=need(lv)){ used+=need(lv); lv++; }
  if(lv>=MAX) return {lv:MAX,cur:c-used,need:0,max:true,pct:100};
  var cur=c-used, nd=need(lv);
  return {lv:lv,cur:cur,need:nd,max:false,pct:Math.round(cur/nd*100)};
};

/* 레벨업 소리 "띠로리링~" (K 요청 2026-11-13) — 곡 수가 c0 → c1로 늘어서 레벨이 오르면 한 번 울림.
   소리 파일 없이 브라우저에서 합성, 맨 위 소리 크기를 따름 */
window.gmLvSoundOn=function(){ try{ return localStorage.getItem('gm-lvsound')!=='off'; }catch(e){ return true; } };
window.gmLevelUp=function(c0,c1){
  if(!window.gmLevel||gmLevel(c1).lv<=gmLevel(c0).lv) return false;
  if(!window.gmLvSoundOn()) return true;   // 볼륨 옆 "레벨업 소리 끔"이면 소리만 안 냄
  try{
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return true;
    var c=window.__gmLvCtx||(window.__gmLvCtx=new AC()); if(c.state==='suspended') c.resume();
    var t0=c.currentTime+0.05, out=c.createGain(); out.gain.value=1; out.connect(c.destination);
    // 띠 · 로 · 리 · 링~ : 솔 도 미 솔 (빠르게 올라가고) → 높은 도에서 길게 반짝
    [[79,0,.16],[84,.09,.16],[88,.18,.16],[91,.27,.16],[96,.38,1.1]].forEach(function(n){
      var f=440*Math.pow(2,(n[0]-69)/12), t=t0+n[1], len=n[2];
      [[1,'triangle',.5],[2,'sine',.18],[3,'sine',.06]].forEach(function(h){   // 종소리처럼 배음 조금
        var o=c.createOscillator(), g=c.createGain(); o.type=h[1]; o.frequency.value=f*h[0];
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(h[2],t+0.008);
        g.gain.exponentialRampToValueAtTime(0.0001,t+len);
        o.connect(g); g.connect(out); o.start(t); o.stop(t+len+0.05);
      });
    });
  }catch(e){}
  return true;
};

/* 한 마디 세고 시작: 오선 아래 빈칸 가운데에 큰 숫자 (K 요청 2026-11-13) — 초견·청음 4페이지 공통.
   gmCount(1~4) 보이기, gmCount('첫 음 …') 글자 보이기, gmCount(0) 숨기기 */
window.gmCount=function(n){
  var svg=document.getElementById('score'), sheet=svg&&svg.closest('.sheet'); if(!sheet) return;
  var el=sheet.querySelector('.countbig');
  if(!n){ if(el) el.hidden=true; return; }
  if(!el){ el=document.createElement('div'); el.className='countbig'; el.setAttribute('aria-hidden','true'); sheet.appendChild(el);
    if(getComputedStyle(sheet).position==='static') sheet.style.position='relative'; }
  var z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  var sr=sheet.getBoundingClientRect(), vr=svg.getBoundingClientRect(), bb=svg.getBBox(), vb=svg.viewBox.baseVal, k=vb&&vb.height?vr.height/vb.height:1;
  var top=(vr.top-sr.top)/z+((bb.y+bb.height-(vb?vb.y:0))*k)/z, bottom=(vr.bottom-sr.top)/z, h=Math.max(44,bottom-top);   // 악보 내용 아래 ~ 오선지 칸 끝
  el.style.top=top+'px'; el.style.height=h+'px';
  el.style.fontSize=(typeof n==='string'?Math.min(30,Math.max(22,h*0.4),(sr.width/z-28)/(n.length*0.72)):Math.min(72,Math.max(40,h*0.9)))+'px';   // 긴 글자는 좁은 휴대폰에서 한 줄에 들어가게 줄임   // 글자("첫 음 …")는 숫자보다 작게 (K 요청 2026-11-13)
  el.textContent=n; el.hidden=false;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
};

/* 뒤로 가기로 돌아와도 처음 상태로 — 브라우저가 예전 화면을 그대로 꺼내 보여 주지 않게 (K 요청 2026-11-21) */
window.addEventListener('pageshow',function(e){ if(e.persisted) location.reload(); });
