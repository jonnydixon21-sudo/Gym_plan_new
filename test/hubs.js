// Training, Progress and Schedule open on a summary page with tiles; each part is its own page with a back button.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null},sel);
await p.evaluate(async()=>{for(let i=0;i<8;i++)await saveCheckin(addDays(TODAY,-7+i),{weight:88+i*0.05})});
const T={training:['gym','run','library'],progress:['body','lifts','photos','coach'],schedule:['shifts','days','rundays']};
const pane={gym:'view-gym',run:'view-run',library:'view-library',body:'view-progress',lifts:'view-lifts',photos:'view-photos',coach:'view-coach',shifts:'food-shifts',days:'food-days',rundays:'pane-rundays'};
for(const [t,ks] of Object.entries(T)){
  await p.click('#tab-'+t);await p.waitForTimeout(300);
  ok(t+' opens on its home page',await vis('#hub-'+t)&&!(await vis(`[data-hubhead="${t}"]`)));
  ok(t+' tiles',(await p.$$eval(`#hub-${t} [data-sub]`,e=>e.map(x=>x.dataset.sub.split(':')[1]).join()))===ks.join());
  await p.screenshot({path:SH+'hub-'+t+'.png',fullPage:true});
  for(const k of ks){await p.click(`#hub-${t} [data-sub="${t}:${k}"]`);await p.waitForTimeout(250);
    ok(`  ${k} is its own page`,await vis('#'+pane[k])&&!(await vis('#hub-'+t))&&await vis(`[data-hubback="${t}"]`));
    if(k===ks[1]){await p.goBack();await p.waitForTimeout(300);ok(`  phone back from ${k}`,await vis('#hub-'+t))}
    else{await p.click(`[data-hubback="${t}"]`);await p.waitForTimeout(250);ok(`  back button from ${k}`,await vis('#hub-'+t))}}}
// training summary
await p.click('#tab-training');await p.waitForTimeout(300);
const tr=await p.$eval('#hs-training',e=>e.innerText);ok('training summary',/next workout|done today/i.test(tr)&&/Last 7 days/.test(tr),tr.replace(/\n/g,' | ').slice(0,160));
const nu=await p.$('#hs-training [data-hubgo]');if(nu){await nu.click();await p.waitForTimeout(400);ok('next workout button opens Gym',await vis('#view-gym'))}
// progress summary
await p.click('#tab-progress');await p.waitForTimeout(300);const pr=await p.$eval('#hs-progress',e=>e.innerText);ok('weight on Progress home',/88\.\d/.test(pr)&&/kg\/week/.test(pr),pr.replace(/\n/g,' | ').slice(0,160));
// schedule summary
await p.click('#tab-schedule');await p.waitForTimeout(300);ok('7 days listed',(await p.$$('#hs-schedule [data-scday]')).length===7);
const d2=await p.$eval('#hs-schedule [data-scday]:nth-child(1)',e=>e.dataset.scday).catch(()=>null);
await p.click('#hs-schedule li:nth-child(3) [data-scday]');await p.waitForTimeout(400);
ok('tapping a day opens it in the rota',await vis('#food-shifts')&&await p.evaluate(()=>!!document.getElementById('rota-title').textContent));
await p.click('[data-hubback="schedule"]');await p.waitForTimeout(300);ok('back to Schedule home',await vis('#hub-schedule'));
// tab bar always returns to home
await p.click('[data-sub="schedule:days"]');await p.waitForTimeout(200);await p.click('#tab-today');await p.click('#tab-schedule');await p.waitForTimeout(250);ok('tab opens home again',await vis('#hub-schedule'));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
