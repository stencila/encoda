/**
 * @module dmagic
 */

import stencila from '@stencila/schema'
import { nodeType } from '@stencila/schema/dist/util'
import fs from 'fs-extra'
import path from 'path'
import { dump, Encode, EncodeOptions } from '../..'
import * as vfile from '../../util/vfile'

/**
 * The media types that this codec can decode/encode.
 */
export const mediaTypes = ['application/x-demo-magic']

/**
 * The file name extensions to register for the codec.
 * Used to be able to explicitly refer to this codec.
 */
export const extNames = ['dmagic', 'demo-magic']

/**
 * Decode a `VFile` with `demo-magic.sh` content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  throw new Error('Decoding of Demo Magic scripts is not supported.')
}

// The content of the Bash Script. Lazily loaded.
let demoMagicSh: string | undefined

/**
 * Encode a Stencila `Node` to a `VFile` with `demo-magic.sh` content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node,
  options: EncodeOptions = {}
): Promise<vfile.VFile> => {
  const { isBundle = true } = options
  let bash = await encodeNode(node)
  if (isBundle) {
    if (!demoMagicSh) {
      demoMagicSh = await fs.readFile(
        path.join(__dirname, 'demo-magic-template.sh'),
        'utf8'
      )
    }
    bash = demoMagicSh + bash
  }
  return vfile.load(bash)
}

/**
 * Encode a Stencila `Node` as a Demo Magic Bash string.
 */
async function encodeNode(node: stencila.Node): Promise<string> {
  if (node === null || typeof node !== 'object') return ''

  switch (nodeType(node)) {
    case 'Heading':
      const heading = node as stencila.Heading
      return `h ${heading.depth} "${await escapedMd(heading)}"\n\n`

    case 'Paragraph':
      return `p "# ${await escapedMd(node)}"\n\n`

    case 'CodeBlock':
      const block = node as stencila.CodeBlock
      if (
        block.language &&
        !(block.language === 'bash' || block.language === 'sh')
      ) {
        return ''
      }
      if (block.meta && block.meta.hidden === '') {
        return `${block.value}\n`
      }
      let bash = `pe "${block.value}"\n`
      if (block.meta) {
        if (block.meta.pause) bash += `z ${block.meta.pause}\n`
      }
      return bash + '\n'
  }

  // For all other node types, recurse over their children
  const strings = await Promise.all(Object.values(node).map(encodeNode))
  return strings.join('')
}

/**
 * Generate escaped Markdown suitable for inserting into Bash
 */
async function escapedMd(node: stencila.Node): Promise<string> {
  const markdown = await dump(node, 'md')
  return markdown.replace(/`/g, '\\`')
}
