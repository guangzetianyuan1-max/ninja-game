// 間を選ぶ（key 'map'）：武家屋敷の10の間を2列×5段・星・開いていない間は鍵・図鑑へ
import { t } from '../i18n/i18n.js?v=5';
import { textStyle, buttonStyle, GOLD } from '../ui/text.js?v=5';
import { crisp } from '../ui/pixel.js?v=5';
import { W } from '../config.js?v=5';
import { loadSave, isOpen } from '../core/save.js?v=5';
import { STAGES } from '../data/stages.js?v=5';
import { platformStore } from '../platform.js?v=5';

export class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  preload() { this.load.image('bg_yashiki', 'assets/art/bg_yashiki.png'); }

  create() {
    crisp(this);
    this.add.image(0, 0, 'bg_yashiki').setOrigin(0).setScale(W / 180).setAlpha(0.55);
    const save = loadSave(platformStore()), ids = STAGES.map((s) => s.id);
    this.add.rectangle(W / 2, 110, W, 120, 0x0b0a16, 0.8);
    this.add.text(W / 2, 110, t('map.title'), textStyle(60, GOLD)).setOrigin(0.5);
    STAGES.forEach((s, i) => {
      const x = i % 2 === 0 ? 200 : 520, y = 260 + Math.floor(i / 2) * 170;
      const open = isOpen(save, i, ids), stars = save.stars[s.id] ?? 0;
      const box = this.add.rectangle(x, y, 280, 140, open ? 0x2b2140 : 0x15131f, 0.92).setStrokeStyle(4, open ? 0xc9a227 : 0x3a3550);
      this.add.text(x, y - 26, t('play.stage', { n: i + 1 }), textStyle(36, open ? '#f3e6c0' : '#6d6884')).setOrigin(0.5);
      this.add.text(x, y + 32, open ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '—', textStyle(40, GOLD)).setOrigin(0.5);
      if (open) box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('play', { index: i }));
    });
    this.button(W / 2 - 160, 1150, t('map.collection'), () => this.scene.start('collection'));
    this.button(W / 2 + 160, 1150, t('map.back'), () => this.scene.start('title'));
  }

  button(x, y, label, fn) {
    const r = this.add.rectangle(x, y, 280, 90, 0xe0a83a).setStrokeStyle(3, 0xf3e6c0);
    this.add.text(x, y, label, buttonStyle(40)).setOrigin(0.5);
    this.time.delayedCall(400, () => r.setInteractive({ useHandCursor: true }).on('pointerup', fn)); // 開いた直後のたたきは数えない
  }
}
