const { chromium } = require('playwright');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details.mgroup:not([open])').forEach(d=>d.open=true),60)});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
const eat=async()=>(await p.$$eval('#eat > li',els=>els.map(l=>(l.querySelector('b,strong')||{}).textContent))).join(' | ');
console.log('BEFORE:',await eat());
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));
await p.click('#meal-d_sk .cogm');await p.click('#med-del');await p.click('#med-del');await p.waitForTimeout(400);
console.log('card gone:',await p.$('#meal-d_sk')===null,'| removed list:',await p.$eval('#rmmeals',e=>e.innerText));
await p.click('#tab-today');await p.waitForTimeout(300);console.log('TODAY:',await eat());
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','days'));await p.waitForTimeout(200);console.log('day rows:',await p.$$eval('#days-ed li.edcol',e=>e.length));
await p.evaluate(()=>goTo('food','shop'));await p.waitForTimeout(200);
await p.reload();await p.waitForTimeout(1000);console.log('after reload TODAY:',await eat());
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>{goTo('settings');document.getElementById('hidden-card').open=true});await p.click('[data-mrestore]');await p.waitForTimeout(400);
await p.click('#tab-today');await p.waitForTimeout(300);console.log('RESTORED:',await eat());
for(const c of ['shifts','shop','prep']){await p.evaluate(()=>goTo('food'));await p.evaluate(c=>goTo('food',c),c);await p.waitForTimeout(150)}
console.log('errors:',errs);await b.close()})();
