import { Enum } from '../utils/enum'
import { onBeforeUnload } from '../game'
import log from '../utils/logger'

const states = Enum(['FADE_IN', 'MAIN_LOOP', 'FADE_OUT'])

export default class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' })
    this._state = states.FADE_IN
    this.entering = true
  }
  create(data) {
    const socket = this.game.socket
    const id = this.game.id
    let center = this.game.config.height / 2
    let color = '#ffffff'
    let score = data.finalScore
    let monies = Math.ceil(score / 10000).toFixed(2)
    this.add
      .rexBBCodeText(
        center,
        center,
        `[stroke]Thank you for participating!\nFinal score: [color=#ffd700]${score}[/color]Final bonus: [color=#ffd700]$${monies}[/color]\nAutomatically redirecting\nin 10 seconds...[/stroke]`,
        {
          fontFamily: 'Georgia',
          fontSize: 60,
          color: '#ffffff',
          stroke: 'black',
          strokeThickness: 4,
          align: 'center',
        }
      )
      .setOrigin(0.5, 0.5)
    // darken background slightly
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor32(0, 0, 0, 125))
    window.removeEventListener('beforeunload', onBeforeUnload)
    log.info('onBeforeUnload removed.')
    socket.emit('ending', id) // let the server know we're done
    socket.once('the_goods', (resp) => {
      this.time.delayedCall(10000, () => {
        // redirect to resp.successURL
        // final score is resp.finalScore
        window.location.href = resp.successURL
      })
    })
  }
}
