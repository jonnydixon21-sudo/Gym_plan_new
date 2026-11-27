const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8795/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>{L.profile={name:'Test',mode:'cut',startDate:TODAY,startWeight:90,goalWeight:85,units:{w:'kg',l:'in'}};L.trialMealsFixed=1;saveL()});await p.reload();await p.waitForTimeout(1200);
// a meal with a different portion on one day plan, so it has a hidden per-day version
const d=await p.evaluate(async()=>{const P=planDoc();P.meals={...P.meals,t_st:{m:"Test steak",items:[["steak",200],["pot",200]]},t_ch:{m:"Test chicken",items:[["chicken",200],["basmati",60]]}};P.sched={...P.sched};
  SLOTS.forEach(([s])=>["T","R"].forEach(t=>{const sc=SCHED[s][t];P.sched[s+":"+t]={rows:[...dcl(sc.rows).filter(r=>!MEALS[r[1]]),["12:00","t_ch"],["19:00","t_st"]],sum:sc.sum,note:sc.note||"",wake:WAKE[s][t]}}));
  P.por={"off:T":{t_st:{amt:{steak:260,pot:240}}}};P.oneMeal=true;D.plan=P;await savePlan();return TODAY});
ok('steak has a per-day version',await p.evaluate(()=>Object.values(MEALS).some(m=>m.of==="t_st")));
const optsCount=(html,name)=>(html.match(new RegExp('>'+name+' ·','g'))||[]).length;
ok('plan-your-days dropdown: steak once',await p.evaluate(()=>{const v=Object.keys(MEALS).find(k=>MEALS[k].of==="t_st");return (mealOptsHtml(v).match(/>Test steak ·/g)||[]).length})===1);
ok('per-day version selects its meal',await p.evaluate(()=>{const v=Object.keys(MEALS).find(k=>MEALS[k].of==="t_st");return /value="t_st" selected/.test(mealOptsHtml(v))}));
await p.evaluate(()=>show('schedule','shifts'));await p.waitForTimeout(500);
ok('add-for-this-day list has no hidden versions',await p.evaluate(()=>[...document.querySelectorAll('#oa-meal option')].every(o=>!MEALS[o.value]||!MEALS[o.value].of)));
// change chicken to steak on the selected date only
const sel=await p.evaluate(()=>ROTA_SEL);
const key=await p.$eval('[data-rchg*="t_ch"]',e=>e.dataset.rchg);
await p.click(`[data-rchg="${key}"]`);await p.waitForTimeout(300);
ok('change box opens',await p.isVisible(`[data-rchgsel="${key}"]`));
ok('change list has each meal once',await p.$eval(`[data-rchgsel="${key}"]`,s=>{const n=[...s.options].map(o=>o.textContent.split(' · ')[0]);return n.length===new Set(n).size}));
await p.screenshot({path:SH+'schedchg.png'});
await p.selectOption(`[data-rchgsel="${key}"]`,'t_st');await p.waitForTimeout(500);
const rows=await p.evaluate(d=>rowsFor(dayInfo(d)).filter(r=>MEALS[r[1]]).map(r=>r[0]+' '+MEALS[r[1]].m),sel);
ok('that date now has steak at 12:00',rows.includes('12:00 Test steak')&&!rows.includes('12:00 Test chicken'),rows.join(', '));
const other=await p.evaluate(d=>{const n=addDays(d,1);return rowsFor(dayInfo(n)).filter(r=>MEALS[r[1]]).map(r=>r[0]+' '+MEALS[r[1]].m)},sel);
ok('next day unchanged',other.includes('12:00 Test chicken'),other.join(', '));
ok('plan unchanged',await p.evaluate(()=>SLOTS.every(([s])=>["T","R"].every(t=>SCHED[s][t].rows.some(r=>r[0]==="12:00"&&(r[1]==="t_ch"||(MEALS[r[1]]&&MEALS[r[1]].of==="t_ch")))))));
// change it again: replaces the added one rather than stacking
const key2=await p.$eval('[data-rchg^="12:00|t_st"]',e=>e.dataset.rchg);await p.click(`[data-rchg="${key2}"]`);await p.waitForTimeout(200);
await p.selectOption(`[data-rchgsel="${key2}"]`,'t_ch');await p.waitForTimeout(500);
const rows2=await p.evaluate(d=>rowsFor(dayInfo(d)).filter(r=>MEALS[r[1]]).map(r=>r[0]+' '+MEALS[r[1]].m),sel);
ok('changing again replaces it',rows2.filter(x=>x.startsWith('12:00')).length===1,rows2.join(', '));
ok('undo listed under Just for this day',/Skipped|this day only/.test(await p.$eval('#once-status',e=>e.innerText)));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
