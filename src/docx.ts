/**
 * Compiler for Microsoft Word
 */

import stencila from '@stencila/schema'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function parse(file: VFile): Promise<stencila.Node> {
  return pandoc.parse(file, pandoc.InputFormat.docx, [
    `--extract-media=${file.path}.media`
  ])
}

export async function unparse(
  node: stencila.Node,
  filePath?: string
): Promise<VFile> {
  return pandoc.unparse(node, filePath, pandoc.OutputFormat.docx, [], true)
}
