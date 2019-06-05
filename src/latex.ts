/**
 * Codec for LaTeX
 */

import stencila from '@stencila/schema'
import { Encode } from '.'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = ['application/x-latex']

export const extNames = ['latex', 'tex']

export async function decode(file: VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.latex)
}

export const encode: Encode = async (
  node: stencila.Node,
  filePath?: string
): Promise<VFile> => {
  return pandoc.encode(node, filePath, pandoc.OutputFormat.latex)
}
