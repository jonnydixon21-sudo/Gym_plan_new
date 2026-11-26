const { chromium } = require('playwright');const fs=require('fs');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>goTo('training','gym'));await p.evaluate(()=>{document.getElementById('split-card').open=true});await p.waitForTimeout(100);
await p.click('.spcog[data-edit="Back"]');await p.waitForTimeout(300);
await p.fill('.ed-n[data-i="0"]','');await p.click('.ed-n[data-i="0"]');await p.keyboard.type('Rear cable flys');await p.waitForTimeout(1200);
ok('saved without pressing anything',await p.evaluate(()=>tplOf('Back').ex[0].name==='Rear cable flys'));
ok('status says saved',await p.evaluate(()=>/Saved/.test(document.getElementById('ed-status').textContent)));
ok('still typing in same box',await p.evaluate(()=>document.activeElement&&document.activeElement.classList.contains('ed-n')&&document.activeElement.value==='Rear cable flys'),await p.evaluate(()=>document.activeElement.outerHTML.slice(0,120)+' '+document.getElementById('sp-edit').dataset.k));
ok('start tile already updated',await p.evaluate(()=>{const b=document.querySelector('#w-tpls .tw button[data-tpl="Back"] small');return !!b}));
// type and immediately open preview (before autosave fires)
await p.fill('.ed-s[data-i="0"]','3x12-15');await p.evaluate(()=>document.querySelector('.tw button[data-tpl="Back"]').click());await p.waitForTimeout(400);
ok('preview has latest even if tapped straight away',await p.evaluate(()=>{const t=document.querySelector('.pv-list li');return t&&/Rear cable flys/.test(t.innerText)&&/3 × 12-15/.test(t.innerText)}),await p.evaluate(()=>document.querySelector('.pv-list li')?.innerText));
await p.click('#pv-back');await p.waitForTimeout(200);
// bad sets: not saved, warning shown
await p.fill('.ed-s[data-i="1"]','abc');await p.waitForTimeout(1000);
ok('invalid row warns and is not saved',await p.evaluate(()=>/Not saved/.test(document.getElementById('ed-status').textContent)&&/Row 2/.test(document.getElementById('ed-err').textContent)&&tplOf('Back').ex[1].groups.length>0));
await p.fill('.ed-s[data-i="1"]','2x8-12');await p.waitForTimeout(1000);
await p.evaluate(()=>document.querySelector('.edbar').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'edauto.png'});
// undo restores the original
await p.click('#ed-cancel');await p.waitForTimeout(400);
ok('undo puts it back',await p.evaluate(()=>!EDIT&&tplOf('Back').ex[0].name!=='Rear cable flys'),await p.evaluate(()=>tplOf('Back').ex[0].name));
// done closes
await p.click('.spcog[data-edit="Back"]');await p.waitForTimeout(300);await p.click('[data-edrm="0"]');await p.waitForTimeout(100);await p.click('#ed-save');await p.waitForTimeout(400);
ok('done saves and closes',await p.evaluate(()=>!EDIT&&tplOf('Back').ex.length===TEMPLATES.find(t=>t.title==='Back').ex.length-1),await p.evaluate(()=>JSON.stringify({ed:!!EDIT,n:tplOf('Back').ex.length,b:TEMPLATES.find(t=>t.title==='Back').ex.length})));
await p.reload();await p.waitForTimeout(1000);ok('persists',await p.evaluate(()=>tplOf('Back').ex.length===TEMPLATES.find(t=>t.title==='Back').ex.length-1));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
