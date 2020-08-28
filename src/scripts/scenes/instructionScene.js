import log from '../utils/logger'
import { ChestGroup } from '../objects/chestgroup'
import { TypingText } from '../objects/typingtext'
import { Score } from '../objects/score'
import { Enum } from '../utils/enum'

const states = Enum(['FADE_IN', 'INSTRUCT_1', 'INSTRUCT_2', 'FADE_OUT'])
const type_speed = 10

let texts = [
  'Try to collect the most [color=yellow]treasure[/color]!\n\nSelect the treasure chest on the right side, either by clicking it or pressing the "L" key.',
  'One chest will be more likely to contain [color=yellow]treasure[/color] than the other, but [b][i]which[/i][/b] chest that is may change over time.\n\nSelect the treasure chest on the left side to continue.',
  // TODO: fill in more things (i.e. explain bonuses/some alternative if bonuses disabled)
]
export default class InstructionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstructionScene' })
    this._state = states.FADE_IN
    this.entering = true
  }

  set state(newState) {
    if (this.state != newState) {
      this.entering = true
      this._state = newState
    }
  }

  get state() {
    return this._state
  }

  create() {
    let center = this.game.config.height / 2

    let score = new Score(this, center, center - 380, 0)
    this.score = score
    // ChestGroup is currently just two chests
    let chests = new ChestGroup(this, center, center + 150, 400, 0)
    this.chests = chests
    let text = TypingText(this, center, center - 150, '', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#FFF',
      stroke: '#000',
      strokeThickness: 4,
      wrap: {
        mode: 'word',
        width: 600,
      },
      padding: {
        x: 32,
        y: 32,
      },
      maxlines: 3,
    }).setOrigin(0.5, 0.5)
    text.visible = false
    this.instr_text = text
    // darken background slightly
    this.tweens.addCounter({
      from: 0,
      to: 125,
      duration: 1000,
      onUpdate: (t) => {
        let v = Math.floor(t.getValue())
        this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor32(0, 0, 0, v))
        chests.alpha = v / 125
        score.alpha = v / 125
      },
      onComplete: () => {
        this.state = states.INSTRUCT_1
      },
    })
  }
  update() {
    const socket = this.game.socket
    const id = this.game.id
    switch (this.state) {
      case states.FADE_IN:
        // nothing to do-- driven by tween completion
        break
      case states.INSTRUCT_1:
        if (this.entering) {
          log.info('Entering instruct_1')
          this.entering = false
          this.instr_text.visible = true
          this.instr_text.start(texts[0], type_speed)
          this.chests.reset()
          this.instr_text.typing.once('complete', () => {
            // queue up both chests
            this.chests.prime()
            this.chests.once('chest_selected', (data, selection) => {
              socket.emit('instruct_choice', id, data.value === 'L')
              // TODO: would be better to wait until the particles are done
              // but it doesn't look like there's a proper event emitted?
              this.time.delayedCall(2000, () => {
                this.state = states.INSTRUCT_2
              })
              this.chests.once('done_shaking', (sel) => {
                let pts = data.value === 'L' ? 100 : 0
                this.score.addScore(pts)
                sel.explode(pts)
              })
            })
          })
        }
      case states.INSTRUCT_2:
        if (this.entering) {
          log.info('Entering instruct_2')
          this.entering = false
          this.instr_text.start(texts[1], type_speed)
          this.chests.reset()
          this.instr_text.typing.once('complete', () => {
            // queue up both chests
            this.chests.prime()
            this.chests.once('chest_selected', (data, selection) => {
              socket.emit('instruct_choice', id, data.value === 'A')
              // TODO: would be better to wait until the particles are done
              // but it doesn't look like there's a proper event emitted?
              this.time.delayedCall(2000, () => {
                this.state = states.FADE_OUT
              })
              this.chests.once('done_shaking', (sel) => {
                let pts = data.value === 'A' ? 100 : 0
                this.score.addScore(pts)
                sel.explode(pts)
              })
            })
          })
        }
      case states.FADE_OUT:
        if (this.entering) {
          log.info('Fading out instructions')
          this.entering = false
          this.tweens.addCounter({
            from: 255,
            to: 0,
            duration: 1500,
            onUpdate: (t) => {
              let v = Math.floor(t.getValue())
              let tmp = Math.min(125, v)
              this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor32(0, 0, 0, tmp))
              this.cameras.main.setAlpha(v / 255)
            },
            onComplete: () => this.scene.start('MainScene', { score: this.score.score }),
          })
        }
    }
  }
}
