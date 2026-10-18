// 敵の表（武家屋敷）。絵＝福島昔話クエストRPGのドット絵の写し（tools/prep_art.py が assets/foes/ へ写す）
// weak＝その敵を倒せる術（10/18 本人「どの敵にどの術が効くか分かるように」＝遊ぶ画面の印と図鑑に出す）
// 動き（ゆっくり・速い）は間ごとの並び（src/data/stages.js の move）で決める。ここは種類ごとに変わらない物だけ
export const FOES = {
  hitotsume: { img: 'foes/hitotsume.png', nameKey: 'foe.hitotsume', weak: ['slash', 'katon'] },
  noppera: { img: 'foes/noppera.png', nameKey: 'foe.noppera', weak: ['slash', 'katon'] },
  aoandon: { img: 'foes/aoandon.png', nameKey: 'foe.aoandon', weak: ['slash', 'katon'] },
  rokurokubi: { img: 'foes/rokurokubi.png', nameKey: 'foe.rokurokubi', weak: ['slash', 'katon'] },
  tesso: { img: 'foes/tesso.png', nameKey: 'foe.tesso', weak: ['slash', 'katon'] },
  nurikabe: { img: 'foes/nurikabe.png', nameKey: 'foe.nurikabe', shield: true, weak: ['katon'] }, // 盾＝線では斬れない・火遁でだけ倒せる
  nekoma: { img: 'foes/nekoma.png', nameKey: 'foe.nekoma', hp: 3, boss: true, weak: ['slash', 'katon'] }, // 武家屋敷のボス（福島RPGの猫魔ヶ岳の化け猫）
  // 夜の墓地（10/18・設計書 2026-10-18-ninja-bochi-design）。scale＝画面の大きさ（無ければ FOE_SCALE・ボスは BOSS_SCALE）
  kitsunebi: { img: 'foes/kitsunebi.png', nameKey: 'foe.kitsunebi', weak: ['slash', 'katon'] },
  onmoraki: { img: 'foes/onmoraki.png', nameKey: 'foe.onmoraki', weak: ['slash', 'katon'] },
  kyokotsu: { img: 'foes/kyokotsu.png', nameKey: 'foe.kyokotsu', weak: ['slash', 'katon'] },
  ittan: { img: 'foes/ittan.png', nameKey: 'foe.ittan', weak: ['slash', 'katon'] },
  gashadokuro: { img: 'foes/gashadokuro.png', nameKey: 'foe.gashadokuro', hp: 2, scale: 2.6, weak: ['slash', 'katon'] }, // 巨大な骸骨＝絵は骨だけで小さい→鬼婆と同じ大きさに
  onibaba: { img: 'foes/onibaba.png', nameKey: 'foe.onibaba', hp: 3, boss: true, weak: ['slash', 'katon'] }, // 墓地のボス（福島RPGの安達ヶ原の鬼婆）
};

// 間に置いた敵に、表の shield と hp を写す（src/core/dash.js は表を読まない＝計算を表から離す）
export function foeFlags(placed) {
  const f = FOES[placed.type];
  const out = { ...placed };
  if (f?.shield) out.shield = true;
  if (f?.hp && placed.hp === undefined) out.hp = f.hp;
  return out;
}

// 刀（一の太刀）では倒せない敵に要る術（印に出す）。刀で倒せる敵は null
export function needsJutsu(type) {
  const w = FOES[type]?.weak ?? [];
  return w.includes('slash') ? null : (w[0] ?? null);
}

// 頭に出す術の印：ボスは効く術を全部（10/18 本人「大きな猫が『火遁』であれば、表示が欲しい」）・刀で斬れない敵は要る術・ほかは出さない（画面を散らかさない）
export function badgeMarks(type) {
  const f = FOES[type];
  if (!f) return [];
  if (f.boss) return [...f.weak];
  const j = needsJutsu(type);
  return j ? [j] : [];
}
