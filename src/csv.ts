/**
 * Compiler for comma separated values (CSV)
 */

import { Node } from './sast'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const media = ['text/csv', 'csv']

export async function parse(file: VFile): Promise<Node> {
  return xlsx.parse(file)
}

export async function unparse(node: Node): Promise<VFile> {
  return xlsx.unparse(node, undefined, 'csv')
}
