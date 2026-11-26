const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>goTo('today'));await p.waitForTimeout(200);
const go=async d=>{await p.evaluate(d=>{VIEW=d;renderToday()},d);await p.waitForTimeout(200)};
const sel=async(v)=>{await p.selectOption('#ta-type',v);await p.waitForTimeout(100)};
const open=async()=>{await p.evaluate(()=>{const t=document.getElementById('tadd');if(!t.open){t.open=true}});await p.waitForTimeout(150)};
ok('summary on today',await p.evaluate(()=>document.getElementById('tadd-sum').textContent==="Add to today's plan"));
// rest day ahead
const rest=await p.evaluate(()=>{for(let i=0;i<8;i++){const d=addDays(TODAY,i);if(dayInfo(d).type==='R'&&!dayInfo(d).rugby)return d}});
const gym=await p.evaluate(()=>{for(let i=0;i<8;i++){const d=addDays(TODAY,i);if(gymDay(d))return d}});
ok('found days',!!rest&&!!gym,rest+' '+gym);
await go(rest);await open();
ok('summary on other day',await p.evaluate(()=>/this day's plan/.test(document.getElementById('tadd-sum').textContent)));
// note
await sel('info');await p.fill('#ta-at','09:15');await p.fill('#ta-txt','Dentist');await p.click('#ta-save');await p.waitForTimeout(300);
ok('note in plan',await p.evaluate(d=>rowsFor(dayInfo(d)).some(r=>r[0]==='09:15'&&r[2]==='Dentist')&&/Dentist/.test(document.getElementById('eat').innerText),rest));
// work
await open();await sel('work');await p.fill('#ta-at','06:00');await p.fill('#ta-txt','Overtime until 2pm');await p.click('#ta-save');await p.waitForTimeout(300);
ok('work in plan',await p.evaluate(d=>rowsFor(dayInfo(d)).some(r=>r[1]==='work'&&r[2]==='Overtime until 2pm')&&/Overtime until 2pm/.test(document.getElementById('eat').innerText),rest));
// meal
ok('no meal or food in add-to-plan',await p.evaluate(()=>{const v=[...document.querySelectorAll('#ta-type option')].map(o=>o.value);return !v.includes('meal')&&!v.includes('food')&&v[0]==='train'}));
// meal logged via Ate something
await p.evaluate(()=>{const d=document.querySelector('.eatfoot>details.extra:not(#tadd)');d.open=true});await p.waitForTimeout(150);
const pm=await p.evaluate(()=>{const s=document.getElementById('pm-meal');return [s.options.length,s.options[1]&&s.options[1].value]});ok('meal list filled',pm[0]>3,pm[0]);
await p.selectOption('#pm-meal',pm[1]);await p.fill('#pm-qty','1.5');await p.waitForTimeout(100);
const exp=await p.evaluate(id=>{const m=mealMac(id);return {name:MEALS[id].m+' ×1.5',kcal:Math.round(m.kcal*1.5)}},pm[1]);
await p.click('#pm-add');await p.waitForTimeout(300);
ok('meal added as extra',await p.evaluate(([d,e])=>{const x=(D.food[d]||{}).extras||[];return x.some(y=>y.name===e.name&&y.kcal===e.kcal)},[rest,exp]),JSON.stringify(exp));
ok('shows in plan list',await p.evaluate(n=>document.getElementById('eat').textContent.includes(n),exp.name));
await p.screenshot({path:SH+'atemeal.png'});
await p.evaluate(()=>{document.querySelector('.eatfoot>details.extra:not(#tadd)').open=false});
// run (no usual run this day? either way it shows)
await open();await sel('run');await p.selectOption('#ta-rt','long');await p.fill('#ta-rn','10K');await p.fill('#ta-at','08:00');await p.click('#ta-save');await p.waitForTimeout(300);
ok('run in plan',await p.evaluate(d=>rowsFor(dayInfo(d)).some(r=>r[0]==='08:00'&&/Long run · 10K/.test(r[2]||'')&&r[3]==='run'),rest),await p.evaluate(d=>JSON.stringify(rowsFor(dayInfo(d)).filter(r=>r[3]==='run')),rest));
// gym on rest day
await open();await sel('train');await p.fill('#ta-at','17:30');await p.click('#ta-save');await p.waitForTimeout(400);
ok('rest day became gym day',await p.evaluate(d=>gymDay(d)&&dayInfo(d).type==='T'&&!!plannedWorkout(d),rest));
ok('gym row at chosen time',await p.evaluate(d=>{const c=D.food[d]||{};const tr=rowsFor(dayInfo(d)).find(r=>r[1]==='train');return tr&&((c.times||{}).train||tr[0])==='17:30'},rest));
ok('Today shows Train',await p.evaluate(()=>/Train/.test(document.getElementById('eat').innerText)));
ok('list shows additions',await p.evaluate(()=>{const t=document.getElementById('ta-list').textContent;return /Dentist/.test(t)&&/Gym session/.test(t)&&/Long run/.test(t)&&/Overtime/.test(t)}),await p.evaluate(()=>document.getElementById('ta-list').innerText));
await p.evaluate(()=>{const t=document.getElementById('tadd');t.open=true;t.scrollIntoView({block:'center'})});await p.waitForTimeout(150);await p.screenshot({path:SH+'todayadd.png'});
// reload persists
await p.reload();await p.waitForTimeout(1000);await p.evaluate(()=>goTo('today'));await go(rest);
ok('persists',await p.evaluate(d=>gymDay(d)&&rowsFor(dayInfo(d)).some(r=>r[2]==='Dentist'),rest));
// remove gym
await open();await p.evaluate(()=>[...document.querySelectorAll('#ta-list button[data-ta="gym"]')][0].click());await p.waitForTimeout(400);
ok('gym removed, back to rest',await p.evaluate(d=>!gymDay(d)&&dayInfo(d).type==='R',rest));
await p.evaluate(()=>[...document.querySelectorAll('#ta-list li')].find(l=>/Dentist/.test(l.textContent)).querySelector('button').click());await p.waitForTimeout(300);
ok('remove an add',await p.evaluate(d=>(D.days[d].add||[]).length===1&&!D.days[d].add.some(a=>a[2]==='Dentist'),rest),await p.evaluate(d=>JSON.stringify(D.days[d].add),rest));
// rugby on a gym day, no gym
await go(gym);await open();await sel('rugby');await p.fill('#ta-at','19:30');await p.click('#ta-save');await p.waitForTimeout(400);
ok('rugby only day',await p.evaluate(d=>{const i=dayInfo(d);return i.rugby&&i.rugby.at==='19:30'&&!gymDay(d)&&rowsFor(i).some(r=>r[2]==='Rugby training')},gym));
// then add gym back on the rugby day
await open();await sel('train');await p.fill('#ta-at','12:00');await p.click('#ta-save');await p.waitForTimeout(400);
ok('gym + rugby',await p.evaluate(d=>{const i=dayInfo(d);return gymDay(d)&&i.rugby&&rowsFor(i).some(r=>r[1]==='train')},gym));
await p.evaluate(()=>[...document.querySelectorAll('#ta-list button[data-ta="gym"]')][0].click());await p.waitForTimeout(400);
ok('remove gym -> rugby only again',await p.evaluate(d=>!gymDay(d)&&dayInfo(d).rugby&&dayInfo(d).rugby.noGym,gym));
// rota card "Just for this day" lists a work add sensibly
await p.evaluate(d=>goPlan(d),rest);await p.waitForTimeout(300);
ok('rota once list shows names',await p.evaluate(()=>/Overtime until 2pm/.test(document.getElementById('once-status').innerText)&&!/· Note ·/.test(document.getElementById('once-status').innerText)));
console.log('errors:',JSON.stringify(errs.slice(0,5)));
console.log('FAILS',fails);await b.close()})();
