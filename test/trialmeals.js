const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8795/index.html');await p.waitForTimeout(1500);
await p.fill('#su-name','Defty');await p.click('#su-next');await p.waitForTimeout(100);await p.click('#su-skip');await p.waitForTimeout(100);
await p.click('[data-suc="split:fb"]');await p.click('#su-next');await p.click('[data-suc="rota:mf"]');await p.click('#su-next');await p.waitForTimeout(100);
await p.click('#su-skip');await p.waitForTimeout(2500);
ok('new trial user gets starter meals',await p.evaluate(()=>!rowsFor(dayInfo(TODAY)).some(r=>BASE_IDS.has(r[1])&&MEALS[r[1]])));
// simulate an old trial user: plan with the owner's meals, their own meal, own targets
await p.evaluate(async()=>{D.plan={targets:{T:{kcal:2700,p:180,c:300,f:70},R:{kcal:2700,p:180,c:300,f:70}},meals:{xmine:{m:"My protein oats",items:[["oats",80],["whey",30]]}}};await db.doc('prefs/plan').set(D.plan);delete L.trialMealsFixed;saveL()});
await p.reload();await p.waitForTimeout(2500);
const r=await p.evaluate(()=>({base:SLOTS.some(([s])=>["T","R"].some(t=>SCHED[s][t].rows.some(r=>BASE_IDS.has(r[1])&&MEALS[r[1]]))),mine:!!MEALS.xmine,tg:PLAN.T.kcal,today:rowsFor(dayInfo(TODAY)).filter(r=>MEALS[r[1]]).map(r=>MEALS[r[1]].m).join(', '),toast:(document.getElementById('gtoast')||{}).textContent}));
ok('old trial user: owner meals replaced',!r.base,r.today);ok('own meal kept',r.mine);ok('own targets kept',r.tg===2700);ok('told about it',/starter meals/.test(r.toast||''));
await p.reload();await p.waitForTimeout(1500);ok('only once',await p.evaluate(()=>!!L.trialMealsFixed&&!/starter meals/.test((document.getElementById('gtoast')||{}).textContent||'')));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
