/**
 * Compiler for Open Document Spreadsheet (ODS)
 */

import stencila from '@stencila/schema'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.oasis.opendocument.spreadsheet'
  // spell-checker: enable
]

export async function parse(file: VFile): Promise<stencila.Node> {
  return xlsx.parse(file)
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return xlsx.unparse(node, undefined, 'ods')
}
