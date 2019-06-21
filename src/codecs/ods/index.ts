/**
 * Codec for Open Document Spreadsheet (ODS)
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import * as vfile from '../../vfile'
import * as xlsx from '../xlsx'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.oasis.opendocument.spreadsheet'
  // spell-checker: enable
]

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return xlsx.decode(file)
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return xlsx.encode(node, { format: 'ods' })
}
