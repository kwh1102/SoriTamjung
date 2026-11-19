// Use the device viewport, not the canvas shape, which changes when a puzzle opens.
export const portraitViewQuery='(max-width: 1000px) and (orientation: portrait) and (pointer: coarse)';
export function isPortraitView(){return window.matchMedia(portraitViewQuery).matches;}
