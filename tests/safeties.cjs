const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const p=await b.newPage({serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js',async route=>{const response=await route.fetch();const hook=`window.testSafety=(team,role,x,mode='tackle')=>{
  if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
  offenseTeam=team;defenseTeam=team==='blue'?'red':'blue';setDriveSpot(85);setup();phase='live';
  const runner=players.find(p=>p.team===team&&p.role===role);
  runner.x=x;runner.y=285;ball.x=x;ball.y=285;carrier=runner;playType='short';
  if(role!=='QB')passTarget=runner;else routeReceiver=players.find(p=>p.team===team&&p.role==='WR');
  for(const d of players.filter(p=>p.team===defenseTeam)){d.x=800;d.y=500;d.speed=0;}
  const defender=players.find(p=>p.team===defenseTeam&&p.role==='DB');
  const original=Math.random;Math.random=()=>.99;
  try{
   if(mode==='tackle'){defender.x=x;defender.y=285;update(.001);}
   else if(mode==='fumble'){fumble={originalOffense:team};finalTackler=defender;endFumbleReturn(runner,false);}
   else{carrier=mode==='incomplete'?null:runner;finalTackler=null;end('Play finished.');}
   const result={home:Number(document.getElementById('blueScore').textContent),away:Number(document.getElementById('redScore').textContent),banner:eventBanner.querySelector('.event-main').textContent,phase,kicker:kickoff?.kicker,receiver:kickoff?.receiver,video:!celebrationOverlay.hidden};
   if(kickoff){const receiver=kickoff.receiver;finishKickoff(receiver==='blue'?180:820,'Kickoff return tackled!');result.nextOffense=offenseTeam;result.nextDown=downs;}
   return result;
  }finally{Math.random=original;}
 };`;await route.fulfill({response,body:(await response.text()).replace('updateDownDisplay();setup();})();','updateDownDisplay();setup();'+hook+'})();')});});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');
 for(const team of ['blue','red'])for(const role of ['QB','RB','WR','TE']){
  await p.locator('#reset').click();const r=await p.evaluate(args=>testSafety(...args),[team,role,60]);
  assert.equal(r.home,team==='blue'?0:2);assert.equal(r.away,team==='red'?0:2);
  assert.equal(r.banner,'SAFETY!');assert.equal(r.kicker,team);assert.equal(r.receiver,team==='blue'?'red':'blue');
  assert.equal(r.nextOffense,r.receiver);assert.equal(r.nextDown,1);assert(!r.video);
 }
 for(const team of ['blue','red']){
  for(const mode of ['incomplete','timeout']){
   await p.locator('#reset').click();const r=await p.evaluate(args=>testSafety(...args),[team,'RB',60,mode]);assert.equal(r.home+r.away,0);
  }
  await p.locator('#reset').click();const field=await p.evaluate(args=>testSafety(...args),[team,'RB',75]);assert.equal(field.home+field.away,0);
  await p.locator('#reset').click();const fumble=await p.evaluate(args=>testSafety(...args),[team,'RB',60,'fumble']);assert.equal(fumble.home+fumble.away,2);assert.equal(fumble.kicker,team);
 }
 assert.deepEqual(errors,[]);console.log('PASS: HOME/AWAY end-zone sacks and QB/RB/WR/TE tackles award two points and a kickoff to the scoring team; own fumble returns covered; no safety for incompletions, timeouts or field tackles.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
