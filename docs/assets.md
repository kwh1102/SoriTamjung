# 국악 정보와 자산 출처

갱신: 2026-11-20. 개별 녹음의 기준은 [manifest](../public/audio/manifest.json), 확보 과정은 [조사 기록](audio-research.md)입니다.

| 구분 | 사용한 내용 | 원출처·조건 | 가공·제작 |
|---|---|---|---|
| 실제 음원 11개 | 가야금·대금·해금·거문고·향피리·아쟁·징·꽹과리·장구 덩/쿵/덕 | [국립국악원 디지털음원](https://apis.gugak.go.kr/digitaleum/front/monotone/list.do), 선택 악기별 공공누리 제1유형 | 발췌·모노 16bit/44.1kHz·정규화·페이드. 기존 선율 3종의 미세조율은 manifest 참조. 추가 5종의 음높이는 유지 |
| 박물관 시각 참고 | 어두운 진열장·유리·목재·국소 조명 | [서울시 국악박물관 사진 기사](https://mediahub.seoul.go.kr/archives/1250225), [국립국악원 상설전시](https://www.gugak.go.kr/site/homepage/menu/viewMenu?menuid=001004007001) | 사진을 관찰해 가상 공간 설계. 사진 파일은 게임에 포함하지 않음 |
| 장단 | 세마치·굿거리·자진모리·휘모리의 박 구조 | [국립국악원 박과 장단](https://www.gugak.go.kr/ency/topic/view/1736), [e-국악 세마치](https://academy.gugak.go.kr/dp/pds/HTML5-4-47/HTML5-4-47-3/index.htm) | 세마치 예시와 학습용 12/8소박 가락. 휘모리는 2소박 4박형 |
| 음악 갈래 | 정악·산조·시나위의 배경과 편성 | 국립국악원 [정악](https://www.gugak.go.kr/ency/topic/view/1973)·[시나위](https://www.gugak.go.kr/ency/topic/view/1062), 한국학중앙연구원 [산조](https://encykorea.aks.ac.kr/Article/E0026332) | 사실을 참고해 설명·공연 메모 직접 작성. 해당 사전의 사진·음원·악보 미사용 |
| 3D 공간과 악기 | 4개 공간, 9종 악기, 진열장, 원형 장단판, 무대 | 프로젝트 코드로 제작 | 곡면·회전체·줄·괘·안족 등 교육용 모형. 정밀 실물 복원 아님 |
| 재질 | 나뭇결·석재·직물·회벽·놋쇠 | Canvas로 직접 생성 | 외부 텍스처·출처 미상 이미지 없음 |
| 아이콘 | Lucide 0.468.0 | ISC, 패키지 LICENSE | 크기·색 조절 |
| 런타임 | Three.js 0.180.0 | MIT, 패키지 LICENSE | 공간 렌더링 |
| 글꼴 | Noto Sans KR·Noto Serif KR·DM Sans | Google Fonts, SIL OFL | 선택 로딩, 연결 실패 시 시스템 글꼴 |

합주·무대 소리는 실제 단음으로 제작한 짧은 창작 음형입니다. 갈래의 실제 악곡 녹음이나 고유 연주 양식을 재현한 자료가 아닙니다. 국악사전 복합매체와 디지털 단음 서비스의 이용 조건은 다릅니다. 게임에 배포한 음원은 후자의 제1유형 자료만 사용합니다.
