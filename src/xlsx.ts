/**
 * Compiler for Microsoft Excel.
 *
 * Also acts as base implementation for other spreadsheet based formats
 */

import * as xlsx from 'xlsx'

import { Node } from './sast'
import { csf2sast, sast2csf } from './sast-csf'
import { load, VFile } from './vfile'

export const media = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xlsx'
]

export async function parse(file: VFile): Promise<Node> {
  let workbook = xlsx.read(file.contents, {
    type: 'buffer'
  })
  return csf2sast(workbook)
}

export async function unparse(
  node: Node,
  filePath?: string,
  format: string = 'xlsx'
): Promise<VFile> {
  const workbook = sast2csf(node)
  const buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: format as xlsx.BookType
  })
  return load(buffer)
}
