const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(900);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
await p.evaluate(async()=>{const S=(n,kg=50,r=10)=>Array(n).fill(0).map(()=>({kg,reps:r}));
  for(const [k,off] of [[0,-2],[1,-10],[2,-18],[3,-26]]){
    await db.doc('workouts/u'+k).set({date:addDays(TODAY,off),title:'Upper',source:'app',exercises:[{name:'Chest-supported row',sets:S(3)},{name:'Neutral-grip lat pulldown',sets:S(3)},{name:'Hammer curl',sets:S(k?2:3)}]});
    await db.doc('workouts/b'+k).set({date:addDays(TODAY,off-1),title:'Back',source:'app',exercises:[{name:'Dumbbell or machine shrug',sets:S(k?2:4)},{name:'Reverse pec deck',sets:S(2)},{name:'Incline machine chest press',sets:S(2)}]});}
  for(let i=0;i<10;i++)await saveCheckin(addDays(TODAY,-9+i),{weight:87.2+i*0.04});});
await p.waitForTimeout(600);
const g=n=>p.evaluate(n=>{const v=volumeIn(addDays(TODAY,-7),TODAY).g[n];return v?{d:v.d,i:v.i,ie:+v.ie.toFixed(2),eff:+effOf(v).toFixed(2),days:v.days.size}:null},n);
const back=await g('Lats'),traps=await g('Upper back'),rear=await g('Side/rear delts'),bi=await g('Biceps'),tri=await g('Triceps');
console.log('   Lats',JSON.stringify(back),'Upper back',JSON.stringify(traps),'Rear',JSON.stringify(rear),'Biceps',JSON.stringify(bi),'Triceps',JSON.stringify(tri));
ok('lats: pulldown direct + row 1/2',back.d===3&&back.ie===1.5,JSON.stringify(back));
ok('upper back: row + shrug direct, pec deck 1/2',traps.d===7&&traps.ie===1,JSON.stringify(traps));
ok('no Back or Traps left',await p.evaluate(()=>!MGROUPS.includes('Back')&&!MGROUPS.includes('Traps')&&MGROUPS[0]==='Lats'&&MGROUPS[1]==='Upper back'));
ok('rear delts: pec deck direct, row 1/2, pulldown 1/4',rear.d===2&&rear.ie===2.25,JSON.stringify(rear));
ok('biceps direct + indirect from pulling',bi.d===3&&bi.ie===3);
await p.evaluate(()=>goTo('lifts'));await p.waitForTimeout(300);
const rows=await p.$$eval('#vol-card .vrow',e=>e.map(x=>x.innerText.replace(/\n+/g,' | ')));console.log('   rows:',rows.slice(0,5));
ok('priority muscles first with ★',/^★ Lats/.test(rows[0])&&/^★ Upper back/.test(rows[1])&&/^★ Side\/rear delts/.test(rows[2]));
ok('frequency and trend shown',rows.every(r=>/trained directly \d+× in 8 days/.test(r)));
ok('too little / too much summary',/Could use more/.test(await p.$eval('#vol-card',e=>e.innerText)));
await p.locator('#vol-card').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'vol2.png'});
// change default indirect weighting
await p.selectOption('#vol-ind','1');await p.waitForTimeout(300);const bi2=await g('Biceps');ok('default weighting changes indirect credit',bi2.ie===6,JSON.stringify(bi2));
const rear2=await g('Side/rear delts');ok('exercise-specific weighting (pulldown 1/4) stays',rear2.ie===3+0.75,JSON.stringify(rear2));
await p.selectOption('#vol-ind','0.5');await p.waitForTimeout(200);
// targets edit
await p.click('#mt-edit');await p.fill('[data-mtmin="Upper back"]','6');await p.fill('[data-mtmax="Upper back"]','9');await p.click('#mt-edit');await p.waitForTimeout(300);
ok('targets range saved',await p.evaluate(()=>JSON.stringify(mRange('Upper back'))==='{"min":6,"max":9,"pri":true}'));
// library weighting for hammer curl -> Back 0.25
await p.evaluate(()=>goTo('library'));await p.fill('#lib-q','hammer');await p.waitForTimeout(150);await p.click('[data-libedit="hammer curl"]');await p.click('[data-libs="Lats"]');await p.waitForTimeout(100);
await p.selectOption('[data-libw="Lats"]','0.25');await p.click('#lib-save');await p.waitForTimeout(300);
ok('per-exercise weighting saved',await p.evaluate(()=>exInfo('Hammer curl').w.Lats===0.25),await p.evaluate(()=>JSON.stringify(exInfo('Hammer curl'))));
ok('library shows weights',/Also: Lats 0.25/.test(await p.$eval('#lib-list',e=>e.innerText)));
// body map traps
await p.evaluate(()=>goTo('gym'));ok('upper back and lats on body map',await p.$$eval('[data-m="Upper back"]',e=>e.length)>=2&&await p.$$eval('[data-m="Lats"]',e=>e.length)>=2);
// goals
await p.evaluate(()=>goTo('body'));await p.waitForTimeout(200);
ok('default 93kg goal is there',/Bulk to 93kg/.test(await p.textContent('#goals-body')));
await p.click('#goal-add');await p.click('[data-gf="type:lift"]');await p.fill('#gf-ex','Chest-supported row');await p.fill('#gf-kg','70');await p.fill('#gf-reps','8');await p.click('#gf-save');await p.waitForTimeout(300);
await p.click('#goal-add');await p.click('[data-gf="type:measure"]');await p.selectOption('#gf-name','Biceps (right)');await p.click('[data-gf="dir:up"]');await p.fill('#gf-tg','40');await p.fill('#gf-now','37');await p.click('#gf-save');await p.waitForTimeout(300);
let gl=await p.$$eval('#goals-body .goal',e=>e.map(x=>x.innerText.replace(/\n+/g,' | ')));console.log('   goals:',gl);
ok('three goals with progress',gl.length===3&&/Bulk to 93kg/.test(gl[0])&&/Chest-supported row: 70kg × 8/.test(gl[1])&&/Biceps \(right\) up to 40cm/.test(gl[2]));
ok('to-goal stat uses the goal',/To 93kg/i.test(await p.$eval('#prog-stats',e=>e.innerText)));
await p.click('[data-glog]');await p.fill('#gl-v','38.5');await p.click('[data-glsave]');await p.waitForTimeout(300);
ok('measurement logged, 50%',/Now 38.5cm/.test(await p.$eval('#goals-body',e=>e.innerText))&&/50%/.test(await p.$eval('#goals-body',e=>e.innerText)),await p.$eval('#goals-body',e=>e.innerText.replace(/\n+/g,' | ')));
await p.click('#goal-add');await p.fill('#gf-kg','90');await p.click('#gf-save');await p.waitForTimeout(150);ok('only one weight goal',/already have a weight goal/.test(await p.$eval('#gf-err',e=>e.textContent)));await p.click('#gf-cancel');
await p.locator('#goals-card').scrollIntoViewIfNeeded();await p.screenshot({path:SH+'goals.png'});
const lid=await p.evaluate(()=>goalList()[1].id);await p.click(`[data-grm="${lid}"]`);await p.click(`[data-grm="${lid}"]`);await p.waitForTimeout(300);
ok('remove with −',(await p.$$eval('#goals-body .goal',e=>e.length))===2);
await p.reload();await p.waitForTimeout(1000);ok('goals persist',await p.evaluate(()=>goalList().length)===2);
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
