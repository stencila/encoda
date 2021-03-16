/**
 * @module latex
 */

import schema from '@stencila/schema'
import { transformSync } from '../../util/transform'
import * as vfile from '../../util/vfile'
import { InputFormat, OutputFormat, PandocCodec } from '../pandoc'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const pandoc = new PandocCodec()

export class LatexCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/x-latex']

  public readonly extNames = ['latex', 'tex']

  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<schema.Node> => {
    const root = await pandoc.decode(file, options, {
      pandocFormat: InputFormat.latex,
    })
    return transformSync(root, (node) => {
      if (schema.isA('MathBlock', node)) return decodeMathBlock(node)
      return node
    })
  }

  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return pandoc.encode(node, options, {
      pandocFormat: OutputFormat.latex,
    })
  }
}

/**
 * Decode a MathBlock
 *
 * This function is necessary because Pandoc does not parse the
 * `\label{}` of an equation (as it does for tables and figures).
 * This provides consistency by extracting the label into the `id`
 * property (Latex's \label actually reflects the semantics of
 * Stencila schema `id` better than the `label` property).
 */
function decodeMathBlock(node: schema.MathBlock): schema.MathBlock {
  let { text } = node
  const match = /\\label{(.*?)}/.exec(text)
  if (match) {
    const id = match[1]
    text = text.replace(match[0], '').trim()
    return { ...node, id, text }
  }
  return node
}
