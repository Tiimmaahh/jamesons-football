function begin(){tippedBall=null;scrambling=false;fumble=null;if(phase!=='ready')return;activeDefense=defenseTeam==='blue'?defensePlaySel.value:'man';finalTackler=null;playType=offenseTeam==='blue'?playSel.value:(Math.random()<.38?'run':Math.random()<.65?'short':'deep');passTarget=null;passOrigin=null;phase='live';elapsed=0;passElapsed=0;routeReceiver=null;returner=null;returnElapsed=0;attemptTimes.clear();tackleHistory=[];snap.disabled=true;carrier=players.find(p=>p.role==='QB');goalGap=Math.floor(Math.random()*4);runY=gapCenter(goalGap);status.textContent=(offenseTeam==='red'?'HOME '+(activeDefense==='blitz'?'BLITZ':activeDefense==='zone'?'ZONE':'MAN')+' DEFENSE! Away runs '+(playType==='run'?'a run':playType==='deep'?'a deep pass':'a short pass')+'. ':'')+(playType==='run'?`RUN! Running back aims between linemen ${goalGap+1} and ${goalGap+2}.`:(playType==='deep'?'GOING DEEP! Quarterback drops back…':'SHORT PASS! Quarterback drops back…'));last=performance.now();scheduleLoop();}
function updateDownDisplay(){
 if(conversion){yardage.textContent='2-POINT TRY · Ball on the 2';downText.textContent='2-POINT TRY';downHint.textContent='One play to score from the 2-yard line';downPossession.textContent=offenseTeam.toUpperCase()+' BALL';return;}
 const suffix=downs===1?'st':downs===2?'nd':downs===3?'rd':'th';
 const needed=Math.max(1,firstDownYard-ballOn);
 const distance=firstDownYard>=100?'Goal':needed;
 yardage.textContent=`Ball on ${ballOn} · ${downs}${suffix} & ${distance}`;
 downText.textContent=`${downs}${suffix} & ${distance}`;
 downHint.textContent=downs===4?'4th down — reach the yellow line or the other team gets the ball':`${4-downs+1} ${4-downs+1===1?'play':'plays'} left to make a first down`;
 downPossession.textContent=(offenseTeam==='blue'?'🔵 HOME':'🔴 AWAY')+' BALL';
}
function end(txt){
 if(phase!=='live')return;
 phase='ended';stopped=true;carrier=null;
 // The ball is spotted at its actual final position, including behind the line on a sack.
 const gain=Math.round((ball.x-LOS)/YARD_PIXELS);
 ballOn=spotFromX(ball.x);
 if(ball.x>=W-70){
  if(conversion){finishConversion(true);return;}
  beginPointChoice(offenseTeam);
  return;
 }else{
  if(conversion){finishConversion(false);return;}
  // Advance at the real field position, even inside either 10-yard line.
  LOS=clamp(ball.x,85,920);
  if(ballOn>=firstDownYard){downs=1;firstDownYard=Math.min(100,ballOn+10);firstDownMarkerX=Math.min(930,LOS+(firstDownYard-ballOn)*YARD_PIXELS);status.textContent=txt+' First down!';}
  else if(downs===4){
   // Flip the coordinate system, not the physical ball location.
   const turnoverX=W-ball.x;switchPossession();setDriveSpot(turnoverX);
   status.textContent=txt+' Turnover on downs! '+offenseTeam.toUpperCase()+' ball.';
  }else{downs++;status.textContent=txt+' '+(gain>=0?'+':'')+gain+' yards.';}
 }
 updateDownDisplay();snap.disabled=false;snap.textContent='NEXT PLAY';
}
