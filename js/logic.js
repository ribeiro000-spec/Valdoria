/* Regras do jogo (sem DOM): cartas, decks, mapas procedurais, simulação, IA e sincronização do multiplayer. */
'use strict';
const CM = (function(){

const W=14, H=18, HALF=9, MATCH=180, MAXMANA=10, REGEN=2.2, AGGRO=6.5, PLACE_TIME=25, SPD=.75;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r;
function shuffle(a,rng){ rng=rng||Math.random; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
const mkSt=()=>({slow:0,slowM:1,root:0,freeze:0,silence:0});

/* ---------- cartas ---------- */
const CARDS={
  cavaleiro:{tipo:'tropa',nome:'Cavaleiro',custo:3,info:'Tanque físico que ataca o inimigo mais próximo.',
    u:{hp:420,sp:1.3,rg:1.1,dm:38,iv:1,ty:'phys',rs:[.35,0],tg:'near',r:.38}},
  berserker:{tipo:'tropa',nome:'Berserker',custo:3,info:'Dano alto e defesa baixa. Ataca o mais próximo.',
    u:{hp:260,sp:1.9,rg:1.1,dm:58,iv:.85,ty:'phys',rs:[0,0],tg:'near',r:.36}},
  ladino:{tipo:'tropa',nome:'Ladino',custo:3,info:'Rápido, ignora armadura e caça atiradores e magos.',
    u:{hp:190,sp:2.4,rg:1,dm:44,iv:.7,ty:'pierce',rs:[0,0],tg:'hunt',r:.32}},
  arqueira:{tipo:'tropa',nome:'Arqueira',custo:3,info:'Atira de longe e recua devagar quando alguém se aproxima.',
    u:{hp:150,sp:1.4,rg:5,dm:27,iv:.9,ty:'phys',proj:1,rs:[0,0],tg:'near',retreat:1,aa:1.5,r:.32}},
  mago:{tipo:'tropa',nome:'Mago',custo:4,info:'Dano mágico em área. Frágil e recua quando pressionado.',
    u:{hp:140,sp:1.2,rg:4.5,dm:52,iv:1.5,ty:'magic',proj:1,aoe:1,rs:[0,.1],tg:'near',retreat:1,magicUser:1,r:.32}},
  necromante:{tipo:'tropa',nome:'Necromante',custo:4,info:'Invoca 2 esqueletos a cada 6 s. Recua quando pressionado.',
    u:{hp:170,sp:1.1,rg:4,dm:20,iv:1.3,ty:'magic',proj:1,rs:[0,.1],tg:'near',retreat:1,magicUser:1,summon:1,r:.34}},
  druida:{tipo:'tropa',nome:'Druida',custo:3,info:'Suas raízes prendem o alvo por 1,5 s. Recua quando pressionado.',
    u:{hp:190,sp:1.2,rg:4.5,dm:20,iv:1.5,ty:'magic',proj:1,root:1.5,rs:[0,.25],tg:'near',retreat:1,magicUser:1,r:.34}},
  clerigo:{tipo:'tropa',nome:'Clérigo',custo:3,info:'Cura as tropas aliadas próximas. Segue o grupo.',
    u:{hp:180,sp:1.3,rg:3.5,dm:0,iv:1.4,ty:'magic',heal:45,rs:[0,.3],tg:'sup',magicUser:1,r:.34}},
  bardo:{tipo:'tropa',nome:'Bardo',custo:3,info:'Aumenta a velocidade de ataque dos aliados próximos.',
    u:{hp:160,sp:1.5,rg:3,dm:14,iv:1.2,ty:'magic',proj:1,aura:3.5,rs:[0,0],tg:'sup',magicUser:1,r:.32}},
  golem:{tipo:'tropa',nome:'Golem de Pedra',custo:5,info:'Lento e muito resistente. Ignora tropas e foca construções.',
    u:{hp:900,sp:.7,rg:1.3,dm:70,iv:1.8,ty:'phys',rs:[.5,.2],tg:'struct',r:.55}},
  ariete:{tipo:'tropa',nome:'Aríete',custo:4,info:'Ignora tudo e corre ao Coração. Frágil contra magia.',
    u:{hp:330,sp:1.5,rg:1.1,dm:110,iv:1.3,ty:'phys',rs:[.2,-.3],tg:'tower',r:.45}},
  grifo:{tipo:'tropa',nome:'Grifo',custo:4,info:'Voador veloz. Ignora obstáculos e muralhas; só projéteis e outros voadores o atingem.',
    u:{hp:320,sp:2,rg:1.1,dm:46,iv:1,ty:'phys',rs:[.15,0],tg:'near',fly:1,r:.4}},
  morcegos:{tipo:'tropa',nome:'Morcegos',custo:3,info:'Invoca 3 morcegos voadores. Frágeis contra magia em área.',sw:3,
    u:{hp:45,sp:2.6,rg:1,dm:12,iv:.7,ty:'phys',rs:[0,0],tg:'near',fly:1,r:.22}},
  gargula:{tipo:'tropa',nome:'Gárgula',custo:3,info:'Voadora de pedra: quase imune a flechas, frágil contra magia.',
    u:{hp:360,sp:1,rg:1.1,dm:40,iv:1.4,ty:'phys',rs:[.5,-.2],tg:'near',fly:1,r:.4}},
  wyvern:{tipo:'tropa',nome:'Wyvern',custo:5,info:'Voadora que cospe fogo em área, à distância.',
    u:{hp:480,sp:1.5,rg:3.5,dm:55,iv:1.6,ty:'magic',proj:1,aoe:.9,rs:[.2,.1],tg:'near',fly:1,r:.5}},
  fada:{tipo:'tropa',nome:'Fada Curandeira',custo:3,info:'Voadora de suporte: cura aliados e remove lentidão, raiz, congelamento e silêncio.',
    u:{hp:120,sp:2,rg:3.5,dm:0,iv:1.2,ty:'magic',heal:30,cleanse:1,rs:[0,.3],tg:'sup',magicUser:1,fly:1,r:.3}},
  engenheiro:{tipo:'tropa',nome:'Engenheiro',custo:3,info:'Vai até a construção mais ferida e restaura 35% da vida dela, uma vez. Depois luta.',
    u:{hp:200,sp:1.5,rg:1,dm:25,iv:1,ty:'phys',rs:[.1,0],tg:'near',repair:.35,r:.34}},

  canhao:{tipo:'constr',nome:'Canhão',info:'Dispara balas de ferro nas tropas terrestres. Não alcança voadores.',
    s:{ground:1,hp:400,rg:6,dm:45,iv:1.3,ty:'phys',proj:1,rs:[.2,0]}},
  balista:{tipo:'constr',nome:'Balista',info:'Torre antiaérea: dano dobrado contra voadores.',
    s:{hp:380,rg:7.5,dm:70,iv:2,ty:'pierce',proj:1,aa:2,rs:[.1,0]}},
  torre_arcana:{tipo:'constr',nome:'Torre Arcana',info:'Dispara magia nas tropas inimigas.',
    s:{hp:330,rg:5.5,dm:40,iv:1.4,ty:'magic',proj:1,rs:[0,.3],magicUser:1}},
  muralha:{tipo:'constr',nome:'Muralha',info:'Bloqueia parte da trilha e força desvios.',
    s:{hp:650,rs:[.3,0]}},
  altar:{tipo:'constr',nome:'Altar de Cura',info:'Cura as tropas e construções aliadas ao redor.',
    s:{hp:300,heal:{r:3,v:20},rs:[0,.2],magicUser:1}},
  quartel:{tipo:'constr',nome:'Quartel',info:'Gera um soldado a cada 7 s (até 3 vivos).',
    s:{hp:350,spawn:{every:7},rs:[.1,0]}},

  espinhos:{tipo:'feitico',nome:'Espinhos',custo:2,info:'Espinhos brotam no alvo: 80 de dano físico e lentidão de 3 s em área. Só atinge terrestres.',z:{r:1.5,dm:80,ty:'phys',slow:.5,slowT:3,gnd:1,c:'#C9D3DD'}},
  runa:{tipo:'feitico',nome:'Runa Explosiva',custo:3,info:'Explosão mágica de 220 de dano em área.',z:{r:1.9,dm:220,ty:'magic',c:'#B58CFF'}},
  selo_gelo:{tipo:'feitico',nome:'Selo de Gelo',custo:3,info:'Congela as tropas inimigas na área por 2,5 s.',z:{r:1.9,dm:30,ty:'magic',freeze:2.5,c:'#9FE3FF'}},
  rede:{tipo:'feitico',nome:'Rede de Caça',custo:3,info:'Prioriza voadores: 70 de dano e os derruba por 4 s. Em terrestres causa só 25 de dano e lentidão.',z:{r:1.9,dm:70,ty:'phys',gdm:25,slow:.6,slowT:2,ground:4,c:'#E8D9A8'}},
  tempestade:{tipo:'feitico',nome:'Tempestade',custo:3,info:'Raios derrubam voadores na área por 3 s e causam 60 de dano mágico a eles.',z:{r:2.6,dm:60,ty:'magic',airOnly:1,ground:3,c:'#8FB8FF'}},
  bola_fogo:{tipo:'feitico',nome:'Bola de Fogo',custo:4,req:['canhao'],reqTxt:'Canhão ativo',
    info:'O Canhão lança uma bola de fogo: 190 de dano mágico em área.'},
  raio_arcano:{tipo:'feitico',nome:'Raio Arcano',custo:3,req:['torre_arcana','mago'],reqTxt:'Torre Arcana ou Mago ativo',
    info:'Raio mágico de 120 de dano que atinge até 3 inimigos perto do alvo.'},
  bencao:{tipo:'feitico',nome:'Bênção',custo:3,req:['clerigo','altar'],reqTxt:'Clérigo ou Altar de Cura ativo',
    info:'Cura 160 de vida das suas tropas e construções na área.'},
  muralha_gelo:{tipo:'feitico',nome:'Muralha de Gelo',custo:3,
    info:'Cria uma barreira de 3 casas por 7 s. Bloqueia todos e os projéteis físicos.'},
  silencio:{tipo:'feitico',nome:'Silêncio',custo:3,
    info:'Inimigos que usam magia ficam mudos por 5 s na área.'}
};
Object.keys(CARDS).forEach(k=>{ CARDS[k].id=k; });
const SUMM={
  esqueleto:{n:'Esqueleto',hp:40,sp:2,rg:1,dm:14,iv:.8,ty:'phys',rs:[0,0],tg:'near',r:.25},
  soldado:{n:'Soldado',hp:90,sp:1.6,rg:1,dm:20,iv:.9,ty:'phys',rs:[0,0],tg:'near',r:.3}
};
const DIFF=[{iv:[2.6,3.8],sp:.35,reg:.85,cnt:0},{iv:[1.3,2.8],sp:.8,reg:1,cnt:0},{iv:[.7,1.5],sp:1,reg:1.2,cnt:1}];
const HEART={hp:1600,rg:6,dm:34,iv:1.2,ty:'phys',proj:1,rs:[.3,.3]};
const ORDER={
  tropa:['cavaleiro','berserker','ladino','arqueira','mago','necromante','druida','clerigo','bardo','golem','ariete','engenheiro','grifo','morcegos','gargula','wyvern','fada'],
  constr:['canhao','torre_arcana','balista','muralha','altar','quartel'],
  armad:[],
  feitico:['bola_fogo','raio_arcano','bencao','muralha_gelo','silencio','espinhos','runa','selo_gelo','rede','tempestade']
};
const isStruct=k=>{ return CARDS[k].tipo==='constr'; };
const TG={near:'ataca o inimigo mais próximo',hunt:'caça atiradores e magos',struct:'ignora tropas e foca construções',tower:'ignora tudo e vai ao Coração',sup:'suporte: segue as tropas aliadas'};
const TY={phys:'físico',magic:'mágico',pierce:'físico (ignora armadura)'};
const pct=v=>Math.round(v*100)+'%';

function statLines(k){
  const c=CARDS[k], o=[];
  if(c.tipo==='tropa'){
    const u=c.u;
    o.push('Vida '+u.hp+' · Velocidade '+(u.sp*SPD).toFixed(2));
    if(u.dm>0) o.push('Dano '+u.dm+' ('+TY[u.ty]+') · Alcance '+u.rg);
    if(u.heal) o.push('Cura '+u.heal+' a cada '+u.iv+' s · Alcance '+u.rg);
    o.push('Resistência física '+pct(u.rs[0])+' · mágica '+pct(u.rs[1]));
    if(u.fly) o.push('Voador: ignora trilhas, obstáculos e muralhas');
    o.push('Comportamento: '+TG[u.tg]+(u.retreat?'; recua quando pressionado':''));
  } else if(c.tipo==='constr'){
    const s=c.s;
    o.push('Vida '+s.hp+' · Ocupa 1 ponto de construção');
    if(s.dm) o.push('Dano '+s.dm+' ('+TY[s.ty]+') · Alcance '+s.rg);
    o.push('Resistência física '+pct(s.rs[0])+' · mágica '+pct(s.rs[1]));
  } else if(c.tipo==='armad'){
    o.push('Fica escondida do rival até disparar. Dispara uma vez.');
  } else {
    o.push('Custo '+c.custo+' de mana · Requisito: '+(c.reqTxt||'nenhum'));
  }
  return o;
}

/* ---------- decks ---------- */
function validateDeck(ids){
  const errs=[], warns=[];
  let tr=0, sp=0, st=0, sum=0;
  ids.forEach(k=>{ const c=CARDS[k]; if(!c) return; if(c.tipo==='tropa'){tr++;sum+=c.custo;} else if(c.tipo==='feitico'){sp++;sum+=c.custo;} else st++; });
  const n=ids.length, play=tr+sp;
  if(n<8) errs.push('Faltam '+(8-n)+' carta(s): o deck precisa de 8 a 12.');
  if(n>12) errs.push('Sobram '+(n-12)+' carta(s): o máximo é 12.');
  if(play<6) errs.push('Mínimo de 6 cartas jogáveis (tropas + feitiços).');
  if(st>4) errs.push('Máximo de 4 construções/armadilhas.');
  if(!ids.some(k=>{ const c=CARDS[k]; return c&&((c.u&&(c.u.proj||c.u.fly))||(c.s&&c.s.proj&&!c.s.ground)||(c.z&&c.z.ground)); })) warns.push('Seu deck não tem como atacar voadores (use arqueira, mago, balista, rede...).');
  ids.forEach(k=>{
    const c=CARDS[k]; if(!c||c.tipo!=='feitico'||!c.req) return;
    if(!c.req.some(r=>ids.indexOf(r)>=0)) warns.push(c.nome+' precisa de: '+c.reqTxt+'. Sem isso, a carta fica bloqueada.');
  });
  return {ok:errs.length===0, errs, warns, n, play, st, avg: play?sum/play:0};
}
const DEFAULT_DECK=['cavaleiro','arqueira','mago','clerigo','ladino','engenheiro','bola_fogo','bencao','canhao','muralha','espinhos','altar'];
function randomDeck(rng){
  rng=rng||Math.random;
  const builds=ORDER.constr.concat(ORDER.armad);
  for(let tries=0;tries<300;tries++){
    const n=8+Math.floor(rng()*5);
    const maxSt=Math.min(4,n-6);
    const ns=Math.floor(rng()*(maxSt+1));
    const play=n-ns;
    const nsp=Math.min(Math.floor(rng()*4), play-3);
    const ids=shuffle(builds.slice(),rng).slice(0,ns)
      .concat(shuffle(ORDER.tropa.slice(),rng).slice(0,play-nsp))
      .concat(shuffle(ORDER.feitico.slice(),rng).slice(0,nsp));
    const v=validateDeck(ids);
    if(v.ok && v.warns.length===0) return ids;
  }
  return DEFAULT_DECK.slice();
}

/* ---------- mapas procedurais ---------- */
const MAPS=[
  {id:'floresta',nome:'Floresta Sussurrante',slow:'Lama'},
  {id:'ruinas',nome:'Ruínas Antigas',slow:'Entulho'},
  {id:'deserto',nome:'Deserto Escaldante',slow:'Areia fofa'},
  {id:'montanha',nome:'Pico Nevado',slow:'Neve funda'},
  {id:'lava',nome:'Vale de Lava',slow:'Cinzas'},
  {id:'ceu',nome:'Palácio do Céu',slow:'Nuvens'}
];
function newGrid(v){ const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(v)); return g; }
function connected(tiles){
  const gx=W>>1, gy=H-4, seen=new Uint8Array(W*H), q=[3*W+(W>>1)];
  seen[q[0]]=1;
  while(q.length){
    const cur=q.pop(), c=cur%W, r=(cur/W)|0;
    if(c===gx&&r===gy) return true;
    const ds=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let i=0;i<4;i++){
      const nc=c+ds[i][0], nr=r+ds[i][1];
      if(nc<0||nr<0||nc>=W||nr>=H) continue;
      const ni=nr*W+nc;
      if(seen[ni]||tiles[nr][nc]==='#') continue;
      seen[ni]=1; q.push(ni);
    }
  }
  return false;
}
function genMap(rng){
  const tiles=[], road=newGrid(false);
  for(let r=0;r<H;r++) tiles.push(new Array(W).fill('#'));
  const rr=(a,b)=>a+rng()*(b-a);
  const ys=[3.5,6.5,9,11.5,H-3.5];
  const rot=pts=>pts.map(p=>({x:W-p.x,y:H-p.y}));
  const drift=x0=>{ const xs=[x0]; for(let k=1;k<5;k++) xs.push(clamp(xs[k-1]+rr(-3,3),1.8,W-1.8)); return xs.map((x,k)=>({x:x,y:ys[k]})); };
  const nR=rng()<.5?3:4, routes=[];
  if(nR===4){
    const a=drift(rr(2.2,4.4)), b=drift(rr(5.2,6.4));
    routes.push(a,rot(a),b,rot(b));
  } else {
    const a=drift(rr(2.2,4.6)); routes.push(a,rot(a));
    const a0=rr(5.8,8.2), a1=clamp(a0+rr(-3,3),3,W-3);
    routes.push([{x:a0,y:3.5},{x:a1,y:6.5},{x:W/2,y:H/2},{x:W-a1,y:H-6.5},{x:W-a0,y:H-3.5}]);
  }
  const cnt=new Uint8Array(W*H);
  routes.forEach(pts=>{
    const seen=new Uint8Array(W*H);
    for(let k=0;k+1<pts.length;k++){
      const a=pts[k], b=pts[k+1], L=Math.hypot(b.x-a.x,b.y-a.y), n=Math.max(1,Math.ceil(L/.2));
      for(let i=0;i<=n;i++){
        const sx=a.x+(b.x-a.x)*i/n, sy=a.y+(b.y-a.y)*i/n;
        for(let r=Math.floor(sy-1.2);r<=Math.floor(sy+1.2);r++) for(let c=Math.floor(sx-1.2);c<=Math.floor(sx+1.2);c++){
          if(c<0||r<0||c>=W||r>=H) continue;
          if(Math.hypot(c+.5-sx,r+.5-sy)<1.0){ road[r][c]=true; if(!seen[r*W+c]){ seen[r*W+c]=1; cnt[r*W+c]++; } }
        }
      }
    }
  });
  for(let r=0;r<H;r++) for(let c=0;c<W;c++){
    if((r<=3||r>=H-4)&&c>=2&&c<=W-3) road[r][c]=true;
    if(road[r][c]) tiles[r][c]='.';
  }
  // cruzamentos e zona de cruzamento
  const juncZone=newGrid(false);
  for(let r=4;r<H-4;r++) for(let c=0;c<W;c++){
    if(cnt[r*W+c]>=2){
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r+dr, nc=c+dc; if(nr>=0&&nc>=0&&nr<H&&nc<W) juncZone[nr][nc]=true;
      }
    }
  }
  // obstáculos nas trilhas (simétricos)
  const obst=[];
  const cand=[];
  for(let r=4;r<=HALF-1;r++) for(let c=0;c<W;c++) if(tiles[r][c]==='.'&&road[r][c]&&!juncZone[r][c]) cand.push([c,r]);
  shuffle(cand,rng);
  const wantO=2+Math.floor(rng()*2);
  for(let i=0;i<cand.length&&obst.length<wantO;i++){
    const c=cand[i][0], r=cand[i][1], m=[W-1-c,H-1-r];
    if(obst.some(o=>Math.max(Math.abs(o[0]-c),Math.abs(o[1]-r))<3)) continue;
    tiles[r][c]='#'; tiles[m[1]][m[0]]='#';
    if(connected(tiles)) obst.push([c,r]); else { tiles[r][c]='.'; tiles[m[1]][m[0]]='.'; }
  }
  // trechos lentos (simétricos)
  const slow=[];
  shuffle(cand,rng);
  for(let i=0;i<cand.length&&slow.length<3;i++){
    const c=cand[i][0], r=cand[i][1];
    if(tiles[r][c]!=='.') continue;
    const nb=[[1,0],[0,1],[-1,0],[0,-1]].map(d=>[c+d[0],r+d[1]]).filter(p=>p[0]>=0&&p[1]>=4&&p[0]<W&&p[1]<=HALF-1&&tiles[p[1]][p[0]]==='.'&&!juncZone[p[1]][p[0]]);
    const set=[[c,r]]; if(nb.length) set.push(nb[Math.floor(rng()*nb.length)]);
    set.forEach(p=>{ tiles[p[1]][p[0]]='~'; tiles[H-1-p[1]][W-1-p[0]]='~'; });
    slow.push(set);
  }
  // locais de construção (pads), só na metade de baixo; a de cima é o espelho
  const roadC=[], sideC=[];
  for(let r=HALF+1;r<=H-3;r++) for(let c=0;c<W;c++){
    if(juncZone[r][c]) continue;
    if(tiles[r][c]==='.'&&road[r][c]) roadC.push([c,r]);
    else if(tiles[r][c]==='#'){
      const ds=[[1,0],[-1,0],[0,1],[0,-1]];
      if(ds.some(d=>{ const nc=c+d[0], nr=r+d[1]; return nc>=0&&nr>=0&&nc<W&&nr<H&&tiles[nr][nc]==='.'&&road[nr][nc]; })) sideC.push([c,r]);
    }
  }
  const padsP=[];
  const take=(arr,n,kind)=>{
    shuffle(arr,rng); let k=0;
    for(let i=0;i<arr.length&&k<n;i++){
      const c=arr[i][0], r=arr[i][1];
      if(padsP.some(p=>Math.max(Math.abs(p.c-c),Math.abs(p.r-r))<2)) continue;
      padsP.push({c:c,r:r,kind:kind}); k++;
    }
  };
  take(roadC,5,'road'); take(sideC,5,'side');
  const padsA=padsP.map(p=>({c:W-1-p.c,r:H-1-p.r,kind:p.kind}));
  padsP.concat(padsA).forEach(p=>{ tiles[p.r][p.c]='p'; });
  return {tiles:tiles,road:road,pads:[padsP,padsA],nRoutes:nR};
}

/* ---------- jogo ---------- */
function createGame(o){
  const rng=o.rng||Math.random;
  const mi=o.mapIndex!=null?o.mapIndex:Math.floor(rng()*MAPS.length);
  const mapDef=MAPS[mi];
  let map=null;
  for(let i=0;i<40&&!map;i++){ const m=genMap(rng); if(connected(m.tiles)&&m.pads[0].length>=6) map=m; }
  if(!map) map=genMap(rng);
  const G={t:0,over:false,winner:-1,phase:'place',placeT:PLACE_TIME,mapDef,map,tiles:map.tiles,pads:map.pads,decor:Math.floor(rng()*1e9),
    occ:newGrid(null),ice:newGrid(0),iceExp:[],ents:[],byId:new Map(),proj:[],fx:[],delayed:[],nextId:1,ver:0,rng,side:[],hearts:[null,null],auto0:!!o.auto0,fxOut:o.net?[]:null,shake:0,shakeOut:0,pvp:!!o.pvp,dp:[DIFF[1],o.pvp?DIFF[1]:DIFF[o.diff!=null?o.diff:1]]};
  initSide(G,0,o.deckP); initSide(G,1,o.deckA);
  G.hearts[0]=mkHeart(G,0); G.hearts[1]=mkHeart(G,1);
  if(!G.pvp) autoPlace(G,1);
  return G;
}
function initSide(G,idx,deck){
  const pieces=deck.filter(isStruct).map(k=>({key:k,pos:null}));
  const q=shuffle(deck.filter(k=>!isStruct(k)),G.rng);
  G.side[idx]={mana:5,hand:q.splice(0,5),queue:q,pieces:pieces,aiT:2+G.rng()*1.5,lastIce:-99};
}
function addEnt(G,e){ G.ents.push(e); G.byId.set(e.id,e); }
function mkHeart(G,team){
  const cy=team===0?H-1:1;
  const e={id:G.nextId++,kind:'struct',type:'heart',team,key:'heart',def:HEART,name:'Coração',x:W/2,y:cy,r:1,hp:HEART.hp,maxhp:HEART.hp,dead:false,cd:1,t:0,st:mkSt(),hit:0,atk:0};
  const r0=team===0?H-2:0;
  for(let r=r0;r<r0+2;r++) for(let c=W/2-1;c<W/2+1;c++) G.occ[r][c]=e;
  addEnt(G,e); return e;
}
function mkStruct(G,team,key,c,r){
  const card=CARDS[key], s=card.s, trap=card.tipo==='armad';
  const e={id:G.nextId++,kind:'struct',type:trap?'trap':'building',team,key,def:s,name:card.nome,x:c+.5,y:r+.5,tx:c,ty:r,r:trap?.3:.45,
    hp:s.hp,maxhp:s.hp,dead:false,cd:.5,t:0,st:mkSt(),hit:0,atk:0};
  if(!trap){ G.occ[r][c]=e; G.ver++; }
  addEnt(G,e); return e;
}
function mkUnit(G,team,key,x,y){
  const card=CARDS[key], d=card?card.u:SUMM[key];
  const e={id:G.nextId++,kind:'unit',team,key,def:d,name:card?card.nome:d.n,x,y,r:d.r,hp:d.hp,maxhp:d.hp,dead:false,
    cd:.4,tgt:null,tgtId:-1,retT:0,path:null,pathT:0,pathVer:-1,goalKey:'',noPath:false,st:mkSt(),haste:1,rtT:0,holdT:0,
    phase:key==='engenheiro'?'repair':'fight',repT:0,repTgt:null,summonT:2.5,healT:.8,hit:0,owner:-1,moving:0,atk:0,ang:team===0?-1.5708:1.5708,pend:0,pw:.18,pt:-1};
  addEnt(G,e); return e;
}
function fx(G,o){ o.t=0; G.fx.push(o); if(G.fxOut) G.fxOut.push(o); }

/* posicionamento: só nos pontos de construção do mapa */
function padAt(G,side,c,r){ return G.pads[side].find(p=>p.c===c&&p.r===r)||null; }
function canPlaceAt(G,side,c,r,ignoreKey){
  if(!padAt(G,side,c,r)) return false;
  return !G.side[side].pieces.some(p=>p.pos&&p.pos.c===c&&p.pos.r===r&&p.key!==ignoreKey);
}
function setPiece(G,side,key,c,r){
  if(G.phase!=='place') return false;
  const p=G.side[side].pieces.find(x=>x.key===key);
  if(!p||!canPlaceAt(G,side,c,r,key)) return false;
  p.pos={c:c,r:r}; return true;
}
function chooseSpot(G,side,key){
  const card=CARDS[key];
  let best=null,bs=-1e9;
  G.pads[side].forEach(p=>{
    if(!canPlaceAt(G,side,p.c,p.r,key)) return;
    const d=side===1?(HALF-1-p.r):(p.r-HALF);
    let sc=G.rng();
    if(key==='muralha') sc+=(p.kind==='road'?2:0)+(6-d)*.3;
    else if(key==='canhao'||key==='torre_arcana') sc+=(p.kind==='side'?1.5:0)-Math.abs(d-3)*.3;
    else if(key==='altar') sc+=(p.kind==='side'?1:0)+d*.3;
    else if(key==='quartel') sc+=(p.kind==='side'?1:0)-Math.abs(d-3)*.2;
    else if(card.tipo==='armad') sc+=(p.kind==='road'?2:0)-Math.abs(d-3)*.3;
    if(sc>bs){bs=sc;best=p;}
  });
  return best?{c:best.c,r:best.r}:null;
}
function autoOne(G,side){ const p=G.side[side].pieces.find(x=>!x.pos); if(p){ const s=chooseSpot(G,side,p.key); if(s) p.pos=s; } }
function autoPlace(G,side){
  G.side[side].pieces.forEach(p=>{ if(!p.pos){ const s=chooseSpot(G,side,p.key); if(s) p.pos=s; } });
}
function startBattle(G){
  if(G.phase!=='place') return;
  autoPlace(G,0); autoPlace(G,1);
  [0,1].forEach(side=>G.side[side].pieces.forEach(p=>{ if(p.pos) mkStruct(G,side,p.key,p.pos.c,p.pos.r); }));
  G.phase='battle'; G.ver++;
}

/* terreno, caminhos, visão */
function blockedTile(G,c,r){
  if(c<0||r<0||c>=W||r>=H) return true;
  if(G.tiles[r][c]==='#') return true;
  if(G.occ[r][c]) return true;
  return G.ice[r][c]>G.t;
}
function losClear(G,x1,y1,x2,y2){
  const n=Math.ceil(Math.hypot(x2-x1,y2-y1)/.25);
  for(let i=1;i<n;i++){
    const c=Math.floor(x1+(x2-x1)*i/n), r=Math.floor(y1+(y2-y1)*i/n);
    if(c<0||r<0||c>=W||r>=H) continue;
    if(G.tiles[r][c]==='#'||G.ice[r][c]>G.t) return false;
  }
  return true;
}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function findPath(G,fx0,fy0,tx,ty,goalOpen){
  const sc=clamp(Math.floor(fx0),0,W-1), sr=clamp(Math.floor(fy0),0,H-1);
  const gc=clamp(Math.floor(tx),0,W-1), gr=clamp(Math.floor(ty),0,H-1);
  if(sc===gc&&sr===gr) return [];
  const N=W*H, g=new Float32Array(N).fill(1e9), par=new Int16Array(N).fill(-1), closed=new Uint8Array(N);
  const start=sr*W+sc, goal=gr*W+gc;
  const heur=(c,r)=>{ const dx=Math.abs(c-gc), dy=Math.abs(r-gr); return Math.max(dx,dy)+.414*Math.min(dx,dy); };
  const open=[[heur(sc,sr),start]]; g[start]=0;
  while(open.length){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i][0]<open[bi][0]) bi=i;
    const cur=open[bi][1]; open[bi]=open[open.length-1]; open.pop();
    if(closed[cur]) continue; closed[cur]=1;
    if(cur===goal) break;
    const cc=cur%W, cr=(cur/W)|0;
    for(let k=0;k<8;k++){
      const dx=DIRS[k][0], dy=DIRS[k][1], nc=cc+dx, nr=cr+dy;
      if(nc<0||nr<0||nc>=W||nr>=H) continue;
      const ni=nr*W+nc; if(closed[ni]) continue;
      if(blockedTile(G,nc,nr)&&!(goalOpen&&ni===goal)) continue;
      if(dx&&dy&&(blockedTile(G,cc+dx,cr)||blockedTile(G,cc,cr+dy))) continue;
      const ng=g[cur]+(dx&&dy?1.414:1)*(G.tiles[nr][nc]==='~'?1.5:1);
      if(ng<g[ni]){ g[ni]=ng; par[ni]=cur; open.push([ng+heur(nc,nr),ni]); }
    }
  }
  if(par[goal]===-1) return null;
  const path=[]; let c=goal;
  while(c!==start){ path.push({x:(c%W)+.5,y:((c/W)|0)+.5}); c=par[c]; }
  path.reverse(); return path;
}
function tileMult(G,x,y){ const c=clamp(Math.floor(x),0,W-1), r=clamp(Math.floor(y),0,H-1); return G.tiles[r][c]==='~'?.65:1; }
function moveToward(G,u,gx,gy,goalOpen,dt,mult){
  const s=u.st;
  if(s.root>0||s.freeze>0) return true;
  if(air(u)){ const dx=gx-u.x, dy=gy-u.y, d=Math.hypot(dx,dy)||1, m=Math.min(d,u.def.sp*SPD*(mult||1)*(s.slow>0?s.slowM:1)*dt); u.x=clamp(u.x+dx/d*m,.3,W-.3); u.y=clamp(u.y+dy/d*m,.3,H-.3); u.moving=.2; u.ang=Math.atan2(dy,dx); return true; }
  u.pathT-=dt;
  const key=Math.floor(gx)+','+Math.floor(gy);
  if(u.noPath&&u.pathVer===G.ver&&u.goalKey===key&&u.pathT>0) return 'nopath';
  if(u.path===null||u.pathVer!==G.ver||u.goalKey!==key||u.pathT<=0){
    u.path=findPath(G,u.x,u.y,gx,gy,goalOpen); u.goalKey=key; u.pathVer=G.ver; u.pathT=.6; u.noPath=(u.path===null);
    if(u.path===null) return 'nopath';
  }
  let move=u.def.sp*SPD*(mult||1)*(s.slow>0?s.slowM:1)*tileMult(G,u.x,u.y)*dt;
  u.moving=.2;
  if(u.path.length===0){
    const dx=gx-u.x, dy=gy-u.y, d=Math.hypot(dx,dy);
    if(d>.05){
      const m=Math.min(move,d), nx=u.x+dx/d*m, ny=u.y+dy/d*m;
      if(!blockedTile(G,Math.floor(nx),Math.floor(ny))){ u.x=nx; u.y=ny; u.ang=Math.atan2(dy,dx); }
    }
    return true;
  }
  while(move>0&&u.path.length){
    const w=u.path[0], dx=w.x-u.x, dy=w.y-u.y, d=Math.hypot(dx,dy);
    if(d>.001) u.ang=Math.atan2(dy,dx);
    if(d<=move){ u.x=w.x; u.y=w.y; move-=d; u.path.shift(); }
    else { u.x+=dx/d*move; u.y+=dy/d*move; move=0; }
  }
  return true;
}

/* combate */
const air=t=>!!(t.def&&t.def.fly&&!(t.grounded>0));
const canHit=(a,t)=>!air(t)||a.def.proj||a.def.aa||a.def.fly;
const canAct=e=>e.st.freeze<=0&&!(e.def.magicUser&&e.st.silence>0);
function damage(G,e,amt,ty){
  if(e.dead) return;
  const rs=e.def.rs||[0,0];
  const m=ty==='phys'?1-rs[0]:ty==='magic'?1-rs[1]:1;
  e.hp-=amt*m; e.hit=.12;
  if(e.hp<=0){ e.hp=0; e.dead=true; onDeath(G,e); }
}
function shake(G,v){ G.shake=Math.max(G.shake||0,v); G.shakeOut=Math.max(G.shakeOut||0,v); }
function onDeath(G,e){
  fx(G,{k:'ring',x:e.x,y:e.y,r:e.r+.5,dur:.35,c:'#FFF8E6'}); fx(G,{k:'burst',x:e.x,y:e.y,r:e.r+.6,dur:.5,c:'#FFF8E6',n:8});
  if(e.kind==='unit') fx(G,{k:'ghost',key:e.key,team:e.team,x:e.x,y:e.y,ang:e.ang||0,fly:air(e)?1:0,r:e.r,dur:.75});
  else if(e.type!=='trap'){ fx(G,{k:'crumble',key:e.key,team:e.team,x:e.x,y:e.y,big:e.type==='heart'?1:0,dur:e.type==='heart'?1.8:1}); shake(G,e.type==='heart'?1:.35); }
  if(e.kind==='struct'&&e.type!=='trap'){
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) if(G.occ[r][c]===e) G.occ[r][c]=null;
    G.ver++;
    if(e.type==='heart'&&!G.over){ G.over=true; G.winner=1-e.team; }
  }
}
function areaDamage(G,team,x,y,rad,amt,ty){
  G.ents.forEach(e=>{
    if(e.dead||e.team===team||e.type==='trap') return;
    if(Math.hypot(e.x-x,e.y-y)-e.r<=rad) damage(G,e,amt,ty);
  });
}
function foesOf(G,team){ return G.ents.filter(e=>!e.dead&&e.team!==team&&e.type!=='trap'); }
function fire(G,a,t){
  const d=a.def; a.atk=.3; a.ang=Math.atan2(t.y-a.y,t.x-a.x); const dm=d.dm*((air(t)&&d.aa)||1);
  if(d.proj) G.proj.push({id:G.nextId++,x:a.x,y:a.y,tid:t.id,team:a.team,kind:a.key,fire:d.ty==='magic'&&d.aoe,dm:dm,ty:d.ty,aoe:d.aoe||0,root:d.root||0,sp:10});
  else { damage(G,t,dm,d.ty); fx(G,{k:'hit',x:t.x,y:t.y,dur:.3,c:a.team?'#FFB0B0':'#B0CCFF',ang:a.ang,ty:d.ty}); }
}
function attackIfPossible(G,a,t){
  const d=a.def;
  if(!(d.dm>0)) return false;
  if(gap(a,t)>d.rg) return false;
  if(!canHit(a,t)) return false;
  if(d.proj&&(d.ty==='phys'||d.ty==='pierce')&&!air(t)&&!air(a)&&!losClear(G,a.x,a.y,t.x,t.y)) return false;
  if(!canAct(a)) return true;
  if(a.pend>0) return true;
  if(a.cd<=0){ a.cd=d.iv*(a.haste||1); a.pw=d.proj?.2:.14; a.pend=a.pw; a.pt=t.id; a.ang=Math.atan2(t.y-a.y,t.x-a.x); }
  return true;
}
function nearestEnemyUnit(G,u,rad){
  let b=null,bd=1e9;
  G.ents.forEach(e=>{ if(e.kind==='unit'&&!e.dead&&e.team!==u.team){ const g=gap(u,e); if(g<bd){bd=g;b=e;} } });
  return b&&bd<=rad?b:null;
}
function nearestStructure(G,u){
  let b=null,bd=1e9;
  G.ents.forEach(e=>{ if(e.kind==='struct'&&!e.dead&&e.team!==u.team&&e.type!=='trap'){ const g=gap(u,e); if(g<bd){bd=g;b=e;} } });
  return b;
}
function pickTarget(G,u){
  const d=u.def, heart=G.hearts[1-u.team];
  if(d.tg==='tower') return heart.dead?null:heart;
  if(d.tg==='struct') return nearestStructure(G,u)||(heart.dead?null:heart);
  const foes=foesOf(G,u.team).filter(f=>canHit(u,f));
  if(d.tg==='hunt'){
    let b=null,bd=9;
    foes.forEach(f=>{ if(f.kind==='unit'&&f.def.rg>=3){ const g=gap(u,f); if(g<bd){bd=g;b=f;} } });
    if(b) return b;
  }
  let b=null,bd=1e9;
  foes.forEach(f=>{ const g=gap(u,f); if(g<bd){bd=g;b=f;} });
  if(b&&bd<=AGGRO) return b;
  return heart.dead?b:heart;
}
function findRepair(G,team){
  let b=null,br=2;
  G.ents.forEach(e=>{ if(!e.dead&&e.team===team&&e.type==='building'){ const rt=e.hp/e.maxhp; if(rt<br){br=rt;b=e;} } });
  return b;
}
function pickFollow(G,u){
  let b=null,best=-1e9;
  G.ents.forEach(a=>{
    if(a.kind!=='unit'||a.dead||a.team!==u.team||a===u||dist(a,u)>18) return;
    const sc=(a.def.tg==='sup'?-8:0)+(u.team===0?-a.y:a.y);
    if(sc>best){best=sc;b=a;}
  });
  return b;
}
function stepAway(G,u,th,dt){
  const s=u.st;
  let ax=u.x-th.x, ay=u.y-th.y; const l=Math.hypot(ax,ay)||1; ax/=l; ay/=l;
  const home=u.team===0?1:-1;
  const tries=[[ax,ay+.8*home],[0,home],[ax,0]];
  const sp=u.def.sp*SPD*.55*(s.slow>0?s.slowM:1)*dt;
  for(let i=0;i<tries.length;i++){
    let dx=tries[i][0], dy=tries[i][1]; const m=Math.hypot(dx,dy); if(m<.01) continue; dx/=m; dy/=m;
    const nx=u.x+dx*sp, ny=u.y+dy*sp;
    if(nx<.3||nx>W-.3||ny<.3||ny>H-.3) continue;
    if(blockedTile(G,Math.floor(nx),Math.floor(ny))) continue;
    u.x=nx; u.y=ny; u.path=null; u.moving=.2; u.ang=Math.atan2(th.y-u.y,th.x-u.x); return true;
  }
  return false;
}
function updateSupport(G,u,dt){
  const d=u.def;
  if(d.dm>0&&canAct(u)){
    let t=null,bd=1e9;
    G.ents.forEach(e=>{ if(!e.dead&&e.team!==u.team&&e.type!=='trap'&&canHit(u,e)){ const g=gap(u,e); if(g<=d.rg&&g<bd){bd=g;t=e;} } });
    if(t&&u.cd<=0){ u.cd=d.iv*u.haste; fire(G,u,t); }
  }
  const f=pickFollow(G,u);
  if(f){
    if(dist(u,f)>1.6) moveToward(G,u,f.x,f.y,false,dt,1);
  } else {
    const hy=u.team===0?H-6.5:5.5;
    if(Math.abs(u.y-hy)>.8) moveToward(G,u,W/2,hy,false,dt,.8);
  }
}
function safeSpawn(G,x,y,fx0,fy0){
  return blockedTile(G,Math.floor(x),Math.floor(y))?{x:fx0,y:fy0}:{x:x,y:y};
}
function updateUnit(G,u,dt){
  const s=u.st, d=u.def;
  if(u.grounded>0) u.grounded-=dt;
  if(s.slow>0) s.slow-=dt; if(s.root>0) s.root-=dt; if(s.freeze>0) s.freeze-=dt; if(s.silence>0) s.silence-=dt;
  if(u.cd>0) u.cd-=dt; if(u.hit>0) u.hit-=dt; if(u.moving>0) u.moving-=dt; if(u.atk>0) u.atk-=dt;
  if(s.freeze>0){ u.pend=0; return; }
  if(u.pend>0){ u.pend-=dt; if(u.pend<=0){ u.pend=0; const tg=G.byId.get(u.pt); if(tg&&!tg.dead&&canAct(u)&&gap(u,tg)<=d.rg+.7) fire(G,u,tg); } }
  const act=canAct(u);
  if(d.summon&&act){
    u.summonT-=dt;
    if(u.summonT<=0){
      u.summonT=6;
      const n=G.ents.filter(e=>!e.dead&&e.owner===u.id).length;
      if(n<=4){
        for(let k=0;k<2;k++){
          const p=safeSpawn(G,u.x+(k?.4:-.4),u.y+(u.team===0?-.5:.5),u.x,u.y);
          const sk=mkUnit(G,u.team,'esqueleto',p.x,p.y); sk.owner=u.id;
        }
        fx(G,{k:'ring',x:u.x,y:u.y,r:1,dur:.4,c:'#B58CFF'});
      }
    }
  }
  if(d.heal&&act){
    u.healT-=dt;
    if(u.healT<=0){
      if(d.cleanse) G.ents.forEach(a=>{ if(a.kind==='unit'&&!a.dead&&a.team===u.team&&gap(u,a)<=d.rg){ const q=a.st; q.slow=q.root=q.freeze=q.silence=0; } });
      let b=null,br=.95;
      G.ents.forEach(a=>{ if(a.kind==='unit'&&!a.dead&&a.team===u.team&&a!==u){ const rt=a.hp/a.maxhp; if(rt<br&&gap(u,a)<=d.rg){br=rt;b=a;} } });
      if(b){ b.hp=Math.min(b.maxhp,b.hp+d.heal); u.healT=d.iv; u.atk=.25; fx(G,{k:'line',x:u.x,y:u.y,x2:b.x,y2:b.y,dur:.25,c:'#7CFFB0'}); } else u.healT=.3;
    }
  }
  if(u.phase==='repair'){
    let b=u.repTgt; if(!b||b.dead){ b=findRepair(G,u.team); u.repTgt=b; }
    if(!b){ u.phase='fight'; }
    else {
      if(gap(u,b)<=1){
        u.repT+=dt; u.atk=.25;
        if(u.repT>=1.2){ b.hp=Math.min(b.maxhp,b.hp+b.maxhp*d.repair); fx(G,{k:'ring',x:b.x,y:b.y,r:1,dur:.5,c:'#7CFFB0'}); u.phase='fight'; u.path=null; }
      } else if(moveToward(G,u,b.x,b.y,true,dt,1)==='nopath') u.phase='fight';
      return;
    }
  }
  if(d.tg==='sup'){ updateSupport(G,u,dt); return; }
  u.retT-=dt;
  let t=u.tgt;
  if(!t||t.dead||u.retT<=0){
    t=pickTarget(G,u); u.retT=.4;
    if(t&&t.id!==u.tgtId){ u.path=null; u.tgtId=t.id; }
    u.tgt=t;
  }
  let retreating=false;
  if(d.retreat){
    u.holdT=Math.max(0,u.holdT-dt);
    const th=nearestEnemyUnit(G,u,2.4);
    if(th&&u.holdT<=0&&s.root<=0){
      if(u.rtT<2.2){ u.rtT+=dt; retreating=stepAway(G,u,th,dt); if(!retreating){ u.holdT=3; u.rtT=0; } }
      else { u.holdT=3; u.rtT=0; }
    } else if(!th){ u.rtT=Math.max(0,u.rtT-dt*.5); }
  }
  let inRange=false;
  if(t) inRange=attackIfPossible(G,u,t);
  if(!retreating&&!inRange&&t){
    const r=moveToward(G,u,t.x,t.y,t.kind==='struct',dt,1);
    if(r==='nopath'){ const alt=nearestStructure(G,u); if(alt&&alt!==t){ u.tgt=alt; u.tgtId=alt.id; u.retT=1; u.path=null; u.noPath=false; } }
  }
}
function updateStruct(G,s,dt){
  if(s.type==='trap') return;
  const d=s.def;
  if(s.cd>0) s.cd-=dt; if(s.hit>0) s.hit-=dt; if(s.atk>0) s.atk-=dt;
  if(s.st.silence>0) s.st.silence-=dt;
  if(d.heal){
    s.t+=dt;
    if(s.t>=1&&canAct(s)){
      s.t=0;
      G.ents.forEach(a=>{ if(!a.dead&&a.team===s.team&&a!==s&&a.type!=='trap'&&a.hp<a.maxhp&&Math.hypot(a.x-s.x,a.y-s.y)<=d.heal.r) a.hp=Math.min(a.maxhp,a.hp+d.heal.v); });
      fx(G,{k:'ring',x:s.x,y:s.y,r:d.heal.r,dur:.5,c:'rgba(124,255,176,.7)'});
    }
  }
  if(d.spawn){
    s.t+=dt;
    if(s.t>=d.spawn.every){
      s.t=0;
      const n=G.ents.filter(e=>!e.dead&&e.owner===s.id).length;
      if(n<3){
        const dy=s.team===0?-1:1;
        const spots=[[0,dy],[1,dy],[-1,dy],[1,0],[-1,0],[0,-dy]];
        for(let i=0;i<spots.length;i++){
          const c=s.tx+spots[i][0], r=s.ty+spots[i][1];
          if(!blockedTile(G,c,r)){ const so=mkUnit(G,s.team,'soldado',c+.5,r+.5); so.owner=s.id; break; }
        }
      }
    }
  }
  if(d.dm>0&&canAct(s)&&s.cd<=0){
    let t=null,bd=1e9;
    G.ents.forEach(e=>{ if(e.kind==='unit'&&!e.dead&&e.team!==s.team){ const g=Math.hypot(e.x-s.x,e.y-s.y)-e.r; if(g<=d.rg&&g<bd&&!(d.ground&&air(e))&&(d.ty==='magic'||air(e)||losClear(G,s.x,s.y,e.x,e.y))){bd=g;t=e;} } });
    if(t){ s.cd=d.iv; fire(G,s,t); }
  }
}
function updateProj(G,dt){
  for(let i=G.proj.length-1;i>=0;i--){
    const p=G.proj[i], t=G.byId.get(p.tid);
    if(!t||t.dead){ G.proj.splice(i,1); continue; }
    const dx=t.x-p.x, dy=t.y-p.y, d=Math.hypot(dx,dy), m=p.sp*dt;
    (p.tr=p.tr||[]).push([p.x,p.y]); if(p.tr.length>7) p.tr.shift();
    if(d<=m+.15){
      if(p.aoe>0){ areaDamage(G,p.team,t.x,t.y,p.aoe,p.dm,p.ty); fx(G,{k:'ring',x:t.x,y:t.y,r:p.aoe,dur:.3,c:p.fire?'#FF8A3D':'#C58BFF'}); fx(G,{k:'burst',x:t.x,y:t.y,r:p.aoe,dur:.5,c:p.fire?'#FFB02E':'#C58BFF',n:10}); }
      else damage(G,t,p.dm,p.ty);
      if(p.root&&!t.dead) t.st.root=Math.max(t.st.root,p.root);
      G.proj.splice(i,1);
    } else { p.x+=dx/d*m; p.y+=dy/d*m; }
  }
}
function updateTraps(G,units){
  G.ents.slice().forEach(t=>{
    if(t.type!=='trap'||t.dead) return;
    const tr=t.def.trap;
    if(!units.some(u=>!u.dead&&u.team!==t.team&&Math.hypot(u.x-t.x,u.y-t.y)<.7)) return;
    units.forEach(u=>{
      if(u.dead||u.team===t.team||Math.hypot(u.x-t.x,u.y-t.y)-u.r*.5>tr.r) return;
      damage(G,u,tr.dm,tr.ty);
      if(tr.slow){ u.st.slow=tr.slowT; u.st.slowM=tr.slow; }
      if(tr.freeze) u.st.freeze=tr.freeze;
    });
    t.dead=true; fx(G,{k:'ring',x:t.x,y:t.y,r:tr.r,dur:.45,c:t.def.trap.freeze?'#9FE3FF':'#FF8A4D'});
  });
}
function separate(G,units){
  const nudge=(u,dx,dy)=>{ const nx=u.x+dx, ny=u.y+dy; if(air(u)||!blockedTile(G,Math.floor(nx),Math.floor(ny))){ u.x=nx; u.y=ny; } };
  for(let i=0;i<units.length;i++){
    const a=units[i]; if(a.dead) continue;
    for(let j=i+1;j<units.length;j++){
      const b=units[j]; if(b.dead||air(a)!==air(b)) continue;
      let dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy); const m=(a.r+b.r)*.85;
      if(d>=m) continue;
      if(d<.001){ dx=Math.random()-.5; dy=Math.random()-.5; d=Math.hypot(dx,dy)||1; }
      const push=(m-d)*.25, nx=dx/d, ny=dy/d;
      const fa=a.st.freeze>0, fb=b.st.freeze>0;
      if(!fa) nudge(a,-nx*push*(fb?2:1),-ny*push*(fb?2:1));
      if(!fb) nudge(b,nx*push*(fa?2:1),ny*push*(fa?2:1));
    }
  }
}
function endByTime(G){
  const a=G.hearts[0].hp/G.hearts[0].maxhp, b=G.hearts[1].hp/G.hearts[1].maxhp;
  G.over=true; G.winner=a>b+.0001?0:b>a+.0001?1:2;
}
function step(G,dt){
  if(G.over||G.phase!=='battle') return;
  G.t+=dt;
  while(G.iceExp.length&&G.iceExp[0]<=G.t){ G.iceExp.shift(); G.ver++; }
  G.side.forEach((S,i)=>{ S.mana=Math.min(MAXMANA,S.mana+dt/REGEN*(i===1?G.dp[1].reg:1)); });
  if(!G.pvp) aiThink(G,1,dt); if(G.auto0) aiThink(G,0,dt);
  for(let i=G.delayed.length-1;i>=0;i--){ const d=G.delayed[i]; d.t-=dt; if(d.t<=0){ G.delayed.splice(i,1); d.fn(); } }
  const list=G.ents.slice();
  const units=list.filter(e=>e.kind==='unit'&&!e.dead);
  units.forEach(u=>{ u.haste=1; });
  units.forEach(b=>{ if(b.def.aura&&canAct(b)) units.forEach(a=>{ if(a.team===b.team&&Math.hypot(a.x-b.x,a.y-b.y)<=b.def.aura) a.haste=Math.min(a.haste,.75); }); });
  list.forEach(e=>{ if(!e.dead&&e.kind==='struct') updateStruct(G,e,dt); });
  units.forEach(u=>{ if(!u.dead) updateUnit(G,u,dt); });
  separate(G,G.ents.filter(e=>e.kind==='unit'&&!e.dead));
  updateTraps(G,G.ents.filter(e=>e.kind==='unit'&&!e.dead));
  updateProj(G,dt);
  for(let i=G.fx.length-1;i>=0;i--){ G.fx[i].t+=dt; if(G.fx[i].t>=G.fx[i].dur) G.fx.splice(i,1); }
  G.ents=G.ents.filter(e=>{ if(e.dead&&e.type!=='heart'){ G.byId.delete(e.id); return false; } return true; });
  if(!G.over&&G.t>=MATCH) endByTime(G);
}

/* cartas em jogo */
function spellReason(G,side,k){
  const c=CARDS[k];
  if(!c||c.tipo!=='feitico'||!c.req) return '';
  const ok=G.ents.some(e=>!e.dead&&e.team===side&&c.req.indexOf(e.key)>=0);
  return ok?'':'Precisa de: '+c.reqTxt;
}
function cycle(S,hi){ const k=S.hand[hi]; S.hand[hi]=S.queue.shift(); S.queue.push(k); }
function nearestOwn(G,side,keys,x,y){
  let b=null,bd=1e9;
  G.ents.forEach(e=>{ if(!e.dead&&e.team===side&&keys.indexOf(e.key)>=0){ const d=Math.hypot(e.x-x,e.y-y); if(d<bd){bd=d;b=e;} } });
  return b;
}
function castSpell(G,side,k,x,y){
  x=clamp(x,0,W); y=clamp(y,0,H);
  const c=CARDS[k];
  if(c.z){
    const z=c.z, sd={tempestade:1.6,rede:1.2,runa:1,selo_gelo:1,espinhos:1};
    fx(G,{k:'spell',sp:k,x:x,y:y,r:z.r,dur:sd[k]||1,c:z.c});
    G.delayed.push({t:.35,fn:()=>{
      fx(G,{k:'spellhit',sp:k,x:x,y:y,r:z.r,dur:.8,c:z.c}); shake(G,k==='runa'||k==='tempestade'?.5:.22);
      G.ents.forEach(e=>{
        if(e.dead||e.team===side||e.kind!=='unit'||Math.hypot(e.x-x,e.y-y)-e.r*.5>z.r) return;
        const a=air(e);
        if((z.airOnly&&!a)||(z.gnd&&a)) return;
        damage(G,e,(z.gdm!=null&&!a)?z.gdm:z.dm,z.ty);
        if(a&&z.ground) e.grounded=z.ground;
        if(z.slow&&!a){ e.st.slow=z.slowT; e.st.slowM=z.slow; }
        if(z.freeze) e.st.freeze=z.freeze;
      });
    }});
    return;
  }
  if(k==='bola_fogo'){
    const src=nearestOwn(G,side,c.req,x,y);
    fx(G,{k:'fireball',x:src.x,y:src.y,x2:x,y2:y,dur:.55});
    G.delayed.push({t:.55,fn:()=>{ areaDamage(G,side,x,y,1.6,190,'magic'); fx(G,{k:'boom',x:x,y:y,r:1.9,dur:1}); shake(G,.65); }});
  } else if(k==='raio_arcano'){
    const src=nearestOwn(G,side,c.req,x,y);
    const tg=G.ents.filter(e=>!e.dead&&e.team!==side&&e.type!=='trap'&&Math.hypot(e.x-x,e.y-y)-e.r<=2.5)
      .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,3);
    tg.forEach((e,i)=>{ damage(G,e,120,'magic'); fx(G,{k:'bolt',x:src.x,y:src.y,x2:e.x,y2:e.y,dur:.45,c:'#FFE66B',seed:i+1}); fx(G,{k:'zap',x:e.x,y:e.y,dur:.45,c:'#FFF6A8'}); });
    if(!tg.length) fx(G,{k:'bolt',x:src.x,y:src.y,x2:x,y2:y,dur:.45,c:'#FFE66B',seed:1});
    fx(G,{k:'ring',x:x,y:y,r:2.5,dur:.35,c:'#FFE66B'}); shake(G,.2);
  } else if(k==='bencao'){
    G.ents.forEach(e=>{ if(!e.dead&&e.team===side&&e.type!=='trap'&&Math.hypot(e.x-x,e.y-y)-e.r<=2.6) e.hp=Math.min(e.maxhp,e.hp+160); });
    fx(G,{k:'heal',x:x,y:y,r:2.6,dur:1.2});
  } else if(k==='muralha_gelo'){
    const cy=clamp(Math.floor(y),0,H-1), cx=Math.floor(x);
    for(let dx=-1;dx<=1;dx++){
      const cc=cx+dx;
      if(cc<0||cc>=W||G.tiles[cy][cc]==='#'||G.occ[cy][cc]) continue;
      G.ice[cy][cc]=G.t+7;
    }
    G.iceExp.push(G.t+7); G.ver++;
    fx(G,{k:'icewall',x:cx+.5,y:cy+.5,r:1.8,dur:.9}); shake(G,.15);
  } else if(k==='silencio'){
    G.ents.forEach(e=>{ if(!e.dead&&e.team!==side&&e.type!=='trap'&&e.def.magicUser&&Math.hypot(e.x-x,e.y-y)-e.r<=2.6) e.st.silence=5; });
    fx(G,{k:'silence',x:x,y:y,r:2.6,dur:1.2});
  }
}
function playCheck(G,side,hi,x,y){
  if(G.phase!=='battle'||G.over) return {ok:false,msg:''};
  const S=G.side[side], k=S.hand[hi], c=CARDS[k];
  if(!c||!(x>=0&&x<=W&&y>=0&&y<=H)) return {ok:false,msg:''};
  if(S.mana<c.custo) return {ok:false,msg:'Mana insuficiente'};
  if(c.tipo==='tropa'){
    const okZone=side===0?(y>=HALF&&y<H):(y>=0&&y<HALF);
    if(!okZone||x<0||x>=W) return {ok:false,msg:'Invoque na sua metade do campo'};
    if(c.u.fly?G.occ[Math.floor(y)][Math.floor(x)]:blockedTile(G,Math.floor(x),Math.floor(y))) return {ok:false,msg:'Invoque sobre um ponto livre'};
  } else {
    const why=spellReason(G,side,k);
    if(why) return {ok:false,msg:why};
  }
  return {ok:true,msg:''};
}
function playCard(G,side,hi,x,y){
  const chk=playCheck(G,side,hi,x,y); if(!chk.ok) return chk;
  const S=G.side[side], k=S.hand[hi], c=CARDS[k];
  if(c.tipo==='tropa'){
    for(let i=0;i<(c.sw||1);i++) mkUnit(G,side,k,x+(i-((c.sw||1)-1)/2)*.45,y);
    fx(G,{k:'ring',x:x,y:y,r:.7,dur:.3,c:'#FFF8E6'}); fx(G,{k:'spawn',x:x,y:y,dur:.5,team:side});
  } else castSpell(G,side,k,x,y);
  S.mana-=c.custo; cycle(S,hi);
  return {ok:true,msg:''};
}
function discard(G,side,hi){
  const S=G.side[side];
  if(G.phase!=='battle'||G.over||S.mana<1) return false;
  S.mana-=1; cycle(S,hi); return true;
}

/* ---------- IA ---------- */
function walkableList(G,side,r0,r1){
  const o=[];
  for(let r=r0;r<=r1;r++) for(let c=0;c<W;c++) if(!blockedTile(G,c,r)) o.push({x:c+.5,y:r+.5});
  return o;
}
function nearestWalkable(G,side,x,y){
  const l=side===1?walkableList(G,side,2,HALF-1):walkableList(G,side,HALF,H-3);
  let b=null,bd=1e9;
  l.forEach(p=>{ const d=Math.hypot(p.x-x,p.y-y); if(d<bd){bd=d;b=p;} });
  return b;
}
function aiSpellTarget(G,side,k,enemies,eu,threats){
  const S=G.side[side], me=G.hearts[side];
  if(k==='bola_fogo'){
    let best=null,bs=0;
    enemies.forEach(e=>{ let sc=0; enemies.forEach(o=>{ if(Math.hypot(o.x-e.x,o.y-e.y)<=1.6) sc+=o.kind==='unit'?1:.6; }); if(sc>bs){bs=sc;best=e;} });
    return bs>=2?{x:best.x,y:best.y}:null;
  }
  if(k==='raio_arcano'){
    let best=null,bs=0;
    eu.forEach(e=>{ let sc=0; eu.forEach(o=>{ if(Math.hypot(o.x-e.x,o.y-e.y)<=2.5) sc++; }); if(sc>bs){bs=sc;best=e;} });
    return bs>=2?{x:best.x,y:best.y}:null;
  }
  if(k==='bencao'){
    const hurt=G.ents.filter(e=>!e.dead&&e.team===side&&e.type!=='trap'&&e.hp<e.maxhp*.7);
    let best=null,bs=0;
    hurt.forEach(e=>{ let sc=0; hurt.forEach(o=>{ if(Math.hypot(o.x-e.x,o.y-e.y)<=2.6) sc++; }); if(sc>bs){bs=sc;best=e;} });
    return bs>=2?{x:best.x,y:best.y}:null;
  }
  if(k==='muralha_gelo'){
    if(G.t-S.lastIce<12) return null;
    const t=threats.filter(u=>u.def.rg<2).sort((a,b)=>dist(a,me)-dist(b,me))[0];
    if(!t) return null;
    S.lastIce=G.t;
    return {x:t.x+(me.x-t.x)*.5,y:t.y+(me.y-t.y)*.5};
  }
  if(k==='silencio'){
    const mu=eu.filter(e=>e.def.magicUser);
    let best=null,bs=0;
    mu.forEach(e=>{ let sc=0; mu.forEach(o=>{ if(Math.hypot(o.x-e.x,o.y-e.y)<=2.6) sc++; }); if(sc>bs){bs=sc;best=e;} });
    return bs>=2?{x:best.x,y:best.y}:null;
  }
  return null;
}
function aiThink(G,side,dt){
  const S=G.side[side];
  S.aiT-=dt; if(S.aiT>0) return;
  const P=G.dp[side]; S.aiT=P.iv[0]+G.rng()*(P.iv[1]-P.iv[0]);
  const me=G.hearts[side], foe=1-side;
  const enemies=G.ents.filter(e=>!e.dead&&e.team===foe&&e.type!=='trap');
  const eu=enemies.filter(e=>e.kind==='unit');
  const threats=eu.filter(e=>dist(e,me)<10);
  const hand=S.hand.map((k,i)=>({k:k,i:i,d:CARDS[k]})).filter(h=>h.d.custo<=S.mana);
  const spells=shuffle(hand.filter(h=>h.d.tipo==='feitico'),G.rng);
  for(let n=0;n<spells.length;n++){
    const h=spells[n];
    if(spellReason(G,side,h.k)) continue;
    const tg=aiSpellTarget(G,side,h.k,enemies,eu,threats);
    if(tg&&G.rng()<G.dp[side].sp){ playCard(G,side,h.i,tg.x,tg.y); return; }
  }
  const damaged=G.ents.some(e=>!e.dead&&e.team===side&&e.type==='building'&&e.hp<e.maxhp*.8);
  const troops=hand.filter(h=>h.d.tipo==='tropa'&&(h.k!=='engenheiro'||damaged||S.mana>=9));
  if(!troops.length){
    const stuck=S.hand.findIndex(k=>CARDS[k].tipo==='feitico'&&spellReason(G,side,k));
    if(stuck>=0&&S.mana>=1&&G.rng()<.3) discard(G,side,stuck);
    return;
  }
  const want=threats.length>0||S.mana>=7||G.rng()<.35;
  if(!want) return;
  let pick;
  if(threats.length){
    const rush=threats.some(t=>t.def.tg==='tower'||t.def.tg==='struct');
    const air=threats.some(t=>t.def.fly);
    const pref=troops.filter(h=>air&&G.dp[side].cnt?(h.d.u.proj||h.d.u.fly):rush?['cavaleiro','berserker','ladino'].indexOf(h.k)>=0:true);
    const pool=pref.length?pref:troops;
    pick=pool[Math.floor(G.rng()*pool.length)];
  } else pick=troops[Math.floor(G.rng()*troops.length)];
  let spot;
  if(threats.length){
    const t=threats.slice().sort((a,b)=>dist(a,me)-dist(b,me))[0];
    spot=nearestWalkable(G,side,t.x+(G.rng()*2-1),side===1?5:H-6);
  } else {
    const l=side===1?walkableList(G,side,4,HALF-1):walkableList(G,side,HALF,H-5);
    spot=l.length?l[Math.floor(G.rng()*l.length)]:null;
  }
  if(spot) playCard(G,side,pick.i,spot.x,spot.y);
}

/* ---------- multiplayer: instantâneos do servidor e visão do cliente ---------- */
const r2=v=>Math.round(v*100)/100;
function clearPiece(G,side,key){ if(G.phase!=='place') return; const p=G.side[side].pieces.find(x=>x.key===key); if(p) p.pos=null; }
function mapInfo(G){ return {tiles:G.tiles.map(r=>r.join('')),road:G.map.road.map(r=>r.map(v=>v?'1':'0').join('')),pads:G.pads,nRoutes:G.map.nRoutes,mapId:G.mapDef.id,decor:G.decor}; }
function snapshot(G,side){
  const e=[];
  G.ents.forEach(x=>{
    if(x.dead&&x.type!=='heart') return;
    if(x.kind==='unit') e.push([x.id,0,x.team,x.key,r2(x.x),r2(x.y),Math.round(x.hp),x.maxhp,x.r,x.moving>0?1:0,x.pend>0?r2(1-x.pend/x.pw):0,x.atk>0?r2(1-x.atk/.3):0,r2(x.ang||0),x.grounded>0?1:0,x.st.freeze>0?1:0,x.st.root>0?1:0,x.st.slow>0?1:0,x.st.silence>0?1:0,x.hit>0?1:0]);
    else if(x.type!=='trap') e.push([x.id,1,x.team,x.key,r2(x.x),r2(x.y),Math.round(x.hp),x.maxhp,x.type,x.tx==null?-1:x.tx,x.ty==null?-1:x.ty,r2(x.atk>0?x.atk:0),x.hit>0?1:0,x.st.silence>0?1:0,x.dead?1:0]);
  });
  const ice=[]; for(let r=0;r<H;r++) for(let c=0;c<W;c++) if(G.ice[r][c]>G.t) ice.push([c,r,r2(G.ice[r][c]-G.t)]);
  const S=G.side[side];
  const m={t:'s',ph:G.phase,pt:r2(G.placeT),tm:r2(G.t),ov:G.over?1:0,wn:G.winner,sh:G.shakeOut?r2(G.shakeOut):0,m:r2(S.mana),h:S.hand,q:S.queue[0],e:e,ice:ice,
    p:G.proj.map(p=>[p.id,r2(p.x),r2(p.y),p.ty==='magic'?1:0,p.fire?1:0,p.aoe||0,p.kind||'']),
    f:G.fxOut?G.fxOut.splice(0).map(f=>Object.assign({},f,{t:0})):[]};
  if(G.phase==='place') m.sp=S.pieces.filter(p=>p.pos).map(p=>[p.key,p.pos.c,p.pos.r]);
  G.shakeOut=0;
  return m;
}
function makeView(init,deck,side){
  const tiles=init.tiles.map(s=>s.split('')), road=init.road.map(s=>s.split('').map(ch=>ch==='1'));
  const mapDef=MAPS.find(m=>m.id===init.mapId)||MAPS[0];
  const V={isView:true,t:0,over:false,winner:-1,phase:'place',placeT:PLACE_TIME,mapDef:mapDef,map:{tiles:tiles,road:road,pads:init.pads,nRoutes:init.nRoutes},tiles:tiles,pads:init.pads,decor:init.decor,
    occ:newGrid(null),ice:newGrid(0),ents:[],byId:new Map(),proj:[],fx:[],shake:0,hearts:[null,null],
    side:[{mana:0,hand:[],queue:[],pieces:[]},{mana:0,hand:[],queue:[],pieces:[]}]};
  V.side[side].pieces=deck.filter(isStruct).map(k=>({key:k,pos:null}));
  return V;
}
function applySnap(V,m,now,side){
  V.phase=m.ph; V.placeT=m.pt; V.t=m.tm; V.over=!!m.ov; V.winner=m.wn; if(m.sh) V.shake=Math.max(V.shake,m.sh);
  const S=V.side[side]; S.mana=m.m; S.hand=m.h.slice(); S.queue=[m.q];
  if(m.sp&&V.phase==='place') S.pieces.forEach(p=>{ const q=m.sp.find(z=>z[0]===p.key); p.pos=q?{c:q[1],r:q[2]}:null; });
  for(let r=0;r<H;r++) V.ice[r].fill(0);
  (m.ice||[]).forEach(i=>{ if(V.ice[i[1]]) V.ice[i[1]][i[0]]=m.tm+i[2]; });
  const seen=new Set();
  m.e.forEach(t=>{
    const id=t[0]; seen.add(id); let e=V.byId.get(id);
    if(t[1]===0){
      if(!e){ const card=CARDS[t[3]], d=card?card.u:SUMM[t[3]]; e={id:id,kind:'unit',team:t[2],key:t[3],def:{fly:d.fly||0,magicUser:d.magicUser||0},dead:false,st:{},x:t[4],y:t[5],x0:t[4],y0:t[5],x1:t[4],y1:t[5],t0:now,isV:1}; V.byId.set(id,e); V.ents.push(e); e.fresh=1; }
      e.x0=e.x; e.y0=e.y; e.x1=t[4]; e.y1=t[5]; e.t0=now;
      e.hp=t[6]; e.maxhp=t[7]; e.r=t[8]; e.moving=t[9]?1:0; e.awv=t[10]; e.atv=t[11]; e.ang=t[12]; e.grounded=t[13]; e.st={freeze:t[14],root:t[15],slow:t[16],silence:t[17]}; e.hit=t[18]?.12:0;
    } else {
      if(!e){ e={id:id,kind:'struct',team:t[2],key:t[3],def:{},dead:false,st:{},x:t[4],y:t[5],isV:1}; V.byId.set(id,e); V.ents.push(e); e.fresh=1; }
      e.x=t[4]; e.y=t[5]; e.hp=t[6]; e.maxhp=t[7]; e.type=t[8]; e.tx=t[9]; e.ty=t[10]; e.atk=t[11]; e.hit=t[12]?.12:0; e.st={silence:t[13]}; e.dead=!!t[14]; e.r=t[8]==='heart'?1:.45;
    }
  });
  V.ents=V.ents.filter(e=>{ if(!seen.has(e.id)){ V.byId.delete(e.id); return false; } return true; });
  for(let r=0;r<H;r++) V.occ[r].fill(null);
  V.ents.forEach(e=>{ if(e.kind!=='struct'||e.dead) return;
    if(e.type==='heart'){ const r0=e.team===0?H-2:0; for(let r=r0;r<r0+2;r++) for(let c=W/2-1;c<W/2+1;c++) V.occ[r][c]=e; }
    else if(e.tx>=0) V.occ[e.ty][e.tx]=e; });
  V.hearts=[V.ents.find(e=>e.type==='heart'&&e.team===0)||null,V.ents.find(e=>e.type==='heart'&&e.team===1)||null];
  const old=new Map(V.proj.map(p=>[p.id,p]));
  V.proj=(m.p||[]).map(t=>{ const o=old.get(t[0]); const p={id:t[0],x:t[1],y:t[2],ty:t[3]?'magic':'phys',fire:t[4],aoe:t[5],kind:t[6],tr:o?o.tr:[]}; if(o){ p.tr.push([o.x,o.y]); if(p.tr.length>7) p.tr.shift(); } return p; });
  (m.f||[]).forEach(f=>{ f.t=0; V.fx.push(f); });
}
function interpView(V,now){
  V.ents.forEach(e=>{ if(e.kind!=='unit') return; const k=Math.min(1.1,(now-e.t0)/55); e.x=e.x0+(e.x1-e.x0)*k; e.y=e.y0+(e.y1-e.y0)*k; });
}
function ageView(V,dt){ for(let i=V.fx.length-1;i>=0;i--){ V.fx[i].t+=dt; if(V.fx[i].t>=V.fx[i].dur) V.fx.splice(i,1); } }

return {W,H,HALF,MATCH,MAXMANA,PLACE_TIME,CARDS,ORDER,MAPS,SUMM,DEFAULT_DECK,statLines,validateDeck,randomDeck,
  createGame,autoOne,DIFF,step,startBattle,setPiece,clearPiece,canPlaceAt,padAt,playCard,playCheck,discard,spellReason,isStruct,genMap,connected,
  snapshot,makeView,applySnap,interpView,ageView,mapInfo};

})();
if(typeof module!=='undefined') module.exports=CM;
