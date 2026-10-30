// Keep one pending frame across scoring, kickoffs, and rapid new-game clicks.
// Run the simulation at 80% speed without changing relative player speeds.
const GAME_SPEED = 0.8;
let animationFrame = null;
function scheduleLoop(){
 if(animationFrame!==null)return;
 animationFrame=requestAnimationFrame(ts=>{animationFrame=null;loop(ts);});
}
function loop(ts){if(phase!=='live'&&phase!=='kickoff'&&phase!=='points')return;let dt=Math.min((ts-last)/1000,.035)*GAME_SPEED;last=ts;if(phase==='points'){if(pointDecision){if(!celebrationOverlay.hidden){draw();scheduleLoop();return;}const remain=Math.max(0,Math.ceil((pointDecision.deadline-performance.now())/1000));pointClock.textContent=remain+'s';if(performance.now()>=pointDecision.deadline){choosePoints(false);return;}}}else if(phase==='kickoff')updateKickoff(dt);else update(dt);draw();if(phase==='live'||phase==='kickoff'||phase==='points')scheduleLoop();}
reset.addEventListener('click',()=>{if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}closeCelebration();eventBanner.className='event-banner';pointDecision=null;conversion=false;conversionTeam=null;pointChoice.hidden=true;kickControl.hidden=true;fumble=null;kickoff=null;score=0;offenseTeam='blue';defenseTeam='red';updatePossession();ballOn=25;downs=1;document.getElementById('blueScore').textContent='0';document.getElementById('redScore').textContent='0';firstDownYard=35;LOS=285;firstDownMarkerX=LOS+10*YARD_PIXELS;updateDownDisplay();snap.textContent='SNAP!';status.textContent='Choose a play and press SNAP!';tackleHistory=[];finalTackler=null;setup();});snap.addEventListener('click',()=>{if(kickoff&&kickoff.stage==='waiting'){launchKickoff();return;}if(phase==='ended')setup();if(phase==='ready')begin();});updateDownDisplay();setup();})();
