const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>goTo('training','gym'));await p.waitForTimeout(300);
await p.evaluate(()=>{const b=[...document.querySelectorAll('.tw button[data-tpl]')].find(x=>x.dataset.tpl==='Upper');b.click()});await p.click('#pv-start');await p.waitForTimeout(400);
const names=await p.evaluate(()=>W.exercises.map(e=>e.name));console.log('   ',names.join(' | '));
// find an exercise with no ALTG group
const ei=await p.evaluate(()=>W.exercises.findIndex(e=>!groupOf(e)));console.log('   ungrouped index',ei,ei>=0?await p.evaluate(i=>W.exercises[i].name,ei):'');
const idx=ei>=0?ei:0;
await p.click(`[data-swapex="${idx}"]`);await p.waitForTimeout(200);
const opts=await p.$$eval(`.wex[data-ex="${idx}"] .exalt b`,e=>e.map(x=>x.textContent));ok('swap shows exercises to pick',opts.length>=3,opts.join(', '));
await p.evaluate(i=>document.querySelector(`.wex[data-ex="${i}"] .exalts`).scrollIntoView({block:'center'}),idx);await p.screenshot({path:SH+'swap2.png'});
const pick=opts[0];await p.click(`.wex[data-ex="${idx}"] .exalt >> nth=0`);await p.waitForTimeout(200);
ok('picked one swaps it',await p.evaluate(([i,n])=>W.exercises[i].name===n&&!!W.exercises[i].from,[idx,pick]));
// type any exercise
await p.click(`[data-swapex="${idx}"]`);await p.fill('#sw-any','Cable crossover');await p.check('#sw-always');await p.click(`[data-pickany="${idx}"]`);await p.waitForTimeout(300);
ok('typed exercise + always changes the workout itself',await p.evaluate(i=>W.exercises[i].name==='Cable crossover'&&tplOf(W.title).ex.some(e=>e.name==='Cable crossover')&&!Object.values(D.exswaps).includes('Cable crossover'),idx));
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
