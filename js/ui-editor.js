/* Editor de decks */
'use strict';
/* ---------- editor ---------- */
let edSlot=0;
const GROUPS=[['tropa','Tropas'],['constr','Construções'],['feitico','Feitiços e armadilhas']];
function detail(k){
  const c=CM.CARDS[k], box=el('div');
  const p=img(k,'portrait',84); box.appendChild(p);
  box.appendChild(el('h3',null,c.nome));
  const tipo={tropa:'Tropa',constr:'Construção',armad:'Armadilha',feitico:'Feitiço'}[c.tipo];
  box.appendChild(el('p','muted',tipo+(c.custo?' · '+c.custo+' de mana':'')));
  box.appendChild(el('p',null,c.info));
  const ul=el('ul'); CM.statLines(k).forEach(l=>ul.appendChild(el('li',null,l))); box.appendChild(ul);
  const row=el('div','row'); const b=el('button','btn cool','Fechar'); b.type='button'; b.onclick=closeModal; row.appendChild(b); box.appendChild(row);
  openModal(box);
}
function toggleCard(k){
  const d=S.decks[edSlot], i=d.cards.indexOf(k);
  if(i>=0) d.cards.splice(i,1);
  else {
    if(d.cards.length>=12){ toast('Máximo de 12 cartas no deck'); return; }
    if(CM.isStruct(k)&&d.cards.filter(CM.isStruct).length>=4){ toast('Máximo de 4 construções/armadilhas'); return; }
    d.cards.push(k);
  }
  saveDecks(); renderEditor();
}
function renderEditor(){
  const d=S.decks[edSlot], v=CM.validateDeck(d.cards);
  const sl=$('#slots'); sl.innerHTML='';
  S.decks.forEach((dk,i)=>{
    const b=el('button','slot'+(i===edSlot?' on':''),(i===S.main?'★ ':'')+(i+1)); b.type='button';
    b.setAttribute('aria-label','Deck '+(i+1)+(i===S.main?' (principal)':'')); b.onclick=()=>{ edSlot=i; renderEditor(); };
    sl.appendChild(b);
  });
  $('#dname').value=d.name;
  $('#setmain').disabled=(edSlot===S.main)||!v.ok;
  $('#setmain').textContent=edSlot===S.main?'★ É o principal':'★ Principal';
  const st=$('#stats'); st.innerHTML='';
  const chip=(t,bad)=>{ st.appendChild(el('span','stat'+(bad===true?' bad':bad===false?' ok':''),t)); };
  chip('Cartas '+v.n+'/8–12', v.n<8||v.n>12?true:false);
  chip('Jogáveis '+v.play+' (mín. 6)', v.play<6?true:false);
  chip('Construções '+v.st+'/4', v.st>4?true:false);
  chip('Custo médio '+(v.avg?v.avg.toFixed(1):'–'), null);
  const ms=$('#msgs'); ms.innerHTML='';
  v.errs.forEach(m=>ms.appendChild(el('li','err',m)));
  v.warns.forEach(m=>ms.appendChild(el('li','warn',m)));
  const pool=$('#pool'); pool.innerHTML='';
  GROUPS.forEach(g=>{
    pool.appendChild(el('h3','grp',g[1]));
    const grid=el('div','pool');
    CM.ORDER[g[0]].forEach(k=>{
      const c=CM.CARDS[k], inD=d.cards.indexOf(k)>=0;
      const box=el('div','ct t-'+c.tipo+(inD?' in':''));
      const main=el('button','main'); main.type='button';
      main.setAttribute('aria-pressed',inD);
      main.setAttribute('aria-label',c.nome+(inD?', no deck':', fora do deck'));
      const art=el('span','art'); art.appendChild(img(k,null,80)); main.appendChild(art);
      main.appendChild(el('span','nm',c.nome));
      main.onclick=()=>toggleCard(k);
      box.appendChild(main);
      if(inD) box.appendChild(el('span','tick','✓'));
      if(c.custo) box.appendChild(el('span','co',String(c.custo)));
      else box.appendChild(el('span','tag',c.tipo==='armad'?'Armadilha':'Construção'));
      const inf=el('button','info','i'); inf.type='button'; inf.setAttribute('aria-label','Detalhes de '+c.nome); inf.onclick=()=>detail(k);
      box.appendChild(inf);
      grid.appendChild(box);
    });
    pool.appendChild(grid);
  });
}
$('#dname').addEventListener('input',e=>{ S.decks[edSlot].name=e.target.value.slice(0,16)||('Deck '+(edSlot+1)); saveDecks(); });
$('#dname').addEventListener('change',()=>renderEditor());
$('#setmain').onclick=()=>{ S.main=edSlot; saveDecks(); renderEditor(); toast('Deck principal definido'); };
$('#rand').onclick=()=>{ S.decks[edSlot].cards=CM.randomDeck(); saveDecks(); renderEditor(); };
$('#clear').onclick=()=>{ S.decks[edSlot].cards=[]; saveDecks(); renderEditor(); };
$('#ed-back').onclick=()=>{ renderHome(); show('home'); };
