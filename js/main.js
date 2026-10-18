/* Tela cheia e inicialização (espera os sprites carregarem) */
'use strict';
/* ---------- tela cheia ---------- */
const inFS=()=>document.fullscreenElement||document.webkitFullscreenElement;
function toggleFS(){
  const d=document, root=d.documentElement;
  if(inFS()){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); return; }
  const f=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!f){ toast('No iPhone: toque em Compartilhar › Adicionar à Tela de Início para jogar sem barras'); return; }
  Promise.resolve(f.call(root,{navigationUI:'hide'})).then(()=>{ try{ screen.orientation.lock('portrait').catch(()=>{}); }catch(e){} }).catch(()=>toast('Seu navegador não permitiu a tela cheia'));
}
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{ $('#fs-home').textContent=inFS()?'⤢ Sair da tela cheia':'⛶ Tela cheia'; refit(); }));
$('#fs-home').onclick=toggleFS; $('#g-fs').onclick=toggleFS;


document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button'); if(b&&!b.disabled) AUD.sfx(b.classList.contains('hc')?'select':'click',{vol:.7,rate:1}); },true);
function iconeSom(){ const p=AUD.pref, i=(p.m||p.s)?'🔊':'🔇'; ['#snd-home','#g-snd'].forEach(s=>{ const b=$(s); if(b) b.textContent=s==='#snd-home'?i+' Som':i; }); }
function abrirSom(){
  const box=el('div'); box.appendChild(el('h3',null,'Som'));
  const linha=(rot,k,kv)=>{ const w=el('div'); w.style.margin='12px 0';
    const top=el('div','row'); top.style.justifyContent='space-between'; top.appendChild(el('b',null,rot));
    const t=el('button','btn small',AUD.pref[k]?'Ligado':'Desligado'); t.type='button'; t.onclick=()=>{ AUD.set(k,!AUD.pref[k]); t.textContent=AUD.pref[k]?'Ligado':'Desligado'; iconeSom(); }; top.appendChild(t);
    const r=el('input'); r.type='range'; r.min=0; r.max=100; r.value=Math.round(AUD.pref[kv]*100); r.style.width='100%'; r.setAttribute('aria-label',rot+' volume'); r.oninput=()=>{ AUD.set(kv,r.value/100); }; r.onchange=()=>{ if(k==='s') AUD.sfx('select',{rate:1}); };
    w.appendChild(top); w.appendChild(r); return w; };
  box.appendChild(linha('🎵 Música','m','mv')); box.appendChild(linha('🔊 Efeitos','s','sv'));
  const row=el('div','row'); const b=el('button','btn cool','Fechar'); b.type='button'; b.onclick=closeModal; row.appendChild(b); box.appendChild(row); openModal(box);
}
$('#snd-home').onclick=abrirSom; $('#g-snd').onclick=abrirSom; iconeSom();
function iniciar(){
  renderHome(); show('home'); initRemote();
}
(function carregar(){
  const bar=$('#lb-i'), txt=$('#lb-t'), box=$('#loading');
  SPR.load(p=>{ bar.style.width=Math.round(p*100)+'%'; txt.textContent='Carregando a arte… '+Math.round(p*100)+'%'; })
    .then(()=>{ box.hidden=true; iniciar(); })
    .catch(()=>{ txt.textContent='Não foi possível carregar a arte. Abra o jogo pelo link publicado (GitHub Pages) ou por um servidor local; abrir o arquivo direto não funciona.'; });
})();
