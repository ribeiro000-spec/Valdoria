/* Fonte vetorial da arte (usada só pelo gerador de sprites; o jogo carrega as imagens prontas) */
/* ---------- personagens, construções e feitiços desenhados em canvas (com animação e cache de quadros) ---------- */
const ART=(function(){
'use strict';
const OL='#26123a';
const TC=[{m:'#3A7BFF',d:'#2352B8',l:'#9DC0FF'},{m:'#FF4D4D',d:'#B52A2A',l:'#FFA3A3'}];
TC[2]={m:'#ffffff',d:'#b4b4b4',l:'#ffffff'}; TC[3]={m:'#000000',d:'#000000',l:'#000000'};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const PI=Math.PI;
function rgb(c){ if(c[0]!=='#') return [128,128,128]; if(c.length===4) c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]; }
function hx(a){ return '#'+a.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ const x=rgb(a), y=rgb(b); return hx([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t]); }
const lit=(c,t)=>mix(c,'#ffffff',t), dk=(c,t)=>mix(c,'#1a0b2e',t);
const hex=c=>c&&c[0]==='#';

/* ---------- pincéis com sombreado ---------- */
function stk(g,lw){ g.lineWidth=lw; g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=OL; g.stroke(); }
function radial(g,x,y,rx,ry,col){
  const r=Math.max(rx,ry), gr=g.createRadialGradient(x-rx*.35,y-ry*.45,r*.08,x,y,r*1.2);
  gr.addColorStop(0,lit(col,.5)); gr.addColorStop(.5,col); gr.addColorStop(1,dk(col,.38)); return gr;
}
function vgrad(g,y0,y1,col){ const gr=g.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,lit(col,.38)); gr.addColorStop(.45,col); gr.addColorStop(1,dk(col,.34)); return gr; }
function E(g,x,y,rx,ry,col,lw){
  g.beginPath(); g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,6.2832);
  if(col){ g.fillStyle=hex(col)?radial(g,x,y,rx,ry,col):col; g.fill(); }
  if(lw) stk(g,lw);
}
function R(g,x,y,w,h,r,col,lw){
  r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2); g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
  if(col){ g.fillStyle=hex(col)?vgrad(g,y,y+h,col):col; g.fill(); if(hex(col)&&h>6){ g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(x,y,w*.28,h); g.restore(); } }
  if(lw) stk(g,lw);
}
function P(g,pts,col,lw){
  g.beginPath(); let y0=1e9,y1=-1e9;
  for(let i=0;i<pts.length;i++){ if(i) g.lineTo(pts[i][0],pts[i][1]); else g.moveTo(pts[i][0],pts[i][1]); y0=Math.min(y0,pts[i][1]); y1=Math.max(y1,pts[i][1]); }
  g.closePath(); if(col){ g.fillStyle=hex(col)?vgrad(g,y0,y1,col):col; g.fill(); } if(lw) stk(g,lw);
}
function C(g,x,y,rx,ry,a0,a1,col,w){ g.beginPath(); g.ellipse(x,y,rx,ry,0,a0,a1); g.lineWidth=w; g.lineCap='round'; g.strokeStyle=col; g.stroke(); }
function L(g,x1,y1,x2,y2,w,col,noOut){
  g.lineCap='round';
  if(!noOut){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w+2.8; g.strokeStyle=OL; g.stroke(); }
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w; g.strokeStyle=col; g.stroke();
  if(hex(col)&&w>3.4){ g.beginPath(); g.moveTo(x1-w*.18,y1-w*.12); g.lineTo(x2-w*.18,y2-w*.12); g.lineWidth=w*.28; g.strokeStyle=lit(col,.45); g.stroke(); }
}
function glow(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(255,255,255,0)'); g.save(); g.globalAlpha=a==null?1:a; g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill(); g.restore(); }
function shadowE(g,x,y,rx,ry,a){ g.fillStyle='rgba(20,8,40,'+(a||.3)+')'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); g.fill(); }
const SK='#F6CFA3';

/* ---------- armas (apontam para cima, origem na empunhadura) ---------- */
const WP={
  sword:(g,a)=>{ P(g,[[-2.6,-3],[2.6,-3],[2,-27],[0,-32],[-2,-27]],'#E8EEF5',1.2); L(g,0,-6,0,-27,.9,'#ffffff',true); R(g,-6.5,-3.6,13,3.6,1.4,'#F2C14E',1.2); R(g,-1.7,0,3.4,6.5,1.4,'#7A4A2A',1.1); E(g,0,7.6,2.2,2.2,'#F2C14E',1); },
  axe:(g,a)=>{ L(g,0,9,0,-28,3.4,'#7A4A2A'); P(g,[[0,-27],[-12,-31],[-15,-22],[-11,-14],[0,-17]],'#CFD8E2',1.3); P(g,[[0,-27],[10,-30],[13,-21],[10,-14],[0,-17]],'#A8B4C0',1.3); L(g,-9,-27,-12,-19,1,'#fff',true); },
  dagger:(g,a)=>{ P(g,[[-2,0],[2,0],[1.4,-14],[0,-19],[-1.4,-14]],'#E8EEF5',1.1); R(g,-4.2,-.4,8.4,2.6,1,'#6B4423',1); },
  staff:(g,a,col)=>{ L(g,0,18,0,-17,3.2,'#7A4A2A'); E(g,0,-19,5.8,5.8,'rgba(255,255,255,.25)'); const f=a&&a.fl?a.fl:0; glow(g,0,-20,12+f*10,col||'#7CF0FF',.5+f*.5); E(g,0,-20,4.6,4.6,col||'#7CF0FF',1.3); E(g,-1.4,-21.4,1.3,1.3,'#ffffff'); },
  mace:(g,a)=>{ L(g,0,17,0,-12,3.2,'#8A5A2B'); const f=a&&a.fl?a.fl:0; glow(g,0,-17,12+f*10,'#FFE98A',.5+f*.5); E(g,0,-17,5.4,5.4,'#F2C14E',1.3); [0,1,2,3].forEach(i=>{ const q=i*1.5708+.78; L(g,Math.cos(q)*5,-17+Math.sin(q)*5,Math.cos(q)*8,-17+Math.sin(q)*8,2,'#F2C14E',true); }); },
  spear:(g,a)=>{ L(g,0,16,0,-28,2.8,'#7A4A2A'); P(g,[[-3.8,-27],[0,-39],[3.8,-27],[0,-24]],'#E8EEF5',1.2); R(g,-3,-26,6,2.4,1,'#C0392B',1); },
  wrench:(g,a)=>{ L(g,0,9,0,-20,3.6,'#8E96A3'); g.beginPath(); g.arc(0,-23,6,.6,5.7); g.lineWidth=4.6; g.strokeStyle=OL; g.stroke(); g.lineWidth=3.2; g.strokeStyle='#B7C0CC'; g.stroke(); },
  bone:(g,a)=>{ L(g,0,6,0,-20,3.2,'#F3EFE6'); E(g,-2,-21,3,2.4,'#F3EFE6',1); E(g,2,-21,3,2.4,'#F3EFE6',1); },
  skull:(g,a)=>{ L(g,0,18,0,-14,3,'#5B4A3A'); const f=a&&a.fl?a.fl:0; glow(g,0,-24,14+f*10,'#6BFF8F',.5+f*.5); E(g,0,-19,5.6,5,'#F3EFE6',1.2); E(g,-2,-19.6,1.3,1.6,OL); E(g,2,-19.6,1.3,1.6,OL); E(g,0,-26,3,5,'#6BFF8F'); },
  druid:(g,a)=>{ L(g,0,18,0,-16,3.2,'#6B4423'); const f=a&&a.fl?a.fl:0; glow(g,0,-22,12+f*9,'#8CFF7A',.45+f*.5); E(g,-3.6,-19,4.4,2.6,'#4CAF50',1); E(g,4,-22,4.4,2.6,'#7CD35B',1); E(g,0,-28,2.6,4.4,'#4CAF50',1); E(g,0,-16,2.4,2.4,'#C58BFF'); }
};

/* ---------- pose dos braços ---------- */
function armPose(k,aw,at){
  let th=.2, wa=.18, fl=0;
  if(k==='cast'){ if(aw>0){ th=.2+aw*2.3; wa=.18-aw*.55; fl=aw*.5; } else if(at>0){ const e=1-at; th=2.5-at*.5; wa=-.35+at*.5; fl=.5+e*.5; } }
  else if(k==='jab'){ if(aw>0){ th=.2-aw*.55; wa=.18-aw*.3; } else if(at>0){ const s=Math.sin(Math.min(1,at)*PI); th=-.35+s*2.2; wa=-.12+s*.95; } }
  else { if(aw>0){ th=.2+aw*2.35; wa=.18-aw*1.0; } else if(at>0){ const u=Math.min(1,at/.55), bk=Math.max(0,(at-.55)/.45); th=(2.55-u*2.3)*(1-bk)+.2*bk; wa=(-.82+u*2.5)*(1-bk)+.18*bk; } }
  return {th:th,wa:wa,fl:fl};
}

/* ---------- cabeça ---------- */
function eye(g,x,y,o){ E(g,x,y,2.7,3.2,'#ffffff',1); E(g,x+.3,y+.4,1.7,2.3,o&&o.eye||OL); E(g,x-.2,y-.7,.7,.8,'#ffffff'); }
function headBase(g,o,pose){
  const sk=o.skin||SK;
  if(pose==='b'){ E(g,0,0,10.4,10,o.hair||dk(sk,.4),1.6); return; }
  const ox=pose==='s'?1.2:0;
  E(g,ox,0,10.4,10,sk,1.6);
  if(pose==='f'){ E(g,-10,2,2.4,3,sk,1.2); E(g,10,2,2.4,3,sk,1.2); eye(g,-4.2,-.4,o); eye(g,4.2,-.4,o);
    if(o.angry){ L(g,-8,-5.6,-2,-3.8,1.8,OL,true); L(g,8,-5.6,2,-3.8,1.8,OL,true); } else { L(g,-7,-5.4,-2.4,-5.8,1.2,dk(sk,.5),true); L(g,7,-5.4,2.4,-5.8,1.2,dk(sk,.5),true); }
    E(g,-6.6,3.6,2.2,1.4,'rgba(255,120,120,.35)'); E(g,6.6,3.6,2.2,1.4,'rgba(255,120,120,.35)');
    if(o.grin){ P(g,[[-3.6,4.4],[3.6,4.4],[2.4,7.4],[-2.4,7.4]],'#ffffff',1); } else C(g,0,4.6,2.8,1.8,.15,2.99,OL,1.4);
  } else { E(g,10.4,2,2,2.4,sk,1.2); eye(g,5,-.4,o); P(g,[[10,1],[13,3.4],[10,4.6]],sk,1.2); C(g,6.6,5.4,2,1.2,.2,2.9,OL,1.2); E(g,-2,1,2.2,3,dk(sk,.15),1); }
}
function headFull(g,o,pose,tc){ headBase(g,o,pose); if(o.gear) o.gear(g,pose,tc); }

/* ---------- humanoide ---------- */
function human(g,o,a,tc){
  const pose=a.pose, back=pose==='b', side=pose==='s';
  const mv=!!a.mv, w=mv?a.ph*6.2832:0, cs=Math.cos(w);
  const bob=mv?-Math.abs(cs)*2.6:Math.sin((a.t||0)*2.4)*-.9;
  const aw=a.aw||0, at=a.at||0, ap=armPose(o.wk||'slash',aw,at);
  const bw=o.bw||1, tw=(side?15:22)*bw, hipY=13;
  const lunge=aw>0?-aw*1.6:(at>0?Math.sin(Math.min(1,at)*PI)*3.4:0);
  g.save(); g.translate(side?lunge*.8:0,bob+(side?0:lunge*.4));
  if(o.back) o.back(g,pose,tc,a);
  // pernas
  const leg=(dx,ph,far)=>{ const lift=mv?Math.max(0,Math.sin(ph))*4.8:0; let fx=dx, fy=30-lift; if(side) fx=mv?Math.sin(ph)*7.6:(far?-2.4:2.4);
    L(g,side?0:dx,hipY,fx,fy-2.5,7.6*(o.lw||1),far?dk(o.pants,.22):o.pants);
    E(g,fx+(side?2.4:0),fy,5.8*(o.lw||1),3.6,far?dk(o.boots,.2):o.boots,1.4); };
  if(side){ leg(0,w+PI,true); leg(0,w,false); } else { leg(-4.9,w+PI,false); leg(4.9,w,false); }
  // braço distante (lado) antes do tronco
  const shX=tw/2+1.6;
  const hand=(sx,sy,hxx,hyy,col)=>{ L(g,sx,sy,hxx,hyy,6,col||o.sleeve||o.skin||SK); E(g,hxx,hyy,3.5,3.5,o.gloves||o.skin||SK,1.3); };
  const swing=mv?Math.sin(w)*3.4:0;
  if(side) hand(-1,-3,-4+swing*1.5,8,dk(o.sleeve||SK,.25));
  // tronco
  if(o.torso) o.torso(g,pose,tc,tw,a); else R(g,-tw/2,-7,tw,22,6,o.tcol||'#6aa',1.7);
  // braços
  const mainHand=()=>{ const sx=side?3:shX, hxx=sx+Math.sin(ap.th)*14, hyy=-3+Math.cos(ap.th)*14;
    L(g,sx,-3,hxx,hyy,6,o.sleeve||o.skin||SK); E(g,hxx,hyy,3.6,3.6,o.gloves||o.skin||SK,1.3);
    if(o.weapon){ g.save(); g.translate(hxx,hyy); g.rotate(ap.wa); o.weapon(g,{fl:ap.fl,t:a.t},tc); g.restore(); } };
  if(!side){ hand(-shX,-3,-shX-1.5,8-swing,undefined); if(o.off) o.off(g,pose,tc,-shX-1.5,8-swing,a); }
  if(o.arms) o.arms(g,pose,tc,a,ap,shX,swing); else mainHand();
  // cabeça
  g.save(); g.translate(side?1:0,-19-(mv?bob*.3:0)+(aw>0?-aw*.8:0)); if(o.hs) g.scale(o.hs,o.hs); headFull(g,o,pose,tc); g.restore();
  if(o.front) o.front(g,pose,tc,a);
  g.restore();
}

/* ---------- troncos ---------- */
const T={
  plate:(c1,c2)=>(g,p,tc,tw)=>{ R(g,-tw/2,-7,tw,22,6,c1,1.7); if(p==='f'){ R(g,-5,-6,10,20,2.5,tc.m,1.3); E(g,0,2,3,3.4,'#F2C14E',1); L(g,-tw/2+2,6,-5,6,1,dk(c1,.3),true); L(g,tw/2-2,6,5,6,1,dk(c1,.3),true); } else if(p==='b') R(g,-5,-6,10,20,2.5,tc.d,1.3); R(g,-tw/2-1,13,tw+2,3.6,1.5,'#6B4423',1.2); E(g,-tw/2-2,-5,6,5.4,c1,1.5); E(g,tw/2+2,-5,6,5.4,c1,1.5); },
  tunic:(c1,trim)=>(g,p,tc,tw)=>{ R(g,-tw/2,-7,tw,22,6,c1,1.7); R(g,-tw/2,10,tw,4.5,1.5,trim||'#6B4423',1.2); if(p==='f'){ P(g,[[-4,-7],[4,-7],[0,0]],lit(c1,.3),1); E(g,0,12.2,2,1.6,'#F2C14E',.9); } },
  robe:(c1,c2)=>(g,p,tc,tw)=>{ P(g,[[-tw/2+1,-7],[tw/2-1,-7],[tw/2+6,31],[-tw/2-6,31]],c1,1.7); R(g,-tw/2-6,27,tw+12,4.4,2,c2||tc.m,1.3); R(g,-tw/2,9,tw,4,1.5,c2||tc.m,1.2); if(p==='f') L(g,0,-4,0,27,1,dk(c1,.3),true); },
  bare:(skin,furc)=>(g,p,tc,tw)=>{ R(g,-tw/2,-7,tw,22,6,skin,1.7); if(p==='f'){ L(g,0,-4,0,8,1.2,dk(skin,.3),true); C(g,-3.6,1,3.4,2.4,3.4,6.1,dk(skin,.3),1.2); C(g,3.6,1,3.4,2.4,3.14,6,dk(skin,.3),1.2); } R(g,-tw/2-1,11,tw+2,5.4,2,'#6B4423',1.3); E(g,-tw/2-2,-5.4,7,5.6,furc,1.5); E(g,tw/2+2,-5.4,7,5.6,furc,1.5); },
  cloak:(c1,c2)=>(g,p,tc,tw)=>{ P(g,[[-tw/2,-7],[tw/2,-7],[tw/2+4,29],[-tw/2-4,29]],c1,1.7); if(p==='f'){ P(g,[[-5,-7],[5,-7],[2.6,3],[-2.6,3]],c2||tc.m,1.2); } R(g,-tw/2,9,tw,3.4,1.4,'#3A2A22',1.1); }
};

/* ---------- conjuntos de personagens ---------- */
const CH={};
CH.cavaleiro={skin:'#F2C79B',pants:'#5B6672',boots:'#3A3340',bw:1.14,wk:'slash',sleeve:'#A9B6C4',gloves:'#8E9CAB',weapon:WP.sword,
  torso:T.plate('#A9B6C4'),
  off:(g,p,tc,x,y)=>{ E(g,x-4,y-2,10.5,12.5,tc.m,1.8); E(g,x-4,y-2,6,8,lit(tc.m,.15),1); E(g,x-4,y-2,2.4,2.4,'#F2C14E',1); P(g,[[x-4,y-9],[x-1.6,y-2],[x-4,y+5],[x-6.4,y-2]],'#F2C14E',1); },
  gear:(g,p,tc)=>{ E(g,0,-1.5,11.8,10.8,'#B9C5D2',1.7); if(p==='f'){ R(g,-8,-2.4,16,4.6,2,'#1b1230'); L(g,-8,3.6,8,3.6,1,'#8E9CAB',true); } else if(p==='s') R(g,0,-2.4,11,4.6,2,'#1b1230'); else L(g,0,-9,0,8,1.4,'#8E9CAB',true); E(g,0,-12.5,3.4,6.8,tc.m,1.2); if(p==='b'){ P(g,[[-2.6,-10],[2.6,-10],[3,6],[0,9],[-3,6]],tc.m,1.2); } }};
CH.berserker={skin:'#E3A27A',pants:'#8B4A2B',boots:'#3B2A20',bw:1.12,wk:'slash',sleeve:'#E3A27A',weapon:WP.axe,angry:1,grin:1,hair:'#D8432E',
  torso:T.bare('#E3A27A','#7A5A3A'),
  gear:(g,p,tc)=>{ P(g,[[-11,-3],[-8,-15],[-4,-9],[-1,-18],[3,-9],[7,-16],[9,-8],[11,-3],[0,-8]],'#D8432E',1.4); if(p==='f'){ P(g,[[-8,4],[8,4],[6,11],[0,15],[-6,11]],'#D8432E',1.3); L(g,-9,-2,-4,-1,1.6,'#B52A2A',true); L(g,9,-2,4,-1,1.6,'#B52A2A',true); } if(p==='b'){ E(g,0,0,10.4,10,'#D8432E',1.4); } }};
CH.ladino={skin:'#F0C4A0',pants:'#2E3142',boots:'#241f2b',wk:'jab',sleeve:'#2E3142',gloves:'#241f2b',bw:.92,weapon:WP.dagger,
  torso:T.cloak('#3B3F52','#C0392B'),
  off:(g,p,tc,x,y)=>{ g.save(); g.translate(x,y); g.rotate(-.5); WP.dagger(g); g.restore(); },
  gear:(g,p,tc)=>{ E(g,0,-1,12.4,11.6,'#2E3142',1.7); if(p==='f'){ E(g,0,1.4,8.6,7,'#F0C4A0'); R(g,-8.4,1.8,16.8,6.4,3,'#241f2b',1.2); eye(g,-3.8,-1,{eye:'#1a0b2e'}); eye(g,3.8,-1,{eye:'#1a0b2e'}); L(g,-7,-4.6,-1.6,-2.8,1.6,OL,true); L(g,7,-4.6,1.6,-2.8,1.6,OL,true); } P(g,[[-6,-11],[0,-17],[6,-11]],'#2E3142',1.3); }};
CH.arqueira={skin:'#F6CFA3',pants:'#6B4A2A',boots:'#4A3220',sleeve:'#43A558',gloves:'#7A4A2A',bw:.98,wk:'shoot',
  torso:T.tunic('#43A558','#6B4423'),
  back:(g,p,tc)=>{ if(p!=='f'){ R(g,-13,-8,7,22,2.5,'#7A4A2A',1.3); [-11.4,-9.4,-7.6].forEach(x=>{ L(g,x,-8,x,-13,1.3,'#EEE'); P(g,[[x-1.6,-13],[x,-17],[x+1.6,-13]],tc.m,.8); }); } },
  arms:(g,p,tc,a,ap,shX)=>{ const draw=a.aw||0, rel=a.at||0; const pull=draw>0?draw:(rel>0?Math.max(0,1-rel*3):0);
    const bx=p==='s'?9:-shX-4, by=-1; L(g,p==='s'?3:-shX,-3,bx,by+3,6,'#43A558'); E(g,bx,by+3,3.5,3.5,SK,1.3);
    g.save(); g.translate(bx,by); g.beginPath(); g.arc(0,0,17,-1.2,1.2); g.lineWidth=5; g.strokeStyle=OL; g.stroke(); g.lineWidth=3; g.strokeStyle='#8A5A2B'; g.stroke();
    const sx=Math.cos(1.2)*17, sy=Math.sin(1.2)*17; g.beginPath(); g.moveTo(sx,-sy); g.lineTo(-pull*8+5,0); g.lineTo(sx,sy); g.lineWidth=1.3; g.strokeStyle='#F1EAD2'; g.stroke();
    if(pull>0.1||(rel>0&&rel<.25)){ L(g,-pull*8+5,0,16,0,1.8,'#E8EEF5',true); P(g,[[16,-2.4],[22,0],[16,2.4]],'#E8EEF5',.8); }
    g.restore(); const rx=bx-pull*8+5; L(g,p==='s'?3:shX,-3,rx,by+1,6,'#43A558'); E(g,rx,by+1,3.5,3.5,SK,1.3); },
  gear:(g,p,tc)=>{ E(g,0,-1.4,12,11.4,'#2F8A46',1.7); if(p==='f'){ E(g,0,1.4,8.2,7.4,SK); eye(g,-3.4,.6); eye(g,3.4,.6); C(g,0,5.4,2,1.2,.2,2.9,OL,1.2); } P(g,[[-4,-10],[6,-12],[2,-4]],tc.m,1.1); L(g,5,-11,10,-18,2,tc.l,true); if(p==='b') E(g,0,5,3.6,7,'#8A5A2B',1.2); }};
CH.mago={skin:'#F6CFA3',pants:'#5B3FB8',boots:'#3A2A55',sleeve:'#6A4CC9',bw:.98,wk:'cast',weapon:(g,a)=>WP.staff(g,a,'#7CF0FF'),
  torso:(g,p,tc,tw)=>{ T.robe('#6A4CC9',tc.m)(g,p,tc,tw); if(p==='f'){ [[-5,4],[6,10],[-2,17],[7,22],[-8,24]].forEach(s=>{ L(g,s[0]-1.2,s[1],s[0]+1.2,s[1],1.2,'#FFD66B',true); L(g,s[0],s[1]-1.2,s[0],s[1]+1.2,1.2,'#FFD66B',true); }); } },
  gear:(g,p,tc)=>{ if(p==='f'){ P(g,[[-7,3],[7,3],[5,12],[0,17],[-5,12]],'#F4F4F8',1.3); eye(g,-4,-.4); eye(g,4,-.4); } E(g,0,-8,17,5,'#4A2F9C',1.5); P(g,[[-11,-8],[11,-8],[3,-33],[-2,-34]],'#5B3FB8',1.6); R(g,-11,-11.4,22,4,2,tc.m,1.2); E(g,-1,-21,2.4,2.4,'#FFD66B'); L(g,-1,-24,-1,-18,1.2,'#FFD66B',true); }};
CH.necromante={skin:'#B9D3B2',pants:'#241F2F',boots:'#1A1424',sleeve:'#2E2A3A',bw:.98,wk:'cast',weapon:WP.skull,
  torso:(g,p,tc,tw)=>{ T.robe('#2E2A3A',tc.m)(g,p,tc,tw); E(g,-tw/2-1,-5,6,5,'#E8E2D2',1.4); E(g,tw/2+1,-5,6,5,'#E8E2D2',1.4); },
  gear:(g,p,tc)=>{ E(g,0,-1,12.4,11.8,'#241F2F',1.7); P(g,[[-11,-6],[0,-26],[11,-6]],'#241F2F',1.6); if(p==='f'){ E(g,0,1.6,8,7.2,'#B9D3B2'); glow(g,-3.8,.4,6,'#6BFF8F',.8); glow(g,3.8,.4,6,'#6BFF8F',.8); E(g,-3.8,.4,1.8,2.2,'#6BFF8F'); E(g,3.8,.4,1.8,2.2,'#6BFF8F'); L(g,-3,5.6,3,5.6,1.2,OL,true); } }};
CH.druida={skin:'#F2C79B',pants:'#6B4A2A',boots:'#3A2A20',sleeve:'#7A5B3A',bw:1,wk:'cast',weapon:WP.druid,hair:'#9AA0A0',
  torso:(g,p,tc,tw)=>{ T.robe('#7A5B3A','#4C8F3A')(g,p,tc,tw); if(p==='f'){ L(g,-8,-3,6,20,2,'#4C8F3A'); E(g,6,19,2.6,2,'#7CD35B',1); E(g,-3,6,2.6,2,'#7CD35B',1); } },
  gear:(g,p,tc)=>{ if(p==='f') P(g,[[-8,3],[8,3],[5,12],[0,15],[-5,12]],'#C9C9C9',1.3); if(p!=='f') E(g,0,0,10.4,10,'#9AA0A0',1.4); for(let i=0;i<8;i++){ const q=-3.4+i*.5; E(g,Math.cos(q)*11,-6+Math.sin(q)*8,4.4,2.6,i%2?'#4CAF50':'#7CD35B',1); } L(g,-5,-12,-9,-21,2.4,'#8A5A2B'); L(g,5,-12,9,-21,2.4,'#8A5A2B'); L(g,-9,-21,-12,-24,1.6,'#8A5A2B',true); L(g,9,-21,12,-24,1.6,'#8A5A2B',true); }};
CH.clerigo={skin:'#F6CFA3',pants:'#E8E0C8',boots:'#7A5B3A',sleeve:'#FBF7EA',bw:1,wk:'cast',weapon:WP.mace,
  torso:(g,p,tc,tw)=>{ T.robe('#FBF7EA','#F2C14E')(g,p,tc,tw); if(p==='f'){ P(g,[[-tw/2+1,-7],[-tw/2+6,-7],[tw/2-2,16],[tw/2-8,16]],tc.m,1.2); } },
  gear:(g,p,tc)=>{ E(g,0,-14,12.5,5,'#FBF7EA',1.4); if(p==='f') P(g,[[-10,-9],[10,-9],[11,-3],[-11,-3]],'#FBF7EA',1.2); glow(g,0,-27,14,'#FFE98A',.9); C(g,0,-27,9,3,0,6.3,'#F2C14E',2.6); }};
CH.bardo={skin:'#F6CFA3',pants:'#6B4A8A',boots:'#3A2A55',sleeve:'#FFD34D',bw:1,wk:'slash',
  torso:T.tunic('#3A7BFF','#FFD34D'),
  arms:(g,p,tc,a,ap,shX,swing)=>{ const sx=p==='s'?3:shX; const at=a.at||0, aw=a.aw||0, strum=Math.sin((a.t||0)*(aw>0||at>0?30:0))*2;
    L(g,sx,-3,sx-8,9,6,'#FFD34D'); E(g,sx-8,9,3.5,3.5,SK,1.3);
    g.save(); g.translate(sx-9,10); g.rotate(-.35); E(g,0,4,9,10.4,'#B8793A',1.5); E(g,0,4,3,3,'#3B2412'); L(g,0,-4,3,-26,3.2,'#7A4A2A'); E(g,3.6,-28,3.2,3.2,'#7A4A2A',1); [-1.6,0,1.6].forEach(x=>L(g,x,-4,x+2.6,-26,.7,'#EEE',true)); g.restore();
    L(g,-sx,-3,-sx+2,6+strum,6,'#FFD34D'); E(g,-sx+2,6+strum,3.5,3.5,SK,1.3); },
  gear:(g,p,tc)=>{ E(g,0,-9,13,4.6,'#C0392B',1.5); R(g,-9,-17,18,10,3.6,'#C0392B',1.5); P(g,[[6,-16],[17,-30],[13,-14]],'#FFD34D',1.3); L(g,8,-17,14,-27,1,'#FFF3A0',true); }};
CH.engenheiro={skin:'#F2C79B',pants:'#4F6FD0',boots:'#3A2A20',sleeve:'#FF9A2E',bw:1.02,wk:'slash',weapon:WP.wrench,
  torso:(g,p,tc,tw)=>{ R(g,-tw/2,-7,tw,22,6,'#FF9A2E',1.7); R(g,-tw/2,5,tw,3.6,1,'#FFF3A0',1); R(g,-tw/2-.5,11,tw+1,5,1.6,'#6B4423',1.2); if(p==='f'){ R(g,-3.6,11.6,7,4,1,'#8E96A3',1); } },
  back:(g,p,tc)=>{ if(p!=='f'){ R(g,-9,-6,18,18,3,'#6B7A99',1.5); E(g,0,3,4.4,4.4,'#B7C0CC',1.2); } else R(g,-12,-4,6,12,2,'#6B7A99',1.2); },
  gear:(g,p,tc)=>{ E(g,0,-8,12.8,5.4,'#FFD23F',1.5); R(g,-3.4,-18,6.8,10,2.4,'#FFD23F',1.3); if(p==='f'){ E(g,-4.8,-3.6,3.9,3.9,'rgba(189,235,255,.85)',1.3); E(g,4.8,-3.6,3.9,3.9,'rgba(189,235,255,.85)',1.3); L(g,-1,-3.6,1,-3.6,1.3,OL,true); } }};
CH.esqueleto={skin:'#F3EFE6',pants:'#E9E4D6',boots:'#D8D2C0',sleeve:'#F3EFE6',gloves:'#F3EFE6',bw:.85,lw:.6,wk:'slash',weapon:WP.bone,
  torso:(g,p,tc,tw)=>{ R(g,-tw/2,-7,tw,20,5,'#F3EFE6',1.5); if(p==='f'){ [-3,1.6,6.2,10.4].forEach(y=>{ L(g,-tw/2+2,y,tw/2-2,y,1.4,'#B8B2A0',true); }); L(g,0,-7,0,13,1.4,'#B8B2A0',true); } },
  gear:(g,p,tc)=>{ if(p==='f'){ E(g,0,0,10.4,10,'#F7F4EC',1.6); E(g,-4,-.6,3.1,3.6,OL); E(g,4,-.6,3.1,3.6,OL); glow(g,-4,-.6,5,'#B58CFF',.6); glow(g,4,-.6,5,'#B58CFF',.6); P(g,[[-1.6,3],[1.6,3],[0,6]],OL); L(g,-4,8,4,8,1.2,OL,true); [-2,0,2].forEach(x=>L(g,x,7,x,9,.9,OL,true)); } }};
CH.soldado={skin:'#F2C79B',pants:'#6B4A2A',boots:'#3A2A20',sleeve:'#8A5A2B',bw:1,wk:'jab',weapon:WP.spear,
  torso:T.tunic('#8A5A2B','#4A3220'),
  off:(g,p,tc,x,y)=>{ E(g,x-3,y-3,9,10,tc.m,1.7); E(g,x-3,y-3,3.2,3.6,'#F2C14E',1); },
  gear:(g,p,tc)=>{ E(g,0,-5,12.2,8.6,'#C9852E',1.6); R(g,-2.8,-17,5.6,11,2,tc.m,1.2); if(p==='f'){ R(g,-8,-5,16,3,1.4,'#8A5A2B',1); } }};

/* ---------- criaturas e máquinas ---------- */
function flapWing(g,t,col,s,ph,len){ const f=Math.sin(t*14+(ph||0))*.55; [-1,1].forEach(q=>{ g.save(); g.translate(q*7*s,-2); g.rotate(q*(-.7+f)); P(g,[[0,0],[q*(len||26)*s,-16*s],[q*(len||26)*s+q*4,0],[q*(len*.7||18)*s,7*s],[q*8*s,6*s]],col,1.5); L(g,0,0,q*(len||26)*s,-12*s,1,dk(col,.35),true); g.restore(); }); }
const CR={};
CR.golem=(g,a,tc)=>{ const mv=a.mv, w=mv?a.ph*6.2832:0, bob=mv?-Math.abs(Math.cos(w))*3:Math.sin((a.t||0)*2)*-1, aw=a.aw||0, at=a.at||0;
  const sm=at>0?Math.sin(at*PI)*10:(aw>0?-aw*8:0);
  g.save(); g.translate(0,bob);
  const fl=mv?Math.max(0,Math.sin(w))*5:0, fr=mv?Math.max(0,Math.sin(w+PI))*5:0;
  R(g,-16,18-fl,13,14,4,'#7E858D',1.8); R(g,3,18-fr,13,14,4,'#7E858D',1.8);
  E(g,0,6,23,19,'#9AA0A8',2); E(g,-9,0,8,6,'#B3B9C0'); E(g,10,10,6,4.6,'#868D95'); [[-14,-6],[12,-4],[-4,14]].forEach(c=>{ L(g,c[0],c[1],c[0]+5,c[1]+7,1.4,'#5E656D',true); });
  E(g,-14,-6,5,3,'#5FAE4A'); E(g,13,13,5,2.6,'#5FAE4A'); glow(g,0,4,12,'#FFB02E',.45+.2*Math.sin((a.t||0)*3)); E(g,0,4,4,4,'#FFB02E',1.2);
  [-1,1].forEach(q=>{ const y=8+q*0+(q>0?sm:0)-(mv?Math.sin(w+(q>0?0:PI))*3:0); L(g,q*21,-2,q*27,y+4,10,'#8A9098'); E(g,q*28,y+10,10,10,'#7E858D',1.8); L(g,q*25,y+6,q*29,y+13,1.3,'#5E656D',true); });
  g.translate(0,aw>0?-aw*3:0); E(g,0,-16,13.4,11.4,'#A9AFB7',2); E(g,-5.6,-17,3.3,3.1,'#FFB02E'); E(g,5.6,-17,3.3,3.1,'#FFB02E'); glow(g,-5.6,-17,7,'#FFB02E',.8); glow(g,5.6,-17,7,'#FFB02E',.8); L(g,-6,-9,6,-9,2,OL,true); L(g,0,-26,2,-20,1.4,'#5E656D',true);
  g.restore(); };
CR.ariete=(g,a,tc)=>{ const mv=a.mv, w=mv?a.ph*6.2832:0, aw=a.aw||0, at=a.at||0, push=at>0?Math.sin(at*PI)*-8:(aw>0?aw*5:0), bob=mv?-Math.abs(Math.sin(w))*1.4:0;
  g.save(); g.translate(0,bob);
  [[-17,24],[17,24]].forEach(c=>{ E(g,c[0],c[1],7.6,7.6,'#4A3220',1.8); for(let i=0;i<6;i++){ const q=w*1.2+i*1.0472; L(g,c[0]+Math.cos(q)*1.4,c[1]+Math.sin(q)*1.4,c[0]+Math.cos(q)*6.6,c[1]+Math.sin(q)*6.6,1.2,'#8A5A2B',true); } E(g,c[0],c[1],2,2,'#B7C2CE',1); });
  R(g,-24,-4,48,28,6,'#A26A32',1.9); [3,12,20].forEach(y=>L(g,-24,y,24,y,1.3,'#6B4423',true));
  P(g,[[-27,-4],[0,-17],[27,-4]],'#C07A3A',1.9); L(g,-27,-4,0,-17,1.2,'#E0A060',true);
  R(g,-27,-12,54,9,4,tc.m,1.8); P(g,[[-8,-12],[0,-24],[8,-12]],tc.l,1.6); E(g,0,-8,3,3,'#F2C14E',1);
  g.save(); g.translate(0,push); L(g,0,10,0,25,11,'#8A5A2B'); E(g,0,29,10.4,8,'#B7C2CE',2); P(g,[[-9,27],[-15,16],[-5,22]],'#B7C2CE',1.5); P(g,[[9,27],[15,16],[5,22]],'#B7C2CE',1.5); E(g,-2.6,27,3,2.4,'#fff'); g.restore();
  g.restore(); };
CR.grifo=(g,a,tc)=>{ const t=a.t||0; flapWing(g,t,'#E9D9A8',1.15,0,28); const b=Math.sin(t*14)*1.4;
  g.save(); g.translate(0,b);
  L(g,-9,16,-14,29,5,'#E8A33C'); L(g,9,16,14,29,5,'#E8A33C'); [-14,14].forEach(x=>{ P(g,[[x-4,29],[x,33],[x+4,29]],'#FFB02E',1.1); });
  E(g,0,7,14,16,'#C98B3C',1.9); E(g,0,10,8,9,'#E6B76A'); R(g,-8,2,16,5,2,tc.m,1.2); P(g,[[-10,20],[-4,28],[-14,30]],'#B97A2E',1.3);
  E(g,0,-10,10.6,9.6,'#F3EFE6',1.9); P(g,[[-5,-17],[-2,-30],[1.6,-17]],'#E9D9A8',1.3); P(g,[[3,-17],[7,-28],[8,-15]],'#E9D9A8',1.3);
  P(g,[[6,-9],[19,-5],[6,0]],'#FFB02E',1.5); L(g,6,-5,17,-5,1,dk('#FFB02E',.4),true); E(g,-2.6,-11.5,2.2,2.6,'#fff',1); E(g,-2.2,-11.4,1.2,1.6,OL); L(g,-6.6,-14.4,.6,-13.2,1.6,OL,true);
  g.restore(); };
CR.morcegos=(g,a,tc)=>{ const t=a.t||0; flapWing(g,t,'#5B3F7A',1,0,24); const b=Math.sin(t*16)*1.2; g.save(); g.translate(0,b);
  E(g,0,3,8,10,'#3A2A4D',1.6); E(g,0,-8,8.6,7.6,'#4A3560',1.6); P(g,[[-7.4,-12],[-5.4,-23],[-1.6,-13]],'#4A3560',1.3); P(g,[[1.6,-13],[5.4,-23],[7.4,-12]],'#4A3560',1.3);
  E(g,-3.4,-8.6,2,2,'#FF4D4D'); E(g,3.4,-8.6,2,2,'#FF4D4D'); glow(g,-3.4,-8.6,6,'#FF4D4D',.6); glow(g,3.4,-8.6,6,'#FF4D4D',.6); P(g,[[-2.6,-3],[-1,-.4],[0,-3]],'#fff',.8); P(g,[[0,-3],[1,-.4],[2.6,-3]],'#fff',.8); g.restore(); };
CR.gargula=(g,a,tc)=>{ const t=a.t||0; flapWing(g,t,'#7E858D',1.15,0,28); const b=Math.sin(t*10)*1.2; g.save(); g.translate(0,b);
  L(g,-7,17,-9,29,6,'#8A9098'); L(g,7,17,9,29,6,'#8A9098'); E(g,0,7,15,17,'#9AA0A8',2); R(g,-9,0,18,4.6,2,tc.m,1.2); [[-6,10],[5,14]].forEach(c=>L(g,c[0],c[1],c[0]+4,c[1]+6,1.3,'#5E656D',true));
  E(g,0,-11,12,11,'#A9AFB7',2); P(g,[[-10,-17],[-9,-31],[-3,-19]],'#868D95',1.5); P(g,[[3,-19],[9,-31],[10,-17]],'#868D95',1.5);
  E(g,-4.4,-12,2.6,2.6,'#FFB02E'); E(g,4.4,-12,2.6,2.6,'#FFB02E'); glow(g,-4.4,-12,6,'#FFB02E',.7); glow(g,4.4,-12,6,'#FFB02E',.7); P(g,[[-4,-5],[4,-5],[2,-1],[-2,-1]],'#ffffff',1); g.restore(); };
CR.wyvern=(g,a,tc)=>{ const t=a.t||0; flapWing(g,t,'#2FA05A',1.35,0,32); const b=Math.sin(t*9)*1.4, at=a.at||0, aw=a.aw||0;
  g.save(); g.translate(0,b); const tl=Math.sin(t*5)*5;
  g.beginPath(); g.moveTo(-6,16); g.quadraticCurveTo(-18+tl,24,-26+tl,32); g.lineWidth=9; g.strokeStyle=OL; g.lineCap='round'; g.stroke(); g.lineWidth=6; g.strokeStyle='#3FBF6A'; g.stroke(); P(g,[[-26+tl,32],[-32+tl,26],[-27+tl,37]],'#FF6B3D',1.3);
  E(g,0,6,15,16,'#3FBF6A',2); E(g,0,10,8.6,10,'#9BE8A8'); [-6,0,6].forEach(x=>L(g,x-2,6,x+2,14,1,'#2E9A56',true));
  E(g,3,-11,11.6,9.6,'#4FD07A',2); P(g,[[11,-12],[24,-8],[11,-3]],'#4FD07A',1.6); [-6,0,6].forEach(x=>P(g,[[x-1.6,-19],[x,-27],[x+1.6,-19]],'#FFB02E',1)); E(g,5,-13,2.4,2.8,'#FFD23F',1); E(g,5.4,-13,1,1.6,OL);
  if(aw>0||at>0){ glow(g,22,-6,12+(aw)*8,'#FF8A3D',.9); } g.restore(); };
CR.fada=(g,a,tc)=>{ const t=a.t||0; flapWing(g,t,'rgba(190,240,255,.85)',.95,0,22); const b=Math.sin(t*11)*1.6; g.save(); g.translate(0,b);
  glow(g,0,2,20,'#FFE0F6',.45);
  L(g,-3,16,-4,29,4,SK); L(g,3,16,4,29,4,SK); E(g,0,6,8,13,'#FFB3D9',1.7); P(g,[[-9,12],[9,12],[12,24],[-12,24]],'#FF8AC8',1.5); R(g,-6,6,12,3,1.4,tc.m,1.1);
  E(g,0,-10,9.6,9.6,SK,1.7); E(g,0,-16,10.4,6,'#FFE066',1.6); P(g,[[-9,-14],[-12,-4],[-7,-8]],'#FFE066',1.2); eye(g,-3.4,-9.4); eye(g,3.4,-9.4);
  L(g,9,2,17,-12,2.2,'#B58CFF'); glow(g,18,-14,12,'#FFF6A8',.9); E(g,18,-14,3.6,3.6,'#FFF6A8',1); g.restore(); };

/* ---------- construções (quadro estático em cache + partes animadas) ---------- */
const B={};
B.canhao=(g,tc)=>{ shadowE(g,0,26,26,6,.28); R(g,-21,9,42,14,5,'#8B5A2B',1.9); L(g,-21,16,21,16,1.2,'#5E3C1B',true); [-14,14].forEach(x=>{ E(g,x,24,8,8,'#4A3220',1.9); E(g,x,24,2.6,2.6,'#B7C2CE',1); for(let i=0;i<6;i++){ const q=i*1.047; L(g,x,24,x+Math.cos(q)*7,24+Math.sin(q)*7,1,'#7A4A2A',true); } });
  E(g,-22,19,4,4,'#33363F',1); E(g,-26,23,4,4,'#33363F',1); E(g,0,10,11,6,'#5C6070',1.7); };
B.balista=(g,tc)=>{ shadowE(g,0,26,26,6,.28); R(g,-20,12,40,12,4,'#8B5A2B',1.9); L(g,-15,12,0,-4,4,'#6B4423'); L(g,15,12,0,-4,4,'#6B4423'); R(g,-4.6,-6,9.2,22,3,'#A26A32',1.6); E(g,0,2,6.6,6.6,'#7A4A2A',1.4); R(g,-22,14,10,3,1,tc.m,1); [-17,17].forEach(x=>E(g,x,25,5,5,'#4A3220',1.4)); };
B.torre_arcana=(g,tc)=>{ shadowE(g,0,28,24,5,.28); R(g,-14,-8,28,38,3,'#A9A4BC',1.9); for(let y=-2;y<28;y+=8){ L(g,-14,y,14,y,1,'#7D7896',true); } for(let y=2;y<28;y+=8){ L(g,-5,y,-5,y+6,1,'#7D7896',true); L(g,6,y-4,6,y+2,1,'#7D7896',true); }
  R(g,-3.6,8,7.2,12,3.6,'#2A1A3D',1.2); glow(g,0,13,7,'#7CF0FF',.6); R(g,-18,-13,36,7,2.4,tc.m,1.6); P(g,[[-17,-13],[0,-40],[17,-13]],'#6A4CC9',1.9); E(g,0,-23,2.6,2.6,'#FFD66B'); [-8,8].forEach(x=>R(g,x-2,-12,4,5,1,'#FFD66B',.8)); };
B.muralha=(g,tc)=>{ shadowE(g,0,27,26,5,.28); R(g,-24,-4,48,32,3,'#B9B3A4',1.9); for(let y=1;y<28;y+=8){ L(g,-24,y+5,24,y+5,1.1,'#8A8472',true); for(let x=-18+((y/8|0)%2)*7;x<24;x+=14) L(g,x,y+5,x,Math.min(y+13,27),1.1,'#8A8472',true); } for(let x=-24;x<20;x+=17) R(g,x,-13,13,11,2,'#C9C3B4',1.7); R(g,-3.4,0,6.8,14,2,tc.m,1.3); P(g,[[-3.4,14],[0,19],[3.4,14]],tc.m,1.1); };
B.altar=(g,tc)=>{ E(g,0,22,28,9,'#CFC8B8',1.9); E(g,0,20,22,6,'#E7E1D2'); [-19,19].forEach(x=>{ R(g,x-3.6,-6,7.2,28,2,'#D8D2C2',1.7); R(g,x-5,-9,10,4,1.4,'#E7E1D2',1.3); R(g,x-5,19,10,4,1.4,'#E7E1D2',1.3); }); R(g,-21,-12,42,5,2,tc.m,1.5); E(g,0,10,10,5,'#7FD8F2',1.4); };
B.quartel=(g,tc)=>{ shadowE(g,0,27,28,5,.28); P(g,[[-26,26],[0,-14],[26,26]],tc.m,2); P(g,[[-13,26],[0,-2],[13,26]],tc.d,1.5); P(g,[[-6.4,26],[0,8],[6.4,26]],'#2A1A3D',1.3); L(g,-18,14,18,14,1.2,'rgba(255,255,255,.4)',true); L(g,-12,3,12,3,1.2,'rgba(255,255,255,.4)',true); L(g,0,-14,0,-36,2.6,'#6B4423'); P(g,[[-23,25],[-19,12],[-14,25]],'#EEF3F8',1.3); R(g,17,15,7,10,2,'#8A5A2B',1.3); };
B.heart=(g,tc)=>{ shadowE(g,0,28,38,7,.3); R(g,-36,-4,20,34,3,'#C9C3B4',1.9); R(g,16,-4,20,34,3,'#C9C3B4',1.9); [-26,26].forEach(x=>{ for(let y=2;y<30;y+=8) L(g,x-10,y,x+10,y,1,'#9A9482',true); P(g,[[x-14,-4],[x,-31],[x+14,-4]],tc.m,1.9); L(g,x-14,-4,x,-31,1.4,tc.l,true); R(g,x-2.4,2,4.8,9,2,'#2A1A3D',1); });
  R(g,-20,-12,40,42,3,'#D9D3C4',1.9); for(let x=-20;x<16;x+=13) R(g,x,-21,10,10,2,'#E6E0D2',1.7); for(let y=-6;y<28;y+=8) L(g,-20,y,20,y,1,'#B3AD9B',true);
  P(g,[[-10,30],[-10,11],[0,2],[10,11],[10,30]],'#2A1A3D',1.8); P(g,[[-10,13],[0,5],[10,13]],'#6B4423',1.3); L(g,0,5,0,30,1.2,'#4A3220',true); R(g,-7,-8,14,10,2,'#2A1A3D',1.4); E(g,0,-3,2.6,2.6,'#FFD66B',.8); };
function dynStruct(g,key,tc,x,y,s,st){
  const t=st.t||0, at=st.atk||0;
  if(key==='canhao'){ const rc=at>0?Math.sin(at*PI)*5:0, dir=st.dir<0?-1:1; g.save(); g.translate(0,6+rc*dir*-1); g.scale(1,dir); R(g,-8,-24,16,30,6,'#4B4F5A',1.9); R(g,-10.4,-27,20.8,7.6,3,'#33363F',1.7); E(g,0,-23,4.6,2.6,'#101216'); g.restore(); if(at>.5){ glow(g,0,dir<0?-22:34,14,'#FFB02E',(at-.5)*2); } }
  else if(key==='balista'){ const dir=st.dir<0?-1:1, pull=at>0?1-at:.2; g.save(); g.scale(1,dir); g.translate(0,-2); g.beginPath(); g.moveTo(-24,2-8*(1-pull)); g.quadraticCurveTo(0,-10-pull*8,24,2-8*(1-pull)); g.lineWidth=6; g.strokeStyle=OL; g.stroke(); g.lineWidth=3.6; g.strokeStyle='#5E3C1B'; g.stroke(); L(g,-24,2-8*(1-pull),0,8+pull*5,1,'#F1EAD2',true); L(g,24,2-8*(1-pull),0,8+pull*5,1,'#F1EAD2',true); if(at<.1){ L(g,0,8,0,-24,2.8,'#A26A32'); P(g,[[-3.4,-23],[0,-34],[3.4,-23]],'#E8EEF5',1.2); } g.restore(); }
  else if(key==='torre_arcana'){ const f=.6+.4*Math.sin(t*5)+(at>0?at:0); glow(g,0,-44+Math.sin(t*5)*2,14+f*5,'#7CF0FF',.55+.3*f); g.save(); g.translate(0,-44+Math.sin(t*5)*2); g.rotate(Math.sin(t*5)*.45); P(g,[[0,-9],[5.4,0],[0,9],[-5.4,0]],'#7CF0FF',1.5); L(g,0,-9,0,9,1,'#fff',true); g.restore(); }
  else if(key==='altar'){ const f=.5+.5*Math.sin(t*5); glow(g,0,2,24,'#8FE9FF',.25+.2*f); g.save(); g.translate(0,0); P(g,[[0,-14-f*3],[4.6,-2],[0,6],[-4.6,-2]],'rgba(127,216,242,.85)',1.3); g.restore(); for(let i=0;i<4;i++){ const q=(t/1.2566+i*.25)%1; E(g,Math.sin(i*2.4+t*5)*10,12-q*30,1.6,1.6,'rgba(160,255,200,'+(1-q)+')'); } }
  else if(key==='quartel'||key==='muralha'){ const fy=key==='quartel'?-36:-13, fx0=key==='quartel'?0:-20; g.save(); g.translate(fx0,fy); if(key==='muralha') L(g,0,0,0,-14,1.8,'#6B4423'); const wv=Math.sin(t*5)*2.4, wv2=Math.sin(t*5+1)*2.4; const y0=key==='muralha'?-14:0; g.beginPath(); g.moveTo(0,y0); g.bezierCurveTo(6,y0-3+wv,10,y0+3+wv2,18,y0+1+wv); g.lineTo(18,y0+9+wv); g.bezierCurveTo(10,y0+11+wv2,6,y0+5+wv,0,y0+8); g.closePath(); g.fillStyle=tc.m; g.fill(); stk(g,1.3); g.restore(); }
  else if(key==='heart'){ [-26,26].forEach((fx0,i)=>{ g.save(); g.translate(fx0,-31); L(g,0,0,0,-15,1.8,'#6B4423'); const wv=Math.sin(t*5+i)*2.6, wv2=Math.sin(t*5+i+1)*2.6; g.beginPath(); g.moveTo(0,-15); g.bezierCurveTo(6,-18+wv,10,-12+wv2,19,-14+wv); g.lineTo(19,-6+wv); g.bezierCurveTo(10,-4+wv2,6,-10+wv,0,-7); g.closePath(); g.fillStyle=tc.l; g.fill(); stk(g,1.3); g.restore(); });
    const hp=st.hpr==null?1:st.hpr; if(hp<.55){ for(let i=0;i<5;i++){ const q=(t*1.3+i*.21)%1; glow(g,-24+i*12,10-q*30,10*(1-q)+5,i%2?'#FF8A3D':'#FFD34D',.8*(1-q)); } }
    if(hp<.3){ for(let i=0;i<4;i++){ const q=(t*.8+i*.27)%1; E(g,-18+i*13+Math.sin(t+i)*3,-12-q*32,5+q*7,4+q*5,'rgba(60,50,60,'+(.5*(1-q))+')'); } } }
}

/* ---------- armadilhas (legado) ---------- */
B.espinhos=(g)=>{ E(g,0,12,22,9,'#6F5E48',1.6); [[-12,12],[-5,8],[4,11],[11,9],[0,15],[-9,16]].forEach(p=>P(g,[[p[0]-3.6,p[1]],[p[0],p[1]-15],[p[0]+3.6,p[1]]],'#C9D3DD',1.3)); };
B.runa=(g)=>{ E(g,0,10,24,12,'rgba(155,92,255,.35)',1.4); C(g,0,10,18,8,0,6.3,'#B58CFF',2.4); C(g,0,10,10,4.6,0,6.3,'#E0CCFF',1.6); L(g,-8,10,8,10,2,'#E0CCFF',true); L(g,0,3,0,17,2,'#E0CCFF',true); };
B.selo_gelo=(g)=>{ E(g,0,10,24,12,'rgba(140,220,255,.5)',1.4); [[-10,10,-20],[0,8,-26],[10,11,-18],[-4,14,-14]].forEach(p=>P(g,[[p[0]-4,p[1]],[p[0],p[1]+p[2]],[p[0]+4,p[1]]],'#A9E6FF',1.3)); };

/* ---------- ícones dos feitiços (cartas) ---------- */
const SP={};
SP.bola_fogo=g=>{ glow(g,0,0,34,'#FF6A1F',.55); P(g,[[8,-10],[30,-34],[24,-8],[38,-16],[14,12]],'#FF5A1F',1.8); P(g,[[8,-4],[24,-24],[19,-2],[27,-8],[11,9]],'#FFB02E'); E(g,-3,6,19,19,'#FF8A1F',2.2); E(g,-7,2,12,12,'#FFD34D'); E(g,-9,-1,5,5,'#FFF6C9'); };
SP.raio_arcano=g=>{ glow(g,0,0,34,'#B58CFF',.6); E(g,0,0,27,27,'rgba(181,140,255,.35)'); P(g,[[8,-32],[-14,3],[-1,3],[-9,32],[18,-7],[3,-7],[13,-32]],'#FFE23D',2.2); P(g,[[5,-23],[-6,0],[2,0],[-1,17],[10,-6],[3,-6],[9,-23]],'#FFF6A8'); };
SP.bencao=g=>{ glow(g,0,0,34,'#7CFFB0',.55); g.beginPath(); g.moveTo(0,24); g.bezierCurveTo(-38,-2,-20,-32,0,-12); g.bezierCurveTo(20,-32,38,-2,0,24); g.closePath(); g.fillStyle=radial(g,0,0,30,28,'#FF6FA5'); g.fill(); stk(g,2.2); E(g,-9,-9,4.4,6.6,'#FFC2DA'); L(g,0,-6,0,11,3.4,'#fff',true); L(g,-8,3,8,3,3.4,'#fff',true); E(g,-26,-15,2.6,2.6,'#7CFFB0'); E(g,27,9,2.6,2.6,'#7CFFB0'); E(g,24,-22,2.2,2.2,'#FFF6A8'); };
SP.muralha_gelo=g=>{ glow(g,0,0,34,'#9FE3FF',.5); [[-19,7],[0,-4],[19,7]].forEach((p,i)=>{ P(g,[[p[0]-11,p[1]+19],[p[0]-11,p[1]-6],[p[0],p[1]-20],[p[0]+11,p[1]-6],[p[0]+11,p[1]+19]],i===1?'#BFEFFF':'#9FE3FF',2); L(g,p[0]-5,p[1]-5,p[0]-5,p[1]+11,2.2,'#fff',true); }); };
SP.silencio=g=>{ glow(g,0,0,34,'#9468FF',.5); E(g,0,0,26,26,'#9468FF',2.2); E(g,-4,11,5.4,4.4,'#fff'); L(g,0,9,0,-13,3.4,'#fff',true); P(g,[[0,-13],[11,-9],[11,-3],[0,-7]],'#fff'); L(g,-19,-19,19,19,5.6,'#FF4D4D'); };
SP.espinhos=g=>{ glow(g,0,0,30,'#C9D3DD',.3); E(g,0,17,26,9,'#6F5E48',1.8); [[-17,16,-26],[-8,13,-34],[2,16,-40],[12,13,-32],[20,17,-24]].forEach(p=>P(g,[[p[0]-4.4,p[1]],[p[0],p[1]+p[2]],[p[0]+4.4,p[1]]],'#E8EEF5',1.5)); };
SP.runa=g=>{ glow(g,0,0,34,'#B58CFF',.6); E(g,0,2,28,28,'rgba(155,92,255,.35)',1.8); C(g,0,2,22,22,0,6.3,'#C9A8FF',2.6); C(g,0,2,13,13,0,6.3,'#E0CCFF',1.8); P(g,[[0,-14],[12,8],[-12,8]],null,1.6); L(g,0,-14,12,8,2,'#E0CCFF',true); L(g,12,8,-12,8,2,'#E0CCFF',true); L(g,-12,8,0,-14,2,'#E0CCFF',true); E(g,0,0,3,3,'#fff'); };
SP.selo_gelo=g=>{ glow(g,0,0,34,'#9FE3FF',.55); E(g,0,6,28,14,'rgba(140,220,255,.55)',1.8); [[-14,8,-28],[0,4,-38],[14,9,-26],[-6,13,-18],[8,14,-20]].forEach(p=>P(g,[[p[0]-5,p[1]],[p[0],p[1]+p[2]],[p[0]+5,p[1]]],'#BFEFFF',1.6)); };
SP.rede=g=>{ glow(g,0,0,34,'#E8D9A8',.4); E(g,0,0,28,28,'rgba(232,217,168,.35)'); for(let i=-18;i<=18;i+=9){ L(g,i,-23,i,23,2.2,'#8A5A2B',true); L(g,-23,i,23,i,2.2,'#8A5A2B',true); } C(g,0,0,28,28,0,6.3,OL,2.4); E(g,0,0,5.6,5.6,'#FFD23F',1.4); };
SP.tempestade=g=>{ glow(g,0,0,36,'#8FB8FF',.5); E(g,-10,-13,17,11,'#7E8CA8',1.9); E(g,11,-15,15,10,'#9AA8C4',1.9); E(g,0,-9,19,10,'#B7C3DB',1.9); P(g,[[5,-1],[-7,13],[1,13],[-5,29],[11,7],[3,7],[9,-1]],'#FFE23D',1.8); };

/* ---------- cache de quadros e desenho de unidades ---------- */
const FR=112, ANC={x:56,y:102};
const CACHE=new Map();
function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function drawRaw(g,key,team,a){
  const tc=TC[team];
  if(CH[key]) human(g,CH[key],a,tc);
  else if(CR[key]) CR[key](g,a,tc);
}
const NW=8;
function frame(key,team,pose,ph,aw,at){
  const k=key+'|'+team+'|'+pose+'|'+ph+'|'+aw+'|'+at;
  let c=CACHE.get(k); if(c) return c;
  c=canvas(FR,FR); const g=c.getContext('2d'); const s=FR/100*1.02;
  g.translate(ANC.x,ANC.y-30*s); g.scale(s,s);
  drawRaw(g,key,team,{pose:pose,mv:ph>=0,ph:ph>=0?ph/NW:0,aw:aw/4,at:at/4,t:ph>=0?0:0});
  CACHE.set(k,c); lru(); return c;
}
const FLYERS={grifo:1,morcegos:1,gargula:1,wyvern:1,fada:1};
function lru(){ if(CACHE.size>700){ let n=0; for(const k of CACHE.keys()){ CACHE.delete(k); if(++n>160) break; } } }
function flyFrame(key,team,idx,aw,at){
  const k=key+'|'+team+'|fly|'+idx+'|'+aw+'|'+at; let c=CACHE.get(k); if(c) return c;
  c=canvas(FR,FR); const q=c.getContext('2d'), sc=FR/100*1.02; q.translate(ANC.x,ANC.y-30*sc); q.scale(sc,sc);
  drawRaw(q,key,team,{pose:'f',mv:true,ph:0,aw:aw/4,at:at/4,t:idx*.04488}); CACHE.set(k,c); lru(); return c;
}
/* st: {pose:'f'|'b'|'s', flip, ph(0..1), mv, aw(0..1), at(0..1), t, hit, born(0..1), sq, lean, grounded} */
function unit(g,key,team,x,y,size,st){
  const s=size/FR, t=st.t||0;
  let ph=-1, aw=0, at=0;
  if(st.aw>0) aw=clamp(Math.ceil(st.aw*4),1,4); else if(st.at>0) at=clamp(Math.ceil(st.at*4),1,4);
  else if(st.mv) ph=Math.floor(((st.ph%1)+1)%1*NW)%NW;
  const fly=!!FLYERS[key];
  let f;
  if(fly){ const per=.4488, idx=Math.floor(((t%per)/per)*10)%10; f=flyFrame(key,team,idx,clamp(Math.ceil((st.aw||0)*4),0,4),clamp(Math.ceil((st.at||0)*4),0,4)); }
  else f=frame(key,team,st.pose==='b'?'b':(st.pose==='s'?'s':'f'),ph,aw,at);
  g.save(); g.translate(x,y);
  const bs=st.born==null?1:st.born;
  const pop=bs<1?(1+Math.sin(bs*PI)*.25)*Math.min(1,bs*3):1;
  const idle=(!st.mv&&aw===0&&at===0)?1+Math.sin(t*2.4)*.012:1;
  g.rotate(st.lean||0); g.scale((st.flip?-1:1)*s*pop*(st.sx||1),s*pop*idle*(st.sq||1));
  g.drawImage(f,-ANC.x,-ANC.y);
  if(st.hit>0){ const tint=tinted(f); g.globalAlpha=Math.min(1,st.hit*6); g.drawImage(tint,-ANC.x,-ANC.y); g.globalAlpha=1; }
  g.restore();
}
const TINT=new WeakMap();
function tinted(f){ let t=TINT.get(f); if(t) return t; t=canvas(FR,FR); const q=t.getContext('2d'); q.drawImage(f,0,0); q.globalCompositeOperation='source-atop'; q.fillStyle='rgba(255,255,255,.75)'; q.fillRect(0,0,FR,FR); TINT.set(f,t); return t; }

/* construções */
const SFR=128, SANC={x:64,y:104};
function structFrame(key,team){
  const k='S|'+key+'|'+team; let c=CACHE.get(k); if(c) return c;
  c=canvas(SFR,SFR); const g=c.getContext('2d'); const sc=key==='heart'?SFR/110:SFR/84; g.translate(SANC.x,SANC.y-24*sc); g.scale(sc,sc);
  if(B[key]) B[key](g,TC[team]); CACHE.set(k,c); return c;
}
function struct(g,key,team,x,y,size,st){
  const f=structFrame(key,team), s=size/SFR, sc=key==='heart'?SFR/110:SFR/84; st=st||{};
  g.save(); g.translate(x,y); g.scale(s,s);
  const bs=st.born==null?1:st.born;
  if(bs<1){ const k=Math.min(1,bs*1.2); g.scale(1,.35+.65*k); g.globalAlpha=Math.min(1,bs*3); }
  g.drawImage(f,-SANC.x,-SANC.y);
  g.save(); g.translate(0,-24*sc); g.scale(sc,sc); dynStruct(g,key,TC[team],0,0,1,st); g.restore();
  if(st.hit>0){ const t=tinted2(f); g.globalAlpha=Math.min(.6,st.hit*5); g.drawImage(t,-SANC.x,-SANC.y); g.globalAlpha=1; }
  g.restore();
}
function tinted2(f){ let t=TINT.get(f); if(t) return t; t=canvas(SFR,SFR); const q=t.getContext('2d'); q.drawImage(f,0,0); q.globalCompositeOperation='source-atop'; q.fillStyle='rgba(255,255,255,.8)'; q.fillRect(0,0,SFR,SFR); TINT.set(f,t); return t; }

/* retratos das cartas */
const PORT={};
function portrait(key,tipo){
  if(PORT[key]) return PORT[key];
  const c=canvas(128,128), g=c.getContext('2d');
  g.translate(64,70);
  if(SP[key]){ const s=1.7; g.scale(s,s); SP[key](g); }
  else if(B[key]&&key!=='heart'){ const s=1.7; g.translate(0,-18); g.scale(s,s); B[key](g,TC[0]); dynStruct(g,key,TC[0],0,0,1,{t:.6,dir:-1}); }
  else { const s=1.55; g.translate(0,-6); g.scale(s,s); const f=FLYERS[key]; drawRaw(g,key,0,{pose:'f',mv:false,ph:0,aw:0,at:0,t:.4}); }
  PORT[key]=c.toDataURL('image/png'); return PORT[key];
}


function pthL(g,f,s,lw){ if(f){g.fillStyle=f;g.fill();} if(s){g.lineWidth=lw||1.6;g.lineJoin='round';g.strokeStyle=s;g.stroke();} }
function lE(g,x,y,rx,ry,f,s,lw){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); pthL(g,f,s,lw); }
function lR(g,x,y,w,h,r,f,s,lw){ r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); pthL(g,f,s,lw); }
function lP(g,pts,f,s,lw){ g.beginPath(); for(let i=0;i<pts.length;i++){ if(i) g.lineTo(pts[i][0],pts[i][1]); else g.moveTo(pts[i][0],pts[i][1]); } g.closePath(); pthL(g,f,s,lw); }
return {TC,OL,unit,struct,portrait,E,R,P,L,C,glow,lit,dk,mix,SP,FLYERS,lE,lR,lP,shadowE,B,CH,CR,drawRaw,dynStruct,human};
})();
