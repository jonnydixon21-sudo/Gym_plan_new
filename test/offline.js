// Home-screen install bits: service worker registers, manifest is valid, main build keeps the owner's setup.
// (The service worker is deliberately pass-through, with no caching, so updates are never stuck behind an old copy.)
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8793/index.html');
ok('service worker active',await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return !!r.active}));
await p.waitForTimeout(800);
const m=await p.evaluate(async()=>await (await fetch('manifest.webmanifest')).json());
ok('manifest ok',m.display==='standalone'&&m.icons.length>=2,JSON.stringify([m.display,m.icons.length]));
for(const ic of m.icons){const r=await p.evaluate(async s=>(await fetch(s)).status,ic.src);ok('icon '+ic.src,r===200,r)}
ok('main build keeps owner setup',await p.evaluate(()=>SETUP.startWeight===87.2&&SETUP.about.length>20));
await p.evaluate(()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true));await p.fill('#q-weight','87.2');await p.click('#log-save');await p.waitForTimeout(500);
await p.reload();await p.waitForTimeout(1000);
ok('weight kept after reload',await p.$eval('#q-weight',e=>e.value)==='87.2');
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
