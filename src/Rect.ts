import { ClientPosition, LocalPosition } from './box/Transform'

export abstract class Rect<POSITION extends LocalPosition|ClientPosition> { // TODO: move implementations from sub classes up
  public readonly x: number
  public readonly y: number
  public readonly width: number
  public readonly height: number

  public constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  protected isPositionInsideRaw(x: number, y: number): boolean {
    return x >= this.x && y >= this.y && x <= this.getRightX() && y <= this.getBottomY()
  }

  public getRightX() {
    return this.x+this.width
  }

  public getBottomY() {
    return this.y+this.height
  }

}
