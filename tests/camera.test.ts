import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Museum} from '../src/museum.ts';

function cameraRig(){
 const m=Object.create(Museum.prototype) as Museum;
 Object.assign(m,{camera:new THREE.PerspectiveCamera(),time:0,inspecting:false,inspectionPose:null,focusTween:null,keys:new Set(),joystick:{x:0,y:0},drag:null});
 m.camera.position.set(-6,1.7,-3);m.camera.rotation.set(-.1,.4,0,'YXZ');return m;
}
test('closing inspection interpolates back to the saved walking position and heading',()=>{
 const m=cameraRig(),position=m.camera.position.clone(),quaternion=m.camera.quaternion.clone();
 m.setInspecting(true);m.focus(new THREE.Vector3(-13,2.2,-4),new THREE.Vector3(-15,1.7,-7));m.time=.75;m.updateFocus();
 const inspected=m.camera.position.clone();m.setInspecting(false);
 assert.ok(m.camera.position.equals(inspected));m.time+=.375;m.updateFocus();
 assert.ok(m.camera.position.distanceTo(position)>1);assert.ok(m.camera.position.distanceTo(inspected)>1);
 m.keys.add('KeyW');m.time+=.375;m.updateFocus();
 assert.ok(m.camera.position.distanceTo(position)<1e-9);assert.ok(m.camera.quaternion.angleTo(quaternion)<1e-7);assert.equal(m.focusTween,null);assert.equal(m.keys.size,0);
 assert.ok(Math.abs(m.yaw-.4)<1e-9);assert.ok(Math.abs(m.pitch+.1)<1e-9);
});
test('reopening during a return still restores the original walking pose',()=>{
 const m=cameraRig(),position=m.camera.position.clone();m.setInspecting(true);m.focus(new THREE.Vector3(-13,2.2,-4),new THREE.Vector3(-15,1.7,-7));m.time=.75;m.updateFocus();
 m.setInspecting(false);m.time+=.25;m.updateFocus();m.setInspecting(true);m.focus(new THREE.Vector3(-8,2.2,-4),new THREE.Vector3(-8,1.7,-7));m.time+=.75;m.updateFocus();
 m.setInspecting(false);m.setPaused(true);m.time+=.75;m.updateFocus();assert.ok(m.camera.position.distanceTo(position)<1e-9);assert.equal(m.inspectionPose,null);
});
