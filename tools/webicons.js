/* Re-renders the app icons into assets/icons/ from assets/icon-only.png. Only needed when the icon changes. */
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path'),ROOT=path.join(__dirname,'..');
(async()=>{const b=await chromium.launch();
const data='data:image/png;base64,'+fs.readFileSync(path.join(ROOT,'assets/icon-only.png')).toString('base64');
for(const S of [180,192,512]){const p=await b.newPage({viewport:{width:S,height:S}});
 await p.setContent(`<body style="margin:0;background:#1e1f21"><img id="i" src="${data}" style="width:${S}px;height:${S}px;display:block"></body>`);
 await p.waitForFunction(()=>document.getElementById('i').complete&&document.getElementById('i').naturalWidth>0);
 await p.screenshot({path:path.join(ROOT,`assets/icons/icon-${S}.png`)});await p.close()}
await b.close()})();
