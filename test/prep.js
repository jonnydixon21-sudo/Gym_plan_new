const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);
console.log('N1 rows:',await p.evaluate(()=>rowsFor(dayInfo("2026-11-04")).map(r=>r[0]+" "+r[1]+(r[2]?":"+r[2].slice(0,10):"")).join(", ")));
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','prep'));await p.waitForTimeout(300);
console.log('default mode pressed:',await p.$$eval('[data-prep]',a=>a.filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.textContent)));
for(const m of ['day','night']){await p.click(`[data-prep="${m}"]`);await p.waitForTimeout(200);
 console.log('\n=== '+m+' ===\n'+(await p.$eval('#prep-out',e=>e.innerText)).split('\n').filter(Boolean).slice(0,40).join(' | ').slice(0,1500));
 await p.screenshot({path:SH+'prep-'+m+'.png',fullPage:true})}
// tick one box and reload
await p.click('[data-pdone]');await p.waitForTimeout(200);console.log('\ndone count:',await p.$eval('#prep-out .pill',e=>e.textContent));
await p.click('[data-prep="custom"]');await p.waitForTimeout(200);console.log('custom days shown:',await p.$$eval('.pday',a=>a.length),'checked:',await p.$$eval('.pday input:checked',a=>a.length));
console.log('ERR',errs);await b.close()})();
