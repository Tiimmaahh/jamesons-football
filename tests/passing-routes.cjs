const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const page=await b.newPage({serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',async route=>{
   const response=await route.fetch();
   const hook=`window.testRoutes=(play,team,targetIndex,spot=25)=>{
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';
    setDriveSpot(70+spot*YARD_PIXELS);setup();playSel.value=play;begin();
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    playType=play;
    const receivers=eligiblePassReceivers(),target=receivers[targetIndex];
    for(const d of players.filter(p=>p.team===defenseTeam)){d.x=22;d.y=550;d.speed=0;}
    const originalRandom=Math.random;
    try{
     const outcomeIndex=passingOptions().indexOf(target);
     Math.random=()=>(outcomeIndex+.5)/6;update(1/60);Math.random=()=>.99;
     const selected=routeReceiver===target;let caught=false;
     for(let i=0;i<360&&phase==='live';i++){
      update(1/60);
      if(carrier===target||Number(document.getElementById(team+'Score').textContent)>=6){caught=true;break;}
     }
     return {selected,caught,eligible:receivers.map(p=>p.role+':'+p.index)};
    }finally{Math.random=originalRandom;}
   };
   window.testRouteShape=(play,team,role,index)=>{
    offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';setDriveSpot(285);setup();playType=play;
    const p=players.find(p=>p.team===team&&p.role===role&&p.index===index);
    const landmarks=role==='RB'?null:receiverRouteLandmarks(p);
    let maxStep=0,previous={x:p.x,y:p.y},stem=null;
    const landmarkDepth=play==='short'?(role==='TE'?5:index===0?10:7):(role==='TE'?15:20);
    const stemX=LOS+landmarkDepth*YARD_PIXELS;
    for(let i=0;i<600;i++){
     if(role==='RB')updateRunningBackRoute(p,1/60);else updateReceiverRoute(p,1/60);
     maxStep=Math.max(maxStep,Math.hypot(p.x-previous.x,p.y-previous.y));
     if(!stem&&p.x>=stemX-16)stem={x:p.x,y:p.y};
     previous={x:p.x,y:p.y};
    }
    const end={x:p.x,y:p.y};
    if(role==='RB')updateRunningBackRoute(p,.2);else updateReceiverRoute(p,.2);
    return {landmarks,maxStep,speed:p.speed,homeY:p.homeY,homeX:p.homeX,stem,end,after:{x:p.x,y:p.y},facing:p.facingQuarterback,LOS};
   };`;
   await route.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});
  });
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:8000');
  for(const team of ['blue','red'])for(const play of ['short','deep']){
   for(const [role,index] of [['WR',0],['WR',1],['WR',2],['TE',0],['RB',0]]){
    await page.locator('#reset').click();
    const r=await page.evaluate(args=>testRouteShape(...args),[play,team,role,index]);
    assert(r.maxStep<=r.speed*(role==='RB'?1:1.55)/60+.001,'no teleport or speed increase');
    if(role==='RB'){assert(r.end.y<r.homeY);assert(Math.abs(r.end.x-r.homeX-4*8.6)<.01);continue;}
    if(play==='short'&&role==='WR'&&index===2){
     assert(Math.abs(r.end.x-(r.LOS+7*8.6))<.01);assert.equal(r.end.y,r.homeY);
     assert(r.facing,'stop receiver faces QB');assert.deepEqual(r.end,r.after,'stop receiver holds landmark');
    }else if(play==='short'&&role==='TE'){
     assert(Math.abs(r.end.x-(r.LOS+5*8.6))<.01);assert(r.end.y>r.homeY+100);
    }else if(play==='deep'&&role==='WR'&&index===0){assert.equal(r.end.y,r.homeY);assert(r.end.x>900);}
    else{
     const inward=role==='TE'||index===1?r.end.y<r.homeY:r.end.y>r.homeY;
     assert(inward,JSON.stringify({play,team,role,index,r}));
     if(role==='WR'&&(play==='deep'||index===0))assert(Math.abs(r.stem.y-r.homeY)<1,'stem stays straight before post or skinny-in cut');
    }
   }
   for(const spot of [25,98])for(let target=0;target<5;target++){
    await page.locator('#reset').click();
    const r=await page.evaluate(args=>testRoutes(...args),[play,team,target,spot]);
    assert.equal(r.eligible.length,5);assert(r.selected&&r.caught,JSON.stringify({play,team,target,spot,r}));
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all short/deep route shapes, smooth bounded movement, 7-yard stop facing QB, and completions to all five targets for HOME/AWAY at midfield and goal line.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
