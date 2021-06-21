/**
 * [[include:src/codecs/dmagic/README.md]]
 *
 * @module codecs/dmagic
 */

import schema from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import * as vfile from '../../util/vfile'
import { TxtCodec } from '../txt'
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
  public readonly decode = (): Promise<schema.Node> => {
    throw new Error('Decoding of Demo Magic scripts is not supported.')
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with `demo-magic.sh` content.
   *
   * By default bundles the Demo Magic script into the generated file.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = {
      ...this.commonEncodeDefaults,
      isStandalone: true,
      isBundle: true,
    }
  ): Promise<vfile.VFile> => {
    const { isBundle = true, isStandalone = true } = options

    let bash
    if (isBundle || isStandalone) {
      if (demoMagicSh === undefined) {
        demoMagicSh = await fs.readFile(
          path.join(__dirname, 'demo-magic.sh'),
          'utf8'
        )
      }
      bash = demoMagicSh
    } else {
      bash = `#!/usr/bin/env bash\n. demo-magic.sh\nclear\n\n`
    }
    bash += await encodeNode(node)

    return vfile.load(bash)
  }
}

// The content of the Demo Magic Bash Script. Lazily loaded.
let demoMagicSh: string | undefined

/**
 * Encode a Stencila `Node` as a Demo Magic Bash string.
 */
async function encodeNode(node: schema.Node): Promise<string> {
  if (node === null || typeof node !== 'object') return ''

  if (schema.isA('Heading', node)) {
    return `h "${escapedText(node.content)}"\n\n`
  } else if (schema.isA('Paragraph', node)) {
    return `pa "${escapedText(node.content)}"\n\n`
  } else if (schema.isA('CodeBlock', node)) {
    const { programmingLanguage, meta = {}, text } = node
    if (
      programmingLanguage !== undefined &&
      programmingLanguage !== 'bash' &&
      programmingLanguage !== 'sh'
    ) {
      return ''
    }

    if (meta.hidden !== undefined) {
      return `${text}\n`
    }

    let bash = `${meta.noexec === undefined ? 'pe' : 'p'} "${text}"\n`
    if (meta.pause !== undefined) bash += `z ${meta.pause}\n`

    return bash + 'echo\n\n'
  }

  // For all other node types, recurse over their children
  const strings = await Promise.all(Object.values(node).map(encodeNode))
  return strings.join('')
}

/**
 * Generate escaped text suitable for inserting into Bash
 */
function escapedText(content: schema.InlineContent[]): string {
  return content.map(TxtCodec.stringify).join('').replace(/`/g, '\\`')
}
