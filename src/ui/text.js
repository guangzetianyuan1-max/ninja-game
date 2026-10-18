// 字の型：字体は index.html の @font-face 'game'（M PLUS Rounded 1c ExtraBold）・縁取りで暗い場所でも読めるように
export const INK_COLOR = '#f3e6c0';
export const GOLD = '#ffe08a';

export function textStyle(size, color = INK_COLOR) {
  return {
    fontFamily: 'game, sans-serif',
    fontSize: `${size}px`,
    color,
    stroke: '#0b0a16',
    strokeThickness: Math.max(4, Math.round(size / 8)),
    align: 'center',
  };
}
