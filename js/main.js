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


function iniciar(){
  renderHome(); show('home'); initRemote();
}
(function carregar(){
  const bar=$('#lb-i'), txt=$('#lb-t'), box=$('#loading');
  SPR.load(p=>{ bar.style.width=Math.round(p*100)+'%'; txt.textContent='Carregando a arte… '+Math.round(p*100)+'%'; })
    .then(()=>{ box.hidden=true; iniciar(); })
    .catch(()=>{ txt.textContent='Não foi possível carregar a arte. Abra o jogo pelo link publicado (GitHub Pages) ou por um servidor local; abrir o arquivo direto não funciona.'; });
})();
