import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SoundEngine} from '../src/audio.ts';
import {semachi} from '../src/data.ts';
function harness(){
  const engine=new SoundEngine();const sources:{startTime:number;stops:number[];disconnected:boolean}[]=[];
  const gain={setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}};
  const context={currentTime:10,createGain:()=>({gain,connect(){},disconnect(){}}),createBufferSource:()=>{const record={startTime:-1,stops:[] as number[],disconnected:false};sources.push(record);return {buffer:null,playbackRate:{value:1},connect(){},disconnect(){record.disconnected=true;},start(time:number){record.startTime=time;},stop(time?:number){record.stops.push(time??-1);}};}};
  engine.context=context as unknown as AudioContext;engine.master=context.createGain() as unknown as GainNode;
  for(const id of ['gayageum','daegeum','haegeum','deong','kung','ttak'])engine.buffers.set(id,{duration:2.4} as AudioBuffer);
  engine.unlock=async()=>{};engine.ready=true;return {engine,sources,context};
}
test('rhythm uses absolute AudioContext times across all four loop boundaries',async()=>{
  const {engine,sources,context}=harness();await engine.rhythm(semachi,true);
  assert.equal(sources.length,20);
  const positions=[0,3,5,6,7];for(let cycle=0;cycle<4;cycle++)for(let i=0;i<5;i++)assert.ok(Math.abs(sources[cycle*5+i].startTime-(10.08+(cycle*9+positions[i])*.34))<1e-9);
  context.currentTime=10.08+9*.34+.01;assert.equal(engine.getPlayhead(),9);
  context.currentTime=23;assert.equal(engine.getPlayhead(),-1);
});
test('new playback cancels and disconnects previous scheduled sources',async()=>{
  const {engine,sources}=harness();await engine.rhythm(semachi,true);const old=sources.slice();await engine.solo('gayageum');
  assert.ok(old.every(s=>s.stops.includes(-1)&&s.disconnected));assert.equal(engine.nodes.size,1);
  engine.stop();engine.stop();assert.equal(engine.nodes.size,0);assert.equal(engine.current,null);
});
test('closing while audio activation is pending prevents delayed sound',async()=>{
  const {engine,sources}=harness();let resolve!:()=>void;engine.unlock=()=>new Promise<void>(r=>{resolve=r;});
  const pending=engine.rhythm(semachi);engine.stop();resolve();await pending;assert.equal(sources.length,0);
});
test('incomplete ensemble schedules no notes for the missing instrument',async()=>{
  const {engine,sources}=harness();await engine.ensemble('daegeum');assert.equal(sources.length,16);
  await engine.ensemble();assert.equal(engine.nodes.size,24);assert.equal(sources.length,40);
});
