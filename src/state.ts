import type { RoomId } from './data';
export const SAVE_KEY = 'sori-detective:v1';
export interface Save {version:1; instrument:number; rhythm:number; room:RoomId; volume:number; muted:boolean; speed:number; sensitivity:number; started:boolean; completed:boolean;}
export const defaults:Save = {version:1,instrument:0,rhythm:0,room:'lobby',volume:.65,muted:false,speed:3,sensitivity:1,started:false,completed:false};
export function sanitize(value:unknown):Save {
  const v = value && typeof value==='object' ? value as Partial<Save> : {};
  const number = (n:unknown,min:number,max:number,fallback:number) => typeof n==='number' && Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
  const s:Save = {...defaults, instrument:Math.floor(number(v.instrument,0,3,0)),rhythm:Math.floor(number(v.rhythm,0,2,0)),volume:number(v.volume,0,1,.65),speed:number(v.speed,1.5,5,3),sensitivity:number(v.sensitivity,.3,2.5,1),muted:v.muted===true,started:v.started===true,completed:v.completed===true};
  if(s.instrument<3) s.rhythm=0;
  s.completed = s.completed && s.instrument===3 && s.rhythm===2;
  s.room = ['lobby','instruments','rhythm','hall'].includes(v.room as string) ? v.room! : 'lobby';
  if(!unlocked(s,s.room)) s.room='lobby';
  return s;
}
export function loadSave():Save { try{return sanitize(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{return {...defaults};} }
export function storeSave(s:Save):boolean {try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;} }
export function unlocked(s:Save,room:RoomId) {return room==='lobby'||room==='instruments'||(room==='rhythm'&&s.instrument===3)||(room==='hall'&&s.rhythm===2);}
export function progress(s:Save) {return Math.round((s.instrument+s.rhythm+(s.completed?1:0))/6*100);}
export function recordPuzzleCompletion(s:Save,kind:'instrument'|'rhythm',index:number){
  const total=kind==='instrument'?3:2;
  if(!Number.isInteger(index)||index<0||index>=total)return;
  // Replays use their own cursor; saved restoration can only advance, up to its cap.
  s[kind]=Math.max(s[kind],index+1);
}
export function canOccupy(x:number,z:number,s:Pick<Save,'instrument'|'rhythm'>):boolean {
  const r=.28;
  if(Math.abs(x)>12-r||Math.abs(z)>9-r)return false;
  // Cross partitions have wide central doors in each half.
  if(Math.abs(x)<r+.12 && Math.abs(Math.abs(z)-4.5)>1.25-r)return false;
  if(Math.abs(z)<r+.12 && Math.abs(Math.abs(x)-6)>1.25-r)return false;
  if(x>-.28 && z<0 && s.instrument<3)return false;
  if(x>-.28 && z>=0 && s.rhythm<2)return false;
  // Major display plinths. Keep the main circulation corridors open.
  const obstacles=[[-9,-6,1.9,1.05],[-3,-6,1.45,1.05],[8,-6,1.8,1.2],[-9,6,1.25,1.25],[7,6,2.4,1.2]];
  return !obstacles.some(([cx,cz,hx,hz])=>Math.abs(x-cx)<hx+r&&Math.abs(z-cz)<hz+r);
}
