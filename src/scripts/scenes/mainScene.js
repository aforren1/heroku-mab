import log from '../utils/logger'
import { ChestGroup } from '../objects/chestgroup'
import { Score } from '../objects/score'
import { Enum } from '../utils/enum'
import { generateProbs } from '../utils/bandit'
import { globalData } from '../utils/globaldata'
import { copyObj } from '../utils/copy'

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

  getTrialRes() {
    let prob = this.probs[this.trial_counter]
    let left = Math.random() < prob
    let right = Math.random() < 1 - prob
    return [left, right]
  }

  create(data) {
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
    this.tweens.add({
      targets: gogogo,
      alpha: { from: 1, to: 0 },
      ease: 'Cubic',
      duration: 3000,
      repeat: 0,
    })
    let score = new Score(this, center, center - 380, 0)
    score.addScore(data.score)
    this.score = score
    let chest = new ChestGroup(this, center, center, 400, 0)
    this.chest = chest
    this.tweens.add({
      targets: [score, chest],
      alpha: { from: 0, to: 1 },
      duration: 1000,
      onComplete: () => {
        this.state = states.MAIN_LOOP
      },
    })
    this.probs = generateProbs()
    globalData.trials = Array()
    this.trial_counter = 0
  }
  update() {
    switch (this.state) {
      case states.FADE_IN:
        break
      case states.MAIN_LOOP:
        if (this.entering) {
          log.info(`trial ${this.trial_counter}`)
          this.entering = false
          this.chest.reset()
          this.trial_data = {
            trial: this.trial_counter,
            probs: [this.probs[this.trial_counter], 1 - this.probs[this.trial_counter]],
            outcomes: this.getTrialRes(),
          }

          this.chest.prime(...this.trial_data.outcomes)
          this.trial_reference_time = window.performance.now()

          this.chest.once('chestdone', (l) => {
            let cb = () => {}
            if (l.reward) {
              cb = () => {
                this.score.addScore(50)
              }
            }
            this.time.delayedCall(1000, cb)
            this.time.delayedCall(2000, () => {
              this.trial_data.chest = l.value
              this.trial_data.reference_time = this.trial_reference_time
              this.trial_data.rt = l.time - this.trial_reference_time
              this.trial_data.input_type = l.type
              this.trial_data.reward = l.reward
              this.trial_data.post_trial_score = this.score.score
              // store trial data (make a copy)
              globalData.trials.push(copyObj(this.trial_data))
              this.entering = true
              this.trial_counter += 1
              if (this.trial_counter >= this.probs.length) {
                this.state = states.FADE_OUT
              }
            })
          })
        }
        break
      case states.FADE_OUT:
        // save data
        if (this.entering) {
          this.entering = false
          log.info(`Final score: ${this.score.score}`)
          globalData.logs = log.msgs
          // fade out
          this.scene.start('EndScene')
        }
        break
    }
  }
}
