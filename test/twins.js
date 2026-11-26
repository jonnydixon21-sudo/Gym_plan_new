const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details.mgroup:not([open])').forEach(d=>d.open=true),60)});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));
console.log('used labels:',await p.$$eval('#plans .meal',e=>e.slice(0,8).map(x=>x.querySelector('strong').textContent+' -> '+x.querySelector('.usedin').textContent)));
// edit the day-shift "Chicken & potatoes" (d_cp)
await p.click('#meal-d_cp .cogm');await p.waitForTimeout(200);
console.log('header:',await p.$eval('#med .note b',e=>e.textContent),'| twins:',await p.$$eval('#med [data-mtwin]',e=>e.length));
await p.fill('#med [data-ma="0"]','250');await p.screenshot({path:SH+'twins.png',fullPage:true});
await p.click('#med-save');await p.waitForTimeout(400);
console.log('d_cp',await p.evaluate(()=>MEALS.d_cp.items[0]+''),'n_cp',await p.evaluate(()=>MEALS.n_cp.items[0]+''));
await p.click('#meal-d_cp .cogm');await p.check('#med [data-mtwin="n_cp"]');await p.fill('#med [data-ma="0"]','260');await p.click('#med-save');await p.waitForTimeout(400);
console.log('after copy: d_cp',await p.evaluate(()=>MEALS.d_cp.items[0]+''),'n_cp',await p.evaluate(()=>MEALS.n_cp.items[0]+''),'f_cp2',await p.evaluate(()=>MEALS.f_cp2.items[0]+''));
console.log('errors:',errs);await b.close()})();
