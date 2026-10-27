/* Valdoria · cenários (texturas, decoração) e ícones dos feitiços. Usa o motor de tools/art-src.js. */
'use strict';
const ASCENE=(function(){
const PI=Math.PI, TAU=PI*2, A=ART._prim, mix=ART.mix, lt=ART.lt, dk=ART.dk, OUT=ART.OUTC;
function rng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
/* desenha algo em todas as cópias (textura contínua) */
function wrap(S,x,y,r,fn){ for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){ const X=x+dx*S, Y=y+dy*S; if(X+r<0||Y+r<0||X-r>S||Y-r>S) continue; fn(X,Y); } }
/* ---------------- texturas (256×256, contínuas) ---------------- */
const TS=256;
function texBase(c,col){ const g=c.getContext('2d'); g.fillStyle=col; g.fillRect(0,0,TS,TS); return g; }
function mottle(g,R,cols,n,rmin,rmax,al){ for(let i=0;i<n;i++){ const x=R()*TS, y=R()*TS, r=rmin+R()*(rmax-rmin), c=cols[Math.floor(R()*cols.length)]; g.globalAlpha=al; g.fillStyle=c; wrap(TS,x,y,r,(X,Y)=>{ g.beginPath(); g.ellipse(X,Y,r,r*.7,R()*PI,0,TAU); g.fill(); }); } g.globalAlpha=1; }
function grassTex(base,light,dark,flower,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  mottle(g,R,[light,dark],40,14,40,.22);
  for(let i=0;i<520;i++){ const x=R()*TS, y=R()*TS, h=3+R()*5, l=R()<.5; g.strokeStyle=l?lt(light,.15):dk(dark,.05); g.globalAlpha=.55; g.lineWidth=1.3; g.lineCap='round';
    wrap(TS,x,y,8,(X,Y)=>{ g.beginPath(); g.moveTo(X,Y); g.lineTo(X-1.5+R()*.5,Y-h); g.moveTo(X+2,Y); g.lineTo(X+3,Y-h*.8); g.stroke(); }); }
  g.globalAlpha=1;
  if(flower) for(let i=0;i<26;i++){ const x=R()*TS, y=R()*TS, c2=flower[Math.floor(R()*flower.length)]; wrap(TS,x,y,4,(X,Y)=>{ g.fillStyle=c2; for(let k=0;k<5;k++){ const a=k*1.2566; g.beginPath(); g.arc(X+Math.cos(a)*2,Y+Math.sin(a)*2,1.7,0,TAU); g.fill(); } g.fillStyle='#fff6b0'; g.beginPath(); g.arc(X,Y,1.3,0,TAU); g.fill(); }); }
  return c;
}
function dirtTex(base,light,dark,seed,pebbles){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  mottle(g,R,[light,dark],60,10,34,.25);
  for(let i=0;i<(pebbles||90);i++){ const x=R()*TS, y=R()*TS, r=1.5+R()*3.5, cc=R()<.5?lt(base,.25):dk(base,.25); wrap(TS,x,y,r+2,(X,Y)=>{ g.fillStyle=cc; g.beginPath(); g.ellipse(X,Y,r,r*.7,R()*PI,0,TAU); g.fill(); g.strokeStyle='rgba(40,25,20,.35)'; g.lineWidth=1; g.stroke(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(X-r*.3,Y-r*.3,r*.3,0,TAU); g.fill(); }); }
  return c;
}
function cobbleTex(base,mortar,seed,cell){
  const c=canvas(TS,TS), g=texBase(c,mortar), R=rng(seed), n=cell||8, s=TS/n;
  for(let r=0;r<n;r++) for(let k=0;k<n;k++){ const x=(k+(r%2)*.5)*s, y=r*s; const cc=mix(base,R()<.5?'#ffffff':'#000000',R()*.18);
    wrap(TS,x+s/2,y+s/2,s,(X,Y)=>{ const w=s*.44, h=s*.4, j=()=>(R()-.5)*s*.08; g.fillStyle=cc; g.beginPath(); g.moveTo(X-w+j(),Y-h+j()); g.lineTo(X+w+j(),Y-h+j()); g.lineTo(X+w+j(),Y+h+j()); g.lineTo(X-w+j(),Y+h+j()); g.closePath(); g.fill();
      g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(X-w,Y-h,w*2,h*.35); g.strokeStyle='rgba(30,20,30,.25)'; g.lineWidth=1; g.stroke(); }); }
  mottle(g,R,['#000000','#ffffff'],30,10,30,.06);
  return c;
}
function sandTex(base,light,dark,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  mottle(g,R,[light,dark],30,20,50,.18);
  g.lineWidth=2; for(let i=0;i<22;i++){ const y0=R()*TS, ph=R()*TAU, amp=3+R()*4, len=40+R()*80, x0=R()*TS; g.strokeStyle=i%2?lt(light,.2):dark; g.globalAlpha=.35;
    wrap(TS,x0+len/2,y0,len,(X,Y)=>{ g.beginPath(); for(let k=0;k<=20;k++){ const x=X-len/2+k*len/20, y=Y+Math.sin(k/20*TAU+ph)*amp; k?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }); }
  g.globalAlpha=1; for(let i=0;i<300;i++){ g.fillStyle=R()<.5?lt(base,.3):dk(base,.2); g.fillRect(R()*TS,R()*TS,1.2,1.2); }
  return c;
}
function snowTex(base,shade,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  mottle(g,R,[shade,'#ffffff'],40,16,46,.25);
  for(let i=0;i<60;i++){ const x=R()*TS, y=R()*TS; g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(x,y,1.5,1.5); }
  for(let i=0;i<14;i++){ const x=R()*TS, y=R()*TS, r=6+R()*10; wrap(TS,x,y,r,(X,Y)=>{ g.strokeStyle='rgba(120,150,190,.25)'; g.lineWidth=1.5; g.beginPath(); g.arc(X,Y,r,.3,PI-.3); g.stroke(); }); }
  return c;
}
function basaltTex(base,light,crack,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  mottle(g,R,[light,dk(base,.3)],50,10,30,.3);
  for(let i=0;i<12;i++){ let x=R()*TS, y=R()*TS; const pts=[[x,y]]; for(let k=0;k<6;k++){ x+=(R()-.5)*40; y+=(R()-.5)*40; pts.push([x,y]); }
    wrap(TS,pts[0][0],pts[0][1],120,(X,Y)=>{ const ox=X-pts[0][0], oy=Y-pts[0][1]; g.lineCap='round'; g.lineJoin='round';
      [[6,'rgba(255,90,20,.25)'],[2.6,crack],[1,'#ffe08a']].forEach(q=>{ g.strokeStyle=q[1]; g.lineWidth=q[0]; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0]+ox,p[1]+oy):g.moveTo(p[0]+ox,p[1]+oy)); g.stroke(); }); }); }
  return c;
}
function cloudTex(base,shade,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed);
  for(let i=0;i<70;i++){ const x=R()*TS, y=R()*TS, r=10+R()*26; wrap(TS,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X-r*.3,Y-r*.4,0,X,Y,r); gr.addColorStop(0,'rgba(255,255,255,.75)'); gr.addColorStop(.7,'rgba(255,255,255,.25)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(X,Y,r,0,TAU); g.fill(); }); }
  mottle(g,R,[shade],18,20,40,.12);
  return c;
}
function marbleTex(base,line,seed){
  const c=canvas(TS,TS), g=texBase(c,base), R=rng(seed), n=4, s=TS/n;
  for(let r=0;r<n;r++) for(let k=0;k<n;k++){ g.fillStyle=mix(base,(r+k)%2?'#ffffff':'#d8d0ff',.35); g.fillRect(k*s,r*s,s,s); }
  g.strokeStyle='rgba(150,140,190,.25)'; g.lineWidth=1.2; for(let i=0;i<10;i++){ let x=R()*TS, y=R()*TS; g.beginPath(); g.moveTo(x,y); for(let k=0;k<5;k++){ x+=(R()-.3)*30; y+=(R()-.5)*20; g.lineTo(x,y); } g.stroke(); }
  g.strokeStyle=line; g.lineWidth=2.5; for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(0,i*s); g.lineTo(TS,i*s); g.stroke(); g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,TS); g.stroke(); }
  return c;
}
/* ---------------- decoração (motor 3D) ---------------- */
const DP=64;  // pixels por casa nos sprites de cenário
function sprite(w,h,fn){ const c=canvas(w,h), g=c.getContext('2d'); ART._set({PASS:'color',PPU:DP,AX:w/2,AY:h*.82,OW:2}); A.setRig(-PI/2,1,[0,0,0]); fn(g); A.flush(g); ART._set({OW:2.2}); return crop(c,w/2,h*.82); }
function crop(c,ax,ay){ const g=c.getContext('2d'), d=g.getImageData(0,0,c.width,c.height).data; let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(d[(y*c.width+x)*4+3]>4){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  if(x1<0) return {c,ax,ay}; x0=Math.max(0,x0-2); y0=Math.max(0,y0-2); x1=Math.min(c.width-1,x1+2); y1=Math.min(c.height-1,y1+2);
  const o=canvas(x1-x0+1,y1-y0+1); o.getContext('2d').drawImage(c,-x0,-y0); return {c:o,ax:ax-x0,ay:ay-y0}; }
const D={
  tree(f1,f2,trunk,s){ return sprite(150,190,g=>{ s=s||1; A.limb([0,0,0],[0,0,.55*s],.09*s,.07*s,trunk||'#7a4f2a'); [[0,0,.85,.42],[-.25,.05,.7,.3],[.26,.02,.72,.3],[0,-.12,1.1,.3],[.05,.15,.72,.28]].forEach((q,i)=>A.ball([q[0]*s,q[1]*s,q[2]*s],[q[3]*s,q[3]*s,q[3]*s*.9],i%2?f2:f1,{hl:.3})); }); },
  pine(c1,c2,snow,s){ return sprite(130,200,g=>{ s=s||1; A.limb([0,0,0],[0,0,.3*s],.07*s,.06*s,'#6a4426'); [[.2,.45,.55],[.5,.38,.5],[.78,.3,.45],[1.02,.2,.4]].forEach((q,i)=>{ const cz=q[0]*s; cone3([0,0,cz],q[1]*s,q[2]*s,i%2?c2:c1); if(snow) cone3([0,0,cz+q[2]*s*.45],q[1]*s*.55,q[2]*s*.55,'#f4f8ff',.002); }); }); },
  rock(c,s,n){ return sprite(130,110,g=>{ s=s||1; const R=rng(Math.floor(s*1000)+(n||0)); [[0,0,.18,.3,.22],[-.22,.08,.12,.2,.15],[.2,.1,.1,.18,.13]].slice(0,n||3).forEach(q=>A.ball([q[0]*s,q[1]*s,q[2]*s],[q[3]*s,q[3]*s*.9,q[4]*s],mix(c,'#ffffff',R()*.15),{hl:.25,sh:.4})); }); },
  bush(c1,c2,berry){ return sprite(110,100,g=>{ [[-.15,0,.15,.2],[.15,.02,.15,.2],[0,-.05,.25,.22]].forEach((q,i)=>A.ball([q[0],q[1],q[2]],[q[3],q[3],q[3]*.85],i%2?c2:c1)); if(berry) [[-.1,.18,.22],[.12,.17,.3],[.02,.2,.12]].forEach(q=>A.ball(q,[.035,.035,.035],berry,{bias:.2,ow:1})); }); },
  mushroom(){ return sprite(90,100,g=>{ [[0,0,1],[.18,.08,.7]].forEach(q=>{ A.limb([q[0],q[1],0],[q[0],q[1],.2*q[2]],.05*q[2],.045*q[2],'#f2e6cf'); A.ball([q[0],q[1],.22*q[2]],[.15*q[2],.15*q[2],.08*q[2]],'#e0453a',{after:null}); A.at([q[0],q[1]+.08*q[2],.27*q[2]],.1,(g,x,y,s)=>{ g.fillStyle='#fff'; [[-.05,0],[.04,-.02],[0,.03]].forEach(d=>{ g.beginPath(); g.arc(x+d[0]*s*q[2]*2,y+d[1]*s*q[2]*2,1.8*q[2],0,TAU); g.fill(); }); }); }); }); },
  column(c,broken,s){ return sprite(110,200,g=>{ s=s||1; const h=(broken?.55:1.1)*s; cylS([0,0,0],.2*s,.08*s,dk(c,.1)); cylS([0,0,.08*s],.15*s,h,c,4); if(!broken) cylS([0,0,.08*s+h],.21*s,.08*s,dk(c,.05)); else A.ball([.05,0,.08*s+h],[.15*s,.15*s,.05*s],lt(c,.05)); A.ball([.1*s,.1*s,.2*s],[.07,.03,.08],'#5f9a3a',{bias:.2}); }); },
  rubble(c){ return sprite(130,90,g=>{ const R=rng(7); for(let i=0;i<6;i++){ const x=(R()-.5)*.6, y=(R()-.5)*.35; A.box ? 0:0; boxS([x,y,0],[.16+R()*.08,.14+R()*.08,.1+R()*.08],mix(c,'#000',R()*.2)); } }); },
  statue(c){ return sprite(120,220,g=>{ boxS([0,0,0],[.4,.4,.25],dk(c,.1)); A.ball([0,0,.45],[.13,.1,.18],c); A.ball([0,0,.72],[.11,.11,.11],c); A.limb([.12,0,.55],[.2,.1,.85],.04,.035,c); A.blade([.2,.1,.85],[.22,.12,1.25],.03,.02,lt(c,.1),{tip:.05}); A.ball([-.08,.02,.5],[.06,.1,.2],'#5f9a3a',{bias:.2}); }); },
  cactus(c){ return sprite(110,180,g=>{ A.limb([0,0,0],[0,0,.75],.11,.1,c); A.ball([0,0,.76],[.1,.1,.08],lt(c,.08)); A.limb([.08,0,.35],[.22,0,.4],.06,.06,c); A.limb([.22,0,.38],[.22,0,.6],.06,.055,c); A.limb([-.08,0,.45],[-.2,0,.48],.055,.055,c); A.limb([-.2,0,.46],[-.2,0,.62],.055,.05,c); A.ball([0,.02,.85],[.05,.05,.04],'#ff7aa8',{bias:.1}); }); },
  palm(){ return sprite(170,220,g=>{ const pts=[[0,0,0],[.04,0,.3],[.1,0,.6],[.12,0,.85]]; for(let i=0;i<3;i++) A.limb(pts[i],pts[i+1],.07-.01*i,.06-.01*i,'#a07a4a'); const top=pts[3]; for(let i=0;i<6;i++){ const a=i/6*TAU; const tip=[top[0]+Math.cos(a)*.42,top[1]+Math.sin(a)*.42,top[2]-.18]; A.poly([top,[top[0]+Math.cos(a+.3)*.2,top[1]+Math.sin(a+.3)*.2,top[2]+.05],tip,[top[0]+Math.cos(a-.3)*.2,top[1]+Math.sin(a-.3)*.2,top[2]+.05]],i%2?'#4f9a3a':'#3f8a32'); } A.ball([top[0],top[1]+.04,top[2]-.06],[.05,.05,.05],'#7a4a26',{bias:.1}); }); },
  bones(){ return sprite(110,80,g=>{ A.ball([0,0,.08],[.1,.09,.08],'#efe8d6'); A.at([0,.09,.08],.1,(g,x,y,s)=>{ g.fillStyle='#3a2a2a'; g.beginPath(); g.arc(x-3,y,2,0,TAU); g.arc(x+3,y,2,0,TAU); g.fill(); }); A.limb([-.25,.05,.03],[-.05,.12,.03],.025,.025,'#efe8d6'); A.limb([.08,-.1,.03],[.28,.02,.03],.025,.025,'#efe8d6'); }); },
  snowman(){ return sprite(100,160,g=>{ A.ball([0,0,.14],[.17,.17,.15],'#f6f9ff'); A.ball([0,0,.38],[.12,.12,.11],'#f6f9ff'); A.ball([0,0,.56],[.09,.09,.09],'#f6f9ff'); A.ball([0,.09,.56],[.02,.06,.02],'#ff8a2a',{bias:.1,axes:[[1,0,0],[0,1,0],[0,0,1]]}); A.eyes([0,0,.56],.09,{sp:.4}); A.limb([0,0,.64],[0,0,.7],.07,.07,'#2a2a36'); }); },
  ice(c){ return sprite(110,170,g=>{ [[0,0,.8,.12],[-.15,.05,.5,.08],[.14,.02,.55,.08]].forEach((q,i)=>{ prism([q[0],q[1],0],q[3],q[2],i%2?lt(c,.2):c); }); }); },
  deadtree(){ return sprite(140,190,g=>{ const c='#3a2e2a'; A.limb([0,0,0],[0,0,.6],.08,.05,c); A.limb([0,0,.4],[.25,.05,.7],.04,.02,c); A.limb([0,0,.5],[-.2,0,.8],.035,.015,c); A.limb([0,0,.6],[.05,.0,.9],.03,.012,c); A.limb([.15,.03,.55],[.3,0,.55],.02,.01,c); }); },
  obsidian(){ return sprite(110,150,g=>{ [[0,0,.6,.12],[-.14,.06,.35,.08],[.13,0,.42,.09]].forEach((q,i)=>prism([q[0],q[1],0],q[3],q[2],i%2?'#4a3a5e':'#2e2440',null,'#ff7a2a')); }); },
  lavapool(){ return sprite(160,100,g=>{ A.disc([0,0,.02],[0,0,1],.42,'#3a2a26',{th:.03}); A.disc([0,0,.035],[0,0,1],.34,'#ff7a1a',{noOut:true,after:(g,E)=>{ const gr=g.createRadialGradient(E.x,E.y,0,E.x,E.y,E.s1); gr.addColorStop(0,'#ffe08a'); gr.addColorStop(.6,'#ff9a2a'); gr.addColorStop(1,'#d8401a'); g.fillStyle=gr; g.beginPath(); g.ellipse(E.x,E.y,E.s1,E.s2,E.th,0,TAU); g.fill(); ART.glowAt(g,E.x,E.y,E.s1*1.6,'#ff8a2a',.6); g.fillStyle='rgba(255,255,220,.7)'; g.beginPath(); g.arc(E.x-E.s1*.3,E.y-E.s2*.2,3,0,TAU); g.arc(E.x+E.s1*.25,E.y+E.s2*.1,2,0,TAU); g.fill(); }}); }); },
  cloud(c){ return sprite(170,120,g=>{ [[0,0,.18,.26],[-.24,.05,.12,.18],[.25,.02,.12,.19],[.08,-.1,.26,.18],[-.1,.12,.1,.16]].forEach(q=>A.ball([q[0],q[1],q[2]],[q[3],q[3]*.9,q[3]*.75],c||'#ffffff',{hl:.5,sh:.15})); }); },
  crystal(c){ return sprite(110,170,g=>{ prism([0,0,.18],.11,.5,c,null,'#ffffff'); A.disc([0,0,.08],[0,0,1],.2,'#e8e4ff',{th:.06}); A.glow([0,0,.45],.5,c,.5); }); },
  flowers(){ return sprite(100,70,g=>{ const R=rng(3); for(let i=0;i<7;i++){ const x=(R()-.5)*.5, y=(R()-.5)*.3; A.limb([x,y,0],[x,y,.12],.01,.01,'#3f8a32'); A.ball([x,y,.13],[.035,.035,.025],['#ff6a8a','#ffd84a','#ffffff','#b58cff'][i%4],{ow:1.2}); } }); },
  log(){ return sprite(150,80,g=>{ A.limb([-.3,0,.08],[.3,.05,.08],.08,.08,'#8a5a32'); A.disc([.31,.05,.08],[1,.1,0],.08,'#d9b07a',{th:.0}); A.ball([-.1,.02,.16],[.06,.04,.02],'#5f9a3a',{bias:.1}); }); },
};
function cone3(c,r,h,color,bias){ const s=1, b=A.P(A.W_(c)), tp=A.P(A.W_([c[0],c[1],c[2]+h])), rx=r*DP, ry=r*DP*.55;
  A.op(b[2]+(bias||0),g=>{ g.beginPath(); g.moveTo(b[0]-rx,b[1]); g.lineTo(tp[0],tp[1]); g.lineTo(b[0]+rx,b[1]); g.ellipse(b[0],b[1],rx,ry,0,0,PI); g.closePath(); const gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0); gr.addColorStop(0,lt(color,.25)); gr.addColorStop(.45,color); gr.addColorStop(1,dk(color,.35)); g.fillStyle=gr; g.fill(); g.lineWidth=2; g.lineJoin='round'; g.strokeStyle=OUT; g.stroke(); }); }
function cylS(c,r,h,color,flutes){ const b=A.P(A.W_(c)), tp=A.P(A.W_([c[0],c[1],c[2]+h])), rx=r*DP, ry=r*DP*.6;
  A.op(b[2],g=>{ g.beginPath(); g.moveTo(b[0]-rx,b[1]); g.lineTo(tp[0]-rx,tp[1]); g.ellipse(tp[0],tp[1],rx,ry,0,PI,0,true); g.lineTo(b[0]+rx,b[1]); g.ellipse(b[0],b[1],rx,ry,0,0,PI); g.closePath(); const gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0); gr.addColorStop(0,lt(color,.2)); gr.addColorStop(.4,color); gr.addColorStop(1,dk(color,.35)); g.fillStyle=gr; g.fill(); g.lineWidth=2; g.strokeStyle=OUT; g.stroke();
    if(flutes){ g.strokeStyle='rgba(40,30,50,.25)'; g.lineWidth=1.2; for(let i=1;i<flutes;i++){ const x=b[0]-rx+2*rx*i/flutes; g.beginPath(); g.moveTo(x,b[1]+ry*.6); g.lineTo(x,tp[1]+ry*.6); g.stroke(); } }
    g.beginPath(); g.ellipse(tp[0],tp[1],rx,ry,0,0,TAU); g.fillStyle=lt(color,.15); g.fill(); g.lineWidth=2; g.strokeStyle=OUT; g.stroke(); }); }
function boxS(c,sz,color){ const hx=sz[0]/2, hy=sz[1]/2, h=sz[2]; const p=v=>A.P(A.W_([c[0]+v[0],c[1]+v[1],c[2]+v[2]]));
  const top=[[-hx,-hy,h],[hx,-hy,h],[hx,hy,h],[-hx,hy,h]].map(p), front=[[-hx,hy,0],[hx,hy,0],[hx,hy,h],[-hx,hy,h]].map(p), d=A.P(A.W_(c))[2];
  A.op(d,g=>{ [[front,dk(color,.15)],[top,lt(color,.1)]].forEach(q=>{ g.beginPath(); q[0].forEach((v,i)=>i?g.lineTo(v[0],v[1]):g.moveTo(v[0],v[1])); g.closePath(); g.fillStyle=q[1]; g.fill(); g.lineWidth=1.8; g.lineJoin='round'; g.strokeStyle=OUT; g.stroke(); }); }); }
function prism(c,r,h,color,_,glowC){ const b=A.P(A.W_(c)), tp=A.P(A.W_([c[0],c[1],c[2]+h])), rx=r*DP, ry=r*DP*.55;
  A.op(b[2],g=>{ const pts=[[b[0]-rx,b[1]],[b[0]-rx*.9,b[1]-(b[1]-tp[1])*.75],[tp[0],tp[1]],[b[0]+rx*.9,b[1]-(b[1]-tp[1])*.75],[b[0]+rx,b[1]],[b[0],b[1]+ry]];
    g.beginPath(); pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.closePath(); const gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0); gr.addColorStop(0,lt(color,.35)); gr.addColorStop(.5,color); gr.addColorStop(.5,dk(color,.15)); gr.addColorStop(1,dk(color,.35)); g.fillStyle=gr; g.fill(); g.lineWidth=2; g.lineJoin='round'; g.strokeStyle=OUT; g.stroke();
    g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(b[0],b[1]+ry); g.lineTo(b[0],b[1]-(b[1]-tp[1])*.75); g.lineTo(tp[0],tp[1]); g.stroke();
    if(glowC) ART.glowAt(g,b[0],b[1]-(b[1]-tp[1])*.5,rx*2.2,glowC,.35); }); }
/* ponto de construção e praça */
function padSprite(stone,rune){ return sprite(130,100,g=>{ A.disc([0,0,.06],[0,0,1],.44,stone,{th:.06,rim:dk(stone,.3),after:(g,E)=>{ g.strokeStyle='rgba(40,25,40,.35)'; g.lineWidth=1.3; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.7,E.s2*.7,0,0,TAU); g.stroke(); for(let i=0;i<8;i++){ const a=i*PI/4; g.beginPath(); g.moveTo(E.x+Math.cos(a)*E.s1*.7,E.y+Math.sin(a)*E.s2*.7); g.lineTo(E.x+Math.cos(a)*E.s1,E.y+Math.sin(a)*E.s2); g.stroke(); } g.strokeStyle=rune; g.lineWidth=2; g.globalAlpha=.8; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.4,E.s2*.4,0,0,TAU); g.stroke(); g.beginPath(); for(let i=0;i<3;i++){ const a=-PI/2+i*TAU/3; g.lineTo(E.x+Math.cos(a)*E.s1*.38,E.y+Math.sin(a)*E.s2*.38); } g.closePath(); g.stroke(); }}); }); }
function plazaSprite(stone,line){ const c=canvas(360,220), g=c.getContext('2d'); const x=180,y=110, rx=170, ry=100;
  g.fillStyle='rgba(20,10,30,.25)'; g.beginPath(); g.ellipse(x,y+6,rx,ry,0,0,TAU); g.fill();
  g.save(); g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.clip(); g.fillStyle=stone; g.fillRect(0,0,360,220);
  for(let r=1;r<5;r++){ g.strokeStyle=line; g.lineWidth=1.5; g.beginPath(); g.ellipse(x,y,rx*r/5,ry*r/5,0,0,TAU); g.stroke(); for(let i=0;i<r*6;i++){ const a=i/(r*6)*TAU+(r%2)*.2; g.beginPath(); g.moveTo(x+Math.cos(a)*rx*(r-1)/5,y+Math.sin(a)*ry*(r-1)/5); g.lineTo(x+Math.cos(a)*rx*r/5,y+Math.sin(a)*ry*r/5); g.stroke(); } }
  g.restore(); g.lineWidth=4; g.strokeStyle=dk(stone,.35); g.beginPath(); g.ellipse(x,y,rx-2,ry-2,0,0,TAU); g.stroke();
  return {c,ax:x,ay:y}; }
function patchSprite(kind){ return sprite(140,90,g=>{
  if(kind==='lama'){ A.disc([0,0,.01],[0,0,1],.42,'#6a4a2a',{noOut:true,after:(g,E)=>{ g.fillStyle='#5a3a1e'; g.beginPath(); g.ellipse(E.x,E.y,E.s1*.75,E.s2*.7,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(E.x-E.s1*.3,E.y-E.s2*.2,E.s1*.18,E.s2*.12,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(E.x+E.s1*.25,E.y+E.s2*.15,E.s1*.1,E.s2*.07,0,0,TAU); g.fill(); }}); }
  else if(kind==='entulho'){ const R=rng(11); for(let i=0;i<7;i++) boxS([(R()-.5)*.6,(R()-.5)*.4,0],[.1+R()*.1,.1+R()*.08,.05+R()*.06],mix('#9a9488','#000',R()*.25)); }
  else if(kind==='areia'){ A.disc([0,0,.01],[0,0,1],.42,'#e8c886',{noOut:true,after:(g,E)=>{ g.strokeStyle='rgba(160,110,50,.5)'; g.lineWidth=2; for(let k=1;k<4;k++){ g.beginPath(); g.ellipse(E.x,E.y,E.s1*k/4,E.s2*k/4,0,0,TAU*.8+k); g.stroke(); } }}); }
  else if(kind==='neve'){ [[0,0,.1,.3],[-.2,.05,.07,.18],[.22,.0,.07,.2]].forEach(q=>A.ball([q[0],q[1],0],[q[3],q[3]*.8,q[2]],'#f4f8ff',{hl:.6,sh:.2})); }
  else if(kind==='cinzas'){ A.disc([0,0,.01],[0,0,1],.42,'#5a5250',{noOut:true,after:(g,E)=>{ for(let i=0;i<9;i++){ const a=i*.7, r=(i%3+1)/4; g.fillStyle=i%3?'#ff8a2a':'#ffd06a'; g.beginPath(); g.arc(E.x+Math.cos(a)*E.s1*r*.8,E.y+Math.sin(a)*E.s2*r*.8,1.6,0,TAU); g.fill(); } }}); [[-.15,0,.05,.15],[.15,.05,.05,.13]].forEach(q=>A.ball([q[0],q[1],0],[q[3],q[3]*.8,q[2]],'#6a6260',{sh:.3})); }
  else { [[0,0,.08,.26],[-.2,.06,.06,.16],[.2,.02,.06,.17]].forEach(q=>A.ball([q[0],q[1],0],[q[3],q[3]*.85,q[2]+.05],'#ffffff',{hl:.6,sh:.12})); }
}); }
/* ---------------- temas ---------------- */
const THEMES={
  floresta:{tex:()=>[grassTex('#79c257','#94d86c','#5ea544',['#ff8aa8','#ffe16a','#ffffff'],1),dirtTex('#d9b27a','#e6c48e','#c09460',2)],
    top:'#5f9e46', cliff:'#6b4f33', cliffD:'#4d3824', edge:'#b08a58', amb:'#ffffcc',
    decor:()=>[[D.tree('#4fae45','#3f9a3a'),5,1.05],[D.tree('#62bd4c','#4aa443','#6a4426',1.1),4,1.1],[D.pine('#2f8a4a','#3f9a52'),4,1.05],[D.bush('#4fae45','#3a9a3a','#ff4a6a'),3,.8],[D.rock('#9a9a9a',.9),2,.8],[D.mushroom(),2,.6],[D.flowers(),2,.6],[D.log(),1,.8]],
    patch:()=>[patchSprite('lama')], pad:['#b8b2a6','#ffe066'], plaza:['#c9c2b2','rgba(80,60,40,.35)']},
  ruinas:{tex:()=>[grassTex('#8fb860','#a6c878','#759e4c',['#ffffff','#e6d27a'],3),cobbleTex('#b9b1a2','#7a7266',4,8)],
    top:'#7aa25a', cliff:'#8a8276', cliffD:'#625b52', edge:'#9e9686', amb:'#fff0d8',
    decor:()=>[[D.column('#d6cfbf'),4,1.0],[D.column('#cfc8b8',1),4,1.0],[D.rubble('#a69e90'),3,.9],[D.statue('#bdb6a6'),2,1.0],[D.tree('#6fae4a','#5a9a40'),3,1.05],[D.bush('#6aa84a','#5a9a40'),3,.8],[D.rock('#a09a90',1),2,.8]],
    patch:()=>[patchSprite('entulho')], pad:['#c9c2b2','#ffd34d'], plaza:['#cfc8b8','rgba(70,60,50,.35)']},
  deserto:{tex:()=>[sandTex('#ecc985','#f6dca0','#d6ad66',5),cobbleTex('#d8b07a','#a8804a',6,6)],
    top:'#e0b874', cliff:'#b9824a', cliffD:'#8f5e30', edge:'#c9965a', amb:'#ffe4a0',
    decor:()=>[[D.cactus('#5aa04a'),4,1.0],[D.palm(),3,1.15],[D.rock('#c99a62',1.1),4,.9],[D.rock('#b8865a',.8,2),3,.8],[D.bones(),2,.7],[D.bush('#9aa04a','#7a8a3a'),2,.7]],
    patch:()=>[patchSprite('areia')], pad:['#d9c29a','#ffd34d'], plaza:['#e0c89a','rgba(120,80,40,.35)']},
  montanha:{tex:()=>[snowTex('#eef4fb','#c6d6ea',7),dirtTex('#a9b4c4','#c0cad8','#8894a6',8,70)],
    top:'#f4f8ff', cliff:'#8090a8', cliffD:'#5e6a82', edge:'#b8c4d6', amb:'#ffffff',
    decor:()=>[[D.pine('#2f7a5a','#3a8a64',1),6,1.1],[D.pine('#2a6a52','#357a5a',1,.8),4,1.0],[D.rock('#9aa6b8',1),3,.9],[D.ice('#a8e0ff'),3,.9],[D.snowman(),1,.8]],
    patch:()=>[patchSprite('neve')], pad:['#b8c2d0','#9fe3ff'], plaza:['#c8d2e0','rgba(60,70,100,.3)']},
  lava:{tex:()=>[basaltTex('#4a3e3c','#5e504c','#ff6a1a',9),dirtTex('#7a6a64','#8a7a74','#5e504c',10,60)],
    top:'#3a302e', cliff:'#2a2120', cliffD:'#1a1414', edge:'#5a4a46', amb:'#ff9a4a',
    decor:()=>[[D.rock('#5a4a46',1.1),4,.95],[D.obsidian(),4,.9],[D.deadtree(),3,1.0],[D.lavapool(),3,1.0],[D.rock('#6a5a54',.8,2),3,.8]],
    patch:()=>[patchSprite('cinzas')], pad:['#7a6a64','#ff8a3a'], plaza:['#7a6e6a','rgba(255,120,40,.35)']},
  ceu:{tex:()=>[cloudTex('#d8e8ff','#a8c0f0',11),marbleTex('#f4f0ff','#e8c45a',12)],
    top:'#ffffff', cliff:'#9ab0e0', cliffD:'#7088c0', edge:'#c8d8ff', amb:'#ffffff',
    decor:()=>[[D.cloud(),6,1.1],[D.cloud('#f0f4ff'),4,.9],[D.column('#f4f0ff'),3,1.0],[D.column('#ece8ff',1),2,1.0],[D.crystal('#b58cff'),3,.9],[D.crystal('#7ad7ff'),2,.9]],
    patch:()=>[patchSprite('nuvem')], pad:['#ece8ff','#e8c45a'], plaza:['#f0ecff','rgba(200,170,80,.45)']},
};
/* atlas do tema: [chão][trilha] + decorações + manchas + ponto + praça */
function theme(id){
  const T=THEMES[id], tex=T.tex(), deco=T.decor(), patches=T.patch(), pad=padSprite(T.pad[0],T.pad[1]), plaza=plazaSprite(T.plaza[0],T.plaza[1]);
  const items=[].concat(deco.map(d=>d[0]),patches,[pad,plaza]);
  const W=2048; let x=0,y=TS+4,rowH=0; const pos=[];
  items.forEach(it=>{ const w=it.c.width, h=it.c.height; if(x+w>W){ x=0; y+=rowH+2; rowH=0; } pos.push([x,y]); x+=w+2; rowH=Math.max(rowH,h); });
  const H=y+rowH, c=canvas(W,H), g=c.getContext('2d');
  g.drawImage(tex[0],0,0); g.drawImage(tex[1],TS+4,0);
  items.forEach((it,i)=>g.drawImage(it.c,pos[i][0],pos[i][1]));
  const R=(i)=>({r:[pos[i][0],pos[i][1],items[i].c.width,items[i].c.height],ax:items[i].ax,ay:items[i].ay});
  const meta={w:W,h:H,ppu:DP,ground:[0,0,TS,TS],road:[TS+4,0,TS,TS],theme:{top:T.top,cliff:T.cliff,cliffD:T.cliffD,edge:T.edge,amb:T.amb},
    decor:deco.map((d,i)=>Object.assign(R(i),{wt:d[1],sz:d[2]})),patch:patches.map((p,k)=>R(deco.length+k)),pad:R(deco.length+patches.length),plaza:R(deco.length+patches.length+1)};
  return {img:c.toDataURL('image/webp',.9),meta};
}
/* ---------------- ícones dos feitiços ---------------- */
function icon(g,key,S){
  const c=S/2; g.save(); g.lineJoin='round'; g.lineCap='round';
  const O=(w)=>{ g.lineWidth=w||5; g.strokeStyle=OUT; g.stroke(); };
  const rg=(x,y,r,a,b)=>{ const q=g.createRadialGradient(x-r*.3,y-r*.35,0,x,y,r); q.addColorStop(0,a); q.addColorStop(1,b); return q; };
  switch(key){
    case 'espinhos': {
      g.fillStyle='#7a5a3a'; g.beginPath(); g.ellipse(c,c+52,78,24,0,0,TAU); g.fill(); O();
      [[-48,30,.8],[48,28,.85],[-22,10,1],[24,6,1.05],[0,-6,1.2],[-60,40,.6],[62,40,.6]].forEach(q=>{ const x=c+q[0], y=c+52, h=110*q[2];
        g.beginPath(); g.moveTo(x-16*q[2],y-q[1]*.2); g.lineTo(x+2,y-h+q[1]*.2); g.lineTo(x+16*q[2],y-q[1]*.2); g.closePath(); const gr=g.createLinearGradient(x-16,0,x+16,0); gr.addColorStop(0,'#f2f6fa'); gr.addColorStop(.5,'#c9d3dd'); gr.addColorStop(1,'#7f8c99'); g.fillStyle=gr; g.fill(); O(4); });
      break; }
    case 'runa': {
      ART.glowAt(g,c,c,90,'#b58cff',.7);
      g.beginPath(); g.arc(c,c,62,0,TAU); g.fillStyle=rg(c,c,62,'#e8d8ff','#7a4ad8'); g.fill(); O(6);
      g.strokeStyle='#ffffff'; g.lineWidth=5; g.beginPath(); g.arc(c,c,46,0,TAU); g.stroke();
      g.beginPath(); for(let i=0;i<3;i++){ const a=-PI/2+i*TAU/3; g.lineTo(c+Math.cos(a)*42,c+Math.sin(a)*42); } g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(c,c-24); g.lineTo(c,c+20); g.moveTo(c-12,c-6); g.lineTo(c+12,c+6); g.stroke();
      break; }
    case 'selo_gelo': {
      ART.glowAt(g,c,c,90,'#9fe3ff',.6);
      g.beginPath(); for(let i=0;i<6;i++){ const a=i*PI/3; g.lineTo(c+Math.cos(a)*66,c+Math.sin(a)*66); } g.closePath(); g.fillStyle=rg(c,c,66,'#ffffff','#5ab8e8'); g.fill(); O(6);
      g.strokeStyle='#ffffff'; g.lineWidth=7; for(let i=0;i<3;i++){ const a=i*PI/3; g.beginPath(); g.moveTo(c-Math.cos(a)*48,c-Math.sin(a)*48); g.lineTo(c+Math.cos(a)*48,c+Math.sin(a)*48); g.stroke(); }
      g.lineWidth=5; for(let i=0;i<6;i++){ const a=i*PI/3, x=c+Math.cos(a)*30, y=c+Math.sin(a)*30; [-1,1].forEach(s=>{ g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a+s*.9)*14,y+Math.sin(a+s*.9)*14); g.stroke(); }); }
      break; }
    case 'rede': {
      g.save(); g.beginPath(); g.arc(c,c,66,0,TAU); g.fillStyle='rgba(232,217,168,.35)'; g.fill(); g.clip();
      g.strokeStyle='#e8d9a8'; g.lineWidth=6; for(let i=-4;i<=4;i++){ g.beginPath(); g.moveTo(c+i*17-80,c-80); g.lineTo(c+i*17+80,c+80); g.stroke(); g.beginPath(); g.moveTo(c+i*17+80,c-80); g.lineTo(c+i*17-80,c+80); g.stroke(); }
      g.restore(); g.beginPath(); g.arc(c,c,66,0,TAU); g.lineWidth=7; g.strokeStyle='#a8875a'; g.stroke(); O(3);
      for(let i=0;i<8;i++){ const a=i*PI/4; g.beginPath(); g.arc(c+Math.cos(a)*68,c+Math.sin(a)*68,9,0,TAU); g.fillStyle=rg(c+Math.cos(a)*68,c+Math.sin(a)*68,9,'#a6adb8','#4a4f5a'); g.fill(); O(3); }
      break; }
    case 'tempestade': {
      g.beginPath(); g.moveTo(c+6,c+2); g.lineTo(c-22,c+52); g.lineTo(c+2,c+46); g.lineTo(c-14,c+90); g.lineTo(c+34,c+30); g.lineTo(c+8,c+36); g.lineTo(c+24,c+2); g.closePath(); g.fillStyle='#ffe66b'; g.fill(); O(5);
      ART.glowAt(g,c,c+40,60,'#bfd6ff',.6);
      [[-38,-14,40],[30,-18,44],[0,-36,48],[-6,-4,44]].forEach(q=>{ g.beginPath(); g.arc(c+q[0],c+q[1],q[2],0,TAU); g.fillStyle=rg(c+q[0],c+q[1],q[2],'#a8b4cc','#5a6684'); g.fill(); });
      g.beginPath(); [[-38,-14,40],[30,-18,44],[0,-36,48],[-6,-4,44]].forEach(q=>{ g.moveTo(c+q[0]+q[2],c+q[1]); g.arc(c+q[0],c+q[1],q[2],0,TAU); }); g.lineWidth=5; g.strokeStyle=OUT; g.globalCompositeOperation='destination-over'; g.stroke(); g.globalCompositeOperation='source-over';
      g.strokeStyle='#9fc0ff'; g.lineWidth=4; [[-50,40],[44,36],[60,60]].forEach(q=>{ g.beginPath(); g.moveTo(c+q[0],c+q[1]); g.lineTo(c+q[0]-6,c+q[1]+18); g.stroke(); });
      break; }
    case 'bola_fogo': { g.translate(c,c); g.scale(.82,.82); g.translate(-c,-c);
      ART.glowAt(g,c+10,c+10,95,'#ff8a1f',.8);
      g.beginPath(); g.moveTo(c-80,c-70); g.quadraticCurveTo(c-20,c-40,c+40,c-30); g.arc(c+20,c+20,52,-1.2,2.1); g.quadraticCurveTo(c-40,c+20,c-80,c-70); g.fillStyle='#ff6a1f'; g.fill(); O(5);
      g.beginPath(); g.moveTo(c-50,c-44); g.quadraticCurveTo(c-10,c-20,c+30,c-14); g.arc(c+20,c+20,34,-1.2,2.1); g.quadraticCurveTo(c-30,c+14,c-50,c-44); g.fillStyle='#ffb02e'; g.fill();
      g.beginPath(); g.arc(c+22,c+22,22,0,TAU); g.fillStyle='#fff3b0'; g.fill();
      break; }
    case 'raio_arcano': {
      ART.glowAt(g,c,c,95,'#ffe66b',.7);
      g.beginPath(); g.moveTo(c+30,c-86); g.lineTo(c-36,c+6); g.lineTo(c-2,c+6); g.lineTo(c-30,c+88); g.lineTo(c+44,c-14); g.lineTo(c+8,c-14); g.lineTo(c+40,c-86); g.closePath();
      const gr=g.createLinearGradient(c-40,0,c+40,0); gr.addColorStop(0,'#fff8c0'); gr.addColorStop(1,'#ffc21f'); g.fillStyle=gr; g.fill(); O(6);
      [[-60,-40],[62,30],[-50,60],[58,-60]].forEach(q=>{ g.fillStyle='#fff6a8'; g.beginPath(); for(let i=0;i<8;i++){ const a=i*PI/4, r=i%2?4:12; g.lineTo(c+q[0]+Math.cos(a)*r,c+q[1]+Math.sin(a)*r); } g.closePath(); g.fill(); });
      break; }
    case 'bencao': {
      ART.glowAt(g,c,c,95,'#7cffb0',.7);
      g.strokeStyle='#ffe27a'; g.lineWidth=8; g.beginPath(); g.ellipse(c,c-58,44,13,0,0,TAU); g.stroke();
      g.beginPath(); g.moveTo(c,c+70); g.bezierCurveTo(c-90,c+10,c-60,c-60,c,c-24); g.bezierCurveTo(c+60,c-60,c+90,c+10,c,c+70); g.closePath(); g.fillStyle=rg(c,c,80,'#ffc0d0','#ff5a7a'); g.fill(); O(6);
      g.fillStyle='#fff'; g.fillRect(c-8,c-14,16,52); g.fillRect(c-26,c+4,52,16);
      break; }
    case 'muralha_gelo': {
      ART.glowAt(g,c,c,90,'#bfefff',.5);
      [[-56,.75],[56,.75],[-20,.95],[22,1]].forEach(q=>{ const x=c+q[0], y=c+70, h=140*q[1], w=26;
        g.beginPath(); g.moveTo(x-w,y); g.lineTo(x-w,y-h*.7); g.lineTo(x,y-h); g.lineTo(x+w,y-h*.7); g.lineTo(x+w,y); g.closePath(); const gr=g.createLinearGradient(x-w,0,x+w,0); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,'#bfefff'); gr.addColorStop(1,'#5ab8e8'); g.fillStyle=gr; g.fill(); O(5);
        g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=3; g.beginPath(); g.moveTo(x-w*.4,y-10); g.lineTo(x-w*.4,y-h*.6); g.stroke(); });
      break; }
    case 'silencio': {
      ART.glowAt(g,c,c,90,'#b58cff',.6);
      g.beginPath(); g.arc(c,c-4,62,0,TAU); g.fillStyle=rg(c,c,62,'#e2d2ff','#8e5bff'); g.fill(); O(6);
      g.beginPath(); g.moveTo(c-30,c+50); g.lineTo(c-50,c+82); g.lineTo(c,c+56); g.closePath(); g.fillStyle='#8e5bff'; g.fill(); O(5);
      g.strokeStyle=OUT; g.lineWidth=9; g.beginPath(); g.moveTo(c-34,c-4); g.lineTo(c+34,c-4); g.stroke();
      g.strokeStyle='#ff4a6a'; g.lineWidth=11; g.beginPath(); g.moveTo(c-52,c-58); g.lineTo(c+52,c+48); g.stroke();
      break; }
    case 'furia': {
      ART.glowAt(g,c,c+10,95,'#ff3a5a',.7);
      g.beginPath(); g.moveTo(c-18,c-74); g.lineTo(c+18,c-74); g.lineTo(c+18,c-38); g.bezierCurveTo(c+70,c-20,c+72,c+76,c,c+80); g.bezierCurveTo(c-72,c+76,c-70,c-20,c-18,c-38); g.closePath();
      g.fillStyle=rg(c,c+20,80,'#ff9aa8','#c8102e'); g.fill(); O(6);
      g.fillStyle='#8a5a32'; g.fillRect(c-22,c-90,44,20); g.strokeStyle=OUT; g.lineWidth=5; g.strokeRect(c-22,c-90,44,20);
      g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(c-28,c+10,8,24,-.3,0,TAU); g.fill();
      [[10,20,10],[-8,46,7],[24,50,6]].forEach(q=>{ g.beginPath(); g.arc(c+q[0],c+q[1],q[2],0,TAU); g.fillStyle='rgba(255,220,220,.8)'; g.fill(); });
      break; }
  }
  g.restore();
}
return {theme,icon,THEMES};
})();
