const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();
for(const scheme of ['light','dark']){const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:scheme})).newPage();await p.clock.setFixedTime(new Date('2026-11-12T10:00:00'));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
if(scheme==='light'){
  // add a run row to the Day shift training plan
  await p.evaluate(()=>goTo('days'));await p.waitForTimeout(200);
  await p.click('#pe-add');const n=await p.$$eval('#days-ed li.edcol',e=>e.length);
  await p.selectOption(`[data-pk="${n-1}"]`,'run');await p.waitForTimeout(150);
  ok('run is an option in day plans',await p.$$eval(`[data-pk="${n-1}"] option`,e=>e.map(o=>o.value).includes('run')));
  await p.fill(`[data-pt="${n-1}"]`,'06:00');await p.fill(`[data-px="${n-1}"]`,'Easy 3K before work');await p.selectOption(`[data-prk="${n-1}"]`,'easy');
  await p.click('#pe-save');await p.waitForTimeout(400);
  const saved=await p.evaluate(()=>JSON.stringify(SCHED.day.T.rows.find(r=>r[1]==='run')));ok('run row saved in the day plan',/06:00","run","Easy 3K before work","easy/.test(saved),saved);
  const dayD=await p.evaluate(()=>[...Array(10)].map((_,i)=>addDays(TODAY,i)).find(d=>dayInfo(d).slot==='day'&&dayInfo(d).type==='T'));
  const di=await p.evaluate(d=>{const i=dayInfo(d);return {run:i.run,at:i.runAt,kind:i.runKind,rows:rowsFor(i).filter(r=>r[3]==='run').length}},dayD);
  ok('day shift now has that run (Today / Run tab use it)',di.run==='Easy 3K before work'&&di.at==='06:00'&&di.rows===1,JSON.stringify(di));
  await p.evaluate(()=>goTo('run'));ok('Run tab lists it',(await p.$$eval('#run-next li',e=>e.map(x=>x.innerText))).some(x=>/Easy 3K before work/.test(x)));
  // edit days-ed screenshot
  await p.evaluate(()=>goTo('days'));await p.screenshot({path:SH+'col-days-'+scheme+'.png'});
}
await p.evaluate(()=>goTo('shifts'));await p.waitForTimeout(200);
const kinds=await p.$$eval('#timeline li',e=>e.map(x=>(x.className.match(/k-(\w+)/)||[])[1]||'none'));console.log('   '+scheme+' kinds:',kinds.join(' '));
ok(scheme+': every timeline item coloured',kinds.every(k=>k!=='none')&&kinds.includes('meal')&&kinds.includes('train')&&kinds.includes('work'));
const bg=await p.$$eval('#timeline li .what',e=>[...new Set(e.map(x=>getComputedStyle(x).backgroundColor))]);ok(scheme+': distinct pastel backgrounds',bg.length>=4,bg.join(' '));
await p.locator('#timeline').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'col-'+scheme+'.png'});
ok(scheme+': no errors',!errs.length,errs.join());await p.close()}
console.log('FAILS',fails);await b.close();process.exit(fails?1:0)})();
