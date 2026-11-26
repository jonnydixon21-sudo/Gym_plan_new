const { chromium } = require('playwright');
const SH=(process.env.SHOTS||'/tmp/gym-shots/');
const U='http://localhost:8791/index.html';
const prod={status:1,product:{product_name:"Protein Bar",brands:"Grenade",quantity:"60g",serving_size:"60 g",serving_quantity:60,nutriments:{"energy-kcal_100g":370,proteins_100g:33,carbohydrates_100g:30,fat_100g:15,"energy-kcal_serving":222,proteins_serving:20,carbohydrates_serving:18,fat_serving:9}}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.addInitScript(()=>{setInterval(()=>document.querySelectorAll('details.mgroup:not([open])').forEach(d=>d.open=true),60)});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.route('**/world.openfoodfacts.org/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(prod)}));
await p.goto(U);await p.waitForTimeout(900);
const vx=await p.$('#vid-x');if(vx&&await vx.isVisible())await vx.click();
const rows=(s,t)=>p.evaluate(([s,t])=>SCHED[s][t].rows.map(r=>r[0]+' '+(MEALS[r[1]]?MEALS[r[1]].m:r[1])).join(' | '),[s,t]);
// ---- meals flat + assign
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));await p.waitForTimeout(200);
console.log('headings (should be 0):',await p.$$eval('#plans h2',e=>e.length),'| cards:',await p.$$eval('#plans .meal',e=>e.length),'| add-own:',await p.$$eval('.addown',e=>e.length),'| share boxes:',await p.$$eval('[data-share]',e=>e.length));
await p.screenshot({path:SH+'meals-flat.png'});
await p.click('#meal-d_sk .cogm');await p.waitForTimeout(200);
console.log('assign state:',await p.$$eval('[data-asg]',e=>e.map(x=>x.dataset.asg+':'+x.checked)),await p.$$eval('[data-ast]',e=>e.map(x=>x.value)));
await p.screenshot({path:SH+'assign.png',fullPage:true});
await p.check('[data-asg="night"]');await p.fill('[data-ast="night"]','03:00');await p.dispatchEvent('[data-ast="night"]','change');
await p.check('[data-asg="off"]');await p.fill('[data-ast="off"]','16:00');await p.dispatchEvent('[data-ast="off"]','change');
await p.uncheck('[data-asg="day"]');
await p.click('#med-save');await p.waitForTimeout(400);
// adding the meal to days that were already on target: they go over, so the can't-fit pop-up shows
console.log('pop:',await p.evaluate(()=>{const e=document.getElementById('fitpop');if(e&&!e.hidden){e.hidden=true;return 'shown'}return 'none'}));
console.log('day T:',await rows('day','T'));console.log('n1 T:',await rows('n1','T'));console.log('n2 R:',await rows('n2','R'));console.log('off T:',await rows('off','T'));
console.log('label:',await p.$eval('#meal-d_sk .usedin',e=>e.textContent));
// new meal
await p.click('#nmeal-new');await p.waitForTimeout(300);await p.fill('#med-name','Bagel & eggs');await p.check('[data-asg="day"]');await p.fill('[data-ast="day"]','06:15');await p.dispatchEvent('[data-ast="day"]','change');await p.click('#med-save');await p.waitForTimeout(400);
console.log('day T after new:',await rows('day','T'));
// rota: no her
await p.evaluate(()=>goTo('food','shifts'));await p.waitForTimeout(200);console.log('her buttons:',await p.$$eval('[data-heropen]',e=>e.length));
// ---- split
await p.evaluate(()=>goTo('gym'));await p.evaluate(()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true));await p.waitForTimeout(300);
const split=()=>p.$$eval('#split-card li b',e=>e.map(x=>x.textContent).join(' | '));
console.log('split:',await split(),'| next:',await p.$eval('#w-next',e=>e.textContent));
await p.click('[data-tplnew]');await p.waitForTimeout(300);
await p.fill('#ed-name','Arms');await p.click('#ed-add');await p.keyboard.type('Hammer curl');await p.click('#ed-save');await p.waitForTimeout(400);
console.log('cards:',await p.$$eval('.tw button[data-tpl] b',e=>e.map(x=>x.textContent).join(', ')));
await p.selectOption('#sp-add',{label:'Arms'});await p.click('#sp-addbtn');await p.waitForTimeout(300);
await p.click('[data-sprm="2"]');await p.waitForTimeout(300); // remove Back
const n=await p.$$eval('#split-card li',e=>e.length);for(let i=n-1;i>1;i--){await p.click(`[data-spup="${i}"]`);await p.waitForTimeout(150)} // Arms to position 2
await p.selectOption('#sp-add',{label:'Upper'});await p.click('#sp-addbtn');await p.waitForTimeout(300);
console.log('split now:',await split());
console.log('planned next days:',await p.evaluate(()=>[0,1,2,3,4,5,6,7,8,9].map(i=>plannedWorkout(addDays(TODAY,i))||'-').join(', ')));
// log Upper today -> next should be Arms (position 2)
await p.evaluate(()=>db.doc('workouts/q1').set({date:TODAY,title:'Upper',exercises:[],source:'quick'}));await p.waitForTimeout(300);
console.log('after Upper: next=',await p.evaluate(()=>nextTemplate()));
await p.screenshot({path:SH+'split.png',fullPage:true});
await p.reload();await p.waitForTimeout(900);console.log('persist split:',await p.evaluate(()=>ORDER.join(' | ')));
// ---- barcode serving + multiplier
await p.evaluate(()=>goTo('food'));await p.evaluate(()=>goTo('food','meals'));await p.click('#nfood-new');await p.fill('#fov-code','5060123456789');await p.click('#fov-look');await p.waitForTimeout(400);
console.log('100g:',await p.$$eval('[data-fv]',e=>e.map(x=>x.value)),await p.$eval('#fov-prev',e=>e.textContent));
await p.click('[data-fm="2"]');console.log('100g x2:',await p.$eval('#fov-prev',e=>e.textContent));
await p.click('[data-fb="serv"]');console.log('serving x2:',await p.$$eval('[data-fv]',e=>e.map(x=>x.value)),await p.$eval('#fov-prev',e=>e.textContent));
await p.screenshot({path:SH+'serv.png',fullPage:true});
await p.click('#fov-save');await p.waitForTimeout(300);console.log('saved:',await p.$eval('#myfoods',e=>e.innerText.replace(/\n/g,' | ')),'| def:',await p.evaluate(()=>{const k=Object.keys(F).find(k=>k.startsWith('x_'));return FM[k].def}));
console.log('errors:',errs);await b.close()})();
