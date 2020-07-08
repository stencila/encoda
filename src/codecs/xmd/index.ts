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

/**
 * Converts the Bookdown style figure reference into Markdown Block Extension format.
 * Figures are not represented as per usual in Markdown (block extensions)
 * but rather as an image and a text reference.
 * @see https://bookdown.org/yihui/bookdown/markdown-extensions-by-bookdown.html#text-references
 */
export const decodeFigure = (contents: string): string => {
  const figRegEx = /(```{(\w+).*fig\.cap=['"]\(ref:([\w-]+)\)['"].*}\n([^```]*)\n?```)\n/g

  return contents.replace(
    figRegEx,
    (_match, _figBlock, lang?: string, refId?: string, code?: string) => {
      const figRefRegEx = new RegExp(
        `\\(ref:${
          refId ?? ''
        }\\) ((?:Fig(?:ure)?|Table) \\d+[.;]) (\\*\\*.*?\\*\\*)?\\s*(.*)`,
        'g'
      )

      const [, label, heading, caption] = figRefRegEx.exec(contents) ?? []

      let figure = `
figure: ${label ?? refId}
:::
\`\`\`${lang ?? 'r'}`

      figure += code === undefined ? '' : `\n${code}\`\`\`\n`
      figure += heading === undefined ? '' : `\n${heading}`
      figure += heading === undefined && caption === undefined ? '' : `\n`
      figure += caption === undefined ? '' : `\n${caption}\n`

      figure += '\n:::\n'

      return figure
    }
  )
}

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
    let xmd = await vfile.dump(file)
    // Inline code chunks are replaced with special inline nodes
    // The negative look behind at the start prevents matching block code chunks
    let cmd = xmd.replace(
      /(?<!``)`(r|py|python)\s+([^`]*)`/g,
      (_match, lang, text): string => `\`${text}\`{type=expr lang=${lang}}`
    )

    xmd = decodeFigure(xmd)

    // Block code chunks are replaced with a `chunk` block extension
    cmd = cmd.replace(
      /```\s*{([a-z]+)\s*([^}]*)}\s*\n((.|\n)*?)\n```\s*\n/gm,
      (match, lang: string, options: string, text: string): string => {
        let md = 'chunk:\n:::\n``` ' + lang
        if (options.length > 0) md += ` ${options}`
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
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
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
          const { text, programmingLanguage, meta } = node
          return stencila.codeBlock({ text, programmingLanguage, meta })
        }
        // Figures are not represented as per usual in Markdown (block extensions)
        // but rather as an image and a text reference
        // See https://bookdown.org/yihui/bookdown/markdown-extensions-by-bookdown.html#text-references
        if (stencila.isA('Figure', node)) {
          let { label, caption, content } = node
          let title
          let rest: stencila.InlineContent[] = []
          if (typeof caption === 'string')
            title = stencila.strong({ content: [caption] })
          else if (Array.isArray(caption)) {
            const [first] = caption
            if (stencila.isA('Heading', first)) {
              title = stencila.strong({ content: first.content })
              if (caption.length > 1)
                rest = ensureInlineContentArray(caption.slice(1))
            } else {
              rest = ensureInlineContentArray(caption)
            }
          }
          const id =
            label !== undefined
              ? label.toLowerCase().replace(/[^a-z0-9]/g, '')
              : crypto.randomBytes(8).toString('hex')

          if (label?.endsWith('.')) label += ' '
          else if (!label?.endsWith('. ')) label += '. '

          return [
            ...(content ?? []),
            stencila.paragraph({
              content: [
                `(ref:${id}) `,
                ...(label !== undefined ? [label] : []),
                ...(title ? [title, ' '] : []),
                ...rest,
              ],
            }),
          ]
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
