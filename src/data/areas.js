// 場所の並び（武家屋敷 → 夜の墓地）と、全部の間をつないだ並び（画面はこちらを使う）
// STAGES（武家屋敷の10）は今のまま＝katonFor と今の試験を壊さない（設計書 2026-10-18-ninja-bochi-design 8.5）
import { STAGES } from './stages.js?v=18';
import { BOCHI } from './bochi.js?v=18';

export const AREAS = [
  { id: 'yashiki', bg: 'bg_yashiki', stages: STAGES },
  { id: 'bochi', bg: 'bg_bochi', stages: BOCHI },
];
export const ALL_STAGES = AREAS.flatMap((a) => a.stages);

// 全部の並びの index 番の間は、どの場所の何番目か（a＝場所の番号・local＝場所の中の番号 0 から）
export function areaOf(index) {
  let i = index;
  for (let a = 0; a < AREAS.length; a++) {
    if (i < AREAS[a].stages.length) return { a, area: AREAS[a], local: i };
    i -= AREAS[a].stages.length;
  }
  return { a: AREAS.length - 1, area: AREAS[AREAS.length - 1], local: AREAS[AREAS.length - 1].stages.length - 1 };
}
export const areaStart = (a) => AREAS.slice(0, a).reduce((n, x) => n + x.stages.length, 0);

// その間で使える術（教えの間で覚える＝そこから後の間は全部）
export function jutsuFor(stage) {
  const i = ALL_STAGES.indexOf(stage), at = (k) => ALL_STAGES.findIndex((s) => s.lesson === k);
  return { katon: i >= at('katon'), shukuchi: i >= at('shukuchi') };
}
