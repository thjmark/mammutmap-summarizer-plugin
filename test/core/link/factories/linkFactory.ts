import { Box } from '../../../../src/core/box/Box'
import { Link } from '../../../../src/core/link/Link'

export function of(id: string, managingBox: Box): Link {
    // TODO: implement this a little bit more deeply to be usable for more cases
    const link: Link = {} as Link
    link.getId = () => id
    link.getManagingBox = () => managingBox
    return link
}