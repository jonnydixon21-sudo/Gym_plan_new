const { chromium } = require('playwright');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.clock.setFixedTime(new Date('2026-11-11T10:00:00'));const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
const eat=async()=>(await p.$$eval('#eat > li',els=>els.map(l=>{const t=l.querySelector('time'),i=l.querySelector('input.tedit');return (i?i.value:(t?t.textContent:''))+' '+(l.querySelector('b,strong')||{}).textContent}))).join(' | ');
console.log('BEFORE:',await eat());
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','days'));await p.waitForTimeout(200);
await p.click('[data-pfood="1"]');await p.fill('#med [data-ma="0"]','100');await p.click('#med-save');await p.waitForTimeout(300);
// move row 1 time and delete row 3 (Skyr & whey), add note row
await p.fill('[data-pt="1"]','11:15');await p.click('[data-prm="3"]');await p.click('#pe-save');await p.waitForTimeout(400);
await p.click('#tab-today');await p.waitForTimeout(400);
console.log('AFTER (no reload):',await eat());
await p.reload();await p.waitForTimeout(1200);
console.log('AFTER reload:',await eat());
console.log('MEALS.d_cr',await p.evaluate(()=>MEALS.d_cr.items.map(i=>i.join(':'))+' '+MEALS.d_cr.t));
// now set a per-day time override on Today and then change plan time
await p.fill('input.tedit[data-tkey="d_cr"]','12:45');await p.dispatchEvent('input.tedit[data-tkey="d_cr"]','change');await p.waitForTimeout(400);
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','days'));await p.waitForTimeout(200);await p.fill('[data-pt="1"]','10:00');await p.click('#pe-save');await p.waitForTimeout(400);
await p.click('#tab-today');await p.waitForTimeout(400);
console.log('WITH TIME OVERRIDE:',await eat());
console.log('errors:',errs);await b.close()})();
