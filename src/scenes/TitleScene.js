// 表紙：題・ひと言・「たたいて始める」。描いたら YouTube に firstFrameReady、たたける時に gameReady
import { t } from '../i18n/i18n.js?v=7';
import { textStyle, GOLD } from '../ui/text.js?v=7';
import { W, H } from '../config.js?v=7';
import { signalFirstFrame, signalGameReady } from '../platform.js?v=7';

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    // 手元の確かめ用：?room=N で N 番の間から（1から数える）
    const room = Number(new URLSearchParams(location.search).get('room'));
    if (room >= 1) { this.scene.start('play', { index: room - 1 }); return; }
    this.cameras.main.setBackgroundColor('#0b0a16');
    this.add.text(W / 2, H * 0.34, t('title'), textStyle(84, GOLD)).setOrigin(0.5);
    this.add.text(W / 2, H * 0.34 + 100, t('title.sub'), textStyle(36)).setOrigin(0.5);
    const tap = this.add.text(W / 2, H * 0.78, t('title.tap'), textStyle(40)).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
    signalFirstFrame();
    // 開いた直後のたたきは数えない（前の画面の指が残っていても進まない）
    this.time.delayedCall(400, () => {
      signalGameReady();
      this.input.once('pointerup', () => this.next());
    });
  }

  next() {
    if (this.scene.manager.keys.map) this.scene.start('map');
  }
}
