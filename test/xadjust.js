// "+" under Today's plan; meals and foods logged as extras can have their amounts adjusted.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.checkVisibility()},sel);
ok('both panels tucked away',!(await vis('#xadd'))&&!(await vis('#tadd'))&&await vis('#eat-plus'));
await p.click('#eat-plus');await p.waitForTimeout(150);ok('+ shows two choices',await vis('[data-eatopen="extra"]')&&await vis('[data-eatopen="tadd"]'));
await p.locator('#eat-plus').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'eatplus.png'});
await p.click('[data-eatopen="tadd"]');await p.waitForTimeout(150);ok('Add to today opens',await p.evaluate(()=>document.getElementById('tadd').open)&&await vis('#ta-save')&&!(await vis('#eat-pmenu')));
ok('+ stays an x while the panel is open',await p.$eval('#eat-plus',e=>e.getAttribute('aria-expanded'))==='true');
await p.click('#eat-plus');await p.waitForTimeout(150);ok('one press closes the panel and turns back to +',!(await vis('#tadd'))&&!(await vis('#eat-pmenu'))&&await p.$eval('#eat-plus',e=>e.getAttribute('aria-expanded'))==='false');
ok('Log a run is in the menu, not under the plan',await p.evaluate(()=>!document.querySelector('#train-log [data-tlrun]')&&!!document.querySelector('#eat-pmenu [data-tlrun]')));
await p.click('#eat-plus');await p.click('[data-eatopen="extra"]');await p.waitForTimeout(150);ok('Ate something opens, other closes',await vis('#pm-add')&&!(await p.evaluate(()=>document.getElementById('tadd').open)));
// meal ×1.5
const id=await p.evaluate(()=>{const s=document.getElementById('pm-meal');return [...s.options].map(o=>o.value).find(v=>v&&MEALS[v]&&MEALS[v].items.filter(([k,a])=>a>0&&pfNut(k)).length>=2)});
await p.selectOption('#pm-meal',id);await p.fill('#pm-qty','1.5');await p.click('#pm-add');await p.waitForTimeout(400);
let x=await p.evaluate(()=>D.food[VIEW].extras.slice(-1)[0]);
ok('meal logged with its foods',Array.isArray(x.items)&&x.items.length>=2&&x.meal===await Promise.resolve(id),JSON.stringify(x));
const k0=x.kcal;
ok('foods add up to the same as the meal',await p.evaluate(x=>{const m=xItemsMac(x.items,x.meal);return Math.abs(m.kcal-x.kcal)<=3},x));
await p.click('[data-xadj="0"]');await p.waitForTimeout(200);ok('Adjust opens amounts',await vis('[data-xadjv="0"]'));
await p.locator('[data-xadjv="0"]').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'xadjust.png'});
const a0=+(await p.$eval('[data-xadjv="0"]',e=>e.value));await p.fill('[data-xadjv="0"]',String(Math.round(a0*2)));await p.fill('[data-xadjv="1"]','0');await p.waitForTimeout(100);
const live=await p.$eval('#xadj-mac',e=>e.textContent);
await p.click('[data-xadjsave="0"]');await p.waitForTimeout(400);
x=await p.evaluate(()=>D.food[VIEW].extras.slice(-1)[0]);
ok('amounts saved, zero dropped',x.items.length>=1&&Math.abs(x.items[0][1]-Math.round(a0*2))<0.01&&!x.items.some(i=>i[1]===0),JSON.stringify(x.items));
ok('macros recalculated',x.kcal!==k0&&live.startsWith(String(x.kcal)),k0+' -> '+x.kcal+' | '+live);
ok('named as adjusted',/\(adjusted\)$/.test(x.name),x.name);
ok('day totals include it',await p.evaluate(k=>eatenTotals(VIEW).kcal>=k,x.kcal));
// food extra
await p.evaluate(()=>{const s=document.getElementById('pf-food');s.value=[...s.options].map(o=>o.value).find(v=>v&&F[v]&&F[v].u==='g');s.dispatchEvent(new Event('change'))});
await p.fill('#pf-amt','100');await p.click('#pf-add');await p.waitForTimeout(400);
await p.click('[data-xadj="1"]');await p.fill('[data-xadjv="0"]','250');await p.click('[data-xadjsave="1"]');await p.waitForTimeout(400);
x=await p.evaluate(()=>D.food[VIEW].extras[1]);ok('single food amount adjusts and renames',x.items[0][1]===250&&/250g/.test(x.name),x.name);
// recent re-add keeps foods
await p.evaluate(()=>renderRecent());await p.click('[data-xrec="0"]');await p.waitForTimeout(400);
ok('re-added from recent is adjustable',await p.evaluate(()=>{const e=D.food[VIEW].extras.slice(-1)[0];return Array.isArray(e.items)&&e.items.length>0}));
// typed-in extras have no Adjust
await p.fill('#x-name','Protein bar');await p.fill('#x-kcal','200');await p.click('#x-add');await p.waitForTimeout(400);
ok('typed-in item has no Adjust',await p.evaluate(()=>{const n=D.food[VIEW].extras.length-1;return !document.querySelector(`[data-xadj="${n}"]`)}));
await p.reload();await p.waitForTimeout(1000);ok('survives reload',await p.evaluate(()=>D.food[VIEW].extras.length===4&&/\(adjusted\)/.test(D.food[VIEW].extras[0].name)));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
