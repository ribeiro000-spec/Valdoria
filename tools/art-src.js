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
/* ===== primitivas orgânicas: contornos levemente irregulares e curvos (mesma "pincelada" em todos os quadros) ===== */
function rng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
let SC=0; function resetSeed(){ SC=0; }
function jr(n){ const r=rng((SC++)*7919+13), o=[]; for(let i=0;i<n;i++) o.push(r()-.5); return o; }
function smoothClosed(g,pts){
  const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; g.beginPath();
  const s=m(pts[n-1],pts[0]); g.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){ const c=pts[i], e=m(pts[i],pts[(i+1)%n]); g.quadraticCurveTo(c[0],c[1],e[0],e[1]); }
  g.closePath();
}
function E(g,x,y,rx,ry,col,lw){
  rx=Math.abs(rx); ry=Math.abs(ry); const n=rx+ry<5?6:12, j=jr(n), amp=Math.min(.1,.02+(rx+ry)*.0012), pts=[];
  for(let i=0;i<n;i++){ const a=i/n*6.2832, k=1+j[i]*amp*2.2; pts.push([x+Math.cos(a)*rx*1.035*k,y+Math.sin(a)*ry*1.035*k]); }
  smoothClosed(g,pts);
  if(col){ g.fillStyle=hex(col)?radial(g,x,y,rx,ry,col):col; g.fill(); }
  if(lw) stk(g,lw);
}
function R(g,x,y,w,h,r,col,lw){
  r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2); const j=jr(8), a=Math.min(1.3,.25+Math.min(Math.abs(w),Math.abs(h))*.04);
  const X0=x+j[0]*a,Y0=y+j[1]*a,X1=x+w+j[2]*a,Y1=y+j[3]*a,X2=x+w+j[4]*a,Y2=y+h+j[5]*a,X3=x+j[6]*a,Y3=y+h+j[7]*a;
  g.beginPath(); g.moveTo(X0+r,Y0);
  g.quadraticCurveTo((X0+X1)/2,Y0+j[1]*a*1.8,X1-r,Y1); g.quadraticCurveTo(X1,Y1,X1,Y1+r);
  g.quadraticCurveTo(X1+j[2]*a*1.8,(Y1+Y2)/2,X2,Y2-r); g.quadraticCurveTo(X2,Y2,X2-r,Y2);
  g.quadraticCurveTo((X2+X3)/2,Y2+j[5]*a*1.8,X3+r,Y3); g.quadraticCurveTo(X3,Y3,X3,Y3-r);
  g.quadraticCurveTo(X3+j[6]*a*1.8,(Y3+Y0)/2,X0,Y0+r); g.quadraticCurveTo(X0,Y0,X0+r,Y0); g.closePath();
  if(col){ g.fillStyle=hex(col)?vgrad(g,y,y+h,col):col; g.fill(); if(hex(col)&&h>6){ g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.15)'; g.fillRect(x,y,w*.3,h); g.fillStyle='rgba(20,5,40,.10)'; g.fillRect(x+w*.72,y,w*.3,h); g.restore(); } }
  if(lw) stk(g,lw);
}
function P(g,pts,col,lw){
  const j=jr(pts.length*2), a=Math.min(.7,.2+pts.length*.04); g.beginPath(); let y0=1e9,y1=-1e9;
  for(let i=0;i<pts.length;i++){ const px=pts[i][0]+j[i*2]*a, py=pts[i][1]+j[i*2+1]*a; if(i) g.lineTo(px,py); else g.moveTo(px,py); y0=Math.min(y0,py); y1=Math.max(y1,py); }
  g.closePath(); if(col){ g.fillStyle=hex(col)?vgrad(g,y0,y1,col):col; g.fill(); } if(lw) stk(g,lw);
}
function C(g,x,y,rx,ry,a0,a1,col,w){ g.beginPath(); g.ellipse(x,y,rx,ry,0,a0,a1); g.lineWidth=w; g.lineCap='round'; g.strokeStyle=col; g.stroke(); }

function seedAt(n){ SC=n; }
function L(g,x1,y1,x2,y2,w,col,noOut){
  g.lineCap='round';
  if(!noOut){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w+2.8; g.strokeStyle=OL; g.stroke(); }
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w; g.strokeStyle=col; g.stroke();
  if(hex(col)&&w>3.4){ g.beginPath(); g.moveTo(x1-w*.18,y1-w*.12); g.lineTo(x2-w*.18,y2-w*.12); g.lineWidth=w*.28; g.strokeStyle=lit(col,.45); g.stroke(); }
}
function glow(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(255,255,255,0)'); g.save(); g.globalAlpha=a==null?1:a; g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill(); g.restore(); }
function shadowE(g,x,y,rx,ry,a){ g.fillStyle='rgba(20,8,40,'+(a||.3)+')'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); g.fill(); }
const SK='#F6CFA3';
/* ===== kit orgânico: membros afilados, rochas facetadas, musgo, pedras de muro, telhas, chamas, cristais ===== */
function tube(g,x1,y1,x2,y2,w1,w2,col){
  const a=Math.atan2(y2-y1,x2-x1); let nx=-Math.sin(a), ny=Math.cos(a);
  const path=e=>{ g.beginPath(); g.moveTo(x1+nx*(w1/2+e),y1+ny*(w1/2+e)); g.lineTo(x2+nx*(w2/2+e),y2+ny*(w2/2+e)); g.arc(x2,y2,w2/2+e,a+PI/2,a-PI/2,true); g.lineTo(x1-nx*(w1/2+e),y1-ny*(w1/2+e)); g.arc(x1,y1,w1/2+e,a-PI/2,a+PI/2,true); g.closePath(); };
  path(1.5); g.fillStyle=OL; g.fill(); path(0);
  if(nx+ny>0){ nx=-nx; ny=-ny; }
  const mx=(x1+x2)/2, my=(y1+y2)/2, wm=(w1+w2)/4;
  const gr=g.createLinearGradient(mx+nx*wm,my+ny*wm,mx-nx*wm,my-ny*wm); gr.addColorStop(0,lit(col,.35)); gr.addColorStop(.45,col); gr.addColorStop(1,dk(col,.32));
  g.fillStyle=hex(col)?gr:col; g.fill();
}
function body(g,tw,col,y0,y1){
  y0=y0==null?-7:y0; y1=y1==null?15:y1; const h=tw/2, ym=(y0+y1)/2;
  const pts=[[-h*.55,y0-1],[0,y0-2.2],[h*.55,y0-1],[h*1.02,y0+3.5],[h*.92,ym-1],[h*.8,ym+3],[h*.98,y1-1.5],[h*.9,y1+1],[0,y1+1.8],[-h*.9,y1+1],[-h*.98,y1-1.5],[-h*.8,ym+3],[-h*.92,ym-1],[-h*1.02,y0+3.5]];
  smoothClosed(g,pts); g.fillStyle=hex(col)?vgrad(g,y0,y1,col):col; g.fill();
  g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(-h*1.1,y0-3,h*.7,y1-y0+6); g.fillStyle='rgba(20,5,40,.12)'; g.fillRect(h*.5,y0-3,h*.7,y1-y0+6); g.restore(); stk(g,1.7);
}
/* rocha facetada (luz no canto superior esquerdo) */
function rock(g,cx,cy,rx,ry,seed,col,lw){
  const r=rng(seed), n=9, pts=[];
  for(let i=0;i<n;i++){ const a=i/n*6.2832+r()*.35, k=.78+r()*.42; pts.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]); }
  const path=()=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); };
  path(); g.fillStyle=vgrad(g,cy-ry,cy+ry,col); g.fill();
  g.save(); path(); g.clip();
  for(let i=0;i<n;i++){ const p=pts[i], q=pts[(i+1)%n], a=Math.atan2((p[1]+q[1])/2-cy,(p[0]+q[0])/2-cx), l=Math.cos(a+2.356);
    g.beginPath(); g.moveTo(cx+(r()-.5)*rx*.4,cy+(r()-.5)*ry*.4); g.lineTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.closePath();
    g.fillStyle=l>0?'rgba(255,255,255,'+(.26*l).toFixed(2)+')':'rgba(25,10,30,'+(.34*-l).toFixed(2)+')'; g.fill(); }
  g.strokeStyle='rgba(30,22,20,.5)'; g.lineWidth=1;
  for(let k=0;k<2;k++){ let x=cx+(r()-.5)*rx, y=cy+(r()-.5)*ry; g.beginPath(); g.moveTo(x,y); for(let s=0;s<4;s++){ x+=(r()-.5)*rx*.5; y+=r()*ry*.35; g.lineTo(x,y); } g.stroke(); }
  for(let i=0;i<22;i++){ g.fillStyle=r()<.5?'rgba(255,255,255,.16)':'rgba(0,0,0,.18)'; g.fillRect(cx+(r()-.5)*rx*1.7,cy+(r()-.5)*ry*1.7,1.1,1.1); }
  g.restore(); path(); stk(g,lw||1.7);
}
/* musgo e vinhas sobre uma superfície */
function moss(g,x,y,w,seed,hang){
  const r=rng(seed);
  for(let i=0;i<6;i++){ const bx=x+(r()-.5)*w, by=y+(r()-.5)*w*.18, s=w*(.16+r()*.14); E(g,bx,by,s,s*.6,i%2?'#6E9A2E':'#5B8426',0); E(g,bx-s*.2,by-s*.25,s*.55,s*.3,'#9CCB4A',0); }
  if(hang) for(let i=0;i<3;i++){ const bx=x+(r()-.5)*w*.9, len=w*(.3+r()*.5); g.strokeStyle='#4E7A22'; g.lineWidth=1.3; g.beginPath(); g.moveTo(bx,y); g.quadraticCurveTo(bx+(r()-.5)*4,y+len*.5,bx+(r()-.5)*3,y+len); g.stroke(); E(g,bx,y+len,1.6,2.2,'#7FB23A',0); }
}
function tuft(g,x,y,s,seed,col){ const r=rng(seed); g.strokeStyle=col||'#5FA040'; g.lineWidth=1.4; g.lineCap='round'; for(let i=0;i<5;i++){ const a=-PI/2+(i-2)*.42+(r()-.5)*.2; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*s*.5,y+Math.sin(a)*s*.5,x+Math.cos(a)*s+(r()-.5)*2,y+Math.sin(a)*s); g.stroke(); } }
/* pedra de muro (quase retangular, irregular) */
function stone(g,x,y,w,h,seed,col){
  const r=rng(seed), j=()=>(r()-.5)*Math.min(w,h)*.2;
  const pts=[[x+j()+1.2,y+j()+1.2],[x+w*.5+j(),y+j()*.4],[x+w+j()-1.2,y+j()+1.2],[x+w+j()*.5,y+h*.5+j()*.5],[x+w+j()-1.2,y+h+j()-1.2],[x+w*.5+j(),y+h+j()*.4],[x+j()+1.2,y+h+j()-1.2],[x+j()*.5,y+h*.5+j()*.5]];
  g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fillStyle=vgrad(g,y,y+h,col); g.fill();
  g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(x,y,w,h*.28); g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(x,y,w*.22,h); g.fillStyle='rgba(20,10,30,.2)'; g.fillRect(x,y+h*.74,w,h*.3);
  g.strokeStyle='rgba(30,20,30,.25)'; g.lineWidth=.8; if(r()<.5){ g.beginPath(); g.moveTo(x+w*(.2+r()*.5),y+h*.15); g.lineTo(x+w*(.3+r()*.4),y+h*.8); g.stroke(); }
  for(let i=0;i<8;i++){ g.fillStyle=r()<.5?'rgba(255,255,255,.14)':'rgba(0,0,0,.16)'; g.fillRect(x+r()*w,y+r()*h,1,1); } g.restore();
  g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); stk(g,1.3);
}
/* parede de pedras irregulares */
function masonry(g,x0,y0,x1,y1,rows,seed,col,taper){
  const r=rng(seed), rh=(y1-y0)/rows;
  for(let k=rows-1;k>=0;k--){ const y=y0+k*rh, t=taper?(1-k/rows)*taper:0; let x=x0+t+(k%2?-rh*.3:0), xe=x1-t;
    while(x<xe-2){ const w=Math.min(xe-x,rh*(.9+r()*.9)); stone(g,x,y,w+.6,rh+.4,seed*31+Math.floor(x*7)+k,mix(col,r()<.5?'#ffffff':'#2a1a3a',.08+r()*.12)); x+=w; } }
}
/* telhado cônico com telhas */
function roof(g,cx,by,w,h,col,seed){
  const r=rng(seed);
  g.beginPath(); g.moveTo(cx-w/2,by); g.quadraticCurveTo(cx-w*.2,by-h*.55,cx,by-h); g.quadraticCurveTo(cx+w*.2,by-h*.55,cx+w/2,by); g.quadraticCurveTo(cx,by+h*.08,cx-w/2,by); g.closePath();
  g.fillStyle=vgrad(g,by-h,by,col); g.fill(); g.save(); g.clip();
  for(let k=0;k<6;k++){ const yy=by-h+(k+1)*h/6.3, ww=w*(k+1)/6.8; for(let i=-3;i<=3;i++){ const xx=cx+i*ww/6+(k%2?ww/12:0); g.beginPath(); g.arc(xx,yy,ww/12,0,PI); g.fillStyle=r()<.5?lit(col,.12):dk(col,.1); g.fill(); g.strokeStyle='rgba(25,10,40,.55)'; g.lineWidth=1; g.stroke(); } }
  g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(cx-w/2,by-h,w*.3,h+2); g.restore();
  g.beginPath(); g.moveTo(cx-w/2,by); g.quadraticCurveTo(cx-w*.2,by-h*.55,cx,by-h); g.quadraticCurveTo(cx+w*.2,by-h*.55,cx+w/2,by); g.quadraticCurveTo(cx,by+h*.08,cx-w/2,by); g.closePath(); stk(g,1.8);
}
/* chama em forma de língua (bézier) */
function flame(g,x,y,w,h,rot,seed,cols){
  const r=rng(seed), bend=(r()-.5)*w*.9; g.save(); g.translate(x,y); g.rotate(rot||0);
  g.beginPath(); g.moveTo(-w/2,0); g.bezierCurveTo(-w*.6,-h*.35,-w*.1+bend,-h*.6,bend*.8,-h); g.bezierCurveTo(w*.15+bend,-h*.55,w*.65,-h*.3,w/2,0); g.bezierCurveTo(w*.2,h*.12,-w*.2,h*.12,-w/2,0); g.closePath();
  const gr=g.createLinearGradient(0,0,0,-h); gr.addColorStop(0,cols[0]); gr.addColorStop(.5,cols[1]); gr.addColorStop(1,cols[2]); g.fillStyle=gr; g.fill(); g.restore();
}
/* cristal facetado */
function crystal(g,x,y,w,h,rot,col,lw){
  g.save(); g.translate(x,y); g.rotate(rot||0);
  const L=[[-w/2,0],[-w*.45,-h*.72],[0,-h],[w*.45,-h*.72],[w/2,0],[0,h*.12]];
  g.beginPath(); L.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fillStyle=vgrad(g,-h,0,col); g.fill();
  g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(-w*.45,-h*.72); g.lineTo(0,-h); g.lineTo(0,0); g.lineTo(-w/2,0); g.closePath(); g.fill(); g.fillStyle='rgba(10,30,70,.28)'; g.beginPath(); g.moveTo(w*.45,-h*.72); g.lineTo(0,-h); g.lineTo(0,0); g.lineTo(w/2,0); g.closePath(); g.fill(); g.restore();
  g.beginPath(); L.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); stk(g,lw||1.4); g.restore();
}


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
  const bob=mv?-Math.abs(cs)*2.6:Math.sin((a.t||0)*2.4)*-.8;
  const aw=a.aw||0, at=a.at||0, ap=armPose(o.wk||'slash',aw,at);
  const bw=o.bw||1, tw=(side?15:22)*bw, hipY=13;
  const lunge=aw>0?-aw*1.6:(at>0?Math.sin(Math.min(1,at)*PI)*3.4:0);
  g.save(); g.translate(side?lunge*.8:0,bob+(side?0:lunge*.4));
  seedAt(100); if(o.back) o.back(g,pose,tc,a);
  const lw=o.lw||1;
  const leg=(dx,ph,far)=>{
    const sn=Math.sin(ph), lift=mv?Math.max(0,sn)*5.2:0; let fx=dx, fy=30-lift, kx, ky;
    if(side){ fx=mv?sn*8:(far?-2.4:2.4); kx=fx*.5+(mv&&sn>0?3.2:0); ky=21.5-lift*.5; } else { kx=dx*1.1; ky=21.8-lift*.55; }
    const pc=far?dk(o.pants,.22):o.pants;
    tube(g,side?0:dx,hipY,kx,ky,8.6*lw,7*lw,pc); tube(g,kx,ky,fx,fy-2.8,7*lw,5.8*lw,pc);
    const bc=far?dk(o.boots,.2):o.boots; E(g,fx+(side?2.6:0),fy,5.9*lw,3.7,bc,1.4); E(g,fx+(side?4.4:0),fy-.6,2.6*lw,2,lit(bc,.2),0);
  };
  if(side){ leg(0,w+PI,true); leg(0,w,false); } else { leg(-4.9,w+PI,false); leg(4.9,w,false); }
  const shX=tw/2+1.6, swing=mv?Math.sin(w)*3.4:0;
  const arm=(sx,sy,hx,hy,col)=>{ const ex=(sx+hx)/2+(sx<0?-1.8:1.8), ey=(sy+hy)/2-.4; tube(g,sx,sy,ex,ey,6.6,5.6,col); tube(g,ex,ey,hx,hy,5.6,4.7,col); E(g,hx,hy,3.8,3.7,o.gloves||o.skin||SK,1.3); };
  if(side) arm(-1,-3,-4+swing*1.5,8,dk(o.sleeve||SK,.25));
  seedAt(200); if(o.torso) o.torso(g,pose,tc,tw,a); else body(g,tw,o.tcol||'#6aa');
  seedAt(300);
  const mainHand=()=>{ const sx=side?3:shX, hxx=sx+Math.sin(ap.th)*14, hyy=-3+Math.cos(ap.th)*14;
    arm(sx,-3,hxx,hyy,o.sleeve||o.skin||SK);
    if(o.weapon){ g.save(); g.translate(hxx,hyy); g.rotate(ap.wa); o.weapon(g,{fl:ap.fl,t:a.t},tc); g.restore(); } };
  if(!side){ arm(-shX,-3,-shX-1.5,8-swing,o.sleeve||o.skin||SK); if(o.off) o.off(g,pose,tc,-shX-1.5,8-swing,a); }
  if(o.arms) o.arms(g,pose,tc,a,ap,shX,swing); else mainHand();
  seedAt(500); g.save(); g.translate(side?1:0,-19-(mv?bob*.3:0)+(aw>0?-aw*.8:0)); if(o.hs) g.scale(o.hs,o.hs); headFull(g,o,pose,tc); g.restore();
  seedAt(700); if(o.front) o.front(g,pose,tc,a);
  g.restore();
}
/* ---------- troncos ---------- */
const T={
  plate:(c1,c2)=>(g,p,tc,tw)=>{ body(g,tw,c1); if(p==='f'){ R(g,-5,-6,10,20,2.5,tc.m,1.3); E(g,0,2,3,3.4,'#F2C14E',1); L(g,-tw/2+2,6,-5,6,1,dk(c1,.3),true); L(g,tw/2-2,6,5,6,1,dk(c1,.3),true); } else if(p==='b') R(g,-5,-6,10,20,2.5,tc.d,1.3); R(g,-tw/2-1,13,tw+2,3.6,1.5,'#6B4423',1.2); E(g,-tw/2-2,-5,6,5.4,c1,1.5); E(g,tw/2+2,-5,6,5.4,c1,1.5); },
  tunic:(c1,trim)=>(g,p,tc,tw)=>{ body(g,tw,c1); R(g,-tw/2,10,tw,4.5,1.5,trim||'#6B4423',1.2); if(p==='f'){ P(g,[[-4,-7],[4,-7],[0,0]],lit(c1,.3),1); E(g,0,12.2,2,1.6,'#F2C14E',.9); } },
  robe:(c1,c2)=>(g,p,tc,tw)=>{ P(g,[[-tw/2+1,-7],[tw/2-1,-7],[tw/2+6,31],[-tw/2-6,31]],c1,1.7); R(g,-tw/2-6,27,tw+12,4.4,2,c2||tc.m,1.3); R(g,-tw/2,9,tw,4,1.5,c2||tc.m,1.2); if(p==='f') L(g,0,-4,0,27,1,dk(c1,.3),true); },
  bare:(skin,furc)=>(g,p,tc,tw)=>{ body(g,tw,skin); if(p==='f'){ L(g,0,-4,0,8,1.2,dk(skin,.3),true); C(g,-3.6,1,3.4,2.4,3.4,6.1,dk(skin,.3),1.2); C(g,3.6,1,3.4,2.4,3.14,6,dk(skin,.3),1.2); } R(g,-tw/2-1,11,tw+2,5.4,2,'#6B4423',1.3); E(g,-tw/2-2,-5.4,7,5.6,furc,1.5); E(g,tw/2+2,-5.4,7,5.6,furc,1.5); },
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
  torso:(g,p,tc,tw)=>{ body(g,tw,'#FF9A2E'); R(g,-tw/2,5,tw,3.6,1,'#FFF3A0',1); R(g,-tw/2-.5,11,tw+1,5,1.6,'#6B4423',1.2); if(p==='f'){ R(g,-3.6,11.6,7,4,1,'#8E96A3',1); } },
  back:(g,p,tc)=>{ if(p!=='f'){ R(g,-9,-6,18,18,3,'#6B7A99',1.5); E(g,0,3,4.4,4.4,'#B7C0CC',1.2); } else R(g,-12,-4,6,12,2,'#6B7A99',1.2); },
  gear:(g,p,tc)=>{ E(g,0,-8,12.8,5.4,'#FFD23F',1.5); R(g,-3.4,-18,6.8,10,2.4,'#FFD23F',1.3); if(p==='f'){ E(g,-4.8,-3.6,3.9,3.9,'rgba(189,235,255,.85)',1.3); E(g,4.8,-3.6,3.9,3.9,'rgba(189,235,255,.85)',1.3); L(g,-1,-3.6,1,-3.6,1.3,OL,true); } }};
CH.esqueleto={skin:'#F3EFE6',pants:'#E9E4D6',boots:'#D8D2C0',sleeve:'#F3EFE6',gloves:'#F3EFE6',bw:.85,lw:.6,wk:'slash',weapon:WP.bone,
  torso:(g,p,tc,tw)=>{ body(g,tw,'#F3EFE6'); if(p==='f'){ [-3,1.6,6.2,10.4].forEach(y=>{ L(g,-tw/2+2,y,tw/2-2,y,1.4,'#B8B2A0',true); }); L(g,0,-7,0,13,1.4,'#B8B2A0',true); } },
  gear:(g,p,tc)=>{ if(p==='f'){ E(g,0,0,10.4,10,'#F7F4EC',1.6); E(g,-4,-.6,3.1,3.6,OL); E(g,4,-.6,3.1,3.6,OL); glow(g,-4,-.6,5,'#B58CFF',.6); glow(g,4,-.6,5,'#B58CFF',.6); P(g,[[-1.6,3],[1.6,3],[0,6]],OL); L(g,-4,8,4,8,1.2,OL,true); [-2,0,2].forEach(x=>L(g,x,7,x,9,.9,OL,true)); } }};
CH.soldado={skin:'#F2C79B',pants:'#6B4A2A',boots:'#3A2A20',sleeve:'#8A5A2B',bw:1,wk:'jab',weapon:WP.spear,
  torso:T.tunic('#8A5A2B','#4A3220'),
  off:(g,p,tc,x,y)=>{ E(g,x-3,y-3,9,10,tc.m,1.7); E(g,x-3,y-3,3.2,3.6,'#F2C14E',1); },
  gear:(g,p,tc)=>{ E(g,0,-5,12.2,8.6,'#C9852E',1.6); R(g,-2.8,-17,5.6,11,2,tc.m,1.2); if(p==='f'){ R(g,-8,-5,16,3,1.4,'#8A5A2B',1); } }};

/* ---------- criaturas e máquinas ---------- */
function flapWing(g,t,col,s,ph,len){ const f=Math.sin(t*14+(ph||0))*.55; [-1,1].forEach(q=>{ g.save(); g.translate(q*7*s,-2); g.rotate(q*(-.7+f)); P(g,[[0,0],[q*(len||26)*s,-16*s],[q*(len||26)*s+q*4,0],[q*(len*.7||18)*s,7*s],[q*8*s,6*s]],col,1.5); L(g,0,0,q*(len||26)*s,-12*s,1,dk(col,.35),true); g.restore(); }); }
const CR={};
/* Golem: corpo de rochas empilhadas com musgo, vinhas e runa azul brilhante */
CR.golem=(g,a,tc)=>{
  const pose=a.pose||'f', back=pose==='b', side=pose==='s', t=a.t||0;
  const mv=!!a.mv, w=mv?a.ph*6.2832:0, aw=a.aw||0, at=a.at||0;
  const bob=mv?-Math.abs(Math.cos(w))*2.8:Math.sin(t*2)*-.9;
  const fist=aw>0?-aw*15:(at>0?(at<.55?-15+at/.55*32:17-(at-.55)/.45*17):0);
  const lunge=at>0?Math.sin(Math.min(1,at)*PI)*3:0, sx=side?.74:1;
  const ST=['#8F8D80','#7D786C','#A39F8D','#6F6A5F','#938F7F'], CY=tc.m;
  g.save(); g.translate(side?lunge*.7:0,bob+(side?0:lunge*.5));
  // pernas (coxa, canela, pé)
  [-1,1].forEach((q,i)=>{ const ph=w+(q>0?0:PI), sn=Math.sin(ph), lift=mv?Math.max(0,sn)*5.5:0, fx=side?(mv?sn*8:q*2):q*9.8*sx;
    rock(g,fx*.88,16.5-lift*.35,7.6*sx+1,9.2,101+i,ST[i],1.7); rock(g,fx,24.2-lift*.75,6.8*sx+1,7.4,111+i,ST[i+2],1.7); rock(g,fx+(side?2.4:0),30.4-lift,9.6*sx+1.5,4.8,121+i,ST[3],1.7);
    moss(g,fx*.9,11-lift*.2,8,130+i,false); });
  rock(g,0,8.5,14.5*sx+2,8.6,140,ST[3],1.7);                                   // quadril
  if(!back) E(g,0,11.5,6,2.2,'rgba(40,25,10,.45)',0);                           // cinto de raízes
  // braço de trás (lado)
  const arm=(q,fy)=>{ const ax=q*(side?2:25*sx), sy0=-12;
    rock(g,ax,sy0+4,8.2*sx+1.5,10,150+(q>0?1:0),ST[q>0?4:2],1.7);              // braço
    rock(g,ax*1.04,sy0+15+fy,9.4*sx+1.5,10.5,160+(q>0?1:0),ST[q>0?3:4],1.8);   // antebraço/punho
    for(let k=0;k<3;k++) rock(g,ax*1.04+(k-1)*4.2*sx,sy0+23.5+fy,2.8,3.2,170+k+(q>0?5:0),ST[k+1],1.1); };   // dedos
  if(side) arm(-1,-fist*.4+4);
  // tronco
  rock(g,0,-4,17.5*sx+2,15,180,ST[0],1.9);
  rock(g,0,2,13*sx+1,9,181,ST[4],1.4);
  moss(g,-3,-14,15*sx+4,190,true); moss(g,6,-7,8,191,false);
  if(!back){
    // runa em espiral
    const pulse=.6+.4*Math.sin(t*3.2)+(at>0?at*.8:0)+(aw>0?aw*.6:0);
    glow(g,side?3:0,-4,11,CY,.3*pulse); g.strokeStyle=CY; g.lineWidth=1.7; g.lineCap='round'; g.beginPath();
    for(let th=0;th<12.5;th+=.3){ const rr=th*.62, px=(side?3:0)+Math.cos(th)*rr*(side?.7:1), py=-4+Math.sin(th)*rr; if(th) g.lineTo(px,py); else g.moveTo(px,py); } g.stroke();
    C(g,side?3:0,-4,8.2*(side?.7:1),8.2,.4,5.9,CY,1.2);
  } else { moss(g,0,-6,18,192,true); g.strokeStyle='rgba(30,22,20,.55)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-6,-14); g.lineTo(-2,-6); g.lineTo(-5,2); g.stroke(); }
  // ombros
  [-1,1].forEach((q,i)=>{ if(side&&q>0) return; const px=side?-2:q*21.5*sx; rock(g,px,-12.5+(aw>0?-aw*2:0),11.5*sx+1.5,9.6,200+i,ST[i?3:2],1.8); moss(g,px,-19.5,11*sx+2,210+i,true); });
  // braço da frente
  if(side) arm(1,fist); else { arm(-1,fist); arm(1,fist); }
  // cabeça
  g.save(); g.translate(side?3:0,-23.5+(aw>0?-aw*1.5:0)+(at>0?Math.sin(at*PI)*2:0));
  rock(g,0,0,10.4*(side?.8:1),9.4,220,ST[2],1.8);
  if(!back){
    P(g,[[-8*sx,-1.5],[8*sx,-1.5],[7*sx,4.2],[0,6.4],[-7*sx,4.2]],'#4B463E',1.3);               // placa do rosto
    const ey=1; [-1,1].forEach(q=>{ if(side&&q<0) return; const x0=q*4.1*sx+(side?3:0); glow(g,x0,ey,5.5,CY,.6); P(g,[[x0-2.6,ey-.9],[x0+2.6,ey-1.8*q],[x0+2.2,ey+1.5],[x0-2.2,ey+1.2]],tc.l,0); });
    L(g,-6*sx,-3.4,-1.5,-2.4,1.8,'#3A352E',true); L(g,6*sx,-3.4,1.5,-2.4,1.8,'#3A352E',true);
  } else moss(g,0,0,12,222,false);
  moss(g,-1,-8.6,13,221,true); tuft(g,-4,-8.6,4.6,230,'#6FA83A'); tuft(g,3,-9,5.4,231,'#80BC48'); tuft(g,7,-7.5,4,232,'#6FA83A');
  g.restore();
  g.restore();
};

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
function wheel(g,x,y,r,seed){ E(g,x,y,r,r,'#6B4423',1.9); E(g,x,y,r*.82,r*.82,'#8B5A2B',0); g.strokeStyle='#4A4D58'; g.lineWidth=2; g.beginPath(); g.arc(x,y,r*.92,0,6.2832); g.stroke(); for(let i=0;i<8;i++){ const q=i*.785+.2; L(g,x,y,x+Math.cos(q)*r*.84,y+Math.sin(q)*r*.84,1.5,'#6B4423',true); } E(g,x,y,r*.28,r*.28,'#B7BCC8',1.2); E(g,x,y,r*.1,r*.1,'#4A4D58',0); }
B.canhao=(g,tc)=>{
  shadowE(g,0,27,29,6,.3);
  [[-23,23],[-18.5,25],[-20.5,19.5],[-15,22]].forEach((p,i)=>{ E(g,p[0],p[1],4.6,4.6,'#4A4D58',1.3); E(g,p[0]-1.5,p[1]-1.6,1.5,1.4,'#B7BCC8',0); });
  P(g,[[-17,5],[17,5],[20,21],[13,26],[-13,26],[-20,21]],'#8B5A2B',1.9);
  [10,15,20].forEach(y=>L(g,-18,y,18,y+.6,1,'#5E3C1B',true)); [-8,0,8].forEach(x=>L(g,x,8,x*1.1,24,.9,'#6B4423',true));
  R(g,-18,8,36,3.2,1.4,'#4A4D58',1.3); R(g,-19,19,38,3.2,1.4,'#4A4D58',1.3); [-14,-5,5,14].forEach(x=>{ E(g,x,9.6,1,1,'#B7BCC8',0); E(g,x,20.6,1,1,'#B7BCC8',0); });
  L(g,-24,25,24,25,3.4,'#5E3C1B'); wheel(g,-19,25,8.6); wheel(g,19,25,8.6);
  R(g,-5,23,10,3,1,tc.m,1.1); tuft(g,24,27,6,41,'#5FA040'); tuft(g,-26,27,5,42,'#6FB04A'); tuft(g,0,28,4,43,'#5FA040');
};
B.balista=(g,tc)=>{
  shadowE(g,0,27,29,6,.3);
  tube(g,-15,25,-5,6,5.5,4.5,'#7A4A2A'); tube(g,15,25,5,6,5.5,4.5,'#7A4A2A'); tube(g,-10,20,10,20,3.6,3.6,'#6B4423');
  R(g,-6,3,12,24,3,'#A26A32',1.7); L(g,0,5,0,25,1,'#6B4423',true); E(g,0,17,5.4,5.4,'#8E96A3',1.4); E(g,0,17,2,2,'#4A4D58',0);
  wheel(g,-20,26,5.6); wheel(g,20,26,5.6); R(g,-3,22,6,3,1,tc.m,1.1);
  R(g,-27,10,7,16,2,'#7A4A2A',1.4); [-25.5,-23.5,-21.5].forEach((x,i)=>{ L(g,x,10,x,5,1.3,'#EEE',true); P(g,[[x-1.2,5],[x,1.5],[x+1.2,5]],'#C9D0DC',.8); });
  tuft(g,24,28,6,51,'#5FA040'); tuft(g,-28,28,5,52,'#6FB04A');
};
B.torre_arcana=(g,tc)=>{
  shadowE(g,0,29,26,5.5,.3);
  rock(g,-12,27,8,4.6,301,'#8E8A9C',1.4); rock(g,12,27,8.5,4.8,302,'#7F7B90',1.4);
  masonry(g,-14,-9,14,29,5,303,'#A9A4BC',3);
  g.save(); g.globalAlpha=.9; for(let i=0;i<3;i++){ g.strokeStyle='#4E7A22'; g.lineWidth=1.8; g.beginPath(); g.moveTo(-12+i*3,28); g.bezierCurveTo(-16+i*2,18,-8+i*4,12,-13+i*2,2); g.stroke(); E(g,-13+i*2,2,2,2.6,'#7FB23A',0); E(g,-14+i*3,11,1.8,2.2,'#6E9A2E',0); } g.restore();
  P(g,[[-4.4,18],[-4.4,8],[0,3.5],[4.4,8],[4.4,18]],'#1E1230',1.4); glow(g,0,11,8,'#7CF0FF',.7); P(g,[[-2.6,17],[-2.6,9],[0,6.6],[2.6,9],[2.6,17]],'#8FE9FF',0);
  R(g,-18,-12.5,36,6,2.6,tc.m,1.7); R(g,-17,-8,5,4,1.2,'#6B4423',1.1); R(g,12,-8,5,4,1.2,'#6B4423',1.1);
  roof(g,0,-11,38,29,'#6A4CC9',311); E(g,0,-27,2.4,2.4,'#FFD66B',1);
  moss(g,-6,-10,16,321,true); tuft(g,14,29,5,322,'#5FA040');
};
B.muralha=(g,tc)=>{
  shadowE(g,0,28,28,5.5,.3);
  masonry(g,-24,0,24,29,3,331,'#B9B3A4',0);
  [-24,-9,5,18].forEach((x,i)=>{ stone(g,x,-12+(i%2)*1.5,12+(i%2)*2,13,340+i,'#C9C3B4'); });
  L(g,-9,6,-3,16,1,'rgba(40,30,30,.5)',true); L(g,12,10,17,22,1,'rgba(40,30,30,.5)',true);
  moss(g,-14,-1,14,351,true); moss(g,15,0,12,352,false); rock(g,26,27,5,3.4,353,'#8A8478',1.2); rock(g,-27,27,4.4,3,354,'#8A8478',1.2);
  R(g,-3.4,3,6.8,13,2,tc.m,1.3); P(g,[[-3.4,16],[0,21],[3.4,16]],tc.m,1.1); tuft(g,-22,29,6,355,'#5FA040'); tuft(g,24,29,5,356,'#6FB04A');
};
B.altar=(g,tc)=>{
  shadowE(g,0,27,30,7,.28);
  rock(g,0,23,26,7.4,361,'#CFC8B8',1.8); rock(g,0,19.5,20,5.6,362,'#E1DBCB',1.5);
  [-1,1].forEach((q,i)=>{ const x=q*19; stone(g,x-4.6,-4,9.2,24,370+i,'#D8D2C2'); R(g,x-6.2,-8,12.4,4.6,1.8,'#E7E1D2',1.4); R(g,x-6.2,18,12.4,4.4,1.8,'#E7E1D2',1.4); if(i) P(g,[[x-6,-8],[x-2,-12],[x+1,-9],[x+5,-11],[x+6,-8]],'#D8D2C2',1.2); moss(g,x,-6,10,380+i,true); });
  R(g,-22,-14,44,5.4,2.4,tc.m,1.5);
  E(g,0,12,11,5.6,'#9A9484',1.6); E(g,0,11,8.6,4,'#7FD8F2',1.2); E(g,-2,10,3,1.4,'rgba(255,255,255,.7)',0);
  [[-9,18],[8,19],[-4,21]].forEach((p,i)=>{ E(g,p[0],p[1],1.5,1.5,['#FF9ECF','#FFE066','#fff'][i],0); }); tuft(g,-25,27,5,391,'#5FA040'); tuft(g,26,27,5,392,'#6FB04A');
};
B.quartel=(g,tc)=>{
  shadowE(g,0,27,29,5.5,.3);
  g.beginPath(); g.moveTo(-25,26); g.bezierCurveTo(-20,10,-8,-4,0,-14); g.bezierCurveTo(8,-4,20,10,25,26); g.quadraticCurveTo(0,31,-25,26); g.closePath();
  g.fillStyle=vgrad(g,-14,28,tc.m); g.fill(); g.save(); g.clip();
  g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-26,-15,16,45); g.fillStyle='rgba(20,5,40,.16)'; g.fillRect(12,-15,16,45);
  g.strokeStyle='rgba(25,10,40,.4)'; g.lineWidth=1.2; [[-14,26,-5,2],[-6,28,-2,-4],[6,28,3,-4],[15,26,7,2]].forEach(q=>{ g.beginPath(); g.moveTo(q[0],q[1]); g.quadraticCurveTo((q[0]+q[2])/2+3,(q[1]+q[3])/2,q[2],q[3]); g.stroke(); });
  P(g,[[-7,26],[-1.6,6],[0,5],[1.6,6],[8,26]],'#2A1A3D',0); P(g,[[-9,27],[-2,6],[-7,10],[-12,27]],tc.d,1.2); P(g,[[9,27],[2,6],[7,10],[12,27]],tc.d,1.2);
  R(g,-18,12,6,6,1.4,tc.d,1); g.restore();
  g.beginPath(); g.moveTo(-25,26); g.bezierCurveTo(-20,10,-8,-4,0,-14); g.bezierCurveTo(8,-4,20,10,25,26); g.quadraticCurveTo(0,31,-25,26); g.closePath(); stk(g,1.9);
  tube(g,-5,-17,3,-10,2.6,2.6,'#6B4423'); tube(g,5,-17,-3,-10,2.6,2.6,'#6B4423'); tube(g,0,-18,0,-34,2.4,2,'#6B4423');
  tube(g,24,26,29,6,3,3,'#7A4A2A'); L(g,26,10,34,10,2,'#7A4A2A'); P(g,[[27,10],[33,6],[34,10]],'#C9D0DC',.9); E(g,31,16,5,5.6,tc.m,1.4); E(g,31,16,1.8,2,'#FFD66B',0);
  R(g,-33,17,8,10,2.4,'#8A5A2B',1.4); L(g,-33,20,-25,20,1,'#4A4D58',true); L(g,-33,24,-25,24,1,'#4A4D58',true); tuft(g,-30,28,5,401,'#5FA040'); tuft(g,31,28,5,402,'#6FB04A');
};
B.heart=(g,tc)=>{
  shadowE(g,0,29,40,7,.32);
  rock(g,-34,28,8,4.4,411,'#8A8478',1.4); rock(g,35,28,8.6,4.6,412,'#8A8478',1.4);
  masonry(g,-38,-3,-16,31,5,413,'#C9C3B4',2); masonry(g,16,-3,38,31,5,414,'#C9C3B4',2);
  [-27,27].forEach((x,i)=>{ roof(g,x,-3,28,33,tc.m,420+i); R(g,x-2.4,4,4.8,9,2.2,'#2A1A3D',1.1); });
  masonry(g,-21,-11,21,31,5,430,'#D9D3C4',0);
  [-21,-9,3,15].forEach((x,i)=>stone(g,x,-21,9+(i%2),11,440+i,'#E3DDCE'));
  P(g,[[-10,31],[-10,12],[-6,5],[0,2.5],[6,5],[10,12],[10,31]],'#2A1A3D',1.8);
  P(g,[[-8.4,31],[-8.4,12.6],[-5,6.6],[0,4.4],[5,6.6],[8.4,12.6],[8.4,31]],'#7A4A2A',0); for(let i=-6;i<=6;i+=3) L(g,i,6,i,31,.9,'#4A2F18',true); R(g,-8.4,15,16.8,2.4,1,'#4A4D58',.9); R(g,-8.4,24,16.8,2.4,1,'#4A4D58',.9);
  R(g,-7,-8,14,10,3,'#2A1A3D',1.4); glow(g,0,-3,7,'#FFD66B',.5); E(g,0,-2.8,2.8,3,'#FFD66B',0);
  [-14,14].forEach(x=>{ P(g,[[x-2.2,4],[x-2.2,-2],[x,-4.4],[x+2.2,-2],[x+2.2,4]],'#2A1A3D',1); E(g,x,.6,1.1,2,'#FFD66B',0); });
  moss(g,-30,0,16,451,true); moss(g,24,2,12,452,true); tuft(g,-18,31,6,453,'#5FA040'); tuft(g,19,31,6,454,'#6FB04A'); tuft(g,0,32,5,455,'#5FA040');
};
function dynStruct(g,key,tc,x,y,s,st){
  const t=st.t||0, at=st.atk||0;
  if(key==='canhao'){
    const rc=at>0?Math.sin(at*PI)*5:0, dir=st.dir<0?-1:1;
    g.save(); g.translate(0,6+rc*dir*-1); g.scale(1,dir);
    const gr=g.createLinearGradient(-8,0,8,0); gr.addColorStop(0,'#272A34'); gr.addColorStop(.35,'#9099AB'); gr.addColorStop(.6,'#5A6072'); gr.addColorStop(1,'#272A34');
    g.beginPath(); g.moveTo(-8,6); g.quadraticCurveTo(-8.4,-8,-6,-22); g.lineTo(-8.4,-27); g.lineTo(8.4,-27); g.lineTo(6,-22); g.quadraticCurveTo(8.4,-8,8,6); g.quadraticCurveTo(0,10,-8,6); g.closePath(); g.fillStyle=gr; g.fill(); stk(g,1.9);
    [[-14,1.8],[-3,2.2],[7,1.8]].forEach(p=>{ R(g,-8.6,p[0],17.2,p[1],.9,'#B8793A',1.1); });
    E(g,0,-27.2,6.2,2.6,'#101216',1.3); E(g,0,7,9,5,'#5C6070',1.7); E(g,0,7,3.2,3.2,'#B8793A',1);
    g.restore(); if(at>.5) glow(g,0,dir<0?-26:36,16,'#FFB02E',(at-.5)*2);
  } else if(key==='balista'){
    const dir=st.dir<0?-1:1, pull=at>0?1-at:.25;
    g.save(); g.scale(1,dir); g.translate(0,-2);
    const by=2-8*(1-pull);
    [-1,1].forEach(q=>{ g.beginPath(); g.moveTo(q*3,6); g.quadraticCurveTo(q*20,-4-pull*6,q*28,by); g.lineWidth=6.6; g.lineCap='round'; g.strokeStyle=OL; g.stroke(); g.lineWidth=4.2; g.strokeStyle='#6B4423'; g.stroke(); g.lineWidth=1.2; g.strokeStyle='#A26A32'; g.stroke(); });
    g.strokeStyle='#F1EAD2'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-28,by); g.lineTo(0,9+pull*6); g.lineTo(28,by); g.stroke();
    if(at<.1){ tube(g,0,8,0,-24,2.8,2.2,'#A26A32'); P(g,[[-3.6,-22],[0,-34],[3.6,-22]],'#E8EEF5',1.2); P(g,[[-2,6],[0,10],[2,6]],tc.m,.8); }
    g.restore();
  } else if(key==='torre_arcana'){
    const f=.6+.4*Math.sin(t*5)+(at>0?at:0), by=-48+Math.sin(t*5)*2;
    glow(g,0,by,18+f*6,'#7CF0FF',.55+.3*f); crystal(g,0,by+9,9,19,Math.sin(t*5)*.18,'#7CF0FF',1.3);
    for(let i=0;i<3;i++){ const q=(t/1.2566+i*.33)%1; E(g,Math.sin(i*2.2+t*5)*8,by+10-q*14,1.2,1.2,'rgba(190,250,255,'+(1-q)+')',0); }
  } else if(key==='altar'){
    const f=.5+.5*Math.sin(t*5); glow(g,0,10,26,'#8FE9FF',.28+.2*f);
    for(let i=0;i<5;i++){ const q=(t/1.2566+i*.2)%1; E(g,Math.sin(i*2.4+t*5)*8,10-q*26,1.5,1.5,'rgba(170,255,210,'+(1-q)+')',0); }
    E(g,0,9.5,7+f,2.4,'rgba(255,255,255,.45)',0);
  } else if(key==='quartel'||key==='muralha'){
    const fy=key==='quartel'?-34:-13, fx0=key==='quartel'?0:-20, y0=key==='muralha'?-14:0;
    g.save(); g.translate(fx0,fy); if(key==='muralha') L(g,0,0,0,-14,1.8,'#6B4423');
    const wv=Math.sin(t*5)*2.4, wv2=Math.sin(t*5+1)*2.4; g.beginPath(); g.moveTo(0,y0); g.bezierCurveTo(6,y0-3+wv,10,y0+3+wv2,18,y0+1+wv); g.lineTo(18,y0+9+wv); g.bezierCurveTo(10,y0+11+wv2,6,y0+5+wv,0,y0+8); g.closePath(); g.fillStyle=tc.m; g.fill(); stk(g,1.3); g.restore();
    if(key==='quartel'){ const fl=Math.sin(t*10)*.5; glow(g,-30,6,12,'#FFB02E',.7); flame(g,-30,10,6,12+fl*3,Math.sin(t*5)*.12,7,['#FF4A1F','#FFA21F','#FFE9A0']); }
  } else if(key==='heart'){
    [-27,27].forEach((fx0,i)=>{ g.save(); g.translate(fx0,-31); L(g,0,0,0,-15,1.8,'#6B4423'); const wv=Math.sin(t*5+i)*2.6, wv2=Math.sin(t*5+i+1)*2.6; g.beginPath(); g.moveTo(0,-15); g.bezierCurveTo(6,-18+wv,10,-12+wv2,19,-14+wv); g.lineTo(19,-6+wv); g.bezierCurveTo(10,-4+wv2,6,-10+wv,0,-7); g.closePath(); g.fillStyle=tc.l; g.fill(); stk(g,1.3); g.restore(); });
  }
}

/* ---------- armadilhas (legado) ---------- */
B.espinhos=(g)=>{ E(g,0,12,22,9,'#6F5E48',1.6); [[-12,12],[-5,8],[4,11],[11,9],[0,15],[-9,16]].forEach(p=>P(g,[[p[0]-3.6,p[1]],[p[0],p[1]-15],[p[0]+3.6,p[1]]],'#C9D3DD',1.3)); };
B.runa=(g)=>{ E(g,0,10,24,12,'rgba(155,92,255,.35)',1.4); C(g,0,10,18,8,0,6.3,'#B58CFF',2.4); C(g,0,10,10,4.6,0,6.3,'#E0CCFF',1.6); L(g,-8,10,8,10,2,'#E0CCFF',true); L(g,0,3,0,17,2,'#E0CCFF',true); };
B.selo_gelo=(g)=>{ E(g,0,10,24,12,'rgba(140,220,255,.5)',1.4); [[-10,10,-20],[0,8,-26],[10,11,-18],[-4,14,-14]].forEach(p=>P(g,[[p[0]-4,p[1]],[p[0],p[1]+p[2]],[p[0]+4,p[1]]],'#A9E6FF',1.3)); };

/* ---------- ícones dos feitiços (cartas) ---------- */
const SP={};
function spark4(g,x,y,s,col){ g.save(); g.fillStyle=col||'#fff'; g.beginPath(); g.moveTo(x,y-s); g.quadraticCurveTo(x+s*.18,y-s*.18,x+s,y); g.quadraticCurveTo(x+s*.18,y+s*.18,x,y+s); g.quadraticCurveTo(x-s*.18,y+s*.18,x-s,y); g.quadraticCurveTo(x-s*.18,y-s*.18,x,y-s); g.fill(); g.restore(); }
SP.bola_fogo=g=>{
  glow(g,0,0,38,'#FF6A1F',.6);
  [[14,-12,13,30,.75],[22,-4,11,26,1.05],[9,-22,10,24,.45],[24,-16,8,18,.9]].forEach((f,i)=>flame(g,f[0],f[1],f[2],f[3],f[4],i+3,['#E0261F','#FF8A1F','#FFE08A']));
  const gr=g.createRadialGradient(-6,2,2,-3,6,20); gr.addColorStop(0,'#FFFBE0'); gr.addColorStop(.3,'#FFD34D'); gr.addColorStop(.7,'#FF8A1F'); gr.addColorStop(1,'#D8341C');
  g.beginPath(); g.arc(-3,6,18,0,6.2832); g.fillStyle=gr; g.fill(); stk(g,2.2);
  for(let i=0;i<7;i++){ const a=2.4+i*.55; flame(g,-3+Math.cos(a)*14,6+Math.sin(a)*14,7,12,a+PI/2,20+i,['#E0261F','#FF8A1F','#FFD34D']); }
  E(g,-9,0,4.6,3.2,'rgba(255,255,255,.8)',0); [[-18,-20],[8,18],[22,10]].forEach((p,i)=>E(g,p[0],p[1],1.6,1.6,'#FFE08A',0));
};
SP.raio_arcano=g=>{
  glow(g,0,0,38,'#B58CFF',.65); E(g,0,0,27,27,'rgba(181,140,255,.28)',0);
  const pts=[[12,-33],[3,-21],[10,-14],[-3,-3],[5,2],[-9,15],[-1,18],[-9,33]];
  [[10,'rgba(160,120,255,.45)'],[6,'#B58CFF'],[3.4,'#FFE23D'],[1.4,'#fff']].forEach(s=>{ g.lineWidth=s[0]; g.strokeStyle=s[1]; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); });
  [[3,-21,-14,-26],[-3,-3,-22,-8],[5,2,20,8],[-9,15,-20,24]].forEach(b=>{ g.strokeStyle='#FFE23D'; g.lineWidth=2; g.beginPath(); g.moveTo(b[0],b[1]); g.lineTo((b[0]+b[2])/2+2,(b[1]+b[3])/2-3); g.lineTo(b[2],b[3]); g.stroke(); });
  [[-20,-14],[18,-6],[20,22],[-16,26]].forEach(p=>spark4(g,p[0],p[1],4,'#FFF6A8'));
};
SP.bencao=g=>{
  glow(g,0,0,38,'#7CFFB0',.6);
  for(let i=0;i<12;i++){ const a=i*.5236; g.strokeStyle='rgba(255,246,160,.75)'; g.lineWidth=2.4; g.lineCap='round'; g.beginPath(); g.moveTo(Math.cos(a)*22,Math.sin(a)*22); g.lineTo(Math.cos(a)*(i%2?30:36),Math.sin(a)*(i%2?30:36)); g.stroke(); }
  g.beginPath(); g.moveTo(0,22); g.bezierCurveTo(-36,0,-22,-30,0,-11); g.bezierCurveTo(22,-30,36,0,0,22); g.closePath();
  const gr=g.createRadialGradient(-8,-8,3,0,0,30); gr.addColorStop(0,'#FFE0EE'); gr.addColorStop(.5,'#FF7FB0'); gr.addColorStop(1,'#D8406E'); g.fillStyle=gr; g.fill(); stk(g,2.2);
  E(g,-10,-9,4.6,6.4,'rgba(255,255,255,.7)',0); L(g,0,-6,0,11,3.4,'#FFF6C0',true); L(g,-8,2.6,8,2.6,3.4,'#FFF6C0',true);
  [[-3,24,-14,32],[3,24,14,32]].forEach(l=>{ g.fillStyle='#5FC070'; g.beginPath(); g.moveTo(l[0],l[1]); g.quadraticCurveTo((l[0]+l[2])/2,l[1]+9,l[2],l[3]); g.quadraticCurveTo((l[0]+l[2])/2,l[1]-2,l[0],l[1]); g.fill(); stk(g,1.4); });
  [[-26,-16],[26,8],[24,-22],[-22,20]].forEach(p=>spark4(g,p[0],p[1],4.4,'#FFFFE0'));
};
SP.muralha_gelo=g=>{
  glow(g,0,2,38,'#9FE3FF',.55); E(g,0,26,28,6,'rgba(220,245,255,.65)',0);
  crystal(g,-18,26,13,32,-.3,'#8AD6F5',1.6); crystal(g,17,26,12,28,.32,'#8AD6F5',1.6); crystal(g,0,28,19,46,0,'#BFEFFF',1.8);
  crystal(g,-8,28,8,20,-.12,'#A9E6FF',1.3); crystal(g,9,28,7,17,.18,'#A9E6FF',1.3); [[-26,12],[26,6],[0,-22]].forEach(p=>spark4(g,p[0],p[1],4.4,'#fff'));
};
SP.silencio=g=>{
  glow(g,0,0,38,'#9468FF',.6); E(g,0,0,27,27,'#7B4FE0',2.2); E(g,0,0,22,22,'#9C78FF',0); C(g,0,0,22,22,0,6.3,'#D9C8FF',1.6);
  for(let i=0;i<8;i++){ const a=i*.785+.2; L(g,Math.cos(a)*23,Math.sin(a)*23,Math.cos(a)*27,Math.sin(a)*27,2.2,'#EEE0FF',true); }
  C(g,-7,0,6,9,-1.2,1.2,'#fff',3); C(g,-7,0,12,15,-1.0,1.0,'#fff',2.6); C(g,-7,0,18,21,-.8,.8,'#fff',2.2);
  P(g,[[-15,-5],[-9,-5],[-3,-10],[-3,10],[-9,5],[-15,5]],'#fff',1.4);
  L(g,-21,-21,21,21,5.6,'#FF4D4D'); L(g,-21,-21,21,21,1.6,OL,true);
};
SP.espinhos=g=>{
  glow(g,0,4,34,'#C9D3DD',.3); E(g,0,22,28,8,'#5E4A36',1.8); rock(g,-22,22,6,4,501,'#8A8478',1.3); rock(g,23,23,5,3.4,502,'#8A8478',1.3);
  [[-15,22,-24,-18,-6],[-6,22,-8,-30,2],[3,22,10,-38,8],[12,22,20,-26,12],[19,22,28,-14,6]].forEach((s,i)=>{
    g.beginPath(); g.moveTo(s[0]-5,22); g.quadraticCurveTo(s[0]-1+s[4]*.4,0,s[2],s[3]); g.quadraticCurveTo(s[0]+4+s[4]*.5,2,s[0]+5,22); g.closePath(); const gr=g.createLinearGradient(s[0]-5,0,s[0]+5,0); gr.addColorStop(0,'#fff'); gr.addColorStop(.5,'#CFD6E0'); gr.addColorStop(1,'#7C8494'); g.fillStyle=gr; g.fill(); stk(g,1.6); });
  tuft(g,-27,24,6,511,'#5FA040'); tuft(g,28,24,6,512,'#6FB04A');
};
SP.runa=g=>{
  glow(g,0,0,38,'#B58CFF',.65); E(g,0,2,28,28,'rgba(155,92,255,.35)',1.8); C(g,0,2,23,23,0,6.3,'#CDB4FF',2.6); C(g,0,2,14,14,0,6.3,'#E6D8FF',1.8);
  for(let i=0;i<9;i++){ const a=i*.698; L(g,Math.cos(a)*16,2+Math.sin(a)*16,Math.cos(a)*22,2+Math.sin(a)*22,2,'#EEE0FF',true); }
  g.strokeStyle='#F2E8FF'; g.lineWidth=2; g.lineJoin='round'; g.beginPath(); g.moveTo(0,-11); g.lineTo(10,8); g.lineTo(-10,8); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(0,15); g.lineTo(10,-3); g.lineTo(-10,-3); g.closePath(); g.stroke();
  glow(g,0,2,10,'#fff',.8); crystal(g,-26,-10,6,13,-.3,'#C9A8FF',1.2); crystal(g,26,14,6,13,.3,'#C9A8FF',1.2);
};
SP.selo_gelo=g=>{
  glow(g,0,0,38,'#9FE3FF',.6); E(g,0,2,28,28,'rgba(150,215,245,.45)',1.8); C(g,0,2,24,24,0,6.3,'#E6FBFF',2.2);
  g.strokeStyle='#F4FDFF'; g.lineWidth=2.4; g.lineCap='round'; for(let i=0;i<6;i++){ const a=i*1.0472; g.beginPath(); g.moveTo(0,2); g.lineTo(Math.cos(a)*19,2+Math.sin(a)*19); g.stroke(); for(const k of [-1,1]){ const bx=Math.cos(a)*11, by=2+Math.sin(a)*11; g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+Math.cos(a+k*.7)*7,by+Math.sin(a+k*.7)*7); g.stroke(); } }
  [[-26,14,-.4],[27,12,.4],[0,-27,0],[-20,-20,-.2],[22,-18,.25]].forEach(c=>crystal(g,c[0],c[1],6,15,c[2],'#BFEFFF',1.2));
};
SP.rede=g=>{
  glow(g,0,0,38,'#E8D9A8',.35); const R0=27;
  g.fillStyle='rgba(232,217,168,.2)'; g.beginPath(); g.arc(0,0,R0,0,6.2832); g.fill();
  g.strokeStyle='#A07A45'; g.lineWidth=1.8; g.lineCap='round';
  for(let i=0;i<9;i++){ const a=i*.698, w=(i%2?.6:-.5); g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a+.15)*R0*.55+w,Math.sin(a+.15)*R0*.55,Math.cos(a)*R0,Math.sin(a)*R0); g.stroke(); }
  for(const rr of [.3,.55,.8]){ g.beginPath(); for(let i=0;i<=9;i++){ const a=i*.698, k=rr*R0*(1+(i%2?-.06:.04)); const px=Math.cos(a)*k, py=Math.sin(a)*k; if(i) g.quadraticCurveTo(Math.cos(a-.35)*k*.92,Math.sin(a-.35)*k*.92,px,py); else g.moveTo(px,py); } g.stroke(); for(let i=0;i<9;i++){ const a=i*.698; E(g,Math.cos(a)*rr*R0,Math.sin(a)*rr*R0,1.4,1.4,'#6B4A22',0); } }
  C(g,0,0,R0,R0,0,6.3,'#6B4A22',3); for(let i=0;i<9;i++){ const a=i*.698; rock(g,Math.cos(a)*R0,Math.sin(a)*R0,3.2,3,520+i,'#6B6F7A',1.1); }
};
SP.tempestade=g=>{
  glow(g,0,0,40,'#8FB8FF',.5);
  [[-12,-14,15,10,'#6F7C98'],[12,-16,14,9,'#8794B0'],[0,-8,19,10,'#A8B4CE'],[-6,-19,11,7,'#C2CCE0']].forEach((c,i)=>E(g,c[0],c[1],c[2],c[3],c[4],1.9));
  g.strokeStyle='rgba(190,215,255,.85)'; g.lineWidth=1.8; g.lineCap='round'; [[-16,4],[-8,8],[0,5],[9,9],[16,4]].forEach(r=>{ g.beginPath(); g.moveTo(r[0],r[1]); g.lineTo(r[0]-3,r[1]+10); g.stroke(); });
  const pts=[[6,-2],[-2,8],[4,10],[-6,24],[10,6],[3,5]]; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fillStyle='#FFE23D'; g.fill(); stk(g,1.8); glow(g,0,10,16,'#FFF6A8',.6); spark4(g,-14,16,4,'#fff'); spark4(g,16,20,4,'#fff');
};

/* ---------- cache de quadros e desenho de unidades ---------- */
const FR=112, ANC={x:56,y:102};
const CACHE=new Map();
function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function drawRaw(g,key,team,a){
  resetSeed(); const tc=TC[team];
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
return {TC,OL,unit,struct,portrait,E,R,P,L,C,glow,lit,dk,mix,SP,FLYERS,lE,lR,lP,shadowE,B,CH,CR,drawRaw,dynStruct,human,resetSeed,MULTI:{golem:1}};
})();
