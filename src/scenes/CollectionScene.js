// 図鑑（key 'collection'）：2列×5段の札・押すと説明・まだ出会っていない物は「？」
import { t } from '../i18n/i18n.js?v=16';
import { textStyle, buttonStyle, GOLD } from '../ui/text.js?v=16';
import { crisp } from '../ui/pixel.js?v=16';
import { W, H, HERO_FRAME } from '../config.js?v=16';
import { loadSave } from '../core/save.js?v=16';
import { COLLECTION, visible } from '../data/collection.js?v=16';
import { FOES } from '../data/foes.js?v=16';
import { platformStore } from '../platform.js?v=16';

export class CollectionScene extends Phaser.Scene {
  constructor() { super('collection'); }

  preload() { for (const c of COLLECTION) this.load.image(`col_${c.id}`, `assets/${c.img}`); }

  create() {
    crisp(this);
    this.cameras.main.setBackgroundColor('#0b0a16');
    this.open = null; // 前に開いた札を持ち越さない（最終点検 I3）
    const save = loadSave(platformStore()), seen = COLLECTION.filter((c) => visible(c, save));
    this.add.text(W / 2, 80, t('col.title'), textStyle(56, GOLD)).setOrigin(0.5);
    this.add.text(W / 2, 140, t('col.count', { n: seen.length, m: COLLECTION.length }), textStyle(32)).setOrigin(0.5);
    COLLECTION.forEach((c, i) => {
      const x = i % 2 === 0 ? 200 : 520, y = 270 + Math.floor(i / 2) * 175, on = visible(c, save);
      const box = this.add.rectangle(x, y, 290, 155, 0x1b1838).setStrokeStyle(3, on ? 0xc9a227 : 0x3a3550);
      if (on) {
        const img = this.add.image(x - 80, y, `col_${c.id}`);
        if (c.id === 'ninjutsu' || c.id === 'katon') img.setCrop(0, 0, HERO_FRAME.w, HERO_FRAME.h).setPosition(x - 80 + HERO_FRAME.w / 2, y);
        img.setScale(Math.min(110 / img.width, 110 / img.height, 2) * (c.id === 'makibishi' ? 4 : 1));
        if (c.id === 'katon') img.setTint(0xff9a40);
        this.add.text(x + 50, y, t(`col.name.${c.id}`), textStyle(28)).setOrigin(0.5).setWordWrapWidth(170);
        box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.card(c));
      } else this.add.text(x, y, t('col.unknown'), textStyle(56, '#6d6884')).setOrigin(0.5);
    });
    const back = this.add.rectangle(W / 2, 1180, 320, 90, 0xe0a83a).setStrokeStyle(3, 0xf3e6c0);
    this.add.text(W / 2, 1180, t('col.back'), buttonStyle(40)).setOrigin(0.5);
    this.time.delayedCall(400, () => back.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('map')));
  }

  card(c) {
    if (this.open) return;
    const g = this.add.container(W / 2, H / 2).setDepth(10);
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setInteractive();
    g.add(shade);
    g.add(this.add.rectangle(0, 0, 620, 760, 0x14122a).setStrokeStyle(4, 0xc9a227));
    const img = this.add.image(0, -170, `col_${c.id}`);
    if (c.id === 'ninjutsu' || c.id === 'katon') img.setCrop(0, 0, HERO_FRAME.w, HERO_FRAME.h).setPosition(HERO_FRAME.w / 2, -170);
    img.setScale(Math.min(260 / img.width, 260 / img.height, 4) * (c.id === 'makibishi' ? 3 : 1));
    if (c.id === 'katon') img.setTint(0xff9a40);
    g.add(img);
    g.add(this.add.text(0, 10, t(`col.name.${c.id}`), textStyle(48, GOLD)).setOrigin(0.5));
    if (c.kind === 'foe') g.add(this.add.text(0, 70, t('col.weak', { list: FOES[c.id].weak.map((j) => t(`jutsu.${j}`)).join(' / ') }), textStyle(32, '#ff9a40')).setOrigin(0.5)); // 効く術
    g.add(this.add.text(0, 190, t(`col.desc.${c.id}`), { ...textStyle(32), wordWrap: { width: 540, useAdvancedWrap: true } }).setOrigin(0.5));
    g.add(this.add.text(0, 320, t('col.close'), textStyle(36)).setOrigin(0.5));
    this.open = g;
    this.time.delayedCall(300, () => shade.once('pointerup', () => { g.destroy(); this.open = null; }));
  }
}
