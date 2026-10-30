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

// Route landmarks use offense-facing x; the renderer mirrors x for AWAY only.
function receiverRouteLandmarks(p){
 const x=yards=>Math.min(LOS+yards*YARD_PIXELS,W-32);
 const start={x:p.homeX,y:p.homeY};
 if(playType!=='deep'){
  if(p.role==='TE')return [start,{x:x(5),y:p.homeY},{x:x(5),y:H-45}];
  if(p.index===1)return [start,{x:x(12),y:330},{x:W-32,y:240}];
  if(p.index===0)return [start,{x:x(10),y:p.homeY},{x:x(24),y:200},{x:W-32,y:260}];
  return [start,{x:x(7),y:p.homeY}];
 }
 if(p.role==='TE')return [start,{x:x(15),y:285},{x:W-32,y:220}];
 if(p.index===0)return [start,{x:W-32,y:p.homeY}];
 return [start,{x:x(20),y:p.homeY},{x:W-32,y:285}];
}
function buildReceiverRoute(p){
 const landmarks=receiverRouteLandmarks(p),points=[landmarks[0]];
 // Round each change of direction with a short quadratic arc.
 for(let i=1;i<landmarks.length-1;i++){
  const a=landmarks[i-1],b=landmarks[i],c=landmarks[i+1];
  const before=Math.hypot(b.x-a.x,b.y-a.y),after=Math.hypot(c.x-b.x,c.y-b.y);
  const radius=Math.min(14,before/3,after/3);
  if(radius<.01){points.push(b);continue;}
  const enter={x:b.x+(a.x-b.x)*radius/before,y:b.y+(a.y-b.y)*radius/before};
  const leave={x:b.x+(c.x-b.x)*radius/after,y:b.y+(c.y-b.y)*radius/after};
  points.push(enter);
  for(let j=1;j<=12;j++){
   const t=j/12,u=1-t;
   points.push({x:u*u*enter.x+2*u*t*b.x+t*t*leave.x,y:u*u*enter.y+2*u*t*b.y+t*t*leave.y});
  }
 }
 points.push(landmarks[landmarks.length-1]);
 let length=0;const distances=[0];
 for(let i=1;i<points.length;i++){length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);distances.push(length);}
 return {points,distances,length,stop:playType!=='deep'&&p.role==='WR'&&p.index===2};
}
function updateReceiverRoute(p,dt){
 const route=p.passRoute||(p.passRoute=buildReceiverRoute(p));
 const remaining=route.length-(p.passRouteDistance||0);
 const easing=route.stop?clamp(remaining/20,.15,1):1;
 p.passRouteDistance=Math.min(route.length,(p.passRouteDistance||0)+p.speed*1.55*easing*dt);
 let i=1;while(i<route.distances.length-1&&route.distances[i]<p.passRouteDistance)i++;
 const a=route.points[i-1],b=route.points[i],length=route.distances[i]-route.distances[i-1];
 const t=length?clamp((p.passRouteDistance-route.distances[i-1])/length,0,1):1;
 p.x=a.x+(b.x-a.x)*t;p.y=a.y+(b.y-a.y)*t;
 p.facingQuarterback=route.stop&&p.passRouteDistance>=route.length;
}
function updatePassRoutes(dt){
 for(const p of eligiblePassReceivers()){
  if(p===carrier)continue;
  if(p.role==='RB')updateRunningBackRoute(p,dt);else updateReceiverRoute(p,dt);
 }
}
function passReceiverReady(p){
 if(p.role==='RB')return runningBackReady(p);
 if(p.passRoute&&p.passRoute.stop)return p.facingQuarterback;
 const depth=Math.min(LOS+(playType==='deep'?30:10)*scale,W-32);
 return (p.passRouteDistance||0)>=Math.max(0,depth-p.homeX)*.35;
}
