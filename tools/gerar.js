/* Gera todos os sprites (WebP) e o manifest.json em ../assets/sprites.
   Uso:  npm i playwright  &&  npx playwright install chromium  &&  node tools/gerar.js
   Opcional: node tools/gerar.js cavaleiro golem   (gera só essas peças e atualiza o manifest) */
const path=require('path'), fs=require('fs');
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ console.error('Instale o Playwright: npm i playwright && npx playwright install chromium'); process.exit(1); }
const OUT=path.join(__dirname,'..','assets','sprites');
const save=(rel,dataUrl)=>{ const f=path.join(OUT,rel); fs.mkdirSync(path.dirname(f),{recursive:true}); const b=Buffer.from(dataUrl.split(',')[1],'base64'); fs.writeFileSync(f,b); return b.length; };
const UNITS=['cavaleiro','soldado','berserker','ladino','arqueira','mago','necromante','druida','clerigo','bardo','engenheiro','esqueleto','lanceiro','bombardeiro','fada','golem','grifo','morcegos','gargula','wyvern','ariete'];
const STRUCTS=['canhao','balista','torre_arcana','muralha','altar','quartel','heart'];
const SPELLS=['espinhos','runa','selo_gelo','rede','tempestade','bola_fogo','raio_arcano','bencao','muralha_gelo','silencio','furia'];
const THEMES=['floresta','ruinas','deserto','montanha','lava','ceu'];
(async()=>{
  const only=process.argv.slice(2);
  const want=k=>!only.length||only.includes(k);
  const browser=await chromium.launch(); const page=await browser.newPage();
  page.on('pageerror',e=>console.error('erro:',e.message));
  await page.goto('file://'+path.join(__dirname,'gen.html'));
  const mf=path.join(OUT,'manifest.json');
  let man={versao:3,units:{},structs:{},scenery:{},cards:{}};
  if(only.length&&fs.existsSync(mf)){ try{ man=JSON.parse(fs.readFileSync(mf,'utf8')); }catch(e){} }
  let total=0;
  for(const k of UNITS) if(want(k)){ const r=await page.evaluate(k=>GEN.unit(k),k); total+=save('units/'+k+'.webp',r.img); if(r.mask) total+=save('units/'+k+'.mask.webp',r.mask); man.units[k]=Object.assign({img:'units/'+k+'.webp',mask:r.mask?'units/'+k+'.mask.webp':null},r.meta); console.log('tropa',k,(r.img.length*.75/1024|0)+'KB'); }
  for(const k of STRUCTS) if(want(k)){ const r=await page.evaluate(k=>GEN.struct(k),k); total+=save('structs/'+k+'.webp',r.img); if(r.mask) total+=save('structs/'+k+'.mask.webp',r.mask); man.structs[k]=Object.assign({img:'structs/'+k+'.webp',mask:r.mask?'structs/'+k+'.mask.webp':null},r.meta); console.log('construção',k); }
  for(const k of [...UNITS,...STRUCTS.filter(s=>s!=='heart'),...SPELLS]) if(want(k)){ const u=await page.evaluate(k=>GEN.card(k),k); total+=save('cards/'+k+'.webp',u); man.cards[k]='cards/'+k+'.webp'; }
  for(const t of THEMES) if(want(t)){ const r=await page.evaluate(t=>GEN.scenery(t),t); total+=save('scenery/'+t+'.webp',r.img); man.scenery[t]=Object.assign({img:'scenery/'+t+'.webp'},r.meta); console.log('cenário',t); }
  fs.writeFileSync(mf,JSON.stringify(man));
  console.log('total gravado:',(total/1048576).toFixed(2),'MB');
  await browser.close();
})();
