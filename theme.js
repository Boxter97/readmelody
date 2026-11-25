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

/* 크리스마스 시즌 (K 요청 2026-11-26 "홈페이지 전체 크리스마스 느낌, 눈 쌓이고 눈 오고" + "로고도 크리스마스 느낌") — 모든 페이지 공통.
   시즌이 끝나면 아래 SEASON='' 한 줄만 바꾸면 전부 꺼짐 (메트로놈 크로매틱 크리스마스는 따로: metronome/index.html의 xmas 클래스)
   - 화면 전체에 눈이 내림 (누르기에 영향 없음, '동작 줄이기' 설정이면 안 내림)
   - 맨 위 띠 아래 선 · 맨 아래 꼬리말 위에 쌓인 눈
   - 로고: 기타 헤드에 산타 모자 + 글자 위에 쌓인 눈 */
(function(){
  var SEASON='xmas'; if(SEASON!=='xmas') return;
  var root=document.documentElement; root.classList.add('xmas');
  var DECO='<svg class="xm-deco" viewBox="0 0 380 200" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g fill="#fff" stroke="#1A1F2B" stroke-width="2" stroke-linejoin="round"><path d="M155.0 6.6 L155.0 4.6 Q155.0 4.6 157.0 3.0 Q159.0 1.4 161.0 2.8 Q163.0 4.2 165.0 4.3 Q167.0 4.4 168.5 7.1 L170.0 9.8 L170.0 12.8 L167.0 11.4 L163.0 10.5 L159.0 9.4 L155.0 7.6Z"/><path d="M212.0 133.9 L212.0 131.9 Q212.0 131.9 214.0 130.3 Q216.0 128.7 218.0 127.6 Q220.0 126.5 222.0 128.2 Q224.0 129.9 226.0 129.3 Q228.0 128.7 230.0 127.5 Q232.0 126.3 234.0 127.6 Q236.0 129.0 238.0 129.4 Q240.0 129.7 242.0 127.4 Q244.0 125.1 246.0 124.6 Q248.0 124.1 250.0 125.6 Q252.0 127.1 254.0 126.3 Q256.0 125.5 258.0 126.2 Q260.0 126.9 261.0 128.7 L262.0 130.5 L262.0 133.5 L260.0 133.5 L256.0 133.5 L252.0 133.6 L248.0 134.1 L244.0 134.9 L240.0 136.2 L236.0 137.2 L232.0 136.9 L228.0 136.5 L224.0 136.5 L220.0 136.5 L216.0 136.7 L212.0 134.9Z"/><path d="M180.0 61.2 L180.0 59.2 Q180.0 59.2 182.0 56.2 Q184.0 53.1 186.0 53.7 Q188.0 54.2 190.0 53.2 Q192.0 52.1 194.0 51.5 Q196.0 50.8 198.0 53.2 Q200.0 55.5 202.0 55.7 Q204.0 55.8 206.0 54.0 Q208.0 52.2 210.0 53.3 Q212.0 54.3 214.0 55.8 Q216.0 57.3 218.0 59.4 L220.0 61.5 L220.0 64.5 L216.0 62.9 L212.0 62.5 L208.0 62.8 L204.0 63.2 L200.0 62.6 L196.0 61.4 L192.0 60.7 L188.0 60.6 L184.0 61.3 L180.0 62.2Z"/><path d="M227.0 69.4 L227.0 67.4 Q227.0 67.4 229.0 67.0 Q231.0 66.5 233.0 64.0 Q235.0 61.5 237.0 61.8 Q239.0 62.2 241.0 62.7 Q243.0 63.2 245.0 61.1 Q247.0 59.0 249.0 60.3 Q251.0 61.5 253.0 62.6 Q255.0 63.7 257.0 61.9 Q259.0 60.2 261.0 61.0 Q263.0 61.9 265.0 61.8 Q267.0 61.8 269.0 59.9 Q271.0 57.9 273.0 59.3 Q275.0 60.6 277.0 60.8 Q279.0 61.0 281.0 59.0 Q283.0 56.9 285.0 58.4 Q287.0 59.9 289.0 60.1 Q291.0 60.3 293.0 60.3 Q295.0 60.4 296.5 63.5 L298.0 66.5 L298.0 69.5 L295.0 68.2 L291.0 67.5 L287.0 67.5 L283.0 67.6 L279.0 68.1 L275.0 68.5 L271.0 68.5 L267.0 68.7 L263.0 69.9 L259.0 70.7 L255.0 70.4 L251.0 69.8 L247.0 69.5 L243.0 69.8 L239.0 70.7 L235.0 71.8 L231.0 72.2 L227.0 70.4Z"/><path d="M289.0 117.5 L289.0 115.5 Q289.0 115.5 291.0 113.0 Q293.0 110.6 295.0 109.6 Q297.0 108.7 299.0 110.0 Q301.0 111.4 303.0 109.5 Q305.0 107.5 307.0 108.0 Q309.0 108.5 311.0 110.3 Q313.0 112.0 315.0 113.3 Q317.0 114.6 317.5 116.0 L318.0 117.4 L318.0 120.4 L317.0 119.7 L313.0 118.1 L309.0 117.5 L305.0 117.5 L301.0 117.7 L297.0 118.2 L293.0 118.5 L289.0 118.5Z"/><path d="M326.0 127.3 L326.0 125.3 Q326.0 125.3 328.0 124.7 Q330.0 124.1 332.0 122.7 Q334.0 121.4 336.0 119.7 Q338.0 118.0 340.0 119.1 Q342.0 120.1 344.0 120.4 Q346.0 120.7 348.0 119.0 Q350.0 117.3 352.0 117.6 Q354.0 118.0 356.0 119.2 Q358.0 120.3 360.0 118.9 Q362.0 117.4 364.0 117.3 Q366.0 117.2 368.0 120.5 Q370.0 123.7 370.5 124.6 L371.0 125.4 L371.0 128.4 L370.0 127.8 L366.0 126.7 L362.0 126.5 L358.0 126.6 L354.0 127.2 L350.0 127.6 L346.0 127.5 L342.0 127.7 L338.0 128.7 L334.0 129.6 L330.0 129.7 L326.0 128.3Z"/></g><g transform="translate(60 74) rotate(-24)" stroke="#1A1F2B" stroke-width="2" stroke-linejoin="round"><path d="M30 -4 C28 -30 14 -50 -8 -54 C-26 -57 -40 -48 -46 -34 C-40 -40 -30 -40 -26 -32 C-24 -20 -26 -12 -30 -4 Z" fill="#D4252F"/><path d="M-8 -54 C-26 -57 -40 -48 -46 -34 C-40 -40 -30 -40 -26 -32 C-26 -42 -18 -50 -8 -54Z" fill="#A81822" stroke="none"/><path d="M20 -12 C18 -28 10 -40 -2 -46" fill="none" stroke="#F0636C" stroke-width="3" stroke-linecap="round"/><rect x="-38" y="-10" width="76" height="18" rx="9" fill="#fff"/><circle cx="-46" cy="-30" r="9" fill="#fff"/></g></svg>';
  /* 썰매 + 순록 (K 2026-11-26 "로고 옆 빈칸에 썰매 타고 가는 느낌" — 시안 2차 고름): 로고가 썰매에 타고 순록 2마리(맨 앞 루돌프)가 끎 (K가 한 번 뺐다가 "순록은 냅두고 전구를 없애줘"로 되살림).
     로고 그림 단위(380×200)로 그림 → 로고 크기 따라 같이 커지고 작아짐. 메뉴와 겹치면 루돌프부터, 그래도 겹치면 순록 모두 숨김 */
  var SLEIGH_B='<svg class="xm-sleigh xm-sb" viewBox="-80 -70 1080 330" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M-14 106 C-24 98 -30 92 -40 92 C-54 92 -58 110 -46 116 C-38 120 -32 112 -38 106 C-46 140 -40 214 26 220 L336 220 C374 220 394 204 406 182 C414 166 430 156 444 160 C458 164 458 184 444 188 C434 190 428 180 436 174 C424 176 414 188 404 198 L392 150 L6 150 Z" fill="#D3242E" stroke="#1A1F2B" stroke-width="3.2" stroke-linejoin="round"/><path d="M-28 128 C-30 170 -16 206 26 210 L336 210 C366 210 384 198 396 180" fill="none" stroke="#F2C230" stroke-width="5" stroke-linecap="round"/><path d="M-26 196 C-14 214 4 219 26 220 L336 220 C360 220 378 212 390 200 L390 214 C376 224 360 226 336 226 L26 226 C0 226 -20 216 -26 196 Z" fill="#A51A22" opacity=".0"/></svg>';
  var SLEIGH_F='<svg class="xm-sleigh xm-sf" viewBox="-80 -70 1080 330" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M10 220 L10 238" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 220 L10 238" fill="none" stroke="#F2C230" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 220 L120 238" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 220 L120 238" fill="none" stroke="#F2C230" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M230 220 L230 238" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M230 220 L230 238" fill="none" stroke="#F2C230" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M330 220 L330 238" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M330 220 L330 238" fill="none" stroke="#F2C230" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M-50 240 L360 240 C404 240 430 228 438 208 C444 192 432 182 422 188 C414 194 420 204 428 200" fill="none" stroke="#1A1F2B" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M-50 240 L360 240 C404 240 430 228 438 208 C444 192 432 182 422 188 C414 194 420 204 428 200" fill="none" stroke="#F2C230" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M-46 238 L360 238" stroke="#FFE38A" stroke-width="1.6" stroke-linecap="round"/><path d="M386 194 C394 182 410 182 412 192 C413 200 404 203 401 197" fill="none" stroke="#1A1F2B" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M386 194 C394 182 410 182 412 192 C413 200 404 203 401 197" fill="none" stroke="#F2C230" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><g class="xm-d1"><g transform="translate(470 84) scale(1.0)"><path d="M124 82 L134 104 L120 120" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 82 L134 104 L120 120" fill="none" stroke="#6A4220" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M123.5 116.0 L120 120" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M70 84 L54 106 L38 122" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 84 L54 106 L38 122" fill="none" stroke="#6A4220" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M42.0 118.0 L38 122" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M160 14 L163 -4 L156 -20 M162 -3 L175 -11" fill="none" stroke="#1A1F2B" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M160 14 L163 -4 L156 -20 M162 -3 L175 -11" fill="none" stroke="#E0BC84" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M151 14 L145 -4 L133 -16 M146 -3 L156 -14 M140 -11 L143 -25" fill="none" stroke="#1A1F2B" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M151 14 L145 -4 L133 -16 M146 -3 L156 -14 M140 -11 L143 -25" fill="none" stroke="#E0BC84" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M132 78 L154 98 L176 104" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M132 78 L154 98 L176 104" fill="none" stroke="#8A5A2E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M170.5 102.5 L176 104" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M58 80 L36 100 L8 108" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 80 L36 100 L8 108" fill="none" stroke="#8A5A2E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.0 106.0 L8 108" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M40 62 C30 54 28 66 36 70 Z" fill="#F4EBDD" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 62 C40 48 70 46 100 50 C112 51 120 48 126 40 C132 30 138 22 146 16 C152 11 162 12 168 17 C176 22 184 25 188 30 C190 35 184 39 176 38 C168 37 160 36 154 40 C148 46 146 58 146 68 C146 82 132 92 112 92 L72 92 C52 92 36 84 36 72 C36 66 38 64 40 62 Z" fill="#8A5A2E" stroke="#1A1F2B" stroke-width="3" stroke-linejoin="round"/><path d="M64 91 C88 82 120 84 142 76 C138 87 126 92 112 92 L72 92 Z" fill="#C99A68"/><path d="M170 26 C178 26 186 28 187 33 C185 37 178 37 170 35 Z" fill="#C99A68"/><path d="M146 20 C136 10 128 12 130 16 C134 22 140 24 147 24 Z" fill="#8A5A2E" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M144 21 C138 15 134 15 134 17 C137 20 140 22 144 22Z" fill="#E7A9A0"/><circle cx="163" cy="22" r="3.2" fill="#1A1F2B"/><circle cx="164.2" cy="20.8" r="1.1" fill="#fff"/><ellipse cx="186" cy="31" rx="4.5" ry="3.8" fill="#2A1C14"/><path d="M100 51 C96 66 98 82 104 91" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 51 C96 66 98 82 104 91" fill="none" stroke="#C62835" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 43 C130 56 140 60 148 58" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 43 C130 56 140 60 148 58" fill="none" stroke="#C62835" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="136" cy="58" r="5.5" fill="#F2C230" stroke="#1A1F2B" stroke-width="2"/><path d="M133 59 L139 59" stroke="#1A1F2B" stroke-width="1.4"/><circle cx="99" cy="68" r="4" fill="#F2C230" stroke="#1A1F2B" stroke-width="2"/></g><path d="M440.0 176.0 Q504.5 196.0 569.0 152.0" fill="none" stroke="#1A1F2B" stroke-width="5.5" stroke-linecap="round"/><path d="M440.0 176.0 Q504.5 196.0 569.0 152.0" fill="none" stroke="#C62835" stroke-width="3" stroke-linecap="round"/></g><g class="xm-d2"><g transform="translate(675 84) scale(1.0)"><path d="M124 82 L134 104 L120 120" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 82 L134 104 L120 120" fill="none" stroke="#6A4220" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M123.5 116.0 L120 120" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M70 84 L54 106 L38 122" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 84 L54 106 L38 122" fill="none" stroke="#6A4220" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M42.0 118.0 L38 122" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M160 14 L163 -4 L156 -20 M162 -3 L175 -11" fill="none" stroke="#1A1F2B" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M160 14 L163 -4 L156 -20 M162 -3 L175 -11" fill="none" stroke="#E0BC84" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M151 14 L145 -4 L133 -16 M146 -3 L156 -14 M140 -11 L143 -25" fill="none" stroke="#1A1F2B" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M151 14 L145 -4 L133 -16 M146 -3 L156 -14 M140 -11 L143 -25" fill="none" stroke="#E0BC84" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M132 78 L154 98 L176 104" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M132 78 L154 98 L176 104" fill="none" stroke="#8A5A2E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M170.5 102.5 L176 104" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M58 80 L36 100 L8 108" fill="none" stroke="#1A1F2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 80 L36 100 L8 108" fill="none" stroke="#8A5A2E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.0 106.0 L8 108" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/><path d="M40 62 C30 54 28 66 36 70 Z" fill="#F4EBDD" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 62 C40 48 70 46 100 50 C112 51 120 48 126 40 C132 30 138 22 146 16 C152 11 162 12 168 17 C176 22 184 25 188 30 C190 35 184 39 176 38 C168 37 160 36 154 40 C148 46 146 58 146 68 C146 82 132 92 112 92 L72 92 C52 92 36 84 36 72 C36 66 38 64 40 62 Z" fill="#8A5A2E" stroke="#1A1F2B" stroke-width="3" stroke-linejoin="round"/><path d="M64 91 C88 82 120 84 142 76 C138 87 126 92 112 92 L72 92 Z" fill="#C99A68"/><path d="M170 26 C178 26 186 28 187 33 C185 37 178 37 170 35 Z" fill="#C99A68"/><path d="M146 20 C136 10 128 12 130 16 C134 22 140 24 147 24 Z" fill="#8A5A2E" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M144 21 C138 15 134 15 134 17 C137 20 140 22 144 22Z" fill="#E7A9A0"/><circle cx="163" cy="22" r="3.2" fill="#1A1F2B"/><circle cx="164.2" cy="20.8" r="1.1" fill="#fff"/><circle cx="187" cy="31" r="6.5" fill="#E8323C" stroke="#1A1F2B" stroke-width="2.4"/><circle cx="185" cy="29" r="2" fill="#fff" opacity=".7"/><path d="M100 51 C96 66 98 82 104 91" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 51 C96 66 98 82 104 91" fill="none" stroke="#C62835" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 43 C130 56 140 60 148 58" fill="none" stroke="#1A1F2B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 43 C130 56 140 60 148 58" fill="none" stroke="#C62835" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="136" cy="58" r="5.5" fill="#F2C230" stroke="#1A1F2B" stroke-width="2"/><path d="M133 59 L139 59" stroke="#1A1F2B" stroke-width="1.4"/><circle cx="99" cy="68" r="4" fill="#F2C230" stroke="#1A1F2B" stroke-width="2"/></g><path d="M616.0 146.0 Q695.0 160.0 774.0 152.0" fill="none" stroke="#1A1F2B" stroke-width="5.5" stroke-linecap="round"/><path d="M616.0 146.0 Q695.0 160.0 774.0 152.0" fill="none" stroke="#C62835" stroke-width="3" stroke-linecap="round"/></g></svg>';
  /* 꼬리말 위 눈 쌓인 곳: 왼쪽 트리 + 선물, 오른쪽 눈사람 (K 2026-11-26 "오른쪽 아래 비어 있잖아, 눈사람") */
  var SCENE='<div class="xm-scene" aria-hidden="true"><svg class="xm-tree" viewBox="0 0 200 172" aria-hidden="true" focusable="false"><g><ellipse cx="60" cy="168" rx="46" ry="6" fill="#B9CDE6" opacity=".55"/><rect x="52" y="140" width="16" height="22" rx="2" fill="#7A4A22" stroke="#1A1F2B" stroke-width="2.4"/><path d="M60 98 C70 114 104 132 110 146 C85.0 152 35.0 152 10 146 C16 132 50 114 60 98 Z" fill="#23874C" stroke="#1A1F2B" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 144 Q35.0 150 60 146 Q85.0 150 106 144 Q85.0 140 60 141 Q35.0 140 14 144 Z" fill="#fff" opacity=".95"/><path d="M60 68 C70 84 94 98 100 112 C80.0 118 40.0 118 20 112 C26 98 50 84 60 68 Z" fill="#2A9455" stroke="#1A1F2B" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 110 Q40.0 116 60 112 Q80.0 116 96 110 Q80.0 106 60 107 Q40.0 106 24 110 Z" fill="#fff" opacity=".95"/><path d="M60 36 C70 52 84 66 90 80 C75.0 86 45.0 86 30 80 C36 66 50 52 60 36 Z" fill="#23874C" stroke="#1A1F2B" stroke-width="2.6" stroke-linejoin="round"/><path d="M34 78 Q45.0 84 60 80 Q75.0 84 86 78 Q75.0 74 60 75 Q45.0 74 34 78 Z" fill="#fff" opacity=".95"/><path d="M30 104 Q60 116 88 98" fill="none" stroke="#F2C230" stroke-width="2.4"/><path d="M38 72 Q60 82 80 68" fill="none" stroke="#F2C230" stroke-width="2.4"/><circle cx="36" cy="128" r="4.6" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="34.6" cy="126.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="76" cy="132" r="4.6" fill="#2F6FE0" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="74.6" cy="130.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="56" cy="122" r="4.6" fill="#F2C230" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="54.6" cy="120.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="46" cy="96" r="4.6" fill="#2F6FE0" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="44.6" cy="94.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="74" cy="92" r="4.6" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="72.6" cy="90.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="58" cy="64" r="4.6" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="56.6" cy="62.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="90" cy="138" r="4.6" fill="#F2C230" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="88.6" cy="136.6" r="1.3" fill="#fff" opacity=".8"/><circle cx="28" cy="140" r="4.6" fill="#F2C230" stroke="#1A1F2B" stroke-width="1.6"/><circle cx="26.6" cy="138.6" r="1.3" fill="#fff" opacity=".8"/><path d="M60.0 22.0 L63.1 29.8 L71.4 30.3 L64.9 35.6 L67.1 43.7 L60.0 39.2 L52.9 43.7 L55.1 35.6 L48.6 30.3 L56.9 29.8 Z" fill="#F2C230" stroke="#1A1F2B" stroke-width="2.2" stroke-linejoin="round"/></g><g transform="translate(116 0)"><rect x="6" y="136" width="34" height="28" rx="2.5" fill="#D4252F" stroke="#1A1F2B" stroke-width="2.4"/><rect x="3" y="128" width="40" height="10" rx="2.5" fill="#E23A44" stroke="#1A1F2B" stroke-width="2.4"/><rect x="19.0" y="128" width="8" height="36" fill="#F2C230" stroke="#1A1F2B" stroke-width="1.6"/><path d="M23.0 128 C9.0 114 5.0 130 23.0 128 Z M23.0 128 C37.0 114 41.0 130 23.0 128 Z" fill="#F2C230" stroke="#1A1F2B" stroke-width="1.8" stroke-linejoin="round"/><rect x="44" y="146" width="26" height="18" rx="2.5" fill="#2E8B4E" stroke="#1A1F2B" stroke-width="2.4"/><rect x="41" y="138" width="32" height="10" rx="2.5" fill="#38A05C" stroke="#1A1F2B" stroke-width="2.4"/><rect x="53.0" y="138" width="8" height="26" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.6"/><path d="M57.0 138 C43.0 124 39.0 140 57.0 138 Z M57.0 138 C71.0 124 75.0 140 57.0 138 Z" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.8" stroke-linejoin="round"/></g></svg><svg class="xm-snowman" viewBox="0 0 124 172" aria-hidden="true" focusable="false"><ellipse cx="62" cy="168" rx="44" ry="6" fill="#B9CDE6" opacity=".55"/><path d="M36 112 L12 92 M22 100 L14 104 M18 96 L12 84" fill="none" stroke="#1A1F2B" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 112 L12 92 M22 100 L14 104 M18 96 L12 84" fill="none" stroke="#7A4A22" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M88 110 L110 82 M104 90 L114 92 M108 85 L104 74 M110 82 L118 76" fill="none" stroke="#1A1F2B" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M88 110 L110 82 M104 90 L114 92 M108 85 L104 74 M110 82 L118 76" fill="none" stroke="#7A4A22" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="128" r="38" fill="#fff" stroke="#1A1F2B" stroke-width="2.8"/><path d="M96 112 A38 38 0 0 1 40 158 A42 42 0 0 0 96 112 Z" fill="#DCE7F5"/><path d="M36 104 A30 30 0 0 1 52 94" fill="none" stroke="#fff" stroke-width="0"/><circle cx="62" cy="70" r="26" fill="#fff" stroke="#1A1F2B" stroke-width="2.8"/><path d="M84 60 A26 26 0 0 1 52 94 A28 28 0 0 0 84 60 Z" fill="#DCE7F5"/><circle cx="62" cy="112" r="3.6" fill="#2B3140"/><circle cx="61" cy="110.8" r="1" fill="#fff" opacity=".7"/><circle cx="62" cy="128" r="3.6" fill="#2B3140"/><circle cx="61" cy="126.8" r="1" fill="#fff" opacity=".7"/><circle cx="62" cy="144" r="3.6" fill="#2B3140"/><circle cx="61" cy="142.8" r="1" fill="#fff" opacity=".7"/><path d="M38 88 C48 98 76 98 86 88 L88 96 C76 106 48 106 36 96 Z" fill="#D4252F" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 96 L52 103 M62 98 L62 105 M74 96 L72 103" stroke="#2E8B4E" stroke-width="4"/><path d="M72 98 L80 128 L92 124 L84 96 Z" fill="#D4252F" stroke="#1A1F2B" stroke-width="2.4" stroke-linejoin="round"/><path d="M76 108 L87 105 M79 117 L90 114" stroke="#2E8B4E" stroke-width="4"/><path d="M81 128 L80 133 M85 127 L85 132 M89 126 L90 131" stroke="#1A1F2B" stroke-width="2" stroke-linecap="round"/><ellipse cx="53" cy="66" rx="3.2" ry="3.8" fill="#2B3140"/><circle cx="54" cy="64.6" r="1.1" fill="#fff"/><ellipse cx="71" cy="66" rx="3.2" ry="3.8" fill="#2B3140"/><circle cx="72" cy="64.6" r="1.1" fill="#fff"/><circle cx="46" cy="76" r="4" fill="#F7A8B0" opacity=".8"/><circle cx="78" cy="76" r="4" fill="#F7A8B0" opacity=".8"/><path d="M61 72 L84 77 L61 79 Z" fill="#F28C28" stroke="#1A1F2B" stroke-width="2" stroke-linejoin="round"/><path d="M68 74 L69 77 M74 75.5 L75 78" stroke="#C9661A" stroke-width="1.2"/><circle cx="52" cy="82" r="1.6" fill="#2B3140"/><circle cx="56" cy="85" r="1.6" fill="#2B3140"/><circle cx="61" cy="86.5" r="1.6" fill="#2B3140"/><circle cx="66" cy="86" r="1.6" fill="#2B3140"/><circle cx="70" cy="83.5" r="1.6" fill="#2B3140"/><rect x="44" y="18" width="34" height="30" rx="4" fill="#2B3140" stroke="#1A1F2B" stroke-width="2.6" transform="rotate(-8 61 46)"/><rect x="44" y="38" width="34" height="7" fill="#D4252F" transform="rotate(-8 61 46)"/><ellipse cx="61" cy="48" rx="27" ry="6" fill="#2B3140" stroke="#1A1F2B" stroke-width="2.6" transform="rotate(-8 61 48)"/><path d="M50 22 L52 34" stroke="#4A5266" stroke-width="3" stroke-linecap="round" transform="rotate(-8 61 46)"/><path d="M70 40 C74 33 82 34 84 31 C83 37 80 41 74 42 Z" fill="#2E8B4E" stroke="#1A1F2B" stroke-width="1.6" stroke-linejoin="round"/><circle cx="70" cy="42" r="3" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.4"/><circle cx="75" cy="44" r="3" fill="#E8323C" stroke="#1A1F2B" stroke-width="1.4"/><path d="M14 166 Q30 154 50 160 Q70 152 92 160 Q106 156 112 166 Z" fill="#fff" stroke="#AFC6E4" stroke-width="1.6" stroke-linejoin="round"/></svg></div>';
  var HOLLY='<svg class="xm-holly" viewBox="-62 -40 124 64" aria-hidden="true"><g transform="translate(0 0) rotate(0) scale(1)"><g transform="rotate(-150)"><path d="M0 0 Q6.0 -0.8 12.0 -10.0 Q18.0 -1.7 24.0 -13.0 Q30.0 -1.7 36.0 -10.0 Q42.0 -0.8 48.0 0.0 Q42.0 0.8 36.0 10.0 Q30.0 1.7 24.0 13.0 Q18.0 1.7 12.0 10.0 Q6.0 0.8 0.0 0.0 Z" fill="#1F7A44" stroke="#1A1F2B" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 0 Q24 -2 42 0" fill="none" stroke="#7FD49B" stroke-width="1.8" stroke-linecap="round" opacity=".9"/></g><g transform="rotate(-30)"><path d="M0 0 Q6.0 -0.8 12.0 -10.0 Q18.0 -1.7 24.0 -13.0 Q30.0 -1.7 36.0 -10.0 Q42.0 -0.8 48.0 0.0 Q42.0 0.8 36.0 10.0 Q30.0 1.7 24.0 13.0 Q18.0 1.7 12.0 10.0 Q6.0 0.8 0.0 0.0 Z" fill="#2A9455" stroke="#1A1F2B" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 0 Q24 -2 42 0" fill="none" stroke="#7FD49B" stroke-width="1.8" stroke-linecap="round" opacity=".9"/></g><circle cx="-6" cy="4" r="6.4" fill="#D42330" stroke="#1A1F2B" stroke-width="2"/><circle cx="-8" cy="1.7999999999999998" r="1.9" fill="#fff" opacity=".85"/><circle cx="6" cy="5" r="6.4" fill="#D42330" stroke="#1A1F2B" stroke-width="2"/><circle cx="4" cy="2.8" r="1.9" fill="#fff" opacity=".85"/><circle cx="0" cy="-5" r="6.4" fill="#D42330" stroke="#1A1F2B" stroke-width="2"/><circle cx="-2" cy="-7.2" r="1.9" fill="#fff" opacity=".85"/></g></svg>', CAP='<svg class="xm-cap" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M0 14 Q4 4 14 6 Q24 1 36 5 Q48 0 60 5 Q70 2 82 6 Q94 0 108 5 Q120 1 132 6 Q144 0 158 5 Q170 2 182 5 Q194 3 200 14 Z" vector-effect="non-scaling-stroke"/></svg>', SCAP='<svg class="xm-cap xm-cap-s" viewBox="0 0 60 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 Q3 3 12 5 Q22 0 32 4 Q44 0 52 5 Q58 6 60 12 Z" vector-effect="non-scaling-stroke"/></svg>';
  function fit(){   /* 순록이 메뉴 · 화면 끝과 겹치는지 보고 숨김 */
    var f=document.querySelector('.xm-sf'); if(!f) return;
    f.classList.remove('no-d1','no-d2');
    var nav=document.querySelector('.band .navcol')||document.querySelector('.band .nav');
    var hit=function(sel){ var g=f.querySelector(sel); if(!g) return false; var r=g.getBoundingClientRect(), W=document.documentElement.clientWidth;
      if(r.right>W-6) return true; if(!nav) return false; var n=nav.getBoundingClientRect();
      return r.right>n.left-8 && r.bottom>n.top && r.top<n.bottom; };
    if(hit('.xm-d2')) f.classList.add('no-d2');
    if(f.classList.contains('no-d2')&&hit('.xm-d1')) f.classList.add('no-d1');
  }
  function decorate(){
    document.querySelectorAll('h1.logo').forEach(function(h){ if(h.querySelector('.xm-sleigh')) return; h.insertAdjacentHTML('afterbegin',SLEIGH_B); h.insertAdjacentHTML('beforeend',SLEIGH_F); });
    var nav=document.querySelector('.band .nav'); if(nav&&!nav.querySelector('.xm-cap')) nav.insertAdjacentHTML('beforeend',CAP+HOLLY);
    var lv=document.querySelector('.lvsnd-btn'); if(lv&&!lv.querySelector('.xm-cap')) lv.insertAdjacentHTML('beforeend',SCAP+HOLLY);
    /* 전구 줄은 K 요청으로 뺌 (2026-11-26 "밑에 전구를 없애줘", CSS .xm-lights는 남겨 둠) */
    var ft=document.querySelector('.site-foot'); if(ft&&!ft.querySelector('.xm-scene')) ft.insertAdjacentHTML('afterbegin',SCENE);
    fit();
  }
  window.addEventListener('resize',fit);
  function mount(){
    document.querySelectorAll('h1.logo').forEach(function(h){ if(h.querySelector('.xm-deco')) return; h.insertAdjacentHTML('beforeend',DECO); });
    var band=document.querySelector('.band'); if(band&&!band.querySelector('.xm-ledge')){ var l=document.createElement('div'); l.className='xm-ledge'; l.setAttribute('aria-hidden','true'); band.appendChild(l); }
    var foot=document.querySelector('.site-foot'); if(foot&&!foot.querySelector('.xm-bank')){ var b=document.createElement('div'); b.className='xm-bank'; b.setAttribute('aria-hidden','true'); foot.insertBefore(b,foot.firstChild); }
    decorate(); setTimeout(decorate,300); setTimeout(fit,1200);
    snow();
  }
  function snow(){
    try{ if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
    if(document.querySelector('.xm-snow')) return;
    var cv=document.createElement('canvas'); cv.className='xm-snow'; cv.setAttribute('aria-hidden','true'); document.body.appendChild(cv);
    var cx=cv.getContext('2d'); if(!cx) return;
    var W=0,H=0,dpr=1,fl=[],last=0,run=true;
    function size(){ dpr=Math.min(2,window.devicePixelRatio||1); W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
      var n=Math.max(28,Math.min(90,Math.round(W*H/15000)));
      while(fl.length<n) fl.push(mk(true)); fl.length=n; }
    function mk(any){ var r=1.2+Math.random()*2.8; return {x:Math.random()*W,y:any?Math.random()*H:-8,r:r,v:18+r*9+Math.random()*10,a:Math.random()*6.28,w:0.6+Math.random()*1.2,s:8+Math.random()*18,o:0.55+Math.random()*0.4}; }
    function frame(t){
      if(!run) return;
      var dt=last?Math.min(0.05,(t-last)/1000):0.016; last=t;
      cx.clearRect(0,0,W,H);
      var dark=root.getAttribute('data-theme')==='dark';
      cx.fillStyle=dark?'#FFFFFF':'#9DB9DD';
      for(var i=0;i<fl.length;i++){ var f=fl[i];
        f.y+=f.v*dt; f.a+=f.w*dt; var x=f.x+Math.sin(f.a)*f.s;
        if(f.y>H+8){ fl[i]=mk(false); continue; }
        cx.globalAlpha=f.o*(dark?0.8:0.85); cx.beginPath(); cx.arc(x,f.y,f.r,0,6.2832); cx.fill(); }
      cx.globalAlpha=1;
      requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize',size);
    document.addEventListener('visibilitychange',function(){ if(document.hidden){ run=false; } else if(!run){ run=true; last=0; requestAnimationFrame(frame); } });
    requestAnimationFrame(frame);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
