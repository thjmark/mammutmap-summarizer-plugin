import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter';
import { Box } from './Box'
import { BoxHeader } from './BoxHeader';
import { SourcelessBoxHeader } from './SourcelessBoxHeader';

export class SourcelessBox extends Box {
  private bodyRendered: boolean = false

  protected createHeader(): BoxHeader {
    return new SourcelessBoxHeader(this)
  }

  public isFolder(): boolean {
    return false
  }

  public isFile(): boolean {
    return false
  }

  protected getBodyOverflowStyle(): 'hidden' | 'visible' {
    return 'visible'
  }

  protected getBackgroundStyleClass(): string {
    return style.getSourcelessBoxBackgroundClass()
  }

  protected async renderAdditional(): Promise<void> {
    return
  }

  protected async unrenderAdditional(): Promise<void> {
    return
  }

  protected getBodyId(): string {
    return this.getId()+'Body'
  }

  protected async renderBody(): Promise<void> {
    await renderManager.setContentTo(this.getBodyId(), 'source not found') // TODO: drag to other box or drop other box here to fuse
    this.bodyRendered = true
  }

  protected async unrenderBodyIfPossible(force?: boolean): Promise<{ rendered: boolean; }> {
    await renderManager.setContentTo(this.getBodyId(), '')
    this.bodyRendered = false
    return {rendered: false}
  }

  protected isBodyRendered(): boolean {
    return this.bodyRendered
  }

}
