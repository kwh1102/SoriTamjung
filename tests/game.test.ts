import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canOccupy,defaults,progress,sanitize,unlocked} from '../src/state.ts';
import {instruments,instrumentPuzzles,rhythmPuzzles,semachi} from '../src/data.ts';
import {readFileSync,existsSync} from 'node:fs';
test('corrupt and out-of-order saves cannot unlock later rooms',()=>{
  assert.deepEqual(sanitize(null),defaults);
  const s=sanitize({instrument:1,rhythm:2,room:'hall',completed:true,volume:NaN,speed:999});
  assert.equal(s.rhythm,0);assert.equal(s.room,'lobby');assert.equal(s.completed,false);assert.equal(s.volume,.65);assert.equal(s.speed,5);
});
test('sequential progress unlocks rhythm, hall and full restoration',()=>{
  const s={...defaults};assert.equal(unlocked(s,'rhythm'),false);assert.equal(unlocked(s,'hall'),false);
  s.instrument=3;assert.equal(unlocked(s,'rhythm'),true);assert.equal(unlocked(s,'hall'),false);
  s.rhythm=2;assert.equal(unlocked(s,'hall'),true);assert.equal(progress(s),83);
  s.completed=true;assert.equal(progress(s),100);assert.equal(sanitize(s).completed,true);
});
test('exterior, partitions, locked passages and plinths collide; doors stay passable',()=>{
  assert.equal(canOccupy(12,0,defaults),false);assert.equal(canOccupy(-4,0,defaults),false);
  assert.equal(canOccupy(-6,0,defaults),true);assert.equal(canOccupy(0,-4.5,defaults),false);
  assert.equal(canOccupy(-9,-6,defaults),false);assert.equal(canOccupy(0,-4.5,{instrument:3,rhythm:0}),true);
  assert.equal(canOccupy(6,0,{instrument:3,rhythm:0}),false);assert.equal(canOccupy(6,0,{instrument:3,rhythm:2}),true);
});
test('puzzle answers and credits map to actual recorded assets',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8'));
  const ids=new Set(manifest.items.map((a:{id:string})=>a.id));
  for(const p of instrumentPuzzles){assert.ok(ids.has(p.answer));assert.equal(p.hints.length,3);assert.ok(instruments.find(i=>i.id===p.answer)?.description);}
  assert.deepEqual(semachi,['deong','rest','rest','deong','rest','ttak','kung','ttak','rest']);
  assert.equal(rhythmPuzzles[0].blanks.length,1);assert.ok(rhythmPuzzles[1].blanks.length>1);
  for(const p of rhythmPuzzles)for(const i of p.blanks)assert.ok(i>=0&&i<9);
  for(const a of manifest.items){assert.ok(a.sourceUrl.startsWith('https://apis.gugak.go.kr/'));assert.ok(a.license.includes('제1유형'));assert.ok(existsSync(`public${a.file}`));}
});
test('real recordings are valid mono PCM, non-silent and within mobile budget',()=>{
  let total=0;for(const id of ['gayageum','daegeum','haegeum','deong','kung','ttak']){
    const b=readFileSync(`public/audio/${id}.wav`);total+=b.length;assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
    assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),44100);assert.equal(b.readUInt16LE(34),16);
    let peak=0;for(let i=44;i+1<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert.ok(peak>1000);assert.ok(b.length>44100);
  }assert.ok(total<1_000_000);
});
