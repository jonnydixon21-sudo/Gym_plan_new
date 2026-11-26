const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
let fails=0;const ok=(name,cond,extra)=>{if(!cond)fails++;console.log((cond?'PASS':'FAIL')+' '+name+(extra!==undefined?' -> '+extra:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{window.__clip='';try{Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__clip=t;return Promise.resolve()}},configurable:true})}catch(e){}});
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(()=>goTo('food'));
await p.evaluate(()=>show('nutrition'));ok('Shopping tile on Nutrition',(await p.$eval('#hub-nutrition [data-sub="nutrition:shop"] b',e=>e.textContent))==='Shopping');
await p.evaluate(()=>goTo('food','shop'));await p.waitForTimeout(300);
ok('8 day chips',(await p.$$eval('#shop-days .pday',e=>e.length))===8);
ok('none picked at first',(await p.$$eval('#shop-days input:checked',e=>e.length))===0);
ok('prompt shown',/Tap the days above/.test(await p.$eval('#list',e=>e.textContent)));
await p.screenshot({path:SH+'shop-empty.png'});
const days=await p.evaluate(()=>shopWindow());
// expected needs straight from the day plans
const need=(ds,k)=>p.evaluate(([ds,k])=>ds.reduce((a,d)=>a+(dayNeeds(d)[k]||0),0),[ds,k]);
const row=k=>p.$eval('#si-'+k,e=>e.closest('.item').innerText.replace(/\n/g,' | ')).catch(()=>null);
// pick today + tomorrow
await p.click(`#shop-days label:has([data-sday="${days[0]}"])`);await p.waitForTimeout(250);
await p.click(`#shop-days label:has([data-sday="${days[1]}"])`);await p.waitForTimeout(250);
const n2=await need(days.slice(0,2),'chicken');
ok('title counts days',(await p.$eval('#shop-title',e=>e.textContent))==='Shopping list for 2 days');
console.log('   meta:',await p.$eval('#weekmeta',e=>e.textContent),'| chicken row:',await row('chicken'),'| expected g:',n2);
ok('chicken quantity = sum of the 2 days',(await row('chicken')||'').includes(n2+'g')&&n2>0,n2);
const items=await p.$$eval('#list .item',e=>e.length);ok('list has items',items>5,items);
await p.screenshot({path:SH+'shop-2days.png',fullPage:true});
// tick chicken -> Got it
await p.click('#si-chicken');await p.waitForTimeout(300);
ok('chicken moved to Got it',(await row('chicken'))===null&&/Tesco chicken breast/.test(await p.$eval('#got',e=>e.textContent)));
// add a third day -> chicken comes back with only the extra
await p.click(`#shop-days label:has([data-sday="${days[2]}"])`);await p.waitForTimeout(300);
const n3=await need([days[2]],'chicken');const r3=await row('chicken');
console.log('   after adding day 3: chicken row:',r3,'| expected extra g:',n3);
ok('ticked item returns with only the extra',n3>0?(r3||'').includes(n3+'g')&&(r3||'').includes('Extra for the days you added'):r3===null,n3);
// untick via Got it? (chicken is in list now, so tick + unget to check full amount)
await p.click('#si-chicken');await p.waitForTimeout(250);
await p.evaluate(()=>document.getElementById('gotbox').open=true);await p.click('#got button[data-unget="chicken"]');await p.waitForTimeout(300);
const nAll=await need(days.slice(0,3),'chicken');
ok('un-ticking shows the full amount again',(await row('chicken')||'').includes(nAll+'g')&&!(await row('chicken')).includes('Extra'),nAll);
// deselect a day
await p.click(`#shop-days label:has([data-sday="${days[1]}"])`);await p.waitForTimeout(300);
const nB=await need([days[0],days[2]],'chicken');ok('deselecting a day lowers the amount',(await row('chicken')||'').includes(nB+'g'),nB);
// extras
await p.fill('#sx-name','Diet Coke');await p.fill('#sx-qty','2 packs');await p.check('#sx-weekly');await p.click('#sx-add');await p.waitForTimeout(250);
await p.fill('#sx-name','Kitchen roll');await p.click('#sx-add');await p.waitForTimeout(250);
await p.fill('#sx-name','Bin bags');await p.click('#sx-add');await p.waitForTimeout(250);
const ex=await p.$$eval('#list .aisle:last-child .item',e=>e.map(x=>x.innerText.replace(/\n/g,' | ')));console.log('   extras:',ex);
ok('extras say Every shop / This shop only',ex.some(x=>/Diet Coke.*Every shop/.test(x))&&ex.some(x=>/Kitchen roll.*This shop only/.test(x)));
// copy
await p.click('#copy');await p.waitForTimeout(200);const clip=await p.evaluate(()=>window.__clip);
console.log('   copied (first lines):',clip.split('\n').slice(0,6).join(' / '));
ok('copy has days and quantities',/Shopping list for /.test(clip)&&/Tesco chicken breast: \d+g\n/.test(clip)&&/Diet Coke: 2 packs/.test(clip));
// tick the two one-offs? tick Diet Coke + Kitchen roll, leave Bin bags; then new shop
const idOf=n=>p.evaluate(n=>SH().extras.find(x=>x.name===n).id,n);
await p.click('#sx-'+await idOf('Diet Coke'));await p.waitForTimeout(200);await p.click('#sx-'+await idOf('Kitchen roll'));await p.waitForTimeout(200);
await p.click('#shop-new');await p.click('#shop-new');await p.waitForTimeout(400);
const st=await p.evaluate(()=>({days:SH().days,bought:Object.keys(SH().bought),extras:SH().extras.map(x=>x.name)}));
console.log('   after new shop:',JSON.stringify(st));
ok('new shop clears days and ticks',st.days.length===0&&st.bought.length===0);
ok('new shop keeps every-shop extra and un-got one-off, drops got one-off',st.extras.includes('Diet Coke')&&st.extras.includes('Bin bags')&&!st.extras.includes('Kitchen roll'));
// all 8 / clear
await p.click('#shop-all');await p.waitForTimeout(300);ok('All 8 days',(await p.$$eval('#shop-days input:checked',e=>e.length))===8);
await p.screenshot({path:SH+'shop-8days.png'});
await p.click('#shop-none');await p.waitForTimeout(300);ok('Clear days',(await p.$$eval('#shop-days input:checked',e=>e.length))===0);
// persistence
await p.click(`#shop-days label:has([data-sday="${days[3]}"])`);await p.waitForTimeout(300);
await p.reload();await p.waitForTimeout(1000);
ok('picked day survives a reload',JSON.stringify(await p.evaluate(()=>shopDays()))===JSON.stringify([days[3]]));
// meal edit changes the list
await p.evaluate(async()=>{const P=planDoc();P.meals={...P.meals,d_cr:{m:"Chicken & rice",items:[["chicken",500],["basmati",140,"140g dry"]]}};D.plan=P;await savePlan()});
// auto new shop when every picked day has passed
await p.evaluate(async()=>{await db.doc('shop/list').set({start:addDays(TODAY,-3),days:[addDays(TODAY,-3),addDays(TODAY,-2)],bought:{chicken:[addDays(TODAY,-3)],x1:true,x2:true},extras:[{id:'x1',name:'Every one',qty:'',weekly:true},{id:'x2',name:'One off',qty:'',weekly:false}],never:['oats']})});
await p.reload();await p.waitForTimeout(1000);await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','shop'));await p.waitForTimeout(300);
const a=await p.evaluate(()=>({days:SH().days,bought:Object.keys(SH().bought),extras:SH().extras.map(x=>x.name),never:SH().never,banner:!document.getElementById('shop-stale').hidden}));
console.log('   past shop ->',JSON.stringify(a));
ok('past shop starts clean and says so',a.days.length===0&&a.bought.length===0&&a.banner&&a.never.includes('oats')&&a.extras.join()==='Every one');
// old weekly-format list
await p.evaluate(async()=>{await db.doc('shop/list').set({start:'2026-11-09',bought:{chicken:true},extras:[{id:'x9',name:'Old extra',qty:'1',weekly:false}],never:[]})});
await p.reload();await p.waitForTimeout(1000);
const m=await p.evaluate(()=>({days:D.shop.days,bought:Object.keys(D.shop.bought),extras:D.shop.extras.map(x=>x.name)}));
console.log('   old weekly list ->',JSON.stringify(m));
ok('old weekly list is carried over without stale ticks',Array.isArray(m.days)&&m.bought.length===0&&m.extras.join()==='Old extra');
// other plan views still fine
await p.evaluate(()=>goTo('food'));for(const c of ['shifts','shop','meals','prep','days']){await p.evaluate(c=>goTo('food',c),c);await p.waitForTimeout(150)}
console.log('errors:',errs,'| FAILS:',fails);await b.close();process.exit(fails||errs.length?1:0)})();
