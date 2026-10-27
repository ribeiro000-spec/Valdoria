/* Valdoria · arte procedural 2.5D
   Motor de "bonecos" em 3D simples (esferas, membros, discos e polígonos) projetado em vista 3/4,
   com contorno de desenho animado, sombreamento e máscara da cor da equipe.
   Usado por tools/gen.js (que monta os atlas) e pode ser aberto em tools/gen.html para pré-visualização. */
'use strict';
const ART=(function(){
const PI=Math.PI, TAU=PI*2;
/* ---------- câmera ---------- */
let EL=40*PI/180, CE=Math.cos(EL), SN=Math.sin(EL);
function setEl(deg){ EL=deg*PI/180; CE=Math.cos(EL); SN=Math.sin(EL); }
const LIGHT=nrm([-.55,-.35,.75]);              // luz vinda de cima, da esquerda e da frente
const OUTC='#21132b';
let OW=2.2, PASS='color', PPU=72, AX=0, AY=0;   // contorno, passe (cor|máscara), pixels por unidade, âncora
/* ---------- vetores ---------- */
function add(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function sub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function mul(a,s){ return [a[0]*s,a[1]*s,a[2]*s]; }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function nrm(a){ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; }
function lerp(a,b,t){ return a+(b-a)*t; }
function lerp3(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }
const sm=t=>t*t*(3-2*t);
const CAMV=()=>[0,-CE,SN];
/* ---------- cores ---------- */
function rgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function hex(c){ return '#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ const x=rgb(a), y=rgb(b); return hex([lerp(x[0],y[0],t),lerp(x[1],y[1],t),lerp(x[2],y[2],t)]); }
const lt=(c,t)=>mix(c,'#ffffff',t), dk=(c,t)=>mix(c,'#1c1030',t);
const TEAMC='#eeeeee';
/* no passe de máscara: partes da equipe em branco, todo o resto em preto (mantém a oclusão) */
function col(c,team){ if(PASS==='mask') return team?'#ffffff':'#000000'; return team?TEAMC:c; }
/* ---------- projeção ---------- */
function P(w){ return [AX+w[0]*PPU, AY-(w[1]*SN+w[2]*CE)*PPU, -w[1]*CE+w[2]*SN]; }
function PV(v){ return [v[0]*PPU,-(v[1]*SN+v[2]*CE)*PPU]; }
/* ---------- cena (lista de operações ordenadas pela profundidade) ---------- */
let OPS=[];
function op(d,f){ OPS.push({d:d,i:OPS.length,f:f}); }
function flush(g){ OPS.sort((a,b)=>a.d-b.d||a.i-b.i); OPS.forEach(o=>{ g.save(); o.f(g); g.restore(); }); OPS=[]; }
/* ---------- rig: transforma coordenadas locais do personagem (x direita, y frente, z cima) ---------- */
let RIG={f:[0,-1,0],r:[-1,0,0],s:1,o:[0,0,0]};
function setRig(a,s,o){ RIG={f:[Math.cos(a),Math.sin(a),0],r:[Math.sin(a),-Math.cos(a),0],s:s,o:o||[0,0,0]}; }
function W_(l){ const R=RIG; return [R.o[0]+(l[0]*R.r[0]+l[1]*R.f[0])*R.s, R.o[1]+(l[0]*R.r[1]+l[1]*R.f[1])*R.s, R.o[2]+l[2]*R.s]; }
function WD(l){ const R=RIG; return [l[0]*R.r[0]+l[1]*R.f[0], l[0]*R.r[1]+l[1]*R.f[1], l[2]]; }
/* ---------- primitivas ---------- */
/* elipsoide alinhado ao rig (raios em unidades locais); o.rot = [eixo local, ângulo] opcional */
function ball(c,rad,color,o){
  o=o||{};
  let ax=[[1,0,0],[0,1,0],[0,0,1]];
  if(o.axes) ax=o.axes;
  const s=RIG.s, wc=W_(c), pc=P(wc);
  const u=PV(mul(WD(ax[0]),rad[0]*s)), v=PV(mul(WD(ax[1]),rad[1]*s)), w=PV(mul(WD(ax[2]),rad[2]*s));
  const a=u[0]*u[0]+v[0]*v[0]+w[0]*w[0], b=u[0]*u[1]+v[0]*v[1]+w[0]*w[1], d=u[1]*u[1]+v[1]*v[1]+w[1]*w[1];
  const tr=a+d, det=a*d-b*b, disc=Math.sqrt(Math.max(0,tr*tr/4-det));
  const l1=tr/2+disc, l2=Math.max(1e-6,tr/2-disc), th=Math.abs(b)<1e-9?(a>=d?0:PI/2):Math.atan2(l1-a,b);
  const s1=Math.sqrt(l1), s2=Math.sqrt(l2);
  const fill=col(color,o.team), gl=o.glow, dd=o.dc?P(W_(o.dc))[2]:pc[2];
  op(dd+(o.bias||0),g=>{
    g.translate(pc[0],pc[1]); g.rotate(th); g.scale(s1,s2);
    g.beginPath(); g.arc(0,0,1,0,TAU);
    if(PASS==='mask'||o.flat){ g.fillStyle=fill; }
    else {
      const Ls=[-.42,-.62], c0=Math.cos(-th), s0=Math.sin(-th);
      const qx=(Ls[0]*c0-Ls[1]*s0)*.45*Math.min(1,(s1+s2)/(2*s1)), qy=(Ls[0]*s0+Ls[1]*c0)*.45*Math.min(1,(s1+s2)/(2*s2));
      const gr=g.createRadialGradient(qx,qy,0,qx*.3,qy*.3,1.25);
      const base=fill;
      gr.addColorStop(0,lt(base,o.hl==null?.38:o.hl)); gr.addColorStop(.42,base); gr.addColorStop(.85,dk(base,o.sh==null?.32:o.sh)); gr.addColorStop(1,dk(base,.45));
      g.fillStyle=gr;
    }
    g.fill();
    g.setTransform(1,0,0,1,0,0);
    if(!o.noOut&&OW>0){ g.lineWidth=o.ow||OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(gl&&PASS==='color'){ glowAt(g,pc[0],pc[1],Math.max(s1,s2)*gl.r,gl.c,gl.a); }
  });
  return pc;
}
/* membro (cápsula afunilada) entre dois pontos locais */
function limb(p1,p2,r1,r2,color,o){
  o=o||{};
  const a=P(W_(p1)), b=P(W_(p2)), s=RIG.s*PPU, ra=r1*s, rb=r2*s;
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1e-3, nx=-dy/L, ny=dx/L, an=Math.atan2(ny,nx);
  const fill=col(color,o.team);
  op((a[2]+b[2])/2+(o.bias||0),g=>{
    g.beginPath();
    g.arc(a[0],a[1],ra,an,an+PI); g.arc(b[0],b[1],rb,an+PI,an+TAU); g.closePath();
    if(PASS==='mask'||o.flat) g.fillStyle=fill;
    else { const side=(nx*-.5+ny*-.8)>0?1:-1; const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2, rr=Math.max(ra,rb);
      const gr=g.createLinearGradient(mx+nx*rr*side,my+ny*rr*side,mx-nx*rr*side,my-ny*rr*side);
      gr.addColorStop(0,lt(fill,.3)); gr.addColorStop(.45,fill); gr.addColorStop(1,dk(fill,.38)); g.fillStyle=gr; }
    g.fill();
    if(!o.noOut&&OW>0){ g.lineWidth=o.ow||OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.lineJoin='round'; g.stroke(); }
  });
}
/* polígono 3D (pontos locais) com sombreamento pela normal */
function poly(pts,color,o){
  o=o||{};
  const wp=pts.map(W_), pp=wp.map(P);
  let n=nrm(cross(sub(wp[1],wp[0]),sub(wp[2],wp[0])));
  const lit=Math.abs(dot(n,LIGHT)), fill=col(color,o.team);
  const shade=PASS==='mask'||o.flat?fill:(lit>.55?lt(fill,(lit-.55)*.6):dk(fill,(.55-lit)*.55));
  const d=pp.reduce((s,p)=>s+p[2],0)/pp.length;
  op(d+(o.bias||0),g=>{
    g.beginPath(); pp.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); if(!o.open) g.closePath();
    if(!o.open){ g.fillStyle=shade; g.fill(); }
    if(!o.noOut&&OW>0){ g.lineWidth=o.ow||OW; g.lineJoin='round'; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(o.after&&PASS==='color') o.after(g,pp);
  });
  return pp;
}
/* disco (escudo, roda, moeda): centro, normal local, raio; o.th = espessura */
function disc(c,nl,R,color,o){
  o=o||{};
  const nw=nrm(WD(nl)); let e1=cross(nw,[0,0,1]); if(Math.hypot(...e1)<.1) e1=[1,0,0]; e1=nrm(e1); const e2=nrm(cross(nw,e1));
  const s=RIG.s;
  const ell=(cw,rr)=>{ const pc=P(cw), u=PV(mul(e1,rr*s)), v=PV(mul(e2,rr*s));
    const a=u[0]*u[0]+v[0]*v[0], b=u[0]*u[1]+v[0]*v[1], d=u[1]*u[1]+v[1]*v[1];
    const tr=a+d, det=a*d-b*b, ds=Math.sqrt(Math.max(0,tr*tr/4-det)), l1=tr/2+ds, l2=Math.max(1e-6,tr/2-ds);
    const th=Math.abs(b)<1e-9?(a>=d?0:PI/2):Math.atan2(l1-a,b); return {x:pc[0],y:pc[1],d:pc[2],th:th,s1:Math.sqrt(l1),s2:Math.max(.6,Math.sqrt(l2))}; };
  const cw=W_(c), front=ell(cw,R), facing=dot(nw,CAMV());
  const fill=col(color,o.team), rimC=col(o.rim||dk(color,.35),o.rimTeam);
  if(o.th){
    const back=ell(add(cw,mul(nw,-o.th*s*(facing>=0?1:-1))),R);
    op(front.d-.001+(o.bias||0),g=>{ const E=back; g.beginPath(); g.ellipse(E.x,E.y,E.s1,E.s2,E.th,0,TAU); g.fillStyle=rimC; g.fill(); if(OW>0){ g.lineWidth=OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
      g.beginPath(); g.moveTo(front.x,front.y); g.lineTo(E.x,E.y); g.lineWidth=Math.max(E.s1,E.s2)*2; g.strokeStyle=rimC; g.stroke(); });
  }
  op(front.d+(o.bias||0),g=>{
    const E=front; g.beginPath(); g.ellipse(E.x,E.y,E.s1,E.s2,E.th,0,TAU);
    if(PASS==='mask'||o.flat) g.fillStyle=fill;
    else { const lit=Math.abs(dot(nw,LIGHT)); const base=lit>.5?lt(fill,(lit-.5)*.5):dk(fill,(.5-lit)*.5);
      const gr=g.createLinearGradient(E.x-E.s1,E.y-E.s1,E.x+E.s1,E.y+E.s1); gr.addColorStop(0,lt(base,.25)); gr.addColorStop(1,dk(base,.25)); g.fillStyle=gr; }
    g.fill();
    if(OW>0&&!o.noOut){ g.lineWidth=o.ow||OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(o.after&&PASS==='color') o.after(g,E,facing);
  });
  return front;
}
/* lâmina / faixa sempre virada para a câmera: de p1 a p2, largura w1→w2 */
function blade(p1,p2,w1,w2,color,o){
  o=o||{};
  const a=W_(p1), b=W_(p2), dir=nrm(sub(b,a)), side=nrm(cross(dir,CAMV())), s=RIG.s;
  const pts=[add(a,mul(side,w1*s)),add(b,mul(side,w2*s)),add(b,mul(side,-w2*s)),add(a,mul(side,-w1*s))].map(P);
  if(o.tip){ const t=P(add(b,mul(dir,o.tip*s))); pts.splice(2,0,t); }
  const fill=col(color,o.team), d=(P(a)[2]+P(b)[2])/2;
  op(d+(o.bias||0),g=>{
    g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath();
    if(PASS==='mask'||o.flat) g.fillStyle=fill;
    else { const gr=g.createLinearGradient(pts[0][0],pts[0][1],pts[pts.length-1][0],pts[pts.length-1][1]); gr.addColorStop(0,lt(fill,.45)); gr.addColorStop(.5,fill); gr.addColorStop(1,dk(fill,.25)); g.fillStyle=gr; }
    g.fill(); if(OW>0&&!o.noOut){ g.lineWidth=o.ow||OW; g.lineJoin='round'; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
  });
}

/* cilindro vertical (torres, bases): centro da base local c, raio r, altura h */
function cyl(c,r,h,color,o){
  o=o||{};
  const s=RIG.s, b=P(W_(c)), tp=P(W_(add(c,[0,0,h]))), rx=r*s*PPU, ry=r*s*PPU*SN, fill=col(color,o.team), topC=col(o.top||lt(color,.12),o.topTeam!=null?o.topTeam:o.team);
  op(b[2]+(o.bias||0)+(o.dz||0),g=>{
    g.beginPath(); g.moveTo(b[0]-rx,b[1]); g.lineTo(tp[0]-rx,tp[1]); g.ellipse(tp[0],tp[1],rx,ry,0,PI,0,true); g.lineTo(b[0]+rx,b[1]); g.ellipse(b[0],b[1],rx,ry,0,0,PI); g.closePath();
    if(PASS==='mask'||o.flat) g.fillStyle=fill; else { const gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0); gr.addColorStop(0,lt(fill,.18)); gr.addColorStop(.35,lt(fill,.05)); gr.addColorStop(1,dk(fill,.38)); g.fillStyle=gr; }
    g.fill(); if(OW>0){ g.lineWidth=OW; g.lineJoin='round'; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(o.bands&&PASS==='color'){ g.strokeStyle='rgba(30,15,40,.28)'; g.lineWidth=1.2; for(let i=1;i<o.bands;i++){ const y=b[1]+(tp[1]-b[1])*i/o.bands; g.beginPath(); g.ellipse(b[0],y,rx,ry,0,.15,PI-.15); g.stroke(); }
      for(let i=0;i<o.bands;i++){ const y0=b[1]+(tp[1]-b[1])*i/o.bands, y1=b[1]+(tp[1]-b[1])*(i+1)/o.bands; for(let k=0;k<3;k++){ const a=((k+(i%2)*.5)/3)*PI+.35; if(a>PI-.2) continue; const x=b[0]+Math.cos(PI-a)*rx; g.beginPath(); g.moveTo(x,y0+Math.sin(a)*ry); g.lineTo(x,y1+Math.sin(a)*ry); g.stroke(); } } }
    g.beginPath(); g.ellipse(tp[0],tp[1],rx,ry,0,0,TAU);
    if(PASS==='mask'||o.flat) g.fillStyle=topC; else { const gr=g.createLinearGradient(tp[0]-rx,tp[1]-ry,tp[0]+rx,tp[1]+ry); gr.addColorStop(0,lt(topC,.2)); gr.addColorStop(1,dk(topC,.12)); g.fillStyle=gr; }
    g.fill(); if(OW>0){ g.lineWidth=OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(o.afterTop&&PASS==='color') o.afterTop(g,tp[0],tp[1],rx,ry);
  });
}
/* cone vertical (telhados): base local c, raio r, altura h */
function cone(c,r,h,color,o){
  o=o||{};
  const s=RIG.s, b=P(W_(c)), tp=P(W_(add(c,[0,0,h]))), rx=r*s*PPU, ry=r*s*PPU*SN, fill=col(color,o.team);
  op(b[2]+(o.bias||0)+.01,g=>{
    g.beginPath(); g.moveTo(b[0]-rx,b[1]); g.lineTo(tp[0],tp[1]); g.lineTo(b[0]+rx,b[1]); g.ellipse(b[0],b[1],rx,ry,0,0,PI); g.closePath();
    if(PASS==='mask'||o.flat) g.fillStyle=fill; else { const gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0); gr.addColorStop(0,lt(fill,.28)); gr.addColorStop(.4,fill); gr.addColorStop(1,dk(fill,.4)); g.fillStyle=gr; }
    g.fill(); if(OW>0){ g.lineWidth=OW; g.lineJoin='round'; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    if(o.tiles&&PASS==='color'){ g.strokeStyle='rgba(30,15,40,.25)'; g.lineWidth=1.1; for(let i=1;i<4;i++){ const k=i/4, y=b[1]+(tp[1]-b[1])*k, w=rx*(1-k); g.beginPath(); g.ellipse(tp[0]+(b[0]-tp[0])*(1-k),y+ry*(1-k)*.0,w,ry*(1-k),0,.1,PI-.1); g.stroke(); } }
  });
}
/* caixa alinhada ao rig: centro da base c, tamanho [sx,sy,sz] */
function box(c,sz,color,o){
  o=o||{};
  const hx=sz[0]/2, hy=sz[1]/2, h=sz[2];
  const V8=[[-hx,-hy,0],[hx,-hy,0],[hx,hy,0],[-hx,hy,0],[-hx,-hy,h],[hx,-hy,h],[hx,hy,h],[-hx,hy,h]].map(v=>add(c,v));
  const F=[[[0,1,5,4],[0,-1,0]],[[1,2,6,5],[1,0,0]],[[2,3,7,6],[0,1,0]],[[3,0,4,7],[-1,0,0]],[[4,5,6,7],[0,0,1]]];
  const pp=V8.map(v=>P(W_(v))), cam=CAMV(), cen=P(W_(add(c,[0,0,h/2])));
  const faces=F.map(f=>{ const n=nrm(WD(f[1])); return {idx:f[0],n:n,vis:dot(n,cam)>1e-3,lit:dot(n,LIGHT)}; }).filter(f=>f.vis);
  const fill=col(color,o.team), topC=o.top?col(o.top,o.topTeam):fill;
  op(cen[2]+(o.bias||0),g=>{
    faces.forEach(f=>{ g.beginPath(); f.idx.forEach((i,k)=>k?g.lineTo(pp[i][0],pp[i][1]):g.moveTo(pp[i][0],pp[i][1])); g.closePath();
      const base=f.n[2]>.9?topC:fill;
      g.fillStyle=PASS==='mask'||o.flat?base:(f.lit>.3?lt(base,(f.lit-.3)*.35):dk(base,(.3-f.lit)*.45)); g.fill();
      if(OW>0){ g.lineWidth=o.ow||OW; g.lineJoin='round'; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
      if(o.bricks&&PASS==='color'&&f.n[2]<.9){ const q=f.idx.map(i=>pp[i]); g.save(); g.clip(); g.strokeStyle='rgba(30,15,40,.25)'; g.lineWidth=1.1; const rows=o.bricks; for(let r=1;r<rows;r++){ const k=r/rows; const a=lerp3([...q[0],0],[...q[3],0],k), b2=lerp3([...q[1],0],[...q[2],0],k); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b2[0],b2[1]); g.stroke(); }
        for(let r=0;r<rows;r++){ const k0=r/rows,k1=(r+1)/rows; const cols=Math.max(2,Math.round(Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1])/(PPU*.16))); for(let cI=1;cI<cols;cI++){ const u=(cI+(r%2)*.5)/cols; if(u>=1) continue; const a=lerp3(lerp3([...q[0],0],[...q[1],0],u),lerp3([...q[3],0],[...q[2],0],u),k0), b2=lerp3(lerp3([...q[0],0],[...q[1],0],u),lerp3([...q[3],0],[...q[2],0],u),k1); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b2[0],b2[1]); g.stroke(); } } g.restore(); }
      if(o.after&&PASS==='color') o.after(g,f,f.idx.map(i=>pp[i]));
    });
  });
}
/* curva aberta (corda, arco, chicote) */
function curve(pts,w,color,o){
  o=o||{};
  const pp=pts.map(p=>P(W_(p))), d=pp.reduce((s,p)=>s+p[2],0)/pp.length, fill=col(color,o.team);
  op(d+(o.bias||0),g=>{
    g.lineCap='round'; g.lineJoin='round';
    const path=()=>{ g.beginPath(); pp.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); };
    if(!o.noOut&&OW>0){ path(); g.lineWidth=w*RIG.s*PPU+OW*2; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke(); }
    path(); g.lineWidth=w*RIG.s*PPU; g.strokeStyle=fill; g.stroke();
  });
}
/* operação livre em um ponto (olhos, brilhos) */
function at(l,bias,fn){ const p=P(W_(l)); op(p[2]+(bias||0),g=>fn(g,p[0],p[1],RIG.s*PPU)); return p; }
function glowAt(g,x,y,r,c,a){ if(PASS==='mask') return; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,c); gr.addColorStop(1,'rgba(255,255,255,0)'); g.save(); g.globalAlpha=a==null?.8:a; g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.restore(); }
function glow(l,r,c,a,bias){ at(l,bias==null?.5:bias,(g,x,y,s)=>glowAt(g,x,y,r*s,c,a)); }
/* olhos sobre a superfície de uma esfera (cabeça) */
function eyes(hc,hr,o){
  o=o||{};
  const sp=o.sp||.36, up=o.up||.02;
  [-1,1].forEach(sd=>{
    const dl=nrm([sd*sp,.9,up]), pl=add(hc,mul(dl,hr*.97)), facing=dot(nrm(WD(dl)),CAMV());
    if(facing<.12) return;
    at(pl,.02,(g,x,y,s)=>{
      if(PASS==='mask'){ g.fillStyle='#000'; g.beginPath(); g.ellipse(x,y,hr*s*.1,hr*s*.15,0,0,TAU); g.fill(); return; }
      const k=Math.min(1,facing*1.4), rx=hr*s*(o.big||.12)*k, ry=hr*s*(o.big||.12)*1.35;
      if(o.glow){ glowAt(g,x,y,ry*3,o.glow,.9); g.fillStyle=lt(o.glow,.6); g.beginPath(); g.ellipse(x,y,rx,ry*.8,0,0,TAU); g.fill(); return; }
      if(o.white){ g.fillStyle='#fff'; g.beginPath(); g.ellipse(x,y,rx*1.5,ry*1.15,0,0,TAU); g.fill(); g.lineWidth=1; g.strokeStyle=OUTC; g.stroke(); }
      g.fillStyle=o.c||'#1d1228'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill();
      g.fillStyle='#fff'; g.beginPath(); g.arc(x-rx*.3,y-ry*.4,Math.max(.7,rx*.45),0,TAU); g.fill();
      if(o.brow){ g.strokeStyle=OUTC; g.lineWidth=1.6; g.beginPath(); g.moveTo(x-rx*2*sd*-1-rx*1.6,y-ry*1.6-(o.brow*sd*rx)); g.lineTo(x+rx*1.6,y-ry*1.6+(o.brow*sd*rx)); g.stroke(); }
    });
  });
  if(o.mouth){ const dl=nrm([0,.95,-.32]), pl=add(hc,mul(dl,hr*.98)), facing=dot(nrm(WD(dl)),CAMV());
    if(facing>.2) at(pl,.02,(g,x,y,s)=>{ if(PASS==='mask') return; g.strokeStyle=OUTC; g.lineWidth=1.4; g.beginPath(); if(o.mouth==='open'){ g.fillStyle='#5a1a22'; g.ellipse(x,y,hr*s*.1,hr*s*.08,0,0,TAU); g.fill(); g.stroke(); } else { g.arc(x,y-hr*s*.08,hr*s*.12,.5,PI-.5); g.stroke(); } }); }
}
/* ==========================================================================
   HUMANOIDES
   ========================================================================== */
/* pose: anim = 'idle'|'walk'|'atk', t∈[0,1) */
function humanoid(S,anim,t){
  const sc=S.scale||1;
  let bob=0, lean=0, step=0, lift=[0,0], swing=0, twist=0;
  if(anim==='walk'){ const s=Math.sin(t*TAU); step=s; bob=Math.abs(Math.cos(t*TAU))*.035; lift=[Math.max(0,-Math.sin(t*TAU))*.07,Math.max(0,Math.sin(t*TAU))*.07]; swing=s; lean=.06; }
  else if(anim==='idle'){ bob=Math.sin(t*TAU)*.012; }
  const A=attackPose(S,anim,t);
  lean+=A.lean||0; twist=A.twist||0;
  const hipZ=.30+bob, legLen=S.short?.22:.28, hipW=S.wide?.12:.095;
  const root=[0,0,0];
  const Lf=[-hipW-.01, step*.13+(A.stepL||0), lift[0]], Rf=[hipW+.01, -step*.13+(A.stepR||0), lift[1]];
  const hipL=[-hipW,lean*.3,hipZ], hipR=[hipW,lean*.3,hipZ];
  const chest=[0,lean*.9+(A.chestY||0),.47+bob+(A.chestZ||0)];
  const shL=[-.2,chest[1]-twist*.08,.56+bob], shR=[.2,chest[1]+twist*.08,.56+bob];
  const headC=[0,chest[1]+lean*.6+(A.headY||0),.83+bob+(A.headZ||0)], hr=S.headR||.26;
  let hR=A.hR||[.25,.07+swing*-.09,.36+bob], hL=A.hL||[-.25,.07+swing*.09,.36+bob];
  /* pernas */
  const legC=S.legs||'#3d3550', bootC=S.boots||'#4a2f22';
  if(!S.robe){
    limb(hipL,add(Lf,[0,0,.07]),.07,.06,legC,{team:S.legsTeam});
    limb(hipR,add(Rf,[0,0,.07]),.07,.06,legC,{team:S.legsTeam});
  }
  ball(add(Lf,[0,.03,.05]),[.075,.11,.065],bootC,{bias:-.01});
  ball(add(Rf,[0,.03,.05]),[.075,.11,.065],bootC,{bias:-.01});
  /* tronco */
  if(S.robe){ ball([0,lean*.4,.24+bob*.5],[.21,.18,.25],S.robe,{team:S.robeTeam,sh:.4}); }
  ball(chest,[.2,.15,.18],S.body||'#7a6a8a',{team:S.bodyTeam});
  if(S.belt) ball([0,chest[1]*.9,.36+bob],[.195,.148,.04],S.belt,{bias:.01,sh:.2});
  if(S.tabard) poly([[-.1,chest[1]+.14,.58+bob],[.1,chest[1]+.14,.58+bob],[.08,chest[1]+.12,.22+bob],[0,chest[1]+.12,.17+bob],[-.08,chest[1]+.12,.22+bob]],S.tabard,{team:true,bias:.02});
  if(S.cape) poly([[-.17,chest[1]-.12,.62+bob],[.17,chest[1]-.12,.62+bob],[.24,chest[1]-.22-swing*.02-(anim==='walk'?.06:0),.12],[-.24,chest[1]-.22+swing*.02-(anim==='walk'?.06:0),.12]],S.cape,{team:S.capeTeam,bias:-.05});
  if(S.pack) ball([0,chest[1]-.17,.5+bob],[.15,.09,.15],S.pack,{sh:.35});
  /* braços */
  const armC=S.arms||S.body||'#7a6a8a', handC=S.hands||S.skin||'#f2c29a';
  const arm=(sh,h,side)=>{ limb(sh,h,.065,.055,armC,{team:S.armsTeam}); ball(sh,[.085,.085,.085],S.pads||armC,{team:S.padsTeam,bias:.005}); ball(h,[.062,.062,.062],handC,{bias:.01}); };
  arm(shL,hL,-1); arm(shR,hR,1);
  /* cabeça */
  headgear(S,headC,hr,anim,t,A);
  /* armas */
  weapons(S,A,hR,hL,chest,anim,t,bob);
  if(S.extra) S.extra({headC,hr,chest,hR,hL,bob,anim,t,A,Lf,Rf});
}
function attackPose(S,anim,t){
  const W=S.weapon;
  if(anim!=='atk'){
    if(W==='bow') return {hL:[-.08,.3,.5],hR:[.14,.16,.48]};
    if(W==='staff') return {hR:[.27,.12,.42]};
    if(W==='axe') return {hR:[.16,.18,.38],hL:[-.02,.2,.34]};
    if(W==='spear') return {hR:[.2,.08,.4],hL:[-.12,.22,.44]};
    if(W==='lute') return {hR:[.12,.2,.38],hL:[-.22,.18,.48]};
    if(W==='sword') return {hR:[.25,.14,.4]};
    if(W==='hammer') return {hR:[.25,.12,.4]};
    if(W==='bomb') return {hR:[.24,.14,.42],hL:[-.24,.08,.4]};
    if(W==='daggers') return {hR:[.24,.16,.4],hL:[-.24,.16,.4]};
    if(W==='fists') return {hR:[.3,.14,.36],hL:[-.3,.14,.36]};
    return {};
  }
  /* t∈[0,.5) preparo; [.5,1) golpe */
  const w=t<.5?sm(t/.5):1, k=t<.5?0:sm((t-.5)/.5);
  const L=(a,b,c)=>lerp3(lerp3(a,b,w),c,k);
  switch(W){
    case 'sword': case 'hammer': return {hR:L([.25,.14,.4],[.22,-.08,.8],[.02,.34,.3]),lean:-.04*w+.12*k,twist:w-2*k,stepR:.08*k,
      bd:L([.1,.4,1],[0,-.8,.6],[-.5,.85,-.35])};
    case 'axe': return {hR:L([.16,.18,.38],[.08,-.02,.95],[.05,.4,.28]),hL:L([-.02,.2,.34],[-.04,-.02,.9],[-.02,.42,.24]),lean:-.08*w+.18*k,bd:L([.2,.5,.8],[0,-.55,.85],[0,.8,-.6]),stepR:.1*k};
    case 'daggers': { const a=Math.sin(t*TAU*2); return {hR:[.2,.16+Math.max(0,a)*.28,.42],hL:[-.2,.16+Math.max(0,-a)*.28,.42],lean:.1}; }
    case 'bow': return {hL:[-.06,.34,.52],hR:L([.14,.16,.48],[.12,-.12,.54],[.2,-.2,.56]),draw:t<.5?w:1-k,rel:k};
    case 'staff': return {hR:L([.27,.12,.42],[.25,.0,.62],[.2,.34,.62]),lean:.1*k,cast:k,charge:w};
    case 'spear': return {hR:L([.2,.08,.4],[.2,-.12,.44],[.2,.42,.46]),hL:L([-.12,.22,.44],[-.12,.04,.46],[-.1,.6,.48]),lean:.15*k-.05*w,stepR:.12*k};
    case 'lute': return {hR:[.12,.2,.38+Math.sin(t*TAU*3)*.05],hL:[-.22,.18,.48],headZ:Math.sin(t*TAU)*.02};
    case 'bomb': return {hR:L([.24,.14,.42],[.24,-.18,.82],[.18,.4,.55]),lean:-.05*w+.14*k,throwK:k};
    case 'fists': return {hR:L([.3,.14,.36],[.32,-.05,.75],[.22,.42,.2]),hL:L([-.3,.14,.36],[-.32,-.05,.75],[-.22,.42,.2]),lean:-.06*w+.2*k};
  }
  return {};
}
function headgear(S,c,r,anim,t,A){
  const H=S.head||'bare', skin=S.skin||'#f2c29a';
  if(H==='skull'){
    ball(c,[r,r*.92,r*.9],'#ecebdc');
    ball(add(c,[0,r*.45,-r*.55]),[r*.55,r*.4,r*.28],'#dcdac6',{bias:.01});
    eyes(c,r,{glow:S.eyeGlow||'#8dff9a',sp:.4,up:.05,big:.16});
    return;
  }
  if(H==='golem'){ ball(c,[r*1.1,r,r*.85],S.body,{}); eyes(c,r,{glow:'#ffe680',sp:.33,big:.11}); return; }
  if(H==='hood'){
    ball(add(c,[0,-.02,.0]),[r*1.12,r*1.12,r*1.08],S.hood,{team:S.hoodTeam});
    ball(add(c,[0,r*.35,-.02]),[r*.72,r*.6,r*.78],S.face||'#2a1f36',{bias:.02,sh:.2});
    eyes(add(c,[0,r*.3,-.02]),r*.72,{glow:S.eyeGlow||'#7dff8a',sp:.38,big:.14});
    poly([[0,-r*.2,c[2]+r*.9],[r*.35,-r*.4,c[2]+r*.4],[-r*.35,-r*.4,c[2]+r*.4]],S.hood,{team:S.hoodTeam,bias:-.03});
    return;
  }
  // cabeça comum
  if(S.hair) ball(add(c,[0,-r*.18,r*.12]),[r*1.04,r*.95,r*.92],S.hair,{dc:add(c,[0,-r*.6,0])});
  ball(c,[r,r*.95,r*.95],skin);
  if(S.ears) [-1,1].forEach(sd=>ball(add(c,[sd*r*.98,0,0]),[r*.14,r*.1,r*.2],skin,{bias:-.01}));
  eyes(c,r,{sp:.34,up:.0,brow:S.brow,mouth:S.mouth,white:S.whiteEyes});
  if(S.beard){ ball(add(c,[0,r*.5,-r*.55]),[r*.8,r*.5,r*.55],S.beard,{bias:.03}); ball(add(c,[0,r*.85,-r*.15]),[r*.3,r*.15,r*.12],S.beard,{bias:.04}); }
  if(S.nose) ball(add(c,[0,r*.97,-r*.1]),[r*.13,r*.1,r*.12],dk(skin,.08),{bias:.03,ow:1.2});
  switch(H){
    case 'helmet': {
      ball(add(c,[0,-r*.14,r*.16]),[r*1.1,r*1.06,r*1.0],S.metal||'#c9d0da',{hl:.55,dc:add(c,[0,-r*.7,0])});
      limb(add(c,[0,r*.75,r*.75]),add(c,[0,r*1.0,r*.05]),r*.1,r*.08,S.metal||'#c9d0da',{bias:.03});
      [-1,1].forEach(sd=>ball(add(c,[sd*r*.85,r*.15,-r*.1]),[r*.22,r*.35,r*.42],S.metal||'#c9d0da',{bias:.002}));
      [[0,-.02,1.2],[0,-.32,1.1],[0,-.6,.88]].forEach((q,i)=>ball(add(c,[0,r*q[1],r*q[2]]),[r*.18,r*.32,r*.22],S.plume||'#e33',{team:true,bias:.002*i}));
      break; }
    case 'horned': {
      ball(add(c,[0,-.005,.04]),[r*1.08,r*1.06,r*.98],S.metal||'#8b7a68',{hl:.4});
      [-1,1].forEach(sd=>{ limb(add(c,[sd*r*.85,0,r*.35]),add(c,[sd*r*1.35,r*.1,r*.95]),r*.18,r*.06,'#efe6cf'); });
      eyes(c,r,{sp:.34,brow:2,mouth:'open'});
      break; }
    case 'wizard': {
      const tip=add(c,[0,-r*.5,r*2.7+(anim==='walk'?Math.sin(t*TAU)*.03:0)]);
      disc(add(c,[0,-r*.05,r*.74]),[0,-.15,1],r*1.3,S.hatC||'#4b3aa8',{team:S.hatTeam,th:.02,bias:.004});
      const base=P(W_(add(c,[0,-r*.05,r*.8]))), tp=P(W_(tip)), w=r*.8*RIG.s*PPU, fill=col(S.hatC||'#4b3aa8',S.hatTeam);
      op(base[2]+.02,g=>{ g.beginPath(); g.moveTo(base[0]-w,base[1]); g.quadraticCurveTo(base[0]-w*.4,base[1]-w*.8,tp[0],tp[1]); g.quadraticCurveTo(base[0]+w*.5,base[1]-w*.7,base[0]+w,base[1]); g.closePath();
        if(PASS==='mask') g.fillStyle=fill; else { const gr=g.createLinearGradient(base[0]-w,0,base[0]+w,0); gr.addColorStop(0,lt(fill,.25)); gr.addColorStop(1,dk(fill,.35)); g.fillStyle=gr; }
        g.fill(); g.lineWidth=OW; g.strokeStyle=PASS==='mask'?'#000':OUTC; g.stroke();
        if(PASS==='color'&&S.stars){ g.fillStyle='#ffe066'; [[-.3,-.3],[.2,-.6],[-.05,-1]].forEach(q=>{ g.beginPath(); g.arc(base[0]+q[0]*w,base[1]+q[1]*w,1.6,0,TAU); g.fill(); }); } });
      if(S.beard){ /* já desenhada */ }
      break; }
    case 'feather': {
      disc(add(c,[0,0,r*.6]),[0,.15,1],r*1.25,S.hatC||'#3a7a3a',{team:S.hatTeam,th:.03,bias:.003});
      ball(add(c,[0,-.01,r*.72]),[r*.8,r*.8,r*.45],S.hatC||'#3a7a3a',{team:S.hatTeam,bias:.006});
      blade(add(c,[r*.4,-r*.2,r*.8]),add(c,[r*.9,-r*.8,r*1.7]),.035,.01,S.feather||'#ff5a3a',{bias:.008});
      break; }
    case 'mitre': {
      const base=add(c,[0,-.01,r*.55]);
      poly([add(base,[-r*.6,0,0]),add(base,[-r*.45,0,r*1.1]),add(base,[0,0,r*1.45]),add(base,[r*.45,0,r*1.1]),add(base,[r*.6,0,0])],'#f4f0e4',{bias:.01});
      blade(add(base,[0,.01,0]),add(base,[0,.01,r*1.3]),.035,.035,'#e7b93a',{bias:.015,noOut:true});
      // auréola
      at(add(c,[0,-r*.3,r*1.6]),-.2,(g,x,y,s)=>{ if(PASS==='mask') return; glowAt(g,x,y,r*s*1.4,'#fff2a8',.5); g.strokeStyle='#ffe27a'; g.lineWidth=2.4; g.beginPath(); g.ellipse(x,y,r*s*.75,r*s*.22,0,0,TAU); g.stroke(); });
      break; }
    case 'leaves': {
      for(let i=0;i<7;i++){ const a=i/7*TAU; ball(add(c,[Math.cos(a)*r*.95,Math.sin(a)*r*.9,r*.55]),[r*.22,r*.22,r*.1],i%2?'#5fbf4a':'#3f9a3a',{bias:.003}); }
      ball(add(c,[0,-.02,r*.35]),[r*1.02,r*.98,r*.8],S.hair||'#7a4a2a',{bias:-.003});
      break; }
    case 'goggles': {
      ball(add(c,[0,-.01,r*.5]),[r*1.03,r*1,r*.6],S.capC||'#d9a13a',{team:S.capTeam,bias:.004});
      const dl=[0,1,.25];
      [-1,1].forEach(sd=>{ const d2=nrm([sd*.35,1,.25]); const f=dot(nrm(WD(d2)),CAMV()); if(f>.1) at(add(c,mul(d2,r*1.02)),.04,(g,x,y,s)=>{ if(PASS==='mask') return; g.fillStyle='#7a5a3a'; g.beginPath(); g.arc(x,y,r*s*.24,0,TAU); g.fill(); g.lineWidth=1.4; g.strokeStyle=OUTC; g.stroke(); g.fillStyle='#9fe3ff'; g.beginPath(); g.arc(x,y,r*s*.15,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(x-1,y-1,1.2,0,TAU); g.fill(); }); });
      break; }
    case 'bandana': {
      ball(add(c,[0,-.02,r*.42]),[r*1.03,r*1.0,r*.66],S.bandC||'#c33',{team:S.bandTeam,bias:.004});
      blade(add(c,[0,-r*.95,r*.3]),add(c,[r*.2,-r*1.5,-r*.1+(anim==='walk'?Math.sin(t*TAU*2)*.03:0)]),.05,.03,S.bandC||'#c33',{team:S.bandTeam,bias:-.02});
      const dl=nrm([0,1,-.42]); const f=dot(nrm(WD(dl)),CAMV()); if(f>.1) at(add(c,mul(dl,r*.98)),.012,(g,x,y,s)=>{ if(PASS==='mask') return; g.fillStyle='#2b2333'; g.beginPath(); g.ellipse(x,y,r*s*.62*f,r*s*.26,0,0,TAU); g.fill(); });
      break; }
    case 'dwarf': {
      ball(add(c,[0,-.01,r*.38]),[r*1.08,r*1.06,r*.78],S.metal||'#a6adb8',{hl:.5,bias:.004});
      disc(add(c,[0,0,r*.32]),[0,0,1],r*1.15,dk(S.metal||'#a6adb8',.15),{th:.015,bias:.002});
      ball(add(c,[0,0,r*1.12]),[r*.14,r*.14,r*.14],S.plume||'#e33',{team:true,bias:.01});
      break; }
    case 'fairy': {
      ball(add(c,[0,-r*.15,r*.2]),[r*1.08,r*1.02,r*1.0],S.hair||'#ffd06a',{bias:-.004});
      [-1,1].forEach(sd=>limb(add(c,[sd*r*.4,0,r*.9]),add(c,[sd*r*.7,r*.1,r*1.5]),.012,.012,'#3a2a2a',{bias:.01}));
      [-1,1].forEach(sd=>ball(add(c,[sd*r*.7,r*.1,r*1.5]),[.03,.03,.03],'#ffe27a',{bias:.012,glow:{r:3,c:'#fff3a0',a:.6}}));
      break; }
    case 'cap': {
      ball(add(c,[0,-.01,r*.45]),[r*1.04,r*1.02,r*.66],S.capC||'#4a6aa8',{team:S.capTeam,bias:.004});
      disc(add(c,[0,r*.6,r*.35]),[0,.2,1],r*.55,S.capC||'#4a6aa8',{team:S.capTeam,bias:.006});
      break; }
  }
}
function weapons(S,A,hR,hL,chest,anim,t,bob){
  const W=S.weapon;
  if(W==='sword'||W==='hammer'){
    const bd=nrm(A.bd||[.1,.42,1]);
    const grip=hR;
    limb(add(grip,mul(bd,-.06)),add(grip,mul(bd,.06)),.025,.025,'#5a3a22',{bias:.02});
    if(W==='sword'){
      const side=nrm(cross(bd,[0,0,1])); const sd=Math.hypot(...side)<.1?[1,0,0]:side;
      limb(add(add(grip,mul(bd,.07)),mul(sd,-.09)),add(add(grip,mul(bd,.07)),mul(sd,.09)),.022,.022,'#d9a93a',{bias:.025});
      blade(add(grip,mul(bd,.08)),add(grip,mul(bd,(S.bladeL||.48))),.045,.035,S.bladeC||'#e6edf5',{tip:.08,bias:.02});
    } else {
      limb(grip,add(grip,mul(bd,.42)),.025,.025,'#6a4a2a',{bias:.02});
      const hc=add(grip,mul(bd,.42)); const sd=nrm(cross(bd,[0,0,1]));
      limb(add(hc,mul(sd,-.1)),add(hc,mul(sd,.1)),.07,.07,'#8a8f9a',{bias:.022});
    }
  }
  if(S.off==='shield'){
    const n=anim==='atk'?[-.4,1,.1]:[-.25,1,0];
    disc(add(hL,[-.02,.05,.02]),n,.2,S.shieldC||'#aaa',{team:true,th:.05,rim:'#9aa3ae',after:(g,E,f)=>{ if(f<.15) return; g.fillStyle='#ffd34d'; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.32,E.s2*.32,E.th,0,TAU); g.fill(); g.lineWidth=1.2; g.strokeStyle=OUTC; g.stroke(); g.lineWidth=2; g.strokeStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.8,E.s2*.8,E.th,3.6,4.6); g.stroke(); }});
  }
  if(S.off==='book'){
    ball(add(hL,[0,.06,.03]),[.1,.04,.12],'#7a2a3a',{bias:.02});
  }
  if(W==='axe'){
    const bd=nrm(A.bd||[.2,.5,.8]), base=lerp3(hR,hL,.5);
    limb(add(base,mul(bd,-.18)),add(base,mul(bd,.42)),.028,.028,'#6a4426',{bias:.02});
    const hc=add(base,mul(bd,.38)), sd=nrm(cross(bd,[0,0,1]).map((v,i)=>v||(i===0?1:0)));
    const up=nrm(cross(sd,bd));
    poly([add(hc,mul(bd,.1)),add(add(hc,mul(sd,.2)),mul(bd,.16)),add(add(hc,mul(sd,.24)),mul(bd,-.02)),add(add(hc,mul(sd,.18)),mul(bd,-.16)),add(hc,mul(bd,-.08))],'#d5dbe4',{bias:.03});
  }
  if(W==='daggers'){
    [[hR,1],[hL,-1]].forEach(q=>{ const h=q[0]; blade(add(h,[0,.03,0]),add(h,[q[1]*.03,.26,.06]),.03,.02,'#e6edf5',{tip:.05,bias:.03}); });
  }
  if(W==='bow'){
    const c=add(hL,[0,.02,0]), up=[0,0,1], sd=[1,0,0];
    const pts=[]; for(let i=0;i<=10;i++){ const a=-1.1+i*.22; pts.push(add(c,[Math.sin(a)*.04-.02,-Math.cos(a)*.1+.1,Math.sin(a)*.38])); }
    curve(pts,.03,'#8a5a2a',{bias:.03});
    const top=pts[0], bot=pts[10], dr=A.draw||0;
    const nock=dr>0?hR:add(c,[0,-.04,0]);
    curve([top,nock,bot],.008,'#f4f0e0',{bias:.035,noOut:true});
    if(dr>.05||anim!=='atk') { const s0=add(nock,[0,0,0]); limb(s0,add(c,[0,.18,.02]),.008,.008,'#c9a26a',{bias:.04}); blade(add(c,[0,.16,.02]),add(c,[0,.22,.02]),.025,.005,'#d9dfe8',{bias:.04,noOut:true}); }
  }
  if(W==='staff'){
    const top=add(hR,[0,.02+(A.cast||0)*.08,.42]), bot=add(hR,[0,-.02,-.36]);
    limb(bot,top,.026,.026,S.staffC||'#7a4f2a',{bias:.02});
    const oc=S.orbC||'#7ad7ff', gl=(A.charge||0)*.8+(A.cast||0)+.35;
    if(S.staffTop==='skull'){ ball(add(top,[0,0,.05]),[.08,.075,.075],'#ecebdc',{bias:.03}); glow(add(top,[0,.07,.05]),.18*gl,oc,.9); }
    else if(S.staffTop==='leaf'){ [0,1,2,3].forEach(i=>{ const a=i*1.57+.4; ball(add(top,[Math.cos(a)*.05,Math.sin(a)*.05,.04]),[.05,.05,.025],i%2?'#6fd25a':'#3fa043',{bias:.03}); }); ball(add(top,[0,0,.06]),[.04,.04,.04],oc,{bias:.035,glow:{r:3*gl,c:oc,a:.8}}); }
    else if(S.staffTop==='cross'){ limb(add(top,[-.08,0,.05]),add(top,[.08,0,.05]),.022,.022,'#f0c64a',{bias:.03}); limb(add(top,[0,0,-.04]),add(top,[0,0,.16]),.022,.022,'#f0c64a',{bias:.03}); glow(add(top,[0,0,.05]),.25*gl,'#fff3a8',.7); }
    else { ball(add(top,[0,0,.06]),[.075,.075,.075],oc,{bias:.03,hl:.7,glow:{r:2.2+gl*1.5,c:oc,a:.7}}); }
  }
  if(W==='spear'){
    const d=nrm(sub(hL,hR)), base=add(hR,mul(d,-.25)), tip=add(hL,mul(d,.4));
    limb(base,tip,.022,.022,'#7a5230',{bias:.02});
    blade(tip,add(tip,mul(d,.12)),.05,.03,'#e6edf5',{tip:.07,bias:.025});
    ball(add(tip,mul(d,-.02)),[.035,.035,.035],'#e33',{team:true,bias:.022});
  }
  if(W==='lute'){
    const c=add(chest,[.02,.12,-.05]);
    ball(c,[.13,.05,.16],'#b8742a',{axes:[[.8,0,.6],[0,1,0],[-.6,0,.8]],bias:.02});
    limb(add(c,[-.06,.02,.08]),add(c,[-.22,.04,.3]),.022,.022,'#6a3e1c',{bias:.022});
    at(add(c,[0,.06,0]),.025,(g,x,y,s)=>{ if(PASS==='mask') return; g.fillStyle='#3a2210'; g.beginPath(); g.arc(x,y,s*.035,0,TAU); g.fill(); });
  }
  if(W==='bomb'){
    const k=A.throwK||0;
    if(k<.5){ const b=add(hR,[0,.02,.07]); ball(b,[.1,.1,.1],'#2c2a36',{bias:.03,hl:.5}); limb(add(b,[0,0,.09]),add(b,[.03,-.02,.15]),.012,.012,'#c9a26a',{bias:.031}); glow(add(b,[.03,-.02,.16]),.08,'#ffcc44',1); }
    ball(add(hL,[0,0,.0]),[.09,.09,.09],'#2c2a36',{bias:.03,hl:.5});
  }
}
function swoosh(c,bd,len){
  const p=P(W_(add(c,mul(bd,len*.7))));
  op(p[2]-.05,g=>{ if(PASS==='mask') return; g.globalAlpha=.55; g.strokeStyle='#ffffff'; g.lineCap='round'; g.lineWidth=PPU*RIG.s*.09; g.beginPath(); g.arc(p[0],p[1]+PPU*RIG.s*.1,PPU*RIG.s*.38,-2.6,-.6); g.stroke(); });
}
/* ==========================================================================
   DEFINIÇÕES DAS TROPAS
   ========================================================================== */
const SK1='#f6c9a0', SK2='#d79a6c', SK3='#9b6a4a';
const CH={
  cavaleiro:{scale:1.32,weapon:'sword',off:'shield',head:'helmet',skin:SK1,body:'#b8c1cd',metal:'#c9d1db',arms:'#a9b2be',legs:'#8f98a6',boots:'#5b6170',pads:'#d6dce5',tabard:'#fff',belt:'#5a3a22',plume:'#fff',hands:'#8f98a6',bladeL:.5},
  soldado:{scale:1.15,weapon:'sword',off:'shield',head:'cap',capC:'#fff',capTeam:true,skin:SK1,body:'#8a6a4a',bodyTeam:false,arms:'#8a6a4a',legs:'#5b4a3a',boots:'#3d2a1e',belt:'#3a2412',tabard:'#fff',bladeL:.38},
  berserker:{scale:1.36,weapon:'axe',head:'horned',skin:SK2,body:SK2,arms:SK2,legs:'#6a4a32',boots:'#3d2a1e',belt:'#fff',beltTeam:true,hair:'#c9562a',beard:'#c9562a',metal:'#7a6a5a',wide:1,extra:o=>{ ball(add(o.chest,[0,.02,-.11]),[.205,.155,.05],'#eee',{team:true,bias:.02}); }},
  ladino:{scale:1.22,weapon:'daggers',head:'bandana',bandC:'#fff',bandTeam:true,skin:SK1,hair:'#2a2030',body:'#3a3446',arms:'#3a3446',legs:'#2c2836',boots:'#1e1a26',belt:'#7a4a2a',cape:'#fff',capeTeam:true},
  arqueira:{scale:1.24,weapon:'bow',head:'bare',skin:SK1,hair:'#e0a23a',body:'#4e8a3e',arms:'#4e8a3e',legs:'#6a4a32',boots:'#4a2f22',belt:'#6a4426',cape:'#fff',capeTeam:true,ears:1,extra:o=>{ /* aljava */ const q=add(o.chest,[.1,-.17,.05]); limb(add(q,[0,0,-.12]),add(q,[0,0,.16]),.05,.05,'#7a4a26',{bias:-.02}); [-.02,.02].forEach(d=>blade(add(q,[d,0,.16]),add(q,[d,0,.25]),.02,.01,'#eee',{team:true,bias:-.019,noOut:true})); }},
  mago:{scale:1.26,weapon:'staff',head:'wizard',hatC:'#fff',hatTeam:true,stars:1,skin:SK1,beard:'#f0f0f6',robe:'#fff',robeTeam:true,body:'#fff',bodyTeam:true,arms:'#fff',armsTeam:true,belt:'#e8b83a',orbC:'#8fd8ff',staffC:'#6a4426'},
  necromante:{scale:1.26,weapon:'staff',head:'hood',hood:'#3a2e4a',face:'#1d1626',eyeGlow:'#7dff8a',robe:'#2e2440',body:'#2e2440',arms:'#2e2440',hands:'#cfd8c6',belt:'#fff',beltTeam:true,staffTop:'skull',orbC:'#7dff8a',staffC:'#3a3030',cape:'#fff',capeTeam:true},
  druida:{scale:1.26,weapon:'staff',head:'leaves',skin:SK2,hair:'#7a4a2a',beard:'#a07050',robe:'#5d7a3a',body:'#5d7a3a',arms:'#5d7a3a',belt:'#fff',beltTeam:true,staffTop:'leaf',orbC:'#b6ff7a',staffC:'#6a4426',cape:'#fff',capeTeam:true},
  clerigo:{scale:1.26,weapon:'staff',head:'mitre',skin:SK1,robe:'#f4f0e4',body:'#f4f0e4',arms:'#f4f0e4',tabard:'#fff',belt:'#e7b93a',staffTop:'cross',staffC:'#e7b93a',off:'book'},
  bardo:{scale:1.22,weapon:'lute',head:'feather',hatC:'#fff',hatTeam:true,feather:'#ff7a3a',skin:SK1,hair:'#8a4a2a',body:'#c0392b',arms:'#e8d8b8',legs:'#3b5b8a',boots:'#4a2f22',belt:'#e8b83a',cape:'#fff',capeTeam:true,mouth:'smile'},
  engenheiro:{scale:1.2,weapon:'hammer',head:'goggles',capC:'#fff',capTeam:true,skin:SK1,hair:'#6a4a2a',body:'#d9822b',arms:'#d9822b',legs:'#3b5b8a',boots:'#4a2f22',belt:'#5a3a22',pack:'#8a6a4a',beard:'#6a4a2a',short:1},
  esqueleto:{scale:1.02,weapon:'sword',head:'skull',skin:'#ecebdc',body:'#ecebdc',arms:'#ecebdc',legs:'#ecebdc',boots:'#dcdac6',hands:'#ecebdc',bladeL:.32,bladeC:'#b9b2a0',eyeGlow:'#ff6a6a',belt:'#fff',beltTeam:true,extra:o=>{ at(add(o.chest,[0,.15,0]),.03,(g,x,y,s)=>{ if(PASS==='mask') return; g.strokeStyle='#8a8676'; g.lineWidth=1.4; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(x-s*.12,y+i*s*.06); g.lineTo(x+s*.12,y+i*s*.06); g.stroke(); } }); }},
  lanceiro:{scale:1.26,weapon:'spear',head:'helmet',skin:SK1,body:'#7a7f8a',metal:'#b9c0ca',arms:'#7a7f8a',legs:'#5b4a3a',boots:'#3d2a1e',tabard:'#fff',belt:'#5a3a22',plume:'#fff',pads:'#c9d0da'},
  bombardeiro:{scale:1.14,weapon:'bomb',head:'dwarf',skin:SK1,beard:'#e07a2a',body:'#6a5a8a',arms:'#6a5a8a',legs:'#4a3a2a',boots:'#2a1e16',belt:'#fff',beltTeam:true,metal:'#a6adb8',plume:'#fff',wide:1,short:1,nose:1,pack:'#7a5a3a',extra:o=>{ [-1,1].forEach(s=>ball(add(o.chest,[s*.1,-.2,-.05]),[.075,.075,.075],'#2c2a36',{bias:-.03})); }},
  fada:{scale:.9,weapon:'staff',head:'fairy',skin:SK1,hair:'#ffd06a',robe:'#fff',robeTeam:true,body:'#fff',bodyTeam:true,arms:SK1,hands:SK1,orbC:'#ffe9a0',staffC:'#e8c86a',fly:1},
};
/* ==========================================================================
   CRIATURAS (não humanoides)
   ========================================================================== */
const CR={};
/* Golem de pedra */
CR.golem={scale:1.5,draw(anim,t){
  const st='#8e9299', st2='#7b7f87', moss='#5a9a3a';
  let bob=0, sway=0, step=0, w=0, k=0;
  if(anim==='walk'){ step=Math.sin(t*TAU); bob=Math.abs(Math.cos(t*TAU))*.03; sway=Math.sin(t*TAU)*.03; }
  if(anim==='idle') bob=Math.sin(t*TAU)*.01;
  if(anim==='atk'){ w=t<.5?sm(t/.5):1; k=t<.5?0:sm((t-.5)/.5); }
  const lean=.05+.18*k-.08*w;
  const Lf=[-.17,step*.12,Math.max(0,-step)*.05], Rf=[.17,-step*.12,Math.max(0,step)*.05];
  [Lf,Rf].forEach((f,i)=>{ limb([(i?.14:-.14),0,.32+bob],add(f,[0,0,.1]),.1,.09,st2); ball(add(f,[0,.04,.07]),[.12,.15,.08],dk(st,.12)); });
  ball([sway,lean*.4,.36+bob],[.2,.16,.12],st2);
  const ch=[sway,lean,.62+bob];
  ball(ch,[.32,.24,.25],st);
  ball(add(ch,[.12,-.12,.12]),[.12,.1,.1],lt(st,.06),{bias:-.02});
  ball(add(ch,[-.15,-.1,-.1]),[.1,.09,.09],dk(st,.05),{bias:-.02});
  ball(add(ch,[0,.22,.02]),[.08,.04,.09],'#fff',{team:true,hl:.8,bias:.02,glow:{r:2.6,c:'#ffffff',a:.55}});
  [[-.18,.12,.14],[.2,.1,-.06],[-.05,.15,-.17]].forEach((q,i)=>ball(add(ch,q),[.08,.04,.05],i%2?moss:lt(moss,.1),{bias:.015}));
  const hc=add(ch,[0,.1+.05*k,.24-.04*k]);
  ball(hc,[.15,.14,.12],lt(st,.04),{bias:.01});
  ball(add(hc,[0,.06,.07]),[.15,.1,.04],dk(st,.15),{bias:.02});
  eyes(hc,.14,{glow:'#ffe680',sp:.36,big:.13,up:-.05});
  const hand=(sd)=>{ const rest=[sd*.42,.1+(-sd*step*.08),.36+bob]; const up=[sd*.3,-.05,1.05]; const slam=[sd*.2,.42,.12]; return lerp3(lerp3(rest,up,w),slam,k); };
  [-1,1].forEach(sd=>{ const sh=add(ch,[sd*.32,-.02,.12]), h=hand(sd);
    ball(sh,[.15,.14,.13],st,{bias:.01}); limb(sh,h,.09,.085,st2,{bias:.005}); ball(h,[.13,.13,.12],st,{bias:.012});
    ball(add(sh,[0,-.02,.1]),[.07,.06,.04],moss,{bias:.02}); });
}};
/* Grifo: corpo de leão, cabeça de águia, asas */
CR.grifo={scale:1.5,fly:1,draw(anim,t){
  const fl=Math.sin(t*TAU), up=anim==='atk'?(t<.5?sm(t/.5):1-sm((t-.5)/.5)):0, dive=anim==='atk'&&t>.5?sm((t-.5)/.5):0;
  const bz=.45+fl*.03;
  const body='#c9934a', head='#f4f0e6';
  ball([0,-.05,bz],[.2,.32,.18],body);
  ball([0,-.36,bz+.04],[.06,.14,.05],body,{axes:[[1,0,0],[0,.7,.7],[0,-.7,.7]]});
  ball([0,-.48,bz+.14],[.07,.07,.07],dk(body,.2));
  [-1,1].forEach(s=>{ limb([s*.12,.12,bz-.1],[s*.13,.18+dive*.15,bz-.3+dive*.05],.05,.04,'#e0b24a'); ball([s*.13,.2+dive*.15,bz-.3+dive*.05],[.05,.07,.04],'#e8c04a'); limb([s*.12,-.25,bz-.1],[s*.13,-.3,bz-.28],.05,.04,body); });
  const hc=[0,.3+dive*.08,bz+.2-dive*.08];
  ball(add(hc,[0,-.06,-.08]),[.13,.12,.14],head,{bias:-.01});
  ball(hc,[.14,.14,.14],head);
  ball(add(hc,[0,.15,-.03]),[.05,.11,.05],'#f2b632',{bias:.02,axes:[[1,0,0],[0,.9,-.4],[0,.4,.9]]});
  eyes(hc,.14,{sp:.5,big:.13,brow:1.4});
  [-1,1].forEach(s=>ball(add(hc,[s*.06,-.08,.13]),[.03,.07,.03],head,{bias:-.005}));
  const wa=fl*.9+.25+up*.6;
  [-1,1].forEach(s=>{ const r0=[s*.14,.08,bz+.12], tip=[s*(.18+.45*Math.cos(wa)),-.05,bz+.12+.45*Math.sin(wa)], back=[s*(.12+.3*Math.cos(wa)),-.3,bz+.12+.3*Math.sin(wa)];
    poly([r0,tip,add(tip,[0,-.12,-.03]),back,[s*.12,-.2,bz+.1]],'#fff',{team:true,bias:s*.001});
    poly([r0,tip,lerp3(tip,back,.5),[s*.13,-.05,bz+.1]],'#f4f0e6',{bias:.002}); });
}};
CR.morcegos={scale:1.35,fly:1,draw(anim,t){
  const fl=Math.sin(t*TAU*2), bz=.5+fl*.04, lunge=anim==='atk'?Math.sin(t*PI)*.12:0;
  ball([0,lunge,bz],[.11,.1,.13],'#4a3a5e');
  const hc=[0,.06+lunge,bz+.14];
  ball(hc,[.1,.1,.09],'#5a4a70');
  [-1,1].forEach(s=>poly([add(hc,[s*.04,-.01,.05]),add(hc,[s*.11,-.03,.17]),add(hc,[s*.09,.0,.03])],'#5a4a70',{bias:.005}));
  eyes(hc,.1,{glow:'#ff5a5a',sp:.4,big:.14});
  const wa=fl*1.0;
  [-1,1].forEach(s=>{ const r0=[s*.08,0,bz+.03], tip=[s*(.12+.3*Math.cos(wa)),.02,bz+.05+.3*Math.sin(wa)], m=[s*(.1+.18*Math.cos(wa)),-.08,bz-.02+.18*Math.sin(wa)];
    poly([r0,tip,m,[s*.08,-.06,bz-.06]],'#fff',{team:true}); limb(r0,tip,.012,.008,'#3a2a4e',{bias:.003}); });
}};
CR.gargula={scale:1.45,fly:1,draw(anim,t){
  const fl=Math.sin(t*TAU), bz=.32+fl*.025, k=anim==='atk'?(t<.5?0:sm((t-.5)/.5)):0, w=anim==='atk'?(t<.5?sm(t/.5):1):0;
  const st='#8d939c';
  ball([0,.02,bz+.15],[.19,.15,.18],st);
  ball([0,0,bz-.02],[.16,.14,.1],dk(st,.08));
  const hc=[0,.06+k*.08,bz+.43];
  ball(hc,[.17,.16,.15],st);
  [-1,1].forEach(s=>limb(add(hc,[s*.1,-.02,.08]),add(hc,[s*.2,-.08,.24]),.04,.01,'#5e626a',{bias:.004}));
  eyes(hc,.17,{glow:'#ff8a3a',sp:.36,big:.12});
  ball(add(hc,[0,.13,-.06]),[.09,.06,.06],lt(st,.1),{bias:.01});
  [-1,1].forEach(s=>{ limb([s*.16,.04,bz+.24],lerp3([s*.25,.2,bz+.05],[s*.18,.45,bz+.2],k),.06,.05,st); ball(lerp3([s*.25,.2,bz+.05],[s*.18,.45,bz+.2],k),[.07,.07,.07],dk(st,.1),{bias:.01});
    limb([s*.1,0,bz],[s*.13,.08,bz-.2],.06,.05,st); ball([s*.13,.12,bz-.22],[.07,.09,.05],dk(st,.15)); });
  const wa=fl*.6+.6+w*.4;
  [-1,1].forEach(s=>{ const r0=[s*.12,-.1,bz+.3], tip=[s*(.2+.4*Math.cos(wa)),-.18,bz+.3+.4*Math.sin(wa)], m=[s*(.18+.25*Math.cos(wa)),-.25,bz+.1+.15*Math.sin(wa)];
    poly([r0,tip,lerp3(tip,m,.5),m,[s*.1,-.15,bz+.1]],'#fff',{team:true,bias:-.02}); limb(r0,tip,.025,.012,dk(st,.2),{bias:-.019}); });
  limb([0,-.12,bz],[0,-.38,bz-.12],.04,.015,st);
}};
CR.wyvern={scale:1.9,fly:1,draw(anim,t){
  const fl=Math.sin(t*TAU), bz=.5+fl*.03, k=anim==='atk'?(t<.5?sm(t/.5):1-sm((t-.5)/.5)):0, fire=anim==='atk'&&t>.45&&t<.95;
  const sc='#4f9a46', bel='#e8d48a';
  ball([0,-.02,bz],[.17,.3,.15],sc);
  ball([0,.05,bz-.07],[.12,.22,.08],bel,{bias:.01});
  const tail=[[0,-.3,bz],[0,-.5,bz-.06],[.04,-.68,bz-.08],[.1,-.82,bz-.04]];
  for(let i=0;i<3;i++) limb(tail[i],tail[i+1],.09-.025*i,.065-.025*i,sc);
  poly([add(tail[3],[0,0,.0]),add(tail[3],[.08,-.1,.06]),add(tail[3],[-.02,-.12,-.04])],'#fff',{team:true});
  const neck=[0,.28+k*.05,bz+.12], hc=[0,.42+k*.1,bz+.26-k*.05];
  limb([0,.15,bz+.04],neck,.09,.075,sc);
  limb(neck,hc,.075,.065,sc);
  ball(hc,[.11,.15,.1],sc);
  ball(add(hc,[0,.13,-.03-k*.03]),[.07,.1,.04],lt(sc,.1),{bias:.01});
  [-1,1].forEach(s=>limb(add(hc,[s*.05,-.08,.06]),add(hc,[s*.08,-.2,.12]),.025,.008,'#eee6c8',{bias:.003}));
  eyes(hc,.11,{sp:.55,big:.14,c:'#2a1010',brow:1.6});
  if(fire) glow(add(hc,[0,.32,-.06]),.3,'#ff9a2a',.95,.3);
  [-1,1].forEach(s=>{ limb([s*.1,.1,bz-.08],[s*.12,.16,bz-.26],.045,.035,sc); limb([s*.1,-.15,bz-.08],[s*.12,-.12,bz-.26],.05,.04,sc); });
  const wa=fl*.85+.35;
  [-1,1].forEach(s=>{ const r0=[s*.12,.06,bz+.1], el=[s*(.2+.28*Math.cos(wa)),.0,bz+.12+.28*Math.sin(wa)], tip=[s*(.25+.62*Math.cos(wa)),-.12,bz+.1+.62*Math.sin(wa)];
    poly([r0,el,tip,[s*(.22+.4*Math.cos(wa)),-.32,bz+.05+.4*Math.sin(wa)],[s*(.16+.18*Math.cos(wa)),-.32,bz+.0+.2*Math.sin(wa)],[s*.1,-.18,bz+.05]],'#fff',{team:true,bias:-.01});
    limb(r0,el,.035,.03,sc,{bias:-.009}); limb(el,tip,.03,.012,sc,{bias:-.009}); });
}};
CR.ariete={scale:1.55,draw(anim,t){
  const k=anim==='atk'?(t<.5?-sm(t/.5)*.12:-.12+sm((t-.5)/.5)*.32):0, rock=anim==='walk'?Math.sin(t*TAU*2)*.01:0;
  const wood='#8a5a32', dark='#5a3a20';
  // rodas
  [[-.2,.2],[.2,.2],[-.2,-.2],[.2,-.2]].forEach(q=>disc([q[0]*1.15,q[1],.1],[1,0,0],.1,'#6a4426',{th:.04,rim:'#3a2412',after:(g,E,f)=>{ if(Math.abs(f)<.2) return; g.strokeStyle=OUTC; g.lineWidth=1.2; const a0=anim==='walk'?t*TAU:0; for(let i=0;i<3;i++){ const a=a0+i*1.05; g.beginPath(); g.moveTo(E.x+Math.cos(a)*E.s1*.8,E.y+Math.sin(a)*E.s2*.8); g.lineTo(E.x-Math.cos(a)*E.s1*.8,E.y-Math.sin(a)*E.s2*.8); g.stroke(); } }}));
  // estrado
  const bz=.16+rock;
  poly([[-.2,-.3,bz],[.2,-.3,bz],[.2,.3,bz],[-.2,.3,bz]],wood);
  [[-.2,-.3],[.2,-.3],[.2,.3],[-.2,.3]].forEach(q=>limb([q[0],q[1],bz],[q[0]*.85,q[1]*.85,bz+.32],.025,.025,dark));
  // tronco do aríete pendurado
  const log0=[0,-.32+k,bz+.2], log1=[0,.36+k,bz+.2];
  limb(log0,log1,.085,.085,'#a0703e');
  ball([0,.42+k,bz+.2],[.11,.09,.11],'#7a7f8a',{hl:.5});
  [-1,1].forEach(s=>ball([s*.06,.5+k,bz+.24],[.04,.04,.04],'#9aa0aa',{bias:.01}));
  // telhado (cor da equipe)
  const rz=bz+.36;
  poly([[-.26,-.34,rz],[0,-.34,rz+.16],[0,.34,rz+.16],[-.26,.34,rz]],'#fff',{team:true});
  poly([[.26,-.34,rz],[0,-.34,rz+.16],[0,.34,rz+.16],[.26,.34,rz]],'#fff',{team:true});
  limb([0,-.36,rz+.16],[0,.36,rz+.16],.02,.02,dark,{bias:.01});
}};
/* fada: humanoide pequena com asas */
CH.fada.extra=o=>{
  const fl=Math.sin(o.t*TAU*3)*.4;
  [-1,1].forEach(s=>{ const r0=add(o.chest,[s*.05,-.12,.08]);
    poly([r0,add(r0,[s*(.3+fl*.05),-.12,.28]),add(r0,[s*(.36),-.1,.08]),add(r0,[s*.12,-.04,-.02])],'#cfeeff',{bias:-.03,ow:1.4});
    poly([r0,add(r0,[s*.24,-.08,-.12]),add(r0,[s*.1,-.06,-.2])],'#ffd6f4',{bias:-.031,ow:1.4}); });
  glow(add(o.chest,[0,0,0]),.5,'#fff3c0',.35,-.2);
};
/* ==========================================================================
   CONSTRUÇÕES
   ========================================================================== */
const ST={};
function stoneBase(R,h,c){ cyl([0,0,0],R,h,c||'#a8a29a',{bands:1,top:lt(c||'#a8a29a',.1),afterTop:(g,x,y,rx,ry)=>{ g.strokeStyle='rgba(40,25,40,.3)'; g.lineWidth=1.1; g.beginPath(); g.ellipse(x,y,rx*.72,ry*.72,0,0,TAU); g.stroke(); for(let i=0;i<8;i++){ const a=i*PI/4+.2; g.beginPath(); g.moveTo(x+Math.cos(a)*rx*.72,y+Math.sin(a)*ry*.72); g.lineTo(x+Math.cos(a)*rx*.97,y+Math.sin(a)*ry*.97); g.stroke(); } }}); }
/* canhão: base + cano que gira (aim = direção do cano) */
ST.canhao={scale:1.4,turret:1,draw(aim,anim,t){
  stoneBase(.4,.14,'#9c958a');
  const rec=anim==='fire'?Math.sin(Math.min(1,t*2)*PI)*.09:0;
  setRigKeep(aim);
  cyl([0,0,.14],.26,.06,'#6a4a2a',{top:'#7a5632'});
  [-1,1].forEach(s=>{ poly([[s*.15,-.2,.2],[s*.15,.12,.2],[s*.15,.04,.4],[s*.15,-.16,.38]],'#7a5230',{bias:s*.001}); disc([s*.17,-.06,.24],[1,0,0],.1,'#5a3a20',{th:.03,rim:'#3a2412',after:(g,E)=>{ g.strokeStyle=OUTC; g.lineWidth=1; g.beginPath(); g.moveTo(E.x-E.s1*.7,E.y); g.lineTo(E.x+E.s1*.7,E.y); g.moveTo(E.x,E.y-E.s2*.7); g.lineTo(E.x,E.y+E.s2*.7); g.stroke(); }}); });
  const b0=[0,-.2-rec,.36], b1=[0,.36-rec,.42];
  limb(b0,b1,.13,.1,'#3c3f4a');
  ball([0,-.22-rec,.36],[.12,.1,.12],'#454956');
  limb([0,.0-rec,.385],[0,.04-rec,.39],.142,.142,'#fff',{team:true,bias:.01});
  disc([0,.37-rec,.42],[0,1,.1],.11,'#2a2c34',{th:.03,rim:'#5a5e6a',after:(g,E,f)=>{ if(f<0) return; g.fillStyle='#0d0a12'; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.6,E.s2*.6,E.th,0,TAU); g.fill(); }});
  // pilha de balas
  [[-.25,-.25],[-.2,-.32],[-.3,-.31]].forEach(q=>ball([q[0],q[1],.2],[.05,.05,.05],'#2c2a36',{bias:-.02}));
}};
ST.balista={scale:1.4,turret:1,draw(aim,anim,t){
  stoneBase(.38,.12,'#a39a8c');
  const pull=anim==='fire'?(t<.25?0:Math.min(1,(t-.25)*2)):1;
  setRigKeep(aim);
  cyl([0,0,.12],.08,.2,'#6a4426');
  box([0,.04,.3],[.13,.74,.06],'#8a5a32',{top:'#9a6a3a'});
  const arm=(s)=>{ const tip=[s*.44,.14-pull*.1,.36]; limb([s*.05,.3,.36],[s*.24,.3,.38],.035,.03,'#6a4426'); limb([s*.24,.3,.38],tip,.03,.02,'#6a4426'); ball(tip,[.03,.03,.03],'#c9a26a',{bias:.01}); return tip; };
  const L=arm(-1), R=arm(1), nock=[0,.3-pull*.42,.37];
  curve([L,nock,R],.008,'#f0ead8',{noOut:true,bias:.02});
  if(pull>.2){ limb(nock,[0,nock[1]+.55,.38],.018,.018,'#7a5230',{bias:.03}); blade([0,nock[1]+.55,.38],[0,nock[1]+.65,.38],.045,.01,'#d9dfe8',{bias:.035}); }
  box([0,-.28,.33],[.18,.12,.1],'#fff',{team:true,bias:.01});
}};
ST.torre_arcana={scale:1.35,draw(aim,anim,t){
  const st='#b6aec8';
  stoneBase(.36,.1,'#9a92ac');
  cyl([0,0,.1],.24,.5,st,{bands:3,top:lt(st,.1)});
  cyl([0,0,.6],.29,.1,dk(st,.1),{top:lt(st,.05)});
  [0,1,2,3].forEach(i=>{ const a=i*PI/2+PI/4; limb([Math.cos(a)*.22,Math.sin(a)*.22,.7],[Math.cos(a)*.15,Math.sin(a)*.15,.9],.032,.014,'#fff',{team:true}); });
  at([0,-.24,.38],.05,(g,x,y,s)=>{ if(PASS==='mask') return; g.fillStyle='#2a1d40'; g.beginPath(); g.ellipse(x,y,s*.05,s*.09,0,0,TAU); g.fill(); glowAt(g,x,y,s*.12,'#c58bff',.7); });
  const bob=Math.sin(t*TAU)*.04, sp=anim==='fire'?1:0, cz=1.02+bob;
  ball([0,0,cz],[.12,.12,.18],'#c79bff',{hl:.75,glow:{r:2.2+sp*2,c:'#c58bff',a:.8},bias:.05});
  at([0,0,cz],.06,(g,x,y,s)=>{ if(PASS==='mask') return; g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,y-s*.16); g.lineTo(x-s*.05,y); g.lineTo(x,y+s*.16); g.stroke(); });
  for(let i=0;i<3;i++){ const a=t*TAU+i*TAU/3; ball([Math.cos(a)*.26,Math.sin(a)*.26,cz-.05+Math.sin(a*2)*.03],[.03,.03,.03],'#e6d4ff',{noOut:true,bias:.04,glow:{r:3,c:'#d8b8ff',a:.6}}); }
}};
ST.muralha={scale:1.35,draw(aim,anim,t){
  const sc='#aaa498';
  box([0,0,0],[.9,.36,.42],sc,{bricks:3,top:lt(sc,.08)});
  for(let i=-2;i<=2;i++) box([i*.19,0,.42],[.13,.36,.12],i%2?sc:lt(sc,.04),{top:lt(sc,.12),bias:.01});
  limb([.0,.0,.42],[0,0,.86],.018,.018,'#5a3a20',{bias:.03});
  const wv=Math.sin(t*TAU)*.04;
  poly([[0,0,.86],[.24,.02+wv,.82],[.26,-wv,.68],[0,0,.66]],'#fff',{team:true,bias:.04});
  [[-.3,-.19,.22],[.25,-.19,.1],[.02,-.19,.3]].forEach((q,i)=>ball(q,[.06,.02,.04],i%2?'#5f9a3a':'#4f8a32',{bias:.05}));
}};
ST.altar={scale:1.35,draw(aim,anim,t){
  stoneBase(.38,.08,'#c9c2b4');
  [0,1,2,3].forEach(i=>{ const a=i*PI/2+PI/4, x=Math.cos(a)*.27, y=Math.sin(a)*.27; cyl([x,y,.08],.045,.5,'#e6e0d2',{dz:y<0?.2:-.2}); });
  cyl([0,0,.08],.19,.18,'#e6e0d2',{top:'#7cffb0',afterTop:(g,x,y,rx,ry)=>{ glowAt(g,x,y,rx*2.6,'#7cffb0',.65+.25*Math.sin(t*TAU)); g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x-rx*.2,y-ry*.2,rx*.3,ry*.25,0,0,TAU); g.fill(); }});
  cyl([0,0,.56],.36,.04,'#d9d2c2',{bias:.29,top:'#e6e0d2'});
  cone([0,0,.6],.33,.17,'#fff',{team:true,bias:.3});
  ball([0,0,.79],[.05,.05,.05],'#ffd34d',{bias:.31});
  for(let i=0;i<4;i++){ const q=(t+i/4)%1; ball([Math.cos(i*1.7)*.1,Math.sin(i*1.7)*.1,.28+q*.3],[.022,.022,.022],'#c8ffd8',{noOut:true,bias:.1,glow:{r:2.5,c:'#7cffb0',a:(1-q)*.8}}); }
}};
ST.quartel={scale:1.35,draw(aim,anim,t){
  const wall='#d9c49a', wood='#8a5a32';
  box([0,0,0],[.72,.6,.38],wall,{bricks:2,after:(g,f,q)=>{ if(Math.abs(f.n[1]+1)>.2) return; const x=(q[0][0]+q[1][0])/2, y0=q[0][1], h=(q[0][1]-q[3][1]), w=(q[1][0]-q[0][0])*.17; g.fillStyle='#4a2f1a'; g.beginPath(); g.moveTo(x-w,y0); g.lineTo(x-w,y0-h*.5); g.quadraticCurveTo(x,y0-h*.85,x+w,y0-h*.5); g.lineTo(x+w,y0); g.closePath(); g.fill(); g.lineWidth=1.5; g.strokeStyle=OUTC; g.stroke(); }});
  [[-.36,-.3],[.36,-.3],[-.36,.3],[.36,.3]].forEach(q=>limb([q[0],q[1],0],[q[0],q[1],.4],.03,.03,wood,{bias:q[1]<0?.2:.0}));
  poly([[-.44,-.38,.36],[0,-.38,.66],[0,.38,.66],[-.44,.38,.36]],'#fff',{team:true,bias:.25});
  poly([[.44,-.38,.36],[0,-.38,.66],[0,.38,.66],[.44,.38,.36]],'#fff',{team:true,bias:.25});
  poly([[-.44,-.38,.36],[0,-.38,.66],[.44,-.38,.36]],dk(wall,.05),{bias:.26});
  limb([0,-.4,.66],[0,.4,.66],.025,.025,'#5a3a20',{bias:.27});
  limb([.3,.1,.55],[.3,.1,1.0],.015,.015,'#5a3a20',{bias:.3});
  const wv=Math.sin(t*TAU)*.04;
  poly([[.3,.1,1.0],[.52,.12+wv,.96],[.54,.1-wv,.84],[.3,.1,.82]],'#fff',{team:true,bias:.31});
  disc([-.2,-.31,.2],[0,-1,0],.07,'#fff',{team:true,th:.01,bias:.05});
  [[.24,-.36],[.12,-.4]].forEach((q,i)=>{ limb([q[0],q[1],0],[q[0]+.02,q[1]-.04,.28],.012,.012,'#8a8f9a',{bias:.06}); });
}};
ST.heart={scale:1.25,draw(aim,anim,t){
  const st='#b8afa2', st2='#a1988b';
  cyl([0,0,0],1.12,.1,'#8d8478',{top:'#a69d90',bands:1});
  // muralha
  box([0,-.05,.1],[1.5,.95,.5],st,{bricks:3,top:lt(st,.08),after:(g,f,q)=>{ if(Math.abs(f.n[1]+1)>.2) return; const x=(q[0][0]+q[1][0])/2, y0=q[0][1], h=(q[0][1]-q[3][1]), w=(q[1][0]-q[0][0])*.1; g.fillStyle='#4a2f1a'; g.beginPath(); g.moveTo(x-w,y0); g.lineTo(x-w,y0-h*.45); g.quadraticCurveTo(x,y0-h*.95,x+w,y0-h*.45); g.lineTo(x+w,y0); g.closePath(); g.fill(); g.lineWidth=2; g.strokeStyle=OUTC; g.stroke(); g.strokeStyle='#2a1a10'; g.lineWidth=1.1; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(x+i*w*.5,y0); g.lineTo(x+i*w*.5,y0-h*.6); g.stroke(); } }});
  for(let i=-3;i<=3;i++) box([i*.21,-.5,.6],[.12,.08,.1],st2,{top:lt(st2,.1),bias:.02});
  // torre de menagem
  box([0,.08,.6],[.72,.52,.55],lt(st,.03),{bricks:3,top:lt(st,.12),bias:.05});
  for(let i=-1;i<=1;i++) box([i*.25,-.17,1.15],[.13,.08,.1],st2,{top:lt(st2,.1),bias:.06});
  const pul=1+Math.sin(t*TAU)*.06;
  ball([0,-.2,.9],[.11*pul,.04,.13*pul],'#fff',{team:true,hl:.8,bias:.4,glow:{r:2.4,c:'#ffffff',a:.45}});
  cone([0,.1,1.15],.36,.48,'#fff',{team:true,tiles:1,bias:.06});
  limb([0,.1,1.62],[0,.1,1.95],.012,.012,'#5a3a20',{bias:.07});
  const wv=Math.sin(t*TAU)*.05;
  poly([[0,.1,1.95],[.3,.12+wv,1.9],[.32,.1-wv,1.77],[0,.1,1.77]],'#fff',{team:true,bias:.08});
  // torres laterais
  [-1,1].forEach(s=>{
    [[-.42,1],[.36,.9]].forEach((q,qi)=>{ const x=s*.8, y=q[0];
      cyl([x,y,.08],.22,.95*q[1],st,{bands:4,top:st2,dz:y<0?.3:-.1});
      cone([x,y,.08+.95*q[1]],.29,.5,'#fff',{team:true,tiles:1,bias:y<0?.3:-.1});
      if(qi===0){ const fz=.08+.95*q[1]+.46; limb([x,y,fz],[x,y,fz+.28],.01,.01,'#5a3a20',{bias:.32}); const w2=Math.sin(t*TAU+s)*.05; poly([[x,y,fz+.28],[x+.22,y+w2,fz+.24],[x+.24,y-w2,fz+.13],[x,y,fz+.13]],'#fff',{team:true,bias:.33}); }
    });
  });
  [[-.55,-.52,.3],[.5,-.52,.22],[-.28,-.52,.15]].forEach(q=>ball(q,[.07,.02,.09],'#4f8a3a',{bias:.3}));
}};
function setRigKeep(a){ RIG.f=[Math.cos(a),Math.sin(a),0]; RIG.r=[Math.sin(a),-Math.cos(a),0]; }
/* ==========================================================================
   API de desenho de um quadro
   ========================================================================== */
const DIRA=[-PI/2,-PI/4,0,PI/4,PI/2];   // S, SE, E, NE, N (os outros 3 são espelhados)
function drawUnit(g,key,dir,anim,t,ppu,ax,ay,pass){
  PASS=pass||'color'; PPU=ppu; AX=ax; AY=ay; OPS=[];
  const a=DIRA[dir];
  if(CH[key]){ const S=CH[key]; setRig(a,S.scale||1,[0,0,0]); humanoid(S,anim,t); }
  else if(CR[key]){ const C=CR[key]; setRig(a,C.scale||1,[0,0,0]); C.draw(anim,t); }
  flush(g);
}
function drawStruct(g,key,dir,anim,t,ppu,ax,ay,pass){
  PASS=pass||'color'; PPU=ppu; AX=ax; AY=ay; OPS=[];
  const D=ST[key]; setRig(-PI/2,D.scale||1,[0,0,0]);
  D.draw(DIRA[dir],anim,t);
  flush(g);
}
return {setEl,drawUnit,drawStruct,CH,CR,ST,DIRA,mix,lt,dk,glowAt,OUTC,
  _prim:{ball,limb,poly,disc,blade,curve,at,glow,setRig,op,flush,eyes,P,W_},
  _set:(o)=>{ if(o.PASS) PASS=o.PASS; if(o.PPU) PPU=o.PPU; if(o.AX!=null) AX=o.AX; if(o.AY!=null) AY=o.AY; if(o.OW!=null) OW=o.OW; }};
})();
if(typeof module!=='undefined') module.exports=ART;
