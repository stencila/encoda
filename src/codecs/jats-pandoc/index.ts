/**
 * @module jats
 */

import stencila from '@stencila/schema'
import { Encode } from '../types'
import * as pandoc from '../pandoc'
import * as vfile from '../../util/vfile'

export const mediaTypes = []

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.jats)
}

export const encode: Encode = async (
  node: stencila.Node,
  options = {}
): Promise<vfile.VFile> => {
  return pandoc.encode(node, {
    ...options,
    format: pandoc.OutputFormat.jats,
    codecOptions: { flags: [`--template=jats-template.xml`] }
  })
}
