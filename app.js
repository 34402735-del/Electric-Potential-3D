import * as THREE from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {potential,field} from './physics.js';
const $=s=>document.querySelector(s),host=$('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#edf4f5');
const camera=new THREE.PerspectiveCamera(43,1,0.1,150);camera.up.set(0,0,1);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=48;controls.minDistance=6;controls.maxPolarAngle=Math.PI*.92;
function home(){camera.position.set(15,-20,17);controls.target.set(0,0,0);controls.update();}home();
scene.add(new THREE.HemisphereLight(0xffffff,0x6d8297,2.4));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-5,-8,20);scene.add(light);
const grid=new THREE.GridHelper(12,12,0x9baeb8,0xc9d8dd);grid.rotation.x=Math.PI/2;grid.position.z=-0.03;scene.add(grid);
// Physics x,y correspond to scene x,y. Scene z encodes potential only.
const N=100,geo=new THREE.PlaneGeometry(12,12,N,N);geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*3),3));
const surface=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:0.72,metalness:0.03,transparent:true,opacity:0.93}));scene.add(surface);
const contours=new THREE.Group(),arrows=new THREE.Group(),markers=new THREE.Group();scene.add(contours,arrows,markers);
const probe=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),new THREE.MeshBasicMaterial({color:0x164e49}));scene.add(probe);
const probeLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0x426a68,dashSize:.12,gapSize:.09}));scene.add(probeLine);
function label(text,x,y){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='28px sans-serif';ctx.textAlign='center';ctx.fillStyle='#476775';ctx.fillText(text,64,42);const map=new THREE.CanvasTexture(canvas);const s=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));s.position.set(x,y,.1);s.scale.set(1.2,.6,1);scene.add(s);}
label('x / m',6.7,0);label('y / m',0,6.7);
let charges=[],scale=.12,point={x:0,y:0};
function clear(group){for(const child of [...group.children]){child.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});group.remove(child);}}
const cool=new THREE.Color('#377dc4'),neutral=new THREE.Color('#dfebe4'),warm=new THREE.Color('#dd734d');
function color(v){const t=Math.min(Math.abs(v)/45,1);return neutral.clone().lerp(v<0?cool:warm,t);}
function reading(){const v=potential(point.x,point.y,charges),e=field(point.x,point.y,charges);$('#point').textContent=`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;$('#potential').textContent=v.toFixed(2);$('#field').textContent=Math.hypot(e.x,e.y).toFixed(2);probe.position.set(point.x,point.y,v*scale+.08);probeLine.geometry.dispose();probeLine.geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(point.x,point.y,0),new THREE.Vector3(point.x,point.y,v*scale)]);probeLine.computeLineDistances();}
function rebuild(){const pos=geo.attributes.position,colors=geo.attributes.color,values=[];for(let i=0;i<pos.count;i++){const v=potential(pos.getX(i),pos.getY(i),charges);values.push(v);pos.setZ(i,v*scale);const c=color(v);colors.setXYZ(i,c.r,c.g,c.b);}pos.needsUpdate=true;colors.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();clear(contours);clear(arrows);clear(markers);
 // Triangle intersections avoid ambiguous four-edge marching-squares cases.
 const segments=[],indices=geo.index.array;
 const vmin=Math.min(...values),vmax=Math.max(...values);
 for(let level=Math.ceil(vmin/5)*5;level<=vmax;level+=5){for(let i=0;i<indices.length;i+=3){const tri=[indices[i],indices[i+1],indices[i+2]],hits=[];for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],va=values[a],vb=values[b];if((va<=level&&vb>level)||(vb<=level&&va>level)){const t=(level-va)/(vb-va);hits.push([pos.getX(a)+(pos.getX(b)-pos.getX(a))*t,pos.getY(a)+(pos.getY(b)-pos.getY(a))*t,level*scale+.015]);}}if(hits.length===2)segments.push(...hits[0],...hits[1]);}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));contours.add(new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0x3c6b71,transparent:true,opacity:.4})));
 for(let x=-5.5;x<=5.5;x+=1)for(let y=-5.5;y<=5.5;y+=1){const e=field(x,y,charges),len=Math.hypot(e.x,e.y);if(len<1e-7)continue;arrows.add(new THREE.ArrowHelper(new THREE.Vector3(e.x/len,e.y/len,0),new THREE.Vector3(x,y,.045),.56,0x3c716e,.17,.09));}
 for(const c of charges){const m=new THREE.Mesh(new THREE.SphereGeometry(.15,20,16),new THREE.MeshStandardMaterial({color:c.q>=0?0xe57f59:0x438dd0,emissive:c.q>=0?0x502014:0x102f50}));m.position.set(c.x,c.y,.08);markers.add(m);}
 contours.visible=$('#contours').checked;arrows.visible=$('#arrows').checked;$('#count').textContent=`${charges.length} 个源电荷`;reading();}
function editList(){const list=$('#charges');list.replaceChildren();charges.forEach((c,index)=>{const div=document.createElement('div');div.className='charge'+(c.q<0?' negative':'');div.innerHTML=`<div class="charge-head"><span>${c.q>=0?'＋':'−'} 电荷 ${index+1}</span><button aria-label="删除电荷 ${index+1}">×</button></div><div class="fields"></div>`;div.querySelector('button').onclick=()=>{charges.splice(index,1);editList();rebuild();};for(const [key,name,min,max]of [['q','q / nC',-5,5],['x','x / m',-6,6],['y','y / m',-6,6]]){const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=.1;input.value=c[key];input.setAttribute('aria-label',`电荷 ${index+1} ${name}`);input.oninput=()=>{if(input.value===''||!Number.isFinite(input.valueAsNumber))return;c[key]=Math.max(min,Math.min(max,input.valueAsNumber));div.classList.toggle('negative',c.q<0);div.querySelector('.charge-head span').textContent=`${c.q>=0?'＋':'−'} 电荷 ${index+1}`;rebuild();};input.onchange=()=>{input.value=c[key];};label.appendChild(input);div.querySelector('.fields').appendChild(label);}list.appendChild(div);});$('#add-positive').disabled=$('#add-negative').disabled=charges.length>=8;}
function preset(){const p=$('#preset').value;charges=p==='dipole'?[{q:1,x:-2,y:0},{q:-1,x:2,y:0}]:[{q:p==='positive'?1:-1,x:0,y:0}];point={x:0,y:0};editList();rebuild();}
$('#preset').onchange=preset;for(const [id,q]of [['#add-positive',1],['#add-negative',-1]])$(id).onclick=()=>{if(charges.length>=8)return;charges.push({q,x:0,y:0});editList();rebuild();};
$('#height').oninput=()=>{scale=Number($('#height').value);$('#height-value').value=scale.toFixed(2);rebuild();};$('#contours').onchange=()=>contours.visible=$('#contours').checked;$('#arrows').onchange=()=>arrows.visible=$('#arrows').checked;$('#home').onclick=home;
$('#reset').onclick=()=>{$('#preset').value='dipole';$('#height').value=.12;$('#height-value').value='0.12';scale=.12;$('#contours').checked=$('#arrows').checked=true;home();preset();};
let down;renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});renderer.domElement.addEventListener('pointerup',e=>{if(!down||e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObject(surface)[0];if(hit){point={x:hit.point.x,y:hit.point.y};reading();}});
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
preset();$('#loading').remove();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
