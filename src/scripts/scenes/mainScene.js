import log from '../utils/logger'
import { ChestGroup } from '../objects/chestgroup'
import { Score } from '../objects/score'
import { Enum } from '../utils/enum'
import { Bonuses } from '../objects/bonuses'

const states = Enum(['FADE_IN', 'MAIN_LOOP', 'FADE_OUT'])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
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

  create(data) {
    let width = this.game.config.width
    let center = this.game.config.height / 2
    let gogogo = this.add
      .text(center, center - 150, 'GO!', {
        fontFamily: 'Arial',
        fontSize: 80,
        align: 'center',
        stroke: '#000',
        color: '#00ff7f',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
    gogogo.alpha = 0
    let score = new Score(this, center, center - 380, 0)
    score.addScore(data.score)
    this.score = score
    let chests = new ChestGroup(this, center, center, 400, 0)
    this.chests = chests
    this.chests.reset()
    // TODO: calculate bonuses based on total # of trials
    this.bonuses = new Bonuses(this, width - 160, 100, data.bonusVals, 0)
    this.bonusVals = data.bonusVals
    this.tweens.add({
      targets: chests,
      alpha: { from: 0, to: 0.5 },
      duration: 1000,
    })
    this.tweens.add({
      targets: [score, this.bonuses],
      alpha: { from: 0, to: 1 },
      duration: 1000,
      onComplete: () => {
        this.time.delayedCall(500, () => {
          this.tweens.add({
            targets: gogogo,
            alpha: { from: 1, to: 0 },
            ease: 'Cubic',
            duration: 2000,
            repeat: 0,
          })
          this.state = states.MAIN_LOOP
        })
      },
    })
  }
  update() {
    const socket = this.game.socket
    const id = this.game.id

    switch (this.state) {
      case states.FADE_IN:
        break
      case states.MAIN_LOOP:
        if (this.entering) {
          this.entering = false
          this.got_feedback = false
          this.done_shaking = false
          this.trial_data = {}
          this.chests.prime()
          this.trial_reference_time = window.performance.now()

          this.chests.once('chest_selected', (data, selection) => {
            log.info(`Chest ${data.value} selected with RT ${data.time - this.trial_reference_time}`)
            data.trial_reference_time = this.trial_reference_time
            socket.emit('trial_choice', id, data)
            socket.once('trial_feedback', (resp) => {
              this.got_feedback = true
              this.trial_data.feedback = resp
              if (this.done_shaking) {
                this.events.emit('both_resolved')
              }
            })
            this.chests.once('done_shaking', (sel) => {
              this.done_shaking = true
              this.trial_data.selection = sel
              if (this.got_feedback) {
                this.events.emit('both_resolved')
              }
            })
            this.events.once('both_resolved', () => {
              // change state if necessary, show feedback
              socket.emit('log_dump', id, log.msgs)
              log.msgs = [] // empty messages
              let td = this.trial_data
              td.selection.explode(td.feedback.reward)
              this.score.addScore(td.feedback.reward)
              this.chests.once('done_rewarding', () => {
                this.chests.reset()
                this.time.delayedCall(500, () => {
                  this.entering = true
                })
                if (td.feedback.done) {
                  this.finalScore = td.feedback.totalReward
                  this.state = states.FADE_OUT
                }
              })
            })
          })
        }
      case states.FADE_OUT:
        // save data
        if (this.entering) {
          this.entering = false
          log.info(`Ending game. Final score: ${this.finalScore}`)
          // fade out
          this.tweens.addCounter({
            from: 255,
            to: 0,
            duration: 2000,
            onUpdate: (t) => {
              let v = Math.floor(t.getValue())
              this.cameras.main.setAlpha(v / 255)
            },
            onComplete: () => {
              this.scene.start('EndScene', {
                finalScore: this.finalScore,
                bonusVals: this.bonusVals,
              })
            },
          })
        }
    }
  }
}
