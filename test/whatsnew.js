// Update bar says what changed and who changed it; Settings has the update-alerts subscribe link.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8793/index.html');await p.waitForTimeout(1000);
await p.route(/index\.html\?check=/,r=>r.fulfill({contentType:'text/html',body:'<script>const APP_VERSION="99 Dec 2026 (z)";</script>'}));
await p.route(/whatsnew\.json/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({v:"99 Dec 2026 (z)",msg:"Added a rest timer sound.",by:"Defty"})}));
await p.evaluate(()=>autoUpdCheck(true));await p.waitForTimeout(500);
const t=await p.$eval('#upd-bar',e=>e.hidden?'':e.innerText);ok('bar shows what changed and who',/New: Added a rest timer sound \(by Defty\)\./.test(t),t);
await p.unroute(/whatsnew\.json/);await p.route(/whatsnew\.json/,r=>r.fulfill({status:404,body:''}));
await p.evaluate(()=>{UPD_LAST=0;document.getElementById('upd-bar').hidden=true});await p.evaluate(()=>autoUpdCheck(true));await p.waitForTimeout(500);
ok('falls back without notes',/A new version is ready \(99 Dec 2026 \(z\)\)/.test(await p.$eval('#upd-bar-t',e=>e.textContent)));
await p.evaluate(()=>show('settings'));ok('update alerts link',await p.$eval('#upd-alerts',e=>e.href)==='https://ntfy.sh/gymplan-updates-02b3ba93cc');
console.log('errors:',JSON.stringify(errs.filter(e=>!/404/.test(e)).slice(0,5)));console.log('FAILS',fails);await b.close()})();
