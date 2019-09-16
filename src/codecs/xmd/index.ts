/**
 * @module xmd
 */

import * as stencila from '@stencila/schema'
import { dump, load } from '../..'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import transform from '../../util/transform'

export class XmdCodec extends Codec implements Codec {
  public readonly extNames = ['xmd', 'rmd']

  /**
   * Decode XMarkdown to a Stencila node.
   *
   * This function uses regexes to transform XMarkdown to Commonmark
   * which is then passed onto the `md.decode` function.
   *
   * @param file The `VFile` to decode
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
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
   * any `CodeExpression` nodes to `CodeFragment` nodes and `CodeChunk` nodes
   * to `CodeBlock` nodes. This is intentionally lossy since any results of
   * execution (e.g. error or outputs) are not stored in RMarkdown.
   *
   * @param node The Stencila node to encode
   */
  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    const transformed = await transform(
      node,
      async (node: stencila.Node): Promise<stencila.Node> => {
        if (stencila.isA('CodeExpression', node)) {
          const { text, programmingLanguage } = node
          return stencila.codeFragment(
            programmingLanguage !== undefined
              ? `${programmingLanguage} ${text}`
              : text
          )
        }
        if (stencila.isA('CodeChunk', node)) {
          const { text, programmingLanguage, meta } = node
          return stencila.codeBlock(text, { programmingLanguage, meta })
        }
        return node
      }
    )

    const cmd = await dump(transformed, 'md')

    // Replace Commonmark "info string" with R Markdown curly brace
    // enclosed options. This requires parsing the options so that
    // they can be made comma separated as required by R Markdown
    const xmd = cmd.replace(
      /```(\w+)(?:[ \t]+(.*?))?\n/g,
      (match, lang: string, options: string): string => {
        let xmd = '```{' + lang
        if (options) {
          // Collect options into a map
          const optionsMap: { [key: string]: string } = {}
          const regex = /\s*([^=]+)=((?:[^"][^ ]*)|(?:"(?:[^"\\]|\\.)*"))/g
          let match
          while ((match = regex.exec(options)) !== null) {
            optionsMap[match[1]] = match[2]
          }

          let optionsArray: string[] = []
          // The chunk label always comes first and has no name
          if (optionsMap.label) {
            optionsArray = [optionsMap.label]
            delete optionsMap.label
          }
          // All other options are comma separated
          optionsArray = [
            ...optionsArray,
            ...Object.entries(optionsMap).map(
              ([name, value]) => `${name}=${value}`
            )
          ]
          xmd += ' ' + optionsArray.join(', ')
        }
        return xmd + '}\n'
      }
    )
    return vfile.load(xmd)
  }
}
