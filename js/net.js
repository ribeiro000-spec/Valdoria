/* Rede: sala por código e busca de oponente (PeerJS / WebRTC) */
'use strict';
/* ---------- rede: PeerJS (sala por código e busca de oponente) ---------- */
function clean(s){ return String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,14); }
const NETX=(function(){
  const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
  const SLOTS=8, PRE='vald-mm-', ROOM='vald-r-';
  const CONN={reliable:true,serialization:'json'};
  const ok=()=>typeof window.Peer==='function';
  const mk=id=>{ const o={debug:0,config:{iceServers:ICE}}; return id?new window.Peer(id,o):new window.Peer(undefined,o); };
  let cur=null;
  function clearT(s){ (s.timers||[]).forEach(t=>{ clearTimeout(t); clearInterval(t); }); s.timers=[]; }
  function cancel(){ if(!cur) return; const c=cur; cur=null; c.dead=true; clearT(c); try{ if(c.peer) c.peer.destroy(); }catch(e){} }
  function code(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; const b=new Uint32Array(5); try{ crypto.getRandomValues(b); }catch(e){ for(let i=0;i<5;i++) b[i]=Math.floor(Math.random()*1e9); } for(let i=0;i<5;i++) s+=A[b[i]%A.length]; return s; }
  const netErr=e=>(e&&(e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='socket-closed'))?'Servidor de conexão indisponível. Tente de novo.':'Erro de conexão'+(e&&e.type?' ('+e.type+')':'');
  function host(cb){
    cancel(); const sess=cur={timers:[]}; let tries=0;
    const open=()=>{
      const c=code(), p=mk(ROOM+c); sess.peer=p;
      p.on('open',()=>{ if(!sess.dead) cb.code(c); });
      p.on('connection',cn=>{
        if(sess.dead) return;
        if(sess.got){ try{ cn.close(); }catch(e){} return; }
        sess.got=true; cn.on('open',()=>{ if(sess.dead) return; cur=null; clearT(sess); cb.conn(cn,p,'host'); });
      });
      p.on('error',e=>{ if(sess.dead) return; if(e.type==='unavailable-id'&&tries++<4){ try{ p.destroy(); }catch(_){} open(); } else { cb.err(netErr(e)); cancel(); } });
    };
    open();
  }
  function join(c,cb){
    cancel(); const sess=cur={timers:[]}; const p=mk(); sess.peer=p;
    sess.timers.push(setTimeout(()=>{ if(!sess.dead&&!sess.ok){ cb.err('Sala não encontrada (tempo esgotado).'); cancel(); } },15000));
    p.on('open',()=>{
      if(sess.dead) return; const cn=p.connect(ROOM+c,CONN);
      cn.on('open',()=>{ if(sess.dead) return; sess.ok=true; cur=null; clearT(sess); cb.conn(cn,p,'guest'); });
      cn.on('error',()=>{ if(!sess.dead&&!sess.ok){ cb.err('Falha ao conectar na sala.'); cancel(); } });
    });
    p.on('error',e=>{ if(sess.dead||sess.ok) return; cb.err(e.type==='peer-unavailable'?'Sala não encontrada. Confira o código.':netErr(e)); cancel(); });
  }
  function find(cb){
    cancel(); const sess=cur={timers:[]}; const t0=Date.now();
    let matched=false, regTries=0;
    const order=Array.from({length:SLOTS},(_,i)=>i).sort(()=>Math.random()-.5);
    const fin=(cn,p,role)=>{ if(matched||sess.dead) return; matched=true; cur=null; clearT(sess); cb.conn(cn,p,role); };
    function wire(p,slot){
      p.on('connection',cn=>{ cn.on('data',m=>{ if(m&&m.t==='mm'){ if(matched||sess.dead){ try{ cn.send({t:'busy'}); }catch(e){} setTimeout(()=>{ try{ cn.close(); }catch(e){} },300); return; } try{ cn.send({t:'mm-ok'}); }catch(e){} fin(cn,p,'host'); } }); });
      p.on('error',()=>{});
      const scan=setInterval(()=>{
        if(matched||sess.dead) return;
        const cands=order.filter(s=>s<slot).sort(()=>Math.random()-.5).slice(0,2); if(!cands.length) return;
        cands.forEach(s=>{
          let cn; try{ cn=p.connect(PRE+s,CONN); }catch(e){ return; }
          const tt=setTimeout(()=>{ try{ if(!matched) cn.close(); }catch(e){} },3000); sess.timers.push(tt);
          cn.on('open',()=>{ try{ cn.send({t:'mm'}); }catch(e){} });
          cn.on('data',m=>{ if(m&&m.t==='mm-ok') fin(cn,p,'guest'); else if(m&&m.t==='busy'){ try{ cn.close(); }catch(e){} } });
        });
      },700); sess.timers.push(scan);
    }
    function reg(){
      if(sess.dead) return;
      if(regTries>=order.length){ const p=mk(); sess.peer=p; wire(p,Infinity); return; }
      const slot=order[regTries++], p=mk(PRE+slot); sess.peer=p; let opened=false;
      p.on('open',()=>{ if(sess.dead){ try{ p.destroy(); }catch(_){} return; } opened=true; wire(p,slot); });
      p.on('error',e=>{ if(sess.dead||opened) return; if(e.type==='unavailable-id'){ try{ p.destroy(); }catch(_){} reg(); } else { cb.err(netErr(e)); cancel(); } });
    }
    sess.timers.push(setInterval(()=>cb.status(Math.max(0,30-Math.floor((Date.now()-t0)/1000))),500));
    sess.timers.push(setTimeout(()=>{ if(!matched&&!sess.dead){ cancel(); cb.timeout(); } },30000));
    reg();
  }
  return {ok,host,join,find,cancel,code};
})();
