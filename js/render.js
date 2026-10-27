/* Desenho da partida: personagens (8 direções), construções, projéteis em arco, partículas e efeitos */
'use strict';
/* ---------- partículas locais (só visuais) ---------- */
const PARTS=[];
function part(o){ if(PARTS.length>420) PARTS.shift(); o.t=0; PARTS.push(o); }
function dust(x,y,n,col,spd){ for(let i=0;i<n;i++){ const a=Math.random()*6.2832, v=(spd||1)*(.4+Math.random()*.8); part({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.5-.2,g:0,life:.45+Math.random()*.35,r:.08+Math.random()*.1,grow:.25,c:col||'rgba(150,130,110,.55)',k:'puff'}); } }
function sparks(x,y,n,col,spd){ for(let i=0;i<n;i++){ const a=Math.random()*6.2832, v=(spd||3)*(.5+Math.random()); part({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,g:6,life:.25+Math.random()*.25,r:.035+Math.random()*.03,c:col||'#fff3a0',k:'spark'}); } }
function debris(x,y,n,col){ for(let i=0;i<n;i++){ const a=Math.random()*6.2832, v=1+Math.random()*2.2; part({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-2.4,g:7,life:.7+Math.random()*.4,r:.06+Math.random()*.07,c:col||'#8a8276',k:'rock',rot:Math.random()*6}); } }
function stepParts(dt){
  const T=U.T;
  for(let i=PARTS.length-1;i>=0;i--){ const p=PARTS[i]; p.t+=dt; if(p.t>=p.life){ PARTS.splice(i,1); continue; }
    p.vy+=(p.g||0)*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.rot!=null) p.rot+=dt*8;
    const k=p.t/p.life, x=p.x*T, y=p.y*T, r=p.r*T*(1+(p.grow||0)*k*4);
    ctx.globalAlpha=1-k;
    if(p.k==='spark'){ ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(x,y,Math.max(.8,r),0,6.2832); ctx.fill(); }
    else if(p.k==='rock'){ ctx.save(); ctx.translate(x,y); ctx.rotate(p.rot); ctx.fillStyle=p.c; ctx.fillRect(-r,-r,r*2,r*2); ctx.strokeStyle='#26123a'; ctx.lineWidth=1; ctx.strokeRect(-r,-r,r*2,r*2); ctx.restore(); }
    else if(p.k==='txt'){ ctx.font='bold '+Math.round(T*p.r)+'px "Lilita One",system-ui,sans-serif'; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='#21132b'; ctx.strokeText(p.s,x,y); ctx.fillStyle=p.c; ctx.fillText(p.s,x,y); }
    else { ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }
  }
  ctx.globalAlpha=1;
}
/* ---------- barra de vida ---------- */
function hpBar(x,y,w,e,v){
  const r=Math.max(0,e.hp/e.maxhp), hd=v?Math.max(r,v.hpd/e.maxhp):r, h=Math.max(4,U.T*.13);
  ctx.fillStyle='rgba(25,10,45,.85)'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-w/2-1.5,y-1.5,w+3,h+3,3):ctx.rect(x-w/2-1.5,y-1.5,w+3,h+3); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fillRect(x-w/2,y,w*hd,h);
  ctx.fillStyle=vt(e)===0?'#4f8cff':'#ff5a5a'; ctx.fillRect(x-w/2,y,w*r,h);
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x-w/2,y,w*r,h*.4);
  if(e.lvl>0){ ctx.font='bold '+Math.round(U.T*.36)+'px system-ui,sans-serif'; ctx.textAlign='left'; ctx.lineWidth=3; ctx.strokeStyle='#21132b'; const s='★'.repeat(e.lvl); ctx.strokeText(s,x+w/2+2,y+h+1); ctx.fillStyle='#ffd23f'; ctx.fillText(s,x+w/2+2,y+h+1); }
}
const AMB={floresta:{c:'255,255,190',n:26,m:'float'},ruinas:{c:'255,240,210',n:20,m:'float'},deserto:{c:'255,228,160',n:30,m:'drift'},montanha:{c:'255,255,255',n:46,m:'snow'},lava:{c:'255,150,50',n:34,m:'ember'},ceu:{c:'255,255,255',n:24,m:'twinkle'}};
function ambient(t){
  const a=AMB[U.G.mapDef.id]; if(!a) return; const T=U.T, w=W*T, h=H*T;
  for(let i=0;i<a.n;i++){
    const h1=hash(i+1), h2=hash(i+50), h3=hash(i+99); let x=h1*w, y=h2*h, al=.55, r=T*(.04+h3*.05);
    if(a.m==='float'){ x+=Math.sin(t*.6+i)*T*.7; y+=Math.cos(t*.45+i*2)*T*.5; al=.35+.35*Math.sin(t*1.3+i); }
    else if(a.m==='drift'){ x=(x+t*T*(.8+h3))%w; y+=Math.sin(t+i)*T*.2; al=.3; r*=1.4; }
    else if(a.m==='snow'){ y=(y+t*T*(.7+h3*.9))%h; x+=Math.sin(t*.8+i)*T*.5; al=.85; }
    else if(a.m==='ember'){ y=h-((h-y)+t*T*(.8+h3))%h; x+=Math.sin(t*1.4+i)*T*.4; al=.4+.5*Math.sin(t*3+i); r*=1.2; }
    else { al=.2+.7*Math.max(0,Math.sin(t*2+i*1.7)); x+=Math.sin(t*.3+i)*T*.4; }
    ctx.fillStyle='rgba('+a.c+','+Math.max(0,al).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill();
  }
}
function drawIce(){
  const G=U.G, T=U.T;
  for(let r=0;r<H;r++) for(let c=0;c<W;c++){
    const ex=G.ice[r][c]; if(ex<=G.t) continue;
    const age=7-(ex-G.t), grow=Math.min(1,Math.max(0,age/.3)), melt=Math.min(1,(ex-G.t)/1.2), s=ease(grow)*melt; if(s<=0) continue;
    const [vc,vr]=VT(c,r), x=(vc+.5)*T, y=(vr+.5)*T;
    ctx.save(); ctx.translate(x,y+T*.3); ctx.scale(s,s);
    ART.glow(ctx,0,-T*.3,T*.9,'#BFEFFF',.45);
    ART.E(ctx,0,0,T*.55,T*.2,'rgba(220,245,255,.85)',0);
    [[-.24,.0,.6,.17],[.0,-.05,1,.22],[.26,.02,.65,.17]].forEach((q,i)=>{ const hh=T*q[2], ww=T*q[3]; const gr=ctx.createLinearGradient(T*q[0]-ww,0,T*q[0]+ww,0); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,'#bfefff'); gr.addColorStop(1,'#6ac4ee'); ART.P(ctx,[[T*q[0]-ww,T*q[1]],[T*q[0]-ww*.8,T*q[1]-hh*.7],[T*q[0],T*q[1]-hh],[T*q[0]+ww*.8,T*q[1]-hh*.7],[T*q[0]+ww,T*q[1]]],gr,1.6); ART.L(ctx,T*q[0]-ww*.35,T*q[1]-hh*.15,T*q[0]-ww*.25,T*q[1]-hh*.65,1.4,'#ffffff',true); });
    ctx.restore();
  }
}
function drawPlacement(){
  const G=U.G, T=U.T, pulse=.5+.5*Math.sin(U.time*5);
  G.pads[U.me].forEach(p=>{
    const used=G.side[U.me].pieces.some(q=>q.pos&&q.pos.c===p.c&&q.pos.r===p.r); if(used) return;
    const [vc,vr]=VT(p.c,p.r), x=(vc+.5)*T, y=(vr+.5)*T;
    ART.glow(ctx,x,y,T*.9,'#FFE066',.35+.25*pulse);
    ctx.strokeStyle='rgba(255,230,90,'+(.6+.4*pulse)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y+T*.05,T*(.5+.08*pulse),T*(.32+.05*pulse),0,0,6.2832); ctx.stroke();
  });
}
/* ---------- construções ---------- */
function drawStruct(e){
  const T=U.T; let v=VS.get(e.id); if(!v){ v={born:0,hpd:e.hp,ang:dirOf(e.team)<0?-1.5708:1.5708,fireT:-1}; VS.set(e.id,v); }
  v.born=Math.min(1,v.born+U.dt/.5);
  if(e.hit>0){ if(!v.hs){ v.hs=1; AUD.sfx('build_hit',{vol:.45,min:.15,pan:panOf(e.x)}); } } else v.hs=0;
  v.seen=U.frame; v.hpd+=(e.hp-v.hpd)*Math.min(1,U.dt*6);
  const [x,y]=PX(e.x,e.y);
  const atk=e.atk>0?Math.min(1,e.atk/.3):0;
  if(atk>0&&e.ang!=null){ const ta=viewAng(e.ang); v.ang+=angd(ta,v.ang)*Math.min(1,U.dt*20); if(v.lastAtk<=0||v.lastAtk==null) v.fireT=0; }
  v.lastAtk=atk; if(v.fireT>=0){ v.fireT+=U.dt/.45; if(v.fireT>=1) v.fireT=-1; }
  const st={t:U.time+e.id*.3,hit:e.hit,hpr:e.hp/e.maxhp,ang:v.ang,born:v.born,fire:v.fireT>=0?v.fireT:null};
  if(e.type==='heart'){
    if(e.dead){ ART.glow(ctx,x,y,T*2.4,'#FF8A3D',.35); ART.E(ctx,x,y+T*.3,T*1.6,T*.7,'#6E6A66',1.4); ART.P(ctx,[[x-T*1.1,y+T*.4],[x-T*.5,y-T*.4],[x+T*.1,y+T*.1],[x+T*.7,y-T*.5],[x+T*1.2,y+T*.4]],'#8E8984',1.4); return; }
    ctx.fillStyle='rgba(15,8,30,.25)'; ctx.beginPath(); ctx.ellipse(x,y+T*.75,T*1.55,T*.6,0,0,6.2832); ctx.fill();
    const top=ART.struct(ctx,'heart',vt(e),x,y+T*.62,T,st); hpBar(x,y+T*.62-top-T*.1,T*2.2,e,v);
  } else {
    ctx.fillStyle='rgba(15,8,30,.25)'; ctx.beginPath(); ctx.ellipse(x,y+T*.38,T*.62,T*.26,0,0,6.2832); ctx.fill();
    const top=ART.struct(ctx,e.key,vt(e),x,y+T*.36,T,st);
    hpBar(x,y+T*.36-top-T*.05,T*1,e,v);
    if(st.fire!=null&&st.fire<.35&&(e.key==='canhao'||e.key==='balista')){ const a=v.ang, mx=x+Math.cos(a)*T*.55, my=y+T*.36-T*.42+Math.sin(a)*T*.3; if(e.key==='canhao'){ ART.glow(ctx,mx,my,T*.7*(1-st.fire*2),'#ffcf6a',.95); if(!v.smoke){ v.smoke=1; for(let i=0;i<5;i++) part({x:mx/T,y:my/T,vx:Math.cos(a)*1.2+(Math.random()-.5),vy:Math.sin(a)*.6-.5,g:0,life:.7,r:.12,grow:.6,c:'rgba(200,200,210,.6)',k:'puff'}); } } }
    else v.smoke=0;
    if(e.st&&e.st.silence>0){ ART.glow(ctx,x,y-T*.4,T*.6,'#B58CFF',.6); }
  }
}
/* ---------- tropas ---------- */
const USC=1.15;
const BIG={golem:1,ariete:1,wyvern:1,golenzinho:1};
function drawUnit(e){
  const T=U.T, dt=U.dt; let v=VS.get(e.id);
  if(!v){ v={x:e.x,y:e.y,ph:hash(e.id),sp:0,th:viewAng(e.team===0?-1.5708:1.5708),born:0,hpd:e.hp,seen:0,stepT:0,atkPh:0,lastAw:0}; VS.set(e.id,v); }
  v.seen=U.frame;
  const dx=e.x-v.x, dy=e.y-v.y, d=Math.hypot(dx,dy), spd=dt>0?d/dt:0; v.sp+=(spd-v.sp)*Math.min(1,dt*9);
  const frozen=e.st.freeze>0, mv=v.sp>.25&&!frozen&&!(e.st.root>0);
  const aw=e.isV?(e.awv||0):(e.pend>0?1-e.pend/(e.pw||.18):0), at=e.isV?(e.atv||0):(e.atk>0?1-e.atk/.3:0);
  let ang=null; if(aw>0||at>0) ang=e.ang; else if(mv&&d>1e-4) ang=Math.atan2(dy,dx);
  if(ang!=null){ const tv=viewAng(ang); v.th+=angd(tv,v.th)*Math.min(1,dt*(aw>0||at>0?16:9)); }
  if(!frozen){ v.ph=(v.ph+(mv?v.sp*dt/1.0:dt/1.6))%1; }
  v.x=e.x; v.y=e.y; v.born=Math.min(1,v.born+dt/.35); v.hpd+=(e.hp-v.hpd)*Math.min(1,dt*7);
  let anim='idle', ph=v.ph;
  if(aw>0){ anim='atk'; ph=aw*.5; } else if(at>0){ anim='atk'; ph=.5+at*.5; } else if(mv) anim='walk';
  if(frozen) ph=v.ph;
  const fl=airE(e), [px,py]=PX(e.x,e.y);
  const lift=fl?T*(.85+Math.sin(U.time*3+e.id)*.08):0;
  // poeira dos passos
  if(mv&&!fl){ v.stepT-=dt; if(v.stepT<=0){ v.stepT=BIG[e.key]?.28:.4; if(BIG[e.key]||Math.random()<.35) dust(e.x+(U.me?0:0),e.y+.15*(U.me?-1:1),BIG[e.key]?3:1,U.G.mapDef.id==='montanha'?'rgba(255,255,255,.7)':'rgba(150,130,110,.45)',BIG[e.key]?1.2:.6); } }
  // sombra
  const rr=(e.r||.35);
  ctx.fillStyle='rgba(15,8,30,'+(fl?.2:.3)+')'; ctx.beginPath(); ctx.ellipse(px,py+T*.12,rr*T*(fl?.85:1.15),rr*T*(fl?.32:.45),0,0,6.2832); ctx.fill();
  if(!fl){ ctx.strokeStyle=vt(e)===0?'rgba(70,130,255,.8)':'rgba(255,80,80,.8)'; ctx.lineWidth=Math.max(1.6,T*.06); ctx.beginPath(); ctx.ellipse(px,py+T*.12,rr*T*1.3,rr*T*.55,0,0,6.2832); ctx.stroke(); }
  // auras
  if(e.rage>0){ ART.glow(ctx,px,py-lift-T*.4,T*.9,'#ff3a5a',.35+.15*Math.sin(U.time*10)); if(Math.random()<dt*8) part({x:e.x+(Math.random()-.5)*.5,y:e.y-.2,vx:0,vy:-1.2,g:0,life:.5,r:.05,c:'#ff6a7a',k:'spark'}); }
  const enr=e.isV?e.enr:(e.def.enrage&&e.hp<e.maxhp*.5);
  const born=v.born<1?v.born:1, pop=born<1?(1+Math.sin(born*Math.PI)*.2)*Math.min(1,born*2.5):1;
  const top=ART.unit(ctx,e.key,vt(e),px,py+T*.14-lift,T,{ang:v.th,anim:anim,ph:ph,hit:e.hit>0?e.hit:0,k:pop*USC,tint:enr?{c:'#ff2a2a',a:.22+.12*Math.sin(U.time*12)}:frozen?{c:'#9fe3ff',a:.45}:null});
  const hy=py+T*.14-lift-top;
  if(frozen){ ctx.fillStyle='rgba(170,230,255,.35)'; ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect?ctx.roundRect(px-T*.42,hy-T*.05,T*.84,(py+T*.14-lift)-hy+T*.1,T*.15):ctx.rect(px-T*.42,hy-T*.05,T*.84,(py+T*.14-lift)-hy+T*.1); ctx.fill(); ctx.stroke(); }
  if(e.st.root>0){ ctx.strokeStyle='#3f9a3a'; ctx.lineWidth=Math.max(2,T*.08); for(let i=0;i<4;i++){ const a=i*1.57+.4; ctx.beginPath(); ctx.moveTo(px+Math.cos(a)*rr*T*.7,py+T*.15); ctx.quadraticCurveTo(px+Math.cos(a)*rr*T*1.5,py-T*.3,px+Math.cos(a+.6)*rr*T*.5,py-T*.6); ctx.stroke(); } ctx.fillStyle='#6fd25a'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(px+Math.cos(i*1.57+1)*rr*T,py-T*.3,T*.06,0,6.2832); ctx.fill(); } }
  if(e.st.silence>0){ const sy=hy-T*.45; ART.glow(ctx,px,sy,T*.45,'#B58CFF',.7); ctx.strokeStyle='#E0CCFF'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,sy,T*.18,0,6.2832); ctx.moveTo(px-T*.13,sy+T*.13); ctx.lineTo(px+T*.13,sy-T*.13); ctx.stroke(); }
  if(e.hp<e.maxhp||e.lvl>0) hpBar(px,hy-T*.12,Math.max(T*.7,T*rr*2),e,v);
}
function viewAng(a){ return U.me?a+Math.PI:a; }

/* ---------- projéteis (com arco) ---------- */
const PJ={arqueira:'arrow',heart:'arrow',balista:'bolt',canhao:'ball',torre_arcana:'orb',mago:'fire',wyvern:'fire',necromante:'skull',druida:'leaf',bardo:'note',fada:'orb',gargula:'orb',grifo:'arrow',bombardeiro:'bomb'};
const ARC={arrow:.55,bolt:.25,ball:.4,bomb:1.6};
function drawProj(p){
  const T=U.T; let tr=PTR.get(p.id); if(!tr){ tr=[]; PTR.set(p.id,tr); AUD.sfx(p.fire?'fire_cast':(PSND[p.kind]||'magic'),{vol:.5,min:.09,pan:panOf(p.x)}); }
  const kind=p.fire?'fire':(PJ[p.kind]||(p.ty==='magic'?'orb':'arrow'));
  const gx=p.gx!=null?p.gx:p.x, gy=p.gy!=null?p.gy:p.y, x0=p.x0!=null?p.x0:p.x, y0=p.y0!=null?p.y0:p.y;
  const L=Math.hypot(gx-x0,gy-y0)||1, k=Math.max(0,Math.min(1,1-Math.hypot(gx-p.x,gy-p.y)/L)), hA=(ARC[kind]||0)*Math.min(1,L/4);
  const h=Math.sin(k*Math.PI)*hA*T, [gxp,gyp]=PX(p.x,p.y), x=gxp, y=gyp-h-T*.45;
  tr.push([x,y]); if(tr.length>9) tr.shift(); tr.seen=U.frame;
  const q=tr.length>2?tr[tr.length-3]:null; const ang=q?Math.atan2(y-q[1],x-q[0]):1.57;
  if(ARC[kind]){ ctx.fillStyle='rgba(15,8,30,.22)'; ctx.beginPath(); ctx.ellipse(gxp,gyp,T*.12,T*.05,0,0,6.2832); ctx.fill(); }
  ctx.save();
  if(kind==='fire'||kind==='orb'||kind==='skull'||kind==='leaf'||kind==='note'){
    const col=kind==='fire'?'#FF8A1F':kind==='skull'?'#6BFF8F':kind==='leaf'?'#8CFF7A':kind==='note'?'#FFE98A':'#C58BFF';
    for(let i=0;i<tr.length;i++){ const kk=i/tr.length; ART.glow(ctx,tr[i][0],tr[i][1],T*(.12+.22*kk),col,.5*kk); }
    ART.glow(ctx,x,y,T*.55,col,.9); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x,y,T*.1,0,6.2832); ctx.fill();
    if(kind==='fire'){ ctx.fillStyle='#FFD34D'; ctx.beginPath(); ctx.arc(x,y,T*.15,0,6.2832); ctx.fill(); if(Math.random()<.5) part({x:x/T,y:y/T,vx:(Math.random()-.5)*.5,vy:-.6,g:0,life:.35,r:.06,c:'#ffb02e',k:'spark'}); }
    if(kind==='leaf'){ ctx.fillStyle='#4fbf4a'; ctx.beginPath(); ctx.ellipse(x,y,T*.14,T*.07,U.time*8,0,6.2832); ctx.fill(); }
    if(kind==='skull'){ ctx.fillStyle='#e8ffe8'; ctx.beginPath(); ctx.arc(x,y,T*.12,0,6.2832); ctx.fill(); ctx.fillStyle='#1d2a1d'; ctx.beginPath(); ctx.arc(x-T*.045,y,T*.03,0,6.2832); ctx.arc(x+T*.045,y,T*.03,0,6.2832); ctx.fill(); }
    if(kind==='note'){ ctx.fillStyle='#fff'; ctx.font='bold '+Math.floor(T*.6)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText('♪',x,y+T*.2); }
  } else if(kind==='ball'||kind==='bomb'){
    for(let i=0;i<tr.length;i++){ const kk=i/tr.length; ctx.fillStyle='rgba(140,140,150,'+(.25*kk).toFixed(2)+')'; ctx.beginPath(); ctx.arc(tr[i][0],tr[i][1],T*(.08+.12*kk),0,6.2832); ctx.fill(); }
    ART.E(ctx,x,y,T*.17,T*.17,'#33353f',1.4); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x-T*.05,y-T*.06,T*.045,0,6.2832); ctx.fill();
    if(kind==='bomb'){ ctx.strokeStyle='#c9a26a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+T*.08,y-T*.12); ctx.lineTo(x+T*.14,y-T*.22); ctx.stroke(); ART.glow(ctx,x+T*.14,y-T*.23,T*.18,'#ffcc44',1); }
  } else {
    ctx.translate(x,y); ctx.rotate(ang); const Ln=kind==='bolt'?T*1.0:T*.7;
    ctx.globalAlpha=.35; ctx.strokeStyle='#fff'; ctx.lineWidth=T*.08; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-Ln*1.3,0); ctx.lineTo(-Ln*.5,0); ctx.stroke(); ctx.globalAlpha=1;
    ctx.strokeStyle='#26123a'; ctx.lineWidth=kind==='bolt'?4.2:3.2; ctx.beginPath(); ctx.moveTo(-Ln*.5,0); ctx.lineTo(Ln*.5,0); ctx.stroke();
    ctx.strokeStyle=kind==='bolt'?'#A26A32':'#C9A26A'; ctx.lineWidth=kind==='bolt'?2.6:1.8; ctx.beginPath(); ctx.moveTo(-Ln*.5,0); ctx.lineTo(Ln*.5,0); ctx.stroke();
    ctx.fillStyle='#E8EEF5'; ctx.strokeStyle='#26123a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(Ln*.55,0); ctx.lineTo(Ln*.32,-T*.1); ctx.lineTo(Ln*.32,T*.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=vtTeamCol(p); ctx.beginPath(); ctx.moveTo(-Ln*.5,0); ctx.lineTo(-Ln*.62,-T*.1); ctx.lineTo(-Ln*.36,0); ctx.lineTo(-Ln*.62,T*.1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function vtTeamCol(p){ return p.team==null?'#ffd23f':(p.team===U.me?'#6EA0FF':'#FF6B6B'); }

/* ---------- efeitos ---------- */
const HEAVY={golem:1,berserker:1,ariete:1,golenzinho:1};
const PSND={arqueira:'arrow',heart:'arrow',grifo:'arrow',balista:'balista',canhao:'cannon',wyvern:'fire_cast',bombardeiro:'throw'};
function panOf(x){ return (PX(x,0)[0]/(CM.W*U.T)-.5)*1.4; }
function fxSound(f){
  const o={pan:panOf(f.x)};
  switch(f.k){
    case 'hit': AUD.sfx(f.ex==='charge'?'charge':f.ty==='magic'?'magichit':(HEAVY[f.src]?'punch':'sword'),Object.assign({vol:.75,min:.06},o)); if(f.cr) AUD.sfx('crit',Object.assign({vol:.55,min:.12},o)); break;
    case 'phit': if(f.kind==='arqueira'||f.kind==='balista'||f.kind==='heart'||f.kind==='grifo') AUD.sfx('arrowhit',Object.assign({vol:.45,min:.06},o)); break;
    case 'spawn': AUD.sfx('spawn',Object.assign({vol:.7,min:.08},o)); break;
    case 'ghost': AUD.sfx('die',Object.assign({vol:.55,min:.08},o)); break;
    case 'crumble': AUD.sfx(f.big?'heart_die':'build_die',Object.assign({vol:f.big?1:.85,min:.1},o)); break;
    case 'fireball': AUD.sfx('fire_cast',o); break;
    case 'boom': AUD.sfx('explosion',Object.assign({vol:f.small?.55:.9,min:.1},o)); break;
    case 'bolt': AUD.sfx('lightning',Object.assign({vol:.8,min:.15},o)); break;
    case 'heal': AUD.sfx('heal',o); break;
    case 'icewall': AUD.sfx('ice',o); break;
    case 'silence': AUD.sfx('silence',o); break;
    case 'rage': AUD.sfx('rage',o); break;
    case 'lvl': AUD.sfx('levelup',Object.assign({vol:.7,min:.2},o)); break;
    case 'shock': AUD.sfx('shockwave',Object.assign({vol:1,min:.5},o)); break;
    case 'fury': AUD.sfx('horn',{vol:1,rate:1.15,min:1}); break;
    case 'rocks': AUD.sfx('build_die',Object.assign({vol:.6,rate:1.3,min:.2},o)); break;
    case 'spell': AUD.sfx({espinhos:'thorns',runa:'rune',selo_gelo:'ice',rede:'net',tempestade:'thunder'}[f.sp]||'magic',o); break;
    case 'spellhit': if(f.sp==='runa') AUD.sfx('explosion',Object.assign({vol:.7,min:.2},o)); break;
  }
}
/* efeitos que soltam partículas uma vez */
function fxOnce(f){
  switch(f.k){
    case 'hit': sparks(f.x,f.y-.35,f.cr?9:4,f.ty==='magic'?'#d8b8ff':'#fff3a0',f.cr?4:3); if(f.ex==='charge') dust(f.x,f.y,6,'rgba(200,180,150,.6)',1.6); break;
    case 'phit': sparks(f.x,f.y-.35,3,f.kind==='canhao'?'#ffcf6a':'#ffffff',2); if(f.kind==='canhao') dust(f.x,f.y,4,'rgba(120,110,100,.5)',1); break;
    case 'boom': debris(f.x,f.y,f.small?5:10,'#6a6058'); dust(f.x,f.y,f.small?5:9,'rgba(90,80,80,.55)',1.6); break;
    case 'ghost': dust(f.x,f.y,5,'rgba(255,255,255,.6)',.8); break;
    case 'rocks': debris(f.x,f.y,12,'#8e9299'); dust(f.x,f.y,8,'rgba(150,140,130,.6)',1.6); break;
    case 'crumble': debris(f.x,f.y,f.big?20:10,'#9b958a'); dust(f.x,f.y,f.big?16:8,'rgba(130,120,110,.6)',f.big?2.4:1.4); break;
    case 'shock': debris(f.x,f.y,14,'#9b958a'); break;
    case 'dmg': { const big=f.cr; part({x:f.x+(Math.random()-.5)*.3,y:f.y-.9,vx:(Math.random()-.5)*.4,vy:big?-1.6:-1.1,g:big?1.5:.8,life:f.dur||.75,r:big?.5:.34,c:big?'#ffd23f':(f.tm===U.me?'#ffb0b0':'#ffffff'),k:'txt',s:(big?'!':'')+f.v}); break; }
    case 'lvl': sparks(f.x,f.y-.6,14,'#ffd23f',3); break;
    case 'spawn': dust(f.x,f.y,5,'rgba(255,255,255,.55)',1); break;
  }
}
function fxDraw(f){
  if(!f.snd){ f.snd=1; try{ fxSound(f); fxOnce(f); }catch(e){} }
  const T=U.T, k=Math.min(1,f.t/f.dur), [x,y]=PX(f.x,f.y);
  switch(f.k){
    case 'dmg': case 'phit': break;
    case 'ring': ctx.strokeStyle=f.c; ctx.globalAlpha=1-k; ctx.lineWidth=5*(1-k)+1; ctx.beginPath(); ctx.ellipse(x,y,f.r*T*(.3+.7*ease(k)),f.r*T*(.3+.7*ease(k))*.7,0,0,6.2832); ctx.stroke(); ctx.globalAlpha=1; break;
    case 'burst': { const n=f.n||10; ctx.fillStyle=f.c; for(let i=0;i<n;i++){ const a=hash(i+f.x*7)*6.2832, rr=f.r*T*ease(k)*(.5+hash(i*3.1)*.7), s=(1-k)*T*.17*(.6+hash(i+4)); ctx.globalAlpha=1-k; ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.8-k*T*.3,Math.max(.5,s),0,6.2832); ctx.fill(); } ctx.globalAlpha=1; break; }
    case 'hit': { /* golpe: arco de corte na direção do ataque */
      const a0=(f.ang||0)+(U.me?Math.PI:0), cy=y-T*.4, R=T*(f.ex==='charge'?.9:.6)*(.7+.3*ease(k)), al=1-k;
      ART.glow(ctx,x,cy,T*(.35+.45*(1-k))*(f.cr?1.5:1),f.ty==='magic'?'#d8b8ff':'#FFFFFF',.85*al);
      ctx.save(); ctx.globalAlpha=al; ctx.lineCap='round';
      const s0=a0-1.2+k*.6, s1=a0+.9+k*.6, cx=x-Math.cos(a0)*T*.25;
      ctx.strokeStyle=f.c; ctx.lineWidth=T*(f.cr?.22:.16)*(1-k); ctx.beginPath(); ctx.arc(cx,cy,R,s0,s1); ctx.stroke();
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=T*.06*(1-k); ctx.beginPath(); ctx.arc(cx,cy,R,s0+.2,s1); ctx.stroke();
      if(f.cr){ ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2.5; for(let i=0;i<6;i++){ const a=i*1.047+k; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*T*.2,cy+Math.sin(a)*T*.2); ctx.lineTo(x+Math.cos(a)*T*(.3+.6*k),cy+Math.sin(a)*T*(.3+.6*k)); ctx.stroke(); } }
      ctx.restore(); break; }
    case 'line': { const [x2,y2]=PX(f.x2,f.y2), e=Math.min(1,k*1.5); ctx.lineCap='round'; ctx.strokeStyle=f.c; ctx.lineWidth=7; ctx.globalAlpha=(1-k*.7)*.35; ctx.beginPath(); ctx.moveTo(x,y-T*.4); ctx.lineTo(x+(x2-x)*e,y-T*.4+(y2-y)*e); ctx.stroke(); ctx.globalAlpha=1-k*.7; ctx.lineWidth=3; ctx.stroke(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke(); ctx.globalAlpha=1; if(e>=1) for(let i=0;i<3;i++){ ctx.fillStyle='rgba(180,255,210,'+(1-k).toFixed(2)+')'; ctx.fillRect(x2-T*.04+(hash(i+f.x)-.5)*T*.5,y2-T*(.4+k*.8+hash(i)*.3),T*.08,T*.22); ctx.fillRect(x2-T*.11+(hash(i+f.x)-.5)*T*.5,y2-T*(.33+k*.8+hash(i)*.3),T*.22,T*.08); } break; }
    case 'spawn': { ART.glow(ctx,x,y-T*.4,T*(.6+.3*(1-k)),f.team===U.me?'#9cc0ff':'#ffb0b0',.7*(1-k)); ctx.fillStyle='rgba(255,255,255,'+(.8*(1-k)).toFixed(2)+')'; ctx.fillRect(x-T*.15*(1-k),y-T*(1.8*ease(k)+.2),T*.3*(1-k),T*1.8*ease(k)); ctx.strokeStyle='rgba(255,255,255,'+(1-k).toFixed(2)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y+T*.1,T*.8*ease(k),T*.35*ease(k),0,0,6.2832); ctx.stroke(); break; }
    case 'ghost': { const al=1-k, fly=f.fly; ctx.save(); ctx.globalAlpha=Math.max(0,al); const dy=fly?k*k*T*1.4:-k*T*.6; ART.unit(ctx,f.key,f.team===U.me?0:1,x,y+dy+T*.14-(fly?T*.85*(1-k):0),T,{ang:viewAng(f.ang||0),anim:'idle',ph:0,hit:k<.3?1:0,rot:fly?k*1.2:0,sy:fly?1:1-k*.5}); ctx.restore();
      for(let i=0;i<4;i++){ ART.glow(ctx,x+(hash(i+f.x*3)-.5)*T*.9,y-k*T*(1+hash(i)*1.2)-T*.3,T*.22,'#FFFFFF',.6*al); } break; }
    case 'crumble': { const big=f.big; if(k<.25) ART.glow(ctx,x,y,T*(big?5:2.4)*(1-k*2),'#FFD08A',.9*(1-k*4)); ctx.fillStyle='rgba(110,100,95,'+(.45*(1-k)).toFixed(2)+')'; for(let i=0;i<(big?9:5);i++){ const a=hash(i+f.y)*6.2832, rr=T*(big?2:1)*ease(k)*(.4+hash(i+8)); ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.5-k*T*.8,T*(.35+.5*k)*(big?1.6:1),0,6.2832); ctx.fill(); } break; }
    case 'fireball': { const [x2,y2]=PX(f.x2,f.y2), e=ease(Math.min(1,k)), px=x+(x2-x)*e, py=y+(y2-y)*e-Math.sin(e*Math.PI)*T*2.4;
      for(let i=1;i<=9;i++){ const kk=Math.max(0,e-i*.035), qx=x+(x2-x)*kk, qy=y+(y2-y)*kk-Math.sin(kk*Math.PI)*T*2.4; ART.glow(ctx,qx,qy,T*(.55-i*.04),i<4?'#FFB02E':'#FF5A1F',.7-i*.07); }
      ART.glow(ctx,px,py,T*1.1,'#FF8A1F',.9); ART.glow(ctx,px,py,T*.5,'#FFE08A',1); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(px,py,T*.16,0,6.2832); ctx.fill(); if(Math.random()<.7) part({x:px/T,y:py/T,vx:(Math.random()-.5),vy:-.5,g:0,life:.4,r:.08,c:'#ffb02e',k:'spark'}); break; }
    case 'boom': { if(!f.seen){ f.seen=1; U.scorch.push({x:f.x,y:f.y,r:f.r*.75,t0:U.time}); }
      if(k<.18){ ART.glow(ctx,x,y,T*f.r*2.4,'#FFFFFF',1-k*5); }
      ctx.save(); ctx.globalCompositeOperation='lighter'; const rr=f.r*T*(.35+.95*ease(k)), gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(255,240,170,'+(.95*(1-k)).toFixed(2)+')'); gr.addColorStop(.45,'rgba(255,140,40,'+(.75*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba(200,40,10,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(255,230,170,'+(.8*(1-k)).toFixed(2)+')'; ctx.lineWidth=5*(1-k)+1; ctx.beginPath(); ctx.ellipse(x,y,f.r*T*1.25*ease(k),f.r*T*.85*ease(k),0,0,6.2832); ctx.stroke();
      for(let i=0;i<6;i++){ const a=hash(i+9+f.y)*6.2832, rr2=T*f.r*.5*ease(k); ctx.fillStyle='rgba(50,40,40,'+(.4*(1-k)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2*.5-k*T*1.1,T*(.35+.5*k),0,6.2832); ctx.fill(); } break; }
    case 'bolt': { const [x2,y2]=PX(f.x2,f.y2); const seed=(f.seed||1)*13+Math.floor(U.time*22); const pts=[[x,y-T*.8]]; const n=8, dxn=(x2-x)/n, dyn=(y2-y+T*.4)/n, nl=Math.hypot(dxn,dyn)||1;
      for(let i=1;i<n;i++){ const o=(hash(seed+i*3.1)-.5)*T*.9; pts.push([x+dxn*i+(-dyn/nl)*o,y-T*.8+dyn*i+(dxn/nl)*o]); } pts.push([x2,y2-T*.4]);
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.globalCompositeOperation='lighter'; const al=1-k*.8;
      [[11,.28,f.c],[5,.7,f.c],[2,1,'#ffffff']].forEach(s=>{ ctx.globalAlpha=al*s[1]; ctx.strokeStyle=s[2]; ctx.lineWidth=s[0]; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); });
      ctx.restore(); break; }
    case 'zap': ART.glow(ctx,x,y-T*.4,T*(.6+.6*(1-k)),f.c,.9*(1-k)); ctx.strokeStyle='#fff'; ctx.globalAlpha=1-k; ctx.lineWidth=2.4; for(let i=0;i<7;i++){ const a=i*.9+hash(f.x)*3, r1=T*(.2+.6*ease(k)); ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*T*.1,y-T*.4+Math.sin(a)*T*.1); ctx.lineTo(x+Math.cos(a)*r1,y-T*.4+Math.sin(a)*r1); ctx.stroke(); } ctx.globalAlpha=1; break;
    case 'heal': case 'rage': { const heal=f.k==='heal', col=heal?'120,255,176':'255,70,90'; ctx.save(); ctx.globalCompositeOperation='lighter'; const rr=f.r*T; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba('+col+','+(.5*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba('+col+',0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(x,y,rr,rr*.75,0,0,6.2832); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba('+col+','+(1-k).toFixed(2)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y,rr*(.4+.6*ease(k)),rr*.75*(.4+.6*ease(k)),0,0,6.2832); ctx.stroke();
      for(let i=0;i<14;i++){ const a=hash(i+f.x)*6.2832, d=hash(i+7)*rr*.9, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d*.6-k*T*(1.2+hash(i)*1.2), s=T*.18*(1-k*.6); ctx.globalAlpha=1-k; ctx.fillStyle=heal?(i%3?'#7CFFB0':'#ffffff'):(i%3?'#ff5a6a':'#ffd0d6'); if(heal){ ctx.fillRect(px-s/6,py-s/2,s/3,s); ctx.fillRect(px-s/2,py-s/6,s,s/3); } else { ctx.beginPath(); ctx.arc(px,py,s*.35,0,6.2832); ctx.fill(); } } ctx.globalAlpha=1; break; }
    case 'icewall': { ctx.strokeStyle='rgba(200,240,255,'+(1-k).toFixed(2)+')'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(x,y,f.r*T*ease(k),f.r*T*.6*ease(k),0,0,6.2832); ctx.stroke(); break; }
    case 'silence': { const rr=f.r*T; ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(181,140,255,'+(.5*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba(181,140,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.restore();
      for(let j=0;j<3;j++){ const kk=(k*1.4+j*.25)%1; ctx.strokeStyle='rgba(210,180,255,'+((1-kk)*.9).toFixed(2)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y,rr*(1-kk),rr*.75*(1-kk),0,0,6.2832); ctx.stroke(); } break; }
    case 'lvl': { const a=1-k; ctx.save(); ctx.globalAlpha=a; ctx.font='bold '+Math.round(T*.55)+'px "Lilita One",system-ui,sans-serif'; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#21132b'; const s='★'.repeat(f.lv)+' Nível '+(f.lv+1); const yy=y-T*1.4-k*T*.8; ctx.strokeText(s,x,yy); ctx.fillStyle='#ffd23f'; ctx.fillText(s,x,yy); ctx.restore(); ART.glow(ctx,x,y-T*.5,T*1.1*(1-k),'#ffd23f',.7); break; }
    case 'shock': { const rr=f.r*T*ease(k), al=1-k; ctx.save(); ctx.globalAlpha=al; ctx.strokeStyle=f.tm===U.me?'#9cc0ff':'#ffb0b0'; ctx.lineWidth=T*.35*(1-k)+2; ctx.beginPath(); ctx.ellipse(x,y,rr,rr*.7,0,0,6.2832); ctx.stroke(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y,rr*.85,rr*.6,0,0,6.2832); ctx.stroke(); ctx.restore(); if(k<.3) ART.glow(ctx,x,y,T*3*(1-k*3),'#ffffff',.6); break; }
    case 'rocks': break;
    case 'fury': break;
    case 'spell': spellDraw(f,k,x,y,T); break;
    case 'spellhit': { ART.glow(ctx,x,y,f.r*T*1.5,f.c,.85*(1-k)); ctx.strokeStyle=f.c; ctx.globalAlpha=1-k; ctx.lineWidth=6*(1-k)+1; ctx.beginPath(); ctx.ellipse(x,y,f.r*T*ease(k),f.r*T*.75*ease(k),0,0,6.2832); ctx.stroke(); ctx.globalAlpha=1;
      if(!f.pp){ f.pp=1; if(f.sp==='espinhos') debris(f.x,f.y,8,'#8a6a4a'); else if(f.sp==='selo_gelo') sparks(f.x,f.y,16,'#dff8ff',4); else if(f.sp==='runa') sparks(f.x,f.y,16,'#d9c2ff',5); }
      if(f.sp==='tempestade'&&k<.3){ ctx.fillStyle='rgba(255,255,255,'+(.3*(1-k/.3)).toFixed(2)+')'; ctx.fillRect(0,0,W*T,H*T); }
      break; }
  }
}
function spellDraw(f,k,x,y,T){
  const rr=f.r*T, al=k<.8?1:(1-k)*5;
  ctx.save(); ctx.globalAlpha=Math.max(0,al);
  if(f.sp==='espinhos'){
    ctx.fillStyle='rgba(80,55,35,.45)'; ctx.beginPath(); ctx.ellipse(x,y+T*.1,rr*.9,rr*.55,0,0,6.2832); ctx.fill();
    const sp=[]; for(let i=0;i<13;i++){ const a=hash(i+f.x)*6.2832, d=Math.sqrt(hash(i+3))*rr*.8; sp.push([x+Math.cos(a)*d,y+Math.sin(a)*d*.55+T*.2,i]); } sp.sort((a,b)=>a[1]-b[1]);
    sp.forEach(p=>{ const i=p[2], g=Math.min(1,Math.max(0,(k-.1-hash(i)*.12)*5)), h=T*(.6+hash(i+8)*.7)*g; const gr=ctx.createLinearGradient(p[0]-T*.1,0,p[0]+T*.1,0); gr.addColorStop(0,'#f2f6fa'); gr.addColorStop(1,'#7f8c99');
      ctx.fillStyle=gr; ctx.strokeStyle='#26123a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(p[0]-T*.1,p[1]); ctx.lineTo(p[0],p[1]-h); ctx.lineTo(p[0]+T*.1,p[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  } else if(f.sp==='runa'||f.sp==='selo_gelo'){
    const ice=f.sp==='selo_gelo', c1=ice?'170,230,255':'181,140,255', spin=U.time*2*(ice?.5:1);
    ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba('+c1+',.55)'); gr.addColorStop(1,'rgba('+c1+',0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(x,y,rr,rr*.7,0,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over';
    ctx.save(); ctx.translate(x,y); ctx.scale(1,.7); ctx.strokeStyle=ice?'#E6FBFF':'#D9C2FF'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,rr*.85*ease(Math.min(1,k*3)),0,6.2832); ctx.stroke();
    if(ice){ for(let i=0;i<6;i++){ const a=i*1.0472+spin; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*rr*.8,Math.sin(a)*rr*.8); ctx.stroke(); } }
    else { for(let i=0;i<8;i++){ const a=spin+i*.785; ctx.beginPath(); ctx.moveTo(Math.cos(a)*rr*.6,Math.sin(a)*rr*.6); ctx.lineTo(Math.cos(a+.3)*rr*.85,Math.sin(a+.3)*rr*.85); ctx.stroke(); } ctx.beginPath(); for(let i=0;i<3;i++){ const a=-spin+i*2.094; ctx.lineTo(Math.cos(a)*rr*.5,Math.sin(a)*rr*.5); } ctx.closePath(); ctx.stroke(); }
    ctx.restore();
  } else if(f.sp==='rede'){
    const e=ease(Math.min(1,k*2.2)), sc=1.6-.6*e, drop=(1-e)*T*2.5;
    ctx.translate(x,y-drop); ctx.scale(sc,sc*.7); ctx.strokeStyle='#E8D9A8'; ctx.lineWidth=2; ctx.fillStyle='rgba(232,217,168,.18)'; ctx.beginPath(); ctx.arc(0,0,rr,0,6.2832); ctx.fill(); ctx.stroke();
    ctx.lineWidth=1.6; for(let i=-4;i<=4;i++){ const o=i*rr/4.4, h=Math.sqrt(Math.max(0,rr*rr-o*o)); ctx.beginPath(); ctx.moveTo(o,-h); ctx.lineTo(o,h); ctx.moveTo(-h,o); ctx.lineTo(h,o); ctx.stroke(); }
    ctx.fillStyle='#5a5f6a'; for(let i=0;i<8;i++){ const a=i*.785; ctx.beginPath(); ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,4,0,6.2832); ctx.fill(); }
  } else if(f.sp==='tempestade'){
    ctx.fillStyle='rgba(70,80,110,.45)'; ctx.beginPath(); ctx.ellipse(x,y,rr*.95,rr*.6,0,0,6.2832); ctx.fill();
    const cl=[[-.6,-2.2,1.1],[.5,-2.4,1],[0,-2,1.3]];
    ctx.globalAlpha=Math.max(0,al)*Math.min(1,k*4); cl.forEach((c,i)=>{ const o=Math.sin(U.time*2+i)*T*.15; ART.E(ctx,x+c[0]*T+o,y+c[1]*T,T*c[2]*1.1,T*c[2]*.7,i===2?'#7E8CA8':'#5E6A88',1.4); });
    ctx.globalAlpha=Math.max(0,al); ctx.strokeStyle='rgba(190,210,255,.7)'; ctx.lineWidth=1.4; for(let i=0;i<22;i++){ const px=x+(hash(i)-.5)*rr*1.8, py=y-T*1.8+((U.time*9+hash(i+3))%1)*T*2.4; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-T*.1,py+T*.35); ctx.stroke(); }
    for(let b=0;b<3;b++){ const ph=((k*3+b*.33)%1); if(ph<.28){ const bx=x+(hash(b+Math.floor(k*3)*7)-.5)*rr*1.5, by=y+(hash(b+11)-.5)*rr*.6; const pts=[[bx+(hash(b)-.5)*T*.6,y-T*2]]; for(let i=1;i<6;i++) pts.push([bx+(hash(b+i*3+Math.floor(U.time*20))-.5)*T*.6,y-T*2+(by-(y-T*2))*i/6]); pts.push([bx,by]);
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.lineJoin='round'; [[9,.3,'#8FB8FF'],[4,.8,'#BFD6FF'],[1.8,1,'#ffffff']].forEach(s=>{ ctx.globalAlpha=s[1]; ctx.strokeStyle=s[2]; ctx.lineWidth=s[0]; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); }); ART.glow(ctx,bx,by,T*1.1,'#BFD6FF',.9); ctx.restore(); } }
  }
  ctx.restore();
}
function drawFxAll(){ const G=U.G; for(let i=0;i<G.fx.length;i++){ ctx.save(); try{ fxDraw(G.fx[i]); }catch(e){} ctx.restore(); } }
function drawScorch(){
  const T=U.T;
  for(let i=U.scorch.length-1;i>=0;i--){ const s=U.scorch[i], age=U.time-s.t0; if(age>9){ U.scorch.splice(i,1); continue; } const [x,y]=PX(s.x,s.y); const a=Math.min(1,age*4)*(1-age/9)*.45; ctx.fillStyle='rgba(25,10,10,'+a.toFixed(2)+')'; ctx.beginPath(); ctx.ellipse(x,y+T*.15,s.r*T*.9,s.r*T*.55,0,0,6.2832); ctx.fill(); }
}
function drawOverlay(){
  const G=U.G, T=U.T; if(G.phase!=='battle'||U.sel==null||U.ended) return;
  const k=G.side[U.me].hand[U.sel], c=CM.CARDS[k]; if(!c) return;
  if(c.tipo==='tropa'){
    ctx.fillStyle='rgba(10,5,35,.38)';
    for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++){
      const own=U.me===0?r>=HALF:r<HALF; const bad=!own||(!c.u.fly&&G.tiles[r][cc]==='#')||G.occ[r][cc]||(!c.u.fly&&G.ice[r][cc]>G.t);
      const [vc,vr]=VT(cc,r); if(bad) ctx.fillRect(vc*T,vr*T,T,T);
    }
    if(U.ptr){ const lx=U.me?W-U.ptr.x:U.ptr.x, ly=U.me?H-U.ptr.y:U.ptr.y, ok=CM.playCheck(G,U.me,U.sel,lx,ly).ok; ctx.globalAlpha=ok?.65:.3; const n=c.sw||1; for(let i=0;i<n;i++) ART.unit(ctx,k,0,(U.ptr.x+(i-(n-1)/2)*.45)*T,U.ptr.y*T+T*.14-(c.u.fly?T*.85:0),T,{ang:-Math.PI/2,anim:'idle',ph:U.time%1}); ctx.globalAlpha=1;
      if(c.u.rg>=2){ ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.setLineDash([5,5]); ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(U.ptr.x*T,U.ptr.y*T,c.u.rg*T,c.u.rg*T*.75,0,0,6.2832); ctx.stroke(); ctx.setLineDash([]); } }
  } else if(U.ptr){
    const rad=(c.z&&c.z.r)||SPELLR[k]||1.5, x=U.ptr.x*T, y=U.ptr.y*T;
    ctx.fillStyle=k==='bencao'||k==='furia'?'rgba(120,255,176,.16)':'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.ellipse(x,y,rad*T,rad*T*.75,0,0,6.2832); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.setLineDash([7,5]); ctx.lineDashOffset=-U.time*20; ctx.stroke(); ctx.setLineDash([]);
    ART.glow(ctx,x,y,T*.6,'#FFFFFF',.5);
  }
}
function draw(){
  const G=U.G; if(!G||!U.bg) return;
  const T=U.T, dt=U.dt;
  U.shake=Math.max(0,U.shake-dt*2.2);
  ctx.save();
  if(U.shake>0){ const s=U.shake*T*.4; ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s); }
  ctx.drawImage(U.bg,0,0,W*T,H*T);
  drawScorch();
  if(G.phase==='place'){
    drawPlacement();
    G.side[U.me].pieces.forEach(p=>{ if(p.pos){ const [vc,vr]=VT(p.pos.c,p.pos.r); try{ ART.struct(ctx,p.key,0,(vc+.5)*T,(vr+.5)*T+T*.36,T,{t:U.time}); }catch(e){} } });
  }
  // tudo ordenado por profundidade (y na tela): construções, gelo e tropas terrestres juntas; voadores por cima
  const list=[];
  G.ents.forEach(e=>{ if(e.kind==='struct'&&e.type!=='trap') list.push([PX(e.x,e.y)[1]+(e.type==='heart'?U.T*.6:U.T*.3),0,e]); else if(e.kind==='unit'&&!e.dead&&!airE(e)) list.push([PX(e.x,e.y)[1],1,e]); });
  list.sort((a,b)=>a[0]-b[0]);
  drawIce();
  list.forEach(q=>{ try{ if(q[1]===0) drawStruct(q[2]); else drawUnit(q[2]); }catch(err){ if(!U.errShown){ U.errShown=1; console.error(err); } } });
  G.ents.filter(e=>e.kind==='unit'&&!e.dead&&airE(e)).sort((a,b)=>PX(a.x,a.y)[1]-PX(b.x,b.y)[1]).forEach(e=>{ try{ drawUnit(e); }catch(err){ if(!U.errShown){ U.errShown=1; console.error(err); } } });
  G.proj.forEach(p=>{ try{ drawProj(p); }catch(e){} });
  if(U.frame%20===0){ PTR.forEach((v,id)=>{ if(v.seen<U.frame-20) PTR.delete(id); }); VS.forEach((v,id)=>{ if(v.seen<U.frame-40) VS.delete(id); }); }
  drawFxAll();
  stepParts(dt);
  ambient(U.time);
  if(G.furyOn&&G.phase==='battle'&&!G.over){ ctx.save(); const a=.12+.06*Math.sin(U.time*4); const gr=ctx.createRadialGradient(W*T/2,H*T/2,Math.min(W,H)*T*.35,W*T/2,H*T/2,Math.max(W,H)*T*.75); gr.addColorStop(0,'rgba(255,60,90,0)'); gr.addColorStop(1,'rgba(255,60,120,'+a.toFixed(2)+')'); ctx.fillStyle=gr; ctx.fillRect(0,0,W*T,H*T); ctx.restore(); }
  drawOverlay();
  ctx.restore();
}
