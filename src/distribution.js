// One draw from six equal buckets; order is stable for both offenses.
function passingOptions(){
 const offense=players.filter(p=>p.team===offenseTeam);
 const receiver=index=>offense.find(p=>p.role==='WR'&&p.index===index);
 return [receiver(0),receiver(2),receiver(1),offense.find(p=>p.role==='TE'),
  offense.find(p=>p.role==='RB'),offense.find(p=>p.role==='QB')];
}
function selectPassingOutcome(){
 const selected=passingOptions()[Math.floor(Math.random()*6)];
 if(selected.role==='QB'){
  scrambling=true;
  selected.pressurePassChecked=false;
  qbRunSide=Math.random()<.5?-1:1;
  status.textContent='QUARTERBACK RUN! QB keeps the ball and runs '+(qbRunSide<0?'LEFT!':'RIGHT!');
 }else routeReceiver=selected;
}

// A running QB gets one pressure decision, only while behind the original LOS.
function tryQuarterbackPressurePass(qb){
 if(!scrambling||carrier!==qb||playType==='run'||qb.x>=LOS||qb.pressurePassChecked)return false;
 const pressured=players.some(d=>d.team===defenseTeam&&dist(d,qb)<=90);
 if(!pressured)return false;
 qb.pressurePassChecked=true;
 if(Math.random()>=.75)return false;
 const receivers=eligiblePassReceivers();
 routeReceiver=receivers[Math.floor(Math.random()*receivers.length)];
 passTarget=routeReceiver;passOrigin={x:qb.x,y:qb.y};passElapsed=0;
 scrambling=false;carrier=null;
 status.textContent='QB THROWS ON THE RUN to '+offenseTeam.toUpperCase()+' '+passTarget.role+'!';
 return true;
}
