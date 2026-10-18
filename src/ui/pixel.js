// ドット絵の絵だけをくっきり（補間しない）にする。字はなめらかなまま
// （10/18 本人「字体が悪く良く分からない」：Phaser の pixelArt を全体に掛けると、縮めて見るスマホで字までガタガタになった）
export function crisp(scene) {
  for (const key of scene.textures.getTextureKeys()) {
    if (/^(bg_|foe_|col_|hero$|makibishi$)/.test(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
