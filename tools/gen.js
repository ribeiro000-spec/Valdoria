/* Gerador de sprites do Valdoria (roda no navegador; o gerar.js usa o Playwright para salvar os arquivos). */
const SS=2, QB=.86, QM=.8, LOOP=1.2566;
function mkc(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function down(src,w,h){ const c=mkc(w,h), g=c.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(src,0,0,w,h); return c; }
function render(w,h,fn){ const c=mkc(w*SS,h*SS), g=c.getContext('2d'); g.scale(SS,SS); fn(g); return down(c,w,h); }
function mulb(seed){ let a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function hashS(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
/* luz de borda, sombra de contato e leve gradiente vertical (dá volume) */
function post(c,k){
  k=k||1; const w=c.width, h=c.height, o=mkc(w,h), g=o.getContext('2d'); g.drawImage(c,0,0);
  const r=mkc(w,h), rg=r.getContext('2d'); rg.drawImage(c,0,0); rg.globalCompositeOperation='destination-out'; rg.drawImage(c,1.7*k,1.7*k); rg.globalCompositeOperation='source-in'; rg.fillStyle='rgba(255,255,255,.45)'; rg.fillRect(0,0,w,h);
  const a=mkc(w,h), ag=a.getContext('2d'); ag.drawImage(c,0,0); ag.globalCompositeOperation='destination-out'; ag.drawImage(c,-2*k,-2*k); ag.globalCompositeOperation='source-in'; ag.fillStyle='rgba(30,10,60,.32)'; ag.fillRect(0,0,w,h);
  g.globalCompositeOperation='source-atop'; g.drawImage(r,0,0); g.drawImage(a,0,0);
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(255,255,255,.08)'); gr.addColorStop(.55,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(20,0,40,.14)'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  return o;
}
/* renderiza com equipe branca (base) e preta; a diferença vira a máscara de cor de equipe */
function pair(w,h,fn){
  const A=render(w,h,g=>fn(g,2)), Bk=render(w,h,g=>fn(g,3));
  const da=A.getContext('2d').getImageData(0,0,w,h), db=Bk.getContext('2d').getImageData(0,0,w,h);
  const m=mkc(w,h), mg=m.getContext('2d'), md=mg.createImageData(w,h);
  for(let i=0;i<da.data.length;i+=4){ const d=Math.abs(da.data[i]-db.data[i])+Math.abs(da.data[i+1]-db.data[i+1])+Math.abs(da.data[i+2]-db.data[i+2]); const a=d>40?255:d*6; md.data[i+3]=Math.min(da.data[i+3],Math.min(255,a)); }
  mg.putImageData(md,0,0);
  return {base:post(A),mask:m};
}
function bbox(c){ const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data; let x0=w,y0=h,x1=-1,y1=-1; for(let y=0;y<h;y++) for(let x=0;x<w;x++){ if(d[(y*w+x)*4+3]>12){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } } return x1<0?{x:0,y:0,w:1,h:1}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1}; }
/* empacota quadros recortados em um atlas */
function packAtlas(frames,maxW){
  maxW=maxW||1024; const pad=2; let x=0,y=0,rh=0;
  frames.forEach(f=>{ if(x+f.w+pad>maxW){ x=0; y+=rh+pad; rh=0; } f.sx=x; f.sy=y; x+=f.w+pad; rh=Math.max(rh,f.h); });
  const H=y+rh+pad, base=mkc(maxW,H), mask=mkc(maxW,H), bg=base.getContext('2d'), mg=mask.getContext('2d');
  frames.forEach(f=>{ bg.drawImage(f.base,f.ox,f.oy,f.w,f.h,f.sx,f.sy,f.w,f.h); mg.drawImage(f.mask,f.ox,f.oy,f.w,f.h,f.sx,f.sy,f.w,f.h); });
  return {base:base,mask:mask,w:maxW,h:H};
}
function urls(at){ return {img:at.base.toDataURL('image/webp',QB),mask:at.mask.toDataURL('image/webp',QM),w:at.w,h:at.h}; }
function mkFrame(p,ctx){ const b=bbox(p.base); return {base:p.base,mask:p.mask,ox:b.x,oy:b.y,w:b.w,h:b.h}; }

/* ----------------- tropas ----------------- */
const WALK=10, ATKW=3, ATKS=4, IDLE=6;
window.GEN={};
GEN.unit=function(key){
  const FW=128, ax=64, ay=108, s=FW/100*1.02, hum=!!ART.CH[key], fly=!!ART.FLYERS[key];
  const poses=hum?['f','b','s']:['f'], frames=[], idx={walk:{},atk:{},idle:{}};
  const mk=(anim,pose,params)=>{ const p=pair(FW,FW,(g,team)=>{ g.translate(ax,ay-30*s); g.scale(s,s); ART.drawRaw(g,key,team,Object.assign({pose:pose},params)); }); const f=mkFrame(p); f.anim=anim; f.pose=pose; frames.push(f); return frames.length-1; };
  poses.forEach(pose=>{
    idx.walk[pose]=[]; idx.atk[pose]=[]; idx.idle[pose]=[];
    for(let i=0;i<WALK;i++) idx.walk[pose].push(mk('walk',pose,{mv:true,ph:i/WALK,aw:0,at:0,t:fly?i/WALK*.4488:i*.11}));
    for(let j=0;j<ATKW;j++) idx.atk[pose].push(mk('atk',pose,{mv:false,aw:(j+.5)/ATKW,at:0,t:fly?j*.1:.3}));
    for(let k=0;k<ATKS;k++) idx.atk[pose].push(mk('atk',pose,{mv:false,aw:0,at:(k+.5)/ATKS,t:fly?(k+3)*.1:.3}));
    if(fly) for(let i=0;i<IDLE;i++) idx.idle[pose].push(idx.walk[pose][Math.floor(i/IDLE*WALK)]);
    else if(pose!=='s') for(let i=0;i<IDLE;i++) idx.idle[pose].push(mk('idle',pose,{mv:false,aw:0,at:0,t:i/IDLE*2.618}));
  });
  const at=packAtlas(frames,1024), out=urls(at);
  const meta={fw:FW,ax:ax,ay:ay,poses:poses,fly:fly,hum:hum,w:out.w,h:out.h,frames:frames.map(f=>[f.sx,f.sy,f.w,f.h,f.ox,f.oy]),anims:idx};
  return {img:out.img,mask:out.mask,meta:meta};
};

/* ----------------- construções ----------------- */
GEN.struct=function(key){
  const heart=key==='heart', FW=heart?192:144, sc=heart?FW/110:FW/84, ax=FW/2, ay=Math.round(FW*.84);
  const dirs=(key==='canhao'||key==='balista')?['u','d']:['u'];
  const frames=[], idx={idle:{},fire:{}}, N=10, F=5;
  const hasFire=(key==='canhao'||key==='balista'||key==='torre_arcana');
  const mk=(dir,st)=>{ const p=pair(FW,FW,(g,team)=>{ g.translate(ax,ay-24*sc); g.scale(sc,sc); const tc=ART.TC[team]; ART.B[key](g,tc); ART.dynStruct(g,key,tc,0,0,1,Object.assign({dir:dir==='u'?-1:1,hpr:1},st)); }); const f=mkFrame(p); frames.push(f); return frames.length-1; };
  dirs.forEach(d=>{
    idx.idle[d]=[]; idx.fire[d]=[];
    for(let i=0;i<N;i++) idx.idle[d].push(mk(d,{t:i/N*LOOP,atk:0}));
    if(hasFire) for(let i=0;i<F;i++) idx.fire[d].push(mk(d,{t:0.3,atk:1-(i+.5)/F}));
  });
  const at=packAtlas(frames,1024), out=urls(at);
  const meta={fw:FW,ax:ax,ay:ay,w:out.w,h:out.h,loop:LOOP,frames:frames.map(f=>[f.sx,f.sy,f.w,f.h,f.ox,f.oy]),anims:idx,dirs:dirs};
  return {img:out.img,mask:out.mask,meta:meta};
};

/* ----------------- retratos das cartas ----------------- */
GEN.card=function(key,tipo){
  const W=128, c=render(W,W,g=>{
    g.translate(64,72);
    if(ART.SP[key]){ g.scale(1.75,1.75); ART.SP[key](g); }
    else if(ART.B[key]){ g.translate(0,-16); g.scale(1.7,1.7); ART.B[key](g,ART.TC[0]); ART.dynStruct(g,key,ART.TC[0],0,0,1,{t:.6,dir:-1}); }
    else { g.translate(0,-8); g.scale(1.62,1.62); ART.drawRaw(g,key,0,{pose:'f',mv:false,ph:0,aw:0,at:0,t:.8}); }
  });
  return post(c,1).toDataURL('image/webp',.9);
};

/* ----------------- cenário ----------------- */
const THEME={
  floresta:{ground:'#6BB04E',g2:'#7CC25B',g3:'#5A9F40',road:'#D2B07A',edge:'#9C7B45',pebble:'#B8955C',slow:'rgba(92,62,28,.55)',plaza:'#C9B58A',glow:'#7CD35B'},
  ruinas:{ground:'#8FA08A',g2:'#A0B09A',g3:'#7C8E78',road:'#C4BCA8',edge:'#7C7566',pebble:'#A39B87',slow:'rgba(90,90,90,.45)',plaza:'#CFC7B2',glow:'#B58CFF'},
  montanha:{ground:'#DDE7F0',g2:'#EAF1F7',g3:'#C9D6E3',road:'#B5A89A',edge:'#7E7165',pebble:'#9C8F82',slow:'rgba(255,255,255,.75)',plaza:'#D8CFC4',glow:'#9FE3FF'},
  lava:{ground:'#3A2A2F',g2:'#4A353B',g3:'#2E2025',road:'#7A5A52',edge:'#2A1A1E',pebble:'#5E433D',slow:'rgba(255,100,30,.6)',plaza:'#6B4D48',glow:'#FF8A3D'},
  ceu:{ground:'#BFE3FF',g2:'#E6F5FF',g3:'#A8D2F5',road:'#FFF4D6',edge:'#E2C887',pebble:'#F2E2B0',slow:'rgba(255,255,255,.8)',plaza:'#FFF0C4',glow:'#FFE066'},
  deserto:{ground:'#E8CB8E',g2:'#F1D9A2',g3:'#DDB872',road:'#F6E3B4',edge:'#C79F5B',pebble:'#D9BE83',slow:'rgba(176,112,38,.42)',plaza:'#F0DBA8',glow:'#FFB02E'}
};
const RK=ART.lE, RR=ART.lR, RP=ART.lP;
function sh(g,x,y,rx,ry,a){ g.fillStyle='rgba(20,8,40,'+(a||.22)+')'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,7); g.fill(); }
function wrap(g,S,fn){ for(const dx of [-S,0,S]) for(const dy of [-S,0,S]){ g.save(); g.translate(dx,dy); fn(); g.restore(); } }
function jag(g,x,y,len,ang,r,seg){ g.beginPath(); g.moveTo(x,y); let a=ang; for(let i=0;i<seg;i++){ a+=(r()-.5)*1.2; x+=Math.cos(a)*len/seg; y+=Math.sin(a)*len/seg; g.lineTo(x,y); } g.stroke(); }

function groundTex(id){
  const th=THEME[id], S=256, r=mulb(hashS('g'+id)), c=mkc(S,S), g=c.getContext('2d');
  g.fillStyle=th.ground; g.fillRect(0,0,S,S);
  for(let i=0;i<46;i++){ wrap(g,S,()=>{ g.globalAlpha=.3; g.fillStyle=r()<.5?th.g2:th.g3; g.beginPath(); g.ellipse(r()*S,r()*S,20+r()*60,12+r()*34,r()*3,0,7); g.fill(); }); }
  g.globalAlpha=1; g.lineCap='round';
  if(id==='floresta'){
    for(let i=0;i<230;i++){ const x=r()*S,y=r()*S, l=5+r()*6, col=r()<.5?'#8ED06A':'#4C8F36'; wrap(g,S,()=>{ g.strokeStyle=col; g.lineWidth=1.5; g.globalAlpha=.8; g.beginPath(); g.moveTo(x,y); g.lineTo(x-2,y-l); g.moveTo(x,y); g.lineTo(x+.5,y-l*1.1); g.moveTo(x,y); g.lineTo(x+3,y-l*.8); g.stroke(); }); }
    for(let i=0;i<22;i++){ const x=r()*S,y=r()*S, col=['#ffffff','#FFE066','#FF9ECF','#BFD7FF'][i%4]; wrap(g,S,()=>{ g.globalAlpha=1; g.fillStyle=col; for(let k=0;k<5;k++){ g.beginPath(); g.arc(x+Math.cos(k*1.256)*2.4,y+Math.sin(k*1.256)*2.4,1.7,0,7); g.fill(); } g.fillStyle='#FFB02E'; g.beginPath(); g.arc(x,y,1.3,0,7); g.fill(); }); }
  } else if(id==='ruinas'){
    for(let i=0;i<24;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.28; g.fillStyle='#5E9A4A'; g.beginPath(); g.ellipse(x,y,10+r()*16,6+r()*9,r()*3,0,7); g.fill(); }); }
    for(let i=0;i<12;i++){ const x=r()*S,y=r()*S,a=r()*6; wrap(g,S,()=>{ g.globalAlpha=.35; g.strokeStyle='#4A5546'; g.lineWidth=1.4; jag(g,x,y,26+r()*30,a,r,5); }); }
    for(let i=0;i<46;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.6; g.fillStyle=r()<.5?'#B7B9AC':'#6B7468'; g.beginPath(); g.ellipse(x,y,2+r()*3,1.5+r()*2,r()*3,0,7); g.fill(); }); }
  } else if(id==='montanha'){
    for(let i=0;i<90;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.55+r()*.4; g.fillStyle='#ffffff'; g.beginPath(); g.arc(x,y,.8+r()*1.3,0,7); g.fill(); }); }
    for(let i=0;i<8;i++){ const x=r()*S,y=r()*S,a=r()*6; wrap(g,S,()=>{ g.globalAlpha=.28; g.strokeStyle='#8FB0CC'; g.lineWidth=1.3; jag(g,x,y,30+r()*30,a,r,5); }); }
  } else if(id==='lava'){
    for(let i=0;i<16;i++){ const x=r()*S,y=r()*S,a=r()*6,len=34+r()*50; const sd=r()*1e6; wrap(g,S,()=>{ const rr=mulb(sd); g.globalAlpha=.3; g.strokeStyle='#FFD23F'; g.lineWidth=5; jag(g,x,y,len,a,rr,6); const rr2=mulb(sd); g.globalAlpha=.95; g.strokeStyle='#FF6A1F'; g.lineWidth=2; jag(g,x,y,len,a,rr2,6); }); }
    for(let i=0;i<40;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.7; g.fillStyle=r()<.5?'#FFB02E':'#FF6A1F'; g.beginPath(); g.arc(x,y,.9+r()*1.4,0,7); g.fill(); }); }
  } else if(id==='ceu'){
    for(let i=0;i<18;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.4; g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(x,y,24+r()*40,7+r()*10,0,0,7); g.fill(); }); }
    for(let i=0;i<26;i++){ const x=r()*S,y=r()*S, s=1.5+r()*2.5; wrap(g,S,()=>{ g.globalAlpha=.9; g.strokeStyle='#ffffff'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-s,y); g.lineTo(x+s,y); g.moveTo(x,y-s); g.lineTo(x,y+s); g.stroke(); }); }
  } else {
    for(let i=0;i<60;i++){ const x=r()*S,y=r()*S,w=10+r()*30; wrap(g,S,()=>{ g.globalAlpha=.3; g.strokeStyle=r()<.5?'#B98E4C':'#FFF1C7'; g.lineWidth=1.4; g.beginPath(); g.ellipse(x,y,w,w*.25,0,3.5,6); g.stroke(); }); }
    for(let i=0;i<30;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.6; g.fillStyle=r()<.5?'#C9A26A':'#F5E0AA'; g.beginPath(); g.ellipse(x,y,1.6+r()*2.4,1.2+r()*1.6,r()*3,0,7); g.fill(); }); }
  }
  g.globalAlpha=1; return c;
}
function roadTex(id){
  const th=THEME[id], S=256, r=mulb(hashS('r'+id)), c=mkc(S,S), g=c.getContext('2d');
  g.fillStyle=th.road; g.fillRect(0,0,S,S);
  for(let i=0;i<26;i++){ wrap(g,S,()=>{ g.globalAlpha=.22; g.fillStyle=r()<.5?th.pebble:'#ffffff'; g.beginPath(); g.ellipse(r()*S,r()*S,14+r()*40,8+r()*20,r()*3,0,7); g.fill(); }); }
  g.globalAlpha=1;
  if(id==='ruinas'||id==='ceu'){
    const w=id==='ruinas'?44:52, h=id==='ruinas'?34:26;
    for(let y=0;y<S;y+=h){ const off=((y/h)|0)%2?w/2:0; for(let x=-w;x<S+w;x+=w){ const j=(r()-.5)*4, shade=r(); g.fillStyle=id==='ruinas'?(shade<.5?'#CFC7B4':'#B9B09B'):(shade<.5?'#FFF6DC':'#F4E4B4'); g.strokeStyle=id==='ruinas'?'#7C7566':'#D9B96A'; g.lineWidth=2; const X=x+off+j, Y=y+1; wrap(g,S,()=>{ g.beginPath(); g.roundRect?g.roundRect(X,Y,w-3,h-3,5):g.rect(X,Y,w-3,h-3); g.fill(); g.stroke(); }); } }
  } else {
    for(let i=0;i<110;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.6; g.fillStyle=r()<.5?th.pebble:'rgba(60,40,20,.5)'; g.beginPath(); g.ellipse(x,y,1.5+r()*3.5,1.2+r()*2.4,r()*3,0,7); g.fill(); }); }
    if(id==='lava') for(let i=0;i<10;i++){ const x=r()*S,y=r()*S,a=r()*6,sd=r()*1e6; wrap(g,S,()=>{ g.globalAlpha=.9; g.strokeStyle='#FF6A1F'; g.lineWidth=1.8; jag(g,x,y,24+r()*30,a,mulb(sd),5); }); }
    if(id==='montanha') for(let i=0;i<14;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.55; g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(x,y,6+r()*14,3+r()*6,r()*3,0,7); g.fill(); }); }
    if(id==='floresta') for(let i=0;i<10;i++){ const x=r()*S,y=r()*S; wrap(g,S,()=>{ g.globalAlpha=.8; g.strokeStyle='#5FA040'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,y); g.lineTo(x-2,y-6); g.moveTo(x,y); g.lineTo(x+2,y-7); g.stroke(); }); }
    if(id==='deserto') for(let i=0;i<30;i++){ const x=r()*S,y=r()*S,w=10+r()*24; wrap(g,S,()=>{ g.globalAlpha=.3; g.strokeStyle='#C79F5B'; g.lineWidth=1.3; g.beginPath(); g.ellipse(x,y,w,w*.25,0,3.5,6); g.stroke(); }); }
  }
  g.globalAlpha=1; return c;
}
function plazaSprite(id){
  const th=THEME[id], W=320, H=280, c=mkc(W,H), g=c.getContext('2d'); g.translate(W/2,H/2);
  sh(g,0,10,150,118,.25); g.fillStyle=th.edge; g.beginPath(); g.ellipse(0,0,148,120,0,0,7); g.fill();
  g.fillStyle=th.plaza; g.beginPath(); g.ellipse(0,0,138,110,0,0,7); g.fill();
  g.strokeStyle='rgba(60,40,20,.35)'; g.lineWidth=2; for(const k of [.82,.58,.34]){ g.beginPath(); g.ellipse(0,0,138*k,110*k,0,0,7); g.stroke(); }
  for(let i=0;i<16;i++){ const a=i*Math.PI/8; g.beginPath(); g.moveTo(Math.cos(a)*138*.34,Math.sin(a)*110*.34); g.lineTo(Math.cos(a)*138*.9,Math.sin(a)*110*.9); g.stroke(); }
  g.fillStyle=th.glow; g.globalAlpha=.25; g.beginPath(); g.ellipse(0,0,138*.3,110*.3,0,0,7); g.fill(); g.globalAlpha=1;
  return c;
}
function padSprite(id){
  const th=THEME[id], W=96, H=84, c=mkc(W,H), g=c.getContext('2d'); g.translate(W/2,H/2+2);
  sh(g,0,6,40,26,.28); g.fillStyle='#6F6654'; g.beginPath(); g.ellipse(0,5,38,27,0,0,7); g.fill();
  const gr=g.createLinearGradient(0,-24,0,24); gr.addColorStop(0,'#EFEADB'); gr.addColorStop(1,'#BDB5A0'); g.fillStyle=gr; g.strokeStyle='#4F4838'; g.lineWidth=2.2; g.beginPath(); g.ellipse(0,0,38,26,0,0,7); g.fill(); g.stroke();
  g.strokeStyle=th.glow; g.lineWidth=2; g.globalAlpha=.85; g.beginPath(); g.ellipse(0,0,25,16,0,0,7); g.stroke();
  for(let i=0;i<6;i++){ const a=i*Math.PI/3; g.beginPath(); g.moveTo(Math.cos(a)*14,Math.sin(a)*9); g.lineTo(Math.cos(a)*24,Math.sin(a)*15); g.stroke(); } g.globalAlpha=1; return c;
}
function patchSprite(id,v){
  const th=THEME[id], W=112, H=84, c=mkc(W,H), g=c.getContext('2d'), r=mulb(hashS('p'+id+v)); g.translate(W/2,H/2);
  if(id==='floresta'){ g.fillStyle='rgba(70,46,22,.85)'; g.beginPath(); g.ellipse(0,0,44,28,v*.5,0,7); g.fill(); g.fillStyle='rgba(120,86,48,.7)'; g.beginPath(); g.ellipse(-4,-4,30,16,v*.5,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(-10,-8,10,4,0,0,7); g.fill(); }
  else if(id==='ruinas'){ for(let i=0;i<14;i++){ RP(g,[[-5,3],[-3,-4],[3,-5],[6,2]].map(p=>[p[0]+(r()-.5)*70+0,p[1]+(r()-.5)*36]),r()<.5?'#A8A290':'#8C8674','#4F4838',1.1); } }
  else if(id==='montanha'){ g.fillStyle='#ffffff'; g.strokeStyle='#A9C2D8'; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,4,46,24,0,0,7); g.fill(); g.stroke(); g.fillStyle='#EAF4FF'; g.beginPath(); g.ellipse(-8,-2,30,14,0,0,7); g.fill(); }
  else if(id==='lava'){ const gr=g.createRadialGradient(0,0,4,0,0,46); gr.addColorStop(0,'rgba(255,210,63,.95)'); gr.addColorStop(.5,'rgba(255,106,31,.8)'); gr.addColorStop(1,'rgba(120,30,10,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,46,30,0,0,7); g.fill(); }
  else if(id==='ceu'){ g.fillStyle='rgba(255,255,255,.9)'; [[-18,2,20,13],[2,-4,24,16],[22,3,18,12],[0,6,30,12]].forEach(q=>{ g.beginPath(); g.ellipse(q[0],q[1],q[2],q[3],0,0,7); g.fill(); }); }
  else { const gr=g.createLinearGradient(0,-24,0,24); gr.addColorStop(0,'#F7E1A5'); gr.addColorStop(1,'#CFA05A'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,46,26,0,0,7); g.fill(); g.strokeStyle='rgba(140,90,30,.4)'; g.lineWidth=1.4; for(let i=-2;i<=2;i++){ g.beginPath(); g.ellipse(0,i*5,34-Math.abs(i)*5,5,0,3.4,6); g.stroke(); } }
  return c;
}

/* decorações (cada função desenha em (x,y) = base do objeto; s = tamanho de referência) */
function dTree(g,x,y,s,r,pal){
  pal=pal||['#2F7D32','#3B9440','#4DAA4A','#7BD66A']; const w=s*(.9+r()*.25);
  sh(g,x,y+w*.34,w*.4,w*.12,.24); RR(g,x-w*.07,y-w*.08,w*.14,w*.42,2,'#6B4423','#3F2814',1.2); g.strokeStyle='rgba(40,20,5,.4)'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x-w*.03,y+i*w*.09); g.lineTo(x-w*.01,y+i*w*.09+w*.06); g.stroke(); }
  [[0,-.44,.42],[-.26,-.26,.32],[.26,-.28,.32],[0,-.2,.36],[-.12,-.6,.24],[.14,-.58,.22]].forEach((c,i)=>RK(g,x+c[0]*w,y+c[1]*w,c[2]*w,c[2]*w*.92,pal[i%3],'#1E5A24',1.3));
  for(let i=0;i<14;i++){ const a=r()*6.28, d=r()*w*.34; RK(g,x+Math.cos(a)*d,y-w*.36+Math.sin(a)*d*.8,w*.045,w*.035,pal[3]); }
  RK(g,x-w*.12,y-w*.58,w*.16,w*.1,'rgba(200,255,170,.55)');
}
function dPine(g,x,y,s,r){
  const w=s*(.9+r()*.25); sh(g,x,y+w*.34,w*.34,w*.1,.24); RR(g,x-w*.05,y,w*.1,w*.34,1.5,'#5E3D22','#2F1D0F',1);
  for(let i=0;i<4;i++){ const yy=y-i*w*.2, ww=w*(.42-i*.075); RP(g,[[x-ww,yy],[x,yy-w*.34],[x+ww,yy]],'#2E6E4A','#16402A',1.3); RP(g,[[x-ww*.9,yy-w*.04],[x-ww*.1,yy-w*.3],[x+ww*.1,yy-w*.3],[x+ww*.9,yy-w*.04],[x,yy-w*.12]],'#F4FAFF','rgba(120,150,180,.6)',1); }
}
function dBush(g,x,y,s,r){ const w=s*(.5+r()*.3); sh(g,x,y+w*.3,w*.55,w*.14,.2); RK(g,x-w*.26,y,w*.3,w*.27,'#3E9B3F','#1E5A24',1.2); RK(g,x+w*.2,y-w*.05,w*.32,w*.29,'#4DAA4A','#1E5A24',1.2); RK(g,x,y-w*.12,w*.28,w*.26,'#59BC55','#1E5A24',1.2); if(r()<.6) for(let i=0;i<4;i++) RK(g,x+(r()-.5)*w*.6,y-w*.1+(r()-.5)*w*.3,w*.05,w*.05,['#FF6FA5','#FFE066','#fff'][i%3]); }
function dRock(g,x,y,s,r,col){ const w=s*(.42+r()*.28); col=col||'#9A9AA6'; sh(g,x,y+w*.36,w*.6,w*.14,.24); const j=()=>(r()-.5)*w*.12; RP(g,[[x-w*.52,y+w*.3],[x-w*.42+j(),y-w*.18],[x-w*.08,y-w*.46],[x+w*.2+j(),y-w*.4],[x+w*.46,y-w*.1+j()],[x+w*.52,y+w*.3]],col,'#3F3F52',1.4); RP(g,[[x-w*.3,y-w*.08],[x-w*.06,y-w*.36],[x+w*.12,y-w*.32],[x-w*.02,y-w*.08]],'rgba(255,255,255,.32)'); g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(x+w*.1,y-w*.2); g.lineTo(x+w*.02,y+w*.12); g.stroke(); }
function dPillar(g,x,y,s,r){ const w=s*(.95+r()*.35), broken=r()<.5; sh(g,x,y+w*.36,w*.38,w*.1,.24); RR(g,x-w*.25,y+w*.18,w*.5,w*.17,2,'#B9B2A0','#5E5848',1.3); const top=broken?y-w*.16:y-w*.46; RR(g,x-w*.17,top,w*.34,y+w*.2-top,2,'#D6CFBC','#5E5848',1.3); g.strokeStyle='rgba(60,50,30,.4)'; g.lineWidth=1.1; for(const dx of [-.07,.0,.07]){ g.beginPath(); g.moveTo(x+dx*w,top+3); g.lineTo(x+dx*w,y+w*.18); g.stroke(); } if(broken) RP(g,[[x-w*.17,top],[x-w*.07,top-w*.12],[x+.0*w,top-w*.02],[x+w*.09,top-w*.1],[x+w*.17,top]],'#D6CFBC','#5E5848',1.2); else RR(g,x-w*.27,top-w*.09,w*.54,w*.11,2,'#E2DBC8','#5E5848',1.3); if(r()<.6) RK(g,x-w*.12,y+w*.1,w*.11,w*.07,'#6FA05A'); }
function dWall(g,x,y,s,r){ const w=s*(.85+r()*.3); sh(g,x,y+w*.33,w*.52,w*.1,.24); for(let k=0;k<3;k++) for(let c=0;c<(k===2?1:2);c++) RR(g,x-w*.43+c*w*.43+(k%2)*w*.13,y+w*.18-k*w*.2,w*.41,w*.19,2,k%2?'#C2BBA8':'#CFC8B4','#5E5848',1.1); if(r()<.6) RK(g,x-w*.2,y+w*.16,w*.14,w*.06,'#6FA05A'); }
function dDune(g,x,y,s,r){ const w=s*(.95+r()*.5); const gr=g.createLinearGradient(x,y-w*.32,x,y+w*.3); gr.addColorStop(0,'#F7E3AA'); gr.addColorStop(1,'#D3A85F'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,w*.58,w*.3,0,0,7); g.fill(); g.strokeStyle='rgba(150,100,40,.4)'; g.lineWidth=1.3; g.beginPath(); g.ellipse(x,y,w*.58,w*.3,0,3.3,6.1); g.stroke(); g.strokeStyle='rgba(255,246,210,.6)'; g.beginPath(); g.ellipse(x-w*.04,y-w*.03,w*.4,w*.18,0,3.5,5.4); g.stroke(); }
function dCactus(g,x,y,s,r){ const w=s*(.85+r()*.3); sh(g,x,y+w*.36,w*.32,w*.09,.22); RR(g,x-w*.11,y-w*.4,w*.22,w*.76,w*.11,'#3F9A52','#1F5A2E',1.3); RR(g,x-w*.34,y-w*.2,w*.24,w*.14,w*.07,'#3F9A52','#1F5A2E',1.2); RR(g,x-w*.34,y-w*.32,w*.12,w*.22,w*.06,'#3F9A52','#1F5A2E',1.2); RR(g,x+w*.1,y-w*.06,w*.24,w*.14,w*.07,'#3F9A52','#1F5A2E',1.2); RR(g,x+w*.22,y-w*.22,w*.12,w*.22,w*.06,'#3F9A52','#1F5A2E',1.2); g.strokeStyle='rgba(20,60,30,.45)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y-w*.36); g.lineTo(x,y+w*.32); g.stroke(); if(r()<.6) RK(g,x,y-w*.42,w*.06,w*.06,'#FF6FA5'); }
function dCloud(g,x,y,s,r){ const w=s*(.85+r()*.5); sh(g,x,y+w*.32,w*.55,w*.1,.12); [[-.26,0,.29],[0,-.14,.36],[.28,0,.27],[0,.06,.42],[-.12,.1,.28],[.16,.1,.26]].forEach(c=>RK(g,x+c[0]*w,y+c[1]*w,c[2]*w,c[2]*w*.72,'#ffffff','rgba(150,180,220,.7)',1.2)); }
function dLava(g,x,y,s,r){ const w=s*(.55+r()*.3); const gr=g.createRadialGradient(x,y,w*.1,x,y,w*.85); gr.addColorStop(0,'#FFE066'); gr.addColorStop(.45,'#FF7A1F'); gr.addColorStop(1,'rgba(255,60,20,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,w*.85,w*.58,0,0,7); g.fill(); g.fillStyle='rgba(255,255,220,.6)'; g.beginPath(); g.ellipse(x-w*.15,y-w*.1,w*.25,w*.1,0,0,7); g.fill(); }
function dSpike(g,x,y,s,r){ const w=s*(.7+r()*.4); sh(g,x,y+w*.2,w*.4,w*.1,.3); [[-.2,.12,.5],[.0,.2,.85],[.22,.14,.6]].forEach((c,i)=>{ const hh=w*c[2], ww=w*.14; RP(g,[[x+c[0]*w-ww,y+c[1]*w*.5],[x+c[0]*w-ww*.3,y-hh],[x+c[0]*w+ww*.3,y-hh*.96],[x+c[0]*w+ww,y+c[1]*w*.5]],'#3B2A33','#150C12',1.3); RP(g,[[x+c[0]*w-ww*.6,y],[x+c[0]*w-ww*.2,y-hh*.8],[x+c[0]*w,y-hh*.7],[x+c[0]*w-ww*.2,y]],'rgba(255,140,60,.55)'); }); }
const DEC={
  floresta:[['tree',8,1.25,.62,(g,x,y,s,r,i)=>dTree(g,x,y,s,r,i%3===1?['#3E8E3E','#52A64A','#6BBE5A','#9BE07A']:i%3===2?['#B8742A','#D08A32','#E8A640','#F4C25A']:null)],['bush',4,1,.18,dBush],['rock',3,1,.12,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#8E9A8C')],['rockL',2,1.3,.08,(g,x,y,s,r)=>dRock(g,x,y,s*1.2,r,'#7F8C7E')]],
  ruinas:[['pillar',5,1.1,.33,dPillar],['wall',4,1,.25,dWall],['rock',3,1,.22,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#A9A593')],['bush',2,.8,.1,dBush],['tree',2,1.1,.1,(g,x,y,s,r)=>dTree(g,x,y,s,r,['#4A6B3A','#5A7E46','#6C9654','#9AC47A'])]],
  montanha:[['rock',4,1.4,.38,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#8C9BAA')],['pine',6,1.25,.42,dPine],['rockS',3,1,.2,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#C9D6E3')]],
  lava:[['rock',4,1.3,.45,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#4B3036')],['lava',3,1.2,.22,dLava],['spike',3,1.1,.22,dSpike],['rockR',2,1,.11,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#6B4A44')]],
  ceu:[['cloud',6,1.3,.58,dCloud],['pillar',3,1.2,.3,dPillar],['cloudS',2,1,.12,dCloud]],
  deserto:[['dune',5,1.1,.4,dDune],['cactus',4,1.1,.27,dCactus],['rock',3,1,.23,(g,x,y,s,r)=>dRock(g,x,y,s,r,'#B9805A')],['rockL',2,1.2,.1,(g,x,y,s,r)=>dRock(g,x,y,s*1.1,r,'#A06C48')]]
};
GEN.scenery=function(id){
  const items=[]; const add=(name,c,extra)=>{ const b=bbox(c); items.push(Object.assign({name:name,cv:c,ox:b.x,oy:b.y,w:b.w,h:b.h},extra||{})); };
  add('ground',groundTex(id)); add('road',roadTex(id)); add('plaza',plazaSprite(id),{ax:160,ay:140}); add('pad',padSprite(id),{ax:48,ay:44});
  for(let v=0;v<3;v++) add('patch'+v,patchSprite(id,v),{ax:56,ay:42});
  (DEC[id]).forEach(([kind,n,sz,wt,fn])=>{ for(let i=0;i<n;i++){ const c=post(render(180,180,g=>{ fn(g,90,128,100,mulb(hashS(id+kind+i)),i); }),1); add('d:'+kind+':'+i,c,{ax:90,ay:128,kind:kind,sz:sz,wt:wt/n}); } });
  // empacotar (sem recorte nas texturas)
  let x=0,y=0,rh=0; const maxW=1024,pad=2;
  items.forEach(it=>{ if(it.name==='ground'||it.name==='road'){ it.ox=0; it.oy=0; it.w=256; it.h=256; } if(x+it.w+pad>maxW){ x=0; y+=rh+pad; rh=0; } it.sx=x; it.sy=y; x+=it.w+pad; rh=Math.max(rh,it.h); });
  const H=y+rh+pad, at=mkc(maxW,H), ag=at.getContext('2d');
  items.forEach(it=>ag.drawImage(it.cv,it.ox,it.oy,it.w,it.h,it.sx,it.sy,it.w,it.h));
  const meta={w:maxW,h:H,theme:THEME[id],ground:null,road:null,plaza:null,pad:null,patch:[],decor:[]};
  items.forEach(it=>{ const r=[it.sx,it.sy,it.w,it.h]; if(it.name==='ground') meta.ground=r; else if(it.name==='road') meta.road=r; else if(it.name==='plaza') meta.plaza={r:r,ax:it.ax-it.ox,ay:it.ay-it.oy}; else if(it.name==='pad') meta.pad={r:r,ax:it.ax-it.ox,ay:it.ay-it.oy}; else if(it.name.startsWith('patch')) meta.patch.push({r:r,ax:it.ax-it.ox,ay:it.ay-it.oy}); else meta.decor.push({r:r,ax:it.ax-it.ox,ay:it.ay-it.oy,kind:it.kind,sz:it.sz,wt:it.wt}); });
  return {img:at.toDataURL('image/webp',.88),meta:meta};
};
