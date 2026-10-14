/* Gera todos os sprites (WebP) e o manifest.json em ../assets/sprites.
   Uso:  npm i playwright  &&  npx playwright install chromium  &&  node tools/gerar.js */
const path=require('path'), fs=require('fs');
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright')); }
const OUT=path.join(__dirname,'..','assets','sprites');
const save=(rel,dataUrl)=>{ const f=path.join(OUT,rel); fs.mkdirSync(path.dirname(f),{recursive:true}); const b=Buffer.from(dataUrl.split(',')[1],'base64'); fs.writeFileSync(f,b); return b.length; };
(async()=>{
  const browser=await chromium.launch(); const page=await browser.newPage();
  page.on('pageerror',e=>console.error('erro:',e.message));
  await page.goto('file://'+path.join(__dirname,'gen.html'));
  const lists=await page.evaluate(()=>({units:[...Object.keys(ART.CH),...Object.keys(ART.CR)],structs:['canhao','balista','torre_arcana','muralha','altar','quartel','heart'],
    cards:[...new Set([...Object.keys(ART.CH),...Object.keys(ART.CR),...Object.keys(ART.B).filter(k=>k!=='heart'),...Object.keys(ART.SP)])],themes:['floresta','ruinas','montanha','lava','ceu','deserto']}));
  const man={versao:1,units:{},structs:{},scenery:{},cards:{}}; let total=0;
  for(const k of lists.units){ const r=await page.evaluate(k=>GEN.unit(k),k); total+=save('units/'+k+'.webp',r.img)+save('units/'+k+'.mask.webp',r.mask); man.units[k]=Object.assign({img:'units/'+k+'.webp',mask:'units/'+k+'.mask.webp'},r.meta); console.log('unidade',k); }
  for(const k of lists.structs){ const r=await page.evaluate(k=>GEN.struct(k),k); total+=save('structs/'+k+'.webp',r.img)+save('structs/'+k+'.mask.webp',r.mask); man.structs[k]=Object.assign({img:'structs/'+k+'.webp',mask:'structs/'+k+'.mask.webp'},r.meta); console.log('construção',k); }
  for(const k of lists.cards){ const u=await page.evaluate(k=>GEN.card(k),k); total+=save('cards/'+k+'.webp',u); man.cards[k]='cards/'+k+'.webp'; }
  for(const t of lists.themes){ const r=await page.evaluate(t=>GEN.scenery(t),t); total+=save('scenery/'+t+'.webp',r.img); man.scenery[t]=Object.assign({img:'scenery/'+t+'.webp'},r.meta); console.log('cenário',t); }
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man));
  console.log('total de imagens:',(total/1048576).toFixed(2),'MB');
  await browser.close();
})();
