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
