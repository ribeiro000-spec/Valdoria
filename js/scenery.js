'use strict';
/* Monta o fundo da partida (uma vez por partida) com os sprites de cenário:
   chão texturizado, trilhas, platôs elevados (com paredão e sombra) onde fica a decoração, praças e pontos de construção. */
function mulb(seed){ let a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function renderBG(G,T,dpr,flip){
  const W=CM.W, H=CM.H, c=document.createElement('canvas');
  c.width=Math.floor(W*T*dpr); c.height=Math.floor(H*T*dpr);
  const g=c.getContext('2d'); g.scale(dpr,dpr);
  const rng=mulb(G.decor), sc=SPR.scenery(G.mapDef.id);
  const rot=a=>a.map((_,r)=>a[H-1-r].slice().reverse());
  let tiles=G.tiles, road=G.map.road; if(flip){ tiles=rot(tiles); road=rot(road); }
  const padsL=flip?G.pads.map(l=>l.map(p=>({c:W-1-p.c,r:H-1-p.r,kind:p.kind}))):G.pads;
  if(!sc){ g.fillStyle='#6BB04E'; g.fillRect(0,0,W*T,H*T); return c; }
  const m=sc.meta, im=sc.img, th=m.theme, k=T/m.ppu;
  const pat=(r,scale)=>{ const t=document.createElement('canvas'); t.width=r[2]; t.height=r[3]; t.getContext('2d').drawImage(im,r[0],r[1],r[2],r[3],0,0,r[2],r[3]); const p=g.createPattern(t,'repeat'); if(p&&p.setTransform&&window.DOMMatrix) p.setTransform(new DOMMatrix().scale(scale)); return p; };
  const blocked=(cc,rr)=>cc<0||rr<0||cc>=W||rr>=H?true:tiles[rr][cc]==='#';
  const isRoad=(cc,rr)=>cc>=0&&rr>=0&&cc<W&&rr<H&&tiles[rr][cc]!=='#'&&(road[rr][cc]||tiles[rr][cc]==='~');
  // 1) chão
  g.fillStyle=pat(m.ground,T*3.2/m.ground[2])||'#6BB04E'; g.fillRect(0,0,W*T,H*T);
  // 2) trilhas (borda + miolo texturizado)
  const blob=(ctx2,test,rad,dy)=>{ ctx2.beginPath();
    for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(test(cc,r)){ const x=(cc+.5)*T, y=(r+.5)*T+(dy||0);
      ctx2.moveTo(x+rad*T,y); ctx2.arc(x,y,rad*T,0,6.2832);
      if(test(cc+1,r)) ctx2.rect(x,y-rad*T,T,rad*2*T);
      if(test(cc,r+1)) ctx2.rect(x-rad*T,y,rad*2*T,T);
      if(test(cc+1,r)&&test(cc,r+1)&&test(cc+1,r+1)) ctx2.rect(x,y,T,T); }
  };
  g.fillStyle='rgba(30,16,8,.18)'; blob(g,isRoad,.62,T*.06); g.fill();
  g.fillStyle=th.edge; blob(g,isRoad,.6); g.fill();
  g.fillStyle=pat(m.road,T*2.6/m.road[2])||'#d9b27a'; blob(g,isRoad,.5); g.fill();
  // 3) trechos lentos
  for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(tiles[r][cc]==='~'&&m.patch.length){
    const p=m.patch[(r*7+cc*3)%m.patch.length], s=T*1.25/p.r[2]*(m.ppu/ (p.r[2]/1.5));
    const ss=k*1.15; g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],(cc+.5)*T-p.ax*ss,(r+.62)*T-p.ay*ss,p.r[2]*ss,p.r[3]*ss);
  }
  // 4) praças dos castelos
  if(m.plaza){ const p=m.plaza, s=T*5.4/p.r[2]; [[W/2,1.1],[W/2,H-.9]].forEach(q=>g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],q[0]*T-p.ax*s,q[1]*T-p.ay*s,p.r[2]*s,p.r[3]*s)); }
  // 5) platôs: sombra, paredão e topo
  const hh=T*.24;
  g.fillStyle='rgba(15,8,30,.22)'; blob(g,blocked,.56,T*.2); g.fill();
  g.fillStyle='rgba(20,10,30,.6)'; blob(g,blocked,.535,T*.03); g.fill();
  g.fillStyle=th.cliffD; blob(g,blocked,.5,T*.02); g.fill();
  g.fillStyle=th.cliff; blob(g,blocked,.5,-hh*.45); g.fill();
  g.fillStyle='rgba(20,10,30,.5)'; blob(g,blocked,.53,-hh); g.fill();
  g.save(); blob(g,blocked,.5,-hh); g.clip();
  g.fillStyle=pat(m.ground,T*3.2/m.ground[2]); g.fillRect(0,0,W*T,H*T);
  g.globalAlpha=.42; g.fillStyle=th.top; g.fillRect(0,0,W*T,H*T); g.globalAlpha=1;
  // brilho na borda de cima do platô
  g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(255,255,255,.10)'; blob(g,blocked,.5,-hh+T*.06); g.fill(); g.globalCompositeOperation='source-over';
  g.restore();
  // 6) pontos de construção
  if(m.pad){ const p=m.pad, s=k*1.25; padsL.forEach(list=>list.forEach(q=>g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],(q.c+.5)*T-p.ax*s,(q.r+.6)*T-p.ay*s,p.r[2]*s,p.r[3]*s))); }
  // 7) decoração sobre os platôs (ordenada por y)
  const items=[];
  for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(tiles[r][cc]==='#'){
    const near=[[1,0],[-1,0],[0,1],[0,-1]].some(d=>!blocked(cc+d[0],r+d[1]));
    const n=near?1:2;
    for(let q=0;q<n;q++) items.push({x:(cc+.25+rng()*.5+(q?(rng()-.5)*.5:0))*T,y:(r+.35+rng()*.45)*T-hh,near:near});
  }
  items.sort((a,b)=>a.y-b.y);
  let wsum=0; m.decor.forEach(d=>{ wsum+=d.wt; });
  items.forEach(it=>{
    let q=rng()*wsum, d=m.decor[0]; for(const e of m.decor){ q-=e.wt; if(q<=0){ d=e; break; } }
    const s=k*d.sz*(it.near?.85:1)*(.88+rng()*.26), fl=rng()<.5;
    g.fillStyle='rgba(15,8,30,.2)'; g.beginPath(); g.ellipse(it.x+T*.06,it.y+T*.04,d.r[2]*s*.3,d.r[2]*s*.12,0,0,6.2832); g.fill();
    g.save(); g.translate(it.x,it.y); g.scale(fl?-s:s,s);
    g.drawImage(im,d.r[0],d.r[1],d.r[2],d.r[3],-d.ax,-d.ay,d.r[2],d.r[3]); g.restore();
  });
  // 8) linha do meio (rio de luz) e acabamento
  g.save(); g.setLineDash([T*.25,T*.18]); g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,H/2*T); g.lineTo(W*T,H/2*T); g.stroke(); g.restore();
  const lg=g.createLinearGradient(0,0,W*T,H*T); lg.addColorStop(0,'rgba(255,255,230,.10)'); lg.addColorStop(1,'rgba(20,10,50,.12)'); g.fillStyle=lg; g.fillRect(0,0,W*T,H*T);
  const vg=g.createRadialGradient(W*T/2,H*T/2,Math.min(W,H)*T*.38,W*T/2,H*T/2,Math.max(W,H)*T*.8); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(20,8,40,.32)'); g.fillStyle=vg; g.fillRect(0,0,W*T,H*T);
  return c;
}
