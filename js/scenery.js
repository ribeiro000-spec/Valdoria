'use strict';
/* Monta o fundo da partida (uma vez por partida) a partir dos sprites de cenário. */
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
  const m=sc.meta, im=sc.img, th=m.theme;
  // chão
  const gr=m.ground, TS=T*5;
  for(let y=0;y<H*T;y+=TS) for(let x=0;x<W*T;x+=TS) g.drawImage(im,gr[0],gr[1],gr[2],gr[3],x,y,TS+1,TS+1);
  // trilhas: borda escura + miolo com textura
  const isRoad=(cc,rr)=>cc>=0&&rr>=0&&cc<W&&rr<H&&(road[rr][cc]||tiles[rr][cc]==='~');
  const circles=(ctx2,rad)=>{
    for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(isRoad(cc,r)){
      const x=(cc+.5)*T, y=(r+.5)*T;
      ctx2.beginPath(); ctx2.arc(x,y,rad*T,0,7); ctx2.fill();
      if(isRoad(cc+1,r)){ ctx2.beginPath(); ctx2.arc(x+T/2,y,rad*T,0,7); ctx2.fill(); }
      if(isRoad(cc,r+1)){ ctx2.beginPath(); ctx2.arc(x,y+T/2,rad*T,0,7); ctx2.fill(); }
    }
  };
  g.fillStyle='rgba(30,16,8,.22)'; circles(g,1.08);
  g.fillStyle=th.edge; circles(g,.99);
  const mk=document.createElement('canvas'); mk.width=c.width; mk.height=c.height; const mg=mk.getContext('2d'); mg.scale(dpr,dpr);
  mg.fillStyle='#fff'; circles(mg,.86); mg.globalCompositeOperation='source-in';
  const rd=m.road, RS=T*4;
  for(let y=0;y<H*T;y+=RS) for(let x=0;x<W*T;x+=RS) mg.drawImage(im,rd[0],rd[1],rd[2],rd[3],x,y,RS+1,RS+1);
  g.drawImage(mk,0,0,W*T,H*T);
  // trechos lentos
  for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(tiles[r][cc]==='~'){
    const p=m.patch[(r*7+cc*3)%m.patch.length], s=T*1.6/p.r[2];
    g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],(cc+.5)*T-p.ax*s,(r+.5)*T-p.ay*s,p.r[2]*s,p.r[3]*s);
  }
  // praças dos castelos
  if(m.plaza){ const p=m.plaza, s=T*4.9/p.r[2]; [[W/2,1],[W/2,H-1]].forEach(q=>g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],q[0]*T-p.ax*s,q[1]*T-p.ay*s,p.r[2]*s,p.r[3]*s)); }
  // cenário nos blocos bloqueados (ordenado por y)
  const items=[];
  for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++) if(tiles[r][cc]==='#'){
    const near=[[1,0],[-1,0],[0,1],[0,-1]].some(d=>isRoad(cc+d[0],r+d[1]));
    const n=near?1:2;
    for(let k=0;k<n;k++) items.push({x:(cc+.3+rng()*.4+(k?(rng()-.5)*.6:0))*T,y:(r+.6+rng()*.3)*T,near:near});
  }
  items.sort((a,b)=>a.y-b.y);
  let wsum=0; m.decor.forEach(d=>{ wsum+=d.wt; });
  items.forEach(it=>{
    let q=rng()*wsum, d=m.decor[0]; for(const e of m.decor){ q-=e.wt; if(q<=0){ d=e; break; } }
    const s=T*d.sz/100*(it.near?.85:1)*(.9+rng()*.26), fl=rng()<.5;
    g.save(); g.translate(it.x,it.y); g.scale(fl?-s:s,s);
    g.drawImage(im,d.r[0],d.r[1],d.r[2],d.r[3],-d.ax,-d.ay,d.r[2],d.r[3]); g.restore();
  });
  // pontos de construção
  if(m.pad){ const p=m.pad, s=T*1.3/p.r[2]*1.25; padsL.forEach(list=>list.forEach(q=>g.drawImage(im,p.r[0],p.r[1],p.r[2],p.r[3],(q.c+.5)*T-p.ax*s,(q.r+.5)*T-p.ay*s,p.r[2]*s,p.r[3]*s))); }
  // acabamento: luz suave e vinheta
  const lg=g.createLinearGradient(0,0,W*T,H*T); lg.addColorStop(0,'rgba(255,255,230,.10)'); lg.addColorStop(1,'rgba(20,10,50,.10)'); g.fillStyle=lg; g.fillRect(0,0,W*T,H*T);
  const vg=g.createRadialGradient(W*T/2,H*T/2,Math.min(W,H)*T*.35,W*T/2,H*T/2,Math.max(W,H)*T*.78); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(20,8,40,.34)'); g.fillStyle=vg; g.fillRect(0,0,W*T,H*T);
  return c;
}
