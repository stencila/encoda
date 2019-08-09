/**
 * @module ods
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { Xlsx } from '../xlsx'

const xlsx = new Xlsx()

export class ODS extends Codec implements Codec {
  public mediaTypes = ['application/vnd.oasis.opendocument.spreadsheet']

  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    return xlsx.decode(file)
  }

  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    return xlsx.encode(node, { format: 'ods' })
  }
}
