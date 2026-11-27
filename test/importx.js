const { chromium } = require('playwright');const fs=require('fs');
const SP=(process.env.SHOTS||'/tmp/gym-shots/')+'';
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('library'));await p.click('#imp-box summary');
// Hevy CSV file
await p.click('#imp-file-btn').catch(()=>{});await p.setInputFiles('#imp-file',__dirname+'/fixtures/hevy.csv');await p.waitForTimeout(400);
let out=await p.$eval('#imp-out',e=>e.innerText.replace(/\n+/g,' | '));console.log('   hevy:',out.slice(0,420));
ok('Hevy CSV recognised',/Read as: Hevy/.test(out)&&/5 exercises/.test(out)&&/Also import 2 workouts/.test(out));
ok('hammer curl already known',/Hammer Curl \| Already in your library/.test(out));
await p.screenshot({path:SP+'import.png',fullPage:false});
await p.click('#imp-go');await p.waitForTimeout(800);
const r=await p.evaluate(()=>({lib:['Lat Pulldown (Cable)','Incline Bench Press (Dumbbell)','Hip Thrust (Barbell)'].map(n=>exInfo(n)&&exInfo(n).p),w:D.workouts.filter(w=>w.source==='import').map(w=>w.date+' '+w.title+' '+w.exercises.map(e=>e.name+':'+e.sets.map(s=>s.kg+'x'+s.reps).join(',')).join(' / '))}));
console.log('   result:',JSON.stringify(r));
ok('exercises added with muscles',r.lib.join()==='Lats,Chest,Glutes');
ok('history imported without warm-ups',r.w.length===2&&r.w.some(x=>/2026-11-03 Upper Lat Pulldown \(Cable\):62.5x9,62.5x8/.test(x)));
ok('message shown',/Added 3 exercises and 2 workouts/.test(await p.$eval('#lib-imp-msg',e=>e.textContent)));
ok('lift dashboard picks them up',await p.evaluate(()=>!!liftHistory()['lat pulldown (cable)']));
// re-import is skipped
await p.click('#imp-box summary');await p.setInputFiles('#imp-file',__dirname+'/fixtures/hevy.csv');await p.waitForTimeout(300);await p.click('#imp-go');await p.waitForTimeout(500);
ok('re-import skips duplicates',/already there/.test(await p.$eval('#lib-imp-msg',e=>e.textContent))&&await p.evaluate(()=>D.workouts.filter(w=>w.source==='import').length)===2);
// Strong CSV in lb
await p.click('#imp-box summary');await p.setInputFiles('#imp-file',__dirname+'/fixtures/strong.csv');await p.waitForTimeout(300);
out=await p.$eval('#imp-out',e=>e.innerText.replace(/\n+/g,' | '));ok('Strong recognised, lb selected',/Read as: Strong/.test(out)&&await p.$eval('[data-impu="lb"]',e=>e.getAttribute('aria-pressed'))==='true');
await p.click('#imp-go');await p.waitForTimeout(500);
const bp=await p.evaluate(()=>D.workouts.find(w=>w.title==='Push').exercises[0].sets[0].kg);ok('lb converted to kg',Math.abs(bp-61.23)<0.1,bp);
// plain list
await p.click('#imp-box summary');await p.fill('#imp-text','- Cable crunch\n- Face pull\n- Smith machine squat\nSeated row');await p.click('#imp-read');await p.waitForTimeout(200);
out=await p.$eval('#imp-out',e=>e.innerText.replace(/\n+/g,' | '));console.log('   list:',out.slice(0,300));
ok('plain list read',/Read as: List/.test(out)&&/4 exercises/.test(out));await p.click('#imp-go');await p.waitForTimeout(400);
ok('list added',await p.evaluate(()=>['Cable crunch','Face pull','Smith machine squat','Seated row'].every(n=>D.exdb[norm(n)])));
// Setgraph share
await p.click('#imp-box summary');await p.fill('#imp-text','Cybex Leg Curl • 150 kg: 9, 8 rep\nSl Leg Press • 2 sets: 8 rep 45 kg\n\nStrength Training • 42 min\n\nTracked on Setgraph');await p.click('#imp-read');await p.waitForTimeout(200);
out=await p.$eval('#imp-out',e=>e.innerText.replace(/\n+/g,' | '));ok('Setgraph share read',/Read as: Setgraph/.test(out)&&/2 exercises/.test(out),out.slice(0,200));
await p.reload();await p.waitForTimeout(900);ok('imports survive reload',await p.evaluate(()=>!!D.exdb['face pull']&&D.workouts.filter(w=>w.source==='import').length===3));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
