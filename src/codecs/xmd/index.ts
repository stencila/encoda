/**
 * @module xmd
 */

import * as stencila from '@stencila/schema'
import crypto from 'crypto'
import { dump, load } from '../..'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions } from '../types'
import { transformSync } from '../../util/transform'
import { ensureInlineContentArray } from '../../util/content/ensureInlineContentArray'

export class XmdCodec extends Codec implements Codec {
  public readonly extNames = ['xmd', 'rmd']

  /**
   * Decode XMarkdown to a Stencila node.
   *
   * This function uses regexes to transform XMarkdown to Commonmark
   * which is then passed onto the `MdCodec.decode` method (via `load()`).
   *
   * @param file The `VFile` to decode
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    let xmd = await vfile.dump(file)
    xmd = decodeInlineChunk(xmd)
    xmd = decodeNestedChunks(xmd)
    xmd = decodeBlockChunk(xmd)
    return load(xmd, 'md')
  }

  /**
   * Encode a Stencila node to XMarkdown.
   *
   * If `strict=true`, this function first transforms the node by converting
   * any `CodeExpression` nodes to `CodeFragment` nodes and `CodeChunk` nodes
   * to `CodeBlock` nodes. This is intentionally lossy since any results of
   * execution (e.g. error or outputs) are not stored in RMarkdown.
   *
   * @param node The Stencila node to encode
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions & { strict?: boolean } = this
      .commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const { strict = false } = options

    const transformed = transformSync(
      node,
      (node: stencila.Node): stencila.Node => {
        if (stencila.isA('CodeExpression', node)) {
          const { text, programmingLanguage } = node
          return stencila.codeFragment({
            text:
              programmingLanguage !== undefined
                ? `${programmingLanguage} ${text}`
                : text,
          })
        }
        if (stencila.isA('CodeChunk', node)) {
          const { text, programmingLanguage, caption, label, meta } = node

          const block = stencila.codeBlock({
            text,
            programmingLanguage,
          })

          if (caption === undefined) {
            // Not caption so can represent as a code block
            return {
              ...block,
              meta,
            }
          } else if (strict) {
            // In strict mode, always convert to a code block
            // with a fig.cap attribute
            if (typeof caption === 'string') {
              return {
                ...block,
                meta: { 'fig.cap': caption, ...meta },
              }
            } else {
              const refId =
                label !== undefined
                  ? label.toLowerCase().replace(/[^a-z0-9]/g, '')
                  : crypto.randomBytes(8).toString('hex')
              return [
                {
                  ...block,
                  meta: { 'fig.cap': `(ref:${refId}) `, ...meta },
                },
                stencila.paragraph({
                  content: [
                    `(ref:${refId}) `,
                    ...(caption as stencila.InlineContent[]),
                  ],
                }),
              ]
            }
          } else {
            return node
          }
        }
        return node
      }
    )

    const cmd = await dump(transformed, 'md', options)

    // Replace Commonmark "info string" with R Markdown curly brace
    // enclosed options. This requires parsing the options so that
    // they can be made comma separated as required by R Markdown
    const xmd = cmd.replace(
      /```(\w+)(?:[ \t]+(.*?))?\n/g,
      (match, lang: string, options?: string): string => {
        let xmd = '```{' + lang
        if (options !== undefined) {
          // Collect options into a map
          const optionsMap: { [key: string]: string } = {}
          const regex = /\s*([^=]+)=((?:[^"][^ ]*)|(?:"(?:[^"\\]|\\.)*"))/g
          let match
          while ((match = regex.exec(options)) !== null) {
            optionsMap[match[1]] = match[2]
          }

          let optionsArray: string[] = []
          // The chunk label always comes first and has no name
          if (optionsMap.label !== undefined) {
            optionsArray = [optionsMap.label]
            delete optionsMap.label
          }
          // All other options are comma separated
          optionsArray = [
            ...optionsArray,
            ...Object.entries(optionsMap).map(
              ([name, value]) => `${name}=${value}`
            ),
          ]
          xmd += ' ' + optionsArray.join(', ')
        }
        return xmd + '}\n'
      }
    )
    return vfile.load(xmd)
  }
}

/**
 * Replace RMarkdown code chunks that are nested inside a Markdown `chunk`
 * block extension with a plain code block.
 *
 * When encoding code chunks we made the nested code block compatible with
 * RMarkdown by using curly braces around the language e.g. `{r}`. This turns
 * those into plain code blocks so that they do not get decoded to anther
 * `chunk` by the `decodeBlockChunk` function below.
 */
export function decodeNestedChunks(xmd: string): string {
  return xmd.replace(
    /(chunk:(?:.|\n)*?```){([^}]*)}/g,
    (_match, leading, unbraced): string => `${leading}${unbraced}`
  )
}

/**
 * Replace RMarkdown inline code chunks with Markdown inline code nodes with `type=expr`.
 *
 * The inline code nodes produced will subsequently be handled by the
 * `MdCodec.decodeInlineCode` function.
 */
export function decodeInlineChunk(xmd: string): string {
  return xmd.replace(
    // The negative look behind at the start prevents matching block code chunks.
    /(?<!``)`(r|py|python|js|javascript)\s+([^`]*)`/g,
    (_match, lang, text): string => `\`${text}\`{type=expr lang=${lang}}`
  )
}

/**
 * Replace RMarkdown block code chunks with Markdown `chunk` block extensions.
 *
 * If the code chunk has a label, then that becomes the label of the chunk.
 * If the code chunk has a `fig.cap` attribute:
 *   - if `fig.cap` is a "text reference" e.g. fig.cap='(ref:foo)', then searches
 *     for the paragraph with that id.
 *   - otherwise, uses the caption as is.
 *
 * @see https://bookdown.org/yihui/bookdown/markdown-extensions-by-bookdown.html#text-references
 */
export function decodeBlockChunk(xmd: string): string {
  const removeParagraphs: string[] = []
  xmd = xmd.replace(
    /^```\s*{([a-z]+)\s*([^}]*)}\s*\n((.|\n)*?)\n```\s*\n/gm,
    (match, lang: string, options_: string, text: string): string => {
      let options = options_.split(/,\s*/)

      // Start chunk block extension with label (if any)
      let md = 'chunk:'
      if (!options[0].includes('=')) {
        md += ' ' + options[0]
        options = options.slice(1)
      }
      md += '\n:::\n'

      // Add figure caption if there is a `fig.cap` option
      let index = 0
      for (const option of options) {
        const [name, value] = option.split(/\s*=\s*/)
        if (name === 'fig.cap') {
          let caption: string | undefined
          const match = /['"]\(ref:([\w-]+)\)['"]/.exec(value)
          if (match) {
            // Search for the text reference to use as the caption
            const refId = match[1]
            const refRegEx = new RegExp(
              // Stops capturing the caption paragraph on a blank line
              `^\\(ref:${refId}\\)\\s*(.+?)\\n`,
              'gm'
            )
            const refMatch = refRegEx.exec(xmd)
            if (refMatch !== null) {
              caption = refMatch[1]
              removeParagraphs.push(refMatch[0])
            }
          } else {
            // Use the fig.cap option value
            caption = value.replace(/'|"/g, '')
          }
          if (caption !== undefined) md += caption + '\n\n'

          // Remove from options
          options.splice(index, 1)
        }
        index += 1
      }

      // Add code block and end block extension
      md += '```' + lang + '\n' + text + '\n```\n:::\n'

      // Add any other options as properties
      if (options.length > 0) {
        const properties = options.map((option) => {
          let [name, value] = option.split(/\s*=\s*/)
          if (name === 'fig.width') {
            name = 'width'
          } else if (name === 'fig.height') {
            name = 'height'
          } else {
            // Can't have a dot in property names...
            name = name.replace('.', '')
          }
          return `${name}=${value}`
        })
        md += '{' + properties.join(' ') + '}\n'
      }

      return md + '\n'
    }
  )
  // Text reference paragraphs that were converted to
  // captions need to be removed
  for (const para of removeParagraphs) {
    xmd = xmd.replace(para, '')
  }
  return xmd
}
