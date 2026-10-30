function update(dt){if(phase!=='live')return;elapsed+=dt;
if(tippedBall){
 tippedBall.time+=dt;
 // The ball visibly pops into the air and hangs briefly for a second chance.
 const t=Math.min(1,tippedBall.time/1.1);
 ball.x=tippedBall.x+Math.sin(t*Math.PI)*16;
 ball.y=tippedBall.y-78*Math.sin(t*Math.PI);
 if(t>=1){
   const contenders=players.filter(p=>['WR','TE','DB','LB','RB'].includes(p.role)&&dist(p,tippedBall)<78);
   const offense=contenders.filter(p=>p.team===offenseTeam);
   const defense=contenders.filter(p=>p.team===defenseTeam);
   const result=Math.random();
   if(result<.40&&offense.length){const catcher=offense[Math.floor(Math.random()*offense.length)];carrier=catcher;ball.x=catcher.x;ball.y=catcher.y;status.textContent='TIPPED BALL CAUGHT by '+catcher.team.toUpperCase()+' '+catcher.role+'!';}
   else if(result<.65&&defense.length){const picker=defense[Math.floor(Math.random()*defense.length)];returner=picker;returnElapsed=0;carrier=null;ball.x=picker.x;ball.y=picker.y;logInterception(picker,0,true);status.textContent='TIPPED BALL INTERCEPTED! '+picker.team.toUpperCase()+' returns it!';}
   else{tippedBall=null;end('Tipped ball falls incomplete!');return;}
   tippedBall=null;
 }
 return;
}
if(fumble){updateFumble(dt);return;}
const ol=players.filter(p=>p.role==='OL'),dl=players.filter(p=>p.role==='DL'),rb=players.find(p=>p.role==='RB'),qb=players.find(p=>p.role==='QB');
// After an interception, the defending team returns LEFT.
// Any player from the former offense touching the returner ends the return immediately.
if(returner){
 returnElapsed+=dt;
 const chaseSpeed=returner.speed*1.15;
 moveToward(returner,56,returner.y,chaseSpeed*dt);
 ball.x=returner.x;ball.y=returner.y;
 for(const chaser of players.filter(p=>p.team===offenseTeam)){
   // All former offensive players turn around and pursue the returner.
   moveToward(chaser,returner.x,returner.y,chaser.speed*1.22*dt);
   if(dist(chaser,returner)<=29){
     ball.x=returner.x;ball.y=returner.y;
     finalTackler=chaser;
     const who=chaser.role+(chaser.role==='OL'||chaser.role==='WR'?' #'+(chaser.index+1):'');
     status.textContent='Interception return stopped! '+who+' tackled the defender.';
     tackleHistory.push(who+' tackled the interception returner!');
     finishReturn();return;
   }
 }
 if(returner.x<=70){
   document.getElementById(defenseTeam+'Score').textContent=Number(document.getElementById(defenseTeam+'Score').textContent)+7;
   status.textContent='PICK SIX! '+defenseTeam.toUpperCase()+' returned the interception for a touchdown!';
   finishReturn(true);return;
 }
 if(returnElapsed>14){status.textContent='Interception return ends.';finishReturn();return;}
 return;
}
// Eligible receivers follow their assigned routes until they catch the ball.
if(playType!=='run')updatePassRoutes(dt);
// After a handoff, throw or catch, rushers stop targeting the QB and follow the ball.
const qbStillHasBall=carrier===qb;
const chaseX=qbStillHasBall?qb.x:(carrier?carrier.x:(passTarget?passTarget.x:ball.x));
const chaseY=qbStillHasBall?qb.y:(carrier?carrier.y:(passTarget?passTarget.y:ball.y));
// Match individual offensive/defensive linemen. The defender routes around his own blocker rather than the entire line.
for(let i=0;i<5;i++){const o=ol[i],d=dl[i],touch=dist(o,d)<33;if(defenseTeam==='blue'&&activeDefense==='blitz'){moveToward(o,LOS+22,oY[i],o.speed*dt);const blocked=dist(o,d)<34;if(blocked){moveToward(d,o.x+22,o.y+(i%2?-40:40),d.speed/3*dt);}else{moveToward(d,chaseX,chaseY,d.speed*1.65*dt);}continue;}if(!d.freed){if(touch){d.blocked=true;d.blockTime+=dt;let rate=o.speed/3;moveToward(o,LOS+17+Math.min(3*scale,elapsed*12),oY[i],rate*dt);d.x=Math.max(d.x,o.x+25); // no overlap through blocker
if(d.blockTime>0.75){d.side=d.side||((i%2===0)?-1:1);moveToward(d,o.x+24,o.y+d.side*44,d.speed/3*dt);if(Math.abs(d.y-o.y)>34)d.freed=true;}}
else{moveToward(o,LOS+22,oY[i],o.speed*dt);moveToward(d,o.x+26,d.y,d.speed*dt);}}
else{moveToward(o,LOS+30,oY[i],o.speed*.25*dt);moveToward(d,chaseX,chaseY,d.speed*dt);}}
if(playType==='run'){if(elapsed<.48){moveToward(rb,qb.x+3,qb.y,rb.speed*dt);ball.x=qb.x;ball.y=qb.y;}else{carrier=rb;let targetX=LOS+145,targetY=runY;if(rb.x<LOS+45){targetX=LOS+45;targetY=runY;}else{targetX=W-35;targetY=runY;}moveToward(rb,targetX,targetY,rb.speed*dt);ball.x=rb.x;ball.y=rb.y;}}
else{if(!passTarget){
 // Select exactly once: five receivers or a forward QB sneak, equally likely.
 if(!routeReceiver&&!scrambling)selectPassingOutcome();
 if(scrambling){if(!tryQuarterbackPressurePass(qb)){const targetY=qbRunSide<0?63:H-63;const targetX=Math.abs(qb.y-targetY)>12?Math.min(LOS+38,W-40):W-40;moveToward(qb,targetX,targetY,qb.speed*dt);ball.x=qb.x;ball.y=qb.y;}}
 else {moveToward(qb,LOS-67,285,25*dt);ball.x=qb.x;ball.y=qb.y;}
 const readyToThrow=!passTarget&&!scrambling&&(passReceiverReady(routeReceiver)||elapsed>=1.5);
 if(!scrambling&&readyToThrow){passTarget=routeReceiver;passOrigin={x:qb.x,y:qb.y};passElapsed=0;carrier=null;status.textContent=(playType==='deep'?'30-yard deep':'10-yard short')+' pass thrown to '+offenseTeam+' '+passTarget.role+'!';}}
else if(!carrier){
 passElapsed+=dt;let t=clamp(passElapsed/passDuration,0,1);ball.x=passOrigin.x+(passTarget.x-passOrigin.x)*t;ball.y=passOrigin.y+(passTarget.y-passOrigin.y)*t;if(t>=1){// A nearby assigned defensive back or TE-covering linebacker can break up the throw.
// Nearby eligible defenders get a team-specific interception roll: blue defense 25%, red defense 20%.
const interceptionCandidates=['WR','RB'].includes(passTarget.role)?players.filter(d=>d.team===defenseTeam&&(d.role==='DB'||(d.role==='LB'&&d.index===(passTarget.role==='RB'?1:0)))&&dist(d,passTarget)<=45).sort((a,b)=>dist(a,passTarget)-dist(b,passTarget)):[];
if(interceptionCandidates.length){const picker=interceptionCandidates[0],pickRoll=Math.random(),picked=pickRoll<(defenseTeam==='blue'?.25:.20);logInterception(picker,pickRoll,picked);if(picked){returner=picker;returnElapsed=0;carrier=null;ball.x=picker.x;ball.y=picker.y;status.textContent='INTERCEPTION! '+(picker.role==='DB'?'Defensive Back':'Linebacker')+' #'+(picker.index+1)+' runs toward the opposite end zone!';return;}}
const nearbyCoverage=players.filter(d=>d.team===defenseTeam&&((defenseTeam==='blue'&&activeDefense==='zone'&&(d.role==='DB'||d.role==='LB'))||(d.role==='DB'&&passTarget.role==='WR'&&d.index===passTarget.index)||(d.role==='LB'&&((d.index===0&&passTarget.role==='TE')||(d.index===1&&passTarget.role==='RB'))))&&dist(d,passTarget)<48);
const coverageDistance=nearbyCoverage.length?Math.min(...nearbyCoverage.map(d=>dist(d,passTarget))):Infinity;
// A crowd at the catch point can send the football bouncing upward.
const crowd=players.filter(p=>p!==passTarget&&p.role!=='OL'&&p.role!=='DL'&&dist(p,passTarget)<56);
if(crowd.length>=2&&Math.random()<.48){
  tippedBall={x:passTarget.x,y:passTarget.y,time:0};ball.x=tippedBall.x;ball.y=tippedBall.y;
  status.textContent='TIPPED BALL! Everyone has another chance to catch it!';return;
}
const breakupChance=coverageDistance<24?.68:coverageDistance<48?.48:.12;
if(Math.random()<breakupChance){ball.x=LOS;status.textContent=nearbyCoverage.length?'Pass broken up by coverage!':'Incomplete pass.';end(nearbyCoverage.length?'Pass broken up!':'Incomplete pass.');return;}carrier=passTarget;ball.x=carrier.x;ball.y=carrier.y;status.textContent='Catch! Defenders closing in.';}}
else{moveToward(carrier,W-32,carrier.y,carrier.speed*dt);ball.x=carrier.x;ball.y=carrier.y;}}
// Defensive backs cover their assigned receivers while the QB prepares a pass.
// A committed QB run switches coverage defenders to ball-carrier pursuit.
for(const d of players.filter(p=>p.team===defenseTeam&&p.role!=='DL')){
 // A committed QB run ends coverage assignments in man, zone, and blitz.
 if(scrambling&&carrier===qb){
  let pursuitY=qb.y;
  const blocker=ol.find(o=>Math.abs(o.x-d.x)<43&&Math.abs(o.y-d.y)<23&&d.x>o.x);
  if(blocker)pursuitY=blocker.y+(d.y<blocker.y?-42:42);
  const speedFactor=dist(d,qb)>34?2.2:1.45;
  moveToward(d,qb.x,pursuitY,d.speed*speedFactor*dt);
  continue;
 }
 if(defenseTeam==='blue'&&activeDefense==='blitz'&&d.role==='LB'){
   // Once the ball leaves the QB, every blitzing linebacker changes to ball pursuit.
   if(!qbStillHasBall){moveToward(d,chaseX,chaseY,d.speed*1.65*dt);continue;}
   // Each linebacker goes AROUND an outside edge, not through the OL gaps.
   // The OL can delay him, but the faster linebacker eventually clears the edge.
   const topSide=d.index===0 || d.index===1;
   const flankY=topSide?oY[0]-57:oY[4]+57;
   const outsideX=LOS-58;
   const edgeBlocker=topSide?ol[0]:ol[4];
   if(!d.blitzStage)d.blitzStage='around';
   if(d.blitzStage==='around'){
     // Until he clears the outer lineman he must stay in front of the OL.
     const nearEdge=dist(d,edgeBlocker)<51;
     if(nearEdge){
       moveToward(edgeBlocker,d.x-28,d.y,edgeBlocker.speed/3*dt);
       moveToward(d,Math.max(LOS+15,edgeBlocker.x+32),flankY,d.speed*.52*dt);
     }else{
       moveToward(d,LOS+27,flankY,d.speed*.92*dt);
     }
     if(Math.abs(d.y-flankY)<15)d.blitzStage='pastEdge';
   }else if(d.blitzStage==='pastEdge'){
     // Go behind the outer blocker before turning toward the quarterback.
     moveToward(d,outsideX,flankY,d.speed*1.14*dt);
     if(d.x<=outsideX+12)d.blitzStage='quarterback';
   }else{
     moveToward(d,chaseX,chaseY,d.speed*1.65*dt);
   }
   continue;
 }
 if(defenseTeam==='blue'&&activeDefense==='zone'){
   // Seven individual zones: three underneath LB zones and four deeper DB zones.
   const zones=d.role==='LB'?[[LOS+105,115],[LOS+105,285],[LOS+105,455]]:
     [[LOS+250,85],[LOS+250,485],[LOS+250,210],[LOS+250,360]];
   const zone=zones[d.index]||[LOS+235,285];
   const allTargets=players.filter(p=>p.team===offenseTeam&&['WR','TE','RB'].includes(p.role));
   const inZone=allTargets.filter(p=>Math.abs(p.x-zone[0])<(d.role==='LB'?135:190)&&Math.abs(p.y-zone[1])<(d.role==='LB'?110:100));
   let tx=zone[0],ty=zone[1];
   if(inZone.length){const t=inZone.sort((a,b)=>Math.hypot(a.x-zone[0],a.y-zone[1])-Math.hypot(b.x-zone[0],b.y-zone[1]))[0];
     tx=clamp(t.x+10,zone[0]-(d.role==='LB'?100:145),zone[0]+(d.role==='LB'?100:145));
     ty=clamp(t.y+9,zone[1]-75,zone[1]+75);
   }
   // Stay in zone until the ball is carried, then close on the carrier if nearby.
   if(carrier&&carrier.role!=='QB'&&Math.hypot(carrier.x-zone[0],carrier.y-zone[1])<200){tx=carrier.x;ty=carrier.y;}
   moveToward(d,tx,ty,d.speed*1.7*dt);
   continue;
 }
 let target=null,tx,ty;
 if(playType!=='run'){
   if(carrier&&carrier.role!=='QB'){target=carrier;tx=carrier.x;ty=carrier.y;}
   else if(d.role==='DB'){
     target=players.find(p=>p.team===offenseTeam&&p.role==='WR'&&p.index===d.index);
     if(!target)continue;
     // Stay beside the assigned receiver even after the pass is released or caught.
     tx=target.x+9;ty=target.y+(d.index%2===0?12:-12);
   }else if(d.index===0){
     target=players.find(p=>p.team===offenseTeam&&p.role==='TE');
     tx=target.x+14;ty=target.y+14;
   }else if(defenseTeam==='blue'||d.index===1){
     // Man coverage: LB #2 shadows RB; blue LB #3 spies QB without rushing.
     target=players.find(p=>p.team===offenseTeam&&p.role===(d.index===1?'RB':'QB'));
     if(carrier&&carrier.role!=='QB')target=carrier;
     tx=Math.max(LOS+18,target.x+28);ty=target.y+(d.index===1?18:-18);
   }else if(carrier&&carrier.role!=='QB'){
     target=carrier;tx=target.x;ty=target.y;
   }else{
     tx=LOS+100+(d.index-1)*35;ty=d.homeY;
   }
 }else{
   target=carrier&&carrier.role!=='QB'?carrier:players.find(p=>p.role==='RB');
   if(!target)continue;tx=target.x;ty=target.y;
 }
 const barrier=ol.find(o=>Math.abs(o.x-d.x)<43&&Math.abs(o.y-d.y)<23&&d.x>o.x);
 if(barrier)ty=barrier.y+(d.y<barrier.y?-42:42);
 const gap=target?dist(d,target):40;
 const speedFactor=playType!=='run'?(gap>34?2.2:1.45):1;
 moveToward(d,tx,ty,d.speed*speedFactor*dt);
}
// A quarterback is immediately down if a defender touches him while he still holds the ball.
// This applies to either team's quarterback, with no broken-tackle roll.
if(carrier===qb&&!scrambling&&!passTarget&&!(playType==='run'&&elapsed>=.48)){
 const sacker=players.find(d=>d.team===defenseTeam&&dist(d,qb)<=27);
 if(sacker){
   finalTackler=sacker;ball.x=qb.x;ball.y=qb.y;
   const who=(sacker.role==='DL'?'Defensive Lineman':sacker.role==='LB'?'Linebacker':'Defensive Back')+' #'+(sacker.index+1);
   logTackle(sacker,1,1,false);end('SACK! '+who+' touched the quarterback!');return;
 }
}
if(carrier&&(carrier.role!=='QB'||scrambling)&&ball.x>=W-70){end('End zone!');return;}
if(carrier&&(carrier.role!=='QB'||scrambling))for(const d of players.filter(p=>p.team===defenseTeam)){if(dist(d,carrier)<21){let ready=attemptTimes.get(d)||0;if(elapsed>=ready){attemptTimes.set(d,elapsed+1.5);
 // On a QB scramble, any defender's tackle has a 25% chance to force a fumble.
 if(scrambling&&carrier===qb&&Math.random()<.25){
   fumble={stage:'loose',originalOffense:offenseTeam,runner:null,time:0};
   ball.x=clamp(qb.x+random(-22,22),45,W-45);ball.y=clamp(qb.y+random(-22,22),45,H-45);
   carrier=null;scrambling=false;
   status.textContent='QB FUMBLE! '+d.role+' #'+(d.index+1)+' knocked the ball loose!';
   tackleHistory.push(d.role+' #'+(d.index+1)+' forced a quarterback fumble!');return;
 }
 if(d.role==='LB'&&!scrambling&&Math.random()<.05){
 const droppedBy=carrier;fumble={stage:'loose',originalOffense:offenseTeam,runner:null,time:0};
 ball.x=clamp(droppedBy.x+random(-25,25),45,W-45);ball.y=clamp(droppedBy.y+random(-25,25),45,H-45);
 carrier=null;status.textContent='FUMBLE! Linebacker #'+(d.index+1)+' knocked the ball loose!';
 tackleHistory.push('Linebacker #'+(d.index+1)+' forced a fumble!');return;
 }const escapeChance=scrambling&&carrier===qb?0:defenseTeam==='blue'?(d.role==='DL'?.40:d.role==='LB'?.25:.15):(d.role==='DL'?.80:d.role==='LB'?.50:.30);const roll=Math.random();const escaped=roll<escapeChance;if(escaped){logTackle(d,escapeChance,roll,true);status.textContent='Broken tackle against '+(d.role==='DL'?'D-line':d.role==='LB'?'linebacker':'defensive back')+'!';d.x+=12;d.y+=d.y<carrier.y?-20:20;}else{finalTackler=d;ball.x=carrier.x;ball.y=carrier.y;end('Tackled by '+(d.role==='DL'?'defensive lineman':d.role==='LB'?'linebacker':'defensive back')+' #'+(d.index+1)+'!');logTackle(d,escapeChance,roll,false);return;}}}}
if(phase!=='live')return;if(carrier&&(carrier.role!=='QB'||scrambling)&&ball.x>=W-70){end('End zone!');return;}if(elapsed>=12){end('Play finished.');return;}}
