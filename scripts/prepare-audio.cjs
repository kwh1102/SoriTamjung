/* Reproduce the bundled samples from lawfully obtained National Gugak Center originals.
   Run after saving source WAVs under tmp/audio-originals (see docs/audio-research.md).
   No synthesizer, denoiser, or source separation is used. */
const fs = require('node:fs');
const path = require('node:path');
function readWav(file) {
  const b = fs.readFileSync(file); let fmt, data;
  for (let p = 12; p + 8 < b.length;) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(p+8), channels: b.readUInt16LE(p+10), rate: b.readUInt32LE(p+12), bits: b.readUInt16LE(p+22) };
    if (id === 'data') data = b.subarray(p+8, p+8+size);
    p += 8 + size + size % 2;
  }
  if (!fmt || !data) throw new Error('Invalid WAV: ' + file);
  const bytes = fmt.bits / 8, n = data.length / (bytes * fmt.channels), samples = new Float32Array(n);
  for (let i = 0; i < n; i++) for (let ch = 0; ch < fmt.channels; ch++) {
    const p = (i * fmt.channels + ch) * bytes;
    samples[i] += (fmt.format === 3 ? data.readFloatLE(p) : fmt.bits === 16 ? data.readInt16LE(p) / 32768 : fmt.bits === 24 ? data.readIntLE(p,3) / 8388608 : data.readInt32LE(p) / 2147483648) / fmt.channels;
  }
  return { ...fmt, samples };
}
const items = [
 { id:'gayageum', name:'정악가야금', seq:2539, instr:19914, original:'jungak_gayageum_sus_mid_04_05.wav', start:88.825, duration:2.4, ratio:0.9934379001109269, sourcePitch:313.182116, description:'기본음계 · 중, 음계 녹음 중 한 음' },
 { id:'daegeum', name:'정악대금', seq:2557, instr:19917, original:'jungak_deageum_scale_sus_25.wav', start:32.395, duration:2.4, ratio:0.9643219072306044, sourcePitch:322.638096, description:'기본음, 음계 녹음 중 한 음' },
 { id:'haegeum', name:'해금', seq:2406, instr:19870, original:'Haegeum_1.wav', start:11.095, duration:1.8, ratio:1.0109587366584467, sourcePitch:307.754384, description:'기본음계 · 중, 음계 녹음 중 한 음' },
 { id:'deong', name:'장구 · 덩', seq:2283, instr:19847, original:'Janggu_1_2.wav', start:0.195, duration:1.3, ratio:1, description:'덩 · 중, 궁편과 채편을 함께 친 소리' },
 { id:'kung', name:'장구 · 쿵', seq:2289, instr:19847, original:'Janggu_3_2.wav', start:0.195, duration:1.3, ratio:1, description:'쿵 · 중, 궁편을 친 소리' },
 { id:'ttak', name:'장구 · 덕', seq:2295, instr:19847, original:'Janggu_5_2.wav', start:0.195, duration:0.8, ratio:1, description:'덕 · 중, 채편을 친 소리. 내부 ID ttak은 코드용 식별자' }
];
fs.mkdirSync('public/audio', { recursive:true });
for (const item of items) {
  const input = readWav(path.join('tmp/audio-originals', item.id+'.wav')), rate=44100, len=Math.floor(item.duration*rate), output=new Float32Array(len);
  let peak=0, sum=0;
  for (let i=0;i<len;i++) {
    const pos=item.start*input.rate+i*input.rate/rate*item.ratio, p=Math.floor(pos), fraction=pos-p;
    const fade=Math.min(1, i/(rate*.003), (len-1-i)/(rate*.055));
    output[i]=((input.samples[p]||0)*(1-fraction)+(input.samples[p+1]||0)*fraction)*fade;
    peak=Math.max(peak,Math.abs(output[i])); sum+=output[i]**2;
  }
  const rms=Math.sqrt(sum/len), gain=Math.min(.85/peak,.145/rms);
  const b=Buffer.alloc(44+len*2); b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(len*2,40);
  for(let i=0;i<len;i++) b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,output[i]*gain))*32767),44+i*2);
  fs.writeFileSync('public/audio/'+item.id+'.wav',b);
  item.file='/audio/'+item.id+'.wav';item.author='국립국악원 (개별 연주자 이름은 다운로드 목록에 표시되어 있지 않음)';item.sourceUrl='https://apis.gugak.go.kr/digitaleum/front/monotone/list.do?instrCd='+item.instr+'&instrName='+encodeURIComponent(item.instr===19847?'장구':item.name);item.downloadUrl='https://apis.gugak.go.kr/digitaleum/cmmn/file/monotone/download.do?id='+item.seq;item.previewUrl='https://apis.gugak.go.kr/digitaleum/front/preSound/monotone/play.do?mntn_seq='+item.seq;item.license='공공누리 제1유형 (출처표시)';item.licenseUrl='https://www.kogl.or.kr/info/license.do';item.status='실제 국악기 녹음 확보·가공 완료';item.modifications=`원본 ${item.start}초부터 ${item.duration}초 길이 발췌, 모노 PCM 16bit/44.1kHz 변환, 음량 정규화, 시작 3ms/끝 55ms 페이드`+(item.sourcePitch?`, 약 ${Math.round(1200*Math.log2(item.ratio))}센트 미세 조율(분석 지점 기준 E♭4 약 311.13Hz, 원래 연주에 따른 음높이 변화는 남아 있음)`:'; 음높이 변경 없음');item.gain=Number(gain.toFixed(5));item.bytes=b.length;
}
fs.writeFileSync('public/audio/manifest.json', JSON.stringify({provider:'국립국악원 국악기 디지털 음원',checkedAt:'2026-11-15',notice:'이 게임의 음원은 실제 악기 녹음을 발췌·가공한 교육용 샘플입니다. 합주 및 장단 패턴은 앱에서 재구성합니다.',items},null,2)+'\n');
console.log(items.map(({id,bytes,gain})=>({id,bytes,gain})));

