/**
 * @module ods
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import * as vfile from '../../util/vfile'
import * as xlsx from '../xlsx'

export const mediaTypes = ['application/vnd.oasis.opendocument.spreadsheet']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return xlsx.decode(file)
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return xlsx.encode(node, { format: 'ods' })
}
