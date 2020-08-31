export class Bonuses extends Phaser.GameObjects.Container {
  constructor(scene, x, y, vals, alpha) {
    // frame
    let frame = scene.add
      .rexRoundRectangle(0, 0, 260, 140, 8, 0x111111, 0.5)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(8, 0xfece66)
    let txt = `[color=#ffd700]+$2: ${vals[0]}[/color]\n[color=#C0C0C0]+$1: ${vals[1]}[/color]\n[color=#cd7f32]+$0.5: ${vals[2]}[/color]`
    let text = scene.add
      .rexBBCodeText(0, 0, txt, {
        fontFamily: 'Georgia',
        fontSize: 35,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
    super(scene, x, y, [frame, text])
    this.alpha = alpha
    scene.add.existing(this)
  }
}
