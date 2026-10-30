const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 let server;
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await p.route('**/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();',"updateDownDisplay();setup();window.showCelebration=beginPointChoice;})();")});});
  // Stub the documented YouTube API to test end events without network/video timing.
  await p.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:`window.youtubeTestPlayers=[];window.YT={PlayerState:{ENDED:0},Player:function(frame,options){this.mute=()=>{};this.playVideo=()=>{};this.destroy=()=>frame.remove();this.end=()=>options.events.onStateChange({data:0,target:this});window.youtubeTestPlayers.push(this);queueMicrotask(()=>options.events.onReady({target:this}));}};window.onYouTubeIframeAPIReady();`}));
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');for(const team of ['blue','red']){
   await p.locator('#reset').click();await p.evaluate(team=>showCelebration(team),team);
   assert.equal(await p.locator('#celebrationButtons').count(),0);
   assert.equal(await p.locator('#celebrationPlayer').isVisible(),true);
   const clip=new URL(await p.locator('#celebrationVideo').getAttribute('src'));
   assert(clip.pathname.endsWith('/DbyIORYMzMw'));
   assert.equal(clip.searchParams.get('end'),'6');
   assert.equal(clip.searchParams.get('autoplay'),'1');assert.equal(clip.searchParams.get('mute'),'1');
   assert((await p.locator('#celebrationHeading').textContent()).includes(team==='blue'?'HOME':'AWAY'));
   await p.waitForFunction(()=>window.youtubeTestPlayers?.length>0);
   await p.evaluate(()=>window.youtubeTestPlayers.at(-1).end());
   assert.equal(await p.locator('#celebrationOverlay').isVisible(),false);
   assert.equal(await p.locator('#celebrationVideo').getAttribute('src'),null);
   // An old video's delayed end event cannot dismiss a later celebration.
   await p.evaluate(()=>{window.previousVideo=window.youtubeTestPlayers.at(-1);});
   await p.evaluate(team=>showCelebration(team),team);
   await p.evaluate(()=>window.previousVideo.end());
   assert.equal(await p.locator('#celebrationOverlay').isVisible(),true);
   await p.locator('#celebrationClose').click();
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
  console.log('PASS: HOME/AWAY touchdowns automatically open Griddy without choices; video end returns to game; stale end events are ignored; Continue stops the clip; installing a new release automatically refreshes an existing controlled page.');
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
