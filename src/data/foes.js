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
