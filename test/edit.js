const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);
await p.evaluate(()=>goTo('gym'));await p.waitForTimeout(300);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
console.log('cogs:',await p.$$eval('.cog',e=>e.length));
await p.screenshot({path:SH+'ed-cards.png',fullPage:true});
await p.evaluate(()=>document.getElementById('split-card').open=true);await p.click('.cog[data-edit="Legs B"]');await p.waitForTimeout(300);
console.log('rows:',await p.$$eval('.ed-n',e=>e.map(x=>x.value)));
await p.screenshot({path:SH+'ed-open.png',fullPage:true});
// remove last, move row 2 up, add new, rename
await p.click('[data-edrm="5"]');
await p.click('[data-edup="2"]');
await p.click('#ed-add');await p.waitForTimeout(300);
await p.keyboard.type('Hip thrust');
await p.fill('.ed-s[data-i="5"]','3x8-10');
await p.fill('#ed-name','Legs B2');
await p.click('#ed-save');await p.waitForTimeout(300);
console.log('card names:',await p.$$eval('.tw button[data-tpl] b',e=>e.map(x=>x.textContent)));
console.log('legsB2 sub:',await p.$eval('.tw button[data-tpl="Legs B2"] small',e=>e.textContent));
// start it and check order
await p.click('.tw button[data-tpl="Legs B2"]');await p.waitForTimeout(300);
console.log('preview:',await p.$$eval('.pv-list li',e=>e.map(x=>x.textContent.slice(0,30))));
await p.click('#pv-back');
// invalid input
await p.evaluate(()=>document.getElementById('split-card').open=true);await p.click('.cog[data-edit="Legs B2"]');await p.fill('.ed-s[data-i="0"]','abc');await p.click('#ed-save');
console.log('err:',await p.$eval('#ed-err',e=>e.textContent));
await p.click('#ed-cancel');
// persistence
await p.reload();await p.waitForTimeout(900);await p.evaluate(()=>goTo('gym'));
const vx2=await p.$('#vid-x');if(vx2&&await vx2.isVisible())await vx2.click();
console.log('after reload:',await p.$$eval('.tw button[data-tpl] b',e=>e.map(x=>x.textContent)));
await p.evaluate(()=>document.getElementById('split-card').open=true);await p.click('.cog[data-edit="Legs B2"]');console.log('rows2:',await p.$$eval('.ed-n',e=>e.map(x=>x.value)));
await p.screenshot({path:SH+'ed-after.png',fullPage:true});
// reset
await p.click('#ed-reset');await p.click('#ed-reset');await p.waitForTimeout(300);
console.log('after reset:',await p.$$eval('.tw button[data-tpl] b',e=>e.map(x=>x.textContent)));
console.log('errors:',errs);await b.close()})();
