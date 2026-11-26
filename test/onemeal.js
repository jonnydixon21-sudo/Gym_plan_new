const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// three versions of one meal on different day plans, like fitting makes
await p.evaluate(async()=>{const P=planDoc();P.meals={...P.meals,
  t_cr_a:{m:"Test chicken rice",items:[["chicken",200],["basmati",60]]},t_cr_b:{m:"Test chicken rice",items:[["chicken",250],["basmati",80]]},t_cr_c:{m:"Test chicken rice",items:[["chicken",200],["basmati",60]]}};
  P.sched={...P.sched};[["day:T","t_cr_a"],["day:R","t_cr_c"],["off:T","t_cr_b"],["off:R","t_cr_a"]].forEach(([k,id])=>{const [s,t]=k.split(":"),sc=SCHED[s][t];P.sched[k]={rows:[...dcl(sc.rows),["23:00",id]],sum:sc.sum,note:sc.note||"",wake:WAKE[s][t]}});
  delete P.oneMeal;D.plan=P;await savePlan()});
const snap=()=>p.evaluate(()=>{const r={};SLOTS.forEach(([s])=>["T","R"].forEach(t=>{r[s+t]=SCHED[s][t].rows.filter(x=>MEALS[x[1]]).map(x=>x[0]+" "+MEALS[x[1]].m+" "+MEALS[x[1]].items.map(i=>i[0]+i[1]).join(","))}));return r});
const count=()=>p.evaluate(()=>Object.values(D.plan.meals).filter(m=>m.m==="Test chicken rice").length);
ok('off by default in the main app',!(await p.evaluate(()=>oneMealOn())));
ok('copies kept while off',await count()===3,await count());
const before=await snap();
await p.evaluate(()=>show('nutrition','meals'));await p.waitForTimeout(300);
ok('switch hidden in the main copy',!(await p.$('#om-on')));
await p.evaluate(async()=>{const P=planDoc();P.oneMeal=true;D.plan=P;await savePlan()});await p.waitForTimeout(600);
ok('one saved copy',await count()===1,await count());
const after=await snap();ok('every day plan eats exactly the same',JSON.stringify(before)===JSON.stringify(after));
ok('off day uses its own portion',after.offT.some(x=>/Test chicken rice chicken250,basmati80/.test(x)),after.offT.slice(-1));
ok('meal list shows it once',await p.$$eval('#plans strong',e=>e.filter(x=>x.innerText==='Test chicken rice').length)===1);
ok('no versions group',!(await p.$$eval('#plans .mgroup',e=>e.map(x=>x.innerText).join()).then(t=>/Test chicken rice/.test(t))));
ok('picker lists it once',await p.evaluate(()=>(mealOptsHtml("").match(/>Test chicken rice ·/g)||[]).length)===1);
ok('assigned label counts each day',await p.evaluate(()=>{const id=Object.keys(D.plan.meals).find(k=>D.plan.meals[k].m==="Test chicken rice");return usedLabel(id)}).then(x=>/Day shift/.test(x)&&/Day off/.test(x)));
ok('old ids still resolve for history',await p.evaluate(()=>["t_cr_a","t_cr_b","t_cr_c"].every(id=>MEALS[id]&&MEALS[id].m==="Test chicken rice")));
await p.screenshot({path:SH+'onemeal.png'});
// fitting doesn't save extra copies
await p.click('#aa-fit');await p.click('#aa-fit');await p.waitForTimeout(1500);
const nm=await p.evaluate(()=>Object.keys(D.plan.meals).filter(k=>/_(day|n1|n2|off1|off)[TR](_\d+)?$/.test(k)).length);
ok('fitting saves no per-day meals',nm===0,nm);ok('still one copy after fitting',await count()===1,await count());
// change one day's portion through its version: only that day changes, still one copy
const vid=await p.evaluate(()=>SCHED.off.T.rows.map(r=>r[1]).find(id=>MEALS[id]&&MEALS[id].of&&MEALS[id].m==="Test chicken rice"));
ok('off day has a per-day version',!!vid,vid);
const s1=await snap();
await p.evaluate(async v=>{const P=planDoc(),m=MEALS[v];P.meals={...P.meals,[v]:{m:m.m,items:m.items.map(([k,a])=>[k,k==="chicken"?300:a])}};D.plan=P;await savePlan()},vid);
const s2=await snap();
ok('edit lands on that day',s2.offT.some(x=>/Test chicken rice chicken300/.test(x)),s2.offT.slice(-1));
ok('other days untouched',['dayT','dayR','offR','n1T'].every(k=>JSON.stringify(s1[k])===JSON.stringify(s2[k])));
ok('still one copy after edit',await count()===1,await count());
await p.reload();await p.waitForTimeout(1000);
ok('kept after reload',(await snap()).offT.some(x=>/Test chicken rice chicken300/.test(x)));
// turning it off keeps each day's portions
await p.evaluate(()=>show('nutrition','meals'));await p.waitForTimeout(300);const s3=await snap();await p.uncheck('#om-on');await p.waitForTimeout(500);
ok('turning off changes no day',JSON.stringify(s3)===JSON.stringify(await snap()));
// the blank trial copy shows the switch, on
const t=await (await b.newContext({viewport:{width:390,height:844}})).newPage();t.on('pageerror',e=>errs.push(e.message));
await t.goto('http://localhost:8795/index.html');await t.waitForTimeout(1200);await t.evaluate(()=>show('nutrition','meals'));await t.waitForTimeout(300);
ok('trial copy shows the switch, on',await t.$eval('#om-on',e=>e.checked).catch(()=>false));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
