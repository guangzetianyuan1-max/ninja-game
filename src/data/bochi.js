// 夜の墓地の10の間（設計書 2026-10-18-ninja-bochi-design 6）
// walls＝墓石（中心・当たりは config の WALL）。traps の kind:'hitodama'＝人魂（move で行き来）
// solution の mark＝縮地の印の点（points の何番目か）。印より前は飛ぶ＝斬らない・墓石と人魂を越える
// 動く物は武家屋敷と同じく、いちばん端（sin＝±1）か、通る時の場所で当たるように at を決めた（tests/bochi.test.js が流して確かめる）
import { INK } from '../config.js?v=17';
import { P, ring, F } from './stages.js?v=17';

const H = (x, y, move) => ({ x, y, kind: 'hitodama', move }); // 人魂
const ROW = (y) => [24, 120, 216, 312, 408, 504, 600, 696].map((x) => P(x, y)); // 端から端まで隙間のない墓石の列（96px おき＝当たりの幅 100 より狭く重ねる）
// 墓石の囲い（すき間なし）：上と下の列＋左右の柱
const BOX = [...[168, 264, 360, 456, 552].flatMap((x) => [P(x, 300), P(x, 764)]), ...[416, 532, 648].flatMap((y) => [P(168, y), P(552, y)])];

export const BOCHI = [
  { // 1：墓石の見本。まっすぐ引くと止まる＝よけて引く
    id: 'bochi-1', ink: INK, start: P(360, 1100), lesson: 'wall', par: [1, 2], traps: [], walls: [P(360, 800)],
    foes: [F('a', 'kyokotsu', 360, 560), F('b', 'onmoraki', 360, 330)],
    solution: [{ at: 0, points: [P(200, 800), P(360, 560), P(360, 330)] }],
  },
  { // 2：墓石のすき間と、動く狐火
    id: 'bochi-2', ink: INK, start: P(360, 1100), par: [1, 2], traps: [], walls: [P(260, 760), P(460, 760)],
    foes: [F('a', 'kitsunebi', 360, 560, { dx: 160, dy: 0, period: 4 }), F('b', 'kyokotsu', 160, 400), F('c', 'onmoraki', 560, 400)],
    solution: [{ at: 1, points: [P(360, 640), P(520, 560), P(560, 400), P(160, 400)] }],
  },
  { // 3：人魂の見本。行き来する人魂が離れた時に通す
    id: 'bochi-3', ink: INK, start: P(360, 1100), lesson: 'hitodama', par: [1, 2], traps: [H(360, 700, { dx: 200, dy: 0, period: 3 })], walls: [],
    foes: [F('a', 'kyokotsu', 360, 880), F('b', 'kitsunebi', 360, 500), F('c', 'onmoraki', 360, 300)],
    solution: [{ at: 0.75, points: [P(360, 300)] }],
  },
  { // 4：墓石の下をくぐって、人魂が離れた時に上へ
    id: 'bochi-4', ink: INK, start: P(360, 1100), par: [1, 2], traps: [H(360, 560, { dx: 220, dy: 0, period: 3 })], walls: [P(360, 800)],
    foes: [F('a', 'onmoraki', 160, 880), F('b', 'kitsunebi', 560, 880), F('c', 'kyokotsu', 360, 320)],
    solution: [{ at: 2.25, points: [P(160, 880), P(560, 880), P(360, 320)] }],
  },
  { // 5：がしゃどくろ（2回当てる）
    id: 'bochi-5', ink: INK, start: P(360, 1100), par: [2, 3], traps: [], walls: [P(200, 800), P(520, 800)],
    foes: [F('g', 'gashadokuro', 360, 560), F('a', 'kyokotsu', 160, 380), F('b', 'onmoraki', 560, 380)],
    solution: [
      { at: 0, points: [P(360, 560), P(160, 380)] },
      { at: 2, points: [P(360, 560), P(560, 380)] },
    ],
  },
  { // 6：縮地を覚える。墓石の囲い（すき間なし）の中へ飛ぶ
    id: 'bochi-6', ink: INK, start: P(360, 1100), lesson: 'shukuchi', par: [1, 2], traps: [], walls: BOX,
    foes: [F('a', 'kyokotsu', 300, 470), F('b', 'onmoraki', 420, 470), F('c', 'kitsunebi', 360, 600)],
    solution: [{ at: 0, mark: 0, points: [P(360, 680), P(300, 470), P(420, 470)] }],
  },
  { // 7：墓石の列と人魂を飛び越える
    id: 'bochi-7', ink: INK, start: P(360, 1100), par: [1, 2], traps: [H(360, 840, { dx: 200, dy: 0, period: 3 })], walls: ROW(640),
    foes: [F('c', 'kyokotsu', 360, 450), F('a', 'kitsunebi', 180, 330, { dx: 80, dy: 0, period: 4 }), F('b', 'onmoraki', 560, 330)],
    solution: [{ at: 1, mark: 0, points: [P(360, 540), P(360, 450), P(260, 330), P(560, 330)] }],
  },
  { // 8：飛んでから火遁
    id: 'bochi-8', ink: INK, start: P(360, 1100), par: [1, 2], traps: [H(200, 880, { dx: 120, dy: 0, period: 2.5 })], walls: ROW(700),
    foes: [F('a', 'kyokotsu', 300, 440), F('b', 'onmoraki', 420, 440), F('c', 'kitsunebi', 360, 330)],
    solution: [{ at: 0, mark: 0, points: [P(360, 610), ...ring(360, 450, 150)] }],
  },
  { // 9：全部の混ぜ（速い一反木綿・人魂・がしゃどくろ）
    id: 'bochi-9', ink: INK, start: P(360, 1100), par: [2, 3], traps: [H(360, 560, { dx: 180, dy: 0, period: 3 })], walls: [P(250, 760), P(470, 760)],
    foes: [F('a', 'ittan', 360, 860, { dx: 200, dy: 0, period: 2 }), F('b', 'gashadokuro', 360, 360), F('c', 'onmoraki', 160, 300), F('d', 'kyokotsu', 560, 300)],
    solution: [
      { at: 0.5, points: [P(560, 860), P(360, 880), P(360, 360), P(160, 300)] },
      { at: 2, points: [P(360, 360), P(560, 300)] },
    ],
  },
  { // 10：ボス鬼婆（3回当てる）。墓石の列の奥・手前に人魂
    id: 'bochi-10', ink: INK, start: P(360, 1100), par: [3, 4], traps: [H(360, 860, { dx: 220, dy: 0, period: 3 })], walls: ROW(660), hint: 'bossOni',
    foes: [F('boss', 'onibaba', 360, 380, { dx: 120, dy: 0, period: 5 }), F('a', 'kyokotsu', 120, 520), F('b', 'onmoraki', 600, 520)], // 手下は鬼婆より手前（後ろだと大きな鬼婆に隠れた）
    solution: [
      { at: 0, mark: 0, points: [P(360, 560), P(360, 380), P(120, 520)] },
      { at: 2.5, points: [P(360, 380), P(600, 520)] },
      { at: 3.75, points: [P(240, 380), P(240, 560)] },
    ],
  },
];
