import { LinkImplementation } from '../../dist/box/Link'
import { WayPointData } from '../../dist/box/WayPointData'
import { NodeWidget } from '../../dist/node/NodeWidget'
import { Box } from '../../dist/pluginFacade'

const colors: string[] = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal']

export class DidactedLink extends LinkImplementation {

    public static getSuperClass(): typeof LinkImplementation {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor
    }

    public getColor(): string {
        let toBoxId: string
        const dropTargetIfRenderInProgress: Box|NodeWidget|null = this.getTo().getDropTargetIfRenderInProgress()
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId()
        } else {
            const path: WayPointData[] = this.getData().to.path
            toBoxId = path[path.length-1].boxId
        }
        
        const hash: number = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length/2) + toBoxId.charCodeAt(toBoxId.length-1)
        return colors[hash % colors.length]
    }

}