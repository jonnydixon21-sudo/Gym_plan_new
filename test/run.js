const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
console.log('train-log:',(await p.$eval('#train-log',e=>e.innerText)).replace(/\n/g,' | '));
await p.screenshot({path:SH+'run-today.png',fullPage:true});
// quick gym done
console.log('after gym:',(await p.$eval('#train-log',e=>e.innerText)).replace(/\n/g,' | '),'| pill:',await p.$eval('#today-pill',e=>e.textContent));
// run from today
await p.click('[data-tlrun]');await p.fill('[data-rf="km"]','5.2');await p.fill('[data-rf="time"]','31:20');
console.log('pace:',await p.$eval('#rf-pace',e=>e.textContent));
await p.click('#rf-save');await p.waitForTimeout(400);
console.log('after run:',(await p.$eval('#run-done',e=>e.innerText)).replace(/\n/g,' | '));
// speed intervals from Run tab
await p.evaluate(()=>goTo('run'));await p.click('#run-add');await p.click('[data-rfk="speed"]');
await p.fill('[data-rf="reps"]','6');await p.fill('[data-rf="repM"]','400');await p.fill('[data-rf="rest"]','90s jog');await p.fill('[data-rf="repPace"]','3:55');await p.fill('[data-rf="km"]','6.1');await p.fill('[data-rf="time"]','34:10');
await p.screenshot({path:SH+'run-form.png'});
await p.click('#rf-save');await p.waitForTimeout(300);
await p.click('#run-add');await p.click('[data-rfk="speed"]');await p.click('[data-rfm="threshold"]');await p.fill('[data-rf="thrMin"]','20');await p.fill('[data-rf="thrPace"]','4:30');await p.fill('[data-rf="km"]','8');await p.fill('[data-rf="time"]','42:00');await p.click('#rf-save');await p.waitForTimeout(300);
console.log('stats:',(await p.$$eval('#run-stats .stat',e=>e.map(x=>x.innerText.replace(/\n/g,' ')))));
console.log('list:',await p.$$eval('#run-list .runrow',e=>e.map(x=>x.innerText.replace(/\n/g,' | '))));
console.log('next:',await p.$$eval('#run-next li',e=>e.map(x=>x.innerText.replace(/\n/g,' '))));
await p.screenshot({path:SH+'run-tab.png',fullPage:true});
// run days: make day 6 (idx 5) an easy run, remove speed on idx 7
await p.evaluate(()=>goTo('rundays'));
await p.click('[data-rbrm="2"]');await p.click('#rb-add');await p.selectOption('[data-rbd="2"]','5');await p.fill('[data-rbn="2"]','Recovery jog');await p.click('#rp-save');await p.waitForTimeout(300);
console.log('PATTERN runs:',await p.evaluate(()=>PATTERN.map((x,i)=>i+':'+(x.run||'-')+(x.runKind?'('+x.runKind+')':'')).join(' ')));
console.log('next after:',await p.$$eval('#run-next li',e=>e.map(x=>x.innerText.replace(/\n/g,' '))));
// other tabs still fine
for(const t of ['progress','gym','food','coach','today']){await p.evaluate(t=>goTo(t==='progress'?'body':t),t);await p.waitForTimeout(120)}
await p.reload();await p.waitForTimeout(900);
console.log('persist: runs',await p.evaluate(()=>D.runs.length),'PATTERN5',await p.evaluate(()=>PATTERN[5].run),'workouts',await p.evaluate(()=>D.workouts.length));
await p.evaluate(()=>goTo('run'));console.log('tabbar overflow:',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
await p.evaluate(()=>goTo('gym'));await p.waitForTimeout(200);console.log('gym ok sessions list:',await p.$$eval('#sessions details',e=>e.length));
console.log('errors:',errs);await b.close()})();
