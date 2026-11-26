const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>{if(typeof goTo==='function')goTo('settings');else document.getElementById('tab-settings').click()});await p.waitForTimeout(200);
const seq=['1.25','0.9','1.4','1','1.1','1.4','1.25','1','0.9','1.1','1'];
for(const z of seq){
  // tap the chip at its real on-screen position, like a finger would
  await p.evaluate(z=>document.querySelector(`[data-z="${z}"]`).scrollIntoView({block:'center'}),z);await p.waitForTimeout(100);const box=await p.locator(`[data-z="${z}"]`).boundingBox();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>({L:L.zoom,iw:innerWidth,meta:document.querySelector('meta[name=viewport]').content,pressed:[...document.querySelectorAll('[data-z]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.z).join(),css:document.documentElement.style.zoom,over:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}));
  ok(`tap ${z}`,String(r.L)===String(+z)&&r.pressed===z&&Math.abs(r.iw-Math.round(390/ +z))<=1&&!r.css&&!r.over,JSON.stringify(r));
}
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails?1:0)})();
