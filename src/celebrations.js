function openCelebration(team){
 celebrationOpened=performance.now();celebrationOverlay.hidden=false;celebrationPlayer.hidden=false;
 document.getElementById('celebrationHeading').textContent=(team==='blue'?'HOME':'AWAY')+' TOUCHDOWN!';
 // Muted inline playback permits automatic playback without another button tap.
 celebrationVideo.src='https://www.youtube.com/embed/DbyIORYMzMw?autoplay=1&mute=1&playsinline=1&rel=0';
 celebrationExternal.href='https://www.youtube.com/watch?v=DbyIORYMzMw';
 document.getElementById('celebrationCaption').textContent='Griddy touchdown celebration';
}
function closeCelebration(){if(celebrationOverlay.hidden)return;celebrationOverlay.hidden=true;celebrationVideo.removeAttribute('src');if(pointDecision&&pointDecision.team==='blue'){pointDecision.deadline=performance.now()+5000;pointClock.textContent='5s';}}
document.getElementById('celebrationClose').addEventListener('click',closeCelebration);

