/**
 * @module xmd
 */

import * as stencila from '@stencila/schema'
import produce from 'immer'
import { dump, load } from '../..'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class XmdCodec extends Codec implements Codec {
  public mediaTypes = []

  public extNames = ['xmd', 'rmd']

  /**
   * Decode XMarkdown to a Stencila node.
   *
   * This function uses regexes to transform XMarkdown to Commonmark
   * which is then passed onto the `md.decode` function.
   *
   * @param file The `VFile` to decode
   */
  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    const xmd = await vfile.dump(file)
    // Inline code chunks are replaced with special inline nodes
    // The negative look behind at the start prevents matching block code chunks
    let cmd = xmd.replace(
      /(?<!``)`(r|py|python)\s+([^`]*)`/g,
      (match, lang, text): string => `\`${text}\`{type=expr lang=${lang}}`
    )
    // Block code chunks are replaced with a `chunk` block extension
    cmd = cmd.replace(
      /```\s*{([a-z]+)\s*([^}]*)}\s*\n((.|\n)*?)\n```\s*\n/gm,
      (match, lang: string, options: string, text: string): string => {
        let md = 'chunk:\n:::\n``` ' + lang
        if (options) md += ` ${options}`
        return md + '\n' + text + '\n```\n:::\n'
      }
    )
    return load(cmd, 'md')
  }

  /**
   * Encode a Stencila node to XMarkdown.
   *
   * This function first transforms the node by converting
   * any `CodeExpr` nodes to `Code` nodes and `CodeChunk` nodes
   * to `CodeBlock` nodes. This is intentionally lossy since any results of
   * execution (e.g. error or outputs) are not stored in RMarkdown.
   *
   * @param node The Stencila node to encode
   */
  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    const transformed = produce(node, transform)
    const cmd = await dump(transformed, 'md')
    // Replace Commonmark "info string" with R Markdown curly brace
    // enclosed options
    // TODO: Check parsing of options. Comma separated?
    const xmd = cmd.replace(
      /```\s*(\w+[^\n]*)/g,
      (match, options: string): string => `\`\`\` {${options}}`
    )
    return vfile.load(xmd)

    // TODO: Transforming a node tree by walking it like this is
    // a commonly used pattern and should be factored out into it\
    // a separate function with better type handling
    // eslint-disable-next-line
    function transform(node: any): stencila.Node {
      if (node === null || typeof node !== 'object') return node
      if (node.type === 'CodeExpr') {
        const code: stencila.Code = {
          type: 'Code',
          value: `${node.programmingLanguage} ${node.text}`
        }
        return code
      }
      if (node.type === 'CodeChunk') {
        const codeBlock: stencila.CodeBlock = {
          type: 'CodeBlock',
          language: node.programmingLanguage,
          value: node.text
        }
        if (node.meta) codeBlock.meta = node.meta
        return codeBlock
      }
      for (const [key, child] of Object.entries(node)) {
        node[key] = transform(child)
      }
      return node
    }
  }
}
