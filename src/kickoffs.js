const kickControl=document.getElementById('kickControl'),kickAim=document.getElementById('kickAim');
function aimY(aim){return aim==='left'?115:aim==='right'?455:285;}
function launchKickoff(){if(!kickoff||kickoff.stage!=='waiting')return;kickoff.aim=kickoff.kicker==='blue'?kickAim.value:['left','middle','right'][Math.floor(Math.random()*3)];kickoff.targetY=aimY(kickoff.aim);kickoff.returner.y=kickoff.targetY;kickoff.stage='flight';kickoff.time=0;ball.y=285;kickControl.hidden=true;snap.disabled=true;snap.textContent='KICKOFF...';status.textContent=kickoff.kicker.toUpperCase()+' kicks '+kickoff.aim.toUpperCase()+'!';last=performance.now();}
function startKickoff(kicker){
 const receiver=kicker==='blue'?'red':'blue',direction=receiver==='blue'?1:-1;
 kickoff={kicker,receiver,direction,time:0,stage:'waiting',deadline:performance.now()+5000,returner:null,aim:'middle',targetY:285,returnLane:'middle',returnTargetY:285};
 phase='kickoff';players=[];finalTackler=null;carrier=null;
 const kickX=kicker==='blue'?325:675,catchX=receiver==='blue'?180:820;
 for(let i=0;i<11;i++)players.push(make(kickX,45+i*48,kicker,'K',i,120));
 for(let i=0;i<11;i++)players.push(make(catchX+(direction===1?70:-70),45+i*48,receiver,'R',i,105));
 kickoff.returner=players.find(p=>p.team===receiver&&p.index===5);
 kickoff.returner.x=catchX;kickoff.returner.y=285;
 ball.x=kickX;ball.y=285;
 kickControl.hidden=kicker!=='blue';snap.disabled=kicker!=='blue';snap.textContent=kicker==='blue'?'SNAP!':'KICKOFF...';
 status.textContent=kicker==='blue'?'Choose kick direction! Kickoff automatically starts in 5 seconds (or press SNAP).':kicker.toUpperCase()+' lines up! Kickoff in 5 seconds!';
 last=performance.now();draw();scheduleLoop();
}
function finishKickoff(spot,description){
 const k=kickoff; if(!k)return;
 const next=k.receiver;
 offenseTeam=next;defenseTeam=k.kicker;updatePossession();
 const offenseFacingSpot=next==='blue'?spot:W-spot;
 setDriveSpot(offenseFacingSpot);
 kickoff=null;kickControl.hidden=true;phase='ended';stopped=true;carrier=null;updateDownDisplay();
 snap.disabled=false;snap.textContent='NEXT PLAY';
 status.textContent=description+' '+next.toUpperCase()+' starts at its '+ballOn+'-yard line, 1st & 10.';
}
function updateKickoff(dt){
 const k=kickoff;if(!k)return;if(k.stage==='waiting'){if(performance.now()>=k.deadline)launchKickoff();return;}k.time+=dt;
 const catchX=k.receiver==='blue'?180:820, kickX=k.kicker==='blue'?325:675;
 if(k.stage==='flight'){
   const t=clamp(k.time/1.45,0,1);
   ball.x=kickX+(catchX-kickX)*t;
   ball.y=285+(k.targetY-285)*t-88*Math.sin(Math.PI*t);
   if(t>=1){k.stage='return';k.time=0;k.returnLane=['left','middle','right'][Math.floor(Math.random()*3)];k.returnTargetY=aimY(k.returnLane);ball.x=k.returner.x;ball.y=k.returner.y;status.textContent=k.receiver.toUpperCase()+' catches it and returns '+k.returnLane.toUpperCase()+'!';}
   return;
 }
 const runner=k.returner;
 // Returner advances toward the opponent's end zone while kickoff coverage closes in.
 const targetY=clamp(k.returnTargetY+Math.sin(k.time*2.7)*16,55,H-55);
 moveToward(runner,k.direction===1?940:60,targetY,runner.speed*dt);
 for(const p of players){if(p===runner)continue;
   if(p.team===k.kicker){moveToward(p,runner.x,runner.y,p.speed*dt);
     if(dist(p,runner)<28){finalTackler=p;ball.x=runner.x;ball.y=runner.y;tackleHistory.push(k.kicker.toUpperCase()+' #'+(p.index+1)+' tackled the kickoff returner!');finishKickoff(runner.x,'Kickoff return tackled!');return;}}
   else{moveToward(p,runner.x+(k.direction===1?38:-38),runner.y+(p.index-5)*16,p.speed*.54*dt);}}
 ball.x=runner.x;ball.y=runner.y;
 if((k.direction===1&&runner.x>=930)||(k.direction===-1&&runner.x<=70)){
   // Kickoff-return touchdowns also trigger the point choice.
   tackleHistory.push(k.receiver.toUpperCase()+' scored a kickoff return touchdown!');
   beginPointChoice(k.receiver);return;
 }
 if(k.time>14)finishKickoff(runner.x,'Kickoff return finished.');
}

