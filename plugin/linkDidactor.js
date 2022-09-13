"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Link_1 = require("../dist/box/Link");
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem);
async function deactivate() {
    (0, Link_1.override)(DidactedLink.getSuperClass());
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    util_1.util.logInfo('deactivated linkDidactor plugin');
}
async function activate() {
    (0, Link_1.override)(DidactedLink);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    util_1.util.logInfo('activated linkDidactor plugin');
}
const colors = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal'];
class DidactedLink extends Link_1.LinkImplementation {
    static getSuperClass() {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor;
    }
    getColor() {
        let toBoxId;
        const dropTargetIfRenderInProgress = this.getTo().getDropTargetIfRenderInProgress();
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId();
        }
        else {
            const path = this.getData().to.path;
            toBoxId = path[path.length - 1].boxId;
        }
        const hash = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length / 2) + toBoxId.charCodeAt(toBoxId.length - 1);
        return colors[hash % colors.length];
    }
}
activate();
