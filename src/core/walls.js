// 墓石（線が止まる壁）と縮地の印（画面から離した純粋な関数・tests/walls.test.js・夜の墓地 10/18）
// 墓石 = {x, y}（中心）。当たりは config の WALL の長方形
// 縮地：線を引く途中で指を止めると印。印は「墓石か人魂をまたいだ後」の止めでだけ出す（本人に聞いた案 A＝考えて止めただけでは飛ばない）
import { WALL, TRAP_R } from '../config.js?v=18';
import { pathLength, pointAt } from './path.js?v=18';
import { foePos } from './move.js?v=18';

export const SHUKU_HOLD = 0.4;   // 止める秒（画面が本当の時間で数える）
export const SHUKU_STILL = 30;   // この px 以内なら止まっている（10/18 本人「6がクリアできない」＝12px ではスマホの指の揺れで数え直しになった）
export const SHUKU_TRAVEL = 60;  // 指がこれだけ動いてからの止めだけ数える（引き始めの迷いを拾わない）
const SAMPLE = 10;

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

// 今の線の終わりに縮地の印を置けるか：置けるなら印の d（＝線の長さ）、置けないなら null。止めた時間は画面が数える
export function markAt(stroke, { walls = [], traps = [], t = 0, travel = 0 }) {
  if (stroke.clipped || stroke.mark != null || travel < SHUKU_TRAVEL) return null;
  const pts = stroke.points, total = pathLength(pts);
  if (inWall(pts[pts.length - 1], walls)) return null; // 墓石の中には降りない
  const now = traps.map((tr) => foePos(tr, t));
  for (let d = 0; ; d = Math.min(total, d + SAMPLE)) {
    const p = pointAt(pts, d);
    if (inWall(p, walls) || now.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < TRAP_R)) return total;
    if (d >= total) return null;
  }
}
