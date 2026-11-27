const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// seed an old check-in with a waist so migration runs
await p.evaluate(async()=>{await db.doc('checkins/2026-11-01').set({date:'2026-11-01',waist:84.5,energy:4,photos:[]});await db.doc('checkins/2026-11-08').set({date:'2026-11-08',waist:85.0,photos:[]})});await p.waitForTimeout(600);
await p.click('#tab-schedule');await p.waitForTimeout(200);
const chips=await p.$$eval('#hub-schedule [data-sub]',e=>e.map(x=>x.querySelector('b').innerText.trim()).join('|'));ok('schedule tiles',chips==='My weeks|Plan your days|Plan your runs',chips);
await p.click('#tab-nutrition');const nch=await p.$$eval('#hub-nutrition [data-sub]',e=>e.map(x=>x.innerText.trim()).join('|'));ok('Shopping tile',nch.includes('Shopping'),nch);
await p.evaluate(()=>goTo('nutrition','shop'));await p.waitForTimeout(150);ok('Shopping list title',/Shopping list/.test(await p.textContent('#shop-title')),await p.textContent('#shop-title'));
// run plan boxes
await p.evaluate(()=>goTo('schedule','rundays'));await p.waitForTimeout(200);
ok('three run boxes by default',(await p.$$('#run-days .rbox')).length===3);
ok('box fields',await p.evaluate(()=>{const b=document.querySelector('#run-days .rbox');return !!(b.querySelector('[data-rbd]')&&b.querySelector('[data-rbt]')&&b.querySelector('[data-rbk]')&&b.querySelector('[data-rbn]')&&b.querySelector('[data-rbrm]'))}));
const vals=await p.evaluate(()=>RPD.list.map(r=>r.day+':'+r.type+':'+r.note+':'+r.at).join(' | '));ok('defaults read from rota',vals==='2:easy::09:30 | 6:long:10K+:16:30 | 7:speed:intervals or tempo:16:30',vals);
await p.screenshot({path:SH+'runplan.png',fullPage:true});
await p.click('#rb-add');ok('+ adds a box',(await p.$$('#run-days .rbox')).length===4);
await p.selectOption('[data-rbd="3"]','4');await p.selectOption('[data-rbk="3"]','tempo');await p.fill('[data-rbt="3"]','07:15');await p.fill('[data-rbn="3"]','20 min at threshold');
await p.click('[data-rbrm="0"]');ok('− removes',(await p.$$('#run-days .rbox')).length===3);
await p.click('#rp-save');await p.waitForTimeout(300);
const pat=await p.evaluate(()=>PATTERN.map((x,i)=>x.run?i+':'+x.run+'@'+x.runAt+'('+x.runKind+')':'').filter(Boolean).join(' | '));
ok('plan applied',pat==='4:Tempo run · 20 min at threshold@07:15(speed) | 6:Long run · 10K+@16:30(easy) | 7:Speed run · intervals or tempo@16:30(speed)',pat);
await p.reload();await p.waitForTimeout(900);ok('persists',await p.evaluate(()=>PATTERN[4].run==='Tempo run · 20 min at threshold'&&!PATTERN[2].run));
// custom pattern still saves (ids renamed)
await p.evaluate(()=>goTo('schedule','shifts'));await p.click('[data-rv="custom"]');await p.click('[data-cpre="1"]');await p.click('#cp-save');await p.waitForTimeout(300);
ok('custom pattern saves',await p.evaluate(()=>PATTERN.length===8&&PATTERN[0].slot==='day'&&PATTERN[4].slot==='off'));
await p.click('[data-rv="custom"]');await p.click('[data-cpre="0"]');await p.click('#cp-save');await p.waitForTimeout(300);
// spacing: rota card rows have a gap
const gap=await p.evaluate(()=>{const a=document.getElementById('rota-flip').closest('.row').getBoundingClientRect(),b=document.getElementById('rota-shift').getBoundingClientRect(),t=document.getElementById('rota-pill').getBoundingClientRect();return [Math.round(b.top-a.bottom),Math.round(a.top-t.bottom)]});
ok('space between rows in day details',gap[0]>=10&&gap[1]>=8,gap.join(','));
await p.evaluate(()=>document.getElementById('rota-flip').scrollIntoView({block:'center'}));await p.screenshot({path:SH+'spacing.png'});
// measurements
await p.evaluate(()=>goTo('progress','body'));await p.waitForTimeout(400);
ok('waist migrated from check-ins',await p.evaluate(()=>D.measures.filter(m=>m.site==='Waist').length===2&&!D.checkins.some(c=>c.waist!=null)),await p.evaluate(()=>JSON.stringify(D.measures)));
ok('card titled Measurements',await p.evaluate(()=>/Measurements/i.test(document.querySelector('[data-fold="waist"] summary').innerText)));
ok('check-in has no waist box',await p.evaluate(()=>document.querySelector('label[for="c-waist"]').hidden));
await p.click('#ms-add');await p.waitForTimeout(300);
const box=await p.evaluate(()=>{const b=document.querySelector('#meas-body .mbox');return {date:b.querySelector('[data-mf="date"]').value,site:b.querySelector('[data-mf="site"]').value,opts:b.querySelectorAll('[data-mf="site"] option').length}});
ok('+ adds box with today, a site and the list',box.date===await p.evaluate(()=>TODAY)&&box.site==='Waist'&&box.opts>=15,JSON.stringify(box));
await p.selectOption('#meas-body .mbox [data-mf="site"]','Biceps (right)');await p.waitForTimeout(250);
await p.fill('#meas-body .mbox [data-mf="cm"]','39.5');await p.press('#meas-body .mbox [data-mf="cm"]','Tab');await p.waitForTimeout(250);
await p.fill('#meas-body .mbox [data-mf="note"]','pumped');await p.press('#meas-body .mbox [data-mf="note"]','Tab');await p.waitForTimeout(250);
ok('saved fields',await p.evaluate(()=>D.measures.some(m=>m.site==='Biceps (right)'&&m.cm===39.5&&m.note==='pumped'&&m.date===TODAY)));
ok('hint shown',/peak of the biceps/.test(await p.textContent('#meas-body .mbox .mhint')));
await p.click('#ms-add');await p.waitForTimeout(300);ok('second add picks Waist',await p.evaluate(()=>D.measures.filter(m=>m.date===TODAY).map(m=>m.site).sort().join()==='Biceps (right),Waist'),await p.evaluate(()=>JSON.stringify(D.measures.filter(m=>m.date===TODAY))));
await p.fill('#meas-body .mbox [data-mf="cm"]','85.4');await p.press('#meas-body .mbox [data-mf="cm"]','Tab');await p.waitForTimeout(300);
ok('waist chart + tile',await p.evaluate(()=>!!document.querySelector('#ch-meas svg')&&/85\.4cm/.test(document.getElementById('prog-stats').innerText)),await p.evaluate(()=>document.getElementById('prog-stats').innerText.replace(/\n/g,' ').slice(0,200)));
await p.evaluate(()=>document.querySelector('#meas-body').scrollIntoView({block:'start'}));await p.screenshot({path:SH+'meas.png',fullPage:false});
const n0=await p.evaluate(()=>D.measures.length);await p.click('#meas-body [data-msrm]');await p.click('#meas-body [data-msrm]');await p.waitForTimeout(300);ok('− removes after second tap',await p.evaluate(()=>D.measures.length)===n0-1);
ok('biceps goal reads measures',await p.evaluate(()=>measVals({name:'Biceps (right)',log:[]}).length===1),await p.evaluate(()=>JSON.stringify(measVals({name:'Biceps (right)',log:[]}))+norm('Biceps (right)')));
await p.reload();await p.waitForTimeout(900);ok('measures persist, no re-migration',await p.evaluate(()=>D.measures.filter(m=>m.site==='Waist').length===2));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
