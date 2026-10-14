/* Desenho da partida: personagens, construções, projéteis e efeitos */
'use strict';
/* ---------- desenho ---------- */
function hpBar(x,y,w,e,v){
  const r=Math.max(0,e.hp/e.maxhp), hd=v?Math.max(r,v.hpd/e.maxhp):r;
  ctx.fillStyle='rgba(25,10,45,.85)'; ctx.fillRect(x-w/2-1.5,y-1.5,w+3,7);
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fillRect(x-w/2,y,w*hd,4);
  ctx.fillStyle=vt(e)===0?'#5C93FF':'#FF6B6B'; ctx.fillRect(x-w/2,y,w*r,4);
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x-w/2,y,w*r,1.5);
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
    ctx.fillStyle='rgba('+a.c+','+al.toFixed(2)+')'; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill();
  }
}
function drawIce(){
  const G=U.G, T=U.T;
  for(let r=0;r<H;r++) for(let c=0;c<W;c++){
    const ex=G.ice[r][c]; if(ex<=G.t) continue;
    const age=7-(ex-G.t), grow=Math.min(1,Math.max(0,age/.3)), melt=Math.min(1,(ex-G.t)/1.2), s=ease(grow)*melt; if(s<=0) continue;
    const [vc,vr]=VT(c,r), x=(vc+.5)*T, y=(vr+.5)*T;
    ctx.save(); ctx.translate(x,y+T*.25); ctx.scale(s,s);
    ART.glow(ctx,0,-T*.2,T*.9,'#BFEFFF',.45);
    ART.E(ctx,0,0,T*.55,T*.2,'rgba(220,245,255,.85)',0);
    [[-.22,.0,.5,.17],[.0,-.05,.85,.2],[.24,.02,.55,.16]].forEach((q,i)=>{ const hh=T*q[2], ww=T*q[3]; ART.P(ctx,[[T*q[0]-ww,T*q[1]],[T*q[0]-ww*.7,T*q[1]-hh*.7],[T*q[0],T*q[1]-hh],[T*q[0]+ww*.7,T*q[1]-hh*.7],[T*q[0]+ww,T*q[1]]],i===1?'#CFF3FF':'#9FE3FF',1.2); ART.L(ctx,T*q[0]-ww*.3,T*q[1]-hh*.2,T*q[0]-ww*.2,T*q[1]-hh*.7,1.2,'#ffffff',true); });
    ctx.restore();
  }
}
function drawPlacement(){
  const G=U.G, T=U.T, pulse=.5+.5*Math.sin(U.time*5);
  G.pads[U.me].forEach(p=>{
    const used=G.side[U.me].pieces.some(q=>q.pos&&q.pos.c===p.c&&q.pos.r===p.r); if(used) return;
    const [vc,vr]=VT(p.c,p.r), x=(vc+.5)*T, y=(vr+.5)*T;
    ART.glow(ctx,x,y,T*.9,'#FFE066',.35+.25*pulse);
    ctx.strokeStyle='rgba(255,230,90,'+(.6+.4*pulse)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,T*(.55+.08*pulse),0,6.2832); ctx.stroke();
  });
}
function drawStruct(e){
  const T=U.T; let v=VS.get(e.id); if(!v){ v={born:0,hpd:e.hp}; VS.set(e.id,v); } v.born=Math.min(1,v.born+U.dt/.5); v.seen=U.frame; v.hpd+=(e.hp-v.hpd)*Math.min(1,U.dt*6);
  const [x,y]=PX(e.x,e.y), st={t:U.time,atk:e.atk>0?Math.min(1,e.atk/.3):0,hit:e.hit,hpr:e.hp/e.maxhp,dir:dirOf(e.team),born:v.born};
  if(e.type==='heart'){
    if(e.dead){ ART.glow(ctx,x,y,T*2.4,'#FF8A3D',.35); ART.E(ctx,x,y+T*.3,T*1.6,T*.7,'#6E6A66',1.4); ART.P(ctx,[[x-T*1.1,y+T*.4],[x-T*.5,y-T*.4],[x+T*.1,y+T*.1],[x+T*.7,y-T*.5],[x+T*1.2,y+T*.4]],'#8E8984',1.4); return; }
    ART.struct(ctx,'heart',vt(e),x,y+T*.65,T*4.7,st); hpBar(x,y+T*1.1,T*2,e,v);
  } else {
    ART.struct(ctx,e.key,vt(e),x,y+T*.34,T*2.75,st); hpBar(x,y+T*.62,T*.95,e,v);
    if(e.st&&e.st.silence>0){ ART.glow(ctx,x,y-T*.4,T*.6,'#B58CFF',.6); }
  }
}
function drawUnit(e){
  const T=U.T, dt=U.dt; let v=VS.get(e.id);
  if(!v){ v={x:e.x,y:e.y,ph:hash(e.id)*1,sp:0,th:vtheta(e,e.team===U.me?-1.5708:1.5708),pose:e.team===U.me?'b':'f',flip:false,born:0,hpd:e.hp,seen:0,sq:1}; VS.set(e.id,v); }
  v.seen=U.frame;
  const dx=e.x-v.x, dy=e.y-v.y, d=Math.hypot(dx,dy), spd=dt>0?d/dt:0; v.sp+=(spd-v.sp)*Math.min(1,dt*9);
  const mv=v.sp>.28&&e.st.freeze<=0&&!(e.st.root>0);
  const aw=e.isV?(e.awv||0):(e.pend>0?1-e.pend/(e.pw||.18):0), at=e.isV?(e.atv||0):(e.atk>0?1-e.atk/.3:0);
  let ang=null; if(aw>0||at>0) ang=e.ang; else if(mv&&d>1e-4) ang=Math.atan2(dy,dx);
  if(ang!=null){ const tv=vtheta(e,ang); v.th+=angd(tv,v.th)*Math.min(1,dt*(aw>0||at>0?18:11)); }
  else if(!mv){ const home=vtheta(e,e.team===0?-1.5708:1.5708); v.th+=angd(home,v.th)*Math.min(1,dt*2.5); }
  const ax=Math.cos(v.th), ay=Math.sin(v.th);
  if(v.pose==='b'?ay<-.3:ay<-.62) v.pose='b'; else if(v.pose==='f'?ay>.3:ay>.62) v.pose='f'; else v.pose='s';
  if(v.pose==='s') v.flip=ax<0;
  v.ph=(v.ph+v.sp*dt/1.15)%1; v.x=e.x; v.y=e.y; v.born=Math.min(1,v.born+dt/.4); v.hpd+=(e.hp-v.hpd)*Math.min(1,dt*7);
  const fl=airE(e), [px,py]=PX(e.x,e.y), size=(1.9+e.r*2.2)*T*(fl?.92:1);
  const lift=fl?T*(.95+Math.sin(U.time*3+e.id)*.07):0;
  // sombra
  ctx.fillStyle='rgba(20,8,40,'+(fl?.22:.3)+')'; ctx.beginPath(); ctx.ellipse(px,py+T*.12,e.r*T*(fl?.9:1.25),e.r*T*(fl?.35:.5),0,0,6.2832); ctx.fill();
  if(!fl){ ctx.strokeStyle=vt(e)===0?'rgba(80,140,255,.85)':'rgba(255,90,90,.85)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(px,py+T*.12,e.r*T*1.35,e.r*T*.55,0,0,6.2832); ctx.stroke(); }
  const lean=mv?Math.max(-.1,Math.min(.1,ax*.09)):0;
  const sq=1+(mv?Math.sin(U.time*20+e.id)*.012:0);
  ART.unit(ctx,e.key,vt(e),px,py+T*.08-lift,size,{pose:v.pose,flip:v.flip,ph:v.ph,mv:mv,aw:aw,at:at,t:U.time+e.id*.37,hit:e.hit>0?e.hit:0,born:v.born<1?v.born:null,lean:lean,sq:sq});
  if(e.st.freeze>0){ ctx.fillStyle='rgba(170,230,255,.5)'; ctx.beginPath(); ctx.ellipse(px,py-lift-size*.28,size*.3,size*.36,0,0,6.2832); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.stroke(); }
  if(e.st.root>0){ ctx.strokeStyle='#4CAF50'; ctx.lineWidth=3; for(let i=0;i<4;i++){ const a=i*1.57+.4; ctx.beginPath(); ctx.moveTo(px+Math.cos(a)*e.r*T*.6,py+T*.1); ctx.quadraticCurveTo(px+Math.cos(a)*e.r*T*1.5,py-T*.4,px+Math.cos(a+.5)*e.r*T*.5,py-T*.8); ctx.stroke(); } }
  if(e.st.silence>0){ ART.glow(ctx,px,py-lift-size*.6,T*.45,'#B58CFF',.7); ctx.strokeStyle='#E0CCFF'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py-lift-size*.6,T*.2,0,6.2832); ctx.moveTo(px-T*.14,py-lift-size*.6+T*.14); ctx.lineTo(px+T*.14,py-lift-size*.6-T*.14); ctx.stroke(); }
  if(e.hp<e.maxhp) hpBar(px,py-lift-size*.74,Math.max(T*.8,size*.46),e,v);
}
function vtheta(e,ang){ return U.me?ang+Math.PI:ang; }

const PJ={arqueira:'arrow',heart:'arrow',balista:'bolt',canhao:'ball',torre_arcana:'orb',mago:'fire',wyvern:'fire',necromante:'skull',druida:'leaf',bardo:'note',fada:'orb',gargula:'orb',grifo:'arrow'};
function drawProj(p){
  const T=U.T; let tr=PTR.get(p.id); if(!tr){ tr=[]; PTR.set(p.id,tr); }
  const [x,y]=PX(p.x,p.y); tr.push([x,y]); if(tr.length>9) tr.shift(); tr.seen=U.frame;
  const q=tr.length>2?tr[tr.length-3]:null; const ang=q?Math.atan2(y-q[1],x-q[0]):1.57;
  const kind=p.fire?'fire':(PJ[p.kind]||(p.ty==='magic'?'orb':'arrow'));
  ctx.save();
  if(kind==='fire'||kind==='orb'||kind==='skull'||kind==='leaf'||kind==='note'){
    const col=kind==='fire'?'#FF8A1F':kind==='skull'?'#6BFF8F':kind==='leaf'?'#8CFF7A':kind==='note'?'#FFE98A':'#C58BFF';
    for(let i=0;i<tr.length;i++){ const k=i/tr.length; ART.glow(ctx,tr[i][0],tr[i][1],T*(.15+.22*k),col,.5*k); }
    ART.glow(ctx,x,y,T*.55,col,.9); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x,y,T*.1,0,6.2832); ctx.fill();
    if(kind==='fire'){ ctx.fillStyle='#FFD34D'; ctx.beginPath(); ctx.arc(x,y,T*.15,0,6.2832); ctx.fill(); }
    if(kind==='note'){ ctx.fillStyle='#fff'; ctx.font='bold '+Math.floor(T*.7)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText('♪',x,y+T*.2); }
  } else if(kind==='ball'){
    for(let i=0;i<tr.length;i++){ const k=i/tr.length; ctx.fillStyle='rgba(120,120,130,'+(.28*k).toFixed(2)+')'; ctx.beginPath(); ctx.arc(tr[i][0],tr[i][1],T*(.1+.14*k),0,6.2832); ctx.fill(); }
    ART.E(ctx,x,y,T*.17,T*.17,'#4B4F5A',1.2); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x-T*.05,y-T*.06,T*.04,0,6.2832); ctx.fill();
  } else {
    ctx.translate(x,y); ctx.rotate(ang); const L=kind==='bolt'?T*1.1:T*.8;
    ART.glow(ctx,0,0,T*.35,'#FFF3A0',.35);
    ctx.lineCap='round'; ctx.strokeStyle='#26123a'; ctx.lineWidth=kind==='bolt'?4.2:3.2; ctx.beginPath(); ctx.moveTo(-L*.5,0); ctx.lineTo(L*.5,0); ctx.stroke();
    ctx.strokeStyle=kind==='bolt'?'#A26A32':'#C9A26A'; ctx.lineWidth=kind==='bolt'?2.6:1.8; ctx.beginPath(); ctx.moveTo(-L*.5,0); ctx.lineTo(L*.5,0); ctx.stroke();
    ctx.fillStyle='#E8EEF5'; ctx.strokeStyle='#26123a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(L*.5,0); ctx.lineTo(L*.3,-T*.1); ctx.lineTo(L*.3,T*.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=U.me===0?'#FF6B6B':'#6EA0FF'; ctx.beginPath(); ctx.moveTo(-L*.5,0); ctx.lineTo(-L*.62,-T*.1); ctx.lineTo(-L*.34,0); ctx.lineTo(-L*.62,T*.1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* efeitos */
function fxDraw(f){
  const T=U.T, k=Math.min(1,f.t/f.dur), [x,y]=PX(f.x,f.y);
  switch(f.k){
    case 'ring': ctx.strokeStyle=f.c; ctx.globalAlpha=1-k; ctx.lineWidth=5*(1-k)+1; ctx.beginPath(); ctx.arc(x,y,f.r*T*(.3+.7*ease(k)),0,6.2832); ctx.stroke(); ctx.globalAlpha=1; break;
    case 'burst': { const n=f.n||10; ctx.fillStyle=f.c; for(let i=0;i<n;i++){ const a=hash(i+f.x*7)*6.2832, rr=f.r*T*ease(k)*(.5+hash(i*3.1)*.7), s=(1-k)*T*.17*(.6+hash(i+4)); ctx.globalAlpha=1-k; ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.8-k*T*.3,Math.max(.5,s),0,6.2832); ctx.fill(); } ctx.globalAlpha=1; break; }
    case 'rise': { const n=f.n||12; for(let i=0;i<n;i++){ const px=x+(hash(i+f.x)-.5)*f.r*T*2, py=y+T*.3-k*T*(1+hash(i+9)*1.4)*1.4; ctx.fillStyle=f.c; ctx.globalAlpha=(1-k)*.9; ctx.beginPath(); ctx.arc(px,py,T*.07*(1-k)+1,0,6.2832); ctx.fill(); } ctx.globalAlpha=1; break; }
    case 'spark': ctx.strokeStyle=f.c; ctx.globalAlpha=1-k; ctx.lineWidth=2.4; for(let i=0;i<6;i++){ const a=i*1.0472+hash(f.x*5)*2; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*T*.1,y+Math.sin(a)*T*.1); ctx.lineTo(x+Math.cos(a)*T*(.15+.5*ease(k)),y+Math.sin(a)*T*(.15+.5*ease(k))); ctx.stroke(); } ctx.globalAlpha=1; break;
    case 'hit': { ART.glow(ctx,x,y,T*(.3+.5*(1-k)),'#FFFFFF',.9*(1-k)); ctx.strokeStyle=f.c; ctx.lineWidth=3; ctx.globalAlpha=1-k; const a0=(f.ang||0)+(U.me?Math.PI:0); for(let i=0;i<5;i++){ const a=a0+(i-2)*.5+Math.PI; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*T*.15,y+Math.sin(a)*T*.15); ctx.lineTo(x+Math.cos(a)*T*(.3+.55*ease(k)),y+Math.sin(a)*T*(.3+.55*ease(k))); ctx.stroke(); } if(f.ty==='magic'){ ctx.beginPath(); ctx.arc(x,y,T*(.2+.5*ease(k)),0,6.2832); ctx.stroke(); } ctx.globalAlpha=1; break; }
    case 'line': { const [x2,y2]=PX(f.x2,f.y2), e=Math.min(1,k*1.5); ctx.globalAlpha=1-k*.7; ctx.lineCap='round'; ctx.strokeStyle=f.c; ctx.lineWidth=7; ctx.globalAlpha*=.35; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(x2-x)*e,y+(y2-y)*e); ctx.stroke(); ctx.globalAlpha=1-k*.7; ctx.lineWidth=3; ctx.stroke(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke(); ctx.globalAlpha=1; break; }
    case 'spawn': { ART.glow(ctx,x,y-T*.4,T*(.6+.3*(1-k)),'#FFFFFF',.6*(1-k)); ctx.fillStyle='rgba(255,255,255,'+(.8*(1-k)).toFixed(2)+')'; ctx.fillRect(x-T*.18*(1-k),y-T*(1.8*ease(k)+.2),T*.36*(1-k),T*1.8*ease(k)); for(let i=0;i<8;i++){ const a=hash(i+f.x)*6.2832; ctx.fillStyle='rgba(255,240,200,'+(.8*(1-k)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*T*.8*ease(k),y+T*.1+Math.sin(a)*T*.3*ease(k),T*.07,0,6.2832); ctx.fill(); } break; }
    case 'ghost': { const al=1-k, fly=f.fly; const dy=fly?k*k*T*1.4:-k*T*.7; ctx.save(); ctx.globalAlpha=Math.max(0,al); ctx.translate(x,y+dy); if(fly) ctx.rotate(k*1.4*(hash(f.x)>.5?1:-1)); const sz=(1.9+f.r*2.2)*T*(1-k*.35); ART.unit(ctx,f.key,f.team===U.me?0:1,0,fly?-T*.9*(1-k):0,sz,{pose:'f',mv:false,t:U.time,hit:k<.25?1:0}); ctx.restore();
      for(let i=0;i<4;i++){ ART.glow(ctx,x+(hash(i+f.x*3)-.5)*T*.9,y-k*T*(1+hash(i)*1.2)-T*.3,T*.22,'#FFFFFF',.7*al); } break; }
    case 'crumble': { const big=f.big, n=big?16:9; if(k<.2) ART.glow(ctx,x,y,T*(big?5:2.4)*(1-k*2),'#FFD08A',.9*(1-k*5)); for(let i=0;i<n;i++){ const a=hash(i*2.3+f.x)*6.2832, v=(.5+hash(i+3))*T*(big?3.2:1.7), t=k; const px=x+Math.cos(a)*v*t, py=y-T*.3+Math.sin(a)*v*t*.5+t*t*T*(big?4:2.4); ctx.save(); ctx.translate(px,py); ctx.rotate(t*6+i); ctx.globalAlpha=Math.max(0,1-k*1.1); ctx.fillStyle=i%2?'#9B958A':'#6B6155'; ctx.strokeStyle='#26123a'; ctx.lineWidth=1.4; const s=T*(big?.32:.2)*(.6+hash(i)); ctx.fillRect(-s/2,-s/2,s,s); ctx.strokeRect(-s/2,-s/2,s,s); ctx.restore(); }
      for(let i=0;i<(big?9:5);i++){ const a=hash(i+f.y)*6.2832, rr=T*(big?2:1)*ease(k)*(.4+hash(i+8)); ctx.fillStyle='rgba(110,100,95,'+(.45*(1-k)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.5-k*T*.8,T*(.35+.5*k)*(big?1.6:1),0,6.2832); ctx.fill(); } ctx.globalAlpha=1; break; }
    case 'fireball': { const [x2,y2]=PX(f.x2,f.y2), e=ease(Math.min(1,k)), px=x+(x2-x)*e, py=y+(y2-y)*e-Math.sin(e*Math.PI)*T*2.4;
      for(let i=1;i<=9;i++){ const kk=Math.max(0,e-i*.035), qx=x+(x2-x)*kk, qy=y+(y2-y)*kk-Math.sin(kk*Math.PI)*T*2.4; ART.glow(ctx,qx,qy,T*(.55-i*.04),i<4?'#FFB02E':'#FF5A1F',.7-i*.07); }
      ART.glow(ctx,px,py,T*1.1,'#FF8A1F',.9); ART.glow(ctx,px,py,T*.5,'#FFE08A',1); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(px,py,T*.16,0,6.2832); ctx.fill(); if(k<.2) ART.glow(ctx,x,y,T*(1.2-k*5),'#FFB02E',.8*(1-k*5)); break; }
    case 'boom': { if(!f.seen){ f.seen=1; U.scorch.push({x:f.x,y:f.y,r:f.r*.75,t0:U.time}); }
      if(k<.18){ ART.glow(ctx,x,y,T*f.r*2.4,'#FFFFFF',1-k*5); }
      ctx.save(); ctx.globalCompositeOperation='lighter'; const rr=f.r*T*(.35+.95*ease(k)), gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(255,240,170,'+(.95*(1-k)).toFixed(2)+')'); gr.addColorStop(.45,'rgba(255,140,40,'+(.75*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba(200,40,10,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(255,230,170,'+(.8*(1-k)).toFixed(2)+')'; ctx.lineWidth=5*(1-k)+1; ctx.beginPath(); ctx.arc(x,y,f.r*T*1.25*ease(k),0,6.2832); ctx.stroke();
      for(let i=0;i<16;i++){ const a=hash(i*1.7+f.x)*6.2832, v=(.6+hash(i+5))*T*f.r*1.5; const px=x+Math.cos(a)*v*ease(k), py=y+Math.sin(a)*v*ease(k)*.6+k*k*T*1.2; ctx.fillStyle=i%2?'#FFD34D':'#FF6A2B'; ctx.globalAlpha=1-k; ctx.beginPath(); ctx.arc(px,py,T*.08*(1-k)+1,0,6.2832); ctx.fill(); }
      for(let i=0;i<6;i++){ const a=hash(i+9+f.y)*6.2832, rr2=T*f.r*.5*ease(k); ctx.fillStyle='rgba(50,40,40,'+(.4*(1-k)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2*.5-k*T*1.1,T*(.35+.5*k),0,6.2832); ctx.fill(); } ctx.globalAlpha=1; break; }
    case 'bolt': { const [x2,y2]=PX(f.x2,f.y2); const seed=(f.seed||1)*13+Math.floor(U.time*22); const pts=[[x,y]]; const n=8, dxn=(x2-x)/n, dyn=(y2-y)/n, nl=Math.hypot(dxn,dyn)||1;
      for(let i=1;i<n;i++){ const o=(hash(seed+i*3.1)-.5)*T*.9; pts.push([x+dxn*i+(-dyn/nl)*o,y+dyn*i+(dxn/nl)*o]); } pts.push([x2,y2]);
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.globalCompositeOperation='lighter'; const al=1-k*.8;
      [[11,.28,f.c],[5,.7,f.c],[2,1,'#ffffff']].forEach(s=>{ ctx.globalAlpha=al*s[1]; ctx.strokeStyle=s[2]; ctx.lineWidth=s[0]; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); });
      for(let b=0;b<2;b++){ const i=2+b*3, p=pts[i], a=(hash(seed+b)-.5)*2.2+Math.atan2(dyn,dxn); ctx.globalAlpha=al*.7; ctx.lineWidth=2; ctx.strokeStyle=f.c; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0]+Math.cos(a)*T*1.1,p[1]+Math.sin(a)*T*1.1); ctx.stroke(); }
      ctx.restore(); break; }
    case 'zap': ART.glow(ctx,x,y,T*(.6+.6*(1-k)),f.c,.9*(1-k)); ctx.strokeStyle='#fff'; ctx.globalAlpha=1-k; ctx.lineWidth=2.4; for(let i=0;i<7;i++){ const a=i*.9+hash(f.x)*3, r1=T*(.2+.6*ease(k)); ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*T*.1,y+Math.sin(a)*T*.1); ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1); ctx.stroke(); } ctx.globalAlpha=1; break;
    case 'heal': { ctx.save(); ctx.globalCompositeOperation='lighter'; const rr=f.r*T; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(120,255,176,'+(.5*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba(120,255,176,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(180,255,210,'+(1-k).toFixed(2)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,rr*(.4+.6*ease(k)),0,6.2832); ctx.stroke();
      for(let i=0;i<14;i++){ const a=hash(i+f.x)*6.2832, d=hash(i+7)*rr*.9, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d*.6-k*T*(1.2+hash(i)*1.2), s=T*.18*(1-k*.6); ctx.globalAlpha=1-k; ctx.fillStyle=i%3?'#7CFFB0':'#ffffff'; ctx.fillRect(px-s/6,py-s/2,s/3,s); ctx.fillRect(px-s/2,py-s/6,s,s/3); } ctx.globalAlpha=1; break; }
    case 'icewall': { ctx.strokeStyle='rgba(200,240,255,'+(1-k).toFixed(2)+')'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x,y,f.r*T*ease(k),0,6.2832); ctx.stroke(); for(let i=0;i<14;i++){ const a=hash(i+f.x)*6.2832, v=T*(.6+hash(i+4)*1.4)*ease(k); ctx.fillStyle='rgba(220,248,255,'+(1-k).toFixed(2)+')'; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*v,y+Math.sin(a)*v*.5-T*.1); ctx.lineTo(x+Math.cos(a)*v+T*.07,y+Math.sin(a)*v*.5+T*.12); ctx.lineTo(x+Math.cos(a)*v-T*.07,y+Math.sin(a)*v*.5+T*.12); ctx.fill(); } break; }
    case 'silence': { const rr=f.r*T; ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(181,140,255,'+(.5*(1-k)).toFixed(2)+')'); gr.addColorStop(1,'rgba(181,140,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.restore();
      for(let j=0;j<3;j++){ const kk=(k*1.4+j*.25)%1; ctx.strokeStyle='rgba(210,180,255,'+((1-kk)*.9).toFixed(2)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,rr*(1-kk),0,6.2832); ctx.stroke(); }
      for(let i=0;i<10;i++){ const a=i*.63+k*5, d=rr*(.2+.7*hash(i)), px=x+Math.cos(a)*d, py=y+Math.sin(a)*d*.6-k*T*.8; ctx.fillStyle='rgba(235,220,255,'+(1-k).toFixed(2)+')'; ctx.beginPath(); ctx.arc(px,py,T*.1,0,6.2832); ctx.fill(); ctx.strokeStyle='#8E5BFF'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(px-T*.12,py+T*.12); ctx.lineTo(px+T*.12,py-T*.12); ctx.stroke(); } break; }
    case 'spell': spellDraw(f,k,x,y,T); break;
    case 'spellhit': { ART.glow(ctx,x,y,f.r*T*1.5,f.c,.85*(1-k)); ctx.strokeStyle=f.c; ctx.globalAlpha=1-k; ctx.lineWidth=6*(1-k)+1; ctx.beginPath(); ctx.arc(x,y,f.r*T*ease(k),0,6.2832); ctx.stroke(); ctx.globalAlpha=1;
      if(f.sp==='runa'){ for(let i=0;i<10;i++){ const a=i*.63+hash(i)*.3; ctx.strokeStyle='rgba(224,204,255,'+(1-k).toFixed(2)+')'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*f.r*T*.3,y+Math.sin(a)*f.r*T*.3); ctx.lineTo(x+Math.cos(a)*f.r*T*(.5+ease(k)),y+Math.sin(a)*f.r*T*(.5+ease(k))); ctx.stroke(); } }
      else if(f.sp==='selo_gelo'){ for(let i=0;i<12;i++){ const a=hash(i+f.x)*6.2832, v=f.r*T*ease(k)*(.4+hash(i+2)*.8); ctx.fillStyle='rgba(220,248,255,'+(1-k).toFixed(2)+')'; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*v,y+Math.sin(a)*v*.7-T*.2); ctx.lineTo(x+Math.cos(a)*v+T*.08,y+Math.sin(a)*v*.7+T*.1); ctx.lineTo(x+Math.cos(a)*v-T*.08,y+Math.sin(a)*v*.7+T*.1); ctx.fill(); } }
      else if(f.sp==='tempestade'&&k<.3){ ctx.fillStyle='rgba(255,255,255,'+(.3*(1-k/.3)).toFixed(2)+')'; ctx.fillRect(0,0,W*T,H*T); }
      break; }
  }
}
function spellDraw(f,k,x,y,T){
  const rr=f.r*T, al=k<.8?1:(1-k)*5;
  ctx.save(); ctx.globalAlpha=Math.max(0,al);
  if(f.sp==='espinhos'){
    ctx.strokeStyle='rgba(60,40,30,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y+T*.1,rr*.9,rr*.5,0,0,6.2832); ctx.stroke();
    for(let i=0;i<11;i++){ const a=hash(i+f.x)*6.2832, d=hash(i+3)*rr*.8, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d*.55+T*.2, g=Math.min(1,Math.max(0,(k-.1-hash(i)*.12)*5)), h=T*(.6+hash(i+8)*.7)*g;
      ctx.fillStyle='#E8EEF5'; ctx.strokeStyle='#26123a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(px-T*.1,py); ctx.lineTo(px,py-h); ctx.lineTo(px+T*.1,py); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  } else if(f.sp==='runa'){
    const spin=U.time*2; ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(181,140,255,.55)'); gr.addColorStop(1,'rgba(181,140,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#D9C2FF'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,rr*.85*ease(Math.min(1,k*3)),0,6.2832); ctx.stroke();
    for(let i=0;i<8;i++){ const a=spin+i*.785; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*rr*.6,y+Math.sin(a)*rr*.6); ctx.lineTo(x+Math.cos(a+.3)*rr*.85,y+Math.sin(a+.3)*rr*.85); ctx.stroke(); }
    ctx.beginPath(); for(let i=0;i<3;i++){ const a=-spin+i*2.094; ctx.lineTo(x+Math.cos(a)*rr*.5,y+Math.sin(a)*rr*.5); } ctx.closePath(); ctx.stroke();
  } else if(f.sp==='selo_gelo'){
    ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(170,230,255,.55)'); gr.addColorStop(1,'rgba(170,230,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,rr,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#E6FBFF'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.arc(x,y,rr*.85*ease(Math.min(1,k*3)),0,6.2832); ctx.stroke();
    for(let i=0;i<6;i++){ const a=i*1.0472+U.time; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*rr*.8,y+Math.sin(a)*rr*.8); ctx.stroke(); for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*rr*.5,y+Math.sin(a)*rr*.5); ctx.lineTo(x+Math.cos(a+s*.5)*rr*.65,y+Math.sin(a+s*.5)*rr*.65); ctx.stroke(); } }
  } else if(f.sp==='rede'){
    const e=ease(Math.min(1,k*2.2)), sc=1.6-.6*e, drop=(1-e)*T*2.5;
    ctx.translate(x,y-drop); ctx.scale(sc,sc*.8); ctx.strokeStyle='#E8D9A8'; ctx.lineWidth=2; ctx.fillStyle='rgba(232,217,168,.18)'; ctx.beginPath(); ctx.arc(0,0,rr,0,6.2832); ctx.fill(); ctx.stroke();
    ctx.lineWidth=1.6; for(let i=-4;i<=4;i++){ const o=i*rr/4.4, h=Math.sqrt(Math.max(0,rr*rr-o*o)); ctx.beginPath(); ctx.moveTo(o,-h); ctx.lineTo(o,h); ctx.moveTo(-h,o); ctx.lineTo(h,o); ctx.stroke(); }
    ctx.fillStyle='#8A5A2B'; for(let i=0;i<8;i++){ const a=i*.785; ctx.beginPath(); ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,3,0,6.2832); ctx.fill(); }
  } else if(f.sp==='tempestade'){
    const cl=[[-.6,-1.5,1.1],[.5,-1.7,1],[0,-1.3,1.3]];
    ctx.fillStyle='rgba(70,80,110,.55)'; ctx.beginPath(); ctx.ellipse(x,y,rr*.95,rr*.55,0,0,6.2832); ctx.fill();
    ctx.globalAlpha=Math.max(0,al)*Math.min(1,k*4); cl.forEach((c,i)=>{ const o=Math.sin(U.time*2+i)*T*.15; ART.E(ctx,x+c[0]*T+o,y+c[1]*T,T*c[2]*1.1,T*c[2]*.7,i===2?'#7E8CA8':'#5E6A88',1.4); });
    ctx.globalAlpha=Math.max(0,al); ctx.strokeStyle='rgba(190,210,255,.7)'; ctx.lineWidth=1.4; for(let i=0;i<22;i++){ const px=x+(hash(i)-.5)*rr*1.8, py=y-T*1.2+((U.time*9+hash(i+3))%1)*T*2.4; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-T*.1,py+T*.35); ctx.stroke(); }
    for(let b=0;b<3;b++){ const ph=((k*3+b*.33)%1); if(ph<.28){ const bx=x+(hash(b+Math.floor(k*3)*7)-.5)*rr*1.5, by=y+(hash(b+11)-.5)*rr*.6; const pts=[[bx+(hash(b)-.5)*T*.6,y-T*1.4]]; for(let i=1;i<6;i++) pts.push([bx+(hash(b+i*3+Math.floor(U.time*20))-.5)*T*.6,y-T*1.4+(by-(y-T*1.4))*i/6]); pts.push([bx,by]);
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.lineJoin='round'; [[9,.3,'#8FB8FF'],[4,.8,'#BFD6FF'],[1.8,1,'#ffffff']].forEach(s=>{ ctx.globalAlpha=s[1]; ctx.strokeStyle=s[2]; ctx.lineWidth=s[0]; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); }); ART.glow(ctx,bx,by,T*1.1,'#BFD6FF',.9); ctx.restore(); } }
  }
  ctx.restore();
}
function drawFxAll(){ const G=U.G; for(let i=0;i<G.fx.length;i++){ ctx.save(); fxDraw(G.fx[i]); ctx.restore(); } }
function drawScorch(){
  const T=U.T;
  for(let i=U.scorch.length-1;i>=0;i--){ const s=U.scorch[i], age=U.time-s.t0; if(age>9){ U.scorch.splice(i,1); continue; } const [x,y]=PX(s.x,s.y); const a=Math.min(1,age*4)*(1-age/9)*.5; ctx.fillStyle='rgba(25,10,10,'+a.toFixed(2)+')'; ctx.beginPath(); ctx.ellipse(x,y+T*.15,s.r*T*.9,s.r*T*.55,0,0,6.2832); ctx.fill(); }
}
function drawOverlay(){
  const G=U.G, T=U.T; if(G.phase!=='battle'||U.sel==null||U.ended) return;
  const k=G.side[U.me].hand[U.sel], c=CM.CARDS[k]; if(!c) return;
  if(c.tipo==='tropa'){
    for(let r=0;r<H;r++) for(let cc=0;cc<W;cc++){
      const own=U.me===0?r>=HALF:r<HALF; const bad=!own||(!c.u.fly&&G.tiles[r][cc]==='#')||G.occ[r][cc]||(!c.u.fly&&G.ice[r][cc]>G.t);
      const [vc,vr]=VT(cc,r); if(bad){ ctx.fillStyle='rgba(10,5,35,.5)'; ctx.fillRect(vc*T,vr*T,T,T); } else { ctx.fillStyle='rgba(255,255,255,.28)'; ctx.beginPath(); ctx.arc((vc+.5)*T,(vr+.5)*T,T*.1,0,6.2832); ctx.fill(); }
    }
    if(U.ptr){ const lx=U.me?W-U.ptr.x:U.ptr.x, ly=U.me?H-U.ptr.y:U.ptr.y, ok=CM.playCheck(G,U.me,U.sel,lx,ly).ok; if(ok){ ctx.globalAlpha=.6; ART.unit(ctx,k,0,U.ptr.x*T,U.ptr.y*T,(1.9+c.u.r*2.2)*T,{pose:'b',mv:false,t:U.time}); ctx.globalAlpha=1; } }
  } else if(U.ptr){
    const rad=(c.z&&c.z.r)||SPELLR[k]||1.5, x=U.ptr.x*T, y=U.ptr.y*T;
    ctx.fillStyle='rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(x,y,rad*T,0,6.2832); ctx.fill();
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
  drawScorch(); drawIce();
  if(G.phase==='place'){
    drawPlacement();
    G.side[U.me].pieces.forEach(p=>{ if(p.pos){ const [vc,vr]=VT(p.pos.c,p.pos.r); ART.struct(ctx,p.key,0,(vc+.5)*T,(vr+.5)*T+T*.34,T*2.75,{t:U.time,dir:-1}); } });
  }
  const structs=G.ents.filter(e=>e.kind==='struct'&&e.type!=='trap').sort((a,b)=>PX(a.x,a.y)[1]-PX(b.x,b.y)[1]);
  structs.forEach(drawStruct);
  const units=G.ents.filter(e=>e.kind==='unit'&&!e.dead);
  units.filter(e=>!airE(e)).sort((a,b)=>PX(a.x,a.y)[1]-PX(b.x,b.y)[1]).forEach(drawUnit);
  units.filter(airE).sort((a,b)=>PX(a.x,a.y)[1]-PX(b.x,b.y)[1]).forEach(drawUnit);
  G.proj.forEach(drawProj);
  if(U.frame%20===0){ PTR.forEach((v,id)=>{ if(v.seen<U.frame-20) PTR.delete(id); }); VS.forEach((v,id)=>{ if(v.seen<U.frame-40) VS.delete(id); }); }
  drawFxAll();
  ambient(U.time);
  drawOverlay();
  ctx.restore();
}
