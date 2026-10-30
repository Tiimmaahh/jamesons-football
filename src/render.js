function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#276d39';ctx.fillRect(0,0,W,H);ctx.fillStyle='#1f5fd1';ctx.fillRect(0,0,70,H);ctx.fillStyle='#c92e32';ctx.fillRect(W-70,0,70,H);// Field markings: 5-yard lines with numbers on each 10-yard line.
ctx.save();
for(let yard=5;yard<100;yard+=5){
  const x=70+(W-140)*yard/100;
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);
  ctx.strokeStyle=yard%10===0?'rgba(255,255,255,.72)':'rgba(255,255,255,.42)';
  ctx.lineWidth=yard%10===0?2.5:1.5;ctx.stroke();
  if(yard%10===0){
    const label=String(yard<=50?yard:100-yard);
    ctx.fillStyle='#ffffff';ctx.font='bold 27px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(label,x,76);ctx.fillText(label,x,H-76);
  }
}
ctx.restore();ctx.save();ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.save();ctx.translate(35,H/2);ctx.rotate(Math.PI/2);ctx.fillText('HOME END ZONE',0,0);ctx.restore();ctx.save();ctx.translate(W-35,H/2);ctx.rotate(Math.PI/2);ctx.fillText('AWAY END ZONE',0,0);ctx.restore();ctx.restore();ctx.save();if(!kickoff&&offenseTeam==='red'){ctx.translate(W,0);ctx.scale(-1,1);}const firstX=firstDownMarkerX;if(!kickoff&&firstX>=0&&firstX<=W){ctx.save();ctx.strokeStyle='#ffeb3b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(firstX,0);ctx.lineTo(firstX,H);ctx.stroke();ctx.restore();}if(!kickoff){ctx.setLineDash([9,8]);ctx.strokeStyle='#f8d04b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(LOS,0);ctx.lineTo(LOS,H);ctx.stroke();ctx.setLineDash([]);}
if(defenseTeam==='blue'&&activeDefense==='zone'&&phase==='live'){
 const z=[[LOS+105,115],[LOS+105,285],[LOS+105,455],[LOS+250,85],[LOS+250,485],[LOS+250,210],[LOS+250,360]];
 ctx.save();ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(117,204,255,.55)';ctx.fillStyle='rgba(62,159,255,.08)';
 z.forEach((point,i)=>{const ww=i<3?210:280,hh=i<3?175:165;ctx.fillRect(point[0]-ww/2,point[1]-hh/2,ww,hh);ctx.strokeRect(point[0]-ww/2,point[1]-hh/2,ww,hh);});ctx.restore();}
for(const p of players){ctx.beginPath();ctx.arc(p.x,p.y,15,0,Math.PI*2);ctx.fillStyle=p.team==='blue'?'#1768e9':'#e3383c';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle='white';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.save();if(!kickoff&&offenseTeam==='red'){ctx.translate(p.x,p.y+3);ctx.scale(-1,1);ctx.fillText(p.role==='OL'?'OL':p.role==='DL'?'DL':p.role,0,0);}else{ctx.fillText(p.role==='OL'?'OL':p.role==='DL'?'DL':p.role==='K'?'K':p.role==='R'?'RET':p.role,p.x,p.y+3);}ctx.restore();}
const ringPlayer=carrier||(kickoff&&kickoff.stage==='return'?kickoff.returner:null)||(fumble&&fumble.stage==='return'?fumble.runner:null)||(returner?returner:null);
const showBallRing=!ringPlayer||passTarget||tippedBall||(kickoff&&kickoff.stage==='flight')||(fumble&&fumble.stage==='loose');
if(ringPlayer){ctx.save();ctx.beginPath();ctx.arc(ringPlayer.x,ringPlayer.y,24,0,Math.PI*2);ctx.strokeStyle='#ffd84d';ctx.lineWidth=5;ctx.shadowColor='rgba(255,215,0,.95)';ctx.shadowBlur=18;ctx.stroke();ctx.restore();}
if(phase==='ended'&&finalTackler){ctx.beginPath();ctx.arc(finalTackler.x,finalTackler.y,22,0,Math.PI*2);ctx.lineWidth=5;ctx.strokeStyle='#ffeb3b';ctx.stroke();}ctx.textAlign='start';if(phase==='live'&&playType==='run'&&elapsed>.48){ctx.strokeStyle='#fff59d';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();const rb=players.find(p=>p.role==='RB');ctx.moveTo(rb.x,rb.y);ctx.lineTo(LOS+62,runY);ctx.stroke();ctx.setLineDash([]);}if(showBallRing){ctx.save();ctx.beginPath();ctx.arc(ball.x,ball.y,22,0,Math.PI*2);ctx.strokeStyle='#ffd84d';ctx.lineWidth=5;ctx.shadowColor='rgba(255,215,0,.95)';ctx.shadowBlur=18;ctx.stroke();ctx.restore();}ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(-.35);ctx.fillStyle='#884c26';ctx.beginPath();ctx.ellipse(0,0,10,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();ctx.restore();ctx.restore();if(kickoff&&kickoff.stage==='waiting'){const seconds=Math.max(0,Math.ceil((kickoff.deadline-performance.now())/1000));ctx.save();ctx.fillStyle='rgba(10,20,34,.88)';ctx.fillRect(W-198,10,184,64);ctx.strokeStyle='#f4d75b';ctx.lineWidth=2;ctx.strokeRect(W-198,10,184,64);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.fillText('KICKOFF IN',W-106,34);ctx.fillStyle='#f4d75b';ctx.font='bold 28px Arial';ctx.fillText(seconds+'s',W-106,62);ctx.restore();}}
