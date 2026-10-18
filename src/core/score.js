// 点数（画面から離した純粋な関数・tests/score.test.js）
// 10/18 本人「A」＝時間切れで失敗にはせず、速さを点数にする。YouTube に送れるのは「高いほど良い」整数1つ＝この点数
export const BOSS_HIT = 50;     // ボスに当てて hp を1減らした時
export const BOSS_KILL = 500;   // ボスを倒した時
export const TIME_WINDOW = 60;  // この秒より早く解くほど速さの点（1秒ごとに TIME_RATE）
const TIME_RATE = 50;
const STAR_POINTS = 1000;

// 1回の駆け抜けで n 体目に倒した敵の点（続けて倒すほど高い）
export const killPoints = (n) => 100 * n;
export const timeBonus = (sec) => Math.max(0, Math.round((TIME_WINDOW - sec) * TIME_RATE));
export const roomScore = ({ killPts, stars, sec }) => Math.round(killPts + stars * STAR_POINTS + timeBonus(sec));
