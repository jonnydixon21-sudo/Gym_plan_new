const { chromium } = require('playwright');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
// 21 days of weigh-ins gaining ~0.15%/wk at ~88kg  (0.13kg/wk)
await p.evaluate(async()=>{for(let i=0;i<21;i++)await saveCheckin(addDays(TODAY,-20+i),{weight:+(88+i*0.019).toFixed(2)})});await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const TR=weightTrend(),PS=paceStatus(TR.pct),sg=suggestion(),W=weekStats(),sc=fallbackScript(W),n=cvNotes(W,{});goTo('body');try{renderWeek()}catch(e){}
  return {pct:TR.pct,ps:PS.label,sg:sg.pill[0],sgmsg:sg.msg,script:sc.weight,note:n.weight,stats:JSON.stringify(statsForPrompt(W)).match(/"weightTrend[^,]*,"weightTrendPct[^,]*,"weightTarget[^,]*,"weightTrendVerdict":"[^"]*"/)?.[0],brief:/0\.2.{0,3}0\.5/.test(COACH_BRIEF)||/skinny-fat|weekly average weight drops/.test(COACH_BRIEF)}});
console.log(JSON.stringify(r,null,1));
ok('chart, advice, coach and pen note agree (bulk, on target)',r.ps==='On target'&&r.sg==='On target'&&/right on your target/.test(r.script)&&r.note==='right on target');
ok('coach gets the same numbers',/On target/.test(r.stats||'')&&/0\.1% to \+0\.25%/.test(r.stats||''),r.stats);
ok('no fixed 0.2–0.5 range or fat-loss lines in bulk brief',!r.brief);
// a faster gain: 0.5%/wk
await p.evaluate(async()=>{for(let i=0;i<21;i++)await saveCheckin(addDays(TODAY,-20+i),{weight:+(88+i*0.063).toFixed(2)})});await p.waitForTimeout(600);
const f=await p.evaluate(()=>{const W=weekStats();return {ps:paceStatus(weightTrend().pct).label,sg:suggestion().pill[0],note:cvNotes(W,{}).weight,script:fallbackScript(W).weight}});
ok('too fast: all say so',f.ps==='Faster than target'&&f.sg==='Faster than target'&&f.note==='a bit quick'&&/faster than target/.test(f.script),JSON.stringify(f));
// cut mode
await p.evaluate(()=>{SETUP.mode='cut'});const c=await p.evaluate(()=>({ps:paceStatus(-0.75).label,lo:paceStatus(-1.4).label,hi:paceStatus(-0.2).label,short:paceStatus(-0.2).short}));
ok('cut verdicts',c.ps==='On target'&&c.lo==='Losing faster than target'&&c.hi==='Losing slower than target'&&c.short==='too slow',JSON.stringify(c));
const g=await p.evaluate(()=>{SETUP.goalWeight=80;return goalStat([{y:88}],-0.6).replace(/<[^>]+>/g,' ')});ok('cut goal not marked reached',!/Reached/.test(g)&&/kg to go/.test(g),g);
const g2=await p.evaluate(()=>{SETUP.mode='bulk';SETUP.goalWeight=93;return goalStat([{y:88}],0.2).replace(/<[^>]+>/g,' ')});ok('bulk goal eta',/weeks at \+0\.2kg/.test(g2),g2);
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
