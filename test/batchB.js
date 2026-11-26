const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// history: a previous upper session
const first=await p.evaluate(()=>{const t=TEMPLATES.find(t=>t.title==='Upper')||TEMPLATES[0];return {title:t.title,ex:t.ex.map(e=>e.name)}});
await p.evaluate(async f=>{await db.doc('workouts/old1').set({date:addDays(TODAY,-8),title:f.title,source:'app',exercises:[{name:f.ex[0],sets:[{kg:60,reps:8},{kg:60,reps:7}]},{name:'Barbell bench press',sets:[{kg:80,reps:6}]}]})},first);await p.waitForTimeout(400);
await p.evaluate(()=>goTo('training','gym'));await p.waitForTimeout(200);
await p.evaluate(t=>{const b=[...document.querySelectorAll('.tw button[data-tpl]')].find(x=>x.closest('.tw').innerText.includes(t))||document.querySelector('.tw button[data-tpl]');b.click()},first.title);await p.click('#pv-start');await p.waitForTimeout(400);
ok('warm-up open on first heavy exercise',await p.evaluate(()=>{const w=document.querySelector('.wex[data-ex="0"] .wu');return !!w&&/Not counted/.test(w.innerText)}));
const wtxt=await p.evaluate(()=>document.querySelector('.wex[data-ex="0"] .wu').innerText.replace(/\n/g,' | '));console.log('   ',wtxt);
ok('warm-up weights below working weight',/30kg × 10/.test(wtxt)&&/45kg × 5/.test(wtxt),wtxt);
await p.click('[data-wu="0"]');await p.waitForTimeout(150);ok('toggle closes',await p.evaluate(()=>!document.querySelector('.wex[data-ex="0"] .wu')));
await p.click('[data-wu="0"]');await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('.wex[data-ex="0"]').scrollIntoView({block:'start'}));await p.screenshot({path:SH+'warmup.png'});
// PR pop: beat 60x8 (e1rm 76) with 62.5 x 8
await p.fill('[data-f="kg"][data-ex="0"][data-s="0"]','62.5');await p.fill('[data-f="reps"][data-ex="0"][data-s="0"]','8');await p.click('[data-ok="0:0"]');await p.waitForTimeout(400);
ok('PR pop shows',await p.evaluate(()=>{const e=document.getElementById('pr-pop');return e&&e.classList.contains('show')&&/New PR/.test(e.innerText)&&/62.5kg × 8/.test(e.innerText)}));
await p.screenshot({path:SH+'prpop.png'});
await p.waitForTimeout(4500);
await p.fill('[data-f="kg"][data-ex="0"][data-s="1"]','60');await p.fill('[data-f="reps"][data-ex="0"][data-s="1"]','6');await p.click('[data-ok="0:1"]');await p.waitForTimeout(400);
ok('no PR pop for a weaker set',await p.evaluate(()=>!document.getElementById('pr-pop').classList.contains('show')));
await p.click('#w-finish');await p.waitForTimeout(600);
// records
await p.evaluate(()=>goTo('progress','lifts'));await p.waitForTimeout(300);
const pr=await p.evaluate(()=>document.getElementById('pr-card').innerText.replace(/\n/g,' | '));console.log('   ',pr.slice(0,300));
ok('records list newest first with New pill',new RegExp(first.ex[0].replace(/[()]/g,'.')+' \\| New \\| 62.5kg × 8').test(pr)&&/Barbell bench press/.test(pr),pr.slice(0,200));
await p.locator('#pr-card').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'prs.png'});
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
