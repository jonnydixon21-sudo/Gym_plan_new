const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
ok('five tabs (Settings is the cog on Today)',(await p.$$eval('.tabs .tab',e=>e.filter(x=>x.offsetParent!==null).map(x=>x.innerText.trim()).join(',')))==='Today,Training,Progress,Nutrition,Schedule');
for(const t of ['today','training','progress','nutrition','schedule','settings']){
  if(t==='settings'){await p.click('#tab-today');await p.click('#hero-cog')}else await p.click('#tab-'+t);await p.waitForTimeout(250);
  const subs=await p.$$eval(`#sec-${t} [data-sub]`,e=>e.filter(x=>!x.hidden).map(x=>x.dataset.sub));
  const vis=await p.evaluate(t=>[...document.querySelectorAll('section.top')].filter(s=>!s.hidden).map(s=>s.id).join(),t);
  ok(`tab ${t} shows only its section`,vis==='sec-'+t,vis+' subs:'+subs.join(' '));
  ok(`  ${t}: opens on its home page`,!['training','progress','nutrition','schedule'].includes(t)||await p.evaluate(t=>!document.getElementById('hub-'+t).hidden,t));
  for(const sb of subs){if(await p.$(`[data-hubback="${t}"]`)&&await p.isVisible(`[data-hubback="${t}"]`)){await p.click(`[data-hubback="${t}"]`);await p.waitForTimeout(250)}
    await p.click(`[data-sub="${sb}"]`);await p.waitForTimeout(250);
    const shown=await p.evaluate(t=>[...document.querySelectorAll('#sec-'+t+' > .view, #sec-'+t+' > section, #sec-'+t+' > div.view')].filter(x=>!x.hidden).map(x=>x.id),t);
    const h=await p.evaluate(t=>document.getElementById('sec-'+t).innerText.length,t);
    ok(`  ${sb}: one pane, has content`,shown.length===1&&h>60,shown.join()+' len '+h);
    await p.screenshot({path:SH+'nav-'+sb.replace(':','-')+'.png'});
  }}
await p.reload();await p.waitForTimeout(1000);ok('remembers tab after reload',await p.evaluate(()=>L.tab==='settings'&&!document.getElementById('sec-settings').hidden));
await p.click('#tab-today');await p.click('#today-plan');await p.waitForTimeout(300);ok('Change day or meals opens Schedule',await p.evaluate(()=>!document.getElementById('sec-schedule').hidden&&!document.getElementById('food-shifts').hidden));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
