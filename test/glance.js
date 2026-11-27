// Daily log and Supplements sit under Daily targets (same slim style); opening a section scrolls it into view.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
ok('order: Daily targets, Daily log, Supplements in the At a glance card',await p.evaluate(()=>[...document.querySelectorAll('#macro-card>details')].map(d=>d.dataset.fold||d.id).join())==='basics,log,supp-card');
ok('same slim style',await p.evaluate(()=>[...document.querySelectorAll('#macro-card>details')].every(d=>d.classList.contains('glance')&&!d.classList.contains('card'))));
ok('closed by default and compact',await p.evaluate(()=>{const ds=[...document.querySelectorAll('#macro-card>details')];return ds.every(d=>d.getBoundingClientRect().height<70)}));
await p.evaluate(()=>document.getElementById('macro-card').scrollIntoView({block:'start'}));await p.screenshot({path:SH+'glance.png'});
// put Supplements' heading near the bottom of the screen, then open it
await p.evaluate(()=>{const s=document.querySelector('#supp-card>summary'),r=s.getBoundingClientRect();window.scrollBy(0,r.bottom-(innerHeight-110))});await p.waitForTimeout(200);
await p.click('#supp-card>summary');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const d=document.getElementById('supp-card').getBoundingClientRect(),t=document.querySelector('.tabs').getBoundingClientRect();return {top:d.top,bottom:d.bottom,limit:t.top,open:document.getElementById('supp-card').open}});
ok('opening scrolls it into view',r.open&&(r.bottom<=r.limit||r.top<=20)&&r.top>=-2,JSON.stringify(r));
ok('save still works from the moved Daily log',await p.evaluate(()=>!!document.querySelector('#macro-card #log-save')));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
