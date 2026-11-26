const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));await p.waitForTimeout(200);
await p.click('#nfood-new');
await p.fill('#fov-name','Rice pudding');
await p.fill('[data-fv="0"]','1.2');await p.fill('[data-fv="1"]','0.03');await p.fill('[data-fv="2"]','0.2');await p.fill('[data-fv="3"]','0.03');
console.log('preview:',await p.$eval('#fov-prev',e=>e.textContent));
await p.screenshot({path:SH+'nf.png'});
await p.click('#fov-save');await p.waitForTimeout(400);
console.log('my foods:',await p.$eval('#myfoods',e=>e.innerText.replace(/\n/g,' | ')));
// add it to a meal via meal cog
await p.click('.cogm');await p.waitForTimeout(200);
const key=await p.evaluate(()=>Object.keys(F).find(k=>k.startsWith('x_')));
await p.selectOption('#med-addsel',key);await p.click('#med-add');
const n=await p.$$eval('#med [data-ma]',e=>e.length);await p.fill(`#med [data-ma="${n-1}"]`,'200');
console.log('meal total:',await p.$eval('#med-tot',e=>e.textContent),'| row:',await p.$eval(`#med [data-mm="${n-1}"]`,e=>e.textContent));
// new food from inside meal editor
await p.click('#nf-open');await p.fill('#fov-name','Protein bar');await p.click('[data-fu=""]');await p.fill('[data-fv="0"]','200');await p.fill('[data-fv="1"]','20');await p.fill('[data-fv="2"]','15');await p.fill('[data-fv="3"]','7');await p.click('#fov-save');await p.waitForTimeout(300);
console.log('items now:',await p.$$eval('#med [data-ma]',e=>e.map(x=>x.value)));
await p.click('#med-save');await p.waitForTimeout(400);
console.log('meal:',await p.evaluate(()=>MEALS.d_mw.items.map(i=>i.join(':')).join(' ; ')+' | '+MEALS.d_mw.t));
// shopping text
console.log('buyText:',await p.evaluate(()=>{const k=Object.keys(F).find(k=>F[k].n==='Rice pudding');return buyText(k,1200)}));
// edit existing + persistence
await p.reload();await p.waitForTimeout(900);await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));
console.log('after reload foods:',await p.$eval('#myfoods',e=>e.innerText.replace(/\n/g,' | ')));
// delete refused while used
await p.evaluate(()=>{goTo('nutrition','foods')});await p.click('[data-fedit]');await p.click('#fov-del');console.log('del msg:',await p.$eval('#fov-err',e=>e.textContent));
await p.click('#fov-cancel');
console.log('errors:',errs);await b.close()})();
