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
    this.left = new Chest(scene, x - offset / 2, y, 'A', alpha)
    this.right = new Chest(scene, x + offset / 2, y, 'L', alpha)
    this.offset = offset
    this.reset()
  }
  reset() {
    this.left.reset()
    this.right.reset()
    this.disable()
  }
  prime(lval, rval) {
    this.left.prime(lval, this.right)
    this.right.prime(rval, this.left)
    // percolate events through ChestGroup
    this.left.once('chestdone', (evt) => {
      this.emit('chestdone', evt)
    })
    this.right.once('chestdone', (evt) => {
      this.emit('chestdone', evt)
    })
  }
  disable() {
    // remove event handlers
    this.left.disable()
    this.right.disable()
  }
  set x(newX) {
    this.left.x = newX - offset / 2
    this.right.x = newX + offset / 2
  }
  set y(newY) {
    this.left.y = newY
    this.right.y = newY
  }
  set alpha(value) {
    this.left.alpha = value
    this.right.alpha = value
  }
}
