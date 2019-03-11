/**
 * Compiler for Open Document Spreadsheet (ODS)
 */

import { VFile } from 'vfile'

import * as spreadsheet from './spreadsheet'
import { Node } from './sast'

export const media = [
  'application/vnd.oasis.opendocument.spreadsheet'
]

export async function parse (file: VFile): Promise<Node> {
  return await spreadsheet.parse(file)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  return await spreadsheet.unparse(node, file, 'ods')
}
