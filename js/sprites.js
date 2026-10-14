'use strict';
/* Carrega os sprites prontos (assets/sprites) e desenha unidades, construções e cenário.
   As imagens são geradas por tools/gerar.js. A cor da equipe é aplicada ao carregar (máscara + multiplicação). */
const SPR=(function(){
  const BASE='assets/sprites/', VER=1;   /* aumente VER ao trocar as imagens (evita cache antigo) */
  const TEAM=['#3A7BFF','#FF4D4D'];
  const PI=Math.PI;
  let man=null, total=0, done=0, ready=false;
  const imgs=new Map(), tints=new Map();
  const scratch=document.createElement('canvas'), sg=scratch.getContext('2d');

  function loadImg(rel){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=BASE+rel+'?v='+VER; }); }
  function load(onProgress){
    return fetch(BASE+'manifest.json?v='+VER).then(r=>r.json()).then(m=>{
      man=m; const jobs=[];
      const add=rel=>{ total++; return loadImg(rel).then(i=>{ imgs.set(rel,i); done++; if(onProgress) onProgress(done/total); }); };
      Object.values(m.units).forEach(u=>{ jobs.push(add(u.img),add(u.mask)); });
      Object.values(m.structs).forEach(u=>{ jobs.push(add(u.img),add(u.mask)); });
      Object.values(m.scenery).forEach(s=>jobs.push(add(s.img)));
      Object.values(m.cards).forEach(c=>jobs.push(add(c)));
      return Promise.all(jobs);
    }).then(()=>{ ready=true; });
  }
  /* atlas colorido da equipe: base neutra × cor da equipe (só onde a máscara marca) */
  function tinted(def,team){
    const k=def.img+'|'+team; let c=tints.get(k); if(c) return c;
    const base=imgs.get(def.img), mask=imgs.get(def.mask); if(!base) return null;
    c=document.createElement('canvas'); c.width=base.width; c.height=base.height;
    const g=c.getContext('2d'); g.drawImage(base,0,0);
    if(mask){
      const t=document.createElement('canvas'); t.width=c.width; t.height=c.height; const tg=t.getContext('2d');
      tg.drawImage(mask,0,0); tg.globalCompositeOperation='source-in'; tg.fillStyle=TEAM[team]; tg.fillRect(0,0,t.width,t.height);
      g.globalCompositeOperation='multiply'; g.drawImage(t,0,0); g.globalCompositeOperation='source-over';
    }
    tints.set(k,c); return c;
  }
  function flash(g,at,f,dx,dy,a){
    scratch.width=f[2]; scratch.height=f[3];
    sg.drawImage(at,f[0],f[1],f[2],f[3],0,0,f[2],f[3]);
    sg.globalCompositeOperation='source-atop'; sg.fillStyle='rgba(255,255,255,'+a+')'; sg.fillRect(0,0,f[2],f[3]); sg.globalCompositeOperation='source-over';
    g.drawImage(scratch,dx,dy);
  }
  /* st: {pose:'f'|'b'|'s', flip, ph(0..1), mv, aw(0..1), at(0..1), t, hit, born, lean, sq} */
  function unit(g,key,team,x,y,size,st){
    const d=man&&man.units[key]; if(!d) return;
    const at=tinted(d,team); if(!at) return;
    st=st||{}; const t=st.t||0, s=size/d.fw;
    let pose=st.pose||'f'; if(d.poses.indexOf(pose)<0) pose='f';
    const aw=st.aw||0, atk=st.at||0; let anim, i;
    if(aw>0){ anim='atk'; i=Math.min(2,Math.floor(aw*3)); }
    else if(atk>0){ anim='atk'; i=3+Math.min(3,Math.floor(atk*4)); }
    else if(d.fly){ anim='walk'; i=Math.floor(((t/.4488)%1)*10)%10; }
    else if(st.mv){ anim='walk'; i=Math.floor((((st.ph||0)%1)+1)%1*10)%10; }
    else { anim='idle'; i=Math.floor(((t/2.618)%1)*6)%6; }
    let arr=d.anims[anim][pose]; if(!arr||!arr.length) arr=d.anims[anim].f;
    const f=d.frames[arr[i%arr.length]];
    const dx=-d.ax+f[4], dy=-d.ay+f[5];
    g.save(); g.translate(x,y);
    const bs=st.born==null?1:st.born, pop=bs<1?(1+Math.sin(bs*PI)*.25)*Math.min(1,bs*3):1;
    g.rotate(st.lean||0); g.scale((st.flip?-1:1)*s*pop,s*pop*(st.sq||1));
    g.drawImage(at,f[0],f[1],f[2],f[3],dx,dy,f[2],f[3]);
    if(st.hit>0) flash(g,at,f,dx,dy,Math.min(.8,st.hit*6));
    g.restore();
  }
  /* st: {t, atk(1→0), dir(-1 ou 1), hit, born, hpr} */
  function struct(g,key,team,x,y,size,st){
    const d=man&&man.structs[key]; if(!d) return;
    const at=tinted(d,team); if(!at) return;
    st=st||{}; const s=size/d.fw, dk=((st.dir||-1)<0||d.dirs.length===1)?'u':'d';
    let arr, i;
    const fire=d.anims.fire[dk];
    if(st.atk>0&&fire&&fire.length){ arr=fire; i=Math.min(arr.length-1,Math.floor((1-st.atk)*arr.length)); }
    else { arr=d.anims.idle[dk]; i=Math.floor((((st.t||0)%d.loop)/d.loop)*arr.length)%arr.length; }
    const f=d.frames[arr[i]], dx=-d.ax+f[4], dy=-d.ay+f[5];
    g.save(); g.translate(x,y); g.scale(s,s);
    const bs=st.born==null?1:st.born; if(bs<1){ g.scale(1,.35+.65*Math.min(1,bs*1.2)); g.globalAlpha=Math.min(1,bs*3); }
    g.drawImage(at,f[0],f[1],f[2],f[3],dx,dy,f[2],f[3]);
    if(st.hit>0) flash(g,at,f,dx,dy,Math.min(.6,st.hit*5));
    g.restore();
    if(key==='heart'&&st.hpr!=null&&st.hpr<.55) heartFx(g,x,y,size,st);
  }
  /* chamas e fumaça do castelo danificado */
  function heartFx(g,x,y,size,st){
    const u=size/110, t=st.t||0, hp=st.hpr;
    g.save(); g.translate(x,y-24*u); g.scale(u,u);
    for(let i=0;i<5;i++){ const q=(t*1.3+i*.21)%1; glow(g,-24+i*12,10-q*30,10*(1-q)+5,i%2?'#FF8A3D':'#FFD34D',.8*(1-q)); }
    if(hp<.3) for(let i=0;i<4;i++){ const q=(t*.8+i*.27)%1; g.fillStyle='rgba(60,50,60,'+(.5*(1-q)).toFixed(2)+')'; g.beginPath(); g.ellipse(-18+i*13+Math.sin(t+i)*3,-12-q*32,5+q*7,4+q*5,0,0,7); g.fill(); }
    g.restore();
  }
  function glow(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(255,255,255,0)'); g.save(); g.globalAlpha=a==null?1:a; g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill(); g.restore(); }
  const portrait=key=>man&&man.cards[key]?BASE+man.cards[key]+'?v='+VER:'';
  const scenery=id=>{ if(!man||!man.scenery[id]) return null; const m=man.scenery[id]; const im=imgs.get(m.img); return im?{meta:m,img:im}:null; };
  return {load,unit,struct,portrait,scenery,glow,isReady:()=>ready,progress:()=>total?done/total:0};
})();

/* utilitários simples de desenho usados pelos efeitos (gelo, projéteis) */
const ART={
  unit:SPR.unit, struct:SPR.struct, portrait:SPR.portrait, glow:SPR.glow,
  E(g,x,y,rx,ry,col,lw){ g.beginPath(); g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,6.2832); if(col){ g.fillStyle=col; g.fill(); } if(lw){ g.lineWidth=lw; g.strokeStyle='#26123a'; g.stroke(); } },
  P(g,pts,col,lw){ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); if(col){ g.fillStyle=col; g.fill(); } if(lw){ g.lineWidth=lw; g.lineJoin='round'; g.strokeStyle='#26123a'; g.stroke(); } },
  L(g,x1,y1,x2,y2,w,col,noOut){ g.lineCap='round'; if(!noOut){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w+2.4; g.strokeStyle='#26123a'; g.stroke(); } g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w; g.strokeStyle=col; g.stroke(); }
};
