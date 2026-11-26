const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','days'));await p.waitForTimeout(300);
await p.screenshot({path:SH+'days1.png',fullPage:true});
console.log('targets:',await p.$$eval('[data-tg]',e=>e.map(x=>x.dataset.tg+'='+x.value).join(' ')));
// day shift training rows
console.log('rows:',await p.$$eval('#days-ed li.edcol',e=>e.length));
// edit meal via Foods button on first meal row
await p.click('[data-pfood]');await p.waitForTimeout(200);
console.log('meal items:',await p.$$eval('#med [data-ma]',e=>e.map(x=>x.value)),await p.$eval('#med-tot',e=>e.textContent));
await p.screenshot({path:SH+'med.png'});
await p.fill('#med [data-ma="0"]','300');
console.log('after change:',await p.$eval('#med-tot',e=>e.textContent));
await p.selectOption('#med-addsel','rasp');await p.click('#med-add');
await p.click('#med-save');await p.waitForTimeout(400);
console.log('overlay hidden:',await p.$eval('#med',e=>e.hidden));
console.log('meal now:',await p.evaluate(()=>MEALS.d_mw.items+' | '+MEALS.d_mw.t));
// custom food
await p.click('[data-pfood]');await p.click('#med-cancel');
// change row time and add row, save day
await p.fill('[data-pt="1"]','11:00');await p.click('#pe-add');await p.selectOption('[data-pk="'+(await p.$$eval('#days-ed li.edcol',e=>e.length)-1)+'"]','info');
await p.fill('[data-px="'+(await p.$$eval('#days-ed li.edcol',e=>e.length)-1)+'"]','Check kit bag');
await p.click('#pe-save');await p.waitForTimeout(300);
console.log('sched day.T:',await p.evaluate(()=>SCHED.day.T.rows.map(r=>r.join('|')).join(' ; ')));
// targets: change kcal, carbs fill
await p.evaluate(()=>goTo('targets'));await p.fill('[data-tg="T:kcal"]','3200');console.log('carbs after kcal 3200:',await p.$eval('[data-tg="T:c"]',e=>e.value));
await p.click('#tg-fit');await p.waitForTimeout(500);
console.log('PLAN.T:',await p.evaluate(()=>[PLAN.T.kcal,PLAN.T.p,PLAN.T.c,PLAN.T.f].join('/')));
console.log('day totals vs target:',await p.evaluate(()=>SLOTS.map(([s])=>{let c=0;SCHED[s].T.rows.forEach(r=>{if(MEALS[r[1]])c+=mealMac(r[1]).kcal});return s+':'+c}).join(' ')));
await p.screenshot({path:SH+'days2.png',fullPage:true});
// persistence
await p.reload();await p.waitForTimeout(900);
console.log('after reload PLAN.T.kcal',await p.evaluate(()=>PLAN.T.kcal),'d_mw',await p.evaluate(()=>MEALS.d_mw.items[0]+''),'day rows',await p.evaluate(()=>SCHED.day.T.rows.length));
// Plan tab still renders everything
await p.evaluate(()=>goTo('food'));for(const c of ['shifts','shop','meals','prep']){await p.evaluate(c=>goTo('food',c),c);await p.waitForTimeout(150)}
console.log('meal cogs:',await p.$$eval('.cogm',e=>e.length));
// reset
await p.evaluate(()=>goTo('targets'));await p.click('#tg-reset');await p.waitForTimeout(300);console.log('reset kcal',await p.evaluate(()=>PLAN.T.kcal));
console.log('errors:',errs);await b.close()})();
