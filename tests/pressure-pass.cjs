const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const p=await b.newPage({serviceWorkers:'block'});
 await p.route('**/game.js',async route=>{const response=await route.fetch();const hook=`window.testPressure=(team,play)=>{
  if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
  const original=Math.random;
  function prepare(){
   offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';setDriveSpot(285);setup();
   playType=play;phase='live';scrambling=true;qbRunSide=-1;
   const qb=players.find(p=>p.role==='QB');carrier=qb;
   for(const d of players.filter(p=>p.team===defenseTeam)){d.x=22;d.y=550;d.speed=0;}
   const defender=players.find(p=>p.team===defenseTeam&&p.role==='DB');defender.x=qb.x+60;defender.y=qb.y;
   return {qb,defender};
  }
  try{
   let throws=0;const targets=Array(5).fill(0);
   for(let i=0;i<1000;i++){
    const {qb}=prepare();const eligible=eligiblePassReceivers();let draws=0;
    Math.random=()=>draws++===0?(i+.5)/1000:((i%5)+.5)/5;
    if(tryQuarterbackPressurePass(qb)){throws++;targets[eligible.indexOf(passTarget)]++;}
   }
   const {qb}=prepare();let draws=0;Math.random=()=>{draws++;return .75;};
   const failed=!tryQuarterbackPressurePass(qb)&&scrambling;
   Math.random=()=>{draws++;return 0;};const noReroll=!tryQuarterbackPressurePass(qb)&&draws===1;
   const edge=prepare();edge.qb.x=LOS;draws=0;Math.random=()=>{draws++;return 0;};
   const lineBlocked=!tryQuarterbackPressurePass(edge.qb)&&draws===0;
   edge.qb.x=LOS+10;const pastLineBlocked=!tryQuarterbackPressurePass(edge.qb)&&draws===0;
   const quiet=prepare();quiet.defender.x=quiet.qb.x+200;
   const noPressure=!tryQuarterbackPressurePass(quiet.qb)&&!quiet.qb.pressurePassChecked;
   quiet.defender.x=quiet.qb.x+60;const laterPressure=tryQuarterbackPressurePass(quiet.qb);
   const run=prepare();playType='run';draws=0;Math.random=()=>{draws++;return 0;};
   const handoffUnaffected=!tryQuarterbackPressurePass(run.qb)&&draws===0;
   const completions=[];
   for(let target=0;target<5;target++){
    prepare();const eligible=eligiblePassReceivers();let n=0;
    Math.random=()=>n++===0?.1:(target+.5)/5;update(1/60);
    const correct=passTarget===eligible[target]&&passOrigin.x<LOS&&carrier===null&&!scrambling;
    for(const d of players.filter(p=>p.team===defenseTeam)){d.x=22;d.y=550;}
    Math.random=()=>.99;let caught=false;
    for(let i=0;i<180&&phase==='live';i++){update(1/60);if(carrier===eligible[target]){caught=true;break;}}
    completions.push(correct&&caught);
   }
   return {throws,targets,failed,noReroll,lineBlocked,pastLineBlocked,noPressure,laterPressure,handoffUnaffected,completions};
  }finally{Math.random=original;}
 };`;await route.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');
 for(const team of ['blue','red'])for(const play of ['short','deep']){
  await p.locator('#reset').click();const r=await p.evaluate(args=>testPressure(...args),[team,play]);
  assert.equal(r.throws,750);assert.deepEqual(r.targets,[150,150,150,150,150]);
  for(const key of ['failed','noReroll','lineBlocked','pastLineBlocked','noPressure','laterPressure','handoffUnaffected'])assert(r[key],key);
  assert(r.completions.every(Boolean),JSON.stringify({team,play,r}));
 }
 console.log('PASS: 75% one-time pressure throws behind LOS, equal receiver targets, all five completions, no throws at/past LOS or on RUN, for HOME/AWAY short/deep plays.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
