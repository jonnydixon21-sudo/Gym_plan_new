// Fitting meals never more-than-doubles portions: days it can't reach are left alone and a pop-up says to add meals.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(async()=>{for(let i=0;i<10;i++)await saveCheckin(addDays(TODAY,-9+i),{weight:88})});
const snap=()=>p.evaluate(()=>Object.fromEntries(Object.entries(MEALS).map(([k,m])=>[k,m.items.map(i=>i[1])])));
// 1. sensible targets fit without a pop-up
await p.evaluate(()=>{window.TGD=null;goTo('nutrition','targets');renderTargets()});await p.click('#tg-fit');await p.waitForTimeout(900);
ok('normal fit: no pop-up',await p.evaluate(()=>!document.getElementById('fitpop')||document.getElementById('fitpop').hidden));
const s0=await snap(),k0=await p.evaluate(()=>Object.keys(MEALS).length);
const tIds=await p.evaluate(()=>{const ids=new Set();SLOTS.forEach(([s])=>SCHED[s]&&SCHED[s].T&&SCHED[s].T.rows.forEach(r=>MEALS[r[1]]&&ids.add(r[1])));return [...ids]});
// 2. training-day calories way beyond what the meals can stretch to
await p.evaluate(()=>{const P=planDoc();P.targets={T:{kcal:PLAN.T.kcal+2500,p:PLAN.T.p,c:PLAN.T.c+600,f:PLAN.T.f},R:{...PLAN.R}};P.macroRule=false;D.plan=P;applyPlan();goTo('food','meals')});await p.waitForTimeout(300);
await p.click('#aa-fit');await p.click('#aa-fit');await p.waitForTimeout(900);
const pop=await p.evaluate(()=>{const e=document.getElementById('fitpop');return e&&!e.hidden?e.innerText:''});
ok('pop-up shown',/Unable to fit/i.test(pop)&&/short/.test(pop)&&/Add more meals/i.test(pop),pop.replace(/\n/g,' | ').slice(0,300));
ok('names training days only',/training/.test(pop)&&!/ rest ·/.test(pop));
ok('no "Meals fitted" toast',await p.evaluate(()=>!/Meals fitted/.test((document.getElementById('gtoast')||{}).textContent||'')));
const s1=await snap();
ok('says why',/never double/.test(pop));
ok('nothing more than doubled',Object.keys(s1).every(id=>!s0[id]||s1[id].every((a,i)=>!(s0[id][i]>0)||a<2*s0[id][i])));
ok('rest days still fitted',await p.evaluate(()=>fitReport().rows.filter(x=>x.t==='R').every(x=>Math.abs(x.d.kcal)<=100)));
await p.screenshot({path:SH+'fitstuck.png'});
await p.click('#fitpop-go');await p.waitForTimeout(400);
ok('Plan your days button opens that day',await p.evaluate(()=>document.getElementById('fitpop').hidden&&!!PED&&PED.type==='T'&&document.getElementById('days-ed').offsetParent!==null));
// 3. targets back; editing a meal so far the rest can't balance it
await p.evaluate(()=>{const P=planDoc();P.targets={T:{...PLAN.R},R:{...PLAN.R}};D.plan=P;applyPlan()});
await p.evaluate(()=>{window.TGD=null;goTo('nutrition','targets');renderTargets()});await p.click('#tg-fit');await p.waitForTimeout(900);
await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e)e.hidden=true});
const pick=await p.evaluate(()=>{const ids=SCHED.day.T.rows.map(r=>r[1]).filter(id=>MEALS[id]&&!NO_SCALE[id]);for(const id of ids){const i=MEALS[id].items.findIndex(([k,a])=>F[k]&&F[k].u==="g"&&a>=60&&IM[id][MEALS[id].items.findIndex(x=>x[0]===k)][2]>20);if(i>=0)return {id,i,a:MEALS[id].items[i][1]}}return null});
const s2=await snap();
await p.evaluate(id=>medOpen(id),pick.id);await p.waitForTimeout(200);
await p.fill(`[data-ma="${pick.i}"]`,String(pick.a*6));await p.click('#med-save');await p.waitForTimeout(900);
const pop2=await p.evaluate(()=>{const e=document.getElementById('fitpop');return e&&!e.hidden?e.innerText:''});
ok('rebalance pop-up',/Unable to fit/i.test(pop2)&&/is saved/.test(pop2)&&/over/.test(pop2)&&/Day shift training/.test(pop2),pop2.replace(/\n/g,' | ').slice(0,300));
const s3=await snap();
ok('your edit kept',s3[pick.id][pick.i]===pick.a*6,s3[pick.id][pick.i]);
const lo=await p.evaluate(pid=>{const fb=planDoc().fitBase||{};const day=new Set(SCHED.day.T.rows.map(r=>r[1]));return Object.keys(MEALS).filter(id=>day.has(id)).flatMap(id=>id===pid?[]:MEALS[id].items.map(([k,a],i)=>[id,k,a,fb[id+':'+i]]).filter(x=>x[3]!=null&&x[2]<x[3]*0.5-5))},pick.id);ok('other meals never below half their normal size',!lo.length,JSON.stringify(lo));
await p.click('#fitpop-x');await p.waitForTimeout(150);ok('OK closes it',await p.evaluate(()=>document.getElementById('fitpop').hidden));
// a small edit still rebalances as before
await p.evaluate(id=>medOpen(id),pick.id);await p.waitForTimeout(200);await p.fill(`[data-ma="${pick.i}"]`,String(pick.a-10));await p.click('#med-save');await p.waitForTimeout(900);
ok('small edit still rebalances',await p.evaluate(()=>/rebalanced/.test(document.getElementById('gtoast').textContent)&&document.getElementById('fitpop').hidden));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
