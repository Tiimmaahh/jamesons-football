let celebrationPlayerApi=null,celebrationSession=0,youtubeApiPromise=null;
function loadCelebrationApi(){
 if(window.YT&&window.YT.Player)return Promise.resolve(window.YT);
 if(!youtubeApiPromise)youtubeApiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{if(previous)previous();resolve(window.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
  script.onerror=()=>{youtubeApiPromise=null;reject(new Error('Video controls unavailable'));};
  document.head.appendChild(script);
 });
 return youtubeApiPromise;
}
function openCelebration(team){
 const session=++celebrationSession;
 celebrationOpened=performance.now();celebrationOverlay.hidden=false;celebrationPlayer.hidden=false;
 document.getElementById('celebrationHeading').textContent=(team==='blue'?'HOME':'AWAY')+' TOUCHDOWN!';
 celebrationVideo.src='https://www.youtube.com/embed/DbyIORYMzMw?autoplay=1&mute=1&playsinline=1&rel=0&end=6&enablejsapi=1&origin='+encodeURIComponent(location.origin);
 celebrationExternal.href='https://www.youtube.com/watch?v=DbyIORYMzMw';
 document.getElementById('celebrationCaption').textContent='Griddy touchdown celebration';
 loadCelebrationApi().then(YT=>{
  if(session!==celebrationSession||celebrationOverlay.hidden)return;
  celebrationPlayerApi=new YT.Player(celebrationVideo, {events:{
   onReady:event=>{if(session===celebrationSession&&!celebrationOverlay.hidden){event.target.mute();event.target.playVideo();}},
   onStateChange:event=>{if(session===celebrationSession&&event.data===YT.PlayerState.ENDED)closeCelebration();}
  }});
 }).catch(()=>{/* The Continue Game button remains available if YouTube is offline. */});
}
function closeCelebration(){
 if(celebrationOverlay.hidden)return;
 celebrationOverlay.hidden=true;++celebrationSession;
 if(celebrationPlayerApi){celebrationPlayerApi.destroy();celebrationPlayerApi=null;}
 // The API removes its iframe on destroy. Restore the empty frame for the next TD.
 if(!celebrationVideo.isConnected)celebrationPlayer.insertBefore(celebrationVideo,celebrationExternal);
 celebrationVideo.removeAttribute('src');
 if(pointDecision&&pointDecision.team==='blue'){pointDecision.deadline=performance.now()+5000;pointClock.textContent='5s';}
}
document.getElementById('celebrationClose').addEventListener('click',closeCelebration);
