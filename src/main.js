// src/main.js — 言葉と記録を決めて Phaser を始める（相撲ゲームの main.js と同じ分かれ道・同意書と♪の札は無い）
import { TitleScene } from './scenes/TitleScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { MapScene } from './scenes/MapScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { initLang, setLang } from './i18n/i18n.js';
import { isPlayables, initPlatform, playablesLang, platformStore, onYtPause } from './platform.js';
import { W, H } from './config.js';

export const SCENES = [TitleScene, MapScene, PlayScene, CollectionScene];

function boot() {
  let lang;
  if (isPlayables()) {
    initLang(null, 'en'); // ブラウザの言語の設定は使わない（認定の MUST）
    lang = playablesLang() || 'en';
    setLang(lang, null);
  } else lang = initLang(platformStore(), navigator.language);
  document.documentElement.lang = lang;
}

function start() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b0a16',
    pixelArt: true, // ドット絵をにじませない
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    input: { activePointers: 2 },
    scene: SCENES,
  });
  if (isPlayables()) onYtPause(() => game.loop.sleep(), () => game.loop.wake());
  // 手元の確かめ（localhost）だけ：画面の部品を外から動かせるように置く（公開版には出さない）
  if (!isPlayables() && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.NINJA_GAME = game;
  return game;
}

const FONT_WAIT_MS = 3000;
const fonts = document.fonts ? document.fonts.load('32px game') : Promise.resolve();
const fontsReady = Promise.race([fonts, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]).catch(() => {});
if (isPlayables()) Promise.all([initPlatform().catch(() => {}), fontsReady]).then(() => { boot(); start(); });
else { boot(); fontsReady.then(start); }
