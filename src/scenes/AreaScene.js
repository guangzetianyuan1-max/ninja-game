// 場所の題（key 'area'・scene.start('area', {index})）：次の場所の背景に大きな名前を2秒（たたくと先へ）→ その場所の1の間
import { t } from '../i18n/i18n.js?v=18';
import { textStyle, GOLD } from '../ui/text.js?v=18';
import { crisp } from '../ui/pixel.js?v=18';
import { W, H } from '../config.js?v=18';
import { AREAS, areaOf } from '../data/areas.js?v=18';
import { play as sfx } from '../ui/sfx.js?v=18';

export class AreaScene extends Phaser.Scene {
  constructor() { super('area'); }

  preload() { for (const a of AREAS) this.load.image(a.bg, `assets/art/${a.bg}.png`); }

  create(data) {
    crisp(this);
    const index = data?.index ?? 0, { area } = areaOf(index);
    this.add.image(0, 0, area.bg).setOrigin(0).setScale(W / 180);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a16, 0.45);
    const sub = this.add.text(W / 2, H / 2 - 110, t('area.enter'), textStyle(40)).setOrigin(0.5).setAlpha(0);
    const name = this.add.text(W / 2, H / 2, t(`area.${area.id}`), textStyle(110, GOLD)).setOrigin(0.5).setAlpha(0).setScale(1.2);
    this.tweens.add({ targets: [sub, name], alpha: 1, scale: 1, duration: 400 });
    sfx('mark');
    let gone = false;
    const go = () => { if (!gone) { gone = true; this.scene.start('play', { index }); } };
    this.time.delayedCall(2000, go);
    this.time.delayedCall(400, () => this.input.once('pointerup', go)); // 開いた直後のたたきは数えない
  }
}
