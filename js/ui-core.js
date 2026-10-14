/* Utilitários, memória dos decks (conta/navegador), avisos, janelas e troca de telas */
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
const store={
  get(k,d){ try{ const v=localStorage.getItem('vd:'+k); return v===null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('vd:'+k,JSON.stringify(v)); }catch(e){} }
};
const img=(key,cls,sz)=>{ const i=el('img',cls); i.alt=''; i.width=sz||40; i.height=sz||40; i.src=ART.portrait(key,CM.CARDS[key]?CM.CARDS[key].tipo:'tropa'); return i; };

/* ---------- memória dos decks (conta, quando disponível; senão este navegador) ---------- */
let S={decks:[],main:0};
let dbDoc=null, remoteOk=false, saveT=null, saving=false, dirty=false;
function applySaved(d){
  if(!d||!Array.isArray(d.decks)) return false;
  const out=[];
  for(let i=0;i<5;i++){
    const x=d.decks[i];
    const cards=x&&Array.isArray(x.cards)?x.cards.filter(k=>typeof k==='string'&&CM.CARDS[k]).slice(0,12):[];
    out.push({name:x&&typeof x.name==='string'&&x.name?x.name.slice(0,16):'Deck '+(i+1),cards:cards});
  }
  S.decks=out; S.main=Number.isInteger(d.main)&&d.main>=0&&d.main<5?d.main:0;
  return true;
}
function defaults(){
  S.decks=[]; for(let i=0;i<5;i++) S.decks.push({name:i===0?'Equilíbrio':'Deck '+(i+1),cards:i===0?CM.DEFAULT_DECK.slice():[]}); S.main=0;
}
if(!applySaved(store.get('decks',null))) defaults();
function setNote(){
  const t=remoteOk?'☁ Seus decks ficam salvos na sua conta.':'💾 Seus decks ficam salvos neste navegador.';
  $('#save-note').textContent=t; $('#ed-note').textContent=t;
}
function saveDecks(){
  store.set('decks',{decks:S.decks,main:S.main});
  if(dbDoc){ dirty=true; clearTimeout(saveT); saveT=setTimeout(flush,500); }
}
async function flush(){
  if(!dbDoc||!dirty) return;
  if(saving){ saveT=setTimeout(flush,400); return; }
  saving=true; dirty=false;
  try{ await dbDoc.set({v:2,decks:S.decks,main:S.main}); remoteOk=true; }catch(e){ remoteOk=false; }
  saving=false; setNote();
  if(dirty) saveT=setTimeout(flush,400);
}
async function initRemote(){
  try{
    if(!window.claude||typeof window.claude.use!=='function') return;
    const db=await window.claude.use('db'), user=await window.claude.use('user');
    if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    dbDoc=db.collection('data/users/'+uid).doc('decks');
    const snap=await dbDoc.get();
    if(snap.exists&&applySaved(snap.data())){ remoteOk=true; store.set('decks',{decks:S.decks,main:S.main}); }
    else { dirty=true; await flush(); }
    setNote(); renderHome();
    if(!$('#v-editor').hidden) renderEditor();
    if(!$('#v-bmenu').hidden) renderBMenu();
  }catch(e){ remoteOk=false; setNote(); }
}

let toastT=null;
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(toastT); toastT=setTimeout(()=>{ t.hidden=true; },2200);
}
function openModal(node){ const sh=$('#sheet'); sh.innerHTML=''; sh.appendChild(node); $('#modal').hidden=false; }
function closeModal(){ $('#modal').hidden=true; }
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });

const views=['home','editor','bmenu','game'];
function show(v){
  views.forEach(x=>{ $('#v-'+x).hidden=x!==v; });
  if(v!=='game') stopLoop();
  if(v==='home') startHero(); else stopHero();
  window.scrollTo(0,0);
}
