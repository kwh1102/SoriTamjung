export type RoomId = 'lobby' | 'instruments' | 'rhythm' | 'hall';
export type InstrumentId = 'gayageum' | 'daegeum' | 'haegeum';
export type Stroke = 'deong' | 'kung' | 'ttak' | 'rest';
export const rooms: {id:RoomId; name:string; subtitle:string; icon:string; position:[number,number]}[] = [
  {id:'lobby',name:'로비',subtitle:'모험의 시작',icon:'door',position:[-6,5]},
  {id:'instruments',name:'악기의 방',subtitle:'잃어버린 음색을 찾아서',icon:'music',position:[-6,-4.5]},
  {id:'rhythm',name:'장단의 방',subtitle:'다시 이어지는 리듬',icon:'drum',position:[6,-4.5]},
  {id:'hall',name:'공연장',subtitle:'우리의 소리가 만나는 곳',icon:'sparkles',position:[6,5]},
];
export const instruments: {id:InstrumentId; name:string; family:string; feature:string; description:string; color:string}[] = [
  {id:'gayageum',name:'가야금',family:'뜯는 현악기',feature:'줄을 뜯은 뒤 잦아드는 울림',description:'전통 가야금은 열두 줄을 안족 위에 걸고 손가락으로 뜯어 연주합니다. 왼손으로 줄을 누르거나 흔들어 소리를 꾸밉니다. 이번에는 소리가 시작되는 순간에 귀를 기울여 보세요.',color:'#c68a50'},
  {id:'daegeum',name:'대금',family:'가로로 부는 관악기',feature:'숨결과 함께 이어지는 소리',description:'대금은 대나무로 만든 가로로 부는 관악기입니다. 청공에 붙인 얇은 막인 청이 진동하며 특유의 음색을 만듭니다. 이번 단음에서는 소리가 이어지는 느낌을 비교해 보세요.',color:'#628c7b'},
  {id:'haegeum',name:'해금',family:'활로 켜는 현악기',feature:'활로 두 줄 사이를 켜는 소리',description:'해금은 두 줄 사이에 끼운 활을 움직여 연주합니다. 줄을 뜯는 가야금과 달리 활이 움직이는 동안 소리를 이어갈 수 있습니다. 음색의 느낌은 사람마다 다르게 표현할 수 있어요.',color:'#b47d6b'},
];
export const instrumentPuzzles: {title:string; level:string; answer:InstrumentId; mode:'solo'|'ensemble'; hints:string[]}[] = [
  {title:'이 소리의 주인을 찾아주세요',level:'입문 · 단음 비교',answer:'gayageum',mode:'solo',hints:['소리의 시작과 끝에 집중해 보세요. 줄을 톡 뜯은 뒤 울림이 잦아들어요.','가야금과 해금을 번갈아 들어보세요. 어떤 소리가 더 짧게 울리나요?','정답은 가야금입니다. 가야금 카드를 선택하고 복원해 보세요.']},
  {title:'합주에서 사라진 숨결',level:'기본 · 빠진 악기 찾기',answer:'daegeum',mode:'ensemble',hints:['완성 예시와 빠진 예시를 번갈아 들어보세요. 길게 이어지는 숨소리를 찾아요.','대금만 따로 들어본 뒤, 빠진 예시에도 있는지 비교해 보세요.','이번 합주에서 빠진 악기는 대금입니다.']},
  {title:'두 현악기, 서로 다른 울림',level:'도전 · 음색 구별',answer:'haegeum',mode:'ensemble',hints:['가야금과 해금은 모두 줄을 쓰지만 소리를 내는 방법이 달라요.','활로 이어지는 해금 소리가 있는지 귀 기울여 보세요.','이번에 되찾을 악기는 해금입니다.']},
];
export const strokes: {id:Stroke; label:string; description:string}[] = [
  {id:'deong',label:'덩',description:'양편 함께'}, {id:'kung',label:'쿵',description:'궁편'},
  {id:'ttak',label:'덕',description:'채편'}, {id:'rest',label:'쉼',description:'쉬는 소박'},
];
// A 9-subdivision educational semachi pattern. Each cell is one subdivision, not one large beat.
export const semachi: Stroke[] = ['deong','rest','rest','deong','rest','ttak','kung','ttak','rest'];
export const rhythmPuzzles = [
  {title:'첫 번째 울림을 되찾아요',blanks:[0]},
  {title:'세 박의 흐름을 이어요',blanks:[3,5,7]},
];
export const referenceLinks = [
  {name:'국립국악원 e-국악 · 세마치장단 학습 예시',url:'https://academy.gugak.go.kr/dp/pds/HTML5-4-47/HTML5-4-47-3/index.htm'},
  {name:'국립국악원 · 국악기 디지털음원',url:'https://apis.gugak.go.kr/digitaleum/front/monotone/list.do'},
  {name:'국립국악원 · 국악사전',url:'https://www.gugak.go.kr/ency/'},
  {name:'공공누리 · 이용 조건 안내',url:'https://www.kogl.or.kr/info/license.do'},
];
