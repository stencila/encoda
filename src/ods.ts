/**
 * Compiler for Open Document Spreadsheet (ODS)
 */

import { Node } from './sast'
import * as xlsx from './xlsx'
import { VFile } from './vfile'

export const media = ['application/vnd.oasis.opendocument.spreadsheet', 'ods']

export async function parse(file: VFile): Promise<Node> {
  return xlsx.parse(file)
}

export async function unparse(node: Node): Promise<VFile> {
  return xlsx.unparse(node, undefined, 'ods')
}
