const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1200);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
ok('main copy skips setup',await p.evaluate(()=>!document.getElementById('setup')&&/Day \d+ of your bulk/.test(document.getElementById('hello-sub').textContent)));
await p.evaluate(async()=>{await db.doc('checkins/'+TODAY).set({date:TODAY,weight:88,photos:[]});await db.doc('workouts/w1').set({date:addDays(TODAY,-2),title:'Upper',source:'app',exercises:[{name:'Barbell bench press',sets:[{kg:80,reps:6}]}]});await db.doc('measures/m1').set({date:TODAY,site:'Waist',cm:85,note:''})});await p.waitForTimeout(400);
await p.evaluate(()=>goTo('settings'));await p.waitForTimeout(200);
const pf=await p.evaluate(()=>({name:document.getElementById('pf-name').value,sw:document.getElementById('pf-sw').value,gw:document.getElementById('pf-gw').value}));ok('profile shows current setup',pf.name==='Jonny'&&pf.sw==='87.2'&&pf.gw==='93',JSON.stringify(pf));
await p.screenshot({path:SH+'profile.png'});
await p.fill('#pf-gw','94');await p.click('#pf-save');await p.waitForTimeout(1500);
ok('goal weight saved',await p.evaluate(()=>SETUP.goalWeight===94&&weightGoal().target===94));
// switch to lb
await p.evaluate(()=>goTo('settings'));await p.waitForTimeout(200);await p.click('[data-pfc="w:lb"]');await p.waitForTimeout(100);
ok('warns about conversion',/converts every weight/.test(await p.textContent('#pf-body')));
await p.click('#pf-save');await p.waitForTimeout(2500);
const c=await p.evaluate(()=>({u:unitW(),w:D.checkins.find(c=>c.date===TODAY).weight,lift:D.workouts.find(w=>w._id==='w1').exercises[0].sets[0].kg,sw:SETUP.startWeight,gw:SETUP.goalWeight,g:weightGoal().target,m:D.measures[0].cm}));
ok('converted to lb',c.u==='lb'&&c.w===194&&c.lift===176.5&&c.sw===192.2&&c.gw===207.2&&c.g===207.2&&c.m===85,JSON.stringify(c));
ok('labels in lb',await p.evaluate(()=>/Weight \(lb\)/.test(document.querySelector('label[for="q-weight"]').textContent)));
// back to kg
await p.evaluate(()=>goTo('settings'));await p.waitForTimeout(200);await p.click('[data-pfc="w:kg"]');await p.click('#pf-save');await p.waitForTimeout(2500);
const c2=await p.evaluate(()=>({u:unitW(),w:D.checkins.find(c=>c.date===TODAY).weight,lift:D.workouts.find(w=>w._id==='w1').exercises[0].sets[0].kg,sw:SETUP.startWeight}));
ok('back to kg',c2.u==='kg'&&c2.w===88&&c2.lift===80&&c2.sw===87.2,JSON.stringify(c2));
// run setup again opens and can close
await p.evaluate(()=>goTo('settings'));await p.click('#pf-setup');await p.waitForTimeout(200);ok('setup again opens prefilled',await p.evaluate(()=>document.getElementById('su-name').value==='Jonny'));await p.click('#su-close');
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
