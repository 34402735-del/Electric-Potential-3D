import test from 'node:test';
import assert from 'node:assert/strict';
import {potential,field,K,EPS} from './physics.js';
test('single charges have finite signed peaks',()=>{assert.equal(potential(0,0,[{q:1,x:0,y:0}]),K/EPS);assert.equal(potential(0,0,[{q:-1,x:0,y:0}]),-K/EPS);assert.equal(potential(1,2,[]),0);});
test('dipole midpoint has zero potential but nonzero field',()=>{const c=[{q:1,x:-2,y:0},{q:-1,x:2,y:0}];assert.equal(potential(0,0,c),0);assert.ok(field(0,0,c).x>0);assert.equal(field(0,0,c).y,0);});
test('field equals negative numerical gradient of rendered potential',()=>{const c=[{q:2,x:-1,y:2},{q:-.7,x:2,y:-1}];for(const [x,y]of [[0,0],[-1,2],[3,-2]]){const h=1e-5,e=field(x,y,c);const ex=-(potential(x+h,y,c)-potential(x-h,y,c))/(2*h),ey=-(potential(x,y+h,c)-potential(x,y-h,c))/(2*h);assert.ok(Math.abs(e.x-ex)<1e-6);assert.ok(Math.abs(e.y-ey)<1e-6);}});
test('superposition and far field limit',()=>{const a={q:1,x:0,y:0},b={q:-2,x:1,y:1};assert.equal(potential(2,3,[a,b]),potential(2,3,[a])+potential(2,3,[b]));assert.ok(Math.abs(potential(100,0,[a])/(K/100)-1)<.00001);});
