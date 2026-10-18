// 記録（画面から離した純粋な関数・tests/save.test.js）
// 置き場は platformStore()（Playables＝SDK の saveData・Web＝localStorage）。壊れた記録・前の版の記録は、はじめからとして読む
export const SAVE_KEY = 'ninja.save';
export const freshSave = () => ({ v: 1, stars: {}, katon: false, shukuchi: false, seen: [], best: {} }); // best＝間ごとの最高点（10/18 点数を足した・前の記録に無くても読める）

function valid(o) {
  if (!o || typeof o !== 'object' || o.v !== 1) return false;
  if (!o.stars || typeof o.stars !== 'object' || Array.isArray(o.stars)) return false;
  if (!Object.values(o.stars).every((n) => Number.isInteger(n) && n >= 1 && n <= 3)) return false;
  if (o.best !== undefined && (!o.best || typeof o.best !== 'object' || Array.isArray(o.best) || !Object.values(o.best).every((n) => Number.isInteger(n) && n >= 0))) return false;
  if (o.shukuchi !== undefined && typeof o.shukuchi !== 'boolean') return false; // 夜の墓地（10/18）で足した・前の記録に無くても読める
  return typeof o.katon === 'boolean' && Array.isArray(o.seen) && o.seen.every((s) => typeof s === 'string');
}

export function loadSave(store) {
  try {
    const o = JSON.parse(store?.getItem(SAVE_KEY) ?? 'null');
    return valid(o) ? { v: 1, stars: { ...o.stars }, katon: o.katon, shukuchi: !!o.shukuchi, seen: [...o.seen], best: { ...(o.best ?? {}) } } : freshSave();
  } catch { return freshSave(); }
}

export function writeSave(store, save) {
  try { store?.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 保存できない端末でも遊びは続ける */ }
}

export const recordClear = (save, id, stars) => ({ ...save, stars: { ...save.stars, [id]: Math.max(stars, save.stars[id] ?? 0) } });
// index 番の間が開いているか（0 番は常に・ほかは1つ前の間に星がある時）。ids＝間の id の並び
export const isOpen = (save, index, ids) => index === 0 || !!save.stars[ids[index - 1]];
export const learnKaton = (save) => ({ ...save, katon: true });
export const learnShukuchi = (save) => ({ ...save, shukuchi: true });
export const markSeen = (save, id) => (save.seen.includes(id) ? save : { ...save, seen: [...save.seen, id] });
export const recordScore = (save, id, score) => ({ ...save, best: { ...save.best, [id]: Math.max(score, save.best?.[id] ?? 0) } });
export const totalBest = (save) => Object.values(save.best ?? {}).reduce((a, b) => a + b, 0);
// クリアの画面の集計：星の合計・取れる星の最大・最高点の合計（ids＝その場所の間の id）
export const clearSummary = (save, ids) => ({
  stars: ids.reduce((a, id) => a + (save.stars[id] ?? 0), 0),
  maxStars: ids.length * 3,
  score: ids.reduce((a, id) => a + (save.best?.[id] ?? 0), 0),
});
