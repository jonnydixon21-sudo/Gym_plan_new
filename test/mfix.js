const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errs=[];
// main copy: no switch
const m=await ctx.newPage();m.on('pageerror',e=>errs.push(e.message));await m.goto('http://localhost:8791/index.html');await m.waitForTimeout(1000);
await m.evaluate(()=>show('nutrition','meals'));await m.waitForTimeout(300);ok('main copy has no fixed switch',!(await m.$('[data-mfix]')));
ok('overnight oats still fixed by default',await m.evaluate(()=>noScale('oor')&&noScale('n_oo')));
// trial copy
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',x=>{if(x.type()==='error')errs.push(x.text())});p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8795/index.html');await p.waitForTimeout(1200);
// skip the first-run setup: a person who has already set up
await p.evaluate(()=>{L.profile={name:'Test',mode:'cut',startDate:TODAY,startWeight:90,goalWeight:85,units:{w:'kg',l:'in'}};L.trialMealsFixed=1;saveL()});await p.reload();await p.waitForTimeout(1200);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(async()=>{const P=planDoc();P.meals={...P.meals,t_oats:{m:"Test oats",items:[["oats",60],["whey",30]]},t_pasta:{m:"Test pasta",items:[["pasta",80],["mince",150]]}};
  P.sched={...P.sched};["day:T","off:T"].forEach(k=>{const [s,t]=k.split(":"),sc=SCHED[s][t];P.sched[k]={rows:[...dcl(sc.rows),["21:00","t_oats"],["22:00","t_pasta"]],sum:sc.sum,note:sc.note||"",wake:WAKE[s][t]}});D.plan=P;await savePlan()});
await p.evaluate(()=>show('nutrition','meals'));await p.waitForTimeout(400);
ok('trial copy shows the switch',!!(await p.$('[data-mfix="t_oats"]')));
ok('starts not fixed',!(await p.$eval('[data-mfix="t_oats"]',e=>e.checked)));
await p.check('[data-mfix="t_oats"]');await p.waitForTimeout(500);
ok('saved as fixed',await p.evaluate(()=>D.plan.fixed.t_oats===true&&noScale('t_oats')));
await p.$eval('#meal-t_oats',e=>e.scrollIntoView());await p.screenshot({path:SH+'mfix.png'});
// big target change, then fit: fixed meal untouched, the other one moves
const oats0=await p.evaluate(()=>JSON.stringify(SCHED.day.T.rows.filter(r=>MEALS[r[1]]&&MEALS[r[1]].m==="Test oats").map(r=>MEALS[r[1]].items)));
const pasta0=await p.evaluate(()=>JSON.stringify(SCHED.off.T.rows.filter(r=>MEALS[r[1]]&&MEALS[r[1]].m==="Test pasta").map(r=>MEALS[r[1]].items)));
await p.evaluate(async()=>{const P=planDoc();P.targets={T:{kcal:3400,p:230,c:420,f:90},R:{kcal:3000,p:220,c:340,f:80}};D.plan=P;applyPlan();fitPlanAll();await savePlan()});
const oats1=await p.evaluate(()=>JSON.stringify(SCHED.day.T.rows.filter(r=>MEALS[r[1]]&&MEALS[r[1]].m==="Test oats").map(r=>MEALS[r[1]].items)));
const pasta1=await p.evaluate(()=>JSON.stringify(SCHED.off.T.rows.filter(r=>MEALS[r[1]]&&MEALS[r[1]].m==="Test pasta").map(r=>MEALS[r[1]].items)));
ok('fixed meal not resized by fitting',oats0===oats1,oats1);ok('other meal resized',pasta0!==pasta1,pasta1);
await p.reload();await p.waitForTimeout(1000);ok('kept after reload',await p.evaluate(()=>noScale('t_oats')));
await p.evaluate(()=>show('nutrition','meals'));await p.waitForTimeout(300);await p.uncheck('[data-mfix="t_oats"]');await p.waitForTimeout(400);
ok('can be unfixed',await p.evaluate(()=>!noScale('t_oats')));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
