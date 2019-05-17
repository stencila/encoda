/**
 * # Compiler for XMarkdown
 *
 * "XMarkdown" is our name for RMarkdown-like formats, that is, RMarkdown but extended to language
 * X, where X includes Python, Javascript, etc. See https://bookdown.org/yihui/rmarkdown/language-engines.html
 *
 * In RMarkdown, R code is embedded in "code chunks". There are two types of code chunks: inline and block.
 * In XMarkdown, we allow both inline and block chunks to be defined in various languages using
 * the usual language labels e.g. ``r``, ``py``, ``js``.
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
 * Inline code chunks are decoded to a `CodeExpr` with `language` and `text` properties set e.g.
 *
 * ```json
 * {
 *   "type": "CodeExpr",
 *   "language": "r",
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
 * Block code chunks are decoded to a `CodeChunk` with `language` and `text` properties
 * set. The chunk label, if defined is used for the `name` property and other
 * options go into the `meta` property e.g.
 *
 * ```json
 * {
 *   "type": "CodeChunk",
 *   "language": "r",
 *   "name": "myplot",
 *   "meta": {
 *      "fig.width": "6",
 *      "fig.width": "7"
 *   },
 *   "text": "plot(x,y)"
 * }
 * ```
 *
 * ## Implementation
 *
 * This compiler works by transforming XMarkdown to Commonmark with `!expr` and `!chunk`
 * extensions. The `parse` function does the transformation using regexes prior to passing
 * the transformed XMarkdown to the `md` compiler.
 *
 * @module xmd
 */

import * as stencila from '@stencila/schema'
import * as md from './md'
import { dump, load, VFile } from './vfile'

export const mediaTypes = []
export const extNames = ['xmd', 'rmd']

export async function parse(file: VFile): Promise<stencila.Node> {
  const xmd = dump(file)
  // Inline code chunks...
  let cmd = xmd.replace(/`([a-z]+)\s+([^`]*)`/g, (match, lang, text) => {
    // ...are replaced with inline code with `lang` attr
    return `\`${text}\`{.exec lang=${lang}}`
  })
  // Block code chunks...
  cmd = cmd.replace(
    /```\s*{([a-z]+)\s*([^}]*)}\s*\n(.*)\n```\n/gm,
    (match, lang, options, text) => {
      // Replace with a Commonmark backtick fenced code block with an
      // "info string" (does not have curly braces)
      let md = '``` ' + lang + ' .exec'
      if (options) md += ` ${options}`
      return md + '\n' + text + '\n```\n'
    }
  )
  return md.parse(load(cmd))
}

export async function unparse(
  node: stencila.Node,
  filePath?: string
): Promise<VFile> {
  const transformed = transform(node)
  const mdFile = await md.unparse(transformed)
  const cmd = dump(mdFile)
  const xmd = cmd.replace(
    /^\`\`\`([^\s]+)/gm,
    (match, lang) => `\`\`\` {${lang}}`
  )
  return load(xmd)

  function transform(node: any): stencila.Node {
    if (node === null || typeof node !== 'object') return node
    if (node.type === 'CodeExpr') {
      const code: stencila.Code = {
        type: 'Code',
        value: `${node.languages[0]} ${node.text}`
      }
      return code
    }
    if (node.type === 'CodeChunk') {
      const codeBlock: stencila.CodeBlock = {
        type: 'CodeBlock',
        language: node.languages[0],
        value: node.text
      }
      return codeBlock
    }
    for (const [key, child] of Object.entries(node)) {
      node[key] = transform(child)
    }
    return node
  }
}
