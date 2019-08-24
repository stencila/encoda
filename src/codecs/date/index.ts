/**
 * @module date
 */

import * as stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga';

const log = getLogger('encoda:date')

export class DateCodec extends Codec implements Codec {

  public readonly mediaTypes = []

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    // Add UTC to force parsing as UTC, rather than local.
    let date = new Date(content + ' UTC')
    // But if that fails, because another timezone specified then
    // just parse the raw date.
    if (isNaN(date.getTime())) date = new Date(content)
    if (isNaN(date.getTime())) {
      log.warn(`Unable to decode content to date: "${content}"`)
      return stencila.date('')
    }
    const iso = date.toISOString()
    return stencila.date(iso)
  }

  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    let iso = stencila.isA('Date', node) ? node.value : ''
    if (iso.endsWith('T00:00:00.000Z')) iso = iso.substring(0, 10)
    return vfile.load(iso)
  }
}
