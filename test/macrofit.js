const { chromium } = require('playwright');const fs=require('fs');
let fails=0;const ok=(n,c,x)=>{if(!c)fails++;console.log((c?'PASS':'FAIL')+' '+n+(x!==undefined?' -> '+x:''))};
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8791/index.html');await p.waitForTimeout(1000);
const bk=process.env.BK;if(bk){const d=JSON.parse(fs.readFileSync(bk,'utf8'));await p.evaluate(async d=>{await window.__importAll(d);localStorage.setItem(KEY,JSON.stringify(d.local))},d);await p.reload();await p.waitForTimeout(1500)}
else{await p.evaluate(async()=>{for(let i=0;i<10;i++)await saveCheckin(addDays(TODAY,-9+i),{weight:88})});await p.waitForTimeout(400)}
const before=await p.evaluate(()=>fitReport());console.log('before',JSON.stringify({kcal:before.kcal,p:before.p,c:before.c,f:before.f}));
await p.evaluate(()=>{goTo('nutrition','targets');window.TGD=null;renderTargets()});await p.waitForTimeout(300);
const lb=await p.evaluate(()=>bodyLb());
const v=await p.evaluate(()=>['T:p','T:f','T:c','T:kcal'].map(k=>document.querySelector(`[data-tg="${k}"]`).value));
ok('formula fills protein 1g/lb and fat 0.3g/lb',+v[0]===Math.round(lb)&&+v[1]===Math.round(lb*0.3),v.join()+' lb '+lb.toFixed(1));
await p.fill('[data-tg="T:kcal"]','3200');await p.waitForTimeout(100);
const v2=await p.evaluate(()=>['T:p','T:f','T:c'].map(k=>+document.querySelector(`[data-tg="${k}"]`).value));
ok('calories drive carbs only',v2[0]===Math.round(lb)&&v2[1]===Math.round(lb*0.3)&&v2[2]===Math.round((3200-4*v2[0]-9*v2[1])/4),v2.join());
ok('protein/fat read-only with formula on',await p.evaluate(()=>document.querySelector('[data-tg="T:p"]').readOnly));
await p.click('#tg-fit');await p.waitForTimeout(800);await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e&&!e.hidden){console.log('pop:',e.innerText.replace(/\n+/g,' | '));e.hidden=true}});
const after=await p.evaluate(()=>({r:fitReport(),msg:document.getElementById('tg-msg').textContent,tg:PLAN.T,rule:planDoc().macroRule}));
console.log('after',JSON.stringify({kcal:after.r.kcal,p:after.r.p,c:after.r.c,f:after.r.f}),after.msg);
ok('targets saved with formula',after.tg.kcal===3200&&after.tg.p===Math.round(lb)&&after.rule===true);
ok('every day plan close to targets',after.r.rows.filter(x=>Math.abs(x.d.kcal)<=150).length>=after.r.rows.length-2&&after.r.p<=15,JSON.stringify(after.r.rows.map(x=>x.n+':'+Math.round(x.d.kcal)+'/'+Math.round(x.d.p)+'/'+Math.round(x.d.c)+'/'+Math.round(x.d.f))));
ok('better than before',after.r.kcal<=Math.max(before.kcal,150));
ok('overnight oats untouched',await p.evaluate(()=>!MEALS.oor||JSON.stringify(MEALS.oor.items.map(i=>i[1]))===JSON.stringify((planDoc().meals.oor||MEALS.oor).items.map(i=>i[1]))));
await p.screenshot({path:SH+'macrofit.png',fullPage:false});
// own numbers
await p.evaluate(()=>{window.TGD=null;renderTargets()});await p.uncheck('#tg-rule');await p.waitForTimeout(100);
await p.fill('[data-tg="T:p"]','170');await p.waitForTimeout(80);ok('own numbers editable when formula off',await p.evaluate(()=>+document.querySelector('[data-tg="T:p"]').value===170&&!document.querySelector('[data-tg="T:p"]').readOnly));
console.log('errors:',JSON.stringify(errs.slice(0,5)));console.log('FAILS',fails);await b.close()})();
