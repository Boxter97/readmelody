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
    if(!btn) return;
    var d=isDark();
    document.querySelectorAll('.logo img').forEach(function(i){ var src=i.getAttribute('src'); i.setAttribute('src',d?src.replace(/logo\.png$/,'logo-dark.png'):src.replace(/logo-dark\.png$/,'logo.png')); });   // 다크면 노란 로고
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
  function mount(){
    var nav=document.querySelector('.band .nav'); if(!nav||btn) return;
    btn=document.createElement('button'); btn.type='button'; btn.className='theme-btn';
    btn.addEventListener('click',function(){ set(isDark()?'light':'dark'); });
    nav.parentNode.insertBefore(btn,nav.nextSibling);
    paint();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
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
    var col=document.createElement('div'); col.className='navcol';
    nav.parentNode.insertBefore(col,nav); col.appendChild(nav);
    var row=document.createElement('div'); row.className='vol-row';
    row.innerHTML='<button type="button" class="vol-btn"></button><input type="range" min="0" max="100" step="5" aria-label="소리 크기"><b class="vol-num"></b>';
    col.appendChild(row);
    var btn=row.querySelector('.vol-btn'), rg=row.querySelector('input'), num=row.querySelector('.vol-num');
    var paint=function(){ btn.innerHTML=vol?ON:OFF; btn.setAttribute('aria-label',vol?'소리 끄기':'소리 켜기'); rg.value=vol; num.textContent=vol; rg.style.setProperty('--p',vol+'%'); };
    var setV=function(v){ vol=v; try{ localStorage.setItem(KEY,vol); }catch(e){} paint(); apply(); };
    rg.addEventListener('input',function(){ setV(+rg.value); });
    btn.addEventListener('click',function(){ if(vol){ before=vol; setV(0); } else setV(before||100); });
    var fit=function(){   // 막대 너비 = 즉흥연주 칸 왼쪽 ~ 메뉴 오른쪽 끝
      var a=nav.querySelectorAll('a')[4]; if(!a) return;   // 5번째 칸 = 즉흥연주
      var w=nav.getBoundingClientRect().right-a.getBoundingClientRect().left;
      if(w>0) row.style.width=Math.round(w/(parseFloat(getComputedStyle(document.documentElement).zoom)||1))+'px';
    };
    fit(); window.addEventListener('resize',fit); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);
    window.__gmVolPaint=paint;
    paint();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(mount,0); }); else setTimeout(mount,0);
  window.addEventListener('storage',function(e){ if(e.key===KEY){ var v=parseInt(e.newValue,10); if(v>=0&&v<=100){ vol=v; apply(); if(window.__gmVolPaint) window.__gmVolPaint(); } } });
})();
