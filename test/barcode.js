const { chromium } = require('playwright');
const U='http://localhost:8791/index.html';
const prod={status:1,product:{product_name:"British Chicken Breast Fillets",brands:"Tesco, Other",quantity:"650g",nutriments:{"energy-kcal_100g":106,proteins_100g:24,carbohydrates_100g:0,fat_100g:1.3}}};
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,permissions:['camera']});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});p.on('dialog',d=>d.accept());
let mode='found';
await p.route('**/world.openfoodfacts.org/**',r=>{if(mode==='found')return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(prod)});
  if(mode==='none')return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({status:0})});
  if(mode==='partial')return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({status:1,product:{product_name:"Mystery",nutriments:{"energy-kcal_100g":400,proteins_100g:5}}})});
  return r.abort()});
await p.addInitScript(()=>{window.BarcodeDetector=class{constructor(){this.n=0}async detect(){this.n++;return this.n>3?[{rawValue:"5000169005931"}]:[]}}});
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));
// 1 typed lookup
await p.click('#nfood-new');await p.fill('#fov-code','5000169005931');await p.click('#fov-look');await p.waitForTimeout(500);
console.log('typed:',await p.$eval('#fov-name',e=>e.value),await p.$$eval('[data-fv]',e=>e.map(x=>x.value)),'|',await p.$eval('#fov-lookmsg',e=>e.textContent));
await p.click('#fov-save');await p.waitForTimeout(300);console.log('saved:',await p.$eval('#myfoods',e=>e.innerText.replace(/\n/g,' | ')));
// 2 not found
mode='none';await p.click('#nfood-new');await p.fill('#fov-code','1234567890123');await p.click('#fov-look');await p.waitForTimeout(400);console.log('none:',await p.$eval('#fov-lookmsg',e=>e.textContent));
// 3 partial + bad macros
mode='partial';await p.fill('#fov-code','1234567890123');await p.click('#fov-look');await p.waitForTimeout(400);console.log('partial:',await p.$eval('#fov-lookmsg',e=>e.textContent));
// 4 offline
mode='fail';await p.click('#fov-look');await p.waitForTimeout(400);console.log('fail:',await p.$eval('#fov-lookmsg',e=>e.textContent));
await p.click('#fov-cancel');
// 5 camera scan (stubbed detector, fake camera)
mode='found';await p.click('#nfood-new');await p.click('#fov-scan');await p.waitForTimeout(300);console.log('scan overlay visible:',await p.$eval('#scan',e=>!e.hidden));
await p.waitForTimeout(1500);
console.log('after scan overlay hidden:',await p.$eval('#scan',e=>e.hidden),'| name:',await p.$eval('#fov-name',e=>e.value),'| code:',await p.$eval('#fov-code',e=>e.value));
// 6 close scanner without code
await p.click('#fov-cancel');await p.click('#nfood-new');await p.click('#fov-scan');await p.waitForTimeout(200);await p.click('#scan-x');console.log('closed:',await p.$eval('#scan',e=>e.hidden));
console.log('errors:',errs);await b.close()})();
