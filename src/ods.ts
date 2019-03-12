/**
 * Compiler for Open Document Spreadsheet (ODS)
 */

import { VFile } from 'vfile'

import * as xlsx from './xlsx'
import { Node } from './sast'

export const media = [
  'application/vnd.oasis.opendocument.spreadsheet'
]

export async function parse (file: VFile): Promise<Node> {
  return xlsx.parse(file)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  return xlsx.unparse(node, file, 'ods')
}
