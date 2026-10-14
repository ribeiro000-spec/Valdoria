/* Tela inicial */
'use strict';
/* ---------- início ---------- */
let heroRaf=0;
function drawHero(ts){
  const cv=$('#hero'), g=cv.getContext('2d'), w=cv.width, h=cv.height, t=ts/1000;
  g.clearRect(0,0,w,h);
  g.fillStyle='rgba(255,255,255,.6)'; [[120,60,60],[330,40,48],[600,70,64]].forEach(c=>{ g.beginPath(); g.ellipse(c[0]+Math.sin(t*.3+c[0])*10,c[1],c[2],c[2]*.4,0,0,7); g.fill(); });
  const cs=getComputedStyle(document.documentElement);
  g.fillStyle=cs.getPropertyValue('--hill2').trim()||'#3FA84E'; g.beginPath(); g.ellipse(180,h+60,420,150,0,0,7); g.fill();
  g.fillStyle=cs.getPropertyValue('--hill1').trim()||'#58C25F'; g.beginPath(); g.ellipse(600,h+70,460,140,0,0,7); g.fill();
  ART.struct(g,'heart',0,110,150,170,{t:t,hpr:1}); ART.struct(g,'heart',1,670,150,170,{t:t,hpr:1});
  const cyc=t%4;
  const L=[['cavaleiro',270,222,140],['arqueira',190,240,126],['mago',350,236,130]];
  const Rr=[['berserker',515,222,140],['necromante',600,240,130],['golem',440,214,190]];
  const sw=(on)=>on?{at:Math.max(0,1-((t*1.1)%1)*1.6)}:{};
  L.forEach((u,i)=>ART.unit(g,u[0],0,u[1],u[2]+Math.sin(t*2.4+i)*.6,u[3],Object.assign({pose:'f',mv:false,t:t+i},u[0]==='cavaleiro'?sw(true):{})));
  Rr.forEach((u,i)=>ART.unit(g,u[0],1,u[1],u[2]+Math.sin(t*2.4+i)*.6,u[3],Object.assign({pose:'f',mv:false,t:t+i+2},u[0]==='berserker'?sw(true):{})));
  ART.unit(g,'wyvern',1,640,92+Math.sin(t*2)*6,120,{pose:'f',mv:true,ph:t*.6,t:t});
  ART.unit(g,'fada',0,150,100+Math.sin(t*2.6)*5,86,{pose:'f',mv:true,ph:t*.6,t:t});
  // bolinha de fogo cruzando o campo
  const k=(t%3)/3; if(k<.8){ const x=360+k/.8*220, y=180-Math.sin(k/.8*3.14)*70; ART.glow(g,x,y,26,'#FF8A1F',.9); ART.glow(g,x,y,12,'#FFE08A',1); }
  heroRaf=requestAnimationFrame(drawHero);
}
function startHero(){ stopHero(); heroRaf=requestAnimationFrame(drawHero); }
function stopHero(){ if(heroRaf) cancelAnimationFrame(heroRaf); heroRaf=0; }
function faces(box,cards){ box.innerHTML=''; cards.forEach(k=>box.appendChild(img(k,null,34))); }
function renderHome(){
  const d=S.decks[S.main], v=CM.validateDeck(d.cards);
  $('#home-main').textContent=v.ok?'Máquina ou online':'Monte um deck válido antes';
  $('#home-deckname').textContent='Deck principal: '+d.name;
  faces($('#home-faces'),d.cards);
  $('#img-battle').src=ART.portrait('cavaleiro','tropa');
  $('#img-editor').src=ART.portrait('mago','tropa');
  setNote();
}
$('#go-editor').onclick=()=>{ renderEditor(); show('editor'); };
$('#go-battle').onclick=()=>{ renderBMenu(); show('bmenu'); };
