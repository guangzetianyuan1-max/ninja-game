// 動く物（敵・人魂）の、時刻 t の場所。move = {dx, dy, period}（sin で行き来する）。動かない物はそのまま
export function foePos(o, t) {
  if (!o.move) return { x: o.x, y: o.y };
  const s = Math.sin((2 * Math.PI * t) / o.move.period);
  return { x: o.x + o.move.dx * s, y: o.y + o.move.dy * s };
}
