// Back split into Lats and Upper back; old saved exercises (Back/Traps) and targets are converted.
const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(async()=>{await db.doc('prefs/exdb').set({map:{
  "kelso shrugs":{name:"Kelso shrugs",p:"Traps",s:["Back"],eq:"Machine",cat:"Isolation",w:{Back:0.25}},
  "birtley row low":{name:"Birtley row low",p:"Back",s:["Biceps"],eq:"Machine",cat:"Horizontal pull",w:{Biceps:0.5}},
  "birtley row high":{name:"Birtley row high",p:"Back",s:["Traps","Side/rear delts"],eq:"Machine",cat:"Horizontal pull",w:{Traps:0.5,"Side/rear delts":0.25}},
  "pull down":{name:"Pull down",p:"Back",s:["Biceps"],eq:"Cable",cat:"Vertical pull"},
  "chin ups":{name:"Chin ups",p:"Biceps",s:["Back"],eq:"Bodyweight",cat:"Vertical pull"},
  "face pulls":{name:"Face pulls",p:"Side/rear delts",s:["Traps"],eq:"Cable",cat:"Isolation"}}});
  await db.doc('prefs/mtargets').set({map:{Traps:{min:6,max:9,pri:true},Back:{min:12,max:18,pri:true}}})});
await p.reload();await p.waitForTimeout(1200);
const I=n=>p.evaluate(n=>{const i=exInfo(n);return i.p+' ['+i.s.join(', ')+']'+(i.w?' '+JSON.stringify(i.w):'')},n);
ok('traps exercise -> Upper back',(await I('Kelso shrugs'))==='Upper back []',await I('Kelso shrugs'));
ok('low row -> Lats, also Upper back',(await I('Birtley row low')).startsWith('Lats [Upper back, Biceps]'),await I('Birtley row low'));
ok('high row -> Upper back, also Lats',(await I('Birtley row high')).startsWith('Upper back [Lats, Side/rear delts]'),await I('Birtley row high'));
ok('pulldown -> Lats',(await I('Pull down')).startsWith('Lats'));
ok('chin ups also work Lats',(await I('Chin ups'))==='Biceps [Lats]');
ok('face pulls also work Upper back',(await I('Face pulls'))==='Side/rear delts [Upper back]');
ok('machine high row is a row, not a chin-up',(await I('Machine high row')).startsWith('Upper back'));
ok('guess: machine shrug is a shrug',(await I('Hammer strength machine shrug')).startsWith('Upper back'),await I('Hammer strength machine shrug'));
ok('saved list converted',await p.evaluate(async()=>{const m=(await db.doc('prefs/exdb').get()).data().map;return !JSON.stringify(m).match(/"(Traps|Back)"/)}));
ok('targets converted',await p.evaluate(()=>JSON.stringify(mRange('Upper back'))==='{"min":6,"max":9,"pri":true}'&&mRange('Lats').min===12&&!D.mtargets.Traps&&!D.mtargets.Back),await p.evaluate(()=>JSON.stringify(D.mtargets)));
await p.evaluate(()=>goTo('library'));await p.waitForTimeout(300);
const lib=await p.$eval('#view-library',e=>e.innerText);ok('library groups',/Lats/i.test(lib)&&/Upper back/i.test(lib)&&!/\bTraps\b/i.test(lib));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
