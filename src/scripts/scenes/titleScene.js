import log from '../utils/logger'

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    let height = this.game.config.height
    let center = height / 2
    this.add
      .text(center, center - 300, 'Treasure Hunt', {
        fontFamily: 'title_font',
        fontSize: 160,
        color: '#D2B48C',
        stroke: '#000',
        strokeThickness: 2,
        align: 'center',
        padding: {
          x: 64,
          y: 64,
        },
      })
      .setOrigin(0.5, 0.5)
    let txt = this.add
      .text(center, center + 300, 'Click here or\npress [ENTER] to start.', {
        fontFamily: 'Arial',
        fontSize: 64,
        stroke: '#000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    txt.setInteractive()
    let txt_tw = this.tweens.add({
      targets: txt,
      alpha: { from: 0.2, to: 1 },
      ease: 'Cubic',
      duration: 500,
      repeat: -1,
      yoyo: true,
    })

    this.anims.create({
      key: 'spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 6, first: 6 }),
      frameRate: 10,
      repeat: -1,
    })

    let curve = new Phaser.Curves.Ellipse(center, center, 300, 100)
    for (let i = 0; i < 10; i++) {
      let follower = this.add.follower(curve, center + 300, center, 'coin')
      follower.startFollow({ duration: 3000, repeat: -1, ease: 'Linear', _delay: i * 300, delay: i * 300 })
      follower.anims.play('spin', false, Math.floor(Math.random() * 6))
    }

    let cb = () => {
      log.info('Starting instruction scene.')
      txt.removeInteractive()
      this.tweens.addCounter({
        from: 255,
        to: 0,
        duration: 1500,
        onUpdate: (t) => {
          let v = Math.floor(t.getValue())
          this.cameras.main.setAlpha(v / 255)
        },
        onComplete: () => this.scene.start('InstructionScene'),
      })
    }
    let enterKey = this.input.keyboard.addKey('ENTER')
    enterKey.once('down', cb)
    txt.once('pointerdown', cb)
  }
}
