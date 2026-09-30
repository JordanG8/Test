const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(async()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('console',m=>console.log('console',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file:///home/user/Test/ad/index.html#capture');await p.evaluate(()=>window.ready);
 const ts=process.argv.slice(2).map(Number);
 for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`/tmp/claude-0/-home-user-Test/5e2d36ae-7d7c-540e-838d-dc0a84ec6d4c/scratchpad/f_${t}.jpg`,type:'jpeg',quality:70});}
 await b.close();
})();
