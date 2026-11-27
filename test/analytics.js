const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
// synthetic history
await p.evaluate(async()=>{const S=(kg,r,n=2,rir)=>Array(n).fill(0).map(()=>rir==null?{kg,reps:r}:{kg,reps:r,rir});const ws=[];
  // pulldown: hits top of range (10) on both sets last time -> go up
  // hack squat: falls 3 sessions in a row -> fatigue
  // pec deck: flat for 6 sessions -> plateau
  const days=[-34,-26,-18,-10,-5,-2];
  const hack=[[100,8],[100,8],[100,7],[100,6],[95,6],[90,6]],pec=[[50,12],[50,12],[50,12],[50,11],[50,12],[50,12]],pull=[[60,8],[60,9],[62.5,8],[62.5,9],[62.5,10],[62.5,10]];
  for(let i=0;i<days.length;i++){const d=addDays(TODAY,days[i]);
    ws.push({id:'u'+i,doc:{date:d,title:'Upper',source:'app',rpe:i===5?9:7,exercises:[{name:'Neutral-grip lat pulldown',sets:S(pull[i][0],pull[i][1],2,i===5?0:2)},{name:'Pec deck',sets:S(pec[i][0],pec[i][1])},{name:'Hammer curl',sets:S(14,10,2)}]}});
    ws.push({id:'l'+i,doc:{date:addDays(d,1),title:'Legs A',source:'app',exercises:[{name:'Hack squat',sets:S(hack[i][0],hack[i][1])},{name:'Lying leg curl',sets:S(40,10)}]}});}
  ws.push({id:'q1',doc:{date:addDays(TODAY,-3),title:'Back',source:'quick',exercises:[]}});
  for(const w of ws)await db.doc('workouts/'+w.id).set(w.doc);
  for(let i=0;i<14;i++)await db.doc('habits/'+addDays(TODAY,-i)).set({date:addDays(TODAY,-i),sleepH:i<3?5.5:7.5});
  for(let i=0;i<21;i++)await saveCheckin(addDays(TODAY,-20+i),{weight:87.2+i*0.02,...(i%7===0?{waist:84+i*0.05}:{})});
});
await p.waitForTimeout(800);
await p.evaluate(()=>goTo('body'));await p.evaluate(()=>show('progress','lifts'));await p.waitForTimeout(400);
const lifts=await p.$$eval('details.lift summary',e=>e.map(x=>x.innerText.replace(/\n+/g,' | ')));console.log('   lifts:',lifts);
ok('pulldown says go up',lifts.some(x=>/Neutral-grip lat pulldown/.test(x)&&/Go up/.test(x)));
ok('hack squat flags fatigue',lifts.some(x=>/Hack squat/.test(x)&&/Fatigue/.test(x)));
ok('pec deck flags plateau',lifts.some(x=>/Pec deck/.test(x)&&/Plateau/.test(x)));
await p.click('details.lift summary');await p.waitForTimeout(200);
const open=await p.$eval('details.lift[open]',e=>e.innerText.replace(/\n+/g,' | '));console.log('   first open:',open);
ok('dashboard shows previous / latest / best / 1RM / sets',/Previous/.test(open)&&/Latest/.test(open)&&/Best ever/.test(open)&&/1RM|Best reps/.test(open)&&/in 28 days/.test(open));
const pd=await p.evaluate(()=>{const r=liftReport(liftHistory()['neutral-grip lat pulldown']);return r.flags.map(f=>f[1]).join(' ')});ok('go-up suggests next weight',/65kg/.test(pd),pd);
const vol=await p.$$eval('#vol-card .vrow',e=>e.map(x=>x.innerText.replace(/\n+/g,' | ')));console.log('   volume:',vol.slice(0,6));
ok('volume rows with direct/indirect',vol.some(x=>/Lats|Upper back/.test(x)&&/direct/.test(x)&&/indirect/.test(x)));
const back=await p.evaluate(()=>{const g=volumeIn(addDays(TODAY,-7),TODAY).g;return {d:((g.Lats||{}).d||0)+((g['Upper back']||{}).d||0)}});ok('quick-marked Back session counted from its plan',back.d>=10,JSON.stringify(back));
const bi=await p.evaluate(()=>volumeIn(addDays(TODAY,-7),TODAY).g.Biceps);ok('pulldown counts as indirect biceps, curls direct',bi.d===4&&bi.i>=2,JSON.stringify(bi));
await p.click('#mt-edit');await p.fill('[data-mtmin="Chest"]','10');await p.fill('[data-mtmax="Chest"]','14');await p.click('#mt-edit');await p.waitForTimeout(300);
ok('targets editable and saved',await p.evaluate(()=>mTarget('Chest'))===12);
const eff=await p.$eval('#effort-card',e=>e.innerText.replace(/\n+/g,' | '));console.log('   effort:',eff.slice(0,400));
ok('effort tables by sleep and shift',/By sleep/i.test(eff)&&/Under 6h sleep/.test(eff)&&/Night shift/.test(eff));
await p.screenshot({path:SH+'lifts.png',fullPage:true});
// readiness
await p.click('#tab-training');await p.evaluate(()=>show('training','gym'));await p.evaluate(()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true));await p.waitForTimeout(300);const rd=await p.$eval('#ready-card',e=>e.innerText.replace(/\n+/g,' | '));console.log('   ready:',rd);
ok('readiness shows fatigue and reasons',/Fatigue: (Moderate|High)/.test(rd)&&/Sleep averaging 5.5h/.test(rd)&&/Lats|Upper back/.test(rd));
await p.screenshot({path:SH+'ready.png'});
// library: edit a guessed exercise
await p.evaluate(()=>show('training','library'));await p.waitForTimeout(200);
await p.click('#lib-new');await p.fill('#lib-name','Cable crunch');await p.selectOption('#lib-p','Core');await p.click('#lib-save');await p.waitForTimeout(300);
ok('new exercise saved',await p.evaluate(()=>exInfo('Cable crunch').p==='Core'&&knownExercises().includes('Cable crunch')));
await p.fill('#lib-q','hammer');await p.waitForTimeout(150);await p.click('[data-libedit="hammer curl"]');await p.click('[data-libs="Lats"]');await p.click('#lib-save');await p.waitForTimeout(300);
ok('edit adds indirect muscle',await p.evaluate(()=>exInfo('Hammer curl').s.includes('Lats')&&exInfo('Hammer curl').src==='you'));
await p.screenshot({path:SH+'library.png'});
// live workout RIR + difficulty
await p.evaluate(()=>show('training','gym'));await p.click('.tw button[data-tpl]');await p.click('#pv-start');await p.waitForTimeout(300);
await p.fill('[data-f="kg"][data-ex="0"][data-s="0"]','60');await p.fill('[data-f="reps"][data-ex="0"][data-s="0"]','9');await p.selectOption('select[data-ex="0"][data-s="0"]','2');await p.click('[data-ok="0:0"]');
await p.screenshot({path:SH+'rir.png'});
await p.click('#w-finish');await p.waitForTimeout(500);await p.click('#w-done [data-rate="8"]');await p.waitForTimeout(400);
const saved=await p.evaluate(()=>{const w=D.workouts.find(w=>w.date===TODAY&&w.source==='app');return w?JSON.stringify({rpe:w.rpe,set:w.exercises[0].sets[0]}):null});
ok('RIR and difficulty saved with the session',saved&&/"rpe":8/.test(saved)&&/"rir":2/.test(saved),saved);
// weight dashboard
await p.evaluate(()=>goTo('body'));await p.evaluate(()=>show('progress','body'));await p.waitForTimeout(300);
const st=await p.$$eval('#prog-stats .stat',e=>e.map(x=>x.innerText.replace(/\n+/g,' ')));console.log('   body stats:',st);
ok('7-day, 28-day, rate %, waist shown',st.some(x=>/7-day average/i.test(x)&&/vs the 7 days before/.test(x))&&st.some(x=>/28-day trend/i.test(x))&&st.some(x=>/Weekly rate/i.test(x)&&/%/.test(x)&&/\+0\.1% to \+0\.25%/.test(x))&&st.some(x=>/Waist/i.test(x)&&/cm/.test(x)));
ok('target line drawn',await p.$$eval('#ch-weight path[stroke-dasharray]',e=>e.length)===1);
await p.screenshot({path:SH+'body.png',fullPage:true});
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
