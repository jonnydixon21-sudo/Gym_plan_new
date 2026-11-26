const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  p.on('requestfailed',r=>errs.push('reqfailed: '+r.url()));
  await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(800);
  console.log('nodb hidden:',await p.$eval('#nodb',e=>e.hidden));
  await p.screenshot({path:SH+'today.png'});
  // check-in
  await p.fill('#q-weight','82.4');await p.fill('#a-steps','9100');await p.click('#log-save');await p.waitForTimeout(500);
  console.log('log toast:',await p.$eval('#a-toast',e=>e.textContent));
  await p.evaluate(()=>goTo('body'));await p.waitForTimeout(200);
  // photo: make a jpeg in-page and upload
  const img=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const x=c.getContext('2d');x.fillStyle='#456';x.fillRect(0,0,300,400);x.fillStyle='#fff';x.fillRect(100,100,100,200);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));return Array.from(new Uint8Array(await b.arrayBuffer()))});
  require('fs').writeFileSync((process.env.SHOTS||'/tmp/gym-shots/')+'t.jpg',Buffer.from(img));
  await p.evaluate(()=>goTo('photos'));await p.setInputFiles('#p-file',(process.env.SHOTS||'/tmp/gym-shots/')+'t.jpg');
  await p.click('#p-save');await p.waitForTimeout(800);
  console.log('photo toast:',await p.$eval('#p-toast',e=>e.textContent));
  console.log('thumbs before reload:',await p.$$eval('#gallery img',a=>a.map(i=>[i.src.slice(0,30),i.naturalWidth])));
  await p.screenshot({path:SH+'progress.png',fullPage:false});
  // walk every tab
  for(const t of ['today','body','gym','food','coach']){await p.evaluate(t=>goTo(t),t);await p.waitForTimeout(250);await p.screenshot({path:SH+'tab-'+t+'.png'})}
  // reload -> persistence
  await p.reload();await p.waitForTimeout(900);
  console.log('weight/steps after reload:',await p.$eval('#q-weight',e=>e.value),await p.$eval('#a-steps',e=>e.value));
  await p.evaluate(()=>goTo('body'));await p.waitForTimeout(300);
  console.log('thumbs after reload:',await p.$$eval('#gallery img',a=>a.map(i=>i.naturalWidth)));
  console.log('ERRORS:',JSON.stringify(errs,null,1));
  await b.close();
})();
