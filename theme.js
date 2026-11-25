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
  function mount(){
    document.querySelectorAll('h1.logo').forEach(function(h){ if(h.querySelector('.xm-deco')) return; h.insertAdjacentHTML('beforeend',DECO); });
    var band=document.querySelector('.band'); if(band&&!band.querySelector('.xm-ledge')){ var l=document.createElement('div'); l.className='xm-ledge'; l.setAttribute('aria-hidden','true'); band.appendChild(l); }
    var foot=document.querySelector('.site-foot'); if(foot&&!foot.querySelector('.xm-bank')){ var b=document.createElement('div'); b.className='xm-bank'; b.setAttribute('aria-hidden','true'); foot.insertBefore(b,foot.firstChild); }
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
