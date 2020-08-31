import { Chest } from './chest'
import { EventEmitter } from 'eventemitter3'
// TODO: replace with e.g. https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-gridbuttons/
// use Phaser.Actions.GridAlign
// docs: https://photonstorm.github.io/phaser3-docs/Phaser.Types.Actions.html
// GridAlign aligns to top left of rect,
// center on x, y; letters determines number of chests
// cellSize is the spacing between chests
// nrow * ncol should === number of letters
// post-hoc moving is tough, unless we just make
// this a function. We might want to anyway, since
// we'll keep flipping positions around
// https://phasergames.com/phaser-3-dispatching-custom-events/
//
// it's good to have left/right here but not have actual chest identity
// tied to current position
export class ChestGroup extends EventEmitter {
  constructor(scene, x, y, offset, alpha) {
    super()
    this.A_chest = new Chest(scene, x - offset / 2, y, 'A', alpha)
    this.L_chest = new Chest(scene, x + offset / 2, y, 'L', alpha)
    this.offset = offset
    this.reset()
  }
  reset() {
    this.A_chest.reset()
    this.L_chest.reset()
    this.disable()
  }
  prime() {
    this.A_chest.prime(this.L_chest)
    this.L_chest.prime(this.A_chest)
    // percolate events through ChestGroup
    this.A_chest.once('chest_selected', (data) => {
      this.emit('chest_selected', data, this.A_chest)
    })
    this.L_chest.once('chest_selected', (data) => {
      this.emit('chest_selected', data, this.L_chest)
    })
    this.A_chest.once('done_shaking', () => {
      this.emit('done_shaking', this.A_chest)
    })
    this.L_chest.once('done_shaking', () => {
      this.emit('done_shaking', this.L_chest)
    })
    this.A_chest.once('done_rewarding', () => {
      this.emit('done_rewarding')
    })
    this.L_chest.once('done_rewarding', () => {
      this.emit('done_rewarding')
    })
  }
  disable() {
    // ignore events
    this.A_chest.disable()
    this.L_chest.disable()
  }
  set x(newX) {
    this.A_chest.x = newX - offset / 2
    this.L_chest.x = newX + offset / 2
  }
  set y(newY) {
    this.A_chest.y = newY
    this.L_chest.y = newY
  }
  set alpha(value) {
    this.A_chest.alpha = value
    this.L_chest.alpha = value
  }
}
