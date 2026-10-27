'use strict';
/* Carrega os sprites prontos (assets/sprites, gerados por tools/gerar.js) e desenha tropas, construções e cenário.
   Cada tropa tem 5 direções desenhadas (S, SE, L, NE, N); as outras 3 são espelhadas → 8 direções.
   A cor da equipe é aplicada ao carregar (máscara × cor). Se algum sprite faltar, desenha um marcador (nunca fica invisível). */
const SPR=(function(){
  const BASE='assets/sprites/', VER=3;   /* aumente VER ao trocar as imagens (evita cache antigo) */
  const TEAM=['#3d7dff','#ff4a4a'];
  const PI=Math.PI;
  const ALIAS={golenzinho:['golem',.62]};
  let man=null, total=0, done=0, ready=false;
  const imgs=new Map(), tints=new Map();
  const scratch=document.createElement('canvas'), sg=scratch.getContext('2d');

  function loadImg(rel){ return new Promise(res=>{ if(!rel) return res(null); const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=BASE+rel+'?v='+VER; }); }
  function load(onProgress){
    return fetch(BASE+'manifest.json?v='+VER).then(r=>r.json()).then(m=>{
      man=m; const jobs=[];
      const add=rel=>{ if(!rel) return Promise.resolve(); total++; return loadImg(rel).then(i=>{ imgs.set(rel,i); done++; if(onProgress) onProgress(done/total); }); };
      Object.values(m.units).forEach(u=>{ jobs.push(add(u.img),add(u.mask)); });
      Object.values(m.structs).forEach(u=>{ jobs.push(add(u.img),add(u.mask)); });
      Object.values(m.scenery).forEach(s=>jobs.push(add(s.img)));
      return Promise.all(jobs);
    }).then(()=>{ ready=true; });
  }
  function tinted(def,team){
    const k=def.img+'|'+team; let c=tints.get(k); if(c) return c;
    const base=imgs.get(def.img), mask=def.mask&&imgs.get(def.mask); if(!base) return null;
    c=document.createElement('canvas'); c.width=base.width; c.height=base.height;
    const g=c.getContext('2d'); g.drawImage(base,0,0);
    if(mask){
      const t=document.createElement('canvas'); t.width=c.width; t.height=c.height; const tg=t.getContext('2d');
      tg.drawImage(mask,0,0); tg.globalCompositeOperation='source-in'; tg.fillStyle=TEAM[team]; tg.fillRect(0,0,t.width,t.height);
      g.globalCompositeOperation='multiply'; g.drawImage(t,0,0);
      g.globalCompositeOperation='destination-in'; g.drawImage(base,0,0); g.globalCompositeOperation='source-over';
    }
    tints.set(k,c); return c;
  }
  /* contorno branco (lampejo de dano) e silhueta colorida */
  function overlay(g,at,f,dx,dy,col,a){
    scratch.width=f[2]; scratch.height=f[3];
    sg.globalCompositeOperation='source-over'; sg.drawImage(at,f[0],f[1],f[2],f[3],0,0,f[2],f[3]);
    sg.globalCompositeOperation='source-atop'; sg.globalAlpha=a; sg.fillStyle=col; sg.fillRect(0,0,f[2],f[3]); sg.globalAlpha=1; sg.globalCompositeOperation='source-over';
    g.drawImage(scratch,dx,dy);
  }
  /* ângulo de tela → [direção desenhada, espelhar] */
  function dirOf(ang){
    let o=Math.round(ang/(PI/4)); o=((o%8)+8)%8;   // 0=L,1=SE,2=S,3=SO,4=O,5=NO,6=N,7=NE
    return [[2,0],[1,0],[0,0],[1,1],[2,1],[3,1],[4,0],[3,0]][o];
  }
  function info(key){ const al=ALIAS[key]; const d=man&&man.units[al?al[0]:key]; return d?{d:d,k:al?al[1]:1}:null; }
  /* st: {ang (rad, tela), anim:'idle'|'walk'|'atk', ph 0..1, hit, alpha, k (escala extra), tint:{c,a}} → devolve a altura do topo em px */
  function unit(g,key,team,x,y,T,st){
    st=st||{}; const I=info(key);
    if(!I){ token(g,team,x,y,T); return T*.9; }
    const d=I.d, at=tinted(d,team); if(!at){ token(g,team,x,y,T); return T*.9; }
    const s=T/d.ppu*I.k*(st.k||1), dm=dirOf(st.ang==null?PI/2:st.ang), an=d.anims[st.anim]||d.anims.idle;
    const list=an[dm[0]]||an[0], i=Math.min(list.length-1,Math.floor(((st.ph||0)%1+1)%1*list.length)), f=d.frames[list[i]];
    if(!f){ token(g,team,x,y,T); return T*.9; }
    g.save(); g.translate(x,y); if(st.alpha!=null) g.globalAlpha*=st.alpha; if(st.rot) g.rotate(st.rot);
    g.scale(dm[1]?-s:s,s*(st.sy||1));
    g.drawImage(at,f[0],f[1],f[2],f[3],f[4],f[5],f[2],f[3]);
    if(st.hit>0) overlay(g,at,f,f[4],f[5],'#ffffff',Math.min(.85,st.hit*7));
    else if(st.tint) overlay(g,at,f,f[4],f[5],st.tint.c,st.tint.a);
    g.restore();
    return d.top*s;
  }
  function token(g,team,x,y,T){ g.save(); g.fillStyle=TEAM[team]; g.strokeStyle='#21132b'; g.lineWidth=2; g.beginPath(); g.arc(x,y-T*.35,T*.3,0,7); g.fill(); g.stroke(); g.restore(); }
  /* st: {ang (rad, tela, só torres giratórias), fire 0..1 ou null, t, hit, born} */
  function struct(g,key,team,x,y,T,st){
    st=st||{}; const d=man&&man.structs[key]; if(!d){ token(g,team,x,y,T); return T; }
    const at=tinted(d,team); if(!at){ token(g,team,x,y,T); return T; }
    const s=T/d.ppu; let di=0, fl=0;
    if(d.dirs>1){ const dm=dirOf(st.ang==null?-PI/2:st.ang); di=dm[0]; fl=dm[1]; }
    let list=d.anims.idle[di], i;
    const fire=d.anims.fire[di];
    if(st.fire!=null&&fire&&fire.length){ list=fire; i=Math.min(list.length-1,Math.floor(st.fire*list.length)); }
    else i=Math.floor(((st.t||0)/1.4%1)*list.length)%list.length;
    const f=d.frames[list[i]]; if(!f){ token(g,team,x,y,T); return T; }
    g.save(); g.translate(x,y);
    const bs=st.born==null?1:st.born; if(bs<1){ g.scale(1,.3+.7*Math.min(1,bs*1.2)); g.globalAlpha*=Math.min(1,bs*3); }
    g.scale(fl?-s:s,s);
    g.drawImage(at,f[0],f[1],f[2],f[3],f[4],f[5],f[2],f[3]);
    if(st.hit>0) overlay(g,at,f,f[4],f[5],'#ffffff',Math.min(.6,st.hit*5));
    g.restore();
    if(key==='heart'&&st.hpr!=null&&st.hpr<.55) heartFx(g,x,y,T,st);
    return d.top*s;
  }
  function heartFx(g,x,y,T,st){
    const t=st.t||0, hp=st.hpr;
    for(let i=0;i<5;i++){ const q=(t*1.3+i*.21)%1; glow(g,x+(-1+i*.5)*T*.7,y-T*1.6-q*T*.9,T*.3*(1-q)+T*.12,i%2?'#FF8A3D':'#FFD34D',.8*(1-q)); }
    if(hp<.3) for(let i=0;i<4;i++){ const q=(t*.8+i*.27)%1; g.fillStyle='rgba(60,50,60,'+(.5*(1-q)).toFixed(2)+')'; g.beginPath(); g.ellipse(x+(-.6+i*.4)*T+Math.sin(t+i)*3,y-T*1.9-q*T*1.1,T*(.15+q*.25),T*(.12+q*.18),0,0,7); g.fill(); }
  }
  function glow(g,x,y,r,col,a){ if(!(r>0)) return; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(255,255,255,0)'); g.save(); g.globalAlpha=a==null?1:a; g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill(); g.restore(); }
  const portrait=key=>{ const k=ALIAS[key]?ALIAS[key][0]:key; return man&&man.cards[k]?BASE+man.cards[k]+'?v='+VER:''; };
  const scenery=id=>{ if(!man||!man.scenery[id]) return null; const m=man.scenery[id]; const im=imgs.get(m.img); return im?{meta:m,img:im}:null; };
  const hasUnit=k=>!!info(k);
  return {load,unit,struct,portrait,scenery,glow,dirOf,hasUnit,TEAM,isReady:()=>ready,progress:()=>total?done/total:0};
})();

/* utilitários simples de desenho usados pelos efeitos */
const ART={
  unit:SPR.unit, struct:SPR.struct, portrait:SPR.portrait, glow:SPR.glow,
  E(g,x,y,rx,ry,col,lw){ g.beginPath(); g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,6.2832); if(col){ g.fillStyle=col; g.fill(); } if(lw){ g.lineWidth=lw; g.strokeStyle='#26123a'; g.stroke(); } },
  P(g,pts,col,lw){ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); if(col){ g.fillStyle=col; g.fill(); } if(lw){ g.lineWidth=lw; g.lineJoin='round'; g.strokeStyle='#26123a'; g.stroke(); } },
  L(g,x1,y1,x2,y2,w,col,noOut){ g.lineCap='round'; if(!noOut){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w+2.4; g.strokeStyle='#26123a'; g.stroke(); } g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineWidth=w; g.strokeStyle=col; g.stroke(); }
};
