const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const TXT=`Cybex Leg Curl • 150 kg: 9, 8 rep
Back Squat • 7 rep 40 kg
Hack Squat  • 5 rep 52.5 kg, 7 rep 45 kg
Sl Leg Press • 2 sets: 8 rep 45 kg
Primal leg extension  • 10 rep 102 kg
HYPER Extension • 2 sets: 10 rep 20 kg
Leg Raise Bench • 2 sets: 10 rep

Strength Training • 42 min

Tracked on Setgraph`;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(t=>{const w=parseSetgraph(t);return {title:w.title,minutes:w.minutes,ex:w.exercises.map(e=>e.name+(e.was?" <- "+e.was:"")+": "+e.sets.map(s=>s.kg+"x"+s.reps).join(" "))}},TXT);
console.log(JSON.stringify(r,null,1));
console.log('looks:',await p.evaluate(t=>looksSetgraph(t),TXT),'| hevy text looks:',await p.evaluate(()=>looksSetgraph("Push\nSet 1: 50 kg x 9")));
// full UI path
await p.evaluate(()=>goTo('settings'));await p.waitForTimeout(300);
await p.evaluate(()=>{document.querySelectorAll('details.card').forEach(d=>d.open=true)});
await p.fill('#g-paste',TXT);await p.click('#g-parse');await p.waitForTimeout(300);
console.log('preview title:',await p.$eval('#g-title',e=>e.value),'| date:',await p.$eval('#g-date',e=>e.value));
await p.screenshot({path:SH+'sg-preview.png',fullPage:true});
await p.click('#g-save');await p.waitForTimeout(500);
console.log('saved; gym next label:',await p.$eval('#w-next',e=>e.textContent));
await p.click('#tab-today');await p.waitForTimeout(300);
console.log('today pill:',await p.$eval('#today-pill',e=>e.textContent));
console.log('planned next 5 days:',await p.evaluate(()=>[0,1,2,3,4].map(i=>{const d=addDays(TODAY,i);return WD(d)+" "+(plannedWorkout(d)||"-")}).join(" | ")));
console.log('ERR',errs);await b.close()})();
