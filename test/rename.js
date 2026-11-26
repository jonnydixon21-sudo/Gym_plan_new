const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(async()=>{await db.doc('workouts/r1').set({date:addDays(TODAY,-6),title:'Legs B',source:'app',exercises:[{name:'Romanian deadlift',sets:[{kg:60,reps:8}]}]});
  D.rest={...(D.rest||{}),'romanian deadlift':150};await db.doc('prefs/rest').set({map:D.rest});wnSet('e:romanian deadlift','Orange machine');});
await p.waitForTimeout(900);
await p.evaluate(()=>goTo('training','library'));await p.click('[data-sub="training:library"]');await p.waitForTimeout(300);
await p.fill('#lib-q','romanian');await p.waitForTimeout(200);await p.click('[data-libedit="romanian deadlift"]');await p.waitForTimeout(200);
ok('name box editable',await p.evaluate(()=>!!document.getElementById('lib-name')&&document.getElementById('lib-name').value==='Romanian deadlift'));
await p.screenshot({path:SH+'rename.png'});
await p.fill('#lib-name','RDL machine');await p.click('#lib-save');await p.waitForTimeout(800);
const r=await p.evaluate(()=>({tpl:TEMPLATES.some(t=>tplOf(t.title).ex.some(e=>e.name==='RDL machine'))&&!TEMPLATES.some(t=>tplOf(t.title).ex.some(e=>e.name==='Romanian deadlift')),
  hist:D.workouts.find(w=>w._id==='r1').exercises[0].name,rest:D.rest['rdl machine'],note:wnGet('e:rdl machine'),lib:libNames().map(x=>x.n).filter(n=>/romanian|rdl/i.test(n)),info:exInfo('RDL machine')&&exInfo('RDL machine').p}));
ok('workouts renamed',r.tpl);ok('history renamed',r.hist==='RDL machine',r.hist);ok('rest kept',r.rest===150);ok('note kept',r.note==='Orange machine');
ok('library shows only new name',r.lib.join()==='RDL machine',r.lib.join());ok('muscles kept',r.info==='Hamstrings'||!!r.info,r.info);
await p.reload();await p.waitForTimeout(1000);
ok('persists after reload',await p.evaluate(()=>D.workouts.find(w=>w._id==='r1').exercises[0].name==='RDL machine'&&TEMPLATES.some(t=>tplOf(t.title).ex.some(e=>e.name==='RDL machine'))&&!libNames().some(x=>x.n==='Romanian deadlift')));
// merge warning
await p.evaluate(()=>goTo('training','library'));await p.click('[data-sub="training:library"]');await p.waitForTimeout(200);
await p.fill('#lib-q','hack');await p.waitForTimeout(150);await p.click('[data-libedit="hack squat"]');await p.fill('#lib-name','Leg press');await p.click('#lib-save');await p.waitForTimeout(200);
ok('warns before merging',await p.evaluate(()=>/already exists/.test(document.getElementById('lib-msg').textContent)));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
