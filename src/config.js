// 芯の数（設計書 3・本人が試作で「ちょうど」と言った値。DASH_SPEED と HIT_R は変えない）
export const W = 720, H = 1280;
export const DASH_SPEED = 5200; // 駆け抜ける速さ（px/秒）
export const HIT_R = 52;        // 線から何 px 以内の敵を斬るか
export const INK = 1500;        // 1本の線で引ける長さ（間ごとに変えてよい）
export const TRAP_R = 40;       // 罠の当たり
export const HITSTOP = 0.05;    // 斬った瞬間に止める秒
export const MIN_STROKE = 40;   // これより短い線は手数に数えない
export const DRAW_SLOW = 0.3;   // 線を引いている間の敵の時間の倍率
export const HERO_FRAME = { w: 80, h: 110 }; // 主人公の絵の1コマ（tools/prep_hero.py の HERO_W・HERO_H と同じ）
// 絵の大きさ（10/18 本人「もう一回り大きく」で 1.4/1.8/1.35→1.7/2.2/1.65・版16「もっと大きく」でこの値。斬れる幅 HIT_R は変えない）
export const FOE_SCALE = 2.0, BOSS_SCALE = 2.6, HERO_SCALE = 2.0;
export const STEP = 8;          // 指がこれより動かない時は線に点を足さない
