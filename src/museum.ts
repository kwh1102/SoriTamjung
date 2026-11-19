import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {canOccupy,restoredInstruments,unlocked} from './state';
import type {Save} from './state';
import {concertPuzzles,instruments,instrumentPuzzles,rhythmPuzzles} from './data';
import type {InstrumentId,RoomId,Stroke} from './data';
import {entrance,exhibitLayout} from './museum-layout';
import {isPortraitView} from './view';

const colors={wood:0x593925,paper:0xc8c0ab,dark:0x202b29,gold:0xc2a16b,teal:0x73b6a2};
interface Exhibit {id:InstrumentId;group:THREE.Group;ghost:THREE.Group;base:THREE.Mesh;position:THREE.Vector3;facing:number;light:THREE.PointLight;reveal:number;}
export class Museum {
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(55,1,.08,80);renderer:THREE.WebGLRenderer;
 world=new THREE.Group();clock=new THREE.Clock();raycaster=new THREE.Raycaster();keys=new Set<string>();
 overview=true;paused=true;inspecting=false;yaw=0;pitch=0;joystick={x:0,y:0};target:RoomId|null=null;
 onTarget:(id:RoomId|null)=>void=()=>{};onRoom:(id:RoomId)=>void=()=>{};onInvestigate:(id:RoomId)=>void=()=>{};onExhibit:(id:InstrumentId)=>void=()=>{};onBeat:(index:number)=>void=()=>{};
 targets:{id:RoomId;position:THREE.Vector3;ring:THREE.Mesh}[]=[];exhibits:Exhibit[]=[];gates:{group:THREE.Group;room:RoomId}[]=[];
 stage=new THREE.Group();stageModels=new Map<InstrumentId,THREE.Group>();beatTiles:THREE.Mesh[]=[];beatLabels:THREE.Object3D[]=[];
 selected:InstrumentId[]=[];beatBoard:(Stroke|null)[]=[];beatPlayhead=-1;restorationKey='';time=0;frame=0;disposed=false;
 drag:{x:number;y:number;distance:number;id:number}|null=null;resizeObserver:ResizeObserver;
 materials=new Map<string,THREE.MeshStandardMaterial>();textures=new Map<string,THREE.CanvasTexture>();
 boxGeo=new RoundedBoxGeometry(1,1,1,2,.035);focusTween:{from:THREE.Vector3;to:THREE.Vector3;fromQ:THREE.Quaternion;toQ:THREE.Quaternion;start:number;returning?:boolean}|null=null;
 inspectionPose:{position:THREE.Vector3;quaternion:THREE.Quaternion}|null=null;
 environment:THREE.WebGLRenderTarget;
 constructor(public host:HTMLElement,public state:Save){
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','3D 국악박물관. 드래그로 시점 이동, 전시물 클릭으로 조사');host.append(this.renderer.domElement);
  this.scene.background=new THREE.Color(0x17221f);this.scene.fog=new THREE.Fog(0x26332e,15,43);this.scene.add(this.world);
  const pmrem=new THREE.PMREMGenerator(this.renderer),environmentScene=new RoomEnvironment();this.environment=pmrem.fromScene(environmentScene,.025);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.42;environmentScene.dispose();pmrem.dispose();
  this.scene.add(new THREE.HemisphereLight(0xd9e8e0,0x30251b,1.15));
  const sun=new THREE.DirectionalLight(0xffdfb4,2.3);sun.position.set(-5,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:15,bottom:-15,near:.5,far:35});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;this.scene.add(sun);
  this.build();this.updateRestoration();this.camera.position.set(-5.7,2.4,7.7);this.camera.lookAt(-5.8,1.8,-5);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();this.bind();this.animate();
 }
 texture(kind:string){
  if(this.textures.has(kind))return this.textures.get(kind)!;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;let seed=47;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle=kind==='wood'?'#a67c53':kind==='stone'?'#8d9389':kind==='bronze'?'#b7a77b':kind==='fabric'?'#535b51':'#c9c2ad';ctx.fillRect(0,0,512,512);
  const pixels=ctx.getImageData(0,0,512,512);for(let i=0;i<pixels.data.length;i+=4){const n=(random()-.5)*(kind==='wood'?13:17);for(let c=0;c<3;c++)pixels.data[i+c]+=n;}ctx.putImageData(pixels,0,0);
  if(kind==='wood'){for(let i=0;i<250;i++){const y=random()*512;ctx.strokeStyle=`rgba(40,21,8,${random()*.16})`;ctx.lineWidth=random()*2+.3;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(140,y+Math.sin(i)*8,330,y-Math.cos(i)*8,512,y);ctx.stroke();}}
  if(kind==='stone'){ctx.strokeStyle='#454e4940';ctx.lineWidth=2;for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(0,i*128);ctx.lineTo(512,i*128);ctx.stroke();for(let j=0;j<4;j++)ctx.strokeRect(j*128+(i%2)*64,i*128,128,128);}}
  if(kind==='fabric'){ctx.strokeStyle='#e7ddc20b';for(let i=0;i<512;i+=3){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}}
  if(kind==='bronze'){for(let i=0;i<50;i++){ctx.strokeStyle='#68582616';ctx.beginPath();ctx.arc(256,256,i*5,0,Math.PI*2);ctx.stroke();}}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());this.textures.set(kind,t);return t;
 }
 mat(color:number,kind='',roughness=.65,metalness=0){const key=[color,kind,roughness,metalness].join(':');if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,map:kind?this.texture(kind):null,roughness,metalness}));return this.materials.get(key)!;}
 mesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:number,kind=''){const m=this.mesh(parent,this.boxGeo,this.mat(color,kind),x,y,z);m.scale.set(w,h,d);return m;}
 cylinder(parent:THREE.Object3D,r1:number,r2:number,h:number,x:number,y:number,z:number,color:number,kind='',metalness=0){return this.mesh(parent,new THREE.CylinderGeometry(r1,r2,h,32),this.mat(color,kind,.45,metalness),x,y,z);}
 tube(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,color:number){const mesh=this.mesh(parent,new THREE.CylinderGeometry(r,r,a.distanceTo(b),6),this.mat(color));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return mesh;}
 label(parent:THREE.Object3D,text:string,x:number,y:number,z:number,width=2.2,height=.35,color='#e3d5b5',background='#1c2926'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.max(64,Math.round(768*height/width));const ctx=canvas.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,768,canvas.height);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 '+Math.floor(canvas.height*.42)+'px Malgun Gothic,sans-serif';ctx.fillText(text,384,canvas.height/2,720);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  const m=this.mesh(parent,new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:t}),x,y,z);m.castShadow=false;return m;
 }
 glow(parent:THREE.Object3D,w:number,h:number,x:number,y:number,z:number,color=0xffdf9d){const m=this.mesh(parent,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}),x,y,z);m.castShadow=false;return m;}
 contact(parent:THREE.Object3D,x:number,z:number,w:number,d:number){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!;const g=ctx.createRadialGradient(32,32,4,32,32,32);g.addColorStop(0,'#0009');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const m=this.mesh(parent,new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}),x,.025,z);m.rotation.x=-Math.PI/2;m.castShadow=false;}
 build(){const w=this.world;
  this.box(w,24,.18,18,0,-.12,0,0xc1bdb0,'stone');const floor=this.texture('stone');floor.repeat.set(6,4.5);
  this.box(w,6,.18,9,-15,-.12,-4.5,0xc1bdb0,'stone');
  this.box(w,30,.14,.3,-3,.12,-8.8,0x3a3a30);this.box(w,30,4.6,.25,-3,2.3,-9,0xb4af9b,'plaster');this.box(w,24,4.6,.25,0,2.3,9,0x7d8579,'plaster');
  this.box(w,.25,4.6,9,-18,2.3,-4.5,0x667062,'plaster');this.box(w,.25,4.6,9,-12,2.3,4.5,0x667062,'plaster');this.box(w,.25,4.6,18,12,2.3,0,0x657062,'plaster');
  this.box(w,24,.13,18,0,4.7,0,0x252e28,'wood');
  this.box(w,6,.13,9,-15,4.7,-4.5,0x252e28,'wood');
  for(const x of [-16.4,-13.6])this.box(w,.13,.28,9,x,4.45,-4.5,0x654c35,'wood');
  for(const z of [-7.3,-1.4]){this.box(w,6,.1,.14,-15,4.15,z,0x121c19);for(const x of [-16,-13]){this.cylinder(w,.1,.12,.2,x,4,z,0x1d2724);this.glow(w,.12,.08,x,3.9,z);}}
  for(const x of [-10.8,-8,-5.2,-2.4,.4,3.2,6,8.8,11.6]){this.box(w,.13,.28,18,x,4.45,0,0x654c35,'wood');}
  for(const z of [-7.3,-1.4,2.5,7.3]){this.box(w,23.6,.1,.14,0,4.15,z,0x121c19);for(const x of [-9,-6,-3,3,6,9]){const lamp=this.cylinder(w,.1,.12,.2,x,4,z,0x1d2724);lamp.rotation.x=.25;this.glow(w,.12,.08,x,3.9,z);}}
  // Wall ends meet the same outer jamb edge at every entrance.
  this.partition(-18,12,[-6,6]);this.partition(-9,9,[-4.5,4.5],true);
  this.portal(-6,0);this.portal(6,0);this.portal(0,-4.5,Math.PI/2);this.portal(0,4.5,Math.PI/2);
  for(const [x,z,rotation,room] of [[0,-4.5,Math.PI/2,'rhythm'],[0,4.5,Math.PI/2,'hall'],[6,0,0,'hall']] as const){const gate=new THREE.Group();gate.position.set(x,0,z);gate.rotation.y=rotation;w.add(gate);for(let i=-4;i<=4;i++)this.box(gate,.045,2.8,.04,i*.29,1.4,0,0x9e8b61);this.gates.push({group:gate,room});}
  this.label(w,'01  /  악 기 갤 러 리',-9,3.6,-8.82,6,.5);this.label(w,'02  /  장 단 공 방',6,3.6,-8.82,6,.5);
  // Lit, fabric-lined vitrines, with independently restorable objects.
  instruments.filter(i=>i.id!=='janggu').forEach((instrument,index)=>{
   const {x:worldX,z:worldZ,facing,width:caseWidth,depth:caseDepth}=exhibitLayout[index],wide=index<4;
   const w=new THREE.Group();w.position.set(worldX,0,worldZ);w.rotation.y=facing;this.world.add(w);const x=0,z=0;
   this.contact(w,x,z,caseWidth+1,caseDepth+1);this.box(w,caseWidth,1.03,caseDepth,x,.52,z,0x303c37,'wood');this.box(w,caseWidth+.06,.07,caseDepth+.06,x,1.06,z,0x817254,'wood');
   this.box(w,caseWidth-.12,.04,caseDepth-.12,x,1.12,z,0x535d4f,'fabric');
   if(wide){this.box(w,caseWidth,2.07,.08,x,2.1,z-.69,0x25332d,'fabric');this.box(w,caseWidth,.07,1.45,x,3.18,z,0x2c3830);}
   const glass=this.mesh(w,new THREE.BoxGeometry(caseWidth-.06,1.95,.016),new THREE.MeshPhysicalMaterial({color:0xb6d8c9,transparent:true,opacity:.075,roughness:.12,metalness:.15,depthWrite:false}),x,2.12,z+caseDepth*.5);glass.castShadow=false;
   this.glow(w,caseWidth-.2,.025,x,3.08,z+caseDepth*.45);
   const light=new THREE.PointLight(0xffd6a1,5.5,3.8,2);light.position.set(x,2.9,z+.2);w.add(light);
   const group=new THREE.Group();group.position.set(x,1.12,z);w.add(group);const horizontal=['gayageum','geomungo','ajaeng'].includes(instrument.id);this.instrument(group,instrument.id,horizontal?(wide?.56:.40):instrument.id==='jing'?.70:.73);
   const ghost=new THREE.Group();ghost.position.copy(group.position);w.add(ghost);const disc=this.mesh(ghost,new THREE.TorusGeometry(.38,.012,8,48),new THREE.MeshBasicMaterial({color:0xbc9d68,transparent:true,opacity:.55}));disc.rotation.x=-Math.PI/2;disc.position.y=.05;
   const marker=this.label(ghost,'소 리 복 원 대 기',0,.37,caseDepth*.37,1.1,.18,'#bba77d','#25322d');marker.userData.missing=true;
   const plaque=this.label(w,`${String(index+1).padStart(2,'0')}   ${instrument.name}`,x,.77,z+caseDepth*.5+.02,caseWidth-.2,.26);plaque.userData.instrument=instrument.id;
   this.exhibits.push({id:instrument.id,group,ghost,base:plaque,position:new THREE.Vector3(worldX,1.8,worldZ),facing,light,reveal:1});
  });
  // The rhythm console is a physical ring of illuminated sound cells.
  const consoleGroup=new THREE.Group();consoleGroup.position.set(4,0,-5.8);w.add(consoleGroup);this.cylinder(consoleGroup,1.38,1.2,.9,0,.48,0,0x2b3a34,'wood');this.cylinder(consoleGroup,1.4,1.4,.09,0,.98,0,0xa8956f,'wood');
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tile=this.cylinder(consoleGroup,.19,.19,.09,Math.sin(a)*1.05,1.07,Math.cos(a)*1.05,0x4c6254);tile.material=(tile.material as THREE.MeshStandardMaterial).clone();tile.userData.beat=i;this.beatTiles.push(tile);}
  this.box(w,3.7,.9,2.6,8,.5,-6,0x293c32,'wood');this.janggu(w,8,1.55,-6,1.1);this.label(w,'장구  /  덩 · 쿵 · 덕',8,.7,-4.65,3,.3);
  this.label(w,'소리를 놓으면 공간이 울립니다',6,2.7,-8.82,5,.36);
  const rhythmLight=new THREE.PointLight(0xffd29b,17,9);rhythmLight.position.set(6,3.6,-5);w.add(rhythmLight);
  // Curved reception desk and circular archive sculpture.
  this.cylinder(w,1.28,1.2,1.12,-9,.62,6,0x405447,'wood');this.cylinder(w,1.31,1.31,.1,-9,1.24,6,0xc4bba1,'stone');
  const ring=this.mesh(w,new THREE.TorusGeometry(.7,.038,12,80),this.mat(0xbda276,'bronze',.3,.8),-9,2.2,6);ring.rotation.y=.5;
  this.label(w,'소 리 보 관 소',-9,.87,7.25,1.9,.27);this.label(w,'소리탐정',-6,3.3,8.8,5,.8).rotation.y=Math.PI;
  this.plant(-10.6,2.4);this.plant(-1.8,7.8);this.plant(10.7,1.5);
  this.scene.add(new THREE.PointLight(0xf8d4a0,10,11,2).translateX(-7).translateY(3).translateZ(5));
  this.box(w,7,.34,3.2,7,.2,6.6,0x61472d,'wood');this.box(w,7.1,.06,3.25,7,.4,6.6,0x8d6b42,'wood');
  const stageBack=this.box(w,9,3.5,.12,7,2,8.6,0x253e33,'fabric');stageBack.receiveShadow=true;
  for(let i=0;i<29;i++)this.box(w,.035,3.5,.1,2.8+i*.3,2,8.48,0x9a8053);
  this.label(w,'03   소 리 의 무 대',7,3.3,8.35,5,.4).rotation.y=Math.PI;
  this.stage.position.set(7,.48,6.6);w.add(this.stage);
  instruments.forEach((instrument,index)=>{const g=new THREE.Group();g.position.set((index%3-1)*2,0,Math.floor(index/3)*.6-.5);if(instrument.id==='jing'||instrument.id==='kkwaenggwari')g.rotation.y=Math.PI;this.stage.add(g);this.instrument(g,instrument.id,.47);g.visible=false;this.stageModels.set(instrument.id,g);});
  const spot=new THREE.SpotLight(0xffd298,65,12,Math.PI/3,.7,1.5);spot.position.set(7,4.2,4);spot.target.position.set(7,0,7);this.scene.add(spot,spot.target);
  for(const z of [2.1,3.4])for(const x of [3.8,5.4,8.6,10.2]){this.cylinder(w,.34,.37,.43,x,.28,z,0x5d6352,'fabric');}
  // Paper wall lights and curved window niches add layered depth.
  for(const z of [-5,4.5])for(const side of [-1,1]){const x=side===-1&&z<0?-17.82:side*11.82;const panel=this.glow(w,2.3,2.1,x,2.4,z,0xd5c499);panel.rotation.y=side===-1?Math.PI/2:-Math.PI/2;const l=new THREE.PointLight(0xf5d7a2,8,6);l.position.set(x-side*.62,2.5,z);w.add(l);}
  const points:{id:RoomId;x:number;z:number}[]=[{id:'lobby',x:-6,z:3},{id:'instruments',x:-6,z:-4.5},{id:'rhythm',x:6,z:-3.4},{id:'hall',x:6.6,z:4}];
  for(const p of points){const ring=this.mesh(w,new THREE.RingGeometry(.54,.57,64),new THREE.MeshBasicMaterial({color:0xbdac7c,transparent:true,opacity:.7,side:THREE.DoubleSide}),p.x,.018,p.z);ring.rotation.x=-Math.PI/2;ring.castShadow=false;this.targets.push({id:p.id,position:new THREE.Vector3(p.x,1.65,p.z),ring});}
 }
 partition(start:number,end:number,doors:number[],vertical=false){
  const {radius,postWidth,wallThickness,wallHeight}=entrance,outer=radius+postWidth;
  let edge=start;
  for(const next of [...doors.map(center=>({left:center-outer,right:center+outer})),{left:end,right:end}]){
   const length=next.left-edge,center=(edge+next.left)/2;
   this.box(this.world,vertical?wallThickness:length,wallHeight,vertical?length:wallThickness,vertical?0:center,wallHeight/2,vertical?center:0,0x7c8576,'plaster');edge=next.right;
  }
 }
 portal(x:number,z:number,rotation=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;this.world.add(g);
  const {radius,postWidth,springHeight,depth,wallThickness,wallHeight}=entrance,outer=radius+postWidth;
  for(const side of [-1,1])this.box(g,postWidth,springHeight,depth,side*(radius+postWidth/2),springHeight/2,0,0x714d30,'wood');
  // Concentric arcs join the columns at their exact top and side edges.
  const arch=new THREE.Shape();arch.moveTo(-outer,springHeight);arch.absarc(0,springHeight,outer,Math.PI,0,true);arch.lineTo(radius,springHeight);arch.absarc(0,springHeight,radius,0,Math.PI,false);arch.closePath();
  const trim=this.mesh(g,new THREE.ExtrudeGeometry(arch,{depth,bevelEnabled:false,curveSegments:32}),this.mat(0x714d30,'wood'));trim.position.z=-depth/2;
  const infill=new THREE.Shape();infill.moveTo(-outer,springHeight);infill.lineTo(-outer,wallHeight);infill.lineTo(outer,wallHeight);infill.lineTo(outer,springHeight);infill.absarc(0,springHeight,outer,0,Math.PI,false);infill.closePath();
  const wall=this.mesh(g,new THREE.ExtrudeGeometry(infill,{depth:wallThickness,bevelEnabled:false,curveSegments:32}),this.mat(0x7c8576,'plaster'));wall.position.z=-wallThickness/2;
 }
 soundboard(parent:THREE.Object3D,length:number,width:number,color:number){const s=new THREE.Shape();s.moveTo(-length/2,-width*.35);s.quadraticCurveTo(0,-width*.65,length/2,-width*.34);s.quadraticCurveTo(length*.56,0,length/2,width*.34);s.quadraticCurveTo(0,width*.65,-length/2,width*.35);s.quadraticCurveTo(-length*.54,0,-length/2,-width*.35);const m=this.mesh(parent,new THREE.ExtrudeGeometry(s,{depth:.19,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.055,bevelThickness:.045}),this.mat(color,'wood',.38));m.rotation.x=-Math.PI/2;m.position.y=.2;}
 instrument(parent:THREE.Object3D,id:InstrumentId,scale=1){const g=new THREE.Group();g.scale.setScalar(scale);parent.add(g);
  if(id==='gayageum'||id==='geomungo'||id==='ajaeng'){
   const geomungo=id==='geomungo',ajaeng=id==='ajaeng',count=geomungo?6:ajaeng?7:12;this.soundboard(g,3.6,.9,geomungo?0x7c5031:0xbd8f54);
   for(let i=0;i<count;i++){const z=-.36+i*.72/(count-1);this.tube(g,new THREE.Vector3(-1.65,.46,z),new THREE.Vector3(1.65,.46,z),ajaeng?.013:.007,0xe4d7b3);if(!geomungo){const bridge=this.box(g,.085,.15,.07,-.8+i*.11,.4,z,0x533924);bridge.rotation.z=.2;}}
   if(geomungo){for(let i=0;i<16;i++)this.box(g,.055,.15-i*.004,.62,-1.2+i*.15,.4,0,0x4d3526,'wood');this.tube(g,new THREE.Vector3(.5,.5,.65),new THREE.Vector3(1.4,.5,.6),.022,0xb99960);}
   if(ajaeng)this.tube(g,new THREE.Vector3(-.8,.6,-.6),new THREE.Vector3(.8,.6,.7),.023,0xab7644);
   for(const x of [-1.3,1.3])this.box(g,.18,.22,.55,x,.12,0,0x392b22,'wood');
  }else if(id==='piri'){
   // Keep the reed, bore and finger holes in one coordinate frame before tilting.
   const cane=new THREE.Group();cane.position.y=.12;cane.rotation.z=-.12;g.add(cane);
   const radius=.035,length=1.4;this.cylinder(cane,radius,radius,length,0,length/2,0,0xc49a60,'wood');
   for(let i=0;i<7;i++)this.mesh(cane,new THREE.CircleGeometry(.012,24),this.mat(0x211b12),0,.18+i*.16,radius+.0003);
   const thumb=this.mesh(cane,new THREE.CircleGeometry(.012,24),this.mat(0x211b12),0,1.26,-radius-.0003);thumb.rotation.y=Math.PI;
   const bore=this.mesh(cane,new THREE.CircleGeometry(.026,24),this.mat(0x211b12),0,-.001,0);bore.rotation.x=Math.PI/2;
   for(const y of [.045,1.365])this.cylinder(cane,.036,.036,.008,0,y,0,0x94713e,'wood');
   const reed=new THREE.Shape();reed.moveTo(-.025,length-.02);reed.lineTo(.025,length-.02);reed.lineTo(.033,length+.33);reed.quadraticCurveTo(0,length+.35,-.033,length+.33);reed.closePath();
   const reedGeometry=new THREE.ExtrudeGeometry(reed,{depth:.003,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:2,steps:1});
   for(const z of [-.006,.003])this.mesh(cane,reedGeometry,this.mat(0xd6b579,'wood',.75),0,0,z);
   this.cylinder(g,.27,.29,.05,0,.025,-.11,0x292c24);this.tube(g,new THREE.Vector3(0,.05,-.11),new THREE.Vector3(0,.95,-.11),.012,0x4d493a);
   this.tube(g,new THREE.Vector3(0,.24,-.11),new THREE.Vector3(.015,.24,-.035),.009,0x4d493a);
  }else if(id==='daegeum'){
   const length=2.4;const body=this.cylinder(g,.07,.085,length,0,length/2+.1,0,0xb8a46a,'wood');body.rotation.z=-.22;
   for(let i=0;i<6;i++){const y=.3+i*.22;const hole=this.mesh(g,new THREE.SphereGeometry(.028,10,8),this.mat(0x1b241c),Math.sin(.22)*(y-.1-length/2),y,.071);hole.scale.z=.35;}
   for(const y of [.15,.75,1.4,2.2].filter(v=>v<length))this.cylinder(g,.082,.082,.025,Math.sin(.22)*(y-.1-length/2),y,0,0x59492e);
   this.cylinder(g,.3,.32,.05,0,.025,-.13,0x292c24);this.tube(g,new THREE.Vector3(0,.05,-.13),new THREE.Vector3(0,length*.7,-.13),.018,0x4d493a);this.tube(g,new THREE.Vector3(-.12,length*.65,-.13),new THREE.Vector3(.16,length*.65,-.13),.018,0x4d493a);
  }else if(id==='haegeum'){
   const body=this.cylinder(g,.28,.27,.45,0,.35,0,0xa16d41,'wood');body.rotation.x=Math.PI/2;
   const face=this.cylinder(g,.255,.255,.025,0,.35,.24,0xd0ad75,'wood');face.rotation.x=Math.PI/2;this.cylinder(g,.045,.06,2,-.12,1.15,0,0x80502e,'wood');
   for(const y of [1.9,2.15]){const peg=this.cylinder(g,.05,.035,.55,.08,y,0,0x35291e);peg.rotation.z=Math.PI/2;}
   for(const x of [0,.055])this.tube(g,new THREE.Vector3(x,.25,.27),new THREE.Vector3(x,2.12,.04),.006,0xeee0be);
   const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.5,.7,.3),new THREE.Vector3(.4,.85,.4),new THREE.Vector3(1.2,.8,.3));this.mesh(g,new THREE.TubeGeometry(curve,20,.017,6,false),this.mat(0xaa7e48));this.tube(g,new THREE.Vector3(-.5,.7,.29),new THREE.Vector3(1.2,.8,.29),.008,0xe9d8b5);
  }else if(id==='janggu')this.janggu(g,0,.6,0,1);
  else{
   const r=id==='jing'?.75:.38;const profile=[new THREE.Vector2(0,0),new THREE.Vector2(r*.18,.035),new THREE.Vector2(r*.65,.015),new THREE.Vector2(r*.92,.06),new THREE.Vector2(r,.14),new THREE.Vector2(r,.22)];
   // Face the case front (+Z); the open metal shell must also render from behind.
   const metal=this.mat(0xd8b36b,'bronze',.31,.76).clone();metal.side=THREE.DoubleSide;
   const gong=this.mesh(g,new THREE.LatheGeometry(profile,64),metal,0,r+.18,0);gong.rotation.x=-Math.PI/2;
   for(const x of [-r-.17,r+.17])this.cylinder(g,.035,.045,r*2+.4,x,r+.2,-.1,0x523d2b,'wood');this.tube(g,new THREE.Vector3(-r-.17,r*2+.4,-.1),new THREE.Vector3(r+.17,r*2+.4,-.1),.035,0x765433);
   this.tube(g,new THREE.Vector3(r*.6,.2,.2),new THREE.Vector3(r*.9,.9,.2),.025,0x835f3b);
  }return g;
 }
 janggu(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);
  const profile=[new THREE.Vector2(.5,-.76),new THREE.Vector2(.43,-.6),new THREE.Vector2(.27,-.25),new THREE.Vector2(.2,0),new THREE.Vector2(.27,.25),new THREE.Vector2(.43,.6),new THREE.Vector2(.5,.76)];const shell=this.mesh(g,new THREE.LatheGeometry(profile,48),this.mat(0x9f4d2e,'wood',.3));shell.rotation.z=Math.PI/2;
  for(const side of [-1,1]){const head=this.cylinder(g,.55,.55,.035,side*.79,0,0,0xe6d4ad,'fabric');head.rotation.z=Math.PI/2;const rim=this.mesh(g,new THREE.TorusGeometry(.55,.027,8,48),this.mat(0xbfa276));rim.rotation.y=Math.PI/2;rim.position.x=side*.8;}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;this.tube(g,new THREE.Vector3(-.8,Math.cos(a)*.52,Math.sin(a)*.52),new THREE.Vector3(.8,Math.cos(a+.25)*.52,Math.sin(a+.25)*.52),.008,0xe1cba0);}
  for(const side of [-1,1])this.box(g,.2,.25,.5,side*.5,-.58,0,0x4a3525,'wood');return g;
 }
 plant(x:number,z:number){this.cylinder(this.world,.35,.26,.64,x,.34,z,0xbab19a,'stone');for(let i=0;i<9;i++){const a=i*2.4;const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,.6,z),new THREE.Vector3(x+Math.sin(a)*.45,1.5,z+Math.cos(a)*.45),new THREE.Vector3(x+Math.sin(a)*.65,1.25,z+Math.cos(a)*.65));const leaf=this.mesh(this.world,new THREE.TubeGeometry(curve,10,.045,4),this.mat(i%2?0x536c45:0x7f8e5a));leaf.castShadow=false;}}
 updateRestoration(){const key=`${this.state.instrument}:${this.state.rhythm}:${this.state.concert}`;if(key===this.restorationKey)return;const initial=this.restorationKey==='';this.restorationKey=key;const restored=restoredInstruments(this.state);
  for(const e of this.exhibits){const visible=restored.includes(e.id);if(visible&&!e.group.visible&&!initial)e.reveal=0;e.group.visible=visible;e.ghost.visible=!visible;e.light.intensity=visible?6:2.4;}
  for(const gate of this.gates)gate.group.visible=!unlocked(this.state,gate.room);
  for(const t of this.targets)(t.ring.material as THREE.MeshBasicMaterial).color.setHex(unlocked(this.state,t.id)?0xaac4a5:0x816348);
  this.setStage(this.state.concert?concertPuzzles[Math.min(this.state.concert-1,concertPuzzles.length-1)].instruments:[]);
 }
 setStage(band:InstrumentId[]){let index=0;for(const [id,g] of this.stageModels){g.visible=band.includes(id);if(g.visible){g.position.set((index-(band.length-1)/2)*1.9,0,0);index++;}}}
 select(ids:InstrumentId[]){this.selected=ids;}
 setBoard(board:(Stroke|null)[]){this.beatBoard=board;this.beatTiles.forEach((tile,i)=>{tile.visible=i<board.length;const angle=i/board.length*Math.PI*2;tile.position.set(Math.sin(angle)*1.05,1.07,Math.cos(angle)*1.05);});}
 focusExhibit(id:InstrumentId){const e=this.exhibits.find(e=>e.id===id);if(!e)return;const p=e.position;const position=new THREE.Vector3(p.x+Math.sin(e.facing)*3,2.2,p.z+Math.cos(e.facing)*3);this.focus(position,p.clone().add(new THREE.Vector3(0,-.1,0)));}
 focusRoom(room:RoomId){if(room==='instruments'){this.focus(new THREE.Vector3(-6,2.2,-2),new THREE.Vector3(-10,1.6,-6));}else if(room==='rhythm'){this.focus(new THREE.Vector3(5,3,-2),new THREE.Vector3(4.8,1,-5.8));}else if(room==='hall'){this.focus(new THREE.Vector3(7,2.7,1.15),new THREE.Vector3(7,1.1,6.6));}}
 focus(position:THREE.Vector3,look:THREE.Vector3){const c=this.camera.clone();c.position.copy(position);c.lookAt(look);this.focusTween={from:this.camera.position.clone(),to:position,fromQ:this.camera.quaternion.clone(),toQ:c.quaternion.clone(),start:this.time};}
 setInspecting(value:boolean){
  // Retain the original walking pose if inspection is reopened during the return.
  if(value&&!this.inspecting&&!this.inspectionPose)this.inspectionPose={position:this.camera.position.clone(),quaternion:this.camera.quaternion.clone()};
  if(!value&&this.inspecting&&this.inspectionPose){const pose=this.inspectionPose;this.focusTween={from:this.camera.position.clone(),to:pose.position.clone(),fromQ:this.camera.quaternion.clone(),toQ:pose.quaternion.clone(),start:this.time,returning:true};}
  this.inspecting=value;this.setPaused(value);
 }
 updateFocus(){if(this.focusTween){const f=this.focusTween,t=Math.min(1,(this.time-f.start)/.75),smooth=t*t*(3-2*t);this.camera.position.lerpVectors(f.from,f.to,smooth);this.camera.quaternion.slerpQuaternions(f.fromQ,f.toQ,smooth);if(t===1){this.focusTween=null;const euler=new THREE.Euler().setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=euler.y;this.pitch=euler.x;if(f.returning){this.inspectionPose=null;this.clearInput();}}}}
 updateFieldOfView(){this.camera.fov=isPortraitView()?this.state.portraitFov:this.state.fov;this.camera.updateProjectionMatrix();}
 resize(){const {width,height}=this.host.getBoundingClientRect();if(!width||!height)return;this.camera.aspect=width/height;this.updateFieldOfView();this.renderer.setSize(width,height,false);}
 enter(room:RoomId='lobby'){this.overview=false;this.inspecting=false;this.paused=false;this.goTo(room);}
 goTo(room:RoomId){const positions:Record<RoomId,[number,number]>={lobby:[-6,5.9],instruments:[-6,-2.5],rhythm:[6,-2.4],hall:[6,2.3]};const [x,z]=positions[room];this.camera.position.set(x,1.7,z);this.yaw=room==='hall'?Math.PI:0;this.pitch=-.03;this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');this.focusTween=null;this.inspectionPose=null;this.state.room=room;this.target=null;this.onRoom(room);this.clearInput();}
 clearInput(){this.keys.clear();this.joystick={x:0,y:0};this.drag=null;}
 setPaused(value:boolean){this.paused=value;this.clearInput();}
 bind(){window.addEventListener('keydown',e=>{if(this.overview||this.paused||/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}if(e.code==='KeyE'&&this.target)this.onInvestigate(this.target);});window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clearInput());
  const canvas=this.renderer.domElement;canvas.addEventListener('pointerdown',e=>{if(this.overview||this.paused&&!this.inspecting)return;this.drag={x:e.clientX,y:e.clientY,distance:0,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.distance+=Math.abs(dx)+Math.abs(dy);this.drag.x=e.clientX;this.drag.y=e.clientY;if(!this.inspecting){this.yaw-=dx*.003*this.state.sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.003*this.state.sensitivity,-1.1,1.1);}});
  canvas.addEventListener('pointerup',e=>{if(this.drag&&this.drag.distance<8){const rect=canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.camera);
    if(this.state.room==='rhythm'&&this.inspecting){const hit=this.raycaster.intersectObjects(this.beatTiles)[0];if(hit){this.onBeat(Number(hit.object.userData.beat));this.drag=null;return;}}
    let selected:Exhibit|undefined;let distance=Infinity;for(const exhibit of this.exhibits){const hit=this.raycaster.ray.distanceToPoint(exhibit.position);const along=this.raycaster.ray.direction.dot(exhibit.position.clone().sub(this.camera.position));if(along>0&&along<7&&hit<1&&hit<distance){distance=hit;selected=exhibit;}}
    if(selected&&this.state.room==='instruments')this.onExhibit(selected.id);else if(!this.inspecting&&this.target)this.onInvestigate(this.target);
   }this.drag=null;});canvas.addEventListener('pointercancel',()=>this.clearInput());
 }
 animate=()=>{if(this.disposed)return;this.frame=requestAnimationFrame(this.animate);const dt=Math.min(this.clock.getDelta(),.05);this.time+=dt;
  this.updateFocus();
  if(!this.overview&&!this.paused&&!this.focusTween){this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');let dx=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.joystick.x,dz=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))+this.joystick.y;const length=Math.max(1,Math.hypot(dx,dz));dx=dx/length*this.state.speed*dt;dz=dz/length*this.state.speed*dt;const mx=Math.cos(this.yaw)*dx+Math.sin(this.yaw)*dz,mz=-Math.sin(this.yaw)*dx+Math.cos(this.yaw)*dz,p=this.camera.position;if(canOccupy(p.x+mx,p.z,this.state))p.x+=mx;if(canOccupy(p.x,p.z+mz,this.state))p.z+=mz;
   const room:RoomId=p.z<0?(p.x<0?'instruments':'rhythm'):(p.x<0?'lobby':'hall');if(room!==this.state.room){this.state.room=room;this.onRoom(room);}let closest:RoomId|null=null,dist=3.3;const direction=new THREE.Vector3();this.camera.getWorldDirection(direction);for(const target of this.targets){if(!unlocked(this.state,target.id))continue;const delta=target.position.clone().sub(p),d=delta.length();if(d<dist&&delta.normalize().dot(direction)>.35){closest=target.id;dist=d;}}if(closest!==this.target){this.target=closest;this.onTarget(closest);}
  }
  for(const exhibit of this.exhibits){if(exhibit.group.visible&&exhibit.reveal<1){exhibit.reveal=Math.min(1,exhibit.reveal+dt*1.1);const base=exhibit.position.y-.68;exhibit.group.position.y=base-.35*(1-exhibit.reveal);exhibit.group.scale.setScalar(.6+.4*exhibit.reveal);}const selected=this.selected.includes(exhibit.id);exhibit.ghost.scale.setScalar(selected?1.05+Math.sin(this.time*3)*.04:1);exhibit.light.color.setHex(selected?0xbce5d4:0xffd6a1);}
  this.beatTiles.forEach((tile,i)=>{const m=tile.material as THREE.MeshStandardMaterial,s=this.beatBoard[i],active=i===this.beatPlayhead;const color=s==='deong'?0xbe9c65:s==='kung'?0x70a491:s==='ttak'?0xc58368:s==='rest'?0x50615a:0x333d36;m.color.setHex(active?0xe9d6a6:color);m.emissive.setHex(active?0xa18145:0x000000);m.emissiveIntensity=active?.8:0;tile.scale.y=active?1.6:1;});
  this.renderer.render(this.scene,this.camera);
 };
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if('map' in m&&m.map)textures.add(m.map as THREE.Texture);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.environment.dispose();this.renderer.dispose();}
}
