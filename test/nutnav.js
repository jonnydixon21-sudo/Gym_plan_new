// Nutrition home (today's intake + tiles), sub-pages with a back button, and Settings opened from the cog on Today.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null},sel);
// tick off the first meal today
const first=await p.evaluate(async()=>{const r=rowsFor(dayInfo(TODAY)).filter(r=>MEALS[r[1]]);if(!r.length)return null;const c={date:TODAY,eaten:{[r[0][1]]:true},extras:[]};await saveFood(TODAY,c);return MEALS[r[0][1]].m});
await p.click('#tab-nutrition');await p.waitForTimeout(400);
ok('opens on Nutrition home',await vis('#hub-nutrition')&&!(await vis('[data-hubhead="nutrition"]')));
const home=await p.evaluate(()=>document.getElementById('hub-nutrition').innerText);
ok("today's intake with rings",/today's intake/i.test(home)&&(await p.$$('#hub-nutrition .ring')).length===4);
ok('meals listed with status',first?new RegExp(first.replace(/[&()]/g,'.')+'\\s*Completed').test(home)&&/Pending/.test(home):true,home.slice(0,300).replace(/\n/g,' | '));
ok('tiles',(await p.$$eval('#hub-nutrition [data-sub]',e=>e.map(x=>x.dataset.sub.split(':')[1]).join()))==='foods,meals,shop,prep,targets');
ok('no chips on Nutrition',(await p.$$('#sec-nutrition .subtabs')).length===0);
for(const [k,pane,title] of [['meals','#food-meals','Meals'],['foods','#food-lib','Food library'],['shop','#food-shop','Shopping list'],['prep','#food-prep','Meal prep'],['targets','#pane-targets','Targets']]){
  await p.click(`#hub-nutrition [data-sub="nutrition:${k}"]`);await p.waitForTimeout(300);
  ok(k+' opens as its own page',await vis(pane)&&!(await vis('#hub-nutrition'))&&await vis('[data-hubback="nutrition"]')&&(await p.$eval('[data-hubhead="nutrition"] .hubtitle',e=>e.textContent))===title);
  if(k==='foods'){await p.screenshot({path:SH+'nut-foods.png'});
    await p.fill('#fl-q','banana');await p.waitForTimeout(150);const t=await p.$eval('#fl-list',e=>e.innerText);ok('food search',/banana/i.test(t)&&!/Almond butter/.test(t),t.slice(0,120).replace(/\n/g,' | '));await p.fill('#fl-q','');
    ok('your foods and removed items here',await p.evaluate(()=>!!document.querySelector('#food-lib #myfoods')&&!!document.querySelector('#food-lib #rmmeals')&&!document.getElementById('hidden-card')));}
  if(k==='prep'){await p.goBack();await p.waitForTimeout(300);ok('phone back goes to Nutrition',await vis('#hub-nutrition'))}
  else{await p.click('[data-hubback="nutrition"]');await p.waitForTimeout(300);ok(k+': back button goes to Nutrition',await vis('#hub-nutrition'))}}
// ticking a meal on Today updates the Nutrition home
await p.evaluate(async()=>{const r=rowsFor(dayInfo(TODAY)).filter(r=>MEALS[r[1]]);if(r[1]){const c={...(D.food[TODAY]||{}),date:TODAY};c.eaten={...(c.eaten||{}),[r[1][1]]:true};await saveFood(TODAY,c)}});await p.waitForTimeout(400);
ok('updates when food is ticked',await p.evaluate(()=>(document.getElementById('hub-nutrition').innerText.match(/Completed/g)||[]).length>=2));
await p.screenshot({path:SH+'nut-home.png',fullPage:true});
await p.click('#nut-today');await p.waitForTimeout(300);ok("intake header opens Today",await vis('#view-today'));
// settings
ok('no Settings tab at the bottom',!(await vis('#tab-settings'))&&(await p.$$eval('.tabs .tab',e=>e.filter(x=>x.offsetParent!==null).length))===5);
ok('cog top right on Today',await vis('#hero-cog'));
await p.screenshot({path:SH+'today-cog.png'});
await p.click('#hero-cog');await p.waitForTimeout(300);ok('cog opens Settings',await vis('#view-settings')&&await vis('#hero-back'));
await p.goBack();await p.waitForTimeout(300);ok('phone back returns to Today',await vis('#view-today'));
await p.click('#hero-cog');await p.waitForTimeout(200);await p.click('#hero-back');await p.waitForTimeout(300);ok('‹ Today returns to Today',await vis('#view-today'));
await p.click('#tab-training');await p.waitForTimeout(200);ok('cog only on Today',!(await vis('#hero-cog')));
const w=await p.$$eval('.tabs .tab',e=>e.filter(x=>x.offsetParent!==null).map(x=>Math.round(x.getBoundingClientRect().width)));ok('5 tabs share the width',w.length===5&&Math.max(...w)-Math.min(...w)<=2&&w.reduce((a,b)=>a+b,0)>=370,w.join(','));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
