/* Partida: sessão online, painel de cartas, entrada e laço de atualização */
'use strict';
/* ---------- batalha ---------- */
const cv=$('#cv'), ctx=cv.getContext('2d');
const U={G:null,me:0,T:25,dpr:1,bg:null,sel:null,selPiece:null,ptr:null,revealT:0,startT:0,raf:0,last:0,ended:false,time:0,dt:0,frame:0,sig:'',net:null,ready:[false,false],snapAcc:0,oppNick:'Rival',shake:0,scorch:[],aiIdx:0,mi:null,mt:null,battleShown:false};
const HALF=CM.HALF, W=CM.W, H=CM.H;
const VS=new Map(), PTR=new Map();
const isGuest=()=>!!(U.net&&U.net.role==='guest');
const isHost=()=>!!(U.net&&U.net.role==='host');
const hash=n=>{ n=Math.sin(n*127.1+311.7)*43758.5453; return n-Math.floor(n); };
const ease=k=>1-Math.pow(1-k,3);
const angd=(a,b)=>{ let d=a-b; while(d>Math.PI) d-=6.2832; while(d<-Math.PI) d+=6.2832; return d; };
const PX=(x,y)=>U.me?[(W-x)*U.T,(H-y)*U.T]:[x*U.T,y*U.T];
const VT=(c,r)=>U.me?[W-1-c,H-1-r]:[c,r];
const vt=e=>e.team===U.me?0:1;
const dirOf=team=>team===U.me?-1:1;
const airE=e=>!!(e.def&&e.def.fly&&!(e.grounded>0));
const SPELLR={bola_fogo:1.6,raio_arcano:2.5,bencao:2.6,muralha_gelo:1.5,silencio:2.6};

function startAI(){
  if(!okDeck(B.d1)){ toast('Escolha um deck válido'); return; }
  const v=S.decks.map((d,i)=>i).filter(okDeck), ai=v[Math.floor(Math.random()*v.length)]; U.aiIdx=ai;
  U.G=CM.createGame({deckP:S.decks[B.d1].cards.slice(),deckA:S.decks[ai].cards.slice(),diff:B.diff});
  U.me=0; U.net=null; U.oppNick='Rival · '+['Fácil','Normal','Difícil'][B.diff];
  beginGameUI();
}
function beginGameUI(){
  U.sel=null; U.selPiece=null; U.ptr=null; U.ended=false; U.sig=''; U.time=0; U.ready=[false,false]; U.snapAcc=0; U.shake=0; U.scorch=[]; U.battleShown=false; VS.clear(); PTR.clear();
  show('game');
  $('#side0').innerHTML=''; $('#side1').innerHTML=''; $('#side1').hidden=true;
  $('#n0').textContent='Você'; $('#n1').textContent=U.oppNick;
  $('#pbar').hidden=true; fitCanvas(true);
  showBanner(U.G.mapDef.nome,U.G.map.nRoutes+' rotas'); U.revealT=2.2; U.startT=0; startLoop();
}
function fitCanvas(force){
  const ar=$('#arena'), aw=ar.clientWidth||600, ah=ar.clientHeight||300;
  const T=Math.max(14,Math.floor(Math.min(aw/CM.W,ah/CM.H)));
  if(!force&&T===U.T&&U.bg&&cv.style.width===CM.W*T+'px') return;
  U.T=T; U.dpr=Math.min(window.devicePixelRatio||1,2.5);
  cv.style.width=CM.W*T+'px'; cv.style.height=CM.H*T+'px';
  cv.width=Math.floor(CM.W*T*U.dpr); cv.height=Math.floor(CM.H*T*U.dpr);
  ctx.setTransform(U.dpr,0,0,U.dpr,0,0);
  if(U.G) U.bg=renderBG(U.G,T,U.dpr,U.me===1);
}
const refit=()=>{ if(!$('#v-game').hidden){ U.T=0; setTimeout(()=>fitCanvas(),60); } };
if(window.ResizeObserver) new ResizeObserver(()=>{ if(!$('#v-game').hidden) fitCanvas(); }).observe($('#arena'));
window.addEventListener('resize',refit); window.addEventListener('orientationchange',refit);
function showBanner(t,p){ const b=$('#banner'); $('h3',b).textContent=t; $('p',b).textContent=p||''; b.hidden=false; }
function hideBanner(){ $('#banner').hidden=true; }
function startLoop(){ stopLoop(); U.last=performance.now(); U.raf=requestAnimationFrame(frame); }
function stopLoop(){ if(U.raf) cancelAnimationFrame(U.raf); U.raf=0; }
function frame(ts){
  const dt=Math.min(.05,(ts-U.last)/1000); U.last=ts; U.time+=dt; U.dt=dt; U.frame++;
  try{ update(dt); draw(); }catch(e){ console.error(e); }
  if(U.raf) U.raf=requestAnimationFrame(frame);
}

/* ---------- sessão online ---------- */
function send(m){ if(U.net&&U.net.cn){ try{ U.net.cn.send(m); }catch(e){} } }
function closeNet(){ const N=U.net; if(!N) return; U.net=null; clearInterval(N.hb); try{ N.cn.close(); }catch(e){} try{ N.peer.destroy(); }catch(e){} }
function netStart(cn,peer,role){
  ON.state='idle'; ON.code=''; ON.msg=''; closeNet();
  const N=U.net={cn:cn,peer:peer,role:role,last:performance.now(),started:false,hb:null,closing:false};
  cn.on('data',netData); cn.on('close',()=>netClosed('close')); cn.on('error',()=>netClosed('error'));
  N.hb=setInterval(()=>{ send({t:'ping'}); if(performance.now()-N.last>9000) netClosed('timeout'); },2000);
  toast('Conectado! Iniciando a partida…');
  if(role==='guest') send({t:'hello',nick:myNick(),deck:S.decks[B.d1].cards.slice()});
}
function netData(m){
  const N=U.net; if(!N||!m||typeof m!=='object') return; N.last=performance.now();
  if(m.t==='ping'){ send({t:'pong'}); return; }
  if(m.t==='pong') return;
  if(m.t==='bye'){ netClosed('bye'); return; }
  if(N.role==='host') hostMsg(m); else guestMsg(m);
}
function hostMsg(m){
  const N=U.net, G=U.G;
  if(m.t==='hello'){ if(!N.started) hostBegin(m); return; }
  if(!G||!N.started) return;
  if(m.t==='place'&&G.phase==='place'&&typeof m.key==='string'&&Number.isInteger(m.c)&&Number.isInteger(m.r)&&!U.ready[1]) CM.setPiece(G,1,m.key,m.c,m.r);
  else if(m.t==='unplace'&&typeof m.key==='string'&&!U.ready[1]) CM.clearPiece(G,1,m.key);
  else if(m.t==='ready') U.ready[1]=true;
  else if(m.t==='play'&&Number.isInteger(m.i)&&m.i>=0&&m.i<5&&isFinite(m.x)&&isFinite(m.y)) CM.playCard(G,1,m.i,+m.x,+m.y);
  else if(m.t==='swap'&&Number.isInteger(m.i)&&m.i>=0&&m.i<5) CM.discard(G,1,m.i);
}
function hostBegin(m){
  const N=U.net, deck=Array.isArray(m.deck)?m.deck.filter(k=>typeof k==='string'&&CM.CARDS[k]):[];
  if(!Array.isArray(m.deck)||deck.length!==m.deck.length||!CM.validateDeck(deck).ok){ send({t:'err',msg:'Deck inválido'}); netClosed('bad'); return; }
  N.started=true; U.oppNick=clean(m.nick)||'Jogador';
  U.G=CM.createGame({deckP:S.decks[B.d1].cards.slice(),deckA:deck,pvp:true,net:true});
  U.me=0; U.aiIdx=-1;
  send(Object.assign({t:'start',nick:myNick()},CM.mapInfo(U.G)));
  beginGameUI();
}
function guestMsg(m){
  const N=U.net;
  if(m.t==='start'&&!N.started){
    if(!Array.isArray(m.tiles)||!Array.isArray(m.pads)){ netClosed('bad'); return; }
    N.started=true; U.oppNick=clean(m.nick)||'Jogador'; U.G=CM.makeView(m,S.decks[B.d1].cards,1); U.me=1; U.aiIdx=-1; beginGameUI();
  } else if(m.t==='s'&&U.G&&N.started&&Array.isArray(m.e)){ CM.applySnap(U.G,m,performance.now(),1); if(m.sh) U.shake=Math.max(U.shake,m.sh); }
  else if(m.t==='err'){ toast(m.msg||'Erro'); netClosed('bad'); }
}
function netClosed(why){
  const N=U.net; if(!N||N.closing) return; N.closing=true;
  if(N.started&&U.G&&!U.ended){
    U.ended=true; stopLoop();
    const box=el('div'); box.appendChild(el('h3',null,why==='bad'?'Partida cancelada':'Oponente desconectado'));
    box.appendChild(el('p',null,isHost()&&why!=='bad'?'Seu oponente saiu da partida. Vitória por abandono!':'A conexão com o oponente foi perdida.'));
    const row=el('div','row'); const b=el('button','btn hot','Menu'); b.type='button'; b.onclick=()=>{ closeModal(); leaveGame(); }; row.appendChild(b); box.appendChild(row); openModal(box);
  } else if(!N.started){ ON.msg='A conexão foi encerrada antes de começar.'; renderBMenu(); }
  closeNet();
}

/* ---------- painel do jogador ---------- */
function sigOf(){ const G=U.G, S0=G.side[U.me]; return G.phase==='place'?'p'+S0.pieces.map(p=>p.key+(p.pos?1:0)).join()+U.selPiece+U.ready[U.me]:'b'+S0.hand.join()+'|'+S0.queue[0]; }
function doPlay(i,x,y){
  const G=U.G, chk=CM.playCheck(G,U.me,i,x,y); if(!chk.ok) return chk;
  if(isGuest()) send({t:'play',i:i,x:Math.round(x*100)/100,y:Math.round(y*100)/100}); else CM.playCard(G,U.me,i,x,y);
  return chk;
}
function doSwap(i){
  const G=U.G; if(G.phase!=='battle'||G.side[U.me].mana<1) return false;
  if(isGuest()){ send({t:'swap',i:i}); return true; } return CM.discard(G,U.me,i);
}
function buildPanel(){
  const G=U.G, S0=G.side[U.me], box=$('#side0'); box.innerHTML='';
  const m=el('div','mana'), mi=el('i'), mt=el('span'); m.appendChild(mi); m.appendChild(mt); U.mi=mi; U.mt=mt;
  const bot=el('div','bot'); bot.appendChild(m);
  if(G.phase==='place'){
    box.appendChild(el('b','pt','Posicione suas construções'));
    const row=el('div','pieces');
    S0.pieces.forEach(p=>{
      const c=CM.CARDS[p.key], b=el('button','chip'+(p.pos?' placed':'')+(U.selPiece===p.key?' sel':'')); b.type='button'; b.disabled=!!U.ready[U.me]&&!!U.net;
      b.appendChild(img(p.key,null,30)); b.appendChild(el('span',null,c.nome+(p.pos?' ✓':'')));
      b.onclick=()=>{ if(p.pos){ p.pos=null; if(isGuest()) send({t:'unplace',key:p.key}); } U.selPiece=p.key; };
      row.appendChild(b);
    });
    box.appendChild(row);
    const ok=el('button','btn go',U.ready[U.me]?'Aguardando…':'Pronto'); ok.type='button'; ok.disabled=!!U.ready[U.me]&&!!U.net;
    ok.onclick=()=>{ if(U.net){ U.ready[U.me]=true; if(isGuest()) send({t:'ready'}); U.sig=''; } else G.placeT=0; };
    bot.appendChild(ok);
  } else {
    const row=el('div','hrow');
    S0.hand.forEach((k,i)=>{
      const c=CM.CARDS[k], b=el('button','hc t-'+c.tipo); b.type='button';
      const art=el('span','art'); art.appendChild(img(k,null,60)); b.appendChild(art);
      b.appendChild(el('span','n',c.nome)); b.appendChild(el('span','c',String(c.custo)));
      b.onclick=()=>{ U.sel=U.sel===i?null:i; U.ptr=null; };
      row.appendChild(b);
    });
    box.appendChild(row);
    const nk=S0.queue[0], nx=el('div','nx2'); if(nk){ nx.appendChild(img(nk,null,24)); } nx.appendChild(el('span',null,'Próx.')); bot.appendChild(nx);
    const sw=el('button','btn','Trocar (1)'); sw.type='button';
    sw.onclick=()=>{ if(U.sel==null) return toast('Escolha uma carta para trocar'); if(doSwap(U.sel)) U.sel=null; else toast('Mana insuficiente'); };
    bot.appendChild(sw);
  }
  box.appendChild(bot); U.sig=sigOf();
}
function updatePanel(){
  const G=U.G, S0=G.side[U.me];
  if(U.sig!==sigOf()) buildPanel();
  if(U.mi){ U.mi.style.width=(S0.mana/CM.MAXMANA*100)+'%'; U.mt.textContent=Math.floor(S0.mana)+' / '+CM.MAXMANA; }
  if(G.phase!=='battle') return;
  [...$('#side0').querySelectorAll('.hc')].forEach((b,i)=>{
    const k=S0.hand[i], c=CM.CARDS[k]; if(!c) return;
    b.classList.toggle('sel',U.sel===i); b.classList.toggle('dim',S0.mana<c.custo); b.classList.toggle('block',!!CM.spellReason(G,U.me,k));
  });
}
$('#g-quit').onclick=()=>{
  const box=el('div'); box.appendChild(el('h3',null,'Sair da batalha?')); box.appendChild(el('p',null,U.net?'Você perde a partida e o oponente é avisado.':'A partida atual será perdida.'));
  const row=el('div','row');
  const a=el('button','btn','Continuar'); a.type='button'; a.onclick=closeModal;
  const b=el('button','btn hot','Sair'); b.type='button'; b.onclick=()=>{ closeModal(); leaveGame(); };
  row.appendChild(a); row.appendChild(b); box.appendChild(row); openModal(box);
};
function leaveGame(){ stopLoop(); if(U.net) send({t:'bye'}); closeNet(); U.G=null; ON.state='idle'; renderBMenu(); show('bmenu'); }
function tapPlace(c,r){
  const G=U.G, ps=G.side[U.me].pieces; if(U.ready[U.me]&&U.net) return;
  const at=ps.find(p=>p.pos&&p.pos.c===c&&p.pos.r===r);
  if(at){ at.pos=null; U.selPiece=at.key; if(isGuest()) send({t:'unplace',key:at.key}); return; }
  if(!U.selPiece||ps.find(p=>p.key===U.selPiece).pos){ const nx=ps.find(p=>!p.pos); if(nx) U.selPiece=nx.key; else return; }
  if(CM.setPiece(G,U.me,U.selPiece,c,r)){
    if(isGuest()) send({t:'place',key:U.selPiece,c:c,r:r});
    const nx=ps.find(p=>!p.pos); U.selPiece=nx?nx.key:null;
  } else toast('Use um dos pontos de construção do seu lado');
}
function toLogic(e){
  const rect=cv.getBoundingClientRect(); const vx=(e.clientX-rect.left)/rect.width*W, vy=(e.clientY-rect.top)/rect.height*H;
  return {vx:vx,vy:vy,x:U.me?W-vx:vx,y:U.me?H-vy:vy};
}
cv.addEventListener('pointerdown',e=>{
  if(!U.G||U.revealT>0||U.startT>0||U.ended) return;
  const p=toLogic(e), G=U.G; U.ptr={x:p.vx,y:p.vy};
  if(G.phase==='place'){ tapPlace(Math.floor(p.x),Math.floor(p.y)); return; }
  if(G.phase!=='battle'||U.sel==null) return;
  const r=doPlay(U.sel,p.x,p.y);
  if(r.ok){ U.sel=null; U.ptr=null; U.sig=''; } else if(r.msg) toast(r.msg);
});
cv.addEventListener('pointermove',e=>{ if(U.G&&e.pointerType==='mouse'){ const p=toLogic(e); U.ptr={x:p.vx,y:p.vy}; } });
cv.addEventListener('pointerleave',()=>{ U.ptr=null; });

/* ---------- laço de atualização ---------- */
function fmt(t){ t=Math.max(0,Math.ceil(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
function hudUpdate(){
  const G=U.G, a=G.hearts[U.me], b=G.hearts[1-U.me];
  if(a) $('#hp-me').style.width=Math.max(0,a.hp/a.maxhp*100)+'%';
  if(b) $('#hp-foe').style.width=Math.max(0,b.hp/b.maxhp*100)+'%';
  $('#clock').textContent=fmt(G.phase==='battle'?CM.MATCH-G.t:CM.MATCH);
}
function pbarText(){ const G=U.G, p=$('#pbar'); p.hidden=false; p.textContent='Posicione · '+fmt(G.placeT)+(U.net&&U.ready[1-U.me]?' · rival pronto':''); }
function hostNet(dt){
  const N=U.net; if(!N||N.role!=='host'||!N.started) return;
  U.snapAcc+=dt; if(U.snapAcc>=.05){ U.snapAcc=0; send(CM.snapshot(U.G,1)); }
}
function update(dt){
  const G=U.G; if(!G) return;
  if(isGuest()){ updateGuest(dt); return; }
  if(G.shake){ U.shake=Math.max(U.shake,G.shake); G.shake=0; }
  if(U.revealT>0){
    U.revealT-=dt;
    if(U.revealT<=0){
      hideBanner(); const ps=G.side[0].pieces;
      if(ps.length){ U.selPiece=ps[0].key; } else { U.ready[0]=true; if(!U.net) G.placeT=0; }
      if(U.net&&!G.side[1].pieces.length) U.ready[1]=true;
      U.sig='';
    }
    hostNet(dt); return;
  }
  if(G.phase==='place'){
    G.placeT-=dt; if(U.net&&U.ready[0]&&U.ready[1]) G.placeT=0;
    pbarText(); updatePanel(); hudUpdate();
    if(G.placeT<=0){ CM.startBattle(G); $('#pbar').hidden=true; U.sel=null; U.sig=''; showBanner('Já!','A batalha começou'); U.startT=1; }
    hostNet(dt); return;
  }
  if(U.startT>0){ U.startT-=dt; if(U.startT<=0) hideBanner(); } else CM.step(G,dt);
  updatePanel(); hudUpdate(); hostNet(dt);
  if(G.over&&!U.ended){ U.ended=true; endGame(); }
}
function updateGuest(dt){
  const G=U.G;
  if(U.revealT>0){
    U.revealT-=dt;
    if(U.revealT<=0){ hideBanner(); const ps=G.side[1].pieces; if(ps.length) U.selPiece=ps[0].key; else { U.ready[1]=true; send({t:'ready'}); } U.sig=''; }
  }
  CM.interpView(G,performance.now()); CM.ageView(G,dt);
  if(G.shake){ U.shake=Math.max(U.shake,G.shake); G.shake=0; }
  if(U.revealT>0) return;
  if(G.phase==='place'){ pbarText(); } else { $('#pbar').hidden=true; if(!U.battleShown){ U.battleShown=true; showBanner('Já!','A batalha começou'); U.startT=1; U.sel=null; U.sig=''; } }
  if(U.startT>0){ U.startT-=dt; if(U.startT<=0) hideBanner(); }
  updatePanel(); hudUpdate();
  if(G.over&&!U.ended){ U.ended=true; endGame(); }
}
function endGame(){
  const G=U.G, w=G.winner, me=U.me;
  const box=el('div');
  box.appendChild(el('h3',null,w===me?'Vitória! 🏆':w===2?'Empate':'Derrota'));
  const dead=(G.hearts[0]&&G.hearts[0].dead)||(G.hearts[1]&&G.hearts[1].dead);
  box.appendChild(el('p',null,dead?(w===me?'Você derrubou o Coração do rival.':'O seu Coração foi derrubado.'):'O tempo acabou; venceu quem tinha mais vida no Coração.'));
  box.appendChild(el('p','muted',U.net?'Oponente: '+U.oppNick:'Rival usou: '+S.decks[U.aiIdx].name));
  const row=el('div','row');
  const a=el('button','btn hot',U.net?'Voltar ao menu':'Jogar de novo'); a.type='button'; a.onclick=()=>{ closeModal(); if(U.net) leaveGame(); else startAI(); };
  const b=el('button','btn','Menu'); b.type='button'; b.onclick=()=>{ closeModal(); leaveGame(); };
  row.appendChild(b); row.appendChild(a); box.appendChild(row);
  setTimeout(()=>openModal(box),(G.hearts[0]&&G.hearts[0].dead)||(G.hearts[1]&&G.hearts[1].dead)?1600:600);
}
