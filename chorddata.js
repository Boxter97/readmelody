/* 코드 사전 데이터 — 코드&스케일(코드 카드)과 코드 초견(코드 잡는 법)이 같이 씀 (K 요청 2026-11-27)
   코드 모양을 더하거나 고칠 때는 이 파일만 고치면 두 페이지에 같이 들어감 */
window.GM_CHORDS=(()=>{
const LETTERS=['C','D','E','F','G','A','B'];
const SEMI=[0,2,4,5,7,9,11];
const accTxt=a=>a>0?'♯'.repeat(a):a<0?'♭'.repeat(-a):'';
function spell(r,k,s){ const li=(r.li+k)%7; let a=((r.pc+s)-SEMI[li])%12; if(a>6)a-=12; if(a<-6)a+=12; return {li,a,pc:((r.pc+s)%12+12)%12}; }
const mkRoot=(li,acc)=>({li,acc,pc:((SEMI[li]+acc)%12+12)%12,label:LETTERS[li]+accTxt(acc)});

/* 코드 — 교재 '통기타 초급 과정' 부록 코드표 5장 그대로 (K 요청 2026-11-16)
   frets: 6번 줄 → 1번 줄, x = 안 침, 0 = 개방현. barre: [프렛, 시작 줄, 끝 줄] (0 = 6번 줄) */
const QUAL={
  '':    {kr:'메이저',       iv:[[0,0,'1'],[2,4,'3'],[4,7,'5']]},
  'm':   {kr:'마이너',       iv:[[0,0,'1'],[2,3,'♭3'],[4,7,'5']]},
  '7':   {kr:'도미넌트7',    iv:[[0,0,'1'],[2,4,'3'],[4,7,'5'],[6,10,'♭7']]},
  'm7':  {kr:'마이너7',      iv:[[0,0,'1'],[2,3,'♭3'],[4,7,'5'],[6,10,'♭7']]},
  'M7':  {kr:'메이저7',      iv:[[0,0,'1'],[2,4,'3'],[4,7,'5'],[6,11,'7']]},
  'm7♭5':{kr:'하프 디미니쉬', iv:[[0,0,'1'],[2,3,'♭3'],[4,6,'♭5'],[6,10,'♭7']]},
  /* 코드 사전으로 키움 (K 확정 2026-11-17 1안 "다 넣어줘") */
  'dim7':{kr:'디미니쉬7',     iv:[[0,0,'1'],[2,3,'♭3'],[4,6,'♭5'],[6,9,'♭♭7']]},
  'aug7':{kr:'어그먼트7',     iv:[[0,0,'1'],[2,4,'3'],[4,8,'♯5'],[6,10,'♭7']]},   // K 2026-11-17 "dim7 다음에 aug7"
  '6':   {kr:'식스',          iv:[[0,0,'1'],[2,4,'3'],[4,7,'5'],[5,9,'6']]},
  'm6':  {kr:'마이너 식스',    iv:[[0,0,'1'],[2,3,'♭3'],[4,7,'5'],[5,9,'6']]},
  'add9':{kr:'애드 나인',      iv:[[0,0,'1'],[2,4,'3'],[4,7,'5'],[1,2,'9']]},   // K 2026-11-17 "9코드는 add9로"
  'sus4':{kr:'서스포',         iv:[[0,0,'1'],[3,5,'4'],[4,7,'5']]},
  '7sus4':{kr:'세븐 서스포',   iv:[[0,0,'1'],[3,5,'4'],[4,7,'5'],[6,10,'♭7']]},   // K 2026-11-17 "7sus4 mM7 넣어야겠다"
  'mM7':{kr:'마이너 메이저7', iv:[[0,0,'1'],[2,3,'♭3'],[4,7,'5'],[6,11,'7']]},
  'dim': {kr:'디미니쉬',       iv:[[0,0,'1'],[2,3,'♭3'],[4,6,'♭5']]},
  'aug': {kr:'어그먼트',       iv:[[0,0,'1'],[2,4,'3'],[4,8,'♯5']]},
};
const C=(r,q,frets,barre)=>({r,q,frets:typeof frets==='string'?frets.split('').map(x=>x==='x'?'x':+x):frets,barre,name:r+q});
/* 하이 코드 (K 요청 2026-11-16 "C D E F G A B 모두 하이 코드, 5번 줄 6번 줄"): 근음마다 6번 줄 근음 · 5번 줄 근음 모양, 종류는 교재 하이 코드와 같은 M · 7 · m · m7 */
const ROOT6={C:8,D:10,E:12,F:1,G:3,A:5,B:7}, ROOT5={C:3,D:5,E:7,F:8,G:10,A:12,B:2}, ROOT4={C:10,D:12,E:2,F:3,G:5,A:7,B:9};
const SH6={'':[0,2,2,1,0,0],'7':[0,2,0,1,0,0],'m':[0,2,2,0,0,0],'m7':[0,2,0,0,0,0]};   // 하이 코드 = 교재 하이 코드(F · B) 모양
const SH5={'':['x',0,2,2,2,0],'7':['x',0,2,0,2,0],'m':['x',0,2,2,1,0],'m7':['x',0,2,0,1,0]};
/* 7th 코드 (K 요청 2026-11-17 "7th 코드 왜 G밖에 없어"): 교재 7th 코드(G · C) 모양을 근음 7개로 — M7 · 7 · m7 · m7♭5 */
const SV6={'M7':[0,'x',1,1,0,'x'],'7':[0,'x',0,1,0,'x'],'m7':[0,'x',0,0,0,'x'],'m7♭5':[0,'x',0,0,-1,'x']};   // GM7 3x443x · G7 3x343x · Gm7 3x333x · Gm7♭5 3x332x
const SV5={'M7':['x',0,2,1,2,0],'7':['x',0,2,0,2,0],'m7':['x',0,2,0,1,0],'m7♭5':['x',0,1,0,1,'x']};       // CM7 x35453 · C7 x35353 · Cm7 x35343 · Cm7♭5 x3434x
/* 가장 낮은 프렛을 두 줄 이상 누르는 바레 (그 사이 줄은 모두 그 프렛 이상) — m6 5 · 4번 줄 근음 (K 2026-11-19 "바레코드야") */
const LOWBAR=fr=>{ const fs=fr.filter(x=>x!=='x'), lo=Math.min(...fs), bs=fr.map((x,i)=>x===lo?i:-1).filter(i=>i>=0); if(bs.length<2) return undefined; const a=bs[0], z=bs[bs.length-1]; return fr.slice(a,z+1).every(x=>x!=='x'&&x>=lo)?[lo,a,z]:undefined; };
const MAKE=(s,shapes,label,barreOK)=>LETTERS.flatMap(r=>Object.keys(shapes).map(q=>{ const f=({6:ROOT6,5:ROOT5,4:ROOT4})[s][r], sh=shapes[q];
  let fr=sh.map(x=>x==='x'?'x':x+f); if(Math.min(...fr.filter(x=>x!=='x'))<1) fr=fr.map(x=>x==='x'?'x':x+12);   // 개방현이 생기면(F m7♭5) 12프렛 위로
  const bo=barreOK(q), bar=bo==='low'?LOWBAR(fr):bo?[f,s===6?0:1,5]:undefined;
  return Object.assign(C(r,q,fr,bar),{grp:s+'번 줄 '+label}); }));
/* 새 종류 모양 (Claude가 많이 쓰는 모양으로 고름, K 확인 전) — 6번 줄 · 5번 줄 근음, 숫자는 근음 프렛에서 몇 칸 */
/* 6번 줄 add9(C 8 7 5 7 8 x)는 뺌 — 기타로 못 잡는 모양 (K 2026-11-19) */
const NEW6={'7sus4':[0,2,0,2,0,0],'mM7':[0,'x',1,0,0,'x'],'6':[0,'x',-1,1,0,'x'],'m6':[0,'x',-1,0,0,'x'],'aug7':[0,'x',0,1,1,'x'],'sus4':[0,2,2,2,0,0],'dim':[0,'x','x',0,-1,0],'aug':[0,'x',2,1,1,'x'],'dim7':[0,'x',-1,0,-1,'x']};
const NEW5={'7sus4':['x',0,2,0,3,0],'mM7':['x',0,2,1,1,0],'6':['x',0,-1,-1,-2,'x'],'m6':['x',0,-2,-1,-2,'x'],'add9':['x',0,-1,-3,0,'x'],'aug7':['x',0,'x',0,2,1],'sus4':['x',0,2,2,3,0],'dim':['x',0,1,2,1,'x'],'aug':['x',0,-1,-2,-2,'x'],'dim7':['x',0,1,-1,1,'x']};
/* 4번 줄 근음 (K 요청 2026-11-17, 6 · m6만): 6 = 1 · 3 · 6 · 1, m6 = 1 · ♭3 · 6 · 1 (5번 줄 모양과 같은 순서) */
const NEW4={'6':['x','x',0,-1,0,-2],'m6':['x','x',0,-2,0,-2]};
/* 바레가 아닌 모양은 "○번 줄 근음" 이름표 (K 2026-11-17 "하이코드가 아닌데") */
const NOBAR=list=>list.map(c=>!c.barre?Object.assign(c,{grp:c.grp.replace('하이 코드','근음')}):c);
const BAR6={'sus4':1,'7sus4':1}, BAR5={'sus4':1,'7sus4':1,'mM7':1,'m6':'low','aug':'low'}, BAR4={'m6':'low'};   // 6은 m6 모양에서 3음만 올린 모양이라 바레 없음 (K 요청 2026-11-17)
/* 줄 모양 계산 (보이싱 · 트라이어드와 같은 규칙): ord = 아래 줄부터 코드 음 번호, strs = 줄(0 = 6번 줄), 개방현이 생기면 12프렛 위로 */
const STRP=[40,45,50,55,59,64];
function shapeFr(r,q,ord,strs){
  const rp=(SEMI[LETTERS.indexOf(r)])%12, iv=QUAL[q].iv; let prev=-1;
  const ms=ord.map((k,j)=>{ const st=strs[j], pc=(rp+iv[k][1])%12; let m=j?prev+1:STRP[st]; while(m%12!==pc) m++; prev=m; return [st,m]; });
  let add=0; if(Math.min(...ms.map(([st,m])=>m-STRP[st]))<1) add=12;
  const fr=['x','x','x','x','x','x']; ms.forEach(([st,m])=>fr[st]=m-STRP[st]+add); return fr;
}
const T7=['M7','7','m7','m7♭5','dim7','aug7'], TRIQ=['','m','dim','aug'];
const D2ORD=[[0,2,3,1],[1,3,0,2],[2,0,1,3],[3,1,2,0]];               // 드롭2: 기본 위치 · 1전위 · 2전위 · 3전위 (아래 줄부터)
const D2SETS=[['6~3번 줄',[0,1,2,3]],['5~2번 줄',[1,2,3,4]],['4~1번 줄',[2,3,4,5]]];
const TRORD=[[0,1,2],[1,2,0],[2,0,1]];                                // 트라이어드: 기본 위치 · 1전위 · 2전위
const TRSETS=[['5~3번 줄',[1,2,3]],['4~2번 줄',[2,3,4]],['3~1번 줄',[3,4,5]]];
const bassName=(r,q,inv)=>{ const k=[0,1,2,3][inv], v=QUAL[q].iv[k], n=spell(mkRoot(LETTERS.indexOf(r),0),v[0],v[1]); return LETTERS[n.li]+accTxt(n.a); };
const INVC=(r,q,inv,fr,grp)=>Object.assign(C(r,q,fr),{inv,name:r+q+(inv?'/'+bassName(r,q,inv):''),grp});
const GEN=[];
LETTERS.forEach(r=>{
  T7.forEach(q=>{                                                     // 7th 코드: 드롭2 (기본 위치 · 전위) + 쉘
    D2SETS.forEach(([n,strs])=>GEN.push(INVC(r,q,0,shapeFr(r,q,D2ORD[0],strs),'드롭2 · '+n)));   // 전위는 뺌 (K 요청 2026-11-17)
    GEN.push(INVC(r,q,0,shapeFr(r,q,[0,3,1,2],[0,2,3,4]),'드롭3 · 6 · 4 · 3 · 2번 줄'));
    GEN.push(INVC(r,q,0,shapeFr(r,q,[0,3,1,2],[1,3,4,5]),'드롭3 · 5 · 3 · 2 · 1번 줄'));   // K 요청 2026-11-17   // 드롭3 기본 위치 R 7 3 5 (예전 6번 줄 7th 코드 자리, K 요청 2026-11-17)
    if(q!=='m7♭5'&&q!=='aug7'){ GEN.push(INVC(r,q,0,shapeFr(r,q,[0,3,1],[0,2,3]),'쉘 · 6번 줄 근음')); GEN.push(INVC(r,q,0,shapeFr(r,q,[0,1,3],[1,2,3]),'쉘 · 5번 줄 근음')); }
  });
});
/* 오픈 분수코드 (전위) — 많이 쓰는 것, Claude가 고름 */
const OS=(r,q,inv,fr)=>INVC(r,q,inv,fr.split('').map(x=>x==='x'?'x':+x),'오픈 코드');
const OPENSLASH=[OS('C','',1,'032010'),OS('C','',2,'332010'),OS('D','',1,'2x0232'),OS('D','',2,'x00232'),OS('E','',1,'4x2100'),
  OS('F','',1,'x03211'),OS('F','',2,'x33211'),OS('G','',1,'x20003'),OS('G','',2,'xx0003'),OS('A','',1,'x42220'),OS('A','',2,'002220'),
  OS('A','m',1,'x32210'),OS('A','m',2,'002210'),OS('E','m',1,'3x2000'),OS('E','m',2,'x22000'),OS('D','m',1,'1x0231'),OS('D','m',2,'x00231'),
  OS('C','7',1,'032310'),OS('G','7',3,'1x0001'),OS('D','7',3,'x30212'),OS('A','7',2,'002020'),OS('E','7',2,'x20100')];
const GROUPS=[
  {id:'major',name:'기본 메이저',title:'기본 코드 (메이저)',chords:[C('A','','x02220'),C('E','','022100'),C('D','','xx0232'),C('C','','x32010'),C('G','','320003')]},
  {id:'minor',name:'기본 마이너',title:'기본 코드 (마이너 · 마이너7)',chords:[C('A','m','x02210'),C('E','m','022000'),C('D','m','xx0231'),C('A','m7','x02010'),C('E','m7','020000'),C('D','m7','xx0211')]},
  {id:'dom',name:'기본 7th',title:'기본 코드 (7th)',chords:[C('A','7','x02020'),C('E','7','020100'),C('D','7','xx0212'),C('C','7','x32310'),C('G','7','320001'),C('B','7','x21202')]},
  {id:'openM7',name:'오픈 코드',title:'기본 코드',chords:[C('C','M7','x32000'),C('D','M7','xx0222'),C('E','M7','021100'),C('F','M7','xx3210'),C('G','M7','320002'),C('A','M7','x02120')]},   // 오픈 M7 (K 요청 2026-11-16), B는 오픈 모양이 없음
  {id:'opensus',name:'오픈 코드',title:'기본 코드',chords:[C('A','sus4','x02230'),C('D','sus4','xx0233'),C('E','sus4','022200'),C('A','6','x02222'),C('D','6','xx0202'),C('E','6','022120'),C('A','m6','x02212'),C('D','m6','xx0201'),C('E','m6','022020'),C('C','add9','x32030'),C('G','add9','3x0203'),C('E','add9','024100'),C('A','add9','x02420'),C('A','7sus4','x02030'),C('D','7sus4','xx0213'),C('E','7sus4','020200'),C('A','mM7','x02110'),C('D','mM7','xx0221'),C('E','mM7','021000')]},
  {id:'barre6',name:'하이 코드',title:'6번 줄 하이 코드',chords:MAKE(6,SH6,'하이 코드',()=>true)},
  {id:'barre5',name:'하이 코드',title:'5번 줄 하이 코드',chords:MAKE(5,SH5,'하이 코드',()=>true)},
  {id:'new6',name:'하이 코드',title:'6번 줄 하이 코드',chords:NOBAR(MAKE(6,NEW6,'하이 코드',q=>BAR6[q]))},
  {id:'new5',name:'하이 코드',title:'5번 줄 하이 코드',chords:NOBAR(MAKE(5,NEW5,'하이 코드',q=>BAR5[q]))},
  {id:'new4',name:'하이 코드',title:'4번 줄 하이 코드',chords:NOBAR(MAKE(4,NEW4,'하이 코드',q=>BAR4[q]))},
  // 6번 줄 7th 코드(seven6)는 뺌 — 드롭3 · 6 · 4 · 3 · 2번 줄 기본 위치와 같은 모양이라 드롭3 카드로 나옴 (K 요청 2026-11-17)
  {id:'seven5',name:'7th 코드',title:'5번 줄 7th 코드',chords:MAKE(5,{'M7':SV5['M7']},'7th 코드',()=>true)},   // M7만 (K 2026-11-17 뺐다가 다시 넣음). 7 · m7은 5번 줄 하이 코드, m7♭5는 드롭2 · 5~2번 줄과 똑같은 모양이라 그쪽으로 나옴
  {id:'gen',name:'보이싱',title:'보이싱',chords:GEN},
];

/* 사전 목록: 같은 이름 · 같은 모양은 하나만, 이름표(grp)가 없으면 묶음 제목으로 */
const flatten=()=>{ const seen=new Set(), out=[];
  GROUPS.forEach(g=>g.chords.forEach(c=>{ const k=c.name+'|'+c.frets.join(','); if(seen.has(k)) return; seen.add(k);
    out.push(Object.assign(c,{grp:c.grp||(g.id.startsWith('barre')?g.title:g.title.replace(/ \(.*/,'').replace('기본 코드','오픈 코드'))})); }));
  return out; };
/* 같은 근음 · 종류 안의 순서: 오픈 → 6 · 5 · 4 · 3번 줄 → 5번 줄 7th → 드롭2 → 드롭3 → 쉘 → 트라이어드 */
const GRANK=g=>{ if(/^오픈/.test(g)) return 0; let m=g.match(/^(\d)번 줄 (하이 코드|근음)/); if(m) return 1+(6-m[1])*0.1;
  if(/7th 코드/.test(g)) return 2; if(/^드롭2/.test(g)) return 3; if(/^드롭3/.test(g)) return 4; if(/^쉘/.test(g)) return 5; if(/^트라이어드/.test(g)) return 6; return 7; };
return {QUAL,C,GROUPS,bassName,flatten,GRANK};
})();
