// 間を選ぶ（key 'map'・scene.start('map', {area})）：場所ごとに1枚（武家屋敷／夜の墓地）・10の間を2列×5段・星・開いていない間は鍵・図鑑へ
// 左右の「‹ ›」で場所を替える。開いた時は、いちばん進んだ場所（設計書 2026-10-18-ninja-bochi-design 8.5）
import { t } from '../i18n/i18n.js?v=19';
import { textStyle, buttonStyle, GOLD } from '../ui/text.js?v=19';
import { crisp } from '../ui/pixel.js?v=19';
import { W } from '../config.js?v=19';
import { loadSave, isOpen } from '../core/save.js?v=19';
import { AREAS, ALL_STAGES, areaStart } from '../data/areas.js?v=19';
import { platformStore } from '../platform.js?v=19';

export class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  preload() {
    for (const a of AREAS) this.load.image(a.bg, `assets/art/${a.bg}.png`);
    this.load.image('pose_kamae', 'assets/art/pose_kamae.png');
  }

  create(data) {
    crisp(this);
    const save = loadSave(platformStore()), ids = ALL_STAGES.map((s) => s.id);
    const furthest = AREAS.reduce((best, _, a) => (isOpen(save, areaStart(a), ids) ? a : best), 0);
    const a = Math.max(0, Math.min(AREAS.length - 1, data?.area ?? furthest)), area = AREAS[a], base = areaStart(a);
    this.add.image(0, 0, area.bg).setOrigin(0).setScale(W / 180).setAlpha(0.55);
    this.add.rectangle(W / 2, 110, W, 120, 0x0b0a16, 0.8);
    this.add.text(W / 2, 110, t(`area.${area.id}`), textStyle(60, GOLD)).setOrigin(0.5);
    this.add.image(W - 80, 104, 'pose_kamae').setScale(0.58); // 題の横に低い構えの忍者
    area.stages.forEach((s, i) => {
      const x = i % 2 === 0 ? 200 : 520, y = 260 + Math.floor(i / 2) * 170, g = base + i;
      const open = isOpen(save, g, ids), stars = save.stars[s.id] ?? 0;
      const box = this.add.rectangle(x, y, 280, 140, open ? 0x2b2140 : 0x15131f, 0.92).setStrokeStyle(4, open ? 0xc9a227 : 0x3a3550);
      this.add.text(x, y - 26, t('play.stage', { n: i + 1 }), textStyle(36, open ? '#f3e6c0' : '#6d6884')).setOrigin(0.5);
      this.add.text(x, y + 32, open ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '—', textStyle(40, GOLD)).setOrigin(0.5);
      if (open) box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('play', { index: g }));
    });
    // 場所を替える（‹ 前の場所・次の場所 ›）
    if (a > 0) this.flip(150, `‹ ${t(`area.${AREAS[a - 1].id}`)}`, () => this.scene.restart({ area: a - 1 }));
    if (a < AREAS.length - 1) this.flip(W - 150, `${t(`area.${AREAS[a + 1].id}`)} ›`, () => this.scene.restart({ area: a + 1 }));
    this.button(W / 2 - 160, 1150, t('map.collection'), () => this.scene.start('collection'));
    this.button(W / 2 + 160, 1150, t('map.back'), () => this.scene.start('title'));
  }

  flip(x, label, fn) {
    const r = this.add.rectangle(x, 1062, 280, 76, 0x2b2140, 0.92).setStrokeStyle(3, 0xc9a227);
    this.add.text(x, 1062, label, textStyle(32, '#f3e6c0')).setOrigin(0.5);
    this.time.delayedCall(400, () => r.setInteractive({ useHandCursor: true }).on('pointerup', fn));
  }

  button(x, y, label, fn) {
    const r = this.add.rectangle(x, y, 280, 90, 0xe0a83a).setStrokeStyle(3, 0xf3e6c0);
    this.add.text(x, y, label, buttonStyle(40)).setOrigin(0.5);
    this.time.delayedCall(400, () => r.setInteractive({ useHandCursor: true }).on('pointerup', fn)); // 開いた直後のたたきは数えない
  }
}
