'use strict';
/* Som do jogo: música em loop (menu, preparo, batalha) e efeitos (arquivo único com índice).
   Os arquivos vêm de assets/audio e são gerados por tools/gerar_audio.py. O navegador só libera o áudio depois do primeiro toque. */
const AUD=(function(){
  const BASE='assets/audio/', VER=2;
  const PREF={m:true,s:true,mv:.6,sv:.9};
  try{ Object.assign(PREF,JSON.parse(localStorage.getItem('vd:snd')||'{}')); }catch(e){}
  let ctx=null, master=null, musG=null, sfxG=null, sfxBuf=null, sprite=null, started=false, cur=null, want=null, duck=0, voices=0;
  const mbuf={}, loading={}, last={};
  const VAR={sword:['sword1','sword2','sword3'],punch:['punch1','punch2'],arrow:['arrow1','arrow2']};
  const save=()=>{ try{ localStorage.setItem('vd:snd',JSON.stringify(PREF)); }catch(e){} };
  function apply(){ if(!ctx) return; const t=ctx.currentTime; musG.gain.setTargetAtTime(PREF.m?PREF.mv*(duck?.25:1):0,t,.1); sfxG.gain.setTargetAtTime(PREF.s?PREF.sv:0,t,.05); }
  function fetchBuf(name){ return fetch(BASE+name+'?v='+VER).then(r=>r.arrayBuffer()).then(b=>new Promise((res,rej)=>ctx.decodeAudioData(b,res,rej))); }
  function loadSfx(){ if(sfxBuf||loading.sfx) return; loading.sfx=1; Promise.all([fetchBuf('sfx.mp3'),fetch(BASE+'sfx.json?v='+VER).then(r=>r.json())]).then(r=>{ sfxBuf=r[0]; sprite=r[1]; }).catch(()=>{}); }
  function loadMusic(n){ if(mbuf[n]) return Promise.resolve(mbuf[n]); if(loading[n]) return loading[n]; loading[n]=fetchBuf('musica-'+n+'.mp3').then(b=>{ mbuf[n]=b; return b; }).catch(()=>null); return loading[n]; }
  function init(){
    if(ctx) return true; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    try{ ctx=new AC(); }catch(e){ return false; }
    master=ctx.createGain(); master.connect(ctx.destination); musG=ctx.createGain(); sfxG=ctx.createGain(); musG.connect(master); sfxG.connect(master); apply(); loadSfx(); return true;
  }
  function unlock(){ if(!init()) return; if(ctx.state==='suspended') ctx.resume(); if(!started){ started=true; if(want) startMusic(want); } }
  ['pointerdown','keydown','touchend'].forEach(ev=>window.addEventListener(ev,unlock,{passive:true}));
  document.addEventListener('visibilitychange',()=>{ if(!ctx) return; if(document.hidden) ctx.suspend(); else ctx.resume(); });
  function fadeOut(c,s){ if(!c) return; const t=ctx.currentTime; c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value,t); c.g.gain.linearRampToValueAtTime(0,t+s); setTimeout(()=>{ try{ c.src.stop(); }catch(e){} },s*1000+80); }
  function startMusic(name){
    if(!ctx||!started) return; if(cur&&cur.name===name) return;
    loadMusic(name).then(buf=>{
      if(!buf||want!==name||(cur&&cur.name===name)) return;
      const src=ctx.createBufferSource(); src.buffer=buf; src.loop=true; const g=ctx.createGain(); g.gain.value=0; src.connect(g); g.connect(musG); src.start(0);
      g.gain.linearRampToValueAtTime(1,ctx.currentTime+1.3); const old=cur; cur={name:name,src:src,g:g}; fadeOut(old,1.1);
    });
  }
  function music(name){
    want=name;
    if(name===null){ fadeOut(cur,1.2); cur=null; return; }
    startMusic(name);
    // pré-carrega a música de batalha enquanto o jogador está no menu
    if(ctx&&started&&name==='preparo') loadMusic('batalha');
  }
  /* o: {vol, pan(-1..1), rate, min (intervalo mínimo em s)} */
  function sfx(name,o){
    if(!ctx||!started||!PREF.s||!sfxBuf||!sprite||document.hidden) return;
    o=o||{}; const arr=VAR[name], key=arr?arr[Math.floor(Math.random()*arr.length)]:name, s=sprite[key]; if(!s) return;
    const now=ctx.currentTime; if(last[name]&&now-last[name]<(o.min||.05)) return; last[name]=now; if(voices>22) return;
    const src=ctx.createBufferSource(); src.buffer=sfxBuf; src.playbackRate.value=o.rate||(.95+Math.random()*.1);
    const g=ctx.createGain(); g.gain.value=o.vol==null?1:o.vol;
    if(ctx.createStereoPanner&&o.pan){ const p=ctx.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,o.pan)); g.connect(p); p.connect(sfxG); } else g.connect(sfxG);
    src.connect(g); voices++; src.onended=()=>{ voices--; }; src.start(now,s[0],s[1]);
  }
  function jingle(name){ sfx(name,{vol:1,rate:1,min:0}); duck=1; apply(); setTimeout(()=>{ duck=0; apply(); },4600); }
  function set(k,v){ PREF[k]=v; save(); apply(); }
  return {music,sfx,jingle,set,pref:PREF,unlock,debug:()=>({started:started,ctx:ctx&&ctx.state,sfx:!!sfxBuf,music:Object.keys(mbuf),cur:cur&&cur.name,voices:voices})};
})();
