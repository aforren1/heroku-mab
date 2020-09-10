export class Score extends Phaser.GameObjects.Container {
  constructor(scene, x, y, alpha) {
    // let rect = scene.add.rexRoundRectangle(0, 0, 250, 100, 8, 0xdaa878).setOrigin(0.5, 0.5).setStrokeStyle(8, 0xfece66)
    let scroll = scene.add.image(0, 0, 'scroll', 0).setOrigin(0.5, 0.5)
    let text = scene.add
      .text(0, 0, '0', {
        fontFamily: 'Georgia',
        fontSize: 80,
        align: 'center',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
    let addit = scene.add
      .text(0, 150, '0', {
        fontFamily: 'Georgia',
        fontSize: 70,
        align: 'center',
        stroke: '#000',
        color: '#00ff7f',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
    addit.alpha = 0
    super(scene, x, y, [scroll, text, addit])
    this.text = text
    this.addit = addit
    this.score = 0
    this.alpha = alpha
    scene.add.existing(this)
  }

  addScore(points) {
    // only animate if we're getting more points
    if (points > 0) {
      this.text.setColor('#00ff7f')
      this.addit.text = `+${points}`
      let tl = this.scene.tweens.createTimeline()
      tl.add({
        targets: this.addit,
        alpha: 1,
        duration: 100,
      })
      tl.add({
        targets: this.addit,
        alpha: 1,
        duration: 850,
      })
      tl.add({
        targets: this.addit,
        alpha: 0,
        duration: 50,
      })
      tl.play()
      this.scene.tweens.addCounter({
        from: this.score,
        to: this.score + points,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onUpdate: (t) => {
          let v = Math.ceil(t.getValue())
          this.text.text = v
        },
      })
      let timeline = this.scene.tweens.createTimeline()
      timeline.add({
        targets: [this.scroll, this.text],
        scale: 1.2,
        ease: 'Cubic.easeIn',
        duration: 300,
      })
      timeline.add({
        targets: [this.scroll, this.text],
        scale: 1,
        ease: 'Cubic.easeOut',
        duration: 700,
        onComplete: () => {
          this.text.setColor('#ffffff')
        },
      })
      timeline.play()
      this.score += points
    }
  }
  reset() {
    this.addScore(-this.score)
  }
}
