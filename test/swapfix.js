const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
// his situation: an old global "always" swap Smith split squat -> Static lunges, and Legs C saved with Smith split squat
await p.evaluate(async()=>{const k=TEMPLATES.find(t=>t.title==='Legs C').key,prog=D.program||{};D.program={...prog,days:{...(prog.days||{}),[k]:[{name:'Hang power clean',groups:[[4,'3']],note:''},{name:'Smith machine split squat',groups:[[2,'6-8']],note:''}]}};await db.doc('prefs/program').set(D.program);
  await db.doc('prefs/swaps').set({map:{'Smith machine split squat':'Static lunges','Pec deck':{to:'Cable fly',from:TODAY,until:addDays(TODAY,20),reason:'stalled'}}})});
await p.reload();await p.waitForTimeout(1200);
ok('old global swap removed, 4-week swap kept',await p.evaluate(()=>!D.exswaps['Smith machine split squat']&&!!D.exswaps['Pec deck']),await p.evaluate(()=>JSON.stringify(D.exswaps)));
await p.evaluate(()=>goTo('training','gym'));await p.click('.tw button[data-tpl="Legs C"]');await p.waitForTimeout(300);
ok('preview shows what was saved',await p.evaluate(()=>/Smith machine split squat/.test(document.getElementById('w-tpls').innerText)&&!/Static lunges/.test(document.getElementById('w-tpls').innerText)));
await p.click('#pv-start');await p.waitForTimeout(300);ok('workout uses saved exercise',await p.evaluate(()=>W.exercises[1].name==='Smith machine split squat'));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
