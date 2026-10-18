// 遊ぶ画面（key 'play'・scene.start('play', {index})）
// 押す＝忍者の場所から線を引き始める／動かす＝線を伸ばす（墨が切れたら先が赤く光って止まる）／離す＝resolveDash を1回だけ呼び、結果を絵にする
// 線を引いている間は敵の時間が DRAW_SLOW 倍。指は1本だけ（線の途中の2本目は無視＝Review Focus 3）
// 夜の墓地（10/18）：墓石で止まる（灰色の線で前もって見せる）・人魂が動く・縮地＝墓石か人魂をまたいだ後に指を止めると印→離すと印まで飛ぶ
import { t } from '../i18n/i18n.js?v=18';
import { textStyle, buttonStyle, GOLD } from '../ui/text.js?v=18';
import { crisp } from '../ui/pixel.js?v=18';
import { play as sfx } from '../ui/sfx.js?v=18';
import { W, H, DASH_SPEED, HITSTOP, DRAW_SLOW, HERO_FRAME, FOE_SCALE, BOSS_SCALE, HERO_SCALE, WALL } from '../config.js?v=18';
import { startStroke, addPoint, isSwipe, pointAt, pathLength } from '../core/path.js?v=18';
import { resolveDash, foePos, starsFor } from '../core/dash.js?v=18';
import { firstWallD, markAt, SHUKU_HOLD, SHUKU_STILL } from '../core/walls.js?v=18';
import { loadSave, writeSave, recordClear, learnKaton, learnShukuchi, markSeen, recordScore, totalBest } from '../core/save.js?v=18';
import { killPoints, BOSS_HIT, BOSS_KILL, timeBonus, roomScore } from '../core/score.js?v=18';
import { ALL_STAGES, areaOf, jutsuFor } from '../data/areas.js?v=18';
import { FOES, foeFlags, needsJutsu, badgeMarks } from '../data/foes.js?v=18';
import { platformStore, sendScore } from '../platform.js?v=18';

const LINE = 0x96dcff, RED = 0xe0503c, GRAY = 0x8a8a96, JUMP = 0x9fb4ff;
const HINTS = { slash: 'play.hintSlash', katon: 'play.hintKaton', wall: 'play.hintWall', hitodama: 'play.hintHitodama', shukuchi: 'play.hintShukuchi' };
const BOSS_HINTS = { boss: 'play.hintBoss', bossOni: 'play.hintBossOni' };
const depthOf = (bottomY) => 1 + bottomY / 10000; // 下にある物ほど手前（墓石の列の奥の敵は墓石の後ろに）
// 線の a〜b の所を点の並びにする（灰色の線・飛ぶ所を描き分ける）
function part(points, a, b) { const out = []; for (let d = a; d < b; d += 8) out.push(pointAt(points, d)); out.push(pointAt(points, b)); return out; }

export class PlayScene extends Phaser.Scene {
  constructor() { super('play'); }

  preload() {
    this.load.image('bg_yashiki', 'assets/art/bg_yashiki.png');
    this.load.image('bg_bochi', 'assets/art/bg_bochi.png');
    this.load.image('makibishi', 'assets/art/makibishi.png');
    this.load.image('haka', 'assets/art/haka.png'); // 墓石
    this.load.image('hitodama', 'assets/art/hitodama.png'); // 人魂
    this.load.image('pose_in', 'assets/art/pose_in.png'); // 印を結ぶ忍者（火遁）
    this.load.image('pose_noto', 'assets/art/pose_noto.png'); // 納刀の決め（クリア）
    this.load.image('pose_kamae', 'assets/art/pose_kamae.png'); // 低い構え（3・2・1）
    this.load.image('pose_shippai', 'assets/art/pose_shippai.png'); // 膝をつく（失敗）
    this.load.spritesheet('hero', 'assets/art/hero.png', { frameWidth: HERO_FRAME.w, frameHeight: HERO_FRAME.h });
    for (const [id, f] of Object.entries(FOES)) this.load.image(`foe_${id}`, `assets/${f.img}`);
  }

  create(data) {
    crisp(this);
    this.index = Math.max(0, Math.min(ALL_STAGES.length - 1, data?.index ?? 0));
    this.stage = ALL_STAGES[this.index];
    this.where = areaOf(this.index); // どの場所の何番目か
    ({ katon: this.katon, shukuchi: this.shukuchi } = jutsuFor(this.stage));
    this.walls = this.stage.walls ?? [];
    this.save = loadSave(platformStore());
    this.learned = false; this.ghost = null; this.hint = null; // 同じ画面の部品を使い回す＝前の間の状態を持ち越さない（最終点検 I2・I3）
    this.mark = null; this.still = 0; this.wallTold = false; this.holdReady = false;
    if (this.stage.lesson === 'katon' && !this.save.katon) { this.save = learnKaton(this.save); writeSave(platformStore(), this.save); this.learned = 'katon'; }
    if (this.stage.lesson === 'shukuchi' && !this.save.shukuchi) { this.save = learnShukuchi(this.save); writeSave(platformStore(), this.save); this.learned = 'shukuchi'; }
    this.wt = 0; this.stop = 0; this.moves = 0; this.stroke = null; this.pid = null; this.dash = null; this.over = false; this.slain = [];
    this.ready = false; this.clock = 0; this.killPts = 0; this.shown = 0; // 3・2・1 の後で動く・時計・敵の点・上の数字が今見せている点

    this.add.image(0, 0, this.where.area.bg).setOrigin(0).setScale(W / 180);
    // 墓石：絵の足元を当たりの長方形の下の辺にそろえる
    this.wallSpr = this.walls.map((w) => this.add.image(w.x, w.y + WALL.h / 2, 'haka').setOrigin(0.5, 1).setScale(2).setDepth(depthOf(w.y + WALL.h / 2)));
    // 罠：まきびし（止まっている）・人魂（玉の真ん中が当たりの中心・動く）
    this.traps = this.stage.traps.map((p, i) => (p.kind === 'hitodama'
      ? this.add.image(p.x, p.y, 'hitodama').setOrigin(0.5, 0.8).setScale(2)
      : this.add.image(p.x, p.y, 'makibishi').setScale(4).setAngle(i * 23)));
    this.foes = this.stage.foes.map(foeFlags).map((f) => ({ ...f, spr: this.add.image(f.x, f.y, `foe_${f.type}`).setScale(FOES[f.type].scale ?? (FOES[f.type].boss ? BOSS_SCALE : FOE_SCALE)) }));
    // ボスの残りの体力＝赤い丸（当てるたびに1つ消える・10/18 本人「倒し方がわかりずらい」）
    for (const f of this.foes) if (f.hp > 1) f.hpPips = Array.from({ length: f.hp }, () => this.add.circle(0, 0, 13, 0xe0503c).setStrokeStyle(3, 0xffffff).setDepth(6));
    // 刀で斬れない敵の頭に、効く術の印（10/18 本人「どの敵にどの術が効くか分かるように」）
    const MARK_BG = { slash: '#3a5a8c', katon: '#c8501e' }; // 斬＝藍・火＝橙
    for (const f of this.foes) {
      const marks = badgeMarks(f.type);
      if (!marks.length) continue;
      const tags = marks.map((j) => this.add.text(0, 0, t(`jutsu.mark.${j}`), { ...textStyle(28, '#ffffff'), backgroundColor: MARK_BG[j], padding: { x: 10, y: 4 } }).setOrigin(0.5).setDepth(6));
      const w = tags.reduce((s, g) => s + g.width, 0) + 8 * (tags.length - 1);
      f.badge = this.add.container(0, 0, tags).setDepth(6);
      let x = -w / 2;
      for (const g of tags) { g.setPosition(x + g.width / 2, 0); x += g.width + 8; }
    }
    this.hero = this.add.sprite(this.stage.start.x, this.stage.start.y, 'hero', 0).setScale(HERO_SCALE).setDepth(5);
    this.gfx = this.add.graphics().setDepth(4);
    this.fx = this.add.graphics().setDepth(6);
    this.puffs = [];

    this.add.text(30, 40, t('play.stage', { n: this.where.local + 1 }), textStyle(40, GOLD)).setOrigin(0, 0.5).setDepth(8); // 場所ごとの番号
    this.clockText = this.add.text(30, 84, t('play.time', { s: '0.0' }), textStyle(30)).setOrigin(0, 0.5).setDepth(8);
    this.scoreText = this.add.text(W / 2, 60, t('play.score', { n: 0 }), textStyle(44, '#ffffff')).setOrigin(0.5).setDepth(8); // 上の点数（10/18 本人「上部に点数カウンター」）
    this.movesText = this.add.text(W - 30, 40, '', textStyle(32)).setOrigin(1, 0.5).setDepth(8);
    this.add.text(W - 30, 84, t('play.par', { n: this.stage.par[0] }), textStyle(28)).setOrigin(1, 0.5).setDepth(8);
    this.inkBar = this.add.graphics().setDepth(8);
    this.refreshMoves();
    this.showLesson();
    this.time.delayedCall(this.learned ? 2100 : 0, () => this.countdown()); // 火遁を覚えた時は、絵を見せ終わってから 3・2・1

    this.input.on('pointerdown', (p) => this.down(p));
    this.input.on('pointermove', (p) => this.move(p));
    this.input.on('pointerup', (p) => this.up(p));
    this.input.on('pointerupoutside', (p) => this.up(p)); // 画面の外で離した時（マウス）も線を終える（最終点検 I1）
  }

  // 3・2・1・始め！（10/18 本人）。それまでは線を引けず、敵も止まっている
  countdown() {
    // 数字の後ろに低い構えの忍者を大きく薄く（「始め！」で消える）
    const kamae = this.add.image(W / 2, H / 2 + 40, 'pose_kamae').setScale(2.6).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: kamae, alpha: 0.55, duration: 250 });
    this.time.delayedCall(3 * 650, () => this.tweens.add({ targets: kamae, alpha: 0, x: W / 2 + 120, duration: 220, onComplete: () => kamae.destroy() }));
    const words = ['3', '2', '1', t('play.go')];
    words.forEach((w, i) => this.time.delayedCall(i * 650, () => {
      const tx = this.add.text(W / 2, H / 2 - 40, w, textStyle(i < 3 ? 160 : 110, GOLD)).setOrigin(0.5).setDepth(11).setScale(1.4);
      this.tweens.add({ targets: tx, scale: 1, duration: 200 });
      this.tweens.add({ targets: tx, alpha: 0, delay: 420, duration: 220, onComplete: () => tx.destroy() });
      sfx(i < 3 ? 'hit' : 'swish');
      if (i === 3) this.ready = true;
    }));
  }

  // 点：敵の上に「+N」→ 上の点数へ飛んで、着いたら合計に足す
  award(pts, x, y) {
    this.killPts += pts;
    const tx = this.add.text(x, y - 40, `+${pts}`, textStyle(40, GOLD)).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: tx, y: y - 100, duration: 260, ease: 'Quad.out', onComplete: () => {
      this.tweens.add({ targets: tx, x: W / 2, y: 60, scale: 0.6, duration: 420, ease: 'Quad.in', onComplete: () => {
        tx.destroy(); this.shown += pts; this.scoreText.setText(t('play.score', { n: this.shown }));
        this.tweens.killTweensOf(this.scoreText); this.scoreText.setScale(1); // 前の膨らみを止めてから（10/18 本人「倍の大きさに膨らむ」＝続けて入ると重なって大きくなった）
        this.tweens.add({ targets: this.scoreText, scale: 1.25, yoyo: true, duration: 90 });
      } });
    } });
  }

  refreshMoves() { this.movesText.setText(t('play.moves', { n: this.moves })); }

  // 1番の間＝一の太刀の見本・6番の間＝火遁の見本（答えの1本目を薄くなぞって見せる）
  showLesson() {
    if (BOSS_HINTS[this.stage.hint]) { // ボスの間：倒し方を下に出す（最初にさわると消える）
      this.hint = this.add.text(W / 2, H - 380, t(BOSS_HINTS[this.stage.hint]), textStyle(34, GOLD)).setOrigin(0.5).setDepth(8); // 忍者（下）とボス（上）の間
      return;
    }
    const kind = this.stage.lesson;
    if (!kind) return;
    const first = this.stage.solution[0], pts = [this.stage.start, ...first.points];
    this.ghost = { pts, k: 0, mark: first.mark !== undefined ? first.points[first.mark] : null }; // 縮地の見本は印の所に輪
    // 教えの一言は題の下に帯を敷いて（版16で忍者を大きくしたら、下に出すと忍者に重なった）
    const tx = this.add.text(W / 2, 178, t(HINTS[kind]), textStyle(36, GOLD)).setOrigin(0.5).setDepth(8);
    const band = this.add.rectangle(W / 2, 178, W, tx.height + 24, 0x0b0a16, 0.6).setDepth(7.9);
    this.hint = { destroy: () => { tx.destroy(); band.destroy(); } };
    if (this.learned) this.learnShow();
  }

  // 術を覚えた：印を結ぶ忍者を大きく出して「○○を覚えた！」（火遁・縮地）
  learnShow() {
    const c = this.add.container(W / 2, H / 2).setDepth(10);
    c.add(this.add.rectangle(0, 0, W, 760, 0x000000, 0.6));
    c.add(this.add.image(0, -60, 'pose_in').setScale(2.4));
    c.add(this.add.text(0, 300, t(this.learned === 'shukuchi' ? 'play.learnShukuchi' : 'play.learnKaton'), textStyle(64, GOLD)).setOrigin(0.5));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
    this.tweens.add({ targets: c, alpha: 0, delay: 1800, duration: 300, onComplete: () => c.destroy() });
  }

  // 火遁を出した瞬間：印を結ぶ忍者が左下から出て消える（遊びは止めない）
  cutin() {
    const img = this.add.image(-180, H - 300, 'pose_in').setScale(1.8).setDepth(9);
    this.tweens.add({ targets: img, x: 170, duration: 180, ease: 'Quad.out' });
    this.tweens.add({ targets: img, alpha: 0, x: 220, delay: 650, duration: 250, onComplete: () => img.destroy() });
  }

  down(p) {
    if (!this.ready || this.dash || this.over || this.pid !== null) return; // 合図の前は引けない・指は1本だけ
    this.pid = p.id;
    this.stroke = startStroke({ x: this.hero.x, y: this.hero.y });
    this.stroke = addPoint(this.stroke, { x: p.worldX, y: p.worldY }, this.stage.ink);
    this.downAt = { x: p.worldX, y: p.worldY }; this.travel = 0;
    this.finger = { ...this.downAt }; this.anchor = { ...this.downAt }; this.still = 0; this.mark = null; // 縮地の止め
    if (this.ghost || this.hint) { this.ghost = null; this.hint?.destroy(); this.hint = null; }
  }

  move(p) {
    if (p.id !== this.pid || !this.stroke) return;
    this.travel = Math.max(this.travel, Math.hypot(p.worldX - this.downAt.x, p.worldY - this.downAt.y)); // 指が押した所からどこまで離れたか
    this.stroke = addPoint(this.stroke, { x: p.worldX, y: p.worldY }, this.stage.ink);
    this.finger = { x: p.worldX, y: p.worldY };
  }

  // 縮地の止め：指が SHUKU_STILL px 以内に SHUKU_HOLD 秒いたら、印を置けるか聞く（本当の時間で数える＝線を引く間のゆっくりに関係ない）
  holdCheck(real) {
    if (!this.stroke || !this.shukuchi || this.mark !== null) return;
    if (Math.hypot(this.finger.x - this.anchor.x, this.finger.y - this.anchor.y) > SHUKU_STILL) { this.anchor = { ...this.finger }; this.still = 0; this.holdReady = false; return; }
    this.still += real;
    // 置ける所で止めている間は、線の先に輪が満ちていく（何も起きないと待てばいいと分からなかった）
    this.holdReady = markAt({ ...this.stroke, mark: this.mark }, { walls: this.walls, traps: this.stage.traps, t: this.wt, travel: this.travel }) !== null;
    if (!this.holdReady) { this.still = 0; return; }
    if (this.still < SHUKU_HOLD) return;
    this.still = 0; this.holdReady = false;
    const m = this.stroke.len;
    this.mark = m; sfx('mark');
    const e = this.stroke.points[this.stroke.points.length - 1], ring = this.add.circle(e.x, e.y, 20).setStrokeStyle(6, JUMP).setDepth(7);
    this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
  }

  up(p) {
    if (p.id !== this.pid) return;
    this.pid = null;
    const s = this.stroke; this.stroke = null;
    if (!s || !isSwipe(s, this.travel)) return; // 押してすぐ離した・指が動いていない＝何もしない（手数も増えない）
    this.moves++; this.refreshMoves();
    const live = this.foes.filter((f) => !f.dead);
    const jump = this.mark ?? 0; this.mark = null;
    const res = resolveDash({ foes: live, traps: this.stage.traps, walls: this.walls, points: s.points, t0: this.wt, katon: this.katon, jump });
    this.dash = { res, points: s.points, d: res.jump, ki: 0, hi: 0, combo: 0 };
    if (res.jump > 0) this.jumpFx(pointAt(s.points, 0), pointAt(s.points, res.jump)); else sfx('swish');
  }

  // 縮地：元の場所に影を残して、印の所へ一瞬で移る
  jumpFx(a, b) {
    sfx('warp');
    const ghost = this.add.sprite(a.x, a.y, 'hero', 0).setScale(HERO_SCALE).setDepth(5).setAlpha(0.6).setTint(JUMP);
    this.tweens.add({ targets: ghost, alpha: 0, scaleX: HERO_SCALE * 0.4, duration: 260, onComplete: () => ghost.destroy() });
    this.puff(a.x, a.y, JUMP); this.puff(b.x, b.y, JUMP);
    this.hero.setPosition(b.x, b.y);
  }

  // 墓石で止まった：コツンと揺れる（失敗ではない・その間で初めての時だけ字で言う）
  wallBump(i) {
    sfx('thud'); this.cameras.main.shake(90, 0.006);
    const w = this.wallSpr[i];
    if (w) this.tweens.add({ targets: w, x: w.x + 6, yoyo: true, duration: 45, repeat: 3 });
    if (this.wallTold || !w) return;
    this.wallTold = true;
    const msg = this.add.text(w.x, w.y - 170, t('play.wallStop'), textStyle(32, '#ffd27a')).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: msg, y: msg.y - 60, alpha: 0, delay: 800, duration: 600, onComplete: () => msg.destroy() });
  }

  update(time, deltaMs) {
    const real = Math.min(0.05, deltaMs / 1000);
    let dt = real;
    if (this.stop > 0) { this.stop -= real; dt = 0; }
    if (this.ready && !this.over) { this.clock += real; this.clockText.setText(t('play.time', { s: this.clock.toFixed(1) })); } // 時計は本当の時間（ゆっくりや止めに関係なく進む）
    if (!this.dash && this.ready) this.wt += dt * (this.stroke ? DRAW_SLOW : 1);
    if (this.dash && dt > 0) this.stepDash(dt);
    this.holdCheck(real);
    this.stage.traps.forEach((tr, i) => { if (!tr.move) return; const q = foePos(tr, this.wt), s = this.traps[i]; s.setPosition(q.x, q.y).setAlpha(0.8 + 0.2 * Math.sin(this.time.now / 120 + i)).setDepth(depthOf(q.y + 20)); }); // 人魂がゆらゆら行き来する
    for (const f of this.foes) if (!f.dead) { const q = foePos(f, this.wt); f.spr.setPosition(q.x, q.y + Math.sin(this.wt * 3 + q.x) * 3).setDepth(depthOf(q.y + f.spr.displayHeight / 2)); f.badge?.setPosition(q.x, q.y - f.spr.displayHeight / 2 - 8); f.hpPips?.forEach((c, i, a) => c.setPosition(q.x + (i - (a.length - 1) / 2) * 34, q.y - f.spr.displayHeight / 2 - 48)); }
    this.draw(real);
  }

  stepDash(dt) {
    const D = this.dash;
    D.d = Math.min(D.res.len, D.d + DASH_SPEED * dt);
    this.wt += dt;
    const p = pointAt(D.points, D.d);
    const left = Math.cos(p.ang) < 0;
    this.hero.setPosition(p.x, p.y).setFrame(1).setFlipX(left); // 駆け抜けの絵（左へ走る時は左右を反転）
    while (D.ki < D.res.kills.length && D.res.kills[D.ki].d <= D.d) this.slay(D.res.kills[D.ki++].id, D);
    while (D.hi < D.res.hits.length && D.res.hits[D.hi].d <= D.d) this.wound(D.res.hits[D.hi++].id);
    D.bi = D.bi ?? 0;
    while (D.bi < D.res.blocked.length && D.res.blocked[D.bi].d <= D.d) this.blocked(D.res.blocked[D.bi++].id, D.res);
    if (D.d < D.res.len) return;
    this.hero.setFrame(0).setAngle(0);
    this.dash = null;
    if (D.res.trapHit) return this.fail(this.stage.traps[D.res.trapHit.index]?.kind ?? 'makibishi');
    if (D.res.wallHit) this.wallBump(D.res.wallHit.index);
    if (D.res.burn) this.burn(D.res.burn);
    const allDead = this.foes.every((f) => f.dead);
    if (D.combo >= 2 && !allDead) this.banner(t('play.combo', { n: D.combo }), '', 0.8); // 最後の1本の連斬は納刀の決めの中で見せる（重ならないように）
    if (allDead) this.clear(D.combo);
  }

  slay(id, D) {
    const f = this.foes.find((o) => o.id === id);
    if (!f || f.dead) return;
    f.dead = true; D.combo++; f.badge?.destroy(); f.hpPips?.forEach((c) => c.destroy());
    this.award(FOES[f.type].boss ? BOSS_KILL : killPoints(D.combo), f.spr.x, f.spr.y);
    this.slain.push(f.type);
    this.puff(f.spr.x, f.spr.y, 0xd8d4e8);
    this.tweens.add({ targets: f.spr, alpha: 0, scale: f.spr.scale * 1.3, duration: 220, onComplete: () => f.spr.destroy() });
    this.slashMark(f.spr.x, f.spr.y, pointAt(D.points, D.d).ang);
    this.stop = HITSTOP; this.cameras.main.shake(80, 0.006); sfx('hit');
  }

  blocked(id, res) {
    if (res.kills.some((k) => k.id === id)) return; // 同じ駆け抜けの火遁で燃えるなら言わない
    const f = this.foes.find((o) => o.id === id), j = needsJutsu(f?.type);
    if (!f || !j) return;
    this.tweens.add({ targets: f.spr, x: f.spr.x + 8, yoyo: true, duration: 50, repeat: 3 });
    const msg = this.add.text(f.spr.x, f.spr.y - 20, t('play.blocked', { j: t(`jutsu.${j}`) }), textStyle(32, '#ffd27a')).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: msg, y: msg.y - 70, alpha: 0, delay: 700, duration: 600, onComplete: () => msg.destroy() });
  }

  wound(id) {
    const f = this.foes.find((o) => o.id === id);
    if (!f || f.dead) return;
    f.hp -= 1;
    const pip = f.hpPips?.pop(); if (pip) this.tweens.add({ targets: pip, scale: 2, alpha: 0, duration: 300, onComplete: () => pip.destroy() });
    this.award(BOSS_HIT, f.spr.x, f.spr.y);
    this.tweens.add({ targets: f.spr, alpha: 0.3, yoyo: true, duration: 90, repeat: 2 });
    this.slashMark(f.spr.x, f.spr.y, 0.6);
    this.stop = HITSTOP; this.cameras.main.shake(120, 0.01); sfx('hit');
  }

  burn(poly) {
    sfx('katon');
    this.cutin();
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xff7a2a, 0.55); g.fillPoints(poly, true);
    g.lineStyle(10, 0xffd27a, 0.9); g.strokePoints(poly, true);
    this.tweens.add({ targets: g, alpha: 0, duration: 700, onComplete: () => g.destroy() });
    for (let i = 0; i < poly.length; i += 3) this.puff(poly[i].x, poly[i].y, 0xff9a40);
  }

  puff(x, y, color) {
    for (let i = 0; i < 12; i++) this.puffs.push({ x, y, vx: Phaser.Math.Between(-260, 260), vy: Phaser.Math.Between(-300, 120), r: Phaser.Math.Between(12, 30), t: 0, life: 0.5 + Math.random() * 0.3, color });
  }

  slashMark(x, y, ang) {
    const g = this.add.graphics().setDepth(7);
    g.lineStyle(8, 0xffffff, 1);
    g.beginPath(); g.moveTo(x - Math.cos(ang) * 110, y - Math.sin(ang) * 110); g.lineTo(x + Math.cos(ang) * 110, y + Math.sin(ang) * 110); g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
  }

  draw(dt) {
    const g = this.gfx; g.clear();
    if (this.ghost) { // 見本：答えの線を少しずつなぞる
      this.ghost.k = (this.ghost.k + dt / 1.8) % 1;
      const pts = this.ghost.pts, n = Math.max(2, Math.floor(pts.length * this.ghost.k) + 1);
      g.lineStyle(12, LINE, 0.45); g.strokePoints(pts.slice(0, n));
      if (this.ghost.mark) { g.lineStyle(6, JUMP, 0.8); g.strokeCircle(this.ghost.mark.x, this.ghost.mark.y, 26); }
    }
    if (this.stroke && this.stroke.points.length > 1) {
      const pts = this.stroke.points, total = pathLength(pts), left = 1 - this.stroke.len / this.stage.ink;
      const from = this.mark ?? 0, stop = this.walls.length ? firstWallD(pts, this.walls, from) : null; // 印より前は飛ぶ＝墓石を数えない
      if (from > 0) { const j = part(pts, 0, from), m = pointAt(pts, from); g.lineStyle(6, JUMP, 0.6); g.strokePoints(j); g.lineStyle(6, JUMP, 1); g.strokeCircle(m.x, m.y, 22); } // 飛ぶ所は細く青く・印に輪
      const live = part(pts, from, stop ?? total);
      if (live.length > 1) { g.lineStyle(14, LINE, 0.35 + 0.5 * left); g.strokePoints(live); g.lineStyle(4, 0xffffff, 1); g.strokePoints(live); }
      if (this.holdReady && this.mark === null) { // 縮地の止め：輪が満ちたら印
        const e = pts[pts.length - 1], k = Math.min(1, this.still / SHUKU_HOLD);
        g.lineStyle(6, JUMP, 1); g.beginPath(); g.arc(e.x, e.y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.strokePath();
      }
      if (stop !== null) { // 墓石から先は暗い灰色＋止まる所に橙の×＝ここで止まる（灰色だけでは石の色にまぎれた）
        const dead = part(pts, stop, total), x = pointAt(pts, stop);
        g.lineStyle(12, 0x000000, 0.45); g.strokePoints(dead); g.lineStyle(4, GRAY, 0.9); g.strokePoints(dead);
        g.lineStyle(7, 0xff9a40, 1); g.lineBetween(x.x - 16, x.y - 16, x.x + 16, x.y + 16); g.lineBetween(x.x - 16, x.y + 16, x.x + 16, x.y - 16);
      }
      if (this.stroke.clipped) { // 墨が切れた＝先が赤く光って止まる（本人の決定）
        const e = this.stroke.points[this.stroke.points.length - 1], k = 0.6 + 0.4 * Math.sin(this.time.now / 90);
        g.fillStyle(RED, 0.35 * k); g.fillCircle(e.x, e.y, 34);
        g.fillStyle(RED, 0.9); g.fillCircle(e.x, e.y, 12);
      }
    }
    if (this.dash) { // 駆け抜けた跡
      const D = this.dash, tail = [];
      for (let s = Math.max(D.res.jump, D.d - 260); s <= D.d; s += 12) tail.push(pointAt(D.points, s)); // 飛んだ所には跡を残さない
      if (tail.length > 1) { g.lineStyle(10, 0xffffff, 0.5); g.strokePoints(tail); }
    }
    const f = this.fx; f.clear();
    this.puffs = this.puffs.filter((p) => (p.t += dt) < p.life);
    for (const p of this.puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; const k = p.t / p.life; f.fillStyle(p.color, 0.7 * (1 - k)); f.fillCircle(p.x, p.y, p.r * (0.6 + k)); }
    const b = this.inkBar; b.clear();
    const left = this.stroke ? 1 - this.stroke.len / this.stage.ink : 1;
    b.fillStyle(0xffffff, 0.15); b.fillRect(60, H - 60, W - 120, 18);
    b.fillStyle(left > 0 ? LINE : RED, 1); b.fillRect(60, H - 60, (W - 120) * left, 18);
  }

  banner(text, sub, sec) {
    const c = this.add.container(W / 2, H / 2).setDepth(9);
    c.add(this.add.rectangle(0, 0, W, sub ? 200 : 150, 0x000000, 0.5));
    c.add(this.add.text(0, sub ? -24 : 0, text, textStyle(72, GOLD)).setOrigin(0.5));
    if (sub) c.add(this.add.text(0, 50, sub, textStyle(32)).setOrigin(0.5));
    this.time.delayedCall(sec * 1000, () => c.destroy());
  }

  fail(kind = 'makibishi') {
    this.over = true; sfx('fail'); this.cameras.main.shake(200, 0.015);
    this.save = markSeen(this.save, kind); writeSave(platformStore(), this.save); // ふれたら図鑑に
    const c = this.add.container(W / 2, H / 2).setDepth(12); // まきびしを踏んで膝をつく忍者（合図の字＝11より前）
    c.add(this.add.rectangle(0, 0, W, 700, 0x000000, 0.6));
    c.add(this.add.image(0, -60, 'pose_shippai').setScale(2.3));
    c.add(this.add.text(0, 230, t('play.fail'), textStyle(64, GOLD)).setOrigin(0.5));
    c.add(this.add.text(0, 295, t(kind === 'hitodama' ? 'play.failSubHitodama' : 'play.failSub'), textStyle(32)).setOrigin(0.5));
    this.time.delayedCall(1400, () => this.scene.restart({ index: this.index }));
  }

  clear(lastCombo = 0) {
    this.over = true; sfx('clear');
    const stars = starsFor(this.moves, this.stage.par);
    let s = recordClear(this.save, this.stage.id, stars);
    for (const type of this.slain) s = markSeen(s, type);
    for (const tr of this.stage.traps) s = markSeen(s, tr.kind ?? 'makibishi'); // まきびし・人魂の間を越えたら図鑑に
    const sec = this.clock, total = roomScore({ killPts: this.killPts, stars, sec });
    const isBest = total > (s.best[this.stage.id] ?? 0);
    s = recordScore(s, this.stage.id, total);
    this.save = s; writeSave(platformStore(), s);
    sendScore(totalBest(s)); // YouTube 版：全部の間の最高点の合計
    this.time.delayedCall(300, () => this.notoShow(lastCombo));
    this.time.delayedCall(1600, () => this.result(stars, { sec, total, isBest }));
  }

  // 納刀の決め：間をクリアした瞬間、刀を収めた忍者を大きく出す（その後で結果の画面）
  notoShow(combo) {
    const c = this.add.container(W / 2, H / 2).setDepth(12); // 合図の字（11）より前
    c.add(this.add.rectangle(0, 0, W, 760, 0x000000, 0.55));
    const img = this.add.image(40, -40, 'pose_noto').setScale(2.6);
    c.add(img);
    c.add(this.add.text(0, 290, t('play.clear'), textStyle(64, GOLD)).setOrigin(0.5));
    if (combo >= 2) c.add(this.add.text(0, -330, t('play.combo', { n: combo }), textStyle(52, '#ffffff')).setOrigin(0.5));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    this.tweens.add({ targets: img, x: 0, duration: 420, ease: 'Quad.out' });
    this.tweens.add({ targets: c, alpha: 0, delay: 1050, duration: 250, onComplete: () => c.destroy() });
  }

  result(stars, sc) {
    const c = this.add.container(W / 2, H / 2).setDepth(10);
    c.add(this.add.rectangle(0, 0, 620, 900, 0x0b0a16, 0.94).setStrokeStyle(4, 0xc9a227));
    c.add(this.add.text(0, -380, t('play.clear'), textStyle(56, GOLD)).setOrigin(0.5));
    c.add(this.add.text(0, -295, '★'.repeat(stars) + '☆'.repeat(3 - stars), textStyle(84, GOLD)).setOrigin(0.5));
    // 点の内訳：敵・星・速さ → 合計
    const lines = [t('res.kill', { n: this.killPts }), t('res.star', { n: stars * 1000 }), t('res.speed', { s: sc.sec.toFixed(1), n: timeBonus(sc.sec) })];
    lines.forEach((l, i) => c.add(this.add.text(0, -200 + i * 50, l, textStyle(32)).setOrigin(0.5)));
    c.add(this.add.text(0, -40, t('res.total', { n: sc.total }), textStyle(52, '#ffffff')).setOrigin(0.5));
    if (sc.isBest) c.add(this.add.text(0, 20, t('res.best'), textStyle(32, '#ff9a40')).setOrigin(0.5));
    const last = this.index >= ALL_STAGES.length - 1, areaEnd = this.where.local >= this.where.area.stages.length - 1;
    const next = last ? ['play.toClear', () => this.scene.start('clear')] // 最後の場所の最後の間の後はクリアへ
      : areaEnd ? ['play.nextArea', () => this.scene.start('area', { index: this.index + 1 })] // 場所の最後の間の後は次の場所の題へ
        : ['play.next', () => this.scene.start('play', { index: this.index + 1 })];
    const btns = [
      next,
      ['play.retry', () => this.scene.restart({ index: this.index })],
      ...(last ? [] : [['play.map', () => this.scene.start('map', { area: this.where.a })]]),
    ];
    btns.forEach(([key, fn], i) => {
      const y = 110 + i * 100;
      const r = this.add.rectangle(0, y, 420, 80, i === 0 ? 0xe0a83a : 0x2b2140).setStrokeStyle(3, 0xf3e6c0).setInteractive({ useHandCursor: true });
      c.add(r); c.add(this.add.text(0, y, t(key), i === 0 ? buttonStyle(40) : textStyle(38)).setOrigin(0.5));
      this.time.delayedCall(500, () => r.once('pointerup', fn)); // 開いた直後のたたきは数えない
    });
  }
}
