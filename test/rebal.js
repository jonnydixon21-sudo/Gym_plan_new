const { chromium } = require('playwright');const fs=require('fs');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const bk=process.env.BK;if(bk){const d=JSON.parse(fs.readFileSync(bk,'utf8'));await p.evaluate(async d=>{await window.__importAll(d);localStorage.setItem(KEY,JSON.stringify(d.local))},d);await p.reload();await p.waitForTimeout(1500)}
else{await p.evaluate(async()=>{for(let i=0;i<10;i++)await saveCheckin(addDays(TODAY,-9+i),{weight:88})});await p.waitForTimeout(300)}
await p.evaluate(()=>{window.TGD=null;goTo('nutrition','targets');renderTargets()});await p.click('#tg-fit');await p.waitForTimeout(900);await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e&&!e.hidden){console.log('pop:',e.innerText.replace(/\n+/g,' | '));e.hidden=true}});
const r0=await p.evaluate(()=>fitReport());
// pick a meal in the day-shift training plan that has rice/potato
const pick=await p.evaluate(()=>{const ids=SCHED.day.T.rows.map(r=>r[1]).filter(id=>MEALS[id]&&!NO_SCALE[id]);for(const id of ids){const i=MEALS[id].items.findIndex(([k,a])=>F[k]&&F[k].u==="g"&&carbItem(k,IM[id][MEALS[id].items.findIndex(x=>x[0]===k)])&&a>=60);if(i>=0)return {id,i,a:MEALS[id].items[i][1],name:MEALS[id].m}}return null});
console.log('pick',JSON.stringify(pick),'before fit report kcal',Math.round(r0.kcal));
const nMeals=await p.evaluate(()=>Object.keys(MEALS).length);
await p.evaluate(id=>medOpen(id),pick.id);await p.waitForTimeout(200);
ok('rebalance ticked by default',await p.evaluate(()=>document.getElementById('med-rebal').checked));
await p.fill(`[data-ma="${pick.i}"]`,String(pick.a-10));await p.click('#med-save');await p.waitForTimeout(900);await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e&&!e.hidden){console.log('pop:',e.innerText.replace(/\n+/g,' | '));e.hidden=true}});
const after=await p.evaluate(([id,i])=>({amt:MEALS[id].items[i][1],r:fitReport(),n:Object.keys(MEALS).length,toast:(document.getElementById('gtoast')||{}).textContent||''}),[pick.id,pick.i]);
console.log(after.toast);
ok('your edit kept',after.amt===pick.a-10,after.amt);
ok('no new meal versions',after.n===nMeals,after.n+' vs '+nMeals);
ok('days still on target',after.r.kcal<=Math.max(80,r0.kcal+30)&&after.r.c<=Math.max(12,r0.c+5),JSON.stringify(after.r.rows.map(x=>x.n+':'+Math.round(x.d.kcal)+'/'+Math.round(x.d.c))));
ok('told what changed',/rebalanced/.test(after.toast));
// unticked: no rebalance
const snap=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(MEALS).map(([k,m])=>[k,m.items.map(i=>i[1])]))));
await p.evaluate(id=>medOpen(id),pick.id);await p.waitForTimeout(150);await p.uncheck('#med-rebal');await p.fill(`[data-ma="${pick.i}"]`,String(pick.a-20));await p.click('#med-save');await p.waitForTimeout(600);await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e&&!e.hidden){console.log('pop:',e.innerText.replace(/\n+/g,' | '));e.hidden=true}});
ok('untick: only this meal changes',await p.evaluate(([s,id])=>{const o=JSON.parse(s);return Object.entries(MEALS).every(([k,m])=>k===id||JSON.stringify(m.items.map(i=>i[1]))===JSON.stringify(o[k]))},[snap,pick.id]));
await p.evaluate(()=>goTo('training','gym'));await p.evaluate(()=>{document.querySelector('[data-fold="past"]').open=true});
ok('header says Past sessions and Last 7 label',await p.evaluate(()=>document.querySelector('[data-fold="past"] summary').innerText.trim().toLowerCase()==='past sessions'&&/Last 7/i.test(document.querySelector('.last7').textContent)));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
