function addPoints(team,n){const el=document.getElementById(team+'Score');el.textContent=Number(el.textContent)+n;}
function choosePoints(goForEight){if(!pointDecision)return;const scoring=pointDecision.team;pointDecision=null;pointChoice.hidden=true;
 if(!goForEight){addPoints(scoring,1);conversion=false;startKickoff(scoring);status.textContent=scoring.toUpperCase()+' takes 7 points! Kickoff next.';return;}
 conversion=true;conversionTeam=scoring;offenseTeam=scoring;defenseTeam=scoring==='blue'?'red':'blue';updatePossession();ballOn=98;downs=1;firstDownYard=100;LOS=912;firstDownMarkerX=930;updateDownDisplay();setup();status.textContent='TWO-POINT TRY! Ball at the 2-yard line. Choose a play and SNAP!';downText.textContent='2-POINT TRY';snap.textContent='SNAP!';}
function beginPointChoice(team){showEvent('touchdown',team);openCelebration(team);addPoints(team,6);conversion=false;conversionTeam=null;pointDecision={team,deadline:performance.now()+5000};phase='points';snap.disabled=true;pointClock.textContent='5s';
 if(team==='red'){
   pointChoice.hidden=true;
   const redGoesForEight=Math.random()<0.5;
   choosePoints(redGoesForEight);
   if(redGoesForEight){
     status.textContent='AWAY TOUCHDOWN! Computer chose to go for 8. Red runs the two-point play automatically!';
     // Red is computer-controlled, so don't require the user to press SNAP.
     setTimeout(()=>{if(conversion&&conversionTeam==='red'&&phase==='ready')begin();},700);
   }else{
     status.textContent='AWAY TOUCHDOWN! Computer chose 7 points. Kickoff next.';
   }
   return;
 }
 pointChoice.hidden=false;status.textContent='HOME TOUCHDOWN! Choose 7 points or go for 8 before the timer ends.';last=performance.now();scheduleLoop();}
document.getElementById('takeSeven').addEventListener('click',()=>choosePoints(false));document.getElementById('tryEight').addEventListener('click',()=>choosePoints(true));
function finishConversion(success){if(!conversion)return false;const scoring=conversionTeam;conversion=false;conversionTeam=null;if(success)addPoints(scoring,2);startKickoff(scoring);status.textContent=scoring.toUpperCase()+(success?' made the two-point conversion! 8 total points.':' missed the two-point conversion. 6 total points.')+' Kickoff next.';return true;}

