const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// backup reminder
ok('no reminder with no data',await p.evaluate(()=>document.getElementById('bk-rem').hidden));
await p.evaluate(async()=>{await db.doc('checkins/'+addDays(TODAY,-4)).set({date:addDays(TODAY,-4),weight:87.6,photos:[]})});await p.waitForTimeout(400);
ok('reminder shows with data and no backup',await p.evaluate(()=>!document.getElementById('bk-rem').hidden&&/haven't made a backup/.test(document.getElementById('bk-rem').innerText)));
await p.screenshot({path:SH+'bkrem.png'});
await p.click('#bkr-later');await p.waitForTimeout(150);ok('snooze hides it',await p.evaluate(()=>document.getElementById('bk-rem').hidden&&L.bkSnooze===addDays(TODAY,3)));
await p.evaluate(()=>{L.bkSnooze=null;L.lastBackup=addDays(TODAY,-3);saveL();renderToday()});ok('recent backup: hidden',await p.evaluate(()=>document.getElementById('bk-rem').hidden));
await p.evaluate(()=>{L.lastBackup=addDays(TODAY,-9);saveL();renderToday()});ok('9 days: shows',await p.evaluate(()=>/9 days ago/.test(document.getElementById('bk-rem').innerText)));
// recent foods
await p.evaluate(async()=>{const y=addDays(TODAY,-1);await saveFood(y,{date:y,eaten:{},extras:[{name:'Protein bar',kcal:220,p:20,c:22,f:7},{name:'Banana',kcal:105,p:1,c:27,f:0}]})});await p.waitForTimeout(300);
await p.evaluate(()=>{document.querySelector('details.extra').open=true});
const chips=await p.$$eval('#x-recent [data-xrec]',e=>e.map(x=>x.innerText.replace(/\n/g,' ')));ok('recent chips',chips.length===2&&/Banana/.test(chips[0]),chips.join('|'));
await p.click('#x-recent [data-xrec="1"]');await p.waitForTimeout(300);ok('tap adds to today',await p.evaluate(()=>(D.food[TODAY].extras||[]).some(x=>x.name==='Protein bar'&&x.kcal===220)));
await p.evaluate(()=>document.querySelector('details.extra').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'recent.png'});
// leave
await p.evaluate(()=>goTo('schedule','shifts'));await p.waitForTimeout(200);
const d1=await p.evaluate(()=>addDays(TODAY,2)),d2=await p.evaluate(()=>addDays(TODAY,4));
await p.evaluate(()=>{document.querySelector('.leavebox').open=true});await p.fill('#lv-from',d1);await p.fill('#lv-to',d2);await p.click('#lv-save');await p.waitForTimeout(600);
ok('leave booked 3 days',await p.evaluate(a=>[0,1,2].every(i=>{const x=dayInfo(addDays(a,i));return x.ot==='leave'&&x.label==='Annual leave'&&(x.slot==='off'||x.slot==='off1')&&!rowsFor(x).some(r=>r[1]==='work')}),d1),await p.textContent('#lv-msg'));
ok('bar shows leave',await p.evaluate(a=>{const b=document.querySelector(`.rd[data-rd="${a}"]`);return b&&b.classList.contains('k-leave')&&/Leave/.test(b.innerText)},d1));
await p.screenshot({path:SH+'leave.png'});
await p.click('[data-rv="month"]');await p.waitForTimeout(200);ok('month shows leave',await p.evaluate(()=>document.querySelectorAll('#rota-month .mc.k-leave').length===3));
await p.click('[data-rv="personal"]');await p.evaluate(()=>{document.querySelector('.leavebox').open=true});await p.fill('#lv-from',d1);await p.fill('#lv-to',d2);await p.click('#lv-clear');await p.waitForTimeout(600);
ok('leave cleared',await p.evaluate(a=>dayInfo(a).ot!=='leave',d1));
// night helper rows
const n1=await p.evaluate(()=>{for(let i=0;i<9;i++){const d=addDays(TODAY,i);if(dayInfo(d).slot==='n1')return d}});
const rows=await p.evaluate(d=>rowsFor(dayInfo(d)).map(r=>r[0]+' '+(r[2]||r[1])).join(' | '),n1);console.log('   n1 rows:',rows);
ok('last caffeine row 8h before bed',/23:30 Last caffeine/.test(rows),rows);
await p.evaluate(()=>{L.nightHelp=false;saveL()});ok('can turn off',await p.evaluate(d=>!rowsFor(dayInfo(d)).some(r=>/Last caffeine/.test(r[2]||'')),n1));await p.evaluate(()=>{L.nightHelp=true;saveL()});
// two runs a day
await p.evaluate(()=>goTo('schedule','rundays'));await p.waitForTimeout(200);await p.click('#rb-add');await p.selectOption('[data-rbd="3"]','6');await p.fill('[data-rbt="3"]','08:00');await p.fill('[data-rbn="3"]','shakeout');await p.click('#rp-save');await p.waitForTimeout(300);
ok('two runs saved',await p.textContent('#rp-msg').then(t=>/Saved/.test(t)),await p.textContent('#rp-msg'));
const d6=await p.evaluate(()=>{for(let i=0;i<9;i++){const d=addDays(TODAY,i);if(dayInfo(d).idx===6)return d}});
const r6=await p.evaluate(d=>rowsFor(dayInfo(d)).filter(r=>r[3]==='run').map(r=>r[0]+' '+r[2]).join(' | '),d6);ok('both runs on the day',/08:00 Easy run · shakeout/.test(r6)&&/Long run/.test(r6),r6);
ok('run box list keeps both',await p.evaluate(()=>{rpdLoad();return RPD.list.filter(r=>r.day===6).length===2}));
await p.click('#rb-add');await p.selectOption('[data-rbd="4"]','6');await p.click('#rp-save');await p.waitForTimeout(200);ok('three blocked',/three runs/.test(await p.textContent('#rp-msg')));
// csv
await p.evaluate(()=>goTo('settings'));await p.waitForTimeout(200);
ok('csv weight',await p.evaluate(()=>{const r=csvData('weight');return r.length===2&&r[1][1]===87.6}));
ok('csv food',await p.evaluate(()=>csvData('food').length>=2));
ok('night helper toggle in settings',await p.evaluate(()=>document.getElementById('nh-on').checked));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
