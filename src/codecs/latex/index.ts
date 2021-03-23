/**
 * @module latex
 */

import schema from '@stencila/schema'
import transform from '../../util/transform'
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
    return transform(
      root,
      async (node): Promise<schema.Node> => {
        if (schema.isA('CodeBlock', node)) return await decodeCodeBlock(node)
        if (schema.isA('CodeFragment', node)) return decodeCodeFragment(node)
        if (schema.isA('MathBlock', node)) return decodeMathBlock(node)
        return node
      }
    )
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
 * Decode a `CodeBlock`
 *
 * Converts a `CodeBlock` with language ending in ` exec` to a `CodeChunk`.
 */
async function decodeCodeBlock(
  node: schema.CodeBlock
): Promise<schema.CodeBlock | schema.CodeChunk> {
  let { isExecutable, programmingLanguage, meta } = checkIfExecutable(node)

  if (!isExecutable) return node

  const id = meta?.id as string
  delete meta?.id

  let caption: schema.CodeChunk['caption'] = meta?.caption as string
  if (typeof caption === 'string') {
    const article = (await new LatexCodec().load(caption)) as schema.Article
    caption = article?.content?.[0] as schema.CodeChunk['caption']
  }
  delete meta?.caption

  if (meta && Object.keys(meta).length === 0) meta = undefined

  return schema.codeChunk({ ...node, programmingLanguage, id, caption, meta })
}

/**
 * Decode a `CodeFragment`
 *
 * Converts a `CodeFragment` with language ending in ` exec` to a `CodeExpression`.
 */
function decodeCodeFragment(
  node: schema.CodeFragment
): schema.CodeFragment | schema.CodeExpression {
  console.log(node)
  const { isExecutable, programmingLanguage, meta } = checkIfExecutable(node)

  return isExecutable
    ? schema.codeExpression({ ...node, programmingLanguage, meta })
    : node
}

/**
 * Check whether a `Code` node is executable.
 *
 * Note will return modified `programmingLanguage` and/or `exec`
 * which strips the executable flag (if present).
 */
function checkIfExecutable(
  node: schema.CodeBlock | schema.CodeFragment
): {
  isExecutable: boolean
  programmingLanguage?: string
  meta?: Record<string, unknown>
} {
  let { programmingLanguage, meta } = node

  let isExecutable = false

  if (programmingLanguage !== undefined) {
    const match = /^(.+?)\s+exec$/.exec(programmingLanguage)
    if (match) {
      isExecutable = true
      programmingLanguage = match[1]
    }
  }

  if (meta && (meta.exec === '' || meta.exec === 'true')) {
    isExecutable = true
    delete meta.exec
    if (Object.keys(meta).length === 0) meta = undefined
  }

  return { isExecutable, programmingLanguage, meta }
}

/**
 * Decode a `MathBlock`
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
