const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const errs=[];
const start=async port=>{const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
  await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(1000);
  await p.evaluate(()=>{L.profile=L.profile||{name:'Test',mode:'cut',startDate:TODAY,startWeight:90,goalWeight:85,units:{w:'kg',l:'in'}};L.trialMealsFixed=1;saveL()});await p.reload();await p.waitForTimeout(1200);
  await p.evaluate(()=>{const s=document.getElementById('setup');if(s&&!s.hidden)s.hidden=true;const v=document.getElementById('vid-x');if(v)v.click()});
  await p.evaluate(()=>show('training','gym'));await p.waitForTimeout(400);await p.evaluate(()=>{const d=document.getElementById('w-start');if(d)d.open=true});
  await p.click('#w-tpls button');await p.waitForTimeout(500);await p.click('#pv-start');await p.waitForTimeout(800);return p};
const shown=(p,sel)=>p.$$eval(sel,x=>x.some(e=>e.offsetParent!==null));
const m=await start(8791);
ok('main: rest picker shown',await shown(m,'.restpick'));ok('main: RIR shown',await shown(m,'select.rir'));ok('main: Failed/Spotted/Cheat shown',await shown(m,'.setx'));
const p=await start(8795);
ok('trial: rest picker hidden',!(await shown(p,'.restpick')));ok('trial: RIR hidden',!(await shown(p,'select.rir')));
ok('trial: RIR header hidden',!/RIR/.test(await p.$eval('.set.hd',e=>e.innerText)));ok('trial: Failed/Spotted/Cheat hidden',!(await shown(p,'.setx')));
ok('trial: kg, reps and done still there',await shown(p,'.set [data-f="kg"]')&&await shown(p,'.set [data-f="reps"]')&&await shown(p,'.set .ok'));
await p.screenshot({path:SH+'simplew.png'});
// log a set
await p.fill('.set [data-f="kg"] >> nth=0','60');await p.fill('.set [data-f="reps"] >> nth=0','8');await p.click('.set .ok >> nth=0');await p.waitForTimeout(400);
ok('trial: a set can still be logged',await p.evaluate(()=>W.exercises[0].sets[0].done===true&&+W.exercises[0].sets[0].kg===60));
ok('trial: rest timer still runs',await p.evaluate(()=>{const r=document.getElementById('rest');return !!r&&!r.hidden}));
// switch it off in Settings
await p.evaluate(()=>{L.simpleW=false;saveL();applyPrefs()});await p.waitForTimeout(200);
ok('trial: switch brings them back',await shown(p,'select.rir')&&await shown(p,'.restpick'));
await p.evaluate(()=>{L.simpleW=true;saveL();applyPrefs();show('settings')});await p.waitForTimeout(300);await p.evaluate(()=>document.querySelectorAll('#view-settings details').forEach(d=>d.open=true));
ok('trial: switch in Settings, on',await p.isVisible('#simplew-on')&&await p.$eval('#simplew-on',e=>e.checked));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
