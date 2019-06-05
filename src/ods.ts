/**
 * Codec for Open Document Spreadsheet (ODS)
 */

import stencila from '@stencila/schema'
import { Encode } from '.'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.oasis.opendocument.spreadsheet'
  // spell-checker: enable
]

export async function decode(file: VFile): Promise<stencila.Node> {
  return xlsx.decode(file)
}

export const encode: Encode = async (node: stencila.Node): Promise<VFile> => {
  return xlsx.encode(node, undefined, 'ods')
}
