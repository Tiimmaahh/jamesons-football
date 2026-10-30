function openCelebration(team){celebrationOpened=performance.now();celebrationOverlay.hidden=false;celebrationButtons.hidden=false;celebrationPlayer.hidden=true;celebrationVideo.removeAttribute('src');document.getElementById('celebrationHeading').textContent=(team==='blue'?'HOME':'AWAY')+' TOUCHDOWN! PICK A CELEBRATION!';}
const celebrationClips={
 griddy:{embed:'https://www.youtube.com/embed/DbyIORYMzMw?autoplay=1&rel=0',external:'https://www.youtube.com/watch?v=DbyIORYMzMw',caption:"Ja'Marr Chase Griddy touchdown — alternate video angle"},
 headstand:{embed:'https://www.youtube.com/embed/q-aNFC5btZo?start=8&end=13&autoplay=1',external:'https://www.youtube.com/watch?v=q-aNFC5btZo&t=8s',caption:'Headstand touchdown celebration — 8–13 second clip'},
 third:{embed:'https://www.youtube.com/embed/HkNfQm_PCao?start=7&end=16&autoplay=1',external:'https://www.youtube.com/watch?v=HkNfQm_PCao&t=7s',caption:'Touchdown celebration — 7–16 second clip'}
};
function playCelebration(which){
 const clip=celebrationClips[which];if(!clip)return;
 celebrationButtons.hidden=true;celebrationPlayer.hidden=false;
 celebrationVideo.src=clip.embed;celebrationExternal.href=clip.external;
 document.getElementById('celebrationCaption').textContent=clip.caption;
}
for(const [id,clip] of [['griddyCelebration','griddy'],['headstandCelebration','headstand'],['thirdCelebration','third']]){
 document.getElementById(id).addEventListener('click',()=>playCelebration(clip));
}
function closeCelebration(){if(celebrationOverlay.hidden)return;celebrationOverlay.hidden=true;celebrationVideo.removeAttribute('src');if(pointDecision&&pointDecision.team==='blue'){pointDecision.deadline=performance.now()+5000;pointClock.textContent='5s';}}
document.getElementById('celebrationClose').addEventListener('click',closeCelebration);

