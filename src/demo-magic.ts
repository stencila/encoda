/**
 * Codec for [Demo Magic](https://github.com/paxtonhare/demo-magic) script.
 *
 * > `demo-magic.sh` is a handy shell script that enables you to script
 * > repeatable demos in a bash environment so you don't have to type as
 * > you present. Rather than trying to type commands when presenting you
 * > simply script them and let `demo-magic.sh` run them for you.
 *
 * This codec encodes a Stencila `Node` (usually an `Article` authored using
 * Markdown) as a Bash script that uses the `demo-magic.sh` functions to
 * provide an interactive demo with simulated typing and other features.
 * It's very useful for recording screencasts for command line applications.
 *
 * It supports `Heading`, `Paragraph` and `CodeBlock` nodes with `bash` or
 * `sh` as the `language`.
 *
 * You can run the generated script using options. Use `-h` for help.
 */

import stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import { Encode, EncodeOptions } from '.'
import * as md from './md'
import type from './util/type'
import { dump, load, VFile } from './vfile'

/**
 * The media types that this codec can decode/encode.
 */
export const mediaTypes = ['application/x-demo-magic']

/**
 * The file name extensions to register for the codec.
 * Used to be able to explicitly refer to this codec.
 */
export const extNames = ['demo-magic']

/**
 * Decode a `VFile` with `demo-magic.sh` content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: VFile): Promise<stencila.Node> {
  throw new Error('Decoding of Demo Magic scripts is not supported.')
}

interface DemoMagicOptions {
  embed?: boolean
}

/**
 * Encode a Stencila `Node` to a `VFile` with `demo-magic.sh` content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode<DemoMagicOptions> = async (
  node: stencila.Node,
  { codecOptions = { embed: true } }: EncodeOptions<DemoMagicOptions> = {}
): Promise<VFile> => {
  let bash = await encodeNode(node)
  if (codecOptions.embed) {
    if (!demoMagicSh) {
      demoMagicSh = await fs.readFile(
        path.join(__dirname, 'templates', 'demo-magic.sh'),
        'utf8'
      )
    }
    bash = demoMagicSh + bash
  }
  return load(bash)
}

// The content of the Bash Script. Lazily loaded.
let demoMagicSh: string | undefined

/**
 * Encode a Stencila `Node` as a Demo Magic Bash string.
 */
async function encodeNode(node: stencila.Node): Promise<string> {
  if (node === null || typeof node !== 'object') return ''

  switch (type(node)) {
    case 'Heading':
      const heading = node as stencila.Heading
      return `h ${heading.depth} "${await escapedMd(heading)}"\n\n`

    case 'Paragraph':
      return `p "# ${await escapedMd(node)}"\n\n`

    case 'CodeBlock':
      const block = node as stencila.CodeBlock
      if (
        block.language &&
        !(block.language == 'bash' || block.language == 'sh')
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
  const markdown = await dump(await md.encode(node, {}))
  return markdown.replace(/`/g, '\\`')
}
