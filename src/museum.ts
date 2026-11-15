import * as THREE from 'three';
import {canOccupy} from './state';
import type {Save} from './state';
import type {RoomId} from './data';

const palette={paper:0xe8e0cc,wood:0x8b6445,dark:0x4e493a,teal:0x52796b,coral:0xbf806a,gold:0xc9a565};
export class Museum {
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(43,1,.1,150); renderer:THREE.WebGLRenderer;
  world=new THREE.Group(); raycaster=new THREE.Raycaster(); keys=new Set<string>(); clock=new THREE.Clock();
  overview=true; paused=true; yaw=0; pitch=0; joystick={x:0,y:0}; target:RoomId|null=null;
  targets:{id:RoomId;position:THREE.Vector3;ring:THREE.Mesh;orb:THREE.Mesh}[]=[];
  animated:THREE.Object3D[]=[]; restoreGroups=new Map<RoomId,THREE.Group>();
  gates:{group:THREE.Group;unlock:'instrument'|'rhythm'}[]=[];restorationKey='';
  onTarget:(id:RoomId|null)=>void=()=>{}; onRoom:(id:RoomId)=>void=()=>{}; onInvestigate:(id:RoomId)=>void=()=>{};
  drag:{x:number;y:number;distance:number;id:number}|null=null; time=0; frame=0; resizeObserver:ResizeObserver; disposed=false;
  materials=new Map<string,THREE.MeshStandardMaterial>(); geo=new THREE.BoxGeometry(1,1,1);
  constructor(public host:HTMLElement,public state:Save){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setClearColor(0xe9e7db,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    this.renderer.domElement.setAttribute('aria-label','국악박물관 3D 탐험 공간. 화면 드래그로 둘러보기');this.renderer.domElement.tabIndex=0;
    host.append(this.renderer.domElement);this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight(0xfff9e8,0x7e8b75,3));
    const sun=new THREE.DirectionalLight(0xffe5b5,4);sun.position.set(-10,25,12);this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0xdce9e1,2);fill.position.set(20,8,-15);this.scene.add(fill);
    this.build();this.updateRestoration();this.camera.position.set(26,26,31);this.camera.lookAt(0,0,-1);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
    this.bind();this.animate();
  }
  mat(color:number,roughness=.8,metalness=0){const key=`${color}:${roughness}:${metalness}`;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return this.materials.get(key)!;}
  box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(this.geo,this.mat(color));m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;}
  cylinder(parent:THREE.Object3D,r1:number,r2:number,h:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,24),this.mat(color));m.position.set(x,y,z);parent.add(m);return m;}
  text(parent:THREE.Object3D,text:string,x:number,y:number,z:number,width=3.8,color='#4b5547'){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle=color;ctx.font='600 56px "Malgun Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,80);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width*160/768,1);parent.add(sprite);return sprite;
  }
  build(){
    const w=this.world;
    // Original geometric museum: no downloaded models or textures.
    this.box(w,24.7,.65,18.7,0,-.45,0,0xc4b59b);this.box(w,24.2,.16,18.2,0,-.06,0,0xddd1b7);
    for(let i=0;i<40;i++){const x=-11.7+i*.6;this.box(w,.58,.04,18,x,.045,0,i%3===0?0xddc9a7:i%3===1?0xe4d5b6:0xd6c4a3);}
    // Tinted woven floor panels define rooms without long corridors.
    this.box(w,10.9,.025,7.2,-6,.09,-4.7,0xe8decb);this.box(w,10.9,.025,7.2,6,.09,-4.7,0xe2d7bd);
    this.box(w,9.8,.025,6.8,-6,.09,4.5,0xe5ddc8);this.box(w,9.8,.025,6.8,6,.09,4.5,0xd5d6bd);
    this.box(w,24,.20,.22,0,.25,9,0x997d5a);this.box(w,.22,.8,18,-12,.4,0,0xc5b493);this.box(w,.22,.8,18,12,.4,0,0xc5b493);
    this.box(w,24,4,.25,0,2,-9,0xe4ddca);
    for(const x of [-12,-6,0,6,12]){this.box(w,.23,4.6,.35,x,2.3,-8.9,palette.wood);this.box(w,5.9,.2,.5,x+3,4.4,-8.9,palette.wood);}
    // Backlit paper windows, wooden lattice.
    for(const cx of [-9,-3,3,9]){this.box(w,3.9,2.7,.08,cx,2.3,-8.72,0xf5ecd3);for(let j=-2;j<=2;j++)this.box(w,.045,2.7,.12,cx+j*.65,2.3,-8.6,0xc4ac85);for(let j=-1;j<=1;j++)this.box(w,3.9,.045,.12,cx,2.3+j*.7,-8.6,0xc4ac85);}
    // Cutaway interior partitions, with clearly visible doorways.
    for(const z of [-8.1,-.9,.9,8.1])this.box(w,.22,.75,1.8,0,.37,z,0xcbbd9d);
    for(const x of [-10.3,-1.7,1.7,10.3])this.box(w,3.4,.65,.22,x,.32,0,0xcbbd9d);
    this.arch(w,-6,0,0);this.arch(w,6,0,0);this.arch(w,0,0,-4.5,Math.PI/2);this.arch(w,0,0,4.5,Math.PI/2);
    for(const [x,z,angle,unlock] of [[0,-4.5,Math.PI/2,'instrument'],[0,4.5,Math.PI/2,'rhythm'],[6,0,0,'rhythm']] as const){const gate=new THREE.Group();gate.position.set(x,0,z);gate.rotation.y=angle;w.add(gate);for(let i=-2;i<=2;i++)this.box(gate,.12,2.6,.12,i*.5,1.3,0,0xa29878);this.box(gate,2.7,.2,.15,0,1.5,0,0xa29878);this.gates.push({group:gate,unlock});}
    this.text(w,'악기의 방',-6,4.1,-7.7,4.2);this.text(w,'장단의 방',6,4.1,-7.7,4.2);
    this.text(w,'국악을 일상으로',-6,2.8,7.6,3.5);this.text(w,'작은 소리의 무대',6,2.8,7.7,3.8);
    // Instrument room: gayageum with 12 strings, bamboo flute, two-string fiddle.
    this.box(w,4,1.1,2,-9,.65,-6,0xc7b797);this.box(w,4.15,.12,2.12,-9,1.25,-6,0xf3e7d2);this.gayageum(w,-9,1.38,-6,.95);
    this.box(w,3,1.1,2,-3,.65,-6,0xc7b797);this.box(w,3.1,.12,2.1,-3,1.25,-6,0xf3e7d2);this.haegeum(w,-3.6,1.35,-6,.85);this.flute(w,-2.3,1.75,-6,.9);
    this.plaque(w,'가야금',-9,.9,-4.92);this.plaque(w,'해금 · 대금',-3,.9,-4.92);
    // Rhythm room's central janggu and a nine-cell teaching device.
    this.box(w,3.8,.9,2.6,8,.55,-6,0x889280);this.box(w,4,.12,2.8,8,1.05,-6,0xe8dbc1);this.janggu(w,8,1.8,-6,1.1);this.plaque(w,'장구',8,.75,-4.55);
    for(let i=0;i<9;i++){const block=this.box(w,.57,.18,.6,3+(i%3)*.68,.35,-5+Math.floor(i/3)*.68,i%3===0?palette.teal:0xc4ad7b);this.animated.push(block);}
    this.box(w,2.8,.22,2.8,3.65,.18,-4.3,0xa6906e);
    // Lobby's welcome desk, small garden and sound archive sculpture.
    this.box(w,2.5,1.35,2.5,-9,.78,6,0x9c8a6c);this.box(w,2.65,.16,2.65,-9,1.5,6,0xf5e9d2);
    this.cylinder(w,.48,.48,.06,-9,1.65,6,palette.teal);const torus=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,8,48),this.mat(palette.gold,.4,.4));torus.position.set(-9,2.5,6);w.add(torus);this.animated.push(torus);
    this.text(w,'소리 보관소',-9,3.8,5.5,2.4);this.plant(w,-10.7,2.3);this.plant(w,-1.6,-7.8);this.plant(w,10.7,2);
    // Performance platform and empty musician seats.
    const hall=new THREE.Group();w.add(hall);this.restoreGroups.set('hall',hall);
    this.box(hall,7,.5,3.8,7,.35,6.6,palette.wood);this.box(hall,7.1,.08,3.9,7,.64,6.6,0xcab28a);
    for(const x of [4.6,7,9.4]){this.cylinder(hall,.58,.66,.38,x,.9,6.6,0x828f78);this.cylinder(hall,.63,.63,.1,x,1.12,6.6,0xe8dcc2);}
    this.gayageum(hall,4.6,1.4,6.6,.5);this.haegeum(hall,7,1.2,6.6,.55);this.janggu(hall,9.4,1.5,6.6,.5);
    for(let i=0;i<5;i++)this.box(w,1,.32,.7,3.2+i*1.5,.25,3.6,0xa09c7b);
    // Floating investigation seals and restrained floor rings.
    const points:{id:RoomId;x:number;z:number}[]=[{id:'lobby',x:-6,z:3},{id:'instruments',x:-6,z:-5},{id:'rhythm',x:6,z:-5},{id:'hall',x:6,z:5.1}];
    for(const p of points){const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.71,48),new THREE.MeshBasicMaterial({color:palette.teal,transparent:true,opacity:.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.16,p.z);w.add(ring);
      const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.19),new THREE.MeshStandardMaterial({color:palette.gold,emissive:palette.gold,emissiveIntensity:.3,metalness:.4,roughness:.4}));orb.position.set(p.x,1.85,p.z);w.add(orb);this.targets.push({id:p.id,position:new THREE.Vector3(p.x,1.6,p.z),ring,orb});}
    // Lanterns and warm paper panels.
    for(const x of [-10.7,-1.2,1.2,10.7]){this.box(w,.07,3.9,.07,x,1.95,-1.5,palette.wood);this.box(w,.65,.88,.65,x,3.55,-1.5,0xf8e4ad);this.box(w,.76,.09,.76,x,4,-1.5,palette.wood);this.box(w,.76,.09,.76,x,3.1,-1.5,palette.wood);}
  }
  arch(parent:THREE.Object3D,x:number,y:number,z:number,rotation=0){const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;parent.add(group);for(const dx of [-1.5,1.5]){this.box(group,.18,3.35,.25,dx,1.65,0,palette.wood);this.box(group,.3,.14,.4,dx,.1,0,0xaaa186);}this.box(group,3.4,.22,.4,0,3.3,0,palette.wood);this.box(group,3.65,.1,.55,0,3.5,0,0x5e6b56);}
  plaque(parent:THREE.Object3D,label:string,x:number,y:number,z:number){this.box(parent,1.8,.45,.09,x,y,z,0xf1e8d5);this.text(parent,label,x,y,z+.08,1.5);}
  gayageum(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);g.rotation.y=-.13;parent.add(g);this.box(g,3.65,.22,.93,0,.15,0,0x9c5e32);this.box(g,3.8,.08,.9,0,.3,0,0xc79350);for(let i=0;i<12;i++){this.box(g,3.52,.015,.014,0,.4,-.39+i*.071,0xf2dcb0);const bridge=this.box(g,.07,.12,.055,-.8+i*.12,.37,-.39+i*.071,0x6d4a29);bridge.rotation.z=.4;}this.box(g,.09,.22,.91,-1.7,.35,0,0x5e3c28);this.box(g,.09,.22,.91,1.7,.35,0,0x5e3c28);}
  flute(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);g.rotation.z=.18;parent.add(g);const flute=this.cylinder(g,.09,.09,2.6,0,1.2,0,0xbfa15b);flute.rotation.z=.05;for(let i=0;i<7;i++){const hole=new THREE.Mesh(new THREE.SphereGeometry(.042,8,6),this.mat(0x343c2f));hole.position.set(0,.3+i*.29,.086);g.add(hole);}for(const yy of [.12,.7,1.5,2.38])this.cylinder(g,.098,.098,.04,0,yy,0,0x686640);}
  haegeum(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);const body=this.cylinder(g,.28,.28,.5,0,.3,0,0x9c6842);body.rotation.x=Math.PI/2;this.cylinder(g,.048,.06,2.1,-.15,1.2,0,0x92603b);for(const yy of [1.95,2.25]){const peg=this.cylinder(g,.05,.05,.55,.08,yy,0,0x63442e);peg.rotation.z=Math.PI/2;}for(const xx of [-.02,.04])this.box(g,.012,2,.015,xx,1.3,.27,0xe6cda6);const bow=this.box(g,1.7,.035,.035,.5,.7,.3,0x9f7444);bow.rotation.z=.15;this.box(g,1.65,.01,.015,.5,.65,.27,0xebe0bd);}
  janggu(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);for(const side of [-1,1]){const shell=new THREE.Mesh(new THREE.CylinderGeometry(.55,.23,.78,24),this.mat(0xa85e3d));shell.rotation.z=-side*Math.PI/2;shell.position.x=side*.38;g.add(shell);const head=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.06,32),this.mat(0xe9d5af));head.rotation.z=Math.PI/2;head.position.x=side*.8;g.add(head);}
    for(let i=0;i<10;i++){const angle=i*Math.PI/5;const start=new THREE.Vector3(-.82,Math.cos(angle)*.52,Math.sin(angle)*.52),end=new THREE.Vector3(.82,Math.cos(angle+.35)*.52,Math.sin(angle+.35)*.52);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color:0xe0c695}));g.add(line);}this.animated.push(g);}
  plant(parent:THREE.Object3D,x:number,z:number){this.cylinder(parent,.36,.25,.65,x,.38,z,0xddd5bf);for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),this.mat(i%2?0x718663:0x87996e));leaf.scale.set(.55,1.8,.3);leaf.position.set(x+Math.sin(i*2)*.3,1.1+Math.cos(i)*.2,z+Math.cos(i*2)*.3);leaf.rotation.z=Math.sin(i*2)*.6;parent.add(leaf);}}
  updateRestoration(){const key=`${this.state.instrument}:${this.state.rhythm}:${this.state.completed}`;if(key===this.restorationKey)return;this.restorationKey=key;for(const gate of this.gates)gate.group.visible=gate.unlock==='instrument'?this.state.instrument<3:this.state.rhythm<2;for(const t of this.targets){const restored=t.id==='lobby'||(t.id==='instruments'&&this.state.instrument===3)||(t.id==='rhythm'&&this.state.rhythm===2)||(t.id==='hall'&&this.state.completed);(t.ring.material as THREE.MeshBasicMaterial).color.setHex(restored?0x4b8a71:0xc18c4e);(t.orb.material as THREE.MeshStandardMaterial).color.setHex(restored?0x7aab8e:0xc9a565);}
    const hall=this.restoreGroups.get('hall');if(hall)hall.visible=this.state.rhythm===2;
  }
  resize(){const {width,height}=this.host.getBoundingClientRect();if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);}
  enter(room:RoomId='lobby'){this.overview=false;this.paused=false;this.goTo(room);}
  goTo(room:RoomId){const positions:Record<RoomId,[number,number]>={lobby:[-6,6],instruments:[-6,-2],rhythm:[6,-2],hall:[6,2.1]};const [x,z]=positions[room];this.camera.position.set(x,1.7,z);this.yaw=room==='hall'?Math.PI:0;this.pitch=-.06;this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');this.state.room=room;this.onRoom(room);this.clearInput();}
  clearInput(){this.keys.clear();this.joystick={x:0,y:0};this.drag=null;}
  setPaused(paused:boolean){this.paused=paused;this.clearInput();if(paused&&document.pointerLockElement)document.exitPointerLock();}
  bind(){
    window.addEventListener('keydown',e=>{if(this.overview||this.paused||/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}if(e.code==='KeyE'&&this.target)this.onInvestigate(this.target);});
    window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clearInput());
    const canvas=this.renderer.domElement;
    canvas.addEventListener('pointerdown',e=>{if(this.paused||this.overview)return;this.drag={x:e.clientX,y:e.clientY,distance:0,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!this.drag||this.paused)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.distance+=Math.abs(dx)+Math.abs(dy);this.drag.x=e.clientX;this.drag.y=e.clientY;this.yaw-=dx*.003*this.state.sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.003*this.state.sensitivity,-1.25,1.25);});
    canvas.addEventListener('pointerup',()=>{if(this.drag&&this.drag.distance<8&&this.target)this.onInvestigate(this.target);this.drag=null;});canvas.addEventListener('pointercancel',()=>this.clearInput());
  }
  animate=()=>{if(this.disposed)return;this.frame=requestAnimationFrame(this.animate);const dt=Math.min(this.clock.getDelta(),.05);this.time+=dt;
    if(this.overview){this.camera.position.set(26,26,31);this.camera.lookAt(0,.1,-.5);}
    else if(!this.paused){this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');let dx=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.joystick.x;let dz=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))+this.joystick.y;
      const length=Math.max(1,Math.hypot(dx,dz));dx=dx/length*this.state.speed*dt;dz=dz/length*this.state.speed*dt;const mx=Math.cos(this.yaw)*dx+Math.sin(this.yaw)*dz,mz=-Math.sin(this.yaw)*dx+Math.cos(this.yaw)*dz;
      const p=this.camera.position;if(canOccupy(p.x+mx,p.z,this.state))p.x+=mx;if(canOccupy(p.x,p.z+mz,this.state))p.z+=mz;
      const room:RoomId=p.z<0?(p.x<0?'instruments':'rhythm'):(p.x<0?'lobby':'hall');if(room!==this.state.room){this.state.room=room;this.onRoom(room);}
      let closest:RoomId|null=null;let dist=3.2;const direction=new THREE.Vector3();this.camera.getWorldDirection(direction);for(const t of this.targets){const delta=t.position.clone().sub(p);const d=delta.length();if(d<dist&&delta.normalize().dot(direction)>.45){closest=t.id;dist=d;}}if(closest!==this.target){this.target=closest;this.onTarget(closest);}
    }
    this.targets.forEach((t,i)=>{t.orb.position.y=1.85+Math.sin(this.time*1.5+i)*.1;t.orb.rotation.y=this.time*.35;});
    if(this.state.rhythm===2)this.animated.forEach((obj,i)=>{if(i<9)obj.position.y=.4+Math.sin(this.time*3+i)*.07;});
    this.renderer.render(this.scene,this.camera);
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});this.renderer.dispose();}
}
