const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const errs=[];
for(const port of [8791,8795]){
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
  await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(1000);
  await p.evaluate(()=>{L.profile=L.profile||{name:'Test',mode:'cut',startDate:TODAY,startWeight:90,goalWeight:85,units:{w:'kg',l:'in'}};L.trialMealsFixed=1;saveL()});
  // save your own targets, then open the app fresh: the Coach card must show them, not the defaults
  await p.evaluate(async()=>{const P=planDoc();P.targets={T:{kcal:2400,p:208,c:253,f:62},R:{kcal:2200,p:200,c:220,f:60}};D.plan=P;await savePlan()});
  await p.reload();await p.waitForTimeout(1500);
  await p.evaluate(()=>show('progress','coach'));await p.waitForTimeout(500);
  const t=await p.evaluate(()=>{document.querySelectorAll('#view-coach details').forEach(x=>x.open=true);return document.getElementById('adj-stats').innerText});
  ok(`${port}: coach shows your training-day target`,/2,400 kcal/.test(t),t.replace(/\n/g,' '));
  ok(`${port}: coach shows your rest-day target`,/2,200 kcal/.test(t));
  ok(`${port}: no default 3,090`,!/3,090/.test(t));
  await p.evaluate(async()=>{const P=planDoc();P.targets={T:{kcal:2500,p:208,c:278,f:62},R:{kcal:2200,p:200,c:220,f:60}};D.plan=P;await savePlan()});await p.waitForTimeout(300);
  ok(`${port}: updates when targets change`,/2,500 kcal/.test(await p.$eval('#adj-stats',e=>e.innerText)));
}
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
