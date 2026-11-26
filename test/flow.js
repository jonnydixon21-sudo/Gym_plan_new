const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(700);
  // coach review with no AI
  await p.evaluate(()=>goTo('coach'));await p.click('#rv-go');await p.waitForTimeout(1500);
  console.log('REVIEW:',(await p.$eval('#rv-thread',e=>e.parentElement.innerText)).slice(0,300).replace(/\n/g,' | '));
  console.log('reply send btn:',await p.$eval('#rv-send',e=>e.textContent));
  await p.screenshot({path:SH+'coach-after.png'});
  await p.click('#vid-x');await p.waitForTimeout(300);
  // gym: start first template workout
  await p.evaluate(()=>goTo('gym'));await p.waitForTimeout(300);
  const tpl=await p.$$('#w-tpls button');console.log('templates:',tpl.length);
  await tpl[0].click();await p.waitForTimeout(300);
  await p.click('#pv-start');await p.waitForTimeout(500);
  console.log('live visible:',await p.$eval('#w-live',e=>!e.hidden));
  const inputs=await p.$$('.set input');
  if(inputs.length>=2){await inputs[0].fill('60');await inputs[1].fill('8')}
  await p.click('.set .ok');await p.waitForTimeout(400);
  console.log('rest bar shown:',await p.$eval('#rest',e=>!e.hidden));
  await p.screenshot({path:SH+'workout.png'});
  // reload mid-workout -> should resume
  await p.reload();await p.waitForTimeout(900);await p.evaluate(()=>goTo('gym'));await p.waitForTimeout(300);
  console.log('resumed live workout after reload:',await p.$eval('#w-live',e=>!e.hidden));
  await p.click('#w-finish');await p.waitForTimeout(600);
  await p.screenshot({path:SH+'workout-done.png'});
  console.log('summary:',(await p.$eval('#w-done',e=>e.innerText)).slice(0,160).replace(/\n/g,' | '));
  console.log('ERRORS:',JSON.stringify(errs));
  await b.close();
})();
