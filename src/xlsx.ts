/**
 * Compiler for Microsoft Excel
 */

import { VFile } from 'vfile'

import * as spreadsheet from './spreadsheet'
import { Node } from './sast'

export const media = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export async function parse (file: VFile): Promise<Node> {
  return spreadsheet.parse(file)
}

export async function unparse (node: Node, file: VFile): Promise<void> {
  return spreadsheet.unparse(node, file, 'xlsx')
}
