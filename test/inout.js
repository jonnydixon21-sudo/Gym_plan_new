const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();
for(const scheme of ['light','dark']){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:scheme});
const p=await ctx.newPage();await p.clock.setFixedTime(new Date('2026-11-12T10:00:00'));const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
if(scheme==='light'){
// --- single food in a day plan ---
await p.evaluate(()=>goTo('schedule','days'));await p.waitForTimeout(300);
const n0=await p.evaluate(()=>PED.rows.length);
await p.click('#pe-add');await p.waitForTimeout(200);const i=await p.evaluate(()=>PED.rows.length-1);
await p.selectOption(`[data-pk="${i}"]`,'food');await p.waitForTimeout(400);
ok('food row shows food + amount',await p.evaluate(i=>!!document.querySelector(`[data-sfk="${i}"]`)&&!!document.querySelector(`[data-sfa="${i}"]`),i));
await p.selectOption(`[data-sfk="${i}"]`,'bagel');await p.waitForTimeout(300);await p.fill(`[data-sfa="${i}"]`,'2');await p.dispatchEvent(`[data-sfa="${i}"]`,'change');await p.waitForTimeout(300);
await p.fill(`[data-pt="${i}"]`,'15:30');await p.click('#pe-save');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const row=SCHED.day.T.rows.find(r=>MEALS[r[1]]&&MEALS[r[1]].solo);return row?{t:row[0],m:MEALS[row[1]].m,it:MEALS[row[1]].items,kcal:mealMac(row[1]).kcal}:null});
ok('bagel saved to the day plan',await p.evaluate(()=>{const rs=SCHED.day.T.rows;const i=rs.findIndex(r=>MEALS[r[1]]&&MEALS[r[1]].solo);return i>0&&rs[i-1][0]<='15:30'&&rs[i+1][0]>'15:30'})&&r&&r.m==='Bagel thins'&&r.it[0][0]==='bagel'&&r.it[0][1]===2&&r.kcal===240,JSON.stringify(r));
await p.evaluate(()=>document.querySelector('[data-sfk]').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'solo-plan.png'});
ok('not listed as a meal',await p.evaluate(()=>{goTo('nutrition','meals');return !/Bagel thins/.test(document.getElementById('plans').innerText.split('\n').filter(l=>/^Bagel thins$/.test(l.trim())).join())}));
// shows on Today for a day shift date
const ds=await p.evaluate(()=>{for(let i=0;i<9;i++){const d=addDays(TODAY,i);const x=dayInfo(d);if(x.slot==='day'&&x.type==='T')return d}});
ok('appears on that day\'s plan',await p.evaluate(d=>rowsFor(dayInfo(d)).some(r=>MEALS[r[1]]&&MEALS[r[1]].m==='Bagel thins'),ds));
// one-off single food
await p.evaluate(d=>goPlan(d),ds);await p.waitForTimeout(300);await p.evaluate(()=>{document.getElementById('once-add').open=true});
await p.selectOption('#oa-type','food');await p.selectOption('#oa-food','banana');await p.fill('#oa-at','16:00');await p.click('#oa-save');await p.waitForTimeout(400);
ok('one-off single food',await p.evaluate(d=>rowsFor(dayInfo(d)).some(r=>r[0]==='16:00'&&MEALS[r[1]]&&MEALS[r[1]].solo&&MEALS[r[1]].items[0][0]==='banana'),ds));
}
// --- daily log + calories burned ---
await p.evaluate(()=>goTo('today'));await p.waitForTimeout(200);
ok('Daily log title',await p.evaluate(()=>/Daily log/i.test(document.querySelector('[data-fold="log"] summary').innerText)));
await p.fill('#a-burn','2950');await p.click('#log-save');await p.waitForTimeout(300);
ok('burned saved',await p.evaluate(()=>D.habits[VIEW].burned===2950));
// seed 10 days of eaten + burned
await p.evaluate(async()=>{for(let i=1;i<=10;i++){const d=addDays(TODAY,-i);await db.doc('habits/'+d).set({date:d,burned:2800+i*20});await saveFood(d,{date:d,eaten:{},extras:[{name:'Food',kcal:2950+(i%3)*80,p:180,c:350,f:70}]})}});await p.waitForTimeout(500);
await p.evaluate(()=>goTo('progress','body'));await p.waitForTimeout(400);
const wk=await p.evaluate(()=>document.getElementById('week-card').innerText.replace(/\n/g,' | '));ok('week tiles eaten + burned',/Calories eaten/i.test(wk)&&/Calories burned/i.test(wk)&&/over 7 days/.test(wk),wk.slice(-300));
const io=await p.evaluate(()=>({bars:document.querySelectorAll('#io-card .iog').length,e:document.querySelectorAll('#io-card path.ioe').length,bb:document.querySelectorAll('#io-card path.iob').length,t:document.getElementById('io-card').innerText}));
ok('chart 14 days with both series',io.bars===14&&io.e>=10&&io.bb>=11,JSON.stringify({b:io.bars,e:io.e,bb:io.bb}));
ok('balance + target shown',/Balance/i.test(io.t)&&/Your target/i.test(io.t)&&/On track|Not enough|Eating more/.test(io.t),io.t.slice(0,400));
await p.click('#io-card [data-io="12"]');await p.waitForTimeout(150);ok('tap shows the day',/Eaten [\d,]+ · Burned [\d,]+/.test(await p.textContent('#io-card .iotip')));
await p.click('[data-ion="7"]');await p.waitForTimeout(150);ok('7-day range',await p.evaluate(()=>document.querySelectorAll('#io-card .iog').length===7));
await p.click('[data-ion="14"]');await p.click('#io-card [data-io="11"]');
await p.evaluate(()=>document.getElementById('io-card').scrollIntoView({block:'start'}));await p.waitForTimeout(200);await p.screenshot({path:SH+`inout-${scheme}.png`});
console.log('   errors',errs);if(errs.length)fails++;await ctx.close()}
await b.close();console.log('FAILS',fails);process.exit(fails?1:0)})();
