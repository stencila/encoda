/**
 * Codec for Open Document Text (ODT)
 */

import stencila from '@stencila/schema'
import { Encode } from '.'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = ['application/vnd.oasis.opendocument.text']

export async function decode(file: VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.odt, [
    `--extract-media=${file.path}.media`
  ])
}

export const encode: Encode = async (
  node: stencila.Node,
  options = {}
): Promise<VFile> => {
  return pandoc.encode(node, {
    ...options,
    format: pandoc.OutputFormat.odt,
    codecOptions: {
      ensureFile: true
    }
  })
}
