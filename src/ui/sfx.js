// 効果音（合成・音のファイルなし・小さめ）。Playables では YouTube の消音に従う
import { isPlayables, ytAudioEnabled, onYtAudioChange } from '../platform.js?v=8';

let ac = null, muted = isPlayables() ? !ytAudioEnabled() : false;
if (isPlayables()) onYtAudioChange((on) => { muted = !on; });
export const setMuted = (m) => { muted = !!m; };

function tone(type, f0, f1, dur, vol, at = 0) {
  const t = ac.currentTime + at, o = ac.createOscillator(), v = ac.createGain();
  o.type = type; o.connect(v); v.connect(ac.destination);
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

export function play(name) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    if (name === 'swish') tone('sawtooth', 900, 200, 0.18, 0.05);
    else if (name === 'hit') tone('square', 220, 60, 0.12, 0.08);
    else if (name === 'fail') tone('triangle', 300, 80, 0.5, 0.09);
    else if (name === 'katon') { tone('sawtooth', 120, 600, 0.35, 0.07); tone('triangle', 200, 900, 0.4, 0.05, 0.05); }
    else if (name === 'clear') [523, 659, 784, 1047].forEach((f, i) => tone('sine', f, f, 0.2, 0.06, i * 0.08));
  } catch { /* 音が出ない端末でも遊べる */ }
}
