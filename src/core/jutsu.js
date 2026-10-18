// 術の判定（画面から離した純粋な関数・tests/katon.test.js）
// 火遁：線の終わりの点が、線に沿って LOOP_GAP 以上前の点から LOOP_CLOSE 以内に戻ったら「輪を閉じた」。小さすぎる輪は数えない
export const LOOP_CLOSE = 60;       // 閉じたとみなす距離（px）
export const LOOP_GAP = 200;        // 線に沿ってこれ以上前の点でないと輪にしない（往復の線を輪と取り違えない）
export const LOOP_MIN_AREA = 15000; // 輪の面積の下限（px²）

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s += a.x * b.y - b.x * a.y; }
  return Math.abs(s) / 2;
}

// 輪の多角形（点の並び）か null。いちばん大きい輪（線の頭に近い所から閉じた輪）を返す
export function findLoop(points) {
  if (points.length < 4) return null;
  const last = points[points.length - 1];
  const fromEnd = new Array(points.length).fill(0); // その点から線の終わりまでの長さ
  for (let i = points.length - 2; i >= 0; i--) fromEnd[i] = fromEnd[i + 1] + dist(points[i], points[i + 1]);
  for (let j = 0; j < points.length - 2; j++) {
    if (fromEnd[j] < LOOP_GAP || dist(points[j], last) > LOOP_CLOSE) continue;
    const poly = points.slice(j);
    if (area(poly) >= LOOP_MIN_AREA) return poly;
  }
  return null;
}

// 点が多角形の中か（偶奇の数え方）
export function inside(poly, p) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
