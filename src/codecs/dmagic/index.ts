/**
 * @module dmagic
 */

/**
 * Hello contributor 👋! If you are working on this file, please
 * endeavor to remove the need for the following `eslint-disable` line 🙏.
 * Remove the line and run `npx eslint path/to/this/file.ts` to
 * see which code needs some linting ❤️.
 * See https://github.com/stencila/encoda/issues/199 for suggestions
 * on how to refactor code to avoid non-strict boolean expressions.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import { dump } from '../..'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions } from '../types'

export class DMagicCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['application/x-demo-magic']

  /**
   * The file name extensions to register for the codec.
   * Used to be able to explicitly refer to this codec.
   */
  public readonly extNames = ['dmagic', 'demo-magic']

  /**
   * Decode a `VFile` with `demo-magic.sh` content to a Stencila `Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public readonly decode = (): Promise<stencila.Node> => {
    throw new Error('Decoding of Demo Magic scripts is not supported.')
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with `demo-magic.sh` content.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
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
}

// The content of the Bash Script. Lazily loaded.
let demoMagicSh: string | undefined

/**
 * Encode a Stencila `Node` as a Demo Magic Bash string.
 */
async function encodeNode(node: stencila.Node): Promise<string> {
  if (node === null || typeof node !== 'object') return ''

  if (stencila.isA('Heading', node)) {
    return `h ${node.depth} "${await escapedMd(node)}"\n\n`
  } else if (stencila.isA('Paragraph', node)) {
    return `p "# ${await escapedMd(node)}"\n\n`
  } else if (stencila.isA('CodeBlock', node)) {
    const { programmingLanguage, meta, text } = node
    if (
      programmingLanguage &&
      programmingLanguage !== 'bash' &&
      programmingLanguage !== 'sh'
    ) {
      return ''
    }
    if (meta && meta.hidden === '') {
      return `${text}\n`
    }
    let bash = `pe "${text}"\n`
    if (meta) {
      if (meta.pause) bash += `z ${meta.pause}\n`
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
