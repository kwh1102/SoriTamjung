import {semachi, instruments, rhythmPuzzles} from './data';
import type {InstrumentId, Stroke} from './data';
export interface AudioAsset {id:string; file:string; name?:string; author?:string; sourceUrl?:string; license?:string; modifications?:string;}
export class SoundEngine {
  context:AudioContext|null=null; master:GainNode|null=null; buffers=new Map<string,AudioBuffer>(); assets:AudioAsset[]=[];
  nodes=new Set<AudioScheduledSourceNode>(); volume=.65; muted=false; current:{start:number;step:number;count:number;loop:boolean}|null=null;
  status='소리를 켜고 입장해 주세요'; ready=false; loadPromise:Promise<void>|null=null; unavailable:string[]=[];
  generation=0;
  async unlock() {
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.connect(this.context.destination);this.setVolume(this.volume,this.muted);}
    if(this.context.state==='suspended')await this.context.resume();
    if(!this.loadPromise)this.loadPromise=this.load();
    await this.loadPromise;
  }
  async load(){
    this.status='실제 악기 소리를 불러오는 중…';
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}audio/manifest.json`);
      if(!response.ok)throw new Error('음원 목록 없음');
      const data=await response.json();this.assets=Array.isArray(data)?data:(data.items??data.assets);
      if(!Array.isArray(this.assets))throw new Error('음원 목록 형식 오류');
      await Promise.all(this.assets.map(async a=>{try{const res=await fetch(`${import.meta.env.BASE_URL}${a.file.replace(/^\//,'')}`);if(!res.ok)throw new Error();this.buffers.set(a.id,await this.context!.decodeAudioData(await res.arrayBuffer()));}catch{this.unavailable.push(a.id);}}));
      this.ready=[...instruments.map(i=>i.id==='janggu'?'deong':i.id),'kung','ttak'].every(id=>this.buffers.has(id));
      this.status=this.ready?'실제 국악기 음원 준비 완료':'일부 음원을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.';
    }catch{this.status='음원을 불러오지 못했어요. 연결을 확인하고 새로고침해 주세요.';}
  }
  setVolume(volume:number,muted:boolean){this.volume=volume;this.muted=muted;if(this.master&&this.context)this.master.gain.setTargetAtTime(muted?0:volume,this.context.currentTime,.02);}
  stop(){this.generation++;for(const node of this.nodes){try{node.stop();}catch{} node.disconnect();}this.nodes.clear();this.current=null;}
  sample(id:string,time:number,rate=1,gain=.65,duration?:number){
    const buffer=this.buffers.get(id==='janggu'?'deong':id);if(!buffer||!this.context||!this.master)return;
    const src=this.context.createBufferSource();src.buffer=buffer;src.playbackRate.value=rate;
    const amp=this.context.createGain();const end=Math.min(duration??buffer.duration/rate,buffer.duration/rate);
    amp.gain.setValueAtTime(0,time);amp.gain.linearRampToValueAtTime(gain,time+.012);amp.gain.setValueAtTime(gain,Math.max(time+.012,time+end-.06));amp.gain.linearRampToValueAtTime(0,time+end);
    src.connect(amp);amp.connect(this.master);this.nodes.add(src);src.onended=()=>{this.nodes.delete(src);src.disconnect();amp.disconnect();};src.start(time);src.stop(time+end+.01);
  }
  stroke(stroke:Stroke,time:number,gain=.8){if(stroke==='deong'){if(this.buffers.has('deong'))this.sample('deong',time,1,gain,.5);else{this.sample('kung',time,1,gain*.7,.5);this.sample('ttak',time,1,gain*.55,.35);}}else if(stroke!=='rest')this.sample(stroke,time,1,gain,.5);}
  async solo(id:InstrumentId|Stroke){const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.04;if(['deong','kung','ttak','rest'].includes(id))this.stroke(id as Stroke,start);else this.sample(id,start,1,.8,2);this.current={start,step:.5,count:4,loop:false};}
  async ensemble(missing:InstrumentId|InstrumentId[]=[],only?:InstrumentId,band:InstrumentId[]=['gayageum','daegeum','haegeum'],variation=0){
    const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.08;
    const omit=Array.isArray(missing)?missing:[missing];const melodies=[[1,1.12246,1.33484,1.49831,1.33484,1.12246,1,1],[1,1.33484,1.12246,1,1.49831,1.33484,1.12246,1],[1,1,1.33484,1.12246,1.49831,1.33484,1.49831,1]];
    const notes=melodies[variation%melodies.length];const step=variation===5?.32:variation===1?.62:.48;
    band.forEach((id,layer)=>{
      if(omit.includes(id)||only&&id!==only)return;
      const metal=id==='jing'||id==='kkwaenggwari',drum=id==='janggu';
      notes.forEach((rate,i)=>{if(metal&&i%(id==='jing'?4:2)!==0)return;if(drum){this.stroke(i%3===0?'deong':i%2?'ttak':'kung',start+i*step,.34);return;}
        const offset=layer%2===0?0:step*.08;this.sample(id,start+i*step+offset,metal?1:rate,metal?.24:.46/Math.sqrt(band.length),metal?1.5:step*.92);});
    });this.current={start,step,count:notes.length+3,loop:false};
  }
  async restored(id:InstrumentId){
    const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.08;
    this.sample(id,start,1,.75,1.7);
    const notes=[1,1.12246,1.33484,1.49831,1.33484,1.12246,1,1];
    for(const instrument of ['gayageum','daegeum','haegeum'])notes.forEach((rate,i)=>this.sample(instrument,start+2+i*.55,rate,instrument==='gayageum'?.55:.28,.47));
    this.current={start,step:.55,count:12,loop:false};
  }
  async rhythm(pattern:(Stroke|null)[]=semachi,repeat=false,accent:number[]=[],step=.34){
    const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.08;const repeats=repeat?4:1;
    for(let cycle=0;cycle<repeats;cycle++)pattern.forEach((s,i)=>{if(s)this.stroke(s,start+(cycle*pattern.length+i)*step,accent.includes(i)?1:.65);});
    this.current={start,step,count:pattern.length*repeats,loop:repeat};
  }
  getPlayhead(){if(!this.current||!this.context)return -1;const i=Math.floor((this.context.currentTime-this.current.start)/this.current.step);if(i>=this.current.count){this.current=null;return -1;}return i<0?-1:i;}
  async concert(band:InstrumentId[],rhythmIndex=0){
    const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.08;const p=rhythmPuzzles[rhythmIndex];
    const notes=[1,1.12246,1.33484,1.49831,1.33484,1.12246,1,1.33484];const beat=p.step*p.subdivisions;
    for(let cycle=0;cycle<2;cycle++){
      if(band.includes('janggu'))p.pattern.forEach((s,i)=>this.stroke(s,start+(cycle*p.pattern.length+i)*p.step,.32));
      band.filter(id=>id!=='janggu').forEach(id=>notes.forEach((rate,i)=>{const metal=id==='jing'||id==='kkwaenggwari';if(metal&&i%(id==='jing'?4:2))return;this.sample(id,start+cycle*p.pattern.length*p.step+i*beat/2,metal?1:rate,.33/Math.sqrt(band.length),metal?1.5:beat*.46);}));
    }this.current={start,step:p.step,count:p.pattern.length*2+5,loop:false};
  }
  async performance(){const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.stop();const start=this.context!.currentTime+.08;
    // Sequential listening avoids implying unrelated recordings are one traditional performance.
    (['gayageum','daegeum','haegeum'] as InstrumentId[]).forEach((id,i)=>this.sample(id,start+i*2.2,1,.7,2));
    semachi.forEach((s,i)=>this.stroke(s,start+6.8+i*.34,.8));this.current={start,step:.34,count:30,loop:false};
  }
}
