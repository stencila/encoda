/**
 * Codec for Open Document Text (ODT)
 */

import stencila from '@stencila/schema'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = ['application/vnd.oasis.opendocument.text']

export async function decode(file: VFile): Promise<stencila.Node> {
  return pandoc.decode(file, pandoc.InputFormat.odt, [
    `--extract-media=${file.path}.media`
  ])
}

export async function encode(
  node: stencila.Node,
  filePath?: string
): Promise<VFile> {
  return pandoc.encode(node, filePath, pandoc.OutputFormat.odt, [], true)
}
