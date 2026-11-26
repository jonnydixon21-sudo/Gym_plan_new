const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.clock.setFixedTime(new Date('2026-11-16T12:00:00'));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
// daily log
await p.evaluate(()=>goTo('today'));await p.waitForTimeout(200);
ok('cardio gone',await p.evaluate(()=>{const l=document.querySelector('label[for="a-cmin"]');return l.hidden&&!/Cardio/.test(document.querySelector('[data-fold="log"]').innerText)}));
const w=await p.evaluate(()=>[document.getElementById('sl-h').getBoundingClientRect().width,document.getElementById('sl-m').getBoundingClientRect().width]);ok('sleep boxes wider',w[0]>=70&&w[1]>=70,w.join());
await p.fill('#sl-h','7');await p.fill('#sl-m','45');await p.evaluate(()=>document.getElementById('sl-h').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'dlog.png'});
// rugby: a Wednesday, weekly, rugby only
const wed=await p.evaluate(()=>{for(let i=0;i<8;i++){const d=addDays(TODAY,i);if(pd(d).getDay()===3)return d}});
const before=await p.evaluate(d=>({gym:gymDay(d),pw:plannedWorkout(d)}),wed);
await p.evaluate(d=>goPlan(d),wed);await p.waitForTimeout(300);
await p.click('#rota-rugby [data-rug="training"]');await p.waitForTimeout(400);
ok('rugby added, gym removed that day',await p.evaluate(d=>{const i=dayInfo(d),rs=rowsFor(i);return i.rugby&&i.rugby.kind==='training'&&!gymDay(d)&&!rs.some(r=>r[1]==='train')&&rs.some(r=>r[2]==='Rugby training'&&r[0]==='19:00')&&plannedWorkout(d)===null&&i.type==='T'},wed));
await p.fill('#rug-at','18:30');await p.dispatchEvent('#rug-at','change');await p.waitForTimeout(300);
await p.check('#rug-weekly');await p.waitForTimeout(400);
ok('weekly rugby on every Wednesday',await p.evaluate(d=>[0,7,14].every(k=>{const x=dayInfo(addDays(d,k));return x.rugby&&x.rugby.at==='18:30'&&x.rugby.weekly})&&!dayInfo(addDays(d,1)).rugby,wed));
ok('split moves to next gym day',await p.evaluate(([d,pw])=>{for(let i=1;i<6;i++){const x=addDays(d,i);if(gymDay(x))return plannedWorkout(x)===pw}return false},[wed,before.pw]),before.pw);
ok('rota bar says Rugby',await p.evaluate(d=>{const b=document.querySelector(`.rd[data-rd="${d}"]`);return b&&/rugby/i.test(b.innerText)},wed),await p.evaluate(d=>{const b=document.querySelector(`.rd[data-rd="${d}"]`);return b?b.outerHTML.slice(0,400):'none '+[...document.querySelectorAll('.rd')].map(x=>x.dataset.rd).join()},wed));
await p.evaluate(()=>document.getElementById('rota-rugby').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'rugby.png'});
// one week off: none on a weekly day
const next=await p.evaluate(d=>addDays(d,7),wed);await p.evaluate(d=>goPlan(d),next);await p.waitForTimeout(300);
await p.click('#rota-rugby [data-rug="none"]');await p.waitForTimeout(300);ok('skip one week only',await p.evaluate(([a,b])=>!dayInfo(b).rugby&&!!dayInfo(addDays(b,7)).rugby&&!!dayInfo(a).rugby,[wed,next]));
// keep gym option
await p.evaluate(d=>goPlan(d),wed);await p.waitForTimeout(200);await p.uncheck('#rug-nogym');await p.waitForTimeout(300);
ok('rugby plus gym',await p.evaluate(d=>gymDay(d)&&rowsFor(dayInfo(d)).some(r=>r[1]==='train')&&rowsFor(dayInfo(d)).some(r=>r[2]==='Rugby training'),wed));
await p.check('#rug-nogym');await p.waitForTimeout(200);
// match one-off on a rest day
const sat=await p.evaluate(()=>{for(let i=0;i<9;i++){const d=addDays(TODAY,i);if(pd(d).getDay()===6)return d}});
await p.evaluate(d=>goPlan(d),sat);await p.waitForTimeout(200);await p.click('#rota-rugby [data-rug="match"]');await p.waitForTimeout(300);
ok('one-off match',await p.evaluate(d=>dayInfo(d).rugby.kind==='match'&&!dayInfo(d).rugby.weekly&&rowsFor(dayInfo(d)).some(r=>r[2]==='Rugby match'),sat));
await p.reload();await p.waitForTimeout(1000);ok('persists',await p.evaluate(([a,b])=>dayInfo(a).rugby&&dayInfo(a).rugby.weekly&&dayInfo(b).rugby.kind==='match',[wed,sat]));
// month dot
await p.evaluate(()=>goTo('schedule','shifts'));await p.click('[data-rv="month"]');await p.waitForTimeout(200);ok('month shows rugby dots',await p.evaluate(()=>document.querySelectorAll('#rota-month .rdot.rug').length>=3));
await p.click('[data-rv="personal"]');
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
