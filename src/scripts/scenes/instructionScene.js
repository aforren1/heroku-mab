import log from '../utils/logger'
import { ChestGroup } from '../objects/chestgroup'
import { TypingText } from '../objects/typingtext'
import { Score } from '../objects/score'
import { Enum } from '../utils/enum'
import { Bonuses } from '../objects/bonuses'
const states = Enum(['FADE_IN', 'INSTRUCT_1', 'INSTRUCT_2', 'INSTRUCT_3', 'FADE_OUT'])
const type_speed = 50 // 50 for real deal

let texts = [
  'Try to collect the most [color=yellow]treasure[/color]!\n\nSelect the treasure chest on the right side, either by clicking it or pressing the "L" key.',
  'One chest will be more likely to contain [color=yellow]treasure[/color] than the other, but [b][i][color=yellow]which[/color][/i][/b] chest that is may change over time.\n\nSelect the treasure chest on the left side to continue.',
  'In addition to the base payment rate,\nyou can earn [color=yellow]bonuses[/color] by getting high scores.\n\nSelect the chest on the right side to continue.',
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
    const socket = this.game.socket
    const id = this.game.id
    let height = this.game.config.height
    let width = this.game.config.width
    let center = height / 2

    let score = new Score(this, center, center - 380, 0)
    this.score = score
    // ChestGroup is currently just two chests
    let chests = new ChestGroup(this, center, center + 150, 400, 0)
    this.chests = chests
    this.chests.reset()
    socket.emit('gimme_bonuses', id)
    socket.once('the_bonuses_are', (vals) => {
      this.bonuses = new Bonuses(this, width - 160, 100, vals, 0)
      this.bonusVals = vals
    })
    let text = TypingText(this, center, center - 100, '', {
      fontFamily: 'Georgia',
      fontSize: '32px',
      color: '#ffffff',
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
        chests.alpha = v / 250
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
          this.instr_text.typing.once('complete', () => {
            // queue up both chests
            this.chests.prime()
            this.chests.once('chest_selected', (data, selection) => {
              socket.emit('instruct_choice', id, data.value === 'L')
              this.chests.once('done_shaking', (sel) => {
                let pts = data.value === 'L' ? 100 : 0
                this.score.addScore(pts)
                sel.explode(pts)
              })
              this.chests.once('done_rewarding', () => {
                this.state = states.INSTRUCT_2
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
              this.chests.once('done_shaking', (sel) => {
                let pts = data.value === 'A' ? 100 : 0
                this.score.addScore(pts)
                sel.explode(pts)
              })
              this.chests.once('done_rewarding', () => {
                this.state = states.INSTRUCT_3
              })
            })
          })
        }
      case states.INSTRUCT_3:
        if (this.entering) {
          log.info('Entering instruct_3')
          this.entering = false
          this.tweens.add({
            targets: this.bonuses,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.1, to: 1 },
            duration: 1500,
          })
          this.instr_text.start(texts[2], type_speed)
          this.chests.reset()
          this.instr_text.typing.once('complete', () => {
            // queue up both chests
            this.chests.prime()
            this.chests.once('chest_selected', (data, selection) => {
              socket.emit('instruct_choice', id, data.value === 'L')
              this.chests.once('done_shaking', (sel) => {
                let pts = data.value === 'L' ? 100 : 0
                this.score.addScore(pts)
                sel.explode(pts)
              })
              this.chests.once('done_rewarding', () => {
                this.state = states.FADE_OUT
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
            onComplete: () =>
              this.scene.start('MainScene', {
                bonusVals: this.bonusVals,
                score: this.score.score,
              }),
          })
        }
    }
  }
}
