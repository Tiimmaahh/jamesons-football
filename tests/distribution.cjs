const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const p=await b.newPage({serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/game.js',async route=>{
   const response=await route.fetch();
   const hook=`window.testDistribution=(team,play)=>{
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';setDriveSpot(285);setup();playType=play;
    const options=passingOptions(),counts=Array(6).fill(0),original=Math.random;
    try{
     for(let i=0;i<6000;i++){
      routeReceiver=null;scrambling=false;let draws=0;
      Math.random=()=>{draws++;return (i+.5)/6000;};selectPassingOutcome();
      if(draws!==(scrambling?2:1))throw Error('one outcome draw, plus one side draw only for QB');
      counts[scrambling?5:options.indexOf(routeReceiver)]++;
     }
     const order=options.map(x=>x.role+':'+x.index);
     // Test all six bucket edges and the live first-update selection.
     const selections=[];
     for(let index=0;index<6;index++){
      for(const fraction of [.000001,.5,.999999]){
       routeReceiver=null;scrambling=false;Math.random=()=>(index+fraction)/6;selectPassingOutcome();
       if((scrambling?5:passingOptions().indexOf(routeReceiver))!==index)throw Error('wrong bucket');
      }
      setup();playType=play;phase='live';elapsed=0;last=0;routeReceiver=null;scrambling=false;
      for(const d of players.filter(x=>x.team===defenseTeam)){d.x=22;d.y=550;d.speed=0;}
      let outcomeDraw=0;Math.random=()=>outcomeDraw++===0?(index+.5)/6:(team==='blue'?.25:.75);update(1/60);Math.random=()=>.99;
      const qb=players.find(x=>x.role==='QB'),start={x:qb.x,y:qb.y};
      const target=routeReceiver;
      for(let i=0;i<60;i++)update(1/60);
      if(index===5){
       const forward=qb.x>start.x&&(qbRunSide<0?qb.y<start.y:qb.y>start.y)&&carrier===qb&&passTarget===null;
       const defender=players.find(x=>x.team===defenseTeam&&x.role==='DB');defender.x=qb.x;defender.y=qb.y;update(1/60);
       selections.push({sneak:true,forward,tackled:phase==='ended'});
      }else{
       for(let i=0;i<150&&!passTarget&&phase==='live';i++)update(1/60);
       selections.push({role:target.role,index:target.index,threw:passTarget===target,sneak:scrambling});
      }
     }
     const sides=[0,0];
     for(let i=0;i<1000;i++){
      scrambling=false;routeReceiver=null;let draw=0;
      Math.random=()=>draw++===0?.99:(i+.5)/1000;
      selectPassingOutcome();sides[qbRunSide<0?0:1]++;
     }
     return {counts,order,selections,sides};
    }finally{Math.random=original;}
   };`;
   await route.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});
  });
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');
  for(const team of ['blue','red'])for(const play of ['short','deep']){
   await p.locator('#reset').click();
   const r=await p.evaluate(args=>testDistribution(...args),[team,play]);
   assert.deepEqual(r.counts,[1000,1000,1000,1000,1000,1000]);
   assert.deepEqual(r.sides,[500,500]);
   assert.deepEqual(r.order,['WR:0','WR:2','WR:1','TE:0','RB:0','QB:0']);
   for(const outcome of r.selections.slice(0,5))assert(outcome.threw&&!outcome.sneak,JSON.stringify(outcome));
   assert(r.selections[5].forward&&r.selections[5].tackled,'sneak must run forward, keep ball, and allow tackle');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: six equal buckets, independent 50/50 QB direction, all bucket boundaries, all five throws and QB outside runs/tackles on both pass plays for both teams.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
