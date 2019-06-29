/**
 * @module latex
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import * as pandoc from '../pandoc'
import * as vfile from '../../util/vfile'

export const mediaTypes = ['application/x-latex']

export const extNames = ['latex', 'tex']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.latex)
}

export const encode: Encode = async (
  node: stencila.Node,
  options = {}
): Promise<vfile.VFile> => {
  return pandoc.encode(node, {
    ...options,
    format: pandoc.OutputFormat.latex
  })
}
