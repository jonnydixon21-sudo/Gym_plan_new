const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
const days=await p.evaluate(()=>[...Array(10)].map((_,i)=>addDays(TODAY,i)));
const info=d=>p.evaluate(d=>{const i=dayInfo(d);return {slot:i.slot,run:i.run||null,at:i.runAt||null,kind:i.runKind||null,rows:rowsFor(i).map(r=>r[0]+' '+(MEALS[r[1]]?MEALS[r[1]].m:(r[2]||r[1])))}},d);
const status=()=>p.$eval('#once-status',e=>e.innerText.replace(/\n+/g,' | '));
// find a day-shift day in the next 8 with no usual run (the user's example)
let target=null;for(const d of days.slice(1,8)){const i=await info(d);if(i.slot==='day'&&!i.run){target=d;break}}
console.log('   target day shift:',target);
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','shifts'));await p.evaluate(d=>goPlan(d),target);await p.waitForTimeout(250);
ok('nothing changed at first',/Nothing changed/.test(await status()));
await p.click('#once-run summary');await p.selectOption('#on-kind','easy');await p.fill('#on-at','17:30');await p.fill('#on-label','Easy 5K');await p.click('#on-save');await p.waitForTimeout(400);
let i=await info(target);console.log('   status:',await status());
ok('run added for that date',i.run==='Easy 5K'&&i.at==='17:30'&&i.kind==='easy'&&i.rows.includes('17:30 Easy 5K'));
ok('timeline shows it',/Easy 5K/.test(await p.$eval('#timeline',e=>e.innerText)));
await p.locator('#rota-once').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'once.png'});
const same=await info(days[days.indexOf(target)+8>9?9:days.indexOf(target)+8]||target);
const next=await p.evaluate(d=>{const x=addDays(d,8),i=dayInfo(x);return {slot:i.slot,run:i.run||null}},target);
ok('same shift 8 days later has no run (not sticky)',next.slot==='day'&&next.run===null,JSON.stringify(next));
ok('run days pattern untouched',await p.evaluate(()=>PATTERN.filter(x=>x.run).length)===3);
// Today tab on that date
await p.click('#tab-today');for(let k=0;k<days.indexOf(target);k++){await p.click('#d-next');await p.waitForTimeout(150)}
const eat=await p.$$eval('#eat > li',els=>els.map(l=>{const t=l.querySelector('input.tedit');return (t?t.value:'')+' '+(l.querySelector('b,strong')||{}).textContent}));
console.log('   today-view rows:',eat.join(' | '));
ok('Today view for that date shows the run',eat.includes('17:30 Easy 5K'));
for(let k=0;k<days.indexOf(target);k++){await p.click('#d-prev');await p.waitForTimeout(100)}
// Run tab
await p.evaluate(()=>goTo('run'));ok('Run tab lists it',(await p.$$eval('#run-next li',e=>e.map(x=>x.innerText))).some(x=>/Easy 5K/.test(x)));
// one-off on TODAY shows on Today and log form picks the type
await p.evaluate(()=>goTo('food'));await p.evaluate(d=>goPlan(d),days[0]);await p.click('#once-run summary');await p.selectOption('#on-kind','speed');await p.fill('#on-at','20:30');await p.fill('#on-label','');await p.click('#on-save');await p.waitForTimeout(400);
await p.click('#tab-today');await p.waitForTimeout(200);
ok('today shows a run added for today',/Speed run/.test(await p.$eval('#eat',e=>e.innerText)));
await p.click('[data-tlrun]');await p.waitForTimeout(200);ok('log form opens as Speed',(await p.$eval('[data-rfk="speed"]',e=>e.getAttribute('aria-pressed')))==='true');await p.click('#rf-cancel');
// skip a usual run on a day that has one
let withRun=null;for(const d of days.slice(1,8)){const x=await p.evaluate(d=>!!dayInfo(d).runUsual,d);if(x){withRun=d;break}}
await p.evaluate(()=>goTo('food'));await p.evaluate(d=>goPlan(d),withRun);await p.waitForTimeout(200);console.log('   usual-run day',withRun,'status:',await status());
await p.click('[data-once="runskip"]');await p.waitForTimeout(300);ok('usual run skipped for that date',(await info(withRun)).run===null&&/skipped/.test(await status()));
await p.click('[data-once="runreset"]');await p.waitForTimeout(300);ok('put back',(await info(withRun)).run!==null);
// add note + meal, skip a meal
await p.evaluate(d=>goPlan(d),target);await p.waitForTimeout(200);
await p.click('#once-add summary');await p.selectOption('#oa-type','info');await p.fill('#oa-txt','Physio');await p.fill('#oa-at','08:15');await p.click('#oa-save');await p.waitForTimeout(300);
await p.click('#once-add summary');await p.selectOption('#oa-type','meal');const mid=await p.$eval('#oa-meal',e=>e.value);await p.fill('#oa-at','16:00');await p.click('#oa-save');await p.waitForTimeout(300);
i=await info(target);const mname=await p.evaluate(id=>MEALS[id].m,mid);console.log('   rows now:',i.rows.join(' | '));
ok('note and meal added in time order',i.rows.includes('08:15 Physio')&&i.rows.includes('16:00 '+mname)&&i.rows.indexOf('08:15 Physio')<i.rows.indexOf('16:00 '+mname));
ok('shop counts the one-off meal',await p.evaluate(([d,id])=>{const n=dayNeeds(d);return MEALS[id].items.every(it=>n[it[0]]>0)},[target,mid]));
await p.click('#once-skip summary');const sk=await p.$eval('#os-row',e=>e.value);await p.click('#os-save');await p.waitForTimeout(300);
i=await info(target);
const skName=await p.evaluate(k=>MEALS[k.split('|')[1]].m,sk);ok('skipped row gone',!i.rows.includes(sk.split('|')[0]+' '+skName),sk);
ok('template still has it',await p.evaluate(k=>SCHED.day.T.rows.some(r=>r[0]+'|'+r[1]===k)||SCHED.day.R.rows.some(r=>r[0]+'|'+r[1]===k),sk));
console.log('   status:',await status());
// persist
await p.reload();await p.waitForTimeout(1000);i=await info(target);
ok('one-offs survive a reload',i.run==='Easy 5K'&&i.rows.includes('08:15 Physio')&&!i.rows.includes(sk.split('|')[0]+' '+skName));
// undo all
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','shifts'));await p.evaluate(d=>goPlan(d),target);await p.waitForTimeout(200);
for(let n=0;n<6;n++){const bt=await p.$('#once-status button');if(!bt)break;await bt.click();await p.waitForTimeout(250)}
ok('everything can be undone',/Nothing changed/.test(await status())&&await p.evaluate(d=>!D.days[d],target),await status());
console.log('errors:',errs,'| FAILS:',fails);await b.close();process.exit(fails||errs.length?1:0)})();
