export type RoomId='lobby'|'instruments'|'rhythm'|'hall';
export type InstrumentId='gayageum'|'daegeum'|'haegeum'|'geomungo'|'piri'|'ajaeng'|'jing'|'kkwaenggwari'|'janggu';
export type Stroke='deong'|'kung'|'ttak'|'rest';
export const rooms:{id:RoomId;name:string;subtitle:string;icon:string;position:[number,number]}[]=[
 {id:'lobby',name:'소리의 뜰',subtitle:'사라진 소리의 기록',icon:'door',position:[-6,5]},
 {id:'instruments',name:'악기 갤러리',subtitle:'여덟 악기의 자리를 복원하다',icon:'music',position:[-6,-4.5]},
 {id:'rhythm',name:'장단 공방',subtitle:'네 개의 흐름을 다시 잇다',icon:'drum',position:[6,-4.5]},
 {id:'hall',name:'소리의 무대',subtitle:'편성·장단·갈래의 마지막 추리',icon:'sparkles',position:[6,5]},
];
export const instruments:{id:InstrumentId;name:string;family:string;feature:string;description:string;color:string}[]=[
 {id:'gayageum',name:'가야금',family:'뜯는 현악기',feature:'손끝에서 시작해 잦아드는 열두 줄의 울림',description:'열두 줄을 안족 위에 걸고 손가락으로 뜯습니다. 왼손으로 줄을 누르거나 흔들어 음을 꾸밉니다.',color:'#c59c63'},
 {id:'daegeum',name:'대금',family:'가로로 부는 관악기',feature:'대나무 관과 청이 만드는 숨결',description:'가로로 부는 대나무 관악기입니다. 청공에 붙인 얇은 청이 떨립니다. 숨결과 이어지는 울림을 살펴보세요.',color:'#8eaa91'},
 {id:'haegeum',name:'해금',family:'활로 켜는 현악기',feature:'두 줄 사이를 지나는 활',description:'작은 울림통 위에 두 줄을 걸고, 그 사이에 끼운 활로 켭니다. 활을 움직이는 동안 울림을 이을 수 있습니다.',color:'#cf9c85'},
 {id:'geomungo',name:'거문고',family:'술대로 뜯는 현악기',feature:'여섯 줄과 괘, 술대의 선명한 타격',description:'여섯 줄을 대나무 술대로 뜯습니다. 일부 줄 아래에 괘가 놓입니다. 낮은 울림과 소리의 첫 타격을 비교해 보세요.',color:'#b88c68'},
 {id:'piri',name:'향피리',family:'겹서 관악기',feature:'작은 관, 두 겹의 서가 만드는 또렷한 소리',description:'관 끝의 겹서를 입에 물고 세로로 붑니다. 대금의 숨결과 겹서가 떨리는 음색을 비교해 보세요.',color:'#c5b982'},
 {id:'ajaeng',name:'아쟁',family:'활로 켜는 현악기',feature:'긴 울림통 위, 굵은 줄을 문지르는 활',description:'긴 울림통 위에 굵은 줄을 걸고 활로 문질러 소리를 냅니다. 정악아쟁은 일곱 줄 모형으로 표현했습니다.',color:'#b0a78b'},
 {id:'jing',name:'징',family:'금속 타악기',feature:'넓은 금속 면이 만드는 긴 여운',description:'큰 놋쇠 원판을 채로 쳐서 울립니다. 작은 꽹과리와 울림의 높이, 퍼지고 사라지는 시간을 비교해 보세요.',color:'#d6b977'},
 {id:'kkwaenggwari',name:'꽹과리',family:'금속 타악기',feature:'작은 놋쇠 몸체의 날카로운 울림',description:'작은 놋쇠 원판을 채로 칩니다. 손으로 안쪽을 짚어 울림을 조절하기도 하며 농악과 사물놀이에서 쓰입니다.',color:'#e0c58a'},
 {id:'janggu',name:'장구',family:'가죽 타악기',feature:'두 북면과 잘록한 통, 서로 다른 타격',description:'궁편과 채편의 소리를 조합합니다. 덩은 양편을 함께, 쿵은 궁편을, 덕은 채편을 치는 이 게임의 구음입니다.',color:'#bd876b'},
];
export interface InstrumentPuzzle {title:string;level:string;answers:InstrumentId[];ensemble:InstrumentId[];music:string;clue:string;hints:string[];}
export const instrumentPuzzles:InstrumentPuzzle[]=[
 {title:'뜯긴 소리의 빈자리',level:'01 · 소리의 시작',answers:['gayageum'],ensemble:['gayageum','daegeum','haegeum'],music:'세마치 산책',clue:'전시 기록: “열두 줄이 각각 안족에 기대어 있었다.”',hints:['톡 시작해 잦아드는 소리의 층이 있는지 살펴보세요.','활로 켜는 악기와 손으로 뜯는 악기를 구별하세요.','열두 줄과 안족을 가진 가야금의 자리입니다.']},
 {title:'합주에서 멎은 숨',level:'02 · 지속과 숨결',answers:['daegeum'],ensemble:['gayageum','daegeum','haegeum','geomungo'],music:'느린 뜰',clue:'전시 기록: “긴 대나무 관에는 청공이 있었다.”',hints:['완성 예시의 숨결과 막의 떨림에 집중하세요.','겹서 악기와 가로로 부는 악기를 구별하세요.','청이 울리는 대금이 빠졌습니다.']},
 {title:'두 줄 사이의 흔적',level:'03 · 활의 마찰',answers:['haegeum'],ensemble:['haegeum','ajaeng','piri','gayageum'],music:'활의 대화',clue:'전시 기록: “작은 울림통 위 두 줄, 그 사이에 활이 지나갔다.”',hints:['두 활 소리 가운데 더 작은 악기의 소리를 찾으세요.','긴 통의 아쟁과 두 줄의 해금을 비교하세요.','되찾을 악기는 해금입니다.']},
 {title:'술대가 남긴 첫 타격',level:'04 · 비슷한 음색 구별',answers:['geomungo'],ensemble:['geomungo','gayageum','ajaeng','daegeum'],music:'여섯 줄의 밤',clue:'전시 기록: “여섯 줄, 높이가 다른 괘, 대나무 술대.”',hints:['두 뜯는 악기의 낮은 울림과 첫 타격을 비교하세요.','손가락 대신 술대를 쓰는 악기를 찾으세요.','거문고의 여섯 줄을 복원하세요.']},
 {title:'서로 다른 두 층의 실종',level:'05 · 두 악기 동시 추리',answers:['piri','ajaeng'],ensemble:['piri','ajaeng','haegeum','gayageum','daegeum'],music:'겹과 결',clue:'전시 기록: “한쪽은 겹서, 다른 한쪽은 긴 통에 걸린 굵은 줄.”',hints:['관악기와 활로 켜는 악기를 하나씩 찾으세요.','대금과 향피리, 해금과 아쟁을 비교하세요.','향피리와 아쟁을 함께 선택하세요.']},
 {title:'금속의 여운을 되찾다',level:'06 · 다섯 층의 합주',answers:['jing','kkwaenggwari'],ensemble:['jing','kkwaenggwari','janggu','piri','geomungo'],music:'마당의 빛',clue:'전시 기록: “크고 작은 두 놋쇠 원판이 사라졌다.”',hints:['긴 여운과 날카로운 타격이 함께 사라졌습니다.','가죽 타악기와 금속 타악기를 구별하세요.','징과 꽹과리를 함께 복원하세요.']},
];
export const strokes:{id:Stroke;label:string;description:string}[]=[{id:'deong',label:'덩',description:'양편 함께'},{id:'kung',label:'쿵',description:'궁편'},{id:'ttak',label:'덕',description:'채편'},{id:'rest',label:'쉼',description:'새 타격 없음'}];
export const semachi:Stroke[]=['deong','rest','rest','deong','rest','ttak','kung','ttak','rest'];
export interface RhythmPuzzle {id:string;name:string;title:string;beats:number;subdivisions:number;step:number;pattern:Stroke[];blanks:number[];rotation:number;description:string;}
// Simplified teaching arrangements, not a unique performance form of a jangdan.
export const rhythmPuzzles:RhythmPuzzle[]=[
 {id:'semachi',name:'세마치',title:'세 박에 숨은 쉼',beats:3,subdivisions:3,step:.30,pattern:semachi,blanks:[0,2,3,5,7],rotation:0,description:'3소박이 모인 박이 세 번 이어집니다. 소리만큼 쉼의 위치도 살펴보세요.'},
 {id:'gutgeori',name:'굿거리',title:'네 박의 빈 가락',beats:4,subdivisions:3,step:.30,pattern:['deong','rest','ttak','kung','rest','ttak','kung','ttak','ttak','kung','rest','ttak'],blanks:[0,1,3,5,7,8,10],rotation:0,description:'3소박 4박을 덩·쿵·덕으로 단순화한 학습용 가락입니다.'},
 {id:'jajinmori',name:'자진모리',title:'빠른 흐름 속 어긋난 시작',beats:4,subdivisions:3,step:.18,pattern:['deong','rest','rest','kung','rest','rest','kung','rest','ttak','kung','ttak','rest'],blanks:[0,2,3,5,6,8,9,11],rotation:3,description:'기준은 두 번째 박부터 시작합니다. 양편을 함께 치는 덩이 첫 박입니다. 장단의 시작을 찾아 복원하세요.'},
 {id:'hwimori',name:'휘모리',title:'셋이 아닌 둘의 질서',beats:4,subdivisions:2,step:.19,pattern:['deong','rest','kung','ttak','kung','rest','kung','ttak'],blanks:[0,1,2,3,4,5,6,7],rotation:2,description:'휘모리의 2소박 4박형입니다. 기준은 두 번째 박부터, 첫 박은 덩입니다. 타격과 쉼을 모두 복원하세요.'},
];
export type TraditionId='jeongak'|'sanjo'|'sinawi';
export const musicTraditions:{id:TraditionId;name:string;description:string;clue:string;url:string}[]=[
 {id:'jeongak',name:'정악',description:'궁중음악과 선비들의 풍류방 음악을 아우르는 갈래입니다. 영산회상과 같은 기악곡도 여기에 속합니다.',clue:'궁중 · 풍류방 · 영산회상',url:'https://www.gugak.go.kr/ency/topic/view/1973'},
 {id:'sanjo',name:'산조',description:'장구 반주에 선율 악기 하나가 가락을 펼치는 기악 독주 음악입니다. 보통 느린 장단에서 빠른 장단으로 이어집니다.',clue:'선율 악기 독주 · 장구 반주 · 느림에서 빠름으로',url:'https://encykorea.aks.ac.kr/Article/E0026332'},
 {id:'sinawi',name:'시나위',description:'무속음악에 뿌리를 두며, 오늘날 무대에서는 독주나 합주로도 연주합니다. 합주에서는 여러 선율이 즉흥적으로 어우러집니다.',clue:'무속음악의 뿌리 · 즉흥성 · 여러 선율의 대화',url:'https://www.gugak.go.kr/ency/topic/view/1062'},
];
export interface ConcertPuzzle {title:string;brief:string;options:{id:string;label:string;description:string}[];answer:string;instruments:InstrumentId[];rhythm:number;tradition?:TraditionId;}
export const concertPuzzles:ConcertPuzzle[]=[
 {title:'독주자의 잃어버린 공연 메모',brief:'“느린 장단에서 빠른 장단으로 이어지는 독주 음악. 선율은 열두 줄을 손으로 뜯는 악기 하나, 반주는 장구. 이번 대목은 자진모리로 편성할 것.”',options:[{id:'duet',label:'가야금 · 거문고 · 장구',description:'두 선율 악기와 반주'},{id:'solo',label:'가야금 · 장구',description:'한 선율 악기와 반주'},{id:'bowed',label:'해금 · 장구',description:'활로 켜는 독주와 반주'}],answer:'solo',instruments:['gayageum','janggu'],rhythm:2,tradition:'sanjo'},
 {title:'서로 다른 가락의 대화',brief:'“무속음악에서 출발한 즉흥적인 선율의 대화. 청이 있는 관과 두 줄의 활, 긴 통의 활을 장구와 함께. 자진모리의 빠른 흐름을 바탕으로 할 것.”',options:[{id:'mixed',label:'대금 · 해금 · 가야금 · 장구',description:'관 하나 · 활 하나 · 뜯는 현 하나'},{id:'dialogue',label:'대금 · 해금 · 아쟁 · 장구',description:'관 하나 · 서로 다른 활 둘'},{id:'percussion',label:'징 · 꽹과리 · 장구',description:'두 금속과 가죽'}],answer:'dialogue',instruments:['daegeum','haegeum','ajaeng','janggu'],rhythm:2,tradition:'sinawi'},
 {title:'편성과 장단을 함께 읽다',brief:'“마지막은 새롭게 꾸민 창작 무대. 작은 통의 두 줄과 가로로 부는 대나무 관에 장구 반주. 3소박씩 세 박의 장단으로 마무리할 것.”',options:[{id:'wrong-strings',label:'거문고 · 대금 · 장구',description:'술대 · 청 · 반주'},{id:'wrong-band',label:'아쟁 · 향피리 · 장구',description:'긴 통 · 겹서 · 반주'},{id:'final',label:'해금 · 대금 · 장구',description:'두 줄 · 청 · 반주'}],answer:'final',instruments:['haegeum','daegeum','janggu'],rhythm:0},
];
export const referenceLinks=[
 {name:'국립국악원 · 국악박물관 상설전시',url:'https://www.gugak.go.kr/site/homepage/menu/viewMenu?menuid=001004007001'},
 {name:'서울시 · 국악박물관 전시 공간 사진',url:'https://mediahub.seoul.go.kr/archives/1250225'},
 {name:'국립국악원 · 국악기 디지털음원',url:'https://apis.gugak.go.kr/digitaleum/front/monotone/list.do'},
 {name:'국립국악원 · 박과 장단의 구조',url:'https://www.gugak.go.kr/ency/topic/view/1736'},
 {name:'국립국악원 e-국악 · 세마치 학습 예시',url:'https://academy.gugak.go.kr/dp/pds/HTML5-4-47/HTML5-4-47-3/index.htm'},
 ...musicTraditions.map(t=>({name:`음악 갈래 · ${t.name}`,url:t.url})),
 {name:'공공누리 · 이용 조건',url:'https://www.kogl.or.kr/info/license.do'},
];
