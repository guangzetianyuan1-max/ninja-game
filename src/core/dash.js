// 駆け抜けの結果（画面から離した純粋な関数・tests/dash.test.js）
// 指を離した時に1回だけ呼び、結果を画面が絵にする（一時停止で途中から戻っても同じ結果＝Review Focus 4）
// 敵 foe = {id, x, y, move?: {dx, dy, period}, shield?: true, hp?: number}（shield と hp は呼ぶ側が敵の表から写して渡す）
import { DASH_SPEED, HIT_R, TRAP_R } from '../config.js?v=7';
import { pathLength, pointAt } from './path.js?v=7';
import { findLoop, inside } from './jutsu.js?v=7';

const SAMPLE = 10; // 線の上を何 px ごとに見るか

export function foePos(foe, t) {
  if (!foe.move) return { x: foe.x, y: foe.y };
  const s = Math.sin((2 * Math.PI * t) / foe.move.period);
  return { x: foe.x + foe.move.dx * s, y: foe.y + foe.move.dy * s };
}

// 返す物：blocked＝刀が通ったのに斬れなかった盾の敵・kills＝倒した敵（d の小さい順）・hits＝倒れずに hp が1減った敵（ボス）・trapHit＝触れた罠・end＝忍者が止まった所・len＝走った長さ
//   burn＝火遁の輪（katon が true で輪を閉じた時だけ）
export function resolveDash({ foes, traps, points, t0, katon = false }) {
  const total = pathLength(points);
  const done = new Set(), kills = [], hits = [], blocked = [], seenShield = new Set();
  let trapHit = null, d = 0, end = pointAt(points, total);
  for (;;) {
    const p = pointAt(points, d), t = t0 + d / DASH_SPEED;
    const ti = traps.findIndex((tr) => Math.hypot(tr.x - p.x, tr.y - p.y) < TRAP_R);
    if (ti >= 0) { trapHit = { index: ti, d }; end = p; break; }
    for (const f of foes) {
      if (done.has(f.id)) continue;
      const q = foePos(f, t);
      if (Math.hypot(q.x - p.x, q.y - p.y) > HIT_R) continue;
      if (f.shield) { if (!seenShield.has(f.id)) { seenShield.add(f.id); blocked.push({ id: f.id, d }); } continue; } // 刀が通ったが斬れない（画面が「斬れない」と出す）
      done.add(f.id);
      ((f.hp ?? 1) > 1 ? hits : kills).push({ id: f.id, d });
    }
    if (d >= total) break;
    d = Math.min(total, d + SAMPLE);
  }
  const len = trapHit ? trapHit.d : total;
  let burn = null;
  if (katon && !trapHit) {
    burn = findLoop(points);
    if (burn) {
      const t = t0 + total / DASH_SPEED;
      for (const f of foes) {
        if (!inside(burn, foePos(f, t))) continue;
        if (done.has(f.id) && (f.hp ?? 1) <= 1) continue; // 斬って倒した敵はもう一度数えない
        if ((f.hp ?? 1) > 1) {
          if (!done.has(f.id)) { done.add(f.id); hits.push({ id: f.id, d: total }); }
          continue;
        }
        done.add(f.id);
        kills.push({ id: f.id, d: total });
      }
    }
  }
  return { kills, hits, blocked, trapHit, end: { x: end.x, y: end.y }, len, burn };
}

export const starsFor = (moves, par) => (moves <= par[0] ? 3 : moves <= par[1] ? 2 : 1);
