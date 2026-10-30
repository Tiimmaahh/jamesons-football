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
  status.textContent='QUARTERBACK SNEAK! QB keeps the ball and runs forward!';
 }else routeReceiver=selected;
}
