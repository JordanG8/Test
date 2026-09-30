const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const FPS=30,TOTAL=1800,W=4;
(async()=>{
 fs.mkdirSync('frames',{recursive:true});
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 await Promise.all([...Array(W).keys()].map(async w=>{
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.goto('file:///home/user/Test/ad/index.html#capture');await p.evaluate(()=>window.ready);
  for(let f=w;f<TOTAL;f+=W){await p.evaluate(t=>render(t),f/FPS);await p.screenshot({path:`frames/${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:93});}
 }));
 await b.close();console.log('done');
})();
