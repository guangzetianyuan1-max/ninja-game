// 線の計算（画面から離した純粋な関数・tests/path.test.js）
// 線は忍者の今の場所から始まる。墨（ink）を使い切ったら、その所で止まり clipped=true（その後の指の動きは線にならない＝本人の決定）
import { W, H, MIN_STROKE, STEP } from '../config.js?v=14';

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export function pathLength(points) {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += dist(points[i - 1], points[i]);
  return s;
}

// 線の頭から d 進んだ点と向き（d が長さを超えたら終わりの点）
export function pointAt(points, d) {
  if (points.length === 1) return { x: points[0].x, y: points[0].y, ang: 0 };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], l = dist(a, b);
    if (l > 0 && d <= l) return { x: a.x + (b.x - a.x) * d / l, y: a.y + (b.y - a.y) * d / l, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    d -= l;
  }
  const a = points[points.length - 2], b = points[points.length - 1];
  return { x: b.x, y: b.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
}

export const clampToField = (p) => ({ x: Math.min(W, Math.max(0, p.x)), y: Math.min(H, Math.max(0, p.y)) });

export const startStroke = (from) => ({ points: [clampToField(from)], len: 0, clipped: false });

// 新しい点を足した線を返す（元は書き換えない）
export function addPoint(stroke, p, ink) {
  if (stroke.clipped) return stroke;
  const q = clampToField(p), last = stroke.points[stroke.points.length - 1], l = dist(last, q);
  if (l < STEP) return stroke;
  if (stroke.len + l <= ink) return { points: [...stroke.points, q], len: stroke.len + l, clipped: false };
  const k = (ink - stroke.len) / l; // 墨の残りの分だけ伸ばして止める
  const end = { x: last.x + (q.x - last.x) * k, y: last.y + (q.y - last.y) * k };
  return { points: k > 0 ? [...stroke.points, end] : stroke.points, len: ink, clipped: true };
}

export const isMove = (stroke) => stroke.len >= MIN_STROKE;

// 駆け抜けてよいか：線が MIN_STROKE 以上あり、指も MIN_STROKE 以上動いた（最終点検 C1：遠くをたたいただけで駆け抜けていた）
export const isSwipe = (stroke, fingerTravel) => isMove(stroke) && fingerTravel >= MIN_STROKE;
