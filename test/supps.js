const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
let fails=0;const ok=(name,cond,extra)=>{if(!cond)fails++;console.log((cond?'PASS':'FAIL')+' '+name+(extra!==undefined?' -> '+extra:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
const rows=()=>p.$$eval('#supps .supp',e=>e.map(x=>x.innerText.replace(/\n+/g,' | ')));
const count=()=>p.$eval('#sup-count',e=>e.textContent);
await p.evaluate(()=>{document.getElementById('supp-card').open=true});
await p.locator('#supp-card').scrollIntoViewIfNeeded();
console.log('   start:',await rows(),await count());
ok('starts with Vitamin D',(await rows()).length===1&&/Vitamin D/.test((await rows())[0])&&(await count())==='0/1');
// add with quantity
await p.fill('#sf-name','Creatine');await p.fill('#sf-qty','5g');await p.selectOption('#sf-when','pre');await p.click('#sf-add');await p.waitForTimeout(300);
await p.fill('#sf-name','Magnesium');await p.fill('#sf-qty','2 tablets');await p.selectOption('#sf-when','sleep');await p.click('#sf-add');await p.waitForTimeout(300);
let r=await rows();console.log('   after adds:',r,await count());
ok('added two with quantity and timing',r.length===3&&r.some(x=>/Creatine.*5g/.test(x)&&/Pre-gym|Any time/.test(x))&&r.some(x=>/Magnesium.*2 tablets/.test(x)&&/\d\d:\d\d/.test(x)));
ok('form cleared after add',(await p.$eval('#sf-name',e=>e.value))===''&&(await p.$eval('#sf-qty',e=>e.value))==='');
// name required
await p.click('#sf-add');await p.waitForTimeout(150);ok('needs a name',(await rows()).length===3&&/name/i.test(await p.$eval('#sf-toast',e=>e.textContent)));
// tick one
const kc=await p.evaluate(()=>suppList().find(x=>x.n==='Creatine').k);
await p.click('#sp-'+kc);await p.waitForTimeout(300);ok('tick counts',(await count())==='1/3',await count());
await p.screenshot({path:SH+'supps.png'});
// edit quantity
await p.click(`[data-supedit="${kc}"]`);await p.waitForTimeout(150);
ok('edit loads the form',(await p.$eval('#sf-name',e=>e.value))==='Creatine'&&(await p.$eval('#sf-add',e=>e.textContent))==='Save changes'&&!(await p.$eval('#sf-cancel',e=>e.hidden)));
await p.fill('#sf-qty','10g');await p.click('#sf-add');await p.waitForTimeout(300);
r=await rows();ok('edit saved, tick kept',r.length===3&&r.some(x=>/Creatine.*10g/.test(x))&&(await count())==='1/3',r.find(x=>/Creatine/.test(x)));
// cancel edit
await p.click(`[data-supedit="${kc}"]`);await p.click('#sf-cancel');ok('cancel resets the form',(await p.$eval('#sf-add',e=>e.textContent))==='Add supplement'&&(await p.$eval('#sf-name',e=>e.value))==='');
// remove (two taps)
await p.click('[data-suprm="vitd"]');await p.waitForTimeout(150);ok('remove asks to confirm',(await p.$eval('[data-suprm="vitd"]',e=>e.textContent))==='Tap again to remove'&&(await rows()).length===3);
await p.click('[data-suprm="vitd"]');await p.waitForTimeout(300);
r=await rows();ok('Vitamin D removed',r.length===2&&!r.some(x=>/Vitamin D/.test(x))&&(await count())==='1/2',await count());
// persistence + other day
await p.reload();await p.waitForTimeout(1000);await p.evaluate(()=>{document.getElementById('supp-card').open=true});
r=await rows();ok('list and tick survive a reload',r.length===2&&(await count())==='1/2',r.join(' ; '));
await p.click('#d-next');await p.waitForTimeout(300);ok('next day starts unticked',(await count())==='0/2',await count());
await p.click('#d-prev');await p.waitForTimeout(300);
// remove all
for(const k of await p.evaluate(()=>suppList().map(x=>x.k))){await p.click(`[data-suprm="${k}"]`);await p.click(`[data-suprm="${k}"]`);await p.waitForTimeout(250)}
ok('empty list message',/No supplements on your list/.test(await p.$eval('#supps',e=>e.textContent))&&(await count())==='0/0');
await p.reload();await p.waitForTimeout(1000);ok('stays empty after reload (default not restored)',(await p.evaluate(()=>suppList().length))===0);
// in the backup
const bk=await p.evaluate(async()=>{await db.doc('prefs/supps').set({list:[{k:'s1',n:'Zinc',d:'1 tablet',when:''}]});const d=await window.__exportAll();return d.docs.some(r=>r[0]==='prefs/supps'&&r[1].list[0].n==='Zinc')});ok('supplements are in the backup',bk);
console.log('errors:',errs,'| FAILS:',fails);await b.close();process.exit(fails||errs.length?1:0)})();
