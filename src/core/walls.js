// 墓石（線が止まる壁）（画面から離した純粋な関数・tests/walls.test.js・夜の墓地 10/18）
// 墓石 = {x, y}（中心）。当たりは config の WALL の長方形
// 縮地＝覚えた後は墓石をまたいで引くと飛び越える（resolveDash の hop）。⛔10/18「指を止めると印」は本人「ムリ」でやめた
import { WALL } from '../config.js?v=19';
import { pathLength, pointAt } from './path.js?v=19';

export const SAMPLE = 10; // 線の上を何 px ごとに見るか（dash.js と同じ）

export const wallAt = (p, walls) => walls.findIndex((w) => Math.abs(p.x - w.x) < WALL.w / 2 && Math.abs(p.y - w.y) < WALL.h / 2);
export const inWall = (p, walls) => wallAt(p, walls) >= 0;

// 線の頭から from より先で、最初に墓石に入る所（無ければ null）＝画面はそこから先の線を灰色にする
export function firstWallD(points, walls, from = 0) {
  if (!walls.length) return null;
  const total = pathLength(points);
  for (let d = Math.max(0, from); ; d = Math.min(total, d + SAMPLE)) {
    if (inWall(pointAt(points, d), walls)) return d;
    if (d >= total) return null;
  }
}

// 線が墓石の上を通る所の一覧 [{a, b}]（a＝入る所・b＝出る所・線が墓石の中で終わる時は b＝null）。縮地で飛び越える所・画面の描き分け
export function wallSpans(points, walls) {
  const out = [];
  if (!walls.length) return out;
  const total = pathLength(points);
  let open = null;
  for (let d = 0; ; d = Math.min(total, d + SAMPLE)) {
    const inside = inWall(pointAt(points, d), walls);
    if (inside && open === null) open = d;
    if (!inside && open !== null) { out.push({ a: open, b: d }); open = null; }
    if (d >= total) break;
  }
  if (open !== null) out.push({ a: open, b: null });
  return out;
}
