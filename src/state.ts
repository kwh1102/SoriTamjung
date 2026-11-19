import {concertPuzzles,instrumentPuzzles,rhythmPuzzles} from './data';
import type {ConcertPuzzle,InstrumentId,RoomId,Stroke} from './data';
export const SAVE_KEY='sori-detective:v1';
export interface Save {version:2;instrument:number;rhythm:number;concert:number;room:RoomId;volume:number;muted:boolean;speed:number;sensitivity:number;started:boolean;completed:boolean;}
export const defaults:Save={version:2,instrument:0,rhythm:0,concert:0,room:'lobby',volume:.65,muted:false,speed:3,sensitivity:1,started:false,completed:false};
export function sanitize(value:unknown):Save {
 const v=value&&typeof value==='object'?value as Partial<Omit<Save,'version'>>&{version?:number}:{};
 const number=(n:unknown,min:number,max:number,fallback:number)=>typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
 const s:Save={...defaults,instrument:Math.floor(number(v.instrument,0,instrumentPuzzles.length,0)),rhythm:Math.floor(number(v.rhythm,0,rhythmPuzzles.length,0)),concert:Math.floor(number(v.concert,0,concertPuzzles.length,0)),volume:number(v.volume,0,1,.65),speed:number(v.speed,1.5,5,3),sensitivity:number(v.sensitivity,.3,2.5,1),muted:v.muted===true,started:v.started===true,completed:v.completed===true};
 // The first three legacy restorations match the same instruments in v2.
 if(v.version!==2){s.instrument=Math.min(s.instrument,3);s.rhythm=0;s.concert=0;s.completed=false;}
 if(s.instrument<instrumentPuzzles.length)s.rhythm=0;if(s.rhythm<rhythmPuzzles.length)s.concert=0;
 s.completed=s.completed&&s.concert===concertPuzzles.length;
 s.room=['lobby','instruments','rhythm','hall'].includes(v.room as string)?v.room!:'lobby';if(!unlocked(s,s.room))s.room='lobby';return s;
}
export function loadSave():Save {try{return sanitize(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{return {...defaults};}}
export function storeSave(s:Save){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
export function unlocked(s:Pick<Save,'instrument'|'rhythm'>,room:RoomId){return room==='lobby'||room==='instruments'||room==='rhythm'&&s.instrument===instrumentPuzzles.length||room==='hall'&&s.rhythm===rhythmPuzzles.length;}
export function progress(s:Save){return Math.round((s.instrument+s.rhythm+s.concert)/(instrumentPuzzles.length+rhythmPuzzles.length+concertPuzzles.length)*100);}
export function recordPuzzleCompletion(s:Save,kind:'instrument'|'rhythm'|'concert',index:number){const total=kind==='instrument'?instrumentPuzzles.length:kind==='rhythm'?rhythmPuzzles.length:concertPuzzles.length;if(!Number.isInteger(index)||index<0||index>=total||index>s[kind])return;if(kind==='rhythm'&&!unlocked(s,'rhythm')||kind==='concert'&&!unlocked(s,'hall'))return;s[kind]=Math.max(s[kind],index+1);}
export function restoredInstruments(s:Pick<Save,'instrument'>):InstrumentId[]{return instrumentPuzzles.slice(0,s.instrument).flatMap(p=>p.answers);}
export function sameSelection(selected:InstrumentId[],answers:InstrumentId[]){return new Set(selected).size===answers.length&&selected.length===answers.length&&answers.every(id=>selected.includes(id));}
export function matchesConcert(p:ConcertPuzzle,band:string,rhythm:number,tradition:string){return band===p.answer&&rhythm===p.rhythm&&(!p.tradition||tradition===p.tradition);}
export function rhythmErrors(board:(Stroke|null)[],pattern:Stroke[]){if(board.length!==pattern.length)return pattern.map((_,i)=>i);return pattern.flatMap((s,i)=>s!==board[i]?[i]:[]);}
export function rotatePattern<T>(pattern:T[],offset:number):T[]{return pattern.map((_,i)=>pattern[(i+offset)%pattern.length]);}
export function canOccupy(x:number,z:number,s:Pick<Save,'instrument'|'rhythm'>){
 const r=.28;if(Math.abs(x)>11.7-r||Math.abs(z)>8.7-r)return false;
 if(Math.abs(x)<r+.12&&Math.abs(Math.abs(z)-4.5)>1.25-r)return false;if(Math.abs(z)<r+.12&&Math.abs(Math.abs(x)-6)>1.25-r)return false;
 if(x>-.28&&z<0&&s.instrument<instrumentPuzzles.length)return false;if(x>-.28&&z>=0&&s.rhythm<rhythmPuzzles.length)return false;
 const obstacles=[[-10.1,-7,1.1,.8],[-7.4,-7,1.1,.8],[-4.7,-7,1.1,.8],[-2,-7,1.1,.8],[-10.4,-3.8,.8,1.1],[-2,-3.8,.8,1.1],[-10.4,-1.3,.8,.8],[-2,-1.3,.8,.8],[8,-6,1.8,1.2],[4,-5.8,1.3,1],[-9,6,1.25,1.25],[7,6.6,3.3,1.5]];
 return !obstacles.some(([cx,cz,hx,hz])=>Math.abs(x-cx)<hx+r&&Math.abs(z-cz)<hz+r);
}
