const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details[data-fold]:not([open]):not([data-t])').forEach(d=>{d.open=true;d.dataset.t=1}),80)});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const where=await p.evaluate(()=>{const el=document.getElementById('tg-card');return el.closest('section.top').id+' / '+(el.closest('.view')||{}).id});console.log('tg-card in',where);
const w=await p.evaluate(()=>{const w=weekTotals();
  // independent check
  let tk=0,mk=0;for(let i=0;i<7;i++){const d=addDays(TODAY,i),x=dayInfo(d);tk+=PLAN[x.type].kcal;SCHED[x.slot][x.type].rows.forEach(r=>{if(MEALS[r[1]])mk+=mealMac(r[1]).kcal})}
  return {w,tk,mk}});
ok('target sums 7 rota days',w.w.tg.kcal===w.tk&&w.w.ml.kcal===w.mk,JSON.stringify(w.w.tg)+' meals '+JSON.stringify(w.w.ml));
ok('counts add to 7',w.w.cnt.day+w.w.cnt.night+w.w.cnt.off===7&&w.w.cnt.T+w.w.cnt.R===7,JSON.stringify(w.w.cnt));
for(const pth of [['schedule','days'],['nutrition','targets']]){await p.evaluate(a=>goTo(a[0],a[1]),pth);await p.waitForTimeout(250);
  const vis=await p.evaluate(()=>{const t=document.querySelector('#tg-card .wkt');return t&&t.offsetParent!==null});console.log(pth.join('/'),'week table visible:',vis)}
const txt=await p.evaluate(()=>document.querySelector('#tg-card .wk').innerText);console.log(txt);
ok('table has target meals difference',/Target/.test(txt)&&/Meals/.test(txt)&&/Difference/.test(txt));
await p.evaluate(()=>{const t=document.querySelector('#tg-card .wk');if(t.offsetParent)t.scrollIntoView({block:'center'})});await p.waitForTimeout(200);await p.screenshot({path:SH+'weektot.png'});
console.log('errors',errs,'FAILS',fails);await b.close();process.exit(fails||errs.length?1:0)})();
