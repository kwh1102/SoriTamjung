import './style.css';
import {renderShell} from './shell';
import {createElement,ArrowUpRight,ArrowRight,AudioLines,BookOpen,Check,ChevronRight,Compass,DoorOpen,Drum,Headphones,HelpCircle,Home,Info,Keyboard,Lock,Map,Maximize,Menu,Music2,Pause,Play,RotateCcw,Settings2,Share2,Sparkles,Volume2,VolumeX,X} from 'lucide';
import {instruments,instrumentPuzzles,referenceLinks,rhythmPuzzles,rooms,semachi,strokes} from './data';
import type {InstrumentId,RoomId,Stroke} from './data';
import {defaults,loadSave,progress,storeSave,unlocked} from './state';
import {SoundEngine} from './audio';
import {Museum} from './museum';

const icons:Record<string,Parameters<typeof createElement>[0]>={arrow:ArrowRight,diagonal:ArrowUpRight,audio:AudioLines,book:BookOpen,check:Check,chevron:ChevronRight,compass:Compass,door:DoorOpen,drum:Drum,headphones:Headphones,help:HelpCircle,home:Home,info:Info,keyboard:Keyboard,lock:Lock,map:Map,maximize:Maximize,menu:Menu,music:Music2,pause:Pause,play:Play,reset:RotateCcw,settings:Settings2,share:Share2,sparkles:Sparkles,volume:Volume2,mute:VolumeX,close:X};
function icon(name:string,cls=''){const [tag,attrs,children]=icons[name]??Music2;return createElement([tag,{...attrs,width:20,height:20,'stroke-width':1.7,class:cls},children]).outerHTML;}
function instrumentDrawing(id:string){
  const shapes=id==='gayageum'?`<path d="M7 40 75 19l10 14-70 21Z" fill="#c69c67" stroke="#946b43"/><path d="m12 41 64-19m-62 22 64-19m-62 22 64-19m-62 22 64-19m-62 22 64-19m-62 22 64-19" stroke="#f1d9a9"/><path d="m32 34 7 12m8-17 7 12m6-17 7 12" stroke="#84633d"/>`:id==='daegeum'?`<path d="m19 56 50-49" stroke="#a1a36e" stroke-width="9" stroke-linecap="round"/><path d="m24 51 3 3m4-10 3 3m4-10 3 3m4-10 3 3m4-10 3 3m4-10 3 3" stroke="#52674c" stroke-width="2.5"/><path d="m19 51 5 5m38-48 6 6m-22 10 5 5" stroke="#d1c792" stroke-width="2"/>`:`<ellipse cx="39" cy="51" rx="13" ry="10" fill="#b48259" stroke="#8f6440"/><path d="m32 45 2-40" stroke="#aa7b51" stroke-width="5"/><path d="M35 11h13m-14 9h14" stroke="#885c39" stroke-width="4" stroke-linecap="round"/><path d="m39 51 1-39m3 39 1-30" stroke="#e4cfa3" stroke-width="1.5"/><path d="m18 40 54 10m-54-7 53 10" stroke="#a6804b" stroke-width="2"/>`;
  return `<svg viewBox="0 0 92 66" width="90" height="65" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
}
const state=loadSave();const sound=new SoundEngine();sound.volume=state.volume;sound.muted=state.muted;
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const app=$('#app');let museum:Museum|null=null;let playing=false;let currentModal='';let priorFocus:HTMLElement|null=null;let lastFocus:HTMLElement|null=null;
let instrumentSelection:InstrumentId|null=null;let instrumentHint=0;let rhythmHint=0;let feedback='';let solved=false;let selectedStroke:Stroke='deong';let board:(Stroke|null)[]=[];let repeat=false;let activeAudio='';let toastTimer:ReturnType<typeof setTimeout>;
function safe(value:unknown){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
function save(){if(!storeSave(state))toast('이 브라우저에서 저장할 수 없어요. 현재 창에서는 계속 진행할 수 있습니다.');updateUI();}
function toast(message:string){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}

app.innerHTML=renderShell(state,icon);

function nextRoom():RoomId{return state.completed?'hall':state.instrument<3?'instruments':state.rhythm<2?'rhythm':'hall';}
function syncExploration(){
  $('.museum-panel').classList.toggle('exploring',playing);
  $('#entry').hidden=playing;$('#game-hud').hidden=!playing;$('#playbar').hidden=!playing;
  if(!playing)return;
  const room=state.room;$('#room-label').textContent=rooms.find(r=>r.id===room)!.name;
  const target=state.completed?null:museum?.target;
  $('#investigate').hidden=!target;$('#guide-action').hidden=!!target;
  if(target)$('#investigate span').textContent=target==='lobby'?'사건 살펴보기':target==='hall'?'공연장 살펴보기':'소리 조사하기';
  const destination=room==='lobby'&&!state.instrument?'lobby':nextRoom();$('#guide-label').textContent=state.completed?'복원 결과 보기':room===destination?'조사 위치로 이동':rooms.find(r=>r.id===destination)!.name+'으로 이동';
  $('#objective-mini-text').textContent=state.completed?'모든 소리를 되찾았습니다.':room==='lobby'&&!state.instrument?'앞의 빛나는 표식을 조사하세요.':state.instrument<3?'악기의 방에서 사라진 소리를 찾으세요.':state.rhythm<2?'장단의 방에서 빈 소박을 채우세요.':'공연장에서 되찾은 소리를 들어보세요.';
}
function updateUI(){syncExploration();museum?.updateRestoration();}
try{museum=new Museum($('#scene'),state);museum.onTarget=()=>syncExploration();museum.onRoom=()=>save();museum.onInvestigate=id=>openRoom(id);}catch(error){console.error(error);$('#render-fallback').hidden=false;}
updateUI();

function dialog(title:string,subtitle:string,body:string,cls=''){
  subtitle=({'PREFERENCES':'설정','HOW TO PLAY':'조작 방법','SOUND COLLECTION':'소리 도감','RESTORATION COMPLETE':'복원 완료','SOURCES & CREDITS':'소개와 출처','NEW ADVENTURE':'진행 초기화','SHARE THE ADVENTURE':'접속 링크'} as Record<string,string>)[subtitle]??subtitle;
  const root=$('#modal-root');if(!currentModal)priorFocus=document.activeElement as HTMLElement;
  root.hidden=false;root.innerHTML=`<div class="modal-backdrop"><section class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><div class="modal-top"><div><span class="eyebrow">${safe(subtitle)}</span><h2 id="dialog-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="창 닫기">${icon('close')}</button></div>${body}</section></div>`;
  museum?.setPaused(true);root.querySelector<HTMLElement>('.modal')!.focus({preventScroll:true});
}
function closeDialog(){sound.stop();activeAudio='';$('#modal-root').hidden=true;$('#modal-root').innerHTML='';currentModal='';museum?.setPaused(!playing);priorFocus?.focus();}
function setDialog(kind:string,title:string,subtitle:string,body:string,cls=''){if(currentModal!==kind){sound.stop();activeAudio='';}dialog(title,subtitle,body,cls);currentModal=kind;}
async function start(){
  const button=$<HTMLButtonElement>('[data-action="start"]');button.disabled=true;button.innerHTML=`${icon('audio')} 소리를 준비하는 중…`;
  try{await sound.unlock();if(!sound.ready)toast(sound.status);playing=true;state.started=true;save();$('#entry').hidden=true;$('#game-hud').hidden=false;$('.museum-panel').classList.add('exploring');museum?.enter(state.room);syncExploration();if(!museum)openRoom('lobby');}catch(e){toast('소리를 시작하지 못했어요. 다시 눌러 주세요.');console.error(e);}finally{button.disabled=false;button.innerHTML=`${icon('volume')} 이어서 탐험하기 ${icon('arrow')}`;}
}
function travel(room:RoomId){if(!unlocked(state,room)){toast(room==='rhythm'?'악기의 방에서 세 가지 소리를 먼저 되찾아 주세요.':'장단의 방에서 두 장단 퍼즐을 먼저 완성해 주세요.');return;}
  closeDialog();if(!playing){playing=true;state.started=true;$('#entry').hidden=true;$('#game-hud').hidden=false;$('.museum-panel').classList.add('exploring');}
  state.room=room;museum?.enter(room);save();if(!museum)openRoom(room);
}
function openRoom(id:RoomId){if(!unlocked(state,id))return;feedback='';solved=false;sound.stop();activeAudio='';
  if(id==='lobby')setDialog('lobby','박물관의 소리가 사라졌어요','사건 001','<p class="dialog-lead">고장 난 소리 보관 장치.<br>악기의 음색과 장단이 흩어졌습니다.</p><p class="learning-copy">먼저 악기의 방으로 가세요. 소리를 비교하면 사라진 악기를 찾을 수 있어요.</p><div class="modal-actions"><button class="text-button" data-action="sound-test">소리 확인</button><button class="primary" data-action="travel" data-room="instruments">악기의 방으로'+icon('arrow')+'</button></div>');
  if(id==='instruments'){instrumentSelection=null;instrumentHint=0;heardFull=false;heardMissing=false;state.instrument===3?showCollection():showInstrument();}
  if(id==='rhythm'){rhythmHint=0;rhythmHeard=false;if(state.rhythm===2)showRhythmReview();else{prepareBoard();showRhythm();}}
  if(id==='hall')showHall();
}
function soundButton(action:string,label:string,kind:string,cls='secondary'){return `<button class="${cls} audio-button" data-action="${action}" data-kind="${kind}" aria-pressed="false">${icon('play')} ${label}</button>`;}
let heardFull=false;let heardMissing=false;
function showInstrument(index=Math.min(state.instrument,2)){
  const p=instrumentPuzzles[index];const answer=instruments.find(i=>i.id===p.answer)!;
  if(solved){
    setDialog('instrument',answer.name+'의 소리를 되찾았어요', '악기의 방 · '+(index+1)+' / 3',
      '<div class="found-instrument">'+instrumentDrawing(answer.id)+'</div><p class="dialog-lead">'+answer.feature+'</p><p class="learning-copy">'+answer.description+'</p><div class="listen-row">'+soundButton('restore-listen','복원 후 듣기','restored')+soundButton('instrument-listen','복원 전 듣기','missing')+'</div><div class="modal-actions"><button class="text-button" data-action="stop">소리 정지</button><button class="primary" data-action="instrument-next">'+(state.instrument===3?'장단의 방으로':'다음 소리 찾기')+icon('arrow')+'</button></div>','puzzle-modal');return;
  }
  const heard=heardFull&&(p.mode==='solo'||heardMissing);
  const listening='<div class="listen-row">'+soundButton('instrument-listen',p.mode==='solo'?'단서 소리 듣기':'완성된 합주 듣기','full',!heardFull?'listen-tile recommended':'listen-tile')+(p.mode==='ensemble'?soundButton('instrument-listen','악기가 빠진 예시 듣기','missing',heardFull&&!heardMissing?'listen-tile recommended':'listen-tile'):'')+'</div>';
  const choices=heard?'<div class="choices-heading"><h3>어떤 악기의 소리일까요?</h3><p>악기를 누르면 소리를 듣고 선택할 수 있어요.</p></div><div class="instrument-options">'+instruments.map(i=>'<button class="instrument-option '+(instrumentSelection===i.id?'selected':'')+'" data-action="select-instrument" data-id="'+i.id+'" aria-pressed="'+(instrumentSelection===i.id)+'"><span class="instrument-drawing">'+instrumentDrawing(i.id)+'</span><strong>'+i.name+'</strong><span class="choice-indicator">'+icon(instrumentSelection===i.id?'check':'volume')+'</span></button>').join('')+'</div>':'';
  setDialog('instrument',p.title,'악기의 방 · '+(index+1)+' / 3',
    '<p class="dialog-lead compact">'+(heard?'단서와 후보의 소리를 비교해 보세요.':p.mode==='solo'?'먼저 단서 소리를 들어보세요.':'두 예시를 차례로 듣고, 빠진 소리를 찾아보세요.')+'</p>'+listening+choices+
    (feedback?'<div class="feedback" role="status">'+feedback+'</div>':'')+
    (instrumentHint?'<div class="hint-text" role="status">'+p.hints[instrumentHint-1]+'</div>':'')+
    '<div class="modal-actions"><button class="text-button" data-action="instrument-hint">힌트'+(instrumentHint?' '+instrumentHint+'/3':'')+'</button>'+(heard?'<button class="primary" data-action="verify-instrument" '+(!instrumentSelection?'disabled':'')+'>'+(instrumentSelection?instruments.find(i=>i.id===instrumentSelection)!.name+'으로 복원하기':'악기를 선택하세요')+icon('arrow')+'</button>':'<button class="text-button" data-action="stop">소리 정지</button>')+'</div>','puzzle-modal');
}

// Keep the just-solved question visible while the saved progress already advances.
let justSolvedInstrument=-1;
function showInstrumentAtSolved(){showInstrument(justSolvedInstrument);}

function prepareBoard(){const p=rhythmPuzzles[state.rhythm];board=semachi.map((s,i)=>p.blanks.includes(i)?null:s);selectedStroke='deong';}
let justSolvedRhythm=-1;
let rhythmHeard=false;
function showRhythm(index=Math.min(state.rhythm,1)){
  const p=rhythmPuzzles[index];
  if(solved){setDialog('rhythm','장단이 다시 이어졌어요','장단의 방 · '+(index+1)+' / 2',
    '<p class="dialog-lead">내가 채운 소박이 전체 흐름에 돌아왔어요.</p><div class="pattern-summary">덩 · · <span>/</span> 덩 · 덕 <span>/</span> 쿵 덕 ·</div><p class="learning-copy">세마치는 3소박씩 세 박이 모인 장단입니다. 이번에는 그중 한 가지 예시를 복원했어요.</p>'+soundButton('rhythm-listen','채운 부분을 강조해 듣기','restored')+'<div class="modal-actions"><button class="text-button" data-action="stop">소리 정지</button><button class="primary" data-action="rhythm-next">'+(state.rhythm===2?'공연장으로':'다음 장단 찾기')+icon('arrow')+'</button></div>','puzzle-modal');return;}
  const explanation='<p class="dialog-lead compact">'+(rhythmHeard?'소리 블록을 고른 뒤, 빈칸을 눌러 채워주세요.':'먼저 세마치장단 예시를 들어보세요.')+'</p>';
  const listen='<div class="listen-row">'+soundButton('rhythm-listen','기준 예시 듣기','reference',rhythmHeard?'listen-tile':'listen-tile recommended')+(rhythmHeard?soundButton('rhythm-listen','내 배치 듣기','board','listen-tile'):'')+'</div>';
  const grid=rhythmHeard?'<div class="board-heading"><h3>한 칸은 1소박이에요.</h3><span>3소박 × 3박</span></div><div class="beat-groups">'+[0,1,2].map(beat=>'<div class="beat-group"><span>'+(beat+1)+'박</span><div>'+board.slice(beat*3,beat*3+3).map((stroke,j)=>{const i=beat*3+j,editable=p.blanks.includes(i);return '<button class="beat-cell '+(editable?'editable':'')+' '+(stroke?'filled':'empty')+'" data-action="place-stroke" data-index="'+i+'" data-beat="'+i+'" '+(!editable?'disabled':'')+' aria-label="'+(i+1)+'번째 소박, '+(stroke?strokes.find(a=>a.id===stroke)!.label:'빈칸')+', '+(editable?'편집 가능':'고정')+'"><span>'+(stroke?strokes.find(a=>a.id===stroke)!.label:'?')+'</span></button>';}).join('')+'</div></div>').join('')+'</div><div class="stroke-palette" aria-label="넣을 소리 선택">'+strokes.map(a=>'<button draggable="true" data-stroke="'+a.id+'" class="stroke-block '+(selectedStroke===a.id?'selected':'')+'" data-action="select-stroke" data-id="'+a.id+'" aria-pressed="'+(selectedStroke===a.id)+'"><strong>'+a.label+'</strong><small>'+a.description+'</small></button>').join('')+'</div><details class="puzzle-tools"><summary>반복 듣기와 초기화</summary><div><label class="checkbox"><input id="repeat-rhythm" type="checkbox" '+(repeat?'checked':'')+'/>4번 반복</label><button class="text-button" data-action="reset-board">배치 초기화</button><button class="text-button" data-action="stop">소리 정지</button></div></details>':'';
  const hint=rhythmHint?'<div class="hint-text" role="status">'+(rhythmHint===1?'“덩 - - / 덩 - 덕 / 쿵 덕 -”의 세 묶음으로 들어보세요.':rhythmHint===2?'빛나는 소박을 보며 빈칸과 기준 소리를 비교해 보세요.':'빈칸의 정답: '+p.blanks.map(i=>(i+1)+'칸 '+strokes.find(a=>a.id===semachi[i])!.label).join(', '))+'</div>':'';
  setDialog('rhythm',p.title,'장단의 방 · '+(index+1)+' / 2',explanation+listen+grid+(feedback?'<div class="feedback" role="status">'+feedback+'</div>':'')+hint+'<div class="modal-actions"><button class="text-button" data-action="rhythm-hint">힌트'+(rhythmHint?' '+rhythmHint+'/3':'')+'</button>'+(rhythmHeard?'<button class="primary" data-action="verify-rhythm" '+(board.some(a=>a===null)?'disabled':'')+'>장단 복원하기'+icon('arrow')+'</button>':'<button class="text-button" data-action="stop">소리 정지</button>')+'</div>','puzzle-modal');
}

function showRhythmAtSolved(){showRhythm(justSolvedRhythm);}
function showRhythmReview(){setDialog('rhythm-review','다시 이어진 장단의 흐름','장단의 방 · 복원 완료',`<div class="completion-symbol">${icon('drum')}</div><p class="dialog-lead">세마치장단의 빈칸을 모두 되찾았어요.</p><div class="pattern-summary">덩 · · <span>/</span> 덩 · 덕 <span>/</span> 쿵 덕 ·</div><p class="notice">점(·)은 쉬는 소박입니다. 3소박씩 세 묶음이 한 장단을 이룹니다. 이 패턴이 세마치의 유일한 연주 형태는 아닙니다.</p><div class="modal-actions">${soundButton('rhythm-review-listen','장단 다시 듣기','reference')}<button class="primary" data-action="travel" data-room="hall">공연장으로 ${icon('arrow')}</button></div>`);}
function showHall(){setDialog('hall','당신이 되찾은 소리의 무대','공연장',`<div class="concert-art"><span>♪</span><span>♬</span><span>♫</span></div><p class="dialog-lead">가야금의 울림, 대금의 숨결, 해금의 활.<br>그리고 다시 이어진 장구의 장단을 만나 보세요.</p><div class="notice">국립국악원의 단음 녹음을 악기별로 차례로 들은 뒤, 복원한 장단으로 마무리하는 약 10초의 작은 소리 전시입니다. 전통 악곡의 완성 연주 녹음은 아닙니다.</div><div class="modal-actions">${soundButton('performance','작은 소리 공연 듣기','performance','primary')}<button class="secondary" data-action="finish">발견의 기록 보기 ${icon('arrow')}</button></div>`);}
function showResults(){setDialog('results','박물관의 모든 소리가 돌아왔어요','RESTORATION COMPLETE',`<div class="result-seal">${icon('sparkles')}<span>복원 완료</span></div><p class="dialog-lead">당신이 귀 기울인 순간들이 모여<br>박물관을 다시 음악으로 채웠습니다.</p><div class="review-cards"><div><span>01 음색</span><h3>같은 높이, 다른 소리</h3><p>가야금·대금·해금의 실제 소리를 비교하고, 합주에서 빠진 악기를 찾았어요.</p></div><div><span>02 장단</span><h3>반복 속에 담긴 흐름</h3><p>3소박씩 세 박이 모인 세마치 예시의 빈칸을 직접 복원했어요.</p></div><div><span>03 연결</span><h3>내가 채운 소리의 자리</h3><p>복원 전후를 비교하며 작은 요소가 전체 소리에 미치는 변화를 들었어요.</p></div></div><div class="modal-actions"><button class="secondary" data-action="collection">${icon('book')} 소리 도감</button><button class="primary" data-action="performance">${icon('play')} 다시 감상하기</button></div><div class="result-links"><button data-action="sources">참고 자료와 자산 출처</button><button data-action="reset-confirm">처음부터 다시 플레이</button></div>`);}
function showCollection(){setDialog('collection','귀로 만나는 작은 소리 도감','SOUND COLLECTION',`<p class="dialog-lead compact">같은 높이의 실제 녹음 단음을 번갈아 들어보세요.</p><div class="collection-list">${instruments.map(i=>`<article><span class="collection-icon" style="color:${i.color}">${icon('music')}</span><div><h3>${i.name} <small>${i.family}</small></h3><p>${i.description}</p></div><button class="icon-button" data-action="sample" data-id="${i.id}" aria-label="${i.name} 듣기">${icon('volume')}</button></article>`).join('')}</div><div class="notice">‘맑다’, ‘거칠다’ 같은 느낌은 개인의 감상입니다. 이 체험은 소리를 만드는 방법과 울림의 차이를 비교해 보는 활동이에요.</div><div class="modal-actions"><button class="text-button" data-action="sources">${icon('book')} 자세한 출처</button><button class="primary" data-action="${state.instrument===3?'travel':'close'}" ${state.instrument===3?'data-room="rhythm"':''}>${state.instrument===3?'장단의 방으로':'탐험으로 돌아가기'} ${icon('arrow')}</button></div>`);}
function showSettings(){setDialog('settings','편안한 탐험을 위한 설정','PREFERENCES',`<button class="secondary mute-setting" data-action="mute">${icon(state.muted?'mute':'volume')} 소리 ${state.muted?'켜기':'끄기'}</button><div class="settings-list"><label><span>${icon('volume')} 전체 음량 <b id="volume-label">${Math.round(state.volume*100)}%</b></span><input id="volume" type="range" min="0" max="100" value="${state.volume*100}"/></label><label><span>${icon('compass')} 이동 속도 <b id="speed-label">${state.speed.toFixed(1)}</b></span><input id="speed" type="range" min="1.5" max="5" step=".1" value="${state.speed}"/></label><label><span>${icon('settings')} 시점 감도 <b id="sensitivity-label">${state.sensitivity.toFixed(1)}</b></span><input id="sensitivity" type="range" min=".3" max="2.5" step=".1" value="${state.sensitivity}"/></label></div><p class="notice">설정은 자동으로 저장됩니다. 이동이 어려우면 메뉴의 전시실 이동을 이용하세요.</p><div class="modal-actions"><button class="text-button danger" data-action="reset-confirm">${icon('reset')} 처음부터 시작</button><button class="primary" data-action="close">설정 완료 ${icon('check')}</button></div>`);}
function showHelp(){setDialog('help','소리탐정의 작은 안내서','HOW TO PLAY',`<div class="help-grid"><article><h3>${icon('keyboard')} PC에서</h3><p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 또는 방향키로 이동<br>화면을 누른 채 드래그하여 둘러보기<br><kbd>E</kbd> 또는 빛나는 표식 가까이에서 클릭하여 조사<br><kbd>Esc</kbd> 퍼즐 닫기 · 잠시 쉬기</p></article><article><h3>${icon('compass')} 휴대폰·태블릿에서</h3><p>왼쪽 아래 조이스틱으로 이동<br>오른쪽 화면을 드래그하여 둘러보기<br>가까이 다가가 ‘조사하기’ 버튼 누르기<br>장단은 블록 선택 후 빈칸을 눌러 채우기</p></article></div><div class="notice"><strong>내 속도로, 편하게.</strong><br>시간제한이나 탈락은 없어요. 예시를 여러 번 듣고 단계별 힌트를 사용해 보세요. 메뉴의 전시실 이동을 누르면 해당 전시물 가까이로 이동해요. 잠긴 공간에는 해제 조건이 표시됩니다.</div><div class="modal-actions"><button class="secondary" data-action="sound-test">${icon('volume')} 소리 확인</button><button class="primary" data-action="close">이제 알겠어요 ${icon('check')}</button></div>`);}
async function showSources(){setDialog('sources','소리의 출처, 제작의 기록','SOURCES & CREDITS',`<p class="dialog-lead compact">실제 자료를 바탕으로, 직접 듣고 비교할 수 있도록 만들었습니다.</p><h3 class="source-heading">국악 정보</h3><div class="source-links">${referenceLinks.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${safe(s.name)} ${icon('diagonal')}</a>`).join('')}</div><h3 class="source-heading">실제 녹음 단음 · 국립국악원</h3><div id="asset-credits"><p>출처 목록을 불러오는 중…</p></div><h3 class="source-heading">직접 제작한 부분</h3><p class="source-copy">Three.js 도형으로 만든 도식적 악기·박물관, HTML/CSS 그림과 인터페이스. 학습용 합주는 실제 단음을 재생 속도와 길이를 조정하여 배열한 짧은 창작 가락이며, 전통 악곡의 녹음이 아닙니다. 세마치 패턴은 국립국악원 e-국악 교육 예시를 따라 학습용 속도로 재구성했습니다.</p><p class="source-copy">개발 도구: Vite · TypeScript · Three.js(MIT) · Lucide(ISC). 개발 단계에서 AI가 코드와 문서 초안 작성에 사용되었으며, 플레이 중 생성형 AI는 사용하지 않습니다. 원자료와 자산별 이용 조건·변경 사항은 저장소의 docs/audio-research.md에 기록했습니다.</p><div class="modal-actions"><button class="primary" data-action="close">탐험으로 돌아가기 ${icon('arrow')}</button></div>`,'sources-modal');
  try{const res=await fetch(`${import.meta.env.BASE_URL}audio/manifest.json`);const data=await res.json();if(currentModal!=='sources')return;const items=data.items??data.assets??data;$('#asset-credits').innerHTML=items.map((a:Record<string,unknown>)=>`<article class="asset-credit"><div><strong>${safe(a.name??a.id)}</strong><span>${safe(a.author)} · ${safe(a.license)}</span></div><p>${safe(a.modifications)}</p><a href="${safe(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">원자료 보기 ${icon('diagonal')}</a></article>`).join('');}catch{if(currentModal==='sources')$('#asset-credits').textContent='출처 목록을 불러오지 못했어요. 저장소의 docs/audio-research.md를 확인해 주세요.';}
}
function showPause(){setDialog('pause','메뉴',rooms.find(r=>r.id===state.room)!.name,
  '<button class="primary resume-button" data-action="close">'+icon('play')+'탐험 계속하기</button><div class="menu-progress"><span>박물관 복원</span><strong>'+progress(state)+'%</strong><div><i style="width:'+progress(state)+'%"></i></div></div><div class="menu-links"><button data-action="map">전시실 이동'+icon('chevron')+'</button><button data-action="collection">소리 도감'+icon('chevron')+'</button><button data-action="settings">소리와 조작 설정'+icon('chevron')+'</button><button data-action="help">조작 방법'+icon('chevron')+'</button><button data-action="share">접속 링크 공유'+icon('chevron')+'</button><button data-action="sources">소개와 출처'+icon('chevron')+'</button></div>','menu-modal');}
function showMap(){setDialog('map','전시실로 이동','이동 보조',
  '<p class="dialog-lead compact">가고 싶은 전시실을 선택하세요.</p><nav class="room-list">'+rooms.map((r,i)=>'<button data-action="travel" data-room="'+r.id+'" aria-disabled="'+!unlocked(state,r.id)+'"><span class="room-index">0'+(i+1)+'</span><span><strong>'+r.name+'</strong>'+(!unlocked(state,r.id)?'<small>'+(r.id==='rhythm'?'악기 문제 3개를 먼저 해결해 주세요.':'장단 문제 2개를 먼저 해결해 주세요.')+'</small>':'')+'</span>'+icon(unlocked(state,r.id)?'arrow':'lock')+'</button>').join('')+'</nav><button class="text-button" data-action="pause">메뉴로 돌아가기</button>');}

function showShare(){setDialog('share','함께, 우리 소리를 찾아요','SHARE THE ADVENTURE',`<p class="dialog-lead">휴대폰·태블릿·PC에서 링크로 바로 입장하세요.<br>설치나 회원가입이 필요하지 않습니다.</p><label class="share-url">접속 링크<input id="share-url" readonly value="${safe(location.href.split('#')[0])}"/></label><div class="modal-actions"><button class="primary" data-action="copy-link">${icon('share')} 링크 복사하기</button></div>`);}
function refreshSolved(){if(currentModal==='instrument')solved?showInstrumentAtSolved():showInstrument();else if(currentModal==='rhythm')solved?showRhythmAtSolved():showRhythm();}
async function playWithButton(key:string,fn:()=>Promise<void>){if(activeAudio===key&&sound.getPlayhead()>=0){sound.stop();activeAudio='';return;}activeAudio=key;await fn();if(!sound.ready)toast(sound.status);}
async function handle(action:string,el:HTMLElement){
  const data=el.dataset;
  switch(action){
    case 'start':await start();break;
    case 'home':if(currentModal)closeDialog();if(playing)travel('lobby');else window.scrollTo({top:0,behavior:'smooth'});break;
    case 'travel':travel(data.room as RoomId);break;
    case 'next':if(state.completed){showResults();break;}travel(state.instrument<3?'instruments':state.rhythm<2?'rhythm':'hall');break;
    case 'preview':{const name=data.kind as RoomId;toast(name==='instruments'?'음색은 소리의 빛깔이에요. 세 악기의 실제 소리를 비교해 보세요.':name==='rhythm'?'세마치장단의 소박을 직접 채워보는 두 가지 퍼즐이 기다려요.':'앞선 전시를 복원하면 마지막 공연장이 열려요.');break;}
    case 'investigate':if(museum?.target)openRoom(museum.target);break;
    case 'close':closeDialog();break;
    case 'help':showHelp();break;
    case 'pause':showPause();break;
    case 'settings':showSettings();break;
    case 'sources':await showSources();break;
    case 'collection':showCollection();break;
    case 'share':showShare();break;
    case 'copy-link':{const input=$<HTMLInputElement>('#share-url');input.select();try{await navigator.clipboard.writeText(input.value);toast('접속 링크를 복사했어요.');}catch{toast('위 링크를 선택해 복사해 주세요.');}break;}
    case 'mute':state.muted=!state.muted;sound.setVolume(state.volume,state.muted);if(currentModal==='settings')showSettings();save();break;
    case 'sound-test':await sound.solo('gayageum');toast(sound.ready?'가야금 소리가 들리나요? 설정에서 음량을 조절할 수 있어요.':sound.status);break;
    case 'select-instrument':if(solved)break;instrumentSelection=data.id as InstrumentId;feedback='';showInstrument();activeAudio='';await sound.solo(instrumentSelection);break;
    case 'sample':await sound.solo(data.id as InstrumentId);activeAudio='';if(!sound.ready)toast(sound.status);break;
    case 'instrument-listen':{if(data.kind==='full')heardFull=true;else heardMissing=true;if(!solved)showInstrument();const p=instrumentPuzzles[solved?justSolvedInstrument:state.instrument];await playWithButton(`instrument-${data.kind}`,()=>p.mode==='solo'&&data.kind==='full'?sound.solo(p.answer):sound.ensemble(data.kind==='missing'?p.answer:undefined));break;}
    case 'instrument-hint':instrumentHint=Math.min(3,instrumentHint+1);showInstrument();if(instrumentHint===2){activeAudio='';await sound.solo(instrumentPuzzles[state.instrument].answer);}break;
    case 'verify-instrument':{const p=instrumentPuzzles[state.instrument];if(!instrumentSelection)break;if(instrumentSelection!==p.answer){feedback=`${instruments.find(i=>i.id===instrumentSelection)!.name} 소리와는 조금 달라요. 단서를 다시 듣고, 소리의 시작과 길이를 비교해 보세요.`;showInstrument();}else{solved=true;justSolvedInstrument=state.instrument;state.instrument++;feedback=`${instruments.find(i=>i.id===p.answer)!.name}의 소리를 되찾았어요! 복원한 악기를 먼저 듣고 전체 합주로 이어집니다.`;save();showInstrumentAtSolved();activeAudio="restored";await sound.restored(p.answer);}break;}
    case 'restore-listen':activeAudio='restored';await sound.restored(instrumentPuzzles[justSolvedInstrument].answer);break;
    case 'instrument-next':sound.stop();activeAudio='';solved=false;feedback='';instrumentSelection=null;instrumentHint=0;heardFull=false;heardMissing=false;if(state.instrument===3)travel('rhythm');else showInstrument();break;
    case 'select-stroke':selectedStroke=data.id as Stroke;activeAudio='';refreshSolved();await sound.solo(selectedStroke);break;
    case 'stroke-sample':activeAudio='';await sound.solo(data.id as Stroke);break;
    case 'place-stroke':if(!solved){sound.stop();board[Number(data.index)]=selectedStroke;feedback='';showRhythm();}break;
    case 'rhythm-listen':{rhythmHeard=true;if(!solved)showRhythm();const index=solved?justSolvedRhythm:state.rhythm;await playWithButton(`rhythm-${data.kind}`,()=>sound.rhythm(data.kind==='board'?board:semachi,repeat,data.kind==='restored'?rhythmPuzzles[index].blanks:[]));break;}
    case 'reset-board':if(!solved){sound.stop();prepareBoard();feedback='';showRhythm();}break;
    case 'rhythm-hint':rhythmHint=Math.min(3,rhythmHint+1);showRhythm();if(rhythmHint===2){activeAudio='rhythm-reference';await sound.rhythm(semachi,false,rhythmPuzzles[state.rhythm].blanks);}break;
    case 'verify-rhythm':{const wrong=board.map((s,i)=>s!==semachi[i]?i+1:0).filter(Boolean);if(wrong.length){feedback=`${wrong.join('・')}번째 소박이 기준과 다르게 들려요. 그 구간의 ‘덩·쿵·덕·쉼’을 다시 비교해 보세요.`;showRhythm();}else{justSolvedRhythm=state.rhythm;state.rhythm++;solved=true;feedback='빈 소박이 돌아왔어요! 내가 채운 부분을 강조해 다시 들어보세요.';save();showRhythmAtSolved();activeAudio="rhythm-restored";await sound.rhythm(semachi,false,rhythmPuzzles[justSolvedRhythm].blanks);}break;}
    case 'rhythm-next':sound.stop();activeAudio='';solved=false;feedback='';rhythmHint=0;rhythmHeard=false;if(state.rhythm===2)travel('hall');else{prepareBoard();showRhythm();}break;
    case 'rhythm-review-listen':await sound.rhythm(semachi);break;
    case 'performance':await playWithButton('performance',()=>sound.performance());break;
    case 'finish':state.completed=true;save();sound.stop();showResults();break;
    case 'stop':sound.stop();activeAudio='';break;
    case 'reset-confirm':setDialog('reset','처음부터 다시 탐험할까요?','NEW ADVENTURE',`<p class="dialog-lead">이 브라우저에 저장한 퍼즐 진행과 복원 기록이 초기화됩니다. 음량과 조작 설정은 유지돼요.</p><div class="modal-actions"><button class="secondary" data-action="close">계속 탐험하기</button><button class="primary" data-action="reset">${icon('reset')} 기록 초기화하고 시작</button></div>`);break;
    case 'reset':{const {volume,muted,speed,sensitivity}=state;Object.assign(state,defaults,{volume,muted,speed,sensitivity});sound.stop();save();closeDialog();playing=false;$('#entry').hidden=false;$('#game-hud').hidden=true;$('.museum-panel').classList.remove('exploring');if(museum){museum.overview=true;museum.setPaused(true);}syncExploration();$('[data-action="start"]').innerHTML=icon('volume')+'<span>소리 켜고 시작하기</span>'+icon('arrow');break;}
    case 'map':showMap();break;
    case 'guide':if(state.completed)showResults();else travel(state.room==='lobby'&&!state.instrument?'lobby':nextRoom());break;
    case 'fullscreen':{const panel=$('.museum-panel');if(document.fullscreenElement)await document.exitFullscreen();else if(panel.requestFullscreen){panel.append($('#modal-root'));await panel.requestFullscreen();}else{panel.classList.toggle('expanded');museum?.resize();}break;}
  }
}
document.addEventListener('click',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(el){e.preventDefault();if(el instanceof HTMLButtonElement&&el.disabled)return;lastFocus=el;void handle(el.dataset.action!,el).catch(error=>{console.error(error);toast('작업을 완료하지 못했어요. 다시 시도해 주세요.');});}});
document.addEventListener('input',e=>{const el=e.target as HTMLInputElement;if(el.id==='volume'){state.volume=Number(el.value)/100;sound.setVolume(state.volume,state.muted);$('#volume-label').textContent=`${el.value}%`;save();}if(el.id==='speed'){state.speed=Number(el.value);$('#speed-label').textContent=state.speed.toFixed(1);save();}if(el.id==='sensitivity'){state.sensitivity=Number(el.value);$('#sensitivity-label').textContent=state.sensitivity.toFixed(1);save();}});
document.addEventListener('change',e=>{if((e.target as HTMLElement).id==='repeat-rhythm')repeat=(e.target as HTMLInputElement).checked;});
document.addEventListener('dragstart',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-stroke]');if(el)e.dataTransfer?.setData('text/plain',el.dataset.stroke!);});
document.addEventListener('dragover',e=>{if((e.target as HTMLElement).closest('.beat-cell.editable'))e.preventDefault();});
document.addEventListener('drop',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('.beat-cell.editable');if(!el||solved)return;e.preventDefault();const stroke=e.dataTransfer?.getData('text/plain') as Stroke;if(strokes.some(s=>s.id===stroke)){sound.stop();board[Number(el.dataset.index)]=stroke;feedback='';showRhythm();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();currentModal?closeDialog():playing?showPause():null;}if(e.key==='Tab'&&currentModal){const focusables=[...$('#modal-root').querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]')];const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement?.classList.contains('modal'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.stop();museum?.clearInput();if(playing&&!currentModal)showPause();void sound.context?.suspend();}});
window.addEventListener('blur',()=>{museum?.clearInput();sound.stop();if(playing&&!currentModal)showPause();});
const joystick=$('#joystick');let joystickPointer=-1;
function moveJoystick(e:PointerEvent){const rect=joystick.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(e.clientX-rect.left-rect.width/2)/35));const y=Math.max(-1,Math.min(1,(e.clientY-rect.top-rect.height/2)/35));const length=Math.max(1,Math.hypot(x,y));$('#joystick-thumb').style.transform=`translate(${x/length*28}px,${y/length*28}px)`;if(museum&&!museum.paused)museum.joystick={x:x/length,y:y/length};}
joystick.addEventListener('pointerdown',e=>{e.stopPropagation();joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoystick(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickPointer)moveJoystick(e);});function releaseJoystick(){joystickPointer=-1;$('#joystick-thumb').style.transform='';if(museum)museum.joystick={x:0,y:0};}joystick.addEventListener('pointerup',releaseJoystick);joystick.addEventListener('pointercancel',releaseJoystick);
function animateUI(){const head=sound.getPlayhead();document.querySelectorAll<HTMLElement>('[data-beat]').forEach(el=>el.classList.toggle('playing',activeAudio.startsWith('rhythm-')&&head>=0&&Number(el.dataset.beat)===head%9));for(const el of document.querySelectorAll<HTMLButtonElement>('.audio-button')){const key=el.dataset.action==='instrument-listen'?`instrument-${el.dataset.kind}`:el.dataset.action==='rhythm-listen'?`rhythm-${el.dataset.kind}`:el.dataset.kind;const isPlaying=activeAudio===key&&head>=0;el.classList.toggle('is-playing',isPlaying);el.setAttribute('aria-pressed',String(isPlaying));}requestAnimationFrame(animateUI);}animateUI();
window.addEventListener('pagehide',()=>{sound.stop();museum?.dispose();});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.append($('#modal-root'));museum?.resize();});
