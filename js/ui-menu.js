/* Menu de batalha (máquina e online) */
'use strict';
/* ---------- menu de batalha ---------- */
const B={mode:'ai',diff:1,d1:0};
const ON={state:'idle',msg:'',secs:30,code:'',statEl:null};
const okDeck=i=>CM.validateDeck(S.decks[i].cards).ok;
const myNick=()=>clean(store.get('nick',''))||'Jogador';
function deckList(){
  const wrap=el('div'); wrap.appendChild(el('h3',null,'Seu deck'));
  const box=el('div','decks');
  S.decks.forEach((d,i)=>{
    const v=CM.validateDeck(d.cards);
    const b=el('button','dk'+(i===B.d1?' on':'')); b.type='button'; b.disabled=!v.ok||ON.state!=='idle';
    b.appendChild(el('b',null,d.name));
    if(v.ok){ const f=el('div','faces'); d.cards.forEach(k=>f.appendChild(img(k,null,30))); b.appendChild(f); }
    else b.appendChild(el('small',null,d.cards.length?'Deck incompleto':'Vazio'));
    b.onclick=()=>{ B.d1=i; renderBMenu(); };
    box.appendChild(b);
  });
  wrap.appendChild(box); return wrap;
}
function onlinePanel(){
  const box=el('div'); box.appendChild(el('h3',null,'Online'));
  const nk=el('input','txt'); nk.maxLength=14; nk.value=store.get('nick',''); nk.placeholder='Seu apelido'; nk.setAttribute('aria-label','Seu apelido');
  nk.oninput=()=>store.set('nick',clean(nk.value)); box.appendChild(nk);
  if(!NETX.ok()){ box.appendChild(el('p','panelnote','A conexão online não está disponível: a biblioteca de rede não carregou. Verifique a internet e recarregue a página.')); return box; }
  const col=el('div','onl');
  if(ON.state==='idle'){
    const s=el('button','btn hot','🔎 Buscar oponente (até 30 s)'); s.type='button'; s.onclick=doSearch; col.appendChild(s);
    const h=el('button','btn cool','🏠 Criar sala'); h.type='button'; h.onclick=doHost; col.appendChild(h);
    const row=el('div','row'); const inp=el('input','txt'); inp.maxLength=8; inp.placeholder='Código da sala'; inp.autocapitalize='characters'; inp.autocomplete='off'; inp.setAttribute('aria-label','Código da sala'); inp.style.flex='1 1 140px'; inp.style.width='auto';
    const j=el('button','btn go','Entrar'); j.type='button'; j.onclick=()=>doJoin(inp.value);
    row.appendChild(inp); row.appendChild(j); col.appendChild(row);
  } else {
    const st=el('div','panelnote'); ON.statEl=st; col.appendChild(st); paintStatus();
    if(ON.state==='host'&&ON.code){ const c=el('div','code',ON.code); col.appendChild(c); const cp=el('button','btn small','Copiar código'); cp.type='button'; cp.onclick=()=>{ try{ navigator.clipboard.writeText(ON.code).then(()=>toast('Código copiado'),()=>{}); }catch(e){} }; col.appendChild(cp); }
    const cn=el('button','btn','Cancelar'); cn.type='button'; cn.onclick=cancelOnline; col.appendChild(cn);
  }
  if(ON.msg) col.appendChild(el('p','panelnote',ON.msg));
  box.appendChild(col); return box;
}
function paintStatus(){
  if(!ON.statEl) return;
  ON.statEl.textContent=ON.state==='search'?'Procurando oponente… '+ON.secs+' s':ON.state==='host'?(ON.code?'Passe este código ao seu amigo. Aguardando…':'Criando sala…'):'Entrando na sala…';
}
function guardOnline(){ if(!okDeck(B.d1)){ toast('Escolha um deck válido'); return false; } if(!NETX.ok()){ toast('Conexão online indisponível'); return false; } return true; }
function cancelOnline(){ NETX.cancel(); ON.state='idle'; ON.msg=''; ON.code=''; renderBMenu(); }
function doSearch(){
  if(!guardOnline()) return; ON.state='search'; ON.msg=''; ON.secs=30; renderBMenu();
  NETX.find({status:s=>{ ON.secs=s; paintStatus(); },conn:(cn,p,role)=>netStart(cn,p,role),
    err:m=>{ ON.state='idle'; ON.msg=m; renderBMenu(); },
    timeout:()=>{ ON.state='idle'; ON.msg='Nenhum jogador encontrado em 30 s. Tente de novo ou crie uma sala.'; renderBMenu(); }});
}
function doHost(){
  if(!guardOnline()) return; ON.state='host'; ON.msg=''; ON.code=''; renderBMenu();
  NETX.host({code:c=>{ ON.code=c; renderBMenu(); },conn:(cn,p,role)=>netStart(cn,p,role),err:m=>{ ON.state='idle'; ON.msg=m; ON.code=''; renderBMenu(); }});
}
function doJoin(v){
  if(!guardOnline()) return;
  const c=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(c.length<4){ toast('Digite o código da sala'); return; }
  ON.state='join'; ON.msg=''; renderBMenu();
  NETX.join(c,{conn:(cn,p,role)=>netStart(cn,p,role),err:m=>{ ON.state='idle'; ON.msg=m; renderBMenu(); }});
}
function renderBMenu(){
  const root=$('#bm-body'); root.innerHTML='';
  const valid=S.decks.map((d,i)=>i).filter(okDeck);
  if(!okDeck(B.d1)) B.d1=okDeck(S.main)?S.main:(valid[0]||0);
  const seg=el('div','seg');
  [['ai','🤖 Contra a máquina'],['online','🌐 Online']].forEach(m=>{
    const b=el('button','btn'+(B.mode===m[0]?' cool':'')+' small',m[1]); b.type='button'; b.disabled=ON.state!=='idle';
    b.onclick=()=>{ B.mode=m[0]; renderBMenu(); }; seg.appendChild(b);
  });
  root.appendChild(seg);
  if(B.mode==='ai'){
    const ds=el('div','seg'); ds.appendChild(el('b','pt','Dificuldade'));
    ['Fácil','Normal','Difícil'].forEach((n,i)=>{ const b=el('button','btn small'+(B.diff===i?' cool':''),n); b.type='button'; b.onclick=()=>{ B.diff=i; renderBMenu(); }; ds.appendChild(b); });
    root.appendChild(ds);
  }
  const cols=el('div','bmcols'); cols.appendChild(deckList());
  if(B.mode==='online') cols.appendChild(onlinePanel());
  root.appendChild(cols);
  $('#bm-start').hidden=B.mode!=='ai'; $('#bm-start').disabled=!okDeck(B.d1);
  $('#bm-note').textContent=!valid.length?'Nenhum deck válido ainda. Abra o editor para montar um.':(B.mode==='online'?'O online usa conexão direta entre os dois aparelhos (WebRTC). Em redes muito restritas pode não conectar.':'');
}
$('#bm-back').onclick=()=>{ if(ON.state!=='idle') cancelOnline(); renderHome(); show('home'); };
$('#bm-edit').onclick=()=>{ if(ON.state!=='idle') cancelOnline(); edSlot=B.d1; renderEditor(); show('editor'); };
$('#bm-start').onclick=()=>startAI();
