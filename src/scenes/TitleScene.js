// 表紙：武家屋敷の背景・宙を舞う忍者（ゆっくり上下に浮き、床に影）・題・「たたいて始める」
// 描いたら YouTube に firstFrameReady、たたける時に gameReady
// 忍者の絵は Gemini では跳ばなかった（片足立ちになった）＝画面で浮かせて宙を舞って見せる（10/18）
import { t } from '../i18n/i18n.js?v=19';
import { textStyle, GOLD } from '../ui/text.js?v=19';
import { crisp } from '../ui/pixel.js?v=19';
import { W, H } from '../config.js?v=19';
import { signalFirstFrame, signalGameReady } from '../platform.js?v=19';
import { PARADE } from '../data/parade.js?v=19';

const FLOAT_Y = 640, FLOAT_AMP = 26, FLOOR_Y = 975;
// 百鬼夜行の行列：2列（奥＝小さく暗く遅い・手前＝大きく明るい）。足元の高さ・大きさ・色・1秒に進む px・間隔
const ROWS = [
  { y: 860, h: 100, tint: 0x6f6f92, speed: 22, gap: 112, rev: true },
  { y: 1030, h: 150, tint: 0xb8b8d8, speed: 38, gap: 150, rev: false },
];

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  preload() {
    this.load.image('bg_yashiki', 'assets/art/bg_yashiki.png');
    this.load.image('pose_title', 'assets/art/pose_title.png');
    for (const id of PARADE) this.load.image(`parade_${id}`, `assets/parade/${id}.png`);
  }

  create() {
    // 手元の確かめ用：?room=N で N 番の間から（1から数える）
    const room = Number(new URLSearchParams(location.search).get('room'));
    if (room >= 1) { this.scene.start('play', { index: room - 1 }); return; }
    crisp(this);
    this.add.image(0, 0, 'bg_yashiki').setOrigin(0).setScale(W / 180).setAlpha(0.6);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a16, 0.35);
    // 百鬼夜行：妖怪の行列が右へ練り歩く（端まで行ったら左から出直す）。忍者より奥＝少し暗く
    this.parade = ROWS.flatMap((row) => (row.rev ? [...PARADE].reverse() : PARADE).map((id, i) => {
      const img = this.add.image(i * row.gap - 60, row.y, `parade_${id}`).setOrigin(0.5, 1).setTint(row.tint);
      img.setScale(Math.min(1.3, row.h / img.height));
      return { img, row, ph: i * 0.9 };
    }));
    // 月明かりの丸い光と、その中の影（黒い影だけでは暗い床に溶けて見えなかった）
    this.add.ellipse(W / 2, FLOOR_Y, 360, 80, 0x9fb4ff, 0.22);
    const shadow = this.add.ellipse(W / 2, FLOOR_Y, 220, 40, 0x000000, 0.6);
    const ninja = this.add.image(W / 2, FLOAT_Y, 'pose_title').setScale(2.4);
    this.tweens.add({ targets: ninja, y: FLOAT_Y - FLOAT_AMP, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: shadow, scaleX: 0.8, alpha: 0.3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); // 高く浮くほど影は小さく薄く
    this.add.text(W / 2, 170, t('title'), textStyle(84, GOLD)).setOrigin(0.5);
    this.add.text(W / 2, 270, t('title.sub'), textStyle(36)).setOrigin(0.5);
    const tap = this.add.text(W / 2, 1180, t('title.tap'), textStyle(40)).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
    signalFirstFrame();
    // 開いた直後のたたきは数えない（前の画面の指が残っていても進まない）
    this.time.delayedCall(400, () => {
      signalGameReady();
      this.input.once('pointerup', () => this.next());
    });
  }

  update(time, deltaMs) {
    if (!this.parade) return;
    for (const p of this.parade) {
      p.img.x += p.row.speed * deltaMs / 1000;
      if (p.img.x > W + 100) p.img.x -= PARADE.length * p.row.gap;
      p.img.y = p.row.y + Math.sin(time / 300 + p.ph) * 4; // ひょこひょこ歩く
    }
  }

  next() {
    if (this.scene.manager.keys.map) this.scene.start('map');
  }
}
