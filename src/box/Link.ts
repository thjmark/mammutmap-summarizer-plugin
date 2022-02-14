import { util } from '../util'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { boxManager } from './BoxManager'
import { Box } from './Box'
import { BoxLinks } from './BoxLinks'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { LinkEnd } from './LinkEnd'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'

export class Link implements Hoverable {
  private readonly data: BoxMapLinkData
  private managingBox: Box
  private readonly from: LinkEnd
  private readonly to: LinkEnd
  private rendered: boolean = false
  private highlight: boolean = false

  public constructor(data: BoxMapLinkData, managingBox: Box) {
    this.data = data
    this.managingBox = managingBox
    this.from = new LinkEnd(this.data.id+'from', this, 'square')
    this.to = new LinkEnd(this.data.id+'to', this, 'arrow')
  }

  public getId(): string {
    return this.data.id
  }

  public getData(): BoxMapLinkData {
    return this.data
  }

  public getManagingBox(): Box {
    return this.managingBox
  }

  public getManagingBoxLinks(): BoxLinks {
    return this.managingBox.links
  }

  public getFrom(): LinkEnd {
    return this.from
  }

  public getTo(): LinkEnd {
    return this.to
  }

  public async render(): Promise<void> {
    const fromInBaseCoords: {x: number, y: number} = this.getDeepestRenderedWayPointPositionInManagingBoxCoords(this.data.fromPath.wayPoints)
    const toInBaseCoords: {x: number, y: number} = this.getDeepestRenderedWayPointPositionInManagingBoxCoords(this.data.toPath.wayPoints)

    return this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async unrender(): Promise<void> {
    if(!this.rendered) {
      return
    }

    const proms: Promise<any>[] = []
    proms.push(this.removeContextMenu())
    this.deregisterAtBorderingBoxes()
    proms.push(this.from.unrender())
    proms.push(this.to.unrender())

    this.rendered = false
    await Promise.all(proms)
  }

  public async renderLinkEndAtPosition(linkEnd: LinkEnd, clientX: number, clientY: number, draggingInProgress: boolean = false): Promise<void> {
    let fromInBaseCoords: {x: number, y: number}
    let toInBaseCoords: {x: number, y: number}
    if (linkEnd === this.to) {
      fromInBaseCoords = this.getDeepestRenderedWayPointPositionInManagingBoxCoords(this.data.fromPath.wayPoints)
      toInBaseCoords = await this.managingBox.transformClientPositionToLocal(clientX, clientY)
    } else if (linkEnd === this.from) {
      fromInBaseCoords = await this.managingBox.transformClientPositionToLocal(clientX, clientY)
      toInBaseCoords = this.getDeepestRenderedWayPointPositionInManagingBoxCoords(this.data.toPath.wayPoints)
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }

    await this.renderAtPosition(fromInBaseCoords, toInBaseCoords, draggingInProgress)
  }

  public async renderLinkEndInDropTargetAndSave(linkEnd: LinkEnd, dropTarget: Box): Promise<void> {
    if (linkEnd === this.to) {
      await this.reorderAndSaveWithEndBoxes(this.from.getBorderingBox(), dropTarget)
    } else if (linkEnd === this.from) {
      await this.reorderAndSaveWithEndBoxes(dropTarget, this.to.getBorderingBox())
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }
  }

  private async renderAtPosition(fromInBaseCoords: {x: number, y: number}, toInBaseCoords: {x: number, y: number}, draggingInProgress: boolean = false): Promise<void> {
    const distanceInPixel: number[] = [toInBaseCoords.x-fromInBaseCoords.x, toInBaseCoords.y-fromInBaseCoords.y]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInBaseCoords.x+'%" y1="'+fromInBaseCoords.y+'%" x2="'+toInBaseCoords.x+'%" y2="'+toInBaseCoords.y+'%"'
    const lineHighlightClass: string = this.highlight ? ' '+style.getHighlightClass() : ''
    const lineClassHtml: string = `class="${style.getHighlightTransitionClass()}${lineHighlightClass}"`
    const linePointerEventsStyle: string = draggingInProgress ? '' : 'pointer-events:auto;'
    const lineStyleHtml: string = 'style="stroke:'+style.getLinkColor()+';stroke-width:2px;'+linePointerEventsStyle+'"'
    const lineHtml: string = `<line id="${this.getId()}Line" ${linePositionHtml} ${lineClassHtml} ${lineStyleHtml}/>`

    const proms: Promise<any>[] = []
    if (!this.rendered) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const svgHtml: string = '<svg id="'+this.getId()+'svg">'+lineHtml+'</svg>'
      await renderManager.setContentTo(this.getId(), svgHtml+fromHtml+toHtml)
      proms.push(renderManager.setStyleTo(this.getId()+'svg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;'))
      this.registerAtBorderingBoxes()
      proms.push(this.addContextMenu())
      this.rendered = true
    } else {
      proms.push(renderManager.setContentTo(this.getId()+'svg', lineHtml))
    }

    const fromBox: Box = this.getDeepestRenderedBox(this.data.fromPath.wayPoints).box
    proms.push(this.from.render(fromBox, fromInBaseCoords.x, fromInBaseCoords.y, angleInRadians))
    const toBox: Box = this.getDeepestRenderedBox(this.data.toPath.wayPoints).box
    proms.push(this.to.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians))

    await Promise.all(proms)
  }

  private async addContextMenu(): Promise<void> {
    const proms: Promise<any>[] = []

    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, clientX, clientY)))
    proms.push(HoverManager.addHoverable(this, () => this.setHighlight(true), () => this.setHighlight(false)))

    await Promise.all(proms)
  }

  private async removeContextMenu(): Promise<void> {
    const proms: Promise<any>[] = []

    proms.push(HoverManager.removeHoverable(this))
    proms.push(renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'))

    await Promise.all(proms)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although Link is not rendered yet.')
    }

    this.highlight = highlight
    if (highlight) {
      renderManager.addClassTo(this.getId()+'Line', style.getHighlightClass())
    } else {
      renderManager.removeClassFrom(this.getId()+'Line', style.getHighlightClass())
    }
    this.to.setHighlight(highlight)
    this.from.setHighlight(highlight)
  }

  private getDeepestRenderedWayPointPositionInManagingBoxCoords(path: WayPointData[]): {x: number; y: number} {
    const deepestRendered: {box: Box, wayPoint: WayPointData} = this.getDeepestRenderedBox(path)
    return this.managingBox.transformInnerCoordsRecursiveToLocal(deepestRendered.box, deepestRendered.wayPoint.x, deepestRendered.wayPoint.y)
  }

  private getDeepestRenderedBox(path: WayPointData[]): {box: Box, wayPoint: WayPointData} | never {
    const renderedBoxes: {box: Box, wayPoint: WayPointData}[] = this.getRenderedBoxes(path)
    return renderedBoxes[renderedBoxes.length-1]
  }

  private getRenderedBoxes(path: WayPointData[]): {box: Box, wayPoint: WayPointData}[] | never {
    if (path.length === 0) {
      util.logError(this.managingBox.getSrcPath()+' has empty link path.')
    }

    const renderedBoxesInPath: {box: Box, wayPoint: WayPointData}[] = []

    for(let i = 0; i < path.length; i++) {
      const box: Box|undefined = boxManager.getBoxIfExists(path[i].boxId)
      if (box) { // TODO: also check if box is rendered
        renderedBoxesInPath.push({box: box, wayPoint: path[i]})
      }
    }

    return renderedBoxesInPath
  }

  public async reorderAndSave(): Promise<void|never> {
    await this.reorderAndSaveWithEndBoxes(this.from.getBorderingBox(), this.to.getBorderingBox())
  }

  private async reorderAndSaveWithEndBoxes(fromBox: Box, toBox: Box): Promise<void|never> {
    const fromClientPosition: {x: number, y: number} = await this.from.getClientMidPosition()
    const toClientPosition: {x: number, y: number} = await this.to.getClientMidPosition()
    const relation: {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} = Box.findCommonAncestor(fromBox, toBox)

    const fromWayPoints: Promise<WayPointData>[] = relation.fromBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(fromClientPosition.x, fromClientPosition.y)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.x, positionInBoxCoords.y)
    })
    const toWayPoints: Promise<WayPointData>[] = relation.toBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(toClientPosition.x, toClientPosition.y)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.x, positionInBoxCoords.y)
    })

    this.deregisterAtBorderingBoxes()

    // TODO: WIP unshift into existing WayPointData[] till inner boxId matches (matters when shallow render gets implemented)
    this.data.fromPath.wayPoints = await Promise.all(fromWayPoints)
    this.data.toPath.wayPoints = await Promise.all(toWayPoints)

    const oldManagingBox: Box = this.managingBox
    this.managingBox = relation.commonAncestor
    this.registerAtBorderingBoxes()

    if(oldManagingBox !== this.managingBox) {
      BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this)
    } else {
      this.managingBox.saveMapData()
    }

    await this.render()
  }

  private registerAtBorderingBoxes(): void {
    this.getRenderedBoxesWithoutBase(this.data.fromPath.wayPoints).forEach((box: Box) => box.registerBorderingLink(this))
    this.getRenderedBoxesWithoutBase(this.data.toPath.wayPoints).forEach((box: Box) => box.registerBorderingLink(this))
  }

  private deregisterAtBorderingBoxes(): void {
    this.getRenderedBoxesWithoutBase(this.data.fromPath.wayPoints).forEach((box: Box) => box.deregisterBorderingLink(this))
    this.getRenderedBoxesWithoutBase(this.data.toPath.wayPoints).forEach((box: Box) => box.deregisterBorderingLink(this))
  }

  private getRenderedBoxesWithoutBase(path: WayPointData[]): Box[] {
    return this.getRenderedBoxes(path).map((tuple: {box: Box, wayPoint: WayPointData}) => tuple.box).filter(box => box !== this.managingBox)
  }

}
