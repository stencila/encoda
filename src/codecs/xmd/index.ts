/**
 * # Compiler for XMarkdown
 *
 * "XMarkdown" is our name for RMarkdown-like formats, that is, RMarkdown but extended to language
 * X, where X includes Python, Javascript, etc. See https://bookdown.org/yihui/rmarkdown/language-engines.html
 *
 * In RMarkdown, R code is embedded in "code chunks". There are two types of code chunks: inline and block.
 *
 * ## Inline code chunks
 *
 * An inline code chunk is equivalent to Stencila's `CodeExpr`.
 * They are declared using Markdown code spans prefixed by the language label e.g.
 *
 * ```markdown
 * The answer is `r x * y`
 * ```
 *
 * Inline code chunks are parsed to a `CodeExpr` with `programmingLanguage` and `text`
 * properties set e.g.
 *
 * ```json
 * {
 *   "type": "CodeExpr",
 *   "programmingLanguage": "r",
 *   "text": "x * y"
 * }
 * ```
 *
 * ## Block code chunks
 *
 * A block code chunks is equivalent to Stencila's `CodeChunk`.
 * They are declared using Markdown fenced code blocks with attributes starting
 * with the language label and, optionally, a chunk label and other chunk options e.g.
 *
 * ~~~markdown
 * ```{r myplot, fig.width=6, fig.height=7}
 * plot(x,y)
 * ```
 * ~~~
 *
 * Here `myplot` is the chunk label and `fig.width=6, fig.height=7` are chunk options.
 * A list of chunk options, recognized by the RMarkdown rendering engine, Knitr,
 * is available at http://yihui.name/knitr/options/.
 *
 * Block code chunks are decoded to a `CodeChunk` with `programmingLanguage` and `text` properties
 * set. The chunk label, if defined is used for the `name` property and other
 * options go into the `meta` property e.g.
 *
 * ```json
 * {
 *   "type": "CodeChunk",
 *   "programmingLanguage": "r",
 *   "name": "myplot",
 *   "meta": {
 *      "fig.width": "6",
 *      "fig.width": "7"
 *   },
 *   "text": "plot(x,y)"
 * }
 * ```
 *
 * @module xmd
 */

import * as stencila from '@stencila/schema'
import produce from 'immer'
import { Encode } from '../..'
import * as md from '../md'
import { dump, load, VFile } from '../../vfile'

export const mediaTypes = []
export const extNames = ['xmd', 'rmd']

/**
 * Decode XMarkdown to a Stencila node.
 *
 * This function uses regexes to transform XMarkdown to Commonmark
 * which is then passed onto the `md.decode` function.
 *
 * @param file The `VFile` to decode
 */
export async function decode(file: VFile): Promise<stencila.Node> {
  const xmd = await dump(file)
  // Inline code chunks are replaced with special inline nodes
  let cmd = xmd.replace(
    /`([a-z]+)\s+([^`]*)`/g,
    (match, lang, text) => `\`${text}\`{type=expr lang=${lang}}`
  )
  // Block code chunks are replaced with a `chunk` block extension
  cmd = cmd.replace(
    /```\s*{([a-z]+)\s*([^}]*)}\s*\n(.*)\n```\n/gm,
    (match, lang, options, text) => {
      let md = 'chunk:\n:::\n``` ' + lang
      if (options) md += ` ${options}`
      return md + '\n' + text + '\n```\n:::\n'
    }
  )
  return md.decode(load(cmd))
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
export const encode: Encode = async (node: stencila.Node): Promise<VFile> => {
  const transformed = produce(node, transform)
  const file = await md.encode(transformed)
  const cmd = await dump(file)
  // Replace Commonmark "infor string" with R Markdown curly brace
  // enclosed options
  // TODO: Check parsing of options. Comma separated?
  const xmd = cmd.replace(
    /```\s*(\w+[^\n]*)/g,
    (match, options) => `\`\`\` {${options}}`
  )
  return load(xmd)

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
