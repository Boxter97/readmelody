/* 피아노 소리: Salamander Grand Piano (Alexander Holm, CC BY 3.0) — 페이지 맨 아래 출처 표기 필수
   2026-11-13 K 선택 "A_Salamander_그랜드": 원본 녹음(FLAC, 세기 16단계)에서 다시 뽑음.
   - piano/ 폴더: C2~C7, 건반 3개마다 하나 (36 39 … 96), 세기 2단계 — p(부드럽게, 원본 v9) · f(조금 세게, 원본 v12)
     스테레오 112kbps · 4.6초. 파일 이름 = MIDI 번호 + p/f (예: 60f.mp3 = 가운데 도, 세게)
   - 음 높이는 원본 그대로 확인함 (파♯3처럼 기본음이 약한 음도 배음으로 확인)
   - 세게(vol 0.9 이상, 멜로디 · 한 음) = f, 그보다 작게(코드 음) = p
   - 방 울림(잔향)을 조금 섞음 (1.6초, 시안과 같은 양)
   예전 소리(모노 64kbps, 한 가지 세기, A2~A5)는 커밋 4b4d624 이전의 piano.js */
(function(){
  var src=(document.currentScript&&document.currentScript.src)||'';
  var BASE=src.replace(/piano\.js(\?.*)?$/,'')+'piano/';
  var NOTES=[]; for(var m=36;m<=96;m+=3) NOTES.push(m);
  var WET=0.22;   // 잔향 양 (울림 소리 크기 / 원래 소리 크기)

  // 모든 소리 파일을 받아서 [MIDI, 소리, 'p'|'f'] 목록으로
  window.gmPianoLoad=function(c){
    var jobs=[];
    NOTES.forEach(function(m){ ['p','f'].forEach(function(l){
      jobs.push(fetch(BASE+m+l+'.mp3').then(function(r){ if(!r.ok) throw new Error('piano '+m+l); return r.arrayBuffer(); })
        .then(function(ab){ return new Promise(function(res,rej){ c.decodeAudioData(ab,res,rej); }); })
        .then(function(buf){ return [m,buf,l]; }));
    }); });
    return Promise.all(jobs);
  };
  // 치려는 음에 가장 가까운 녹음 (세기에 맞는 쪽)
  window.gmPianoPick=function(list,midi,vol){
    var want=vol>=0.9?'f':'p', best=null;
    for(var i=0;i<list.length;i++){ var b=list[i]; if(b[2]!==want) continue; if(!best||Math.abs(b[0]-midi)<Math.abs(best[0]-midi)) best=b; }
    return best||list[0];
  };
  // 피아노 소리가 나가는 곳: 원래 소리 + 방 울림 → master
  window.gmPianoOut=function(c,master){
    if(c.__gmPianoOut&&c.__gmPianoOut.m===master) return c.__gmPianoOut.n;
    var inp=c.createGain(), dry=c.createGain(), wet=c.createGain(), cv=c.createConvolver();
    var sr=c.sampleRate, n=Math.floor(1.6*sr), ir=c.createBuffer(2,n,sr), seed=1;
    var rnd=function(){ seed=(seed*16807)%2147483647; return seed/1073741823.5-1; };
    for(var ch=0;ch<2;ch++){ var d=ir.getChannelData(ch); for(var i=0;i<n;i++) d[i]=i<sr*0.012?0:rnd()*Math.exp(-i/sr*6.9/1.6); }
    cv.normalize=true; cv.buffer=ir;
    dry.gain.value=1-WET; wet.gain.value=WET*window.__gmPianoWetK;
    inp.connect(dry); dry.connect(master); inp.connect(cv); cv.connect(wet); wet.connect(master);
    c.__gmPianoOut={m:master,n:inp}; return inp;
  };
  window.__gmPianoWetK=2.5;   // 잔향 세기 보정 (울림 꼭대기가 원래 소리의 약 22%가 되게, 시안과 같은 양)
})();
