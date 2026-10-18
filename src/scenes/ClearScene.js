// 武家屋敷のクリア（key 'clear'）：星の合計・点数の合計・「次の場所は作っている途中」（Playables の決まり＝続きが無いと分かる）
import { t } from '../i18n/i18n.js?v=13';
import { textStyle, buttonStyle, GOLD } from '../ui/text.js?v=13';
import { crisp } from '../ui/pixel.js?v=13';
import { W, H, HERO_FRAME } from '../config.js?v=13';
import { loadSave, clearSummary } from '../core/save.js?v=13';
import { STAGES } from '../data/stages.js?v=13';
import { platformStore } from '../platform.js?v=13';
import { play as sfx } from '../ui/sfx.js?v=13';

export class ClearScene extends Phaser.Scene {
  constructor() { super('clear'); }

  preload() {
    this.load.image('bg_yashiki', 'assets/art/bg_yashiki.png');
    this.load.image('foe_nekoma', 'assets/foes/nekoma.png');
    this.load.spritesheet('hero', 'assets/art/hero.png', { frameWidth: HERO_FRAME.w, frameHeight: HERO_FRAME.h });
  }

  create() {
    crisp(this);
    this.add.image(0, 0, 'bg_yashiki').setOrigin(0).setScale(W / 180).setAlpha(0.45);
    const sum = clearSummary(loadSave(platformStore()), STAGES.map((s) => s.id));
    this.add.text(W / 2, 200, t('clear.title'), textStyle(72, GOLD)).setOrigin(0.5);
    this.add.sprite(W / 2, 420, 'hero', 0).setScale(2);
    this.add.text(W / 2, 600, t('clear.stars', { n: sum.stars, m: sum.maxStars }), textStyle(44)).setOrigin(0.5);
    this.add.text(W / 2, 680, t('clear.score', { n: sum.score }), textStyle(52, '#ffffff')).setOrigin(0.5);
    this.add.text(W / 2, 790, t('clear.next'), { ...textStyle(34, '#ff9a40'), wordWrap: { width: 620, useAdvancedWrap: true } }).setOrigin(0.5);
    this.button(980, t('clear.again'), () => this.scene.start('play', { index: 0 }), true);
    this.button(1090, t('clear.map'), () => this.scene.start('map'), false);
    sfx('clear');
  }

  button(y, label, fn, main) {
    const r = this.add.rectangle(W / 2, y, 460, 90, main ? 0xe0a83a : 0x2b2140).setStrokeStyle(3, 0xf3e6c0);
    this.add.text(W / 2, y, label, main ? buttonStyle(40) : textStyle(38)).setOrigin(0.5);
    this.time.delayedCall(600, () => r.setInteractive({ useHandCursor: true }).on('pointerup', fn)); // 開いた直後のたたきは数えない
  }
}
