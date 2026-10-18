// 図鑑（武家屋敷の分・10項目）。文は i18n の col.name.<id>・col.desc.<id>
// 文は出典の辞典で確かめた本当の事だけ（相撲 v56 のやり方：言い切れない物は書かない）。出典の URL は docs/collection_sources.md（src に外の URL を置かない決まり）
export const COLLECTION = [
  { id: 'hitotsume', kind: 'foe', img: 'foes/hitotsume.png', sources: ['kotobank:一つ目小僧'] },
  { id: 'noppera', kind: 'foe', img: 'foes/noppera.png', sources: ['kotobank:のっぺらぼう'] },
  { id: 'aoandon', kind: 'foe', img: 'foes/aoandon.png', sources: ['kotobank:青行灯'] },
  { id: 'rokurokubi', kind: 'foe', img: 'foes/rokurokubi.png', sources: ['kotobank:轆轤首'] },
  { id: 'tesso', kind: 'foe', img: 'foes/tesso.png', sources: ['kotobank:鉄鼠'] },
  { id: 'nurikabe', kind: 'foe', img: 'foes/nurikabe.png', sources: ['kotobank:塗壁'] },
  { id: 'nekoma', kind: 'foe', img: 'foes/nekoma.png', sources: ['kotobank:化け猫'] },
  { id: 'ninjutsu', kind: 'jutsu', img: 'art/hero.png', sources: ['kotobank:忍術'] },
  { id: 'katon', kind: 'jutsu', img: 'art/hero.png', sources: ['kotobank:火遁', 'kotobank:忍術'] },
  { id: 'makibishi', kind: 'tool', img: 'art/makibishi.png', sources: ['kotobank:菱'] },
];

// 見える物：忍術は最初から・火遁は覚えたら・敵と忍具は出会ったら（save.seen）
export function visible(item, save) {
  if (item.id === 'ninjutsu') return true;
  if (item.id === 'katon') return !!save.katon;
  return save.seen.includes(item.id);
}
