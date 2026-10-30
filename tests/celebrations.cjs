const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 let server;
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await p.route('**/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();',"updateDownDisplay();setup();window.showCelebration=beginPointChoice;})();")});});
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');for(const team of ['blue','red']){
   await p.locator('#reset').click();await p.evaluate(team=>showCelebration(team),team);
   assert.equal(await p.locator('#celebrationButtons').count(),0);
   assert.equal(await p.locator('#celebrationPlayer').isVisible(),true);
   const clip=new URL(await p.locator('#celebrationVideo').getAttribute('src'));
   assert(clip.pathname.endsWith('/DbyIORYMzMw'));
   assert.equal(clip.searchParams.get('autoplay'),'1');assert.equal(clip.searchParams.get('mute'),'1');
   assert((await p.locator('#celebrationHeading').textContent()).includes(team==='blue'?'HOME':'AWAY'));
   await p.locator('#celebrationClose').click();assert.equal(await p.locator('#celebrationVideo').getAttribute('src'),null);
  }
  await p.close();
  let revision=0;
  server=http.createServer((req,res)=>{
   const name=new URL(req.url,'http://localhost').pathname;
   const file=path.join(process.cwd(),'dist',name==='/'?'index.html':name.slice(1));
   if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
   let data=fs.readFileSync(file);
   if(name==='/'||name==='/index.html')data=Buffer.from(data.toString().replace('<main>','<main data-release="'+revision+'">'));
   if(name==='/service-worker.js')data=Buffer.from(data.toString().replace("const CACHE_NAME = '","const CACHE_NAME = 'update-test-"+revision+'-'));
   const type=name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':name.endsWith('.webmanifest')?'application/manifest+json':'text/html';
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await page.reload();
  assert.equal(await page.locator('main').getAttribute('data-release'),'0');revision=1;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(()=>document.querySelector('main')?.dataset.release==='1');
  console.log('PASS: HOME/AWAY touchdowns automatically open Griddy without choices; Continue stops the clip; installing a new release automatically refreshes an existing controlled page.');
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
