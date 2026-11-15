import type {Save} from './state';

export function renderShell(state:Save,icon:(name:string)=>string){
  return `<main class="game-shell">
    <section class="museum-panel" aria-label="박물관 탐험">
      <div id="scene"></div>
      <header class="scene-top" id="playbar" hidden>
        <span class="scene-room" id="room-label">로비</span>
        <button class="menu-button" data-action="pause">${icon('menu')} 메뉴</button>
      </header>
      <section id="entry" class="entry-screen" aria-label="게임 시작">
        <div class="entry-copy">
          <p class="entry-category">국악 탐험 퍼즐</p>
          <h1>소리탐정<span>사라진 소리를 찾아서</span></h1>
          <p class="entry-description">조용해진 박물관에 소리를 돌려주세요.<br>귀 기울여 듣고, 사라진 소리를 찾는 작은 모험.</p>
          <button class="primary entry-button" data-action="start">${icon('volume')}<span>${state.started?'이어서 탐험하기':'소리 켜고 시작하기'}</span>${icon('arrow')}</button>
          <p class="entry-note">약 5분 · 시간제한 없이 천천히</p>
        </div>
        <div class="entry-footer"><span>국악을 일상으로</span><nav aria-label="게임 정보"><button data-action="help">조작 방법</button><button data-action="sources">소개와 출처</button></nav></div>
      </section>
      <div id="game-hud" hidden>
        <div class="crosshair" aria-hidden="true"></div>
        <div class="objective-mini"><span class="objective-caption">지금 할 일</span><p id="objective-mini-text">앞의 빛나는 표식을 조사하세요.</p></div>
        <div class="main-action">
          <button id="investigate" class="primary investigate" data-action="investigate" hidden><kbd>E</kbd><span>조사하기</span></button>
          <button id="guide-action" class="primary" data-action="guide" hidden><span id="guide-label">목표로 이동하기</span>${icon('arrow')}</button>
        </div>
        <div class="movement-help"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동 <span class="control-separator">·</span> 화면 드래그로 둘러보기</span><button data-action="help">조작 방법</button></div>
        <div id="joystick" aria-label="가상 이동 조이스틱"><div id="joystick-thumb"></div></div>
      </div>
      <div class="render-fallback" id="render-fallback" hidden><h2>3D 화면을 시작할 수 없어요.</h2><p>메뉴에서 전시실로 이동하면 퍼즐을 즐길 수 있습니다.</p><button class="secondary" data-action="map">전시실 선택하기</button></div>
    </section>
  </main><div id="modal-root" hidden></div><div id="toast" role="status" aria-live="polite"></div>`;
}
