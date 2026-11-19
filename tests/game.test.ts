import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canOccupy,defaults,matchesConcert,progress,recordPuzzleCompletion,restoredInstruments,rhythmErrors,rotatePattern,sameSelection,sanitize,unlocked} from '../src/state.ts';
import {concertPuzzles,instruments,instrumentPuzzles,rhythmPuzzles,semachi} from '../src/data.ts';
import {readFileSync,existsSync} from 'node:fs';

test('corrupt saves and out-of-order progress cannot open later rooms',()=>{
 assert.deepEqual(sanitize(null),defaults);
 const s=sanitize({version:2,instrument:1,rhythm:4,concert:3,room:'hall',completed:true,volume:NaN,speed:999});
 assert.equal(s.rhythm,0);assert.equal(s.concert,0);assert.equal(s.room,'lobby');assert.equal(s.completed,false);assert.equal(s.volume,.65);assert.equal(s.speed,5);
});
test('legacy saves preserve the first three matching restorations and settings',()=>{
 const s=sanitize({version:1,instrument:3,rhythm:2,room:'hall',completed:true,volume:.4,started:true});
 assert.equal(s.version,2);assert.equal(s.instrument,3);assert.equal(s.rhythm,0);assert.equal(s.concert,0);assert.equal(s.completed,false);assert.equal(s.volume,.4);assert.equal(s.started,true);assert.equal(s.room,'lobby');
 assert.deepEqual(restoredInstruments(s),['gayageum','daegeum','haegeum']);
});
test('all 13 restorations advance sequentially and open each physical gate',()=>{
 const s={...defaults};assert.equal(unlocked(s,'rhythm'),false);assert.equal(unlocked(s,'hall'),false);
 for(let i=0;i<instrumentPuzzles.length;i++){recordPuzzleCompletion(s,'instrument',i);assert.equal(s.instrument,i+1);}
 assert.equal(unlocked(s,'rhythm'),true);assert.equal(unlocked(s,'hall'),false);assert.equal(restoredInstruments(s).length,8);
 for(let i=0;i<rhythmPuzzles.length;i++)recordPuzzleCompletion(s,'rhythm',i);
 assert.equal(unlocked(s,'hall'),true);assert.equal(progress(s),77);
 for(let i=0;i<concertPuzzles.length;i++)recordPuzzleCompletion(s,'concert',i);
 s.completed=true;assert.equal(progress(s),100);assert.deepEqual(sanitize(s),s);
});
test('replays retain all restored exhibits, progress and preferences',()=>{
 const s={...defaults,instrument:6,rhythm:4,concert:3,completed:true,volume:.4,speed:4};const before={...s};
 for(let round=0;round<4;round++){for(let i=0;i<6;i++)recordPuzzleCompletion(s,'instrument',i);for(let i=0;i<4;i++)recordPuzzleCompletion(s,'rhythm',i);for(let i=0;i<3;i++)recordPuzzleCompletion(s,'concert',i);}
 assert.deepEqual(s,before);assert.equal(progress(s),100);assert.deepEqual(sanitize(s),s);
});
test('retries, invalid indexes and a jump to a future puzzle never skip progression',()=>{
 const s={...defaults};for(const i of [-1,1,5,NaN,1.5])recordPuzzleCompletion(s,'instrument',i);assert.equal(s.instrument,0);
 recordPuzzleCompletion(s,'rhythm',0);recordPuzzleCompletion(s,'concert',0);assert.equal(s.rhythm,0);assert.equal(s.concert,0);
 recordPuzzleCompletion(s,'instrument',0);recordPuzzleCompletion(s,'instrument',0);assert.equal(s.instrument,1);assert.equal(restoredInstruments(s).length,1);
});
test('two missing voices must both be identified; duplicates and extra voices fail',()=>{
 assert.equal(sameSelection(['ajaeng','piri'],['piri','ajaeng']),true);
 assert.equal(sameSelection(['piri'],['piri','ajaeng']),false);
 assert.equal(sameSelection(['piri','piri'],['piri','ajaeng']),false);
 assert.equal(sameSelection(['piri','ajaeng','daegeum'],['piri','ajaeng']),false);
});

test('concert restoration requires the correct band, rhythm and music tradition together',()=>{
 for(const p of concertPuzzles){
  assert.equal(matchesConcert(p,p.answer,p.rhythm,p.tradition??''),true);
  assert.equal(matchesConcert(p,'wrong-band',p.rhythm,p.tradition??''),false);
  assert.equal(matchesConcert(p,p.answer,-1,p.tradition??''),false);
  assert.equal(matchesConcert(p,p.answer,(p.rhythm+1)%4,p.tradition??''),false);
  if(p.tradition)assert.equal(matchesConcert(p,p.answer,p.rhythm,'jeongak'),false);
 }
});
test('rhythm validation includes silent cells, ordering and complete length',()=>{
 assert.deepEqual(rhythmErrors(semachi,semachi),[]);const board=[...semachi];board[1]='kung';assert.deepEqual(rhythmErrors(board,semachi),[1]);
 assert.equal(rhythmErrors(semachi.slice(0,-1),semachi).length,9);
 for(const p of rhythmPuzzles){assert.equal(p.pattern.length,p.beats*p.subdivisions);assert.ok(p.blanks.length>=5);assert.equal(new Set(p.blanks).size,p.blanks.length);assert.ok(p.blanks.every(i=>i>=0&&i<p.pattern.length));}
});
test('shifted reference preserves all strokes and reconstructs with reverse rotation',()=>{
 for(const p of rhythmPuzzles){const shifted=rotatePattern(p.pattern,p.rotation);assert.deepEqual(rotatePattern(shifted,p.pattern.length-p.rotation),p.pattern);if(p.rotation)assert.notDeepEqual(shifted,p.pattern);}
 assert.equal(rhythmPuzzles.at(-1)!.subdivisions,2);
});
test('walls, exhibits and locked gates collide while open routes remain walkable',()=>{
 assert.equal(canOccupy(12,0,defaults),false);assert.equal(canOccupy(-4,0,defaults),false);assert.equal(canOccupy(-6,0,defaults),true);assert.equal(canOccupy(0,-4.5,defaults),false);
 assert.equal(canOccupy(-15,-7,defaults),false);assert.equal(canOccupy(0,-4.5,{instrument:6,rhythm:0}),true);assert.equal(canOccupy(6,0,{instrument:6,rhythm:0}),false);assert.equal(canOccupy(6,0,{instrument:6,rhythm:4}),true);
 for(const x of [-3,-2,-1,0,.6])assert.equal(canOccupy(x,-4.5,{instrument:6,rhythm:0}),true,'gallery doorway approach must stay clear');
});
test('expanded gallery has a continuous aisle and contains its new west wall',()=>{
 for(let x=-16;x<=-3;x+=.2)assert.equal(canOccupy(x,-4.5,defaults),x>-15.22,'west case stays solid and the central aisle stays open');
 assert.equal(canOccupy(-13,-2.8,defaults),true);assert.equal(canOccupy(-18,-4.5,defaults),false);assert.equal(canOccupy(-14,2,defaults),false);
 const open={instrument:6,rhythm:4};assert.equal(canOccupy(6,-3.4,open),true);assert.equal(canOccupy(6.6,4,open),true);
});
test('every puzzle and stage instrument has a credited real recording',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8'));const ids=new Set(manifest.items.map((a:{id:string})=>a.id));
 assert.equal(instruments.length,9);assert.equal(instrumentPuzzles.length+rhythmPuzzles.length+concertPuzzles.length,13);
 for(const i of instruments)assert.ok(ids.has(i.id==='janggu'?'deong':i.id));
 for(const p of instrumentPuzzles){assert.equal(p.hints.length,3);assert.ok(p.answers.every(id=>p.ensemble.includes(id)));}
 for(const p of concertPuzzles){assert.ok(p.options.some(o=>o.id===p.answer));assert.ok(rhythmPuzzles[p.rhythm]);}
 for(const a of manifest.items){assert.ok(a.sourceUrl.startsWith('https://apis.gugak.go.kr/'));assert.ok(a.license.includes('제1유형'));assert.ok(existsSync(`public${a.file}`));}
});
test('all 11 recordings are valid audible mono PCM and total less than 2.1MB',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8'));assert.equal(manifest.items.length,11);let total=0;
 for(const a of manifest.items){const b=readFileSync(`public${a.file}`);total+=b.length;assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),44100);assert.equal(b.readUInt16LE(34),16);let peak=0;for(let i=44;i+1<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert.ok(peak>1000);assert.ok(b.length>44100);}
 assert.ok(total<2_100_000);
});
