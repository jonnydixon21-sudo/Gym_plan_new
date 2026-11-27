// Leaving a live workout shows "Back to workout"; abs log weight; Schedule dates; no heading style option.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.checkVisibility()},sel);
ok('no bar without a workout',!(await vis('#wback')));
await p.evaluate(()=>goTo('training','gym'));await p.click('.tw button[data-tpl]');await p.click('#pv-start');await p.waitForTimeout(300);
ok('no bar while on the workout',!(await vis('#wback')));
await p.click('#tab-nutrition');await p.waitForTimeout(300);
ok('bar shows elsewhere',await vis('#wback')&&/Back to workout/.test(await p.$eval('#wback',e=>e.innerText)),await p.$eval('#wback',e=>e.innerText.replace(/\n/g,' ')));
await p.screenshot({path:SH+'wback.png'});
await p.click('#wback-go');await p.waitForTimeout(400);ok('tap returns to the workout',await vis('#w-live .whead')&&!(await vis('#wback')));
// rest running, then leave: button inside the rest bar instead
await p.fill('[data-f="kg"][data-ex="0"][data-s="0"]','40');await p.fill('[data-f="reps"][data-ex="0"][data-s="0"]','8');await p.click('[data-ok="0:0"]');await p.waitForTimeout(300);
ok('rest bar on workout has no back button',await vis('#rest')&&!(await vis('#rest-back')));
await p.click('#tab-progress');await p.waitForTimeout(300);
ok('rest bar elsewhere has Back to workout',await vis('#rest-back')&&!(await vis('#wback')));
await p.screenshot({path:SH+'wback-rest.png'});
await p.click('#rest-back');await p.waitForTimeout(300);ok('rest button returns',await vis('#w-live .whead'));
await p.click('#rest-x');await p.waitForTimeout(200);
// abs with weight
await p.click('#w-abs-tog');await p.waitForTimeout(150);
ok('abs row has kg and reps',await vis('[data-absk="0"]')&&await vis('[data-absr="0"]'));
await p.selectOption('select[data-absn="0"]','Cable crunch');await p.fill('[data-absk="0"]','27.5');await p.fill('[data-absr="0"]','12');
await p.click('#w-abs-add');await p.waitForTimeout(100);ok('new line copies weight',await p.$eval('[data-absk="1"]',e=>e.value)==='27.5');await p.fill('[data-absr="1"]','10');
await p.evaluate(()=>document.getElementById('w-abs').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'abs-kg.png'});
await p.click('[data-finish]');await p.waitForTimeout(700);
ok('abs weight saved',await p.evaluate(()=>{const w=D.workouts.find(w=>w.date===TODAY&&w.source==='app');const e=w&&w.exercises.find(e=>e.name==='Cable crunch');return !!e&&e.sets[0].kg===27.5&&e.sets[0].reps===12&&e.sets[1].kg===27.5}));
ok('summary shows the weight',/Cable crunch[\s\S]*27\.5kg/.test(await p.$eval('#w-done',e=>e.innerText)));
await p.click('#w-done-x');await p.waitForTimeout(200);ok('bar gone after finishing',!(await vis('#wback')));
// schedule dates
await p.click('#tab-schedule');await p.waitForTimeout(300);
const dt=await p.$$eval('#hs-schedule .scdate',e=>e.map(x=>x.innerText.replace(/\n/g,' ')));ok('dates show day and date',dt.length===7&&/^Today/i.test(dt[0])&&dt.slice(1).every(t=>/^\w{3} \d{1,2} \w{3}$/.test(t)),dt.join(' | '));
await p.screenshot({path:SH+'sched-dates.png'});
ok('tile says My weeks',/My weeks/.test(await p.$eval('#hub-schedule',e=>e.innerText)));
// heading style option gone
await p.click('#tab-today');await p.click('#hero-cog');await p.waitForTimeout(200);ok('no heading style option',!(await p.$('#hf-chips'))&&!/Heading style/i.test(await p.$eval('#view-settings',e=>e.innerText)));
ok('sport headings on',await p.evaluate(()=>document.documentElement.dataset.hfont==='sport'));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
