import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import { all, elem, first, load, text } from '../../util/html'
import * as vfile from '../../util/vfile'
import { HTMLCodec } from '../html'
import { Codec } from '../types'
import { XmdCodec } from '../xmd'

const htmlCodec = new HTMLCodec()
const rmdCodec = new XmdCodec()

const log = getLogger('encoda:rnb')

export class RnbCodec extends Codec implements Codec {
  /**
   * Sniff content to see if it is a R Notebook.
   *
   * For speed, rather than parsing the entire content as HTML, this
   * function just uses a regex to check if the content contains Rmd source code.
   *
   * @param content The content to be sniffed (may be a file path)
   */
  public readonly sniff = async (content: string): Promise<boolean> => {
    if (await fs.pathExists(content)) {
      const stat = await fs.stat(content)
      if (stat.isFile()) content = await fs.readFile(content, 'utf8')
    }
    return content.includes('id="rmd-source-code"')
  }

  /**
   * Decode a R Notebook file to a Stencila `Article`
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const rnb = await vfile.dump(file)

    // Replace delimiting comments with opening and closing HTML tags
    // so that we can handle these below
    const html = rnb
      .replace(/<!-- rnb-chunk-begin -->/g, '<stencila-code-chunk>')
      .replace(/<!-- rnb-source-begin (.*?)-->/g, '<rnb-source>')
      .replace(/<!-- rnb-source-end -->/g, '</rnb-source>')
      .replace(/<!-- rnb-(output|plot|frame)-begin (.*?)-->/g, '<rnb-output>')
      .replace(/<!-- rnb-(output|plot|frame)-end -->/g, '</rnb-output>')
      .replace(/<!-- rnb-chunk-end -->/g, '</stencila-code-chunk>')

    // Transform the HTML so that it is in the format expected by the `html` codec...

    const dom = load(html)
    const contentElem = first(dom.body, '.main-container')
    if (contentElem === null) {
      log.error('Unable to parse R Notebook HTML')
      return null
    }

    // Remove `#header
    const headerElem = first(contentElem, '#header')
    if (headerElem !== null) headerElem.remove()

    // Extract and remove Rmd source so that we can parse and coerce frontmatter
    // and correlate inline chunk outputs to their source
    let rmd = ''
    const rmdElem = first(contentElem, '#rmd-source-code')
    if (rmdElem !== null) {
      const base64 = text(rmdElem)
      if (base64 !== null) rmd = Buffer.from(base64, 'base64').toString()
      rmdElem.remove()
    }

    // Decode the Rmd as an `Article` to obtain any meta-data from YAML header
    const article = await rmdCodec.decode(vfile.load(rmd))
    if (!stencila.isA('Article', article)) {
      log.error('Unable to parse R Notebook embedded Rmd')
      return null
    }

    // Find each inline code chunk in Rmd
    const containers = all(contentElem, 'p, h1, h2, h3, h4, h5')
    const replacements: {
      elemIndex: number
      begin: number
      end: number
      source: string
      output: string
    }[] = []
    let cursorElem = 0
    let cursorIndex = 0
    // For each inline code chunk in the Rmd source...
    const regex = /`r\s+([^`]*)`/g
    let sourceMatch
    while ((sourceMatch = regex.exec(rmd)) !== null) {
      // ... get the source Rmd before and after it
      const begin = sourceMatch.index
      const end = regex.lastIndex
      const chunk = sourceMatch[0]
      const source = sourceMatch[1]
      const before = rmd.substring(Math.max(0, begin - 7), begin).trimLeft()
      const after = rmd
        .substring(end, Math.min(rmd.length, end + 3))
        .trimRight()
      const outputRegex = RegExp(
        `${escapeRegex(before)}(.+?)${escapeRegex(after)}`,
        'g'
      )
      // ... search through the containers (at or beyond the last
      // container that we found a chunk in)
      let found = false
      for (const container of containers.slice(cursorElem)) {
        const html = container.innerHTML
        const elemIndex = containers.indexOf(container)
        const start = cursorElem === elemIndex ? cursorIndex : 0
        const outputMatch = outputRegex.exec(html.substring(start))
        if (outputMatch !== null) {
          // Replace the output with the source, to improve the matching
          // success of following inline code chunks.
          const output = outputMatch[1]
          const begin = start + outputMatch.index + before.length
          const end = start + outputRegex.lastIndex - after.length
          container.innerHTML = html.slice(0, begin) + chunk + html.slice(end)
          // Record the location that needs eventual replacement
          // with a code chunk
          replacements.push({
            elemIndex,
            begin,
            end: begin + chunk.length,
            source,
            output,
          })
          found = true

          cursorElem = elemIndex
          cursorIndex = end
          break
        }
      }
      if (!found) {
        log.warn(`Unable to find output of inline code chunk ${chunk}`)
        log.debug(`Using regex: ${outputRegex.source}`)
      }
    }

    // Do replacement in reverse order so that begin and end points remain value
    for (const replacement of replacements.reverse()) {
      const { elemIndex, begin, end, source, output } = replacement
      const container = containers[elemIndex]
      const html = container.innerHTML
      container.innerHTML =
        html.slice(0, begin) +
        `<stencila-code-expression programming-language="r">
          <code class="language-r" slot="text">${source}</code>
          <span slot="output">${output}</span>
        </stencila-code-expression>` +
        html.slice(end)
    }

    // In R Notebooks, when a code chunk has multiple outputs it is split into multiple
    // <rnb-source> and <rnb-output> elements...
    for (const chunkElem of all(contentElem, 'stencila-code-chunk')) {
      // So join all the source code into one `<pre><code>` element
      const sourceElems = all(chunkElem, 'rnb-source')
      const source = sourceElems
        .map((elem) => {
          const code = text(elem)
          elem.remove()
          return code !== null ? code.trimLeft() : ''
        })
        .join('')
      chunkElem.appendChild(
        elem(
          'pre',
          {},
          elem('code', { slot: 'text', class: 'language-r' }, source)
        )
      )

      // And collect all the outputs into one element
      const outputs = all(chunkElem, 'rnb-output')
      chunkElem.appendChild(
        elem('figure', { slot: 'outputs' }, ...outputs.map(transformOutput))
      )
      outputs.forEach((output) => output.remove())
    }

    // Decode the HTML fragment into Stencila `Node`s
    const node = htmlCodec.decodeHtml(contentElem.outerHTML)
    const content = Array.isArray(node) ? node : [node]

    return { ...article, content }
  }

  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to a R Notebook is not yet implemented`)
  }
}

/**
 * Escape characters in a string so that it is a valid regex
 */
const escapeRegex = (regex: string): string =>
  regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Transform a code chunk output HTML element by transforming it
 * into the HTML elements expected by the `html` codec.
 */
const transformOutput = (outputElem: HTMLElement): HTMLElement => {
  const preCode = first(outputElem, 'pre > code')
  if (preCode !== null) return elem('pre', {}, text(preCode) ?? '')

  const img = first(outputElem, 'img')
  if (img !== null) return img

  const table = first(outputElem, 'script[data-pagedtable-source=""]')
  if (table !== null) {
    // TODO: Create an HTML table from the JSON
    return elem('pre', {}, text(table) ?? '')
  }

  log.warn(`Unhandled chunk output type: ${outputElem.nodeName}`)
  return elem('pre', {}, text(outputElem) ?? '')
}
