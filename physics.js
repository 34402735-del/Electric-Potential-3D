// Coordinates in metres; charge input in nC; potential in V.
export const K=8.9875517923, EPS=0.35;
export function potential(x,y,charges){return charges.reduce((v,c)=>v+K*c.q/Math.sqrt((x-c.x)**2+(y-c.y)**2+EPS**2),0);}
// Exact negative gradient of the SAME softened potential used by the terrain.
export function field(x,y,charges){return charges.reduce((e,c)=>{const dx=x-c.x,dy=y-c.y;const f=K*c.q/(dx*dx+dy*dy+EPS*EPS)**1.5;e.x+=f*dx;e.y+=f*dy;return e;},{x:0,y:0});}
