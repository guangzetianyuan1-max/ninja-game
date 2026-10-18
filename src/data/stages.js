// 武家屋敷の10の間（手で作った決まった並び・設計書 7.5）
// 1〜5＝一の太刀／6＝火遁を覚える（ぬりかべの固まり）／7〜9＝混ぜ／10＝ボス化け猫（hp 3）
// solution＝★3の答えの線（at＝指を離す時刻・秒）。tests/stages.test.js が答えを流して「★3で解ける」を確かめる
// 動く敵は move（dx, dy, period）。答えは動く敵がいちばん端にいる時（sin＝1・動きがいちばん遅い所）に通す
import { INK } from '../config.js?v=18';

export const P = (x, y) => ({ x, y });
// 輪の線：下（cx, cy+r）から始めて1周（火遁）
export const ring = (cx, cy, r, n = 36) => Array.from({ length: n + 1 }, (_, i) => {
  const a = Math.PI / 2 + (i / n) * Math.PI * 2;
  return P(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)));
});
export const F = (id, type, x, y, move) => (move ? { id, type, x, y, move } : { id, type, x, y });

export const STAGES = [
  { // 1：まっすぐ1本で3体（一の太刀の見本）
    id: 'yashiki-1', ink: INK, start: P(360, 1100), lesson: 'slash', par: [1, 2], traps: [],
    foes: [F('a', 'hitotsume', 360, 800), F('b', 'noppera', 360, 560), F('c', 'hitotsume', 360, 320)],
    solution: [{ at: 0, points: [P(360, 250)] }],
  },
  { // 2：曲がった線
    id: 'yashiki-2', ink: INK, start: P(120, 1100), par: [1, 2], traps: [],
    foes: [F('a', 'noppera', 120, 760), F('b', 'hitotsume', 360, 600), F('c', 'noppera', 600, 760)],
    solution: [{ at: 0, points: [P(120, 760), P(360, 600), P(600, 760)] }],
  },
  { // 3：まきびしが出る（まっすぐ行くと触れる）
    id: 'yashiki-3', ink: INK, start: P(360, 1100), par: [1, 2], traps: [P(360, 800)],
    foes: [F('a', 'hitotsume', 200, 700), F('b', 'noppera', 360, 400), F('c', 'hitotsume', 520, 700)],
    solution: [{ at: 0, points: [P(200, 700), P(360, 400), P(520, 700)] }],
  },
  { // 4：ゆっくり動く青行灯
    id: 'yashiki-4', ink: INK, start: P(360, 1100), par: [1, 2], traps: [],
    foes: [F('a', 'hitotsume', 200, 900), F('b', 'aoandon', 360, 600, { dx: 150, dy: 0, period: 4 }), F('c', 'noppera', 520, 350)],
    solution: [{ at: 0.868, points: [P(200, 900), P(510, 600), P(520, 350)] }],
  },
  { // 5：速い鉄鼠
    id: 'yashiki-5', ink: INK, start: P(360, 1100), par: [1, 2], traps: [],
    foes: [F('a', 'noppera', 180, 820), F('b', 'tesso', 360, 560, { dx: 0, dy: 200, period: 2 }), F('c', 'hitotsume', 540, 820)],
    solution: [{ at: 0.4, points: [P(180, 820), P(360, 760), P(540, 820)] }],
  },
  { // 6：火遁を覚える。ぬりかべは線では斬れない＝輪で囲んで燃やす
    id: 'yashiki-6', ink: INK, start: P(360, 1100), lesson: 'katon', par: [1, 2], traps: [],
    foes: [F('a', 'nurikabe', 300, 560), F('b', 'nurikabe', 420, 560), F('c', 'nurikabe', 360, 660)],
    solution: [{ at: 0, points: [P(360, 750), ...ring(360, 600, 150)] }],
  },
  { // 7：斬ってから燃やす
    id: 'yashiki-7', ink: INK, start: P(360, 1100), par: [2, 3], traps: [],
    foes: [F('a', 'hitotsume', 180, 800), F('b', 'noppera', 200, 500), F('c', 'nurikabe', 520, 420), F('d', 'nurikabe', 600, 520)],
    solution: [
      { at: 0, points: [P(180, 800), P(200, 500)] },
      { at: 2, points: [P(560, 610), ...ring(560, 470, 140)] },
    ],
  },
  { // 8：まきびし・動くろくろ首・ぬりかべの固まり
    id: 'yashiki-8', ink: INK, start: P(360, 1100), par: [2, 3], traps: [P(330, 950)],
    foes: [F('a', 'hitotsume', 160, 900), F('b', 'rokurokubi', 360, 700, { dx: 120, dy: 0, period: 4 }),
      F('c', 'nurikabe', 300, 330), F('d', 'nurikabe', 420, 330), F('e', 'noppera', 360, 420)],
    solution: [
      { at: 0.873, points: [P(160, 900), P(480, 700)] },
      { at: 3, points: [P(360, 520), ...ring(360, 370, 150)] },
    ],
  },
  { // 9：先に燃やしてから、まきびしの間を抜ける
    id: 'yashiki-9', ink: INK, start: P(120, 1100), par: [2, 3], traps: [P(520, 820), P(300, 500)],
    foes: [F('a', 'nurikabe', 160, 800), F('b', 'nurikabe', 250, 840), F('c', 'hitotsume', 420, 700),
      F('d', 'noppera', 600, 500), F('e', 'aoandon', 420, 300)],
    solution: [
      { at: 0, points: [P(205, 950), ...ring(205, 820, 130)] },
      { at: 2, points: [P(420, 700), P(600, 500), P(420, 300)] },
    ],
  },
  { // 10：ボス化け猫（3回斬る）
    id: 'yashiki-10', ink: INK, start: P(360, 1100), par: [3, 4], traps: [], hint: 'boss', // 倒し方を始めに出す
    foes: [F('boss', 'nekoma', 360, 520), F('a', 'hitotsume', 160, 300), F('b', 'hitotsume', 560, 300)],
    solution: [
      { at: 0, points: [P(360, 520), P(160, 300)] },
      { at: 2, points: [P(360, 520), P(560, 300)] },
      { at: 4, points: [P(360, 520), P(360, 800)] },
    ],
  },
];

// その間で火遁を使えるか（6番の間で覚える＝6番から後）
export const katonFor = (stage) => STAGES.indexOf(stage) >= STAGES.findIndex((s) => s.lesson === 'katon');
