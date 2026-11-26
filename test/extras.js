const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(async()=>{const S=(kg,r,n)=>Array(n).fill(0).map(()=>({kg,reps:r}));
  await db.doc('workouts/old').set({date:addDays(TODAY,-60),title:'Legs A',source:'app',exercises:[{name:'Hack squat',sets:S(100,6,2)}]});
  await db.doc('workouts/u1').set({date:addDays(TODAY,-8),title:'Upper',source:'app',exercises:[{name:'Neutral-grip lat pulldown',sets:S(60,10,2)},{name:'Chest-supported row',sets:[{kg:50,reps:8},{kg:50,reps:7}]}]});
  for(let i=0;i<7;i++)await db.doc('habits/'+addDays(TODAY,-i)).set({date:addDays(TODAY,-i),sleepH:7.2});
  for(let i=0;i<14;i++)await saveCheckin(addDays(TODAY,-13+i),{weight:87+i*0.03});});
await p.waitForTimeout(500);
// deload suggestion (8 weeks since first log)
await p.evaluate(()=>goTo('gym'));await p.evaluate(()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true));await p.waitForTimeout(300);
ok('deload suggested after 6+ weeks',/Time for a deload week/.test(await p.$eval('#ready-card',e=>e.innerText)));
await p.click('#dl-start');await p.waitForTimeout(300);ok('deload on',/Deload week until/.test(await p.$eval('#ready-card',e=>e.innerText)));
// start Upper: auto-fill, deload sets, rest, superset, plates
await p.click('.tw button[data-tpl="Upper"]');await p.click('#pv-start');await p.waitForTimeout(300);
const s0=await p.evaluate(()=>W.exercises.slice(0,2).map(e=>e.name+': '+e.sets.length+' sets, kg '+e.sets.map(s=>s.kg).join('/')));console.log('   ',s0);
ok('deload cut sets (2 → 1)',await p.evaluate(()=>W.deload&&W.exercises[0].sets.length===1));
ok('auto-fill go up (60x10 both sets → 62.5)',await p.evaluate(()=>W.exercises[0].sets[0].sug==='62.5'&&W.exercises[0].sets[0].kg===''));
ok('auto-fill last weight (row 50)',await p.evaluate(()=>W.exercises[1].sets[0].sug==='50'));
await p.selectOption('select[data-rest="1"]','90');await p.waitForTimeout(100);ok('rest saved per exercise',await p.evaluate(()=>D.rest['chest-supported row']===90));
await p.click('[data-ss="0"]');await p.waitForTimeout(150);ok('superset linked',await p.evaluate(()=>W.exercises[0].ss===true)&&/Superset with/.test(await p.$eval('.wex[data-ex="0"]',e=>e.innerText)));
await p.fill('[data-f="reps"][data-ex="0"][data-s="0"]','10');await p.click('[data-ok="0:0"]');await p.waitForTimeout(250);
ok('no rest after first half of superset',await p.$eval('#rest',e=>e.hidden));
await p.fill('[data-f="reps"][data-ex="1"][data-s="0"]','8');await p.click('[data-ok="1:0"]');await p.waitForTimeout(250);
ok('rest after second half uses its own time',!(await p.$eval('#rest',e=>e.hidden))&&/1:(2|3)\d/.test(await p.$eval('#rest-t',e=>e.textContent)),await p.$eval('#rest-t',e=>e.textContent));
await p.click('#rest-x');
// plates: incline smith? Upper has no barbell -> add one
await p.fill('#w-addnew','Incline Smith machine press');await p.click('#w-add');await p.waitForTimeout(200);
const last=await p.evaluate(()=>W.exercises.length-1);await p.fill(`[data-f="kg"][data-ex="${last}"][data-s="0"]`,'72.5');await p.click(`[data-plates="${last}"]`);await p.waitForTimeout(150);
const pl=await p.$eval('.plates',e=>e.innerText.replace(/\n+/g,' | '));ok('plates for 72.5 on 20kg bar',/Each side: 25 \+ 1.25/.test(pl),pl);
await p.click('[data-bar="15"]');ok('bar changes',/Each side: 25 \+ 2.5 \+ 1.25/.test(await p.$eval('.plates',e=>e.innerText)),await p.$eval('.plates',e=>e.innerText.replace(/\n+/g,' | ')));
await p.screenshot({path:SH+'extras-live.png'});
await p.click('#w-finish');await p.waitForTimeout(500);
// superset remembered next time
await p.click('.tw button[data-tpl="Upper"]');await p.click('#pv-start');await p.waitForTimeout(300);ok('superset remembered for Upper',await p.evaluate(()=>W.exercises[0].ss===true));
await p.click('#w-cancel');await p.click('#w-cancel');
await p.click('#dl-end');await p.waitForTimeout(200);ok('deload ended',!(await p.evaluate(()=>inDeload())));
// sleep planner
await p.evaluate(()=>goTo('shifts'));await p.waitForTimeout(200);
const res={};for(const d of await p.evaluate(()=>[...Array(8)].map((_,i)=>addDays(TODAY,i)))){await p.evaluate(d=>goPlan(d),d);await p.waitForTimeout(120);res[d]=await p.evaluate(d=>dayInfo(d).slot,d)+' :: '+(await p.$eval('#rota-sleep',e=>e.innerText.replace(/\n+/g,' | ')))}
Object.entries(res).forEach(([d,v])=>console.log('   ',d,v.slice(0,230)));
ok('sleep planner on every day',Object.values(res).every(v=>/Sleep/.test(v)&&/Last caffeine/.test(v)));
ok('day shift: bed 22:00, caffeine 14:00',Object.values(res).some(v=>/^day ::.*22:00 → 05:30.*Last caffeine \| 14:00/.test(v)));
// weekly summary
await p.evaluate(()=>goTo('body'));await p.waitForTimeout(200);const wk=await p.$eval('#week-card',e=>e.innerText.replace(/\n+/g,' | '));console.log('   week:',wk);
ok('weekly summary counts today\'s session',/SESSIONS \| 1 \//.test(wk));ok('weekly summary card',/Your week/i.test(wk)&&/Sessions/i.test(wk)&&/Lifts up/i.test(wk)&&/Sleep/i.test(wk)&&/7.2h/.test(wk));
// protein fit
await p.evaluate(()=>goTo('targets'));await p.waitForTimeout(200);
const before=await p.evaluate(()=>SLOTS.map(([s])=>{let x=0;SCHED[s].T.rows.forEach(r=>{if(MEALS[r[1]])x+=mealMac(r[1]).p});return x}));
await p.click('#tg-fit');await p.waitForTimeout(800);
const after=await p.evaluate(()=>SLOTS.map(([s])=>{let x=0,k=0;SCHED[s].T.rows.forEach(r=>{if(MEALS[r[1]]){const m=mealMac(r[1]);x+=m.p;k+=m.kcal}});return Math.round(x)+'P/'+Math.round(k)}));
console.log('   protein before',before.join(' '),'| after',after.join(' '));
ok('protein brought down towards 192g, calories kept',after.every(v=>{const [pp,kk]=v.split('P/').map(Number);return pp<=215&&Math.abs(kk-3090)<=3090*0.025}),after.join(' '));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
