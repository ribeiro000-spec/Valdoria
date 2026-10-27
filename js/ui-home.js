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
  const T=62;
  g.fillStyle='rgba(15,8,30,.22)'; [[110,236],[670,236]].forEach(q=>{ g.beginPath(); g.ellipse(q[0],q[1],T*1.5,T*.5,0,0,7); g.fill(); });
  ART.struct(g,'heart',0,110,236,T,{t:t}); ART.struct(g,'heart',1,670,236,T,{t:t});
  const pr=(k,x,y,team,ang,anim,ph,sc)=>{ g.fillStyle='rgba(15,8,30,.25)'; g.beginPath(); g.ellipse(x,y,T*.32*(sc||1),T*.13*(sc||1),0,0,7); g.fill(); ART.unit(g,k,team,x,y,T,{ang:ang,anim:anim,ph:ph,k:sc}); };
  const sw=(o)=>((t*.7+o)%1);
  pr('cavaleiro',300,272,0,.15,'atk',sw(0));
  pr('arqueira',205,286,0,.35,'atk',sw(.2));
  pr('mago',245,306,0,.4,'idle',t*.5%1);
  pr('golem',455,262,1,Math.PI-.1,'walk',t*.8%1);
  pr('necromante',590,276,1,Math.PI-.3,'idle',t*.5%1);
  pr('berserker',520,292,1,Math.PI-.2,'atk',sw(.5));
  ART.unit(g,'wyvern',1,620,170+Math.sin(t*2)*6,T,{ang:Math.PI-.4,anim:'walk',ph:t*.8%1});
  ART.unit(g,'fada',0,165,140+Math.sin(t*2.6)*5,T,{ang:.3,anim:'idle',ph:t%1});
  // bolinha de fogo cruzando o campo
  const k=(t%3)/3; if(k<.8){ const x=250+k/.8*240, y=250-Math.sin(k/.8*3.14)*110; ART.glow(g,x,y,26,'#FF8A1F',.9); ART.glow(g,x,y,12,'#FFE08A',1); }
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
