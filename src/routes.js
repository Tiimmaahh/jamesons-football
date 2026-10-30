// Passing routes share the offense-facing coordinates; TOP is always smaller y.
function eligiblePassReceivers(){
 return players.filter(p=>p.team===offenseTeam&&['WR','TE','RB'].includes(p.role));
}
function runningBackRoute(rb){
 const radius=YARD_PIXELS,cutX=Math.min(rb.homeX+4*YARD_PIXELS,W-50);
 const straight=Math.max(0,cutX-radius-rb.homeX);
 return {radius,cutX,straight,arc:Math.PI*radius/2,topY:45};
}
function updateRunningBackRoute(rb,dt){
 const route=runningBackRoute(rb);
 const length=route.straight+route.arc+rb.homeY-route.radius-route.topY;
 rb.passRouteDistance=Math.min(length,(rb.passRouteDistance||0)+rb.speed*dt);
 const distance=rb.passRouteDistance;
 if(distance<=route.straight){rb.x=rb.homeX+distance;rb.y=rb.homeY;}
 else if(distance<route.straight+route.arc){
  // A rounded plant-and-cut keeps the direction continuous without a speed jump.
  const angle=(distance-route.straight)/route.radius;
  rb.x=route.cutX-route.radius+Math.sin(angle)*route.radius;
  rb.y=rb.homeY-route.radius+Math.cos(angle)*route.radius;
 }else{
  rb.x=route.cutX;
  rb.y=Math.max(route.topY,rb.homeY-route.radius-(distance-route.straight-route.arc));
 }
}
function runningBackReady(rb){
 const route=runningBackRoute(rb);
 return (rb.passRouteDistance||0)>=route.straight+route.arc/2;
}
