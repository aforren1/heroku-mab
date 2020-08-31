// TODO: nice textured shape behind (for easy identification of spatial change)
export class Chest extends Phaser.GameObjects.Container {
  constructor(scene, x, y, letter, alpha) {
    let img = scene.add.sprite(0, 0, 'chest', 0).setOrigin(0.5, 0.5)
    let box = scene.add.rectangle(-35, 80, 80, 80, '#999999', 0.7).setStrokeStyle(2, '#000000')
    let letter_txt = scene.add
      .text(-35, 80, letter, {
        fontFamily: 'Georgia',
        fontSize: 80,
        color: '#ffef9b',
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
    super(scene, x, y, [img, box, letter_txt])
    this.alpha = alpha
    scene.add.existing(this)
    this.scene = scene
    this.letter = letter
    this.sprite = img
    this.jangle = scene.sound.add('jangle')
    this.thump = scene.sound.add('thump')
    this.emitter = scene.add.particles('coin').createEmitter({
      frame: { frames: [0, 1, 2, 3, 4, 5], cycle: false },
      x: x,
      y: y - 20,
      speed: { min: 300, max: 600 },
      angle: { min: 240, max: 300 },
      frequency: 30,
      lifespan: { min: 300, max: 1000 },
      gravityY: 800,
      alpha: { start: 1, end: 0 },
      scale: 0.5,
      active: false,
      delay: { min: 0, max: 100 },
    })

    this.shaker = scene.plugins.get('rexShakePosition').add(this, {
      duration: 500,
      magnitude: 5,
    })
    // 0 is closed, 1 is empty, 2 is full
    this.shaker.on('complete', () => {
      this.emit('done_shaking')
    })

    let key = this.scene.input.keyboard.addKey(this.letter)
    let cb = (p) => {
      if (!this.enabled) {
        return
      }
      // ugh, downTime is mouse and timeDown is keyboard
      // time shares timebase with window.performance.now()?
      let time = p.downTime | p.timeDown
      let type = p.downTime ? 'touch' : 'keyboard'
      if (type === 'keyboard' && p.originalEvent.repeat) {
        return
      }
      if (type === 'touch') {
        if (!p.wasTouch) {
          type = 'mouse'
        }
      }
      this.emit('chest_selected', { value: this.letter, type: type, time: time })
      this.disable()
      this.other.disable()
      this.shaker.shake()
    }
    this.setInteractive(new Phaser.Geom.Rectangle(-110, -110, 220, 220), Phaser.Geom.Rectangle.Contains)
    key.on('down', cb)
    this.on('pointerdown', cb)
    this.reset()
  }
  reset() {
    this.reward = false
    this.sprite.setFrame(0)
  }
  explode(reward) {
    let frame = 1
    if (reward > 0) {
      frame = 2
      this.emitter.active = true
      this.emitter.explode(reward)
      this.jangle.play()
    } else {
      this.thump.play()
    }
    this.sprite.setFrame(frame)
    // after 1000ms, emit another event to indicate end of reward period
    this.scene.time.delayedCall(1000, () => {
      this.emit('done_rewarding')
      this.alpha = 0.5
      this.other.alpha = 0.5
    })
  }
  prime(other) {
    this.other = other
    this.enabled = true
    this.alpha = 1
    this.other.alpha = 1
  }
  disable() {
    //this.removeAllListeners()
    this.enabled = false
    //this.removeInteractive()
    //this.scene.input.keyboard.removeKey(this.letter)
  }
}
