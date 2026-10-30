
(()=>{'use strict';
const canvas=document.getElementById('field'),ctx=canvas.getContext('2d'),snap=document.getElementById('snap'),reset=document.getElementById('reset'),playSel=document.getElementById('play'),status=document.getElementById('status'),yardage=document.getElementById('yardage');
const downText=document.getElementById('downText'),downHint=document.getElementById('downHint'),downPossession=document.getElementById('downPossession');const defensePlaySel=document.getElementById('defensePlay');let activeDefense='man';const tackleDebug=document.getElementById('tackleDebug'),possession=document.getElementById('possession'),offenseControl=document.getElementById('offenseControl'),defenseControl=document.getElementById('defenseControl');let offenseTeam='blue',defenseTeam='red';let tippedBall=null;function updatePossession(){possession.textContent=(offenseTeam==='blue'?'🔵 HOME':'🔴 AWAY')+' OFFENSE';possession.style.color=offenseTeam==='blue'?'#70b9ff':'#ff8585';offenseControl.hidden=offenseTeam!=='blue';defenseControl.hidden=offenseTeam==='blue';}function switchPossession(){[offenseTeam,defenseTeam]=[defenseTeam,offenseTeam];updatePossession();}let tackleHistory=[];let finalTackler=null;
// Keep the offense and defense selections independent, with shared button styles.
for(const [selector,select,key] of [['[data-play]',playSel,'play'],['[data-defense]',defensePlaySel,'defense']]){
 const buttons=document.querySelectorAll(selector);
 buttons.forEach(button=>button.addEventListener('click',()=>{
  select.value=button.dataset[key];
  buttons.forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
 }));
}
const eventBanner=document.getElementById('eventBanner');
function showEvent(kind,team){
 eventBanner.className='event-banner '+(team==='blue'?'home':'away');
 eventBanner.querySelector('.event-main').textContent=kind==='pick'?'PICK!':'TOUCHDOWN!';
 eventBanner.querySelector('.event-team').textContent=kind==='pick'?'':(team==='blue'?'HOME!':'AWAY!');
 void eventBanner.offsetWidth;
 eventBanner.classList.add('show');
}
function showTackleDebug(){tackleDebug.innerHTML='';if(!tackleHistory.length){tackleDebug.textContent='No tackles or picks yet. Press SNAP!';return;}for(const line of tackleHistory.slice(-5).reverse()){const item=document.createElement('div');item.className='debug-line';item.textContent=line;tackleDebug.appendChild(item);}}function logInterception(d,roll,picked){if(!picked)return;showEvent('pick',d.team);tackleHistory.push((d.role==='DB'?'Defensive Back':'Linebacker')+' #'+(d.index+1)+' got a pick!');showTackleDebug();}function logTackle(d,chance,roll,escaped){if(escaped)return;const role=d.role==='DL'?'Defensive Lineman':d.role==='LB'?'Linebacker':'Defensive Back';tackleHistory.push(role+' #'+(d.index+1)+' made the tackle!');showTackleDebug();}
const W=1000,H=570,scale=9,YARD_PIXELS=8.6;
// LOS is measured from the current offense's own end zone, so reversing possession
// mirrors the exact physical spot instead of teleporting the teams to midfield.
function spotFromX(x){return clamp(Math.round((x-70)/YARD_PIXELS),1,99);}
function setDriveSpot(x){LOS=clamp(x,85,920);ballOn=spotFromX(LOS);downs=1;firstDownYard=Math.min(100,ballOn+10);firstDownMarkerX=Math.min(930,LOS+(firstDownYard-ballOn)*YARD_PIXELS);}
let LOS=285,firstDownMarkerX=371;let players=[],ball={x:LOS-33,y:285},carrier=null,phase='ready',last=0,elapsed=0,goalGap=2,ballOn=25,downs=1,firstDownYard=35,score=0,stopped=false,attemptTimes=new Map(),playType='run',passTarget=null,passOrigin=null,passElapsed=0,passDuration=1.30,runY=285,routeReceiver=null,returner=null,returnElapsed=0;
const random=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let kickoff=null, fumble=null, pointDecision=null, conversion=false, conversionTeam=null;let scrambleEligible=false,scrambling=false,scrambleSide=1;
const pointChoice=document.getElementById('pointChoice'),pointClock=document.getElementById('pointClock');
const celebrationOverlay=document.getElementById('celebrationOverlay'), celebrationButtons=document.getElementById('celebrationButtons'), celebrationPlayer=document.getElementById('celebrationPlayer'), celebrationVideo=document.getElementById('celebrationVideo'), celebrationExternal=document.getElementById('celebrationExternal');
let celebrationOpened=0;
