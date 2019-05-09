/**
 * Compiler for Pandoc Markdown
 */

import stencila from '@stencila/schema'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = []

export const extNames = ['markdown']

export async function parse(file: VFile): Promise<stencila.Node> {
  return pandoc.parse(file, pandoc.InputFormat.markdown)
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return pandoc.unparse(node, undefined, pandoc.OutputFormat.markdown, [
    '--wrap=none'
  ])
}
