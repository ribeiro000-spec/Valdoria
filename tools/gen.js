/* Monta os atlas (imagem + máscara da equipe) a partir de tools/art-src.js e tools/art-scene.js.
   Roda dentro do navegador (tools/gen.html), chamado por tools/gerar.js. */
'use strict';
const GEN=(function(){
  const PPU=64;
  const ANIM={idle:{n:4,loop:1},walk:{n:8,loop:1},atk:{n:6,loop:0}};
  function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
  function bbox(c){ const g=c.getContext('2d'), d=g.getImageData(0,0,c.width,c.height).data; let x0=c.width,y0=c.height,x1=-1,y1=-1;
    for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++){ if(d[(y*c.width+x)*4+3]>6){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
    if(x1<0) return [0,0,1,1]; return [Math.max(0,x0-1),Math.max(0,y0-1),Math.min(c.width,x1+2)-Math.max(0,x0-1),Math.min(c.height,y1+2)-Math.max(0,y0-1)]; }
  /* desenha (cor, máscara) num quadro grande e recorta */
  function shot(fn,S){ const a=canvas(S,S), m=canvas(S,S); fn(a.getContext('2d'),'color',S/2,S*.78); fn(m.getContext('2d'),'mask',S/2,S*.78);
    const b=bbox(a); return {a,m,b,ax:S/2,ay:S*.78}; }
  /* empacota em prateleiras */
  function pack(shots,maxW){
    maxW=maxW||2048; let x=0,y=0,rowH=0,W=0; const pos=[];
    shots.forEach(s=>{ const w=s.b[2], h=s.b[3]; if(x+w>maxW){ x=0; y+=rowH+2; rowH=0; } pos.push([x,y]); x+=w+2; rowH=Math.max(rowH,h); W=Math.max(W,x); });
    const H=y+rowH; const A=canvas(W,H), M=canvas(W,H), ag=A.getContext('2d'), mg=M.getContext('2d');
    const frames=shots.map((s,i)=>{ const [px,py]=pos[i], b=s.b; ag.drawImage(s.a,b[0],b[1],b[2],b[3],px,py,b[2],b[3]); mg.drawImage(s.m,b[0],b[1],b[2],b[3],px,py,b[2],b[3]); return [px,py,b[2],b[3],b[0]-s.ax,b[1]-s.ay]; });
    // máscara: alfa = luminância × alfa da imagem
    const md=mg.getImageData(0,0,W,H), ad=ag.getImageData(0,0,W,H); let any=0;
    for(let i=0;i<md.data.length;i+=4){ const l=md.data[i]/255; const al=Math.round(l*ad.data[i+3]); md.data[i]=md.data[i+1]=md.data[i+2]=255; md.data[i+3]=al; if(al>8) any=1; }
    mg.putImageData(md,0,0);
    return {A,M,frames,any};
  }
  const url=(c,q)=>c.toDataURL('image/webp',q==null?.86:q);
  function unit(key){
    const isCH=!!ART.CH[key], d=isCH?ART.CH[key]:ART.CR[key], S=Math.ceil(PPU*(d.scale||1)*2.4);
    const shots=[], anims={};
    Object.keys(ANIM).forEach(an=>{ anims[an]=[];
      for(let dir=0;dir<5;dir++){ const list=[]; for(let i=0;i<ANIM[an].n;i++){ const t=i/(ANIM[an].n-(ANIM[an].loop?0:1)); list.push(shots.length); shots.push(shot((g,pass,ax,ay)=>ART.drawUnit(g,key,dir,an,an==='atk'?Math.min(.999,t):t,PPU,ax,ay,pass),S)); } anims[an].push(list); } });
    const p=pack(shots);
    // altura visual (para a barra de vida): topo do quadro parado de frente
    const f0=p.frames[anims.idle[0][0]];
    return {img:url(p.A),mask:p.any?url(p.M,.9):null,meta:{ppu:PPU,w:p.A.width,h:p.A.height,fly:!!(d.fly),top:-f0[5],frames:p.frames,anims:anims}};
  }
  function struct(key){
    const d=ART.ST[key], S=Math.ceil(PPU*(d.scale||1)*(key==='heart'?3.2:2.4)), shots=[], anims={idle:[],fire:[]};
    const dirs=d.turret?5:1, ni=key==='heart'?8:6, nf=d.turret||key==='torre_arcana'?4:0;
    for(let dir=0;dir<dirs;dir++){
      const L=[]; for(let i=0;i<ni;i++){ L.push(shots.length); shots.push(shot((g,pass,ax,ay)=>ART.drawStruct(g,key,dir,'idle',i/ni,PPU,ax,ay,pass),S)); } anims.idle.push(L);
      const F=[]; for(let i=0;i<nf;i++){ F.push(shots.length); shots.push(shot((g,pass,ax,ay)=>ART.drawStruct(g,key,dir,'fire',i/nf,PPU,ax,ay,pass),S)); } anims.fire.push(F);
    }
    const p=pack(shots); const f0=p.frames[anims.idle[0][0]];
    return {img:url(p.A),mask:p.any?url(p.M,.9):null,meta:{ppu:PPU,w:p.A.width,h:p.A.height,dirs:dirs,top:-f0[5],frames:p.frames,anims:anims}};
  }
  /* retrato da carta: personagem tingido de azul, recortado e centralizado */
  const BLUE='#3d7dff';
  function tint(a,m,c){ const t=canvas(m.width,m.height), tg=t.getContext('2d'); tg.drawImage(m,0,0); tg.globalCompositeOperation='source-in'; tg.fillStyle=c; tg.fillRect(0,0,t.width,t.height);
    const out=canvas(a.width,a.height), og=out.getContext('2d'); og.drawImage(a,0,0); og.globalCompositeOperation='multiply'; og.drawImage(t,0,0); og.globalCompositeOperation='destination-in'; og.drawImage(a,0,0); return out; }
  function maskAlpha(a,m){ const g=m.getContext('2d'), md=g.getImageData(0,0,m.width,m.height), ad=a.getContext('2d').getImageData(0,0,a.width,a.height); for(let i=0;i<md.data.length;i+=4){ const l=md.data[i]/255; md.data[i+3]=Math.round(l*ad.data[i+3]); md.data[i]=md.data[i+1]=md.data[i+2]=255; } g.putImageData(md,0,0); return m; }
  function card(key){
    const SZ=200, out=canvas(SZ,SZ), og=out.getContext('2d');
    let s;
    if(ART.CH[key]||ART.CR[key]){ const d=ART.CH[key]||ART.CR[key]; const S=Math.ceil(150*(d.scale||1)*2.4); s=shot((g,pass,ax,ay)=>ART.drawUnit(g,key,key==='morcegos'?0:key==='ariete'||ART.CR[key]?1:0,'idle',ART.CR[key]&&ART.CR[key].fly?.1:.25,150,ax,ay,pass),S); }
    else if(ART.ST[key]){ const d=ART.ST[key]; const S=Math.ceil(120*(d.scale||1)*2.8); s=shot((g,pass,ax,ay)=>ART.drawStruct(g,key,1,'idle',.3,120,ax,ay,pass),S); }
    if(s){ maskAlpha(s.a,s.m); const tc=tint(s.a,s.m,BLUE); const b=s.b, k=Math.min((SZ*.9)/b[2],(SZ*.9)/b[3]); const w=b[2]*k, h=b[3]*k;
      og.drawImage(tc,b[0],b[1],b[2],b[3],(SZ-w)/2,(SZ-h)/2+SZ*.02,w,h); }
    else ASCENE.icon(og,key,SZ);
    return url(out,.9);
  }
  function scenery(theme){ return ASCENE.theme(theme); }
  return {unit,struct,card,scenery,PPU};
})();
