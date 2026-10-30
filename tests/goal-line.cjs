const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',async route=>{
   const response=await route.fetch();
   const source=await response.text();
   const hook=`window.testDeep=(spot,team,role,stuck=false)=>{
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';
    setDriveSpot(70+spot*YARD_PIXELS);setup();playSel.value='deep';
    begin();if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    playType='deep';scrambleEligible=false;
    routeReceiver=players.find(p=>p.team===team&&p.role===role);
    if(stuck)routeReceiver.speed=0;
    // Isolate the release decision from sacks and random coverage outcomes.
    for(const p of players.filter(p=>p.team===defenseTeam)){p.x=22;p.y=550;p.speed=0;}
    let time=0;
    while(!passTarget&&phase==='live'&&time<4){update(1/60);time+=1/60;}
    const result={threw:!!passTarget,time,receiverX:routeReceiver.x};
    while(phase==='live'&&time<13){update(1/60);time+=1/60;}
    return {...result,finalPhase:phase};
   };`;
   await route.fulfill({response,body:source.replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});
  });
  await page.goto(base);
  for(const team of ['blue','red'])for(const spot of [25,75,90,98])for(const role of ['WR','TE']){
   await page.locator('#reset').click();
   const result=await page.evaluate(({spot,team,role})=>window.testDeep(spot,team,role),{spot,team,role});
   assert(result.threw,`${team} ${role} at ${spot}: QB never threw`);
   assert(result.time<=3.55,`${team} ${role} at ${spot}: release took ${result.time}s`);
   assert.notEqual(result.finalPhase,'live','play must finish');
  }
  await page.locator('#reset').click();
  const stuck=await page.evaluate(()=>window.testDeep(90,'blue','WR',true));
  assert(stuck.threw&&stuck.time<=3.55,'QB must attempt a pass even if his target stops moving');
  assert.deepEqual(errors,[]);
  console.log('PASS: deep passes release at midfield, in red zone and at goal line for both teams and WR/TE; stalled routes release within 3.5s; plays finish without page errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
