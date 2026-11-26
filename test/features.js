const { chromium } = require('playwright');const fs=require('fs');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// weigh-ins over 3 weeks: 87.2 -> 88.0
await p.evaluate(async()=>{const base=[87.2,87.3,87.1,87.6,87.5,87.7,87.8,87.9,88.1,88.0];for(let i=0;i<base.length;i++){await saveCheckin(addDays(TODAY,i-9),{weight:base[i]})}});
await p.waitForTimeout(400);
await p.evaluate(()=>goTo('body'));await p.waitForTimeout(300);
console.log('stats:',await p.$$eval('#prog-stats .stat',e=>e.map(x=>x.textContent.replace(/\s+/g,' '))));
// workout for PB
await p.evaluate(async()=>{await db.doc("workouts/t1").set({date:addDays(TODAY,-3),title:"Legs A",exercises:[{name:"Hack squat",sets:[{kg:100,reps:6}]}]});await db.doc("workouts/t2").set({date:addDays(TODAY,-1),title:"Legs A",exercises:[{name:"Hack squat",sets:[{kg:90,reps:8}]}]})});
await p.evaluate(()=>goTo('gym'));await p.waitForTimeout(300);
console.log('lift row:',await p.$eval('#ex-list .ex small',e=>e.textContent));
await p.evaluate(()=>goTo('body'));
// text size + theme
await p.evaluate(()=>show('today'));await p.click('#hero-cog');await p.click('[data-z="1.25"]');console.log('zoom:',await p.evaluate(()=>document.documentElement.style.zoom));
await p.click('[data-th="light"]');console.log('theme attr:',await p.evaluate(()=>document.documentElement.getAttribute('data-theme')));
await p.click('[data-th=""]');await p.click('[data-z="1"]');
// export
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#bk-export')]);
const path=(process.env.SHOTS||'/tmp/gym-shots/')+'bk.json';await dl.saveAs(path);
const j=JSON.parse(fs.readFileSync(path,'utf8'));console.log('backup:',dl.suggestedFilename(),'docs',j.docs.length,'blobs',j.blobs.length,'app',j.app,'|',await p.$eval('#bk-last',e=>e.textContent));
// ics
const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#ics-btn')]);await d2.saveAs(path+'.ics');
const ics=fs.readFileSync(path+'.ics','utf8');console.log('ics events:',(ics.match(/BEGIN:VEVENT/g)||[]).length,'alarms',(ics.match(/BEGIN:VALARM/g)||[]).length);
console.log(ics.split('BEGIN:VEVENT').slice(1,4).map(x=>x.replace(/\r?\n/g,' | ')).join('\n'));
const gym=ics.split('BEGIN:VEVENT').filter(x=>/SUMMARY:Gym/.test(x)).slice(0,3).map(x=>x.match(/DTSTART:(\S+)/)[1]+' '+x.match(/SUMMARY:(.*)/)[1].trim());console.log(gym);
// night after-midnight check
const night=ics.split('BEGIN:VEVENT').slice(1).filter(x=>/T0100/.test(x.match(/DTSTART:(\S+)/)[1])).slice(0,2).map(x=>x.match(/DTSTART:(\S+)/)[1]+' '+x.match(/SUMMARY:(.*)/)[1].trim());console.log('01:00 events',night);
// restore into new context
const ctx2=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q=await ctx2.newPage();q.on('dialog',d=>d.accept());q.on('pageerror',e=>errs.push('q:'+e.message));
await q.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await q.goto(U);await q.waitForTimeout(900);
console.log('fresh workouts:',await q.evaluate(()=>D.workouts.length));
await q.evaluate(()=>show('today'));await q.click('#hero-cog');await q.setInputFiles('#bk-file',path);await q.waitForTimeout(1800);
await q.waitForLoadState();await q.waitForTimeout(800);
console.log('restored workouts:',await q.evaluate(()=>D.workouts.length),'checkins:',await q.evaluate(()=>D.checkins.length));
console.log('errors:',errs);await b.close()})();
