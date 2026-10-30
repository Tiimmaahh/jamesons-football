function finishReturn(scored=false){
 // Spot a stopped interception return at its real location, facing the other way.
 const returnSpotX=W-ball.x;
 // A normal interception switches possession. After a pick-six,
 // the team that threw the interception gets the ball again.
 if(conversion){returner=null;finishConversion(false);return;} if(scored){const scoringTeam=defenseTeam;returner=null;beginPointChoice(scoringTeam);return;}
 switchPossession();returner=null;phase='ended';stopped=true;carrier=null;
 setDriveSpot(returnSpotX);updateDownDisplay();
 snap.disabled=false;snap.textContent='NEXT PLAY';
 status.textContent+=' '+offenseTeam.toUpperCase()+(scored?' gets the ball after the touchdown!':' takes over on offense!');
}
function endFumbleReturn(runner,scored){
 const recoveringTeam=runner.team;
 if(scored){
  document.getElementById(recoveringTeam+'Score').textContent=Number(document.getElementById(recoveringTeam+'Score').textContent)+7;
  tackleHistory.push(recoveringTeam.toUpperCase()+' scored on a fumble return!');
  fumble=null;if(conversion){finishConversion(false);return;} beginPointChoice(recoveringTeam);return;
 }
 // Convert to actual screen position, then into the recovering team's attack direction.
 const physicalX=offenseTeam==='blue'?runner.x:W-runner.x;
 const recoveringX=recoveringTeam==='blue'?physicalX:W-physicalX;
 if(offenseTeam!==recoveringTeam){offenseTeam=recoveringTeam;defenseTeam=offenseTeam==='blue'?'red':'blue';updatePossession();}
 setDriveSpot(recoveringX);
 fumble=null;phase='ended';stopped=true;carrier=null;updateDownDisplay();snap.disabled=false;snap.textContent='NEXT PLAY';
 status.textContent=recoveringTeam.toUpperCase()+' recovered the fumble. '+(finalTackler?'Return stopped!':'Return over!')+' 1st & 10.';
}
function updateFumble(dt){
 const f=fumble;if(!f)return;
 f.time+=dt;
 if(f.stage==='loose'){
  // Both teams pursue the loose ball; whoever touches it first recovers it.
  for(const p of players){moveToward(p,ball.x,ball.y,p.speed*1.45*dt);}
  const picker=players.filter(p=>dist(p,ball)<=19).sort((a,b)=>dist(a,ball)-dist(b,ball))[0];
  if(picker){f.stage='return';f.runner=picker;f.time=0;carrier=picker;
   tackleHistory.push(picker.team.toUpperCase()+' '+picker.role+' #'+(picker.index+1)+' recovered the fumble!');
   status.textContent=picker.team.toUpperCase()+' recovered! Running for the end zone!';
  }
  return;
 }
 const runner=f.runner;
 // In internal field coordinates the original offense runs right, defense runs left.
 const direction=runner.team===f.originalOffense?1:-1;
 const goal=direction===1?930:70;
 const dodge=clamp(runner.y+Math.sin(f.time*2.4)*32,40,H-40);
 moveToward(runner,goal,dodge,runner.speed*1.25*dt);ball.x=runner.x;ball.y=runner.y;
 for(const p of players){if(p===runner)continue;
  if(p.team!==runner.team){moveToward(p,runner.x,runner.y,p.speed*1.22*dt);
   if(dist(p,runner)<27){finalTackler=p;tackleHistory.push(p.team.toUpperCase()+' '+p.role+' #'+(p.index+1)+' tackled the fumble returner!');endFumbleReturn(runner,false);return;}}
  else moveToward(p,runner.x+direction*35,runner.y+(p.index-2)*15,p.speed*.55*dt);
 }
 if((direction===1&&runner.x>=930)||(direction===-1&&runner.x<=70)){endFumbleReturn(runner,true);return;}
 if(f.time>=13)endFumbleReturn(runner,false);
}
