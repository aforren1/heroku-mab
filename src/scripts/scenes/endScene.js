//import { globalData } from '../utils/globaldata'
import { postData } from '../utils/comms'
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
  create() {
    const socket = this.game.socket
    const id = this.game.id
    let center = this.game.config.height / 2
    this.add
      .text(center, center, 'Fin.', {
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
    window.removeEventListener('beforeunload', onBeforeUnload)
    log.info('onBeforeUnload removed.')
    socket.emit('all_done', id)
    socket.once('i_hear_ya', (url) => {
      console.log(url)
    })
    // TODO: validate data in postData
    // TODO: handle successful/unsuccessful post
  }
}
