// 記録（画面から離した純粋な関数・tests/save.test.js）
// 置き場は platformStore()（Playables＝SDK の saveData・Web＝localStorage）。壊れた記録・前の版の記録は、はじめからとして読む
export const SAVE_KEY = 'ninja.save';
export const freshSave = () => ({ v: 1, stars: {}, katon: false, seen: [] });

function valid(o) {
  if (!o || typeof o !== 'object' || o.v !== 1) return false;
  if (!o.stars || typeof o.stars !== 'object' || Array.isArray(o.stars)) return false;
  if (!Object.values(o.stars).every((n) => Number.isInteger(n) && n >= 1 && n <= 3)) return false;
  return typeof o.katon === 'boolean' && Array.isArray(o.seen) && o.seen.every((s) => typeof s === 'string');
}

export function loadSave(store) {
  try {
    const o = JSON.parse(store?.getItem(SAVE_KEY) ?? 'null');
    return valid(o) ? { v: 1, stars: { ...o.stars }, katon: o.katon, seen: [...o.seen] } : freshSave();
  } catch { return freshSave(); }
}

export function writeSave(store, save) {
  try { store?.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 保存できない端末でも遊びは続ける */ }
}

export const recordClear = (save, id, stars) => ({ ...save, stars: { ...save.stars, [id]: Math.max(stars, save.stars[id] ?? 0) } });
// index 番の間が開いているか（0 番は常に・ほかは1つ前の間に星がある時）。ids＝間の id の並び
export const isOpen = (save, index, ids) => index === 0 || !!save.stars[ids[index - 1]];
export const learnKaton = (save) => ({ ...save, katon: true });
export const markSeen = (save, id) => (save.seen.includes(id) ? save : { ...save, seen: [...save.seen, id] });
