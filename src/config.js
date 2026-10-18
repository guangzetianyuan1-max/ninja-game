// 芯の数（設計書 3・本人が試作で「ちょうど」と言った値。DASH_SPEED と HIT_R は変えない）
export const W = 720, H = 1280;
export const DASH_SPEED = 5200; // 駆け抜ける速さ（px/秒）
export const HIT_R = 52;        // 線から何 px 以内の敵を斬るか
export const INK = 1500;        // 1本の線で引ける長さ（間ごとに変えてよい）
export const TRAP_R = 40;       // 罠の当たり
export const HITSTOP = 0.05;    // 斬った瞬間に止める秒
export const MIN_STROKE = 40;   // これより短い線は手数に数えない
export const DRAW_SLOW = 0.3;   // 線を引いている間の敵の時間の倍率
export const STEP = 8;          // 指がこれより動かない時は線に点を足さない
