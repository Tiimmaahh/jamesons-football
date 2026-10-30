const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const page=await browser.newPage({serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',async route=>{
   const response=await route.fetch(),source=await response.text();
   const hook=`window.testRB=(play,team,spot)=>{
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';
    setDriveSpot(70+spot*YARD_PIXELS);setup();playSel.value=play;begin();
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    playType=play;scrambleEligible=false;
    const rb=players.find(p=>p.role==='RB'),qb=players.find(p=>p.role==='QB');
    for(const p of players.filter(p=>p.team===defenseTeam)){p.x=22;p.y=550;p.speed=0;}
    const originalRandom=Math.random;Math.random=()=>.99;
    try{
     if(play==='run'){
      for(let i=0;i<18;i++)update(1/60);
      const before=carrier===qb;
      for(let i=0;i<18;i++)update(1/60);
      return {before,handoff:carrier===rb,noRoute:rb.passRouteDistance===undefined};
     }
     // The real random target selector must be able to choose RB (first eligible).
     Math.random=()=>0;update(1/60);Math.random=()=>.99;
     const selected=routeReceiver===rb,startY=rb.homeY;
     let previous={x:rb.x,y:rb.y},maxStep=0,earlyForward=false,cut=false,threw=false,caught=false;
     for(let i=1;i<240;i++){
      update(1/60);
      maxStep=Math.max(maxStep,Math.hypot(rb.x-previous.x,rb.y-previous.y));
      previous={x:rb.x,y:rb.y};
      if(i===8)earlyForward=rb.x>rb.homeX+10&&rb.y===startY;
      if(rb.y<startY-10)cut=true;
      if(passTarget===rb)threw=true;
      if(carrier===rb||Number(document.getElementById(team+'Score').textContent)>=6){caught=true;break;}
     }
     const routeX=rb.x,routeY=rb.y,expectedX=runningBackRoute(rb).cutX;
     let yac=false,tackled=false;
     if(phase==='live'&&carrier===rb){
      for(let i=0;i<12;i++)update(1/60);
      yac=rb.x>routeX;
      const defender=players.find(p=>p.team===defenseTeam&&p.role==='DB');
      defender.x=rb.x;defender.y=rb.y;update(1/60);
      tackled=phase==='ended';
     }
     return {selected,earlyForward,cut,threw,caught,maxStep,speed:rb.speed,routeY,routeX,expectedX,yac,tackled};
    }finally{Math.random=originalRandom;}
   };`;
   await route.fulfill({response,body:source.replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});
  });
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:8000');
  for(const team of ['blue','red'])for(const play of ['short','deep','run'])for(const spot of [25,90,98]){
   await page.locator('#reset').click();
   const r=await page.evaluate(({play,team,spot})=>testRB(play,team,spot),{play,team,spot});
   if(play==='run'){assert(r.before&&r.handoff&&r.noRoute,JSON.stringify({play,team,spot,r}));continue;}
   assert(r.selected&&r.earlyForward&&r.cut&&r.threw&&r.caught,JSON.stringify({play,team,spot,r}));
   assert(r.maxStep<=r.speed/60+.001,'route must preserve speed without teleporting');
   assert(Math.abs(r.routeX-r.expectedX)<.01,'RB must cut after advancing four yards from his starting spot');
   assert(r.routeY<260,'route must head toward TOP for either offense');
   if(spot===25)assert(r.yac&&r.tackled,'RB must gain yards and be tackled after a reception');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: both teams run smooth RB outs on short/deep passes, select and catch RB throws, gain yards and get tackled; handoffs and RB speed preserved, including near goal line.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
