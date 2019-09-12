import * as stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import { load, text, first, all, elem } from '../../util/html'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { HTMLCodec } from '../html'
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
    return /id="rmd-source-code"/.test(content)
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
      .replace(/<!-- rnb-chunk-begin -->/g, '<stencila-codechunk>')
      .replace(/<!-- rnb-source-begin [\w=]+ -->/g, '<rnb-source>')
      .replace(/<!-- rnb-source-end -->/g, '</rnb-source>')
      .replace(/<!-- rnb-(output|plot)-begin [\w=]+ -->/g, '<rnb-output>')
      .replace(/<!-- rnb-(output|plot)-end -->/g, '</rnb-output>')
      .replace(/<!-- rnb-chunk-end -->/g, '</stencila-codechunk>')

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

    // Extract and remove Rmd source so that we can correlate inline chunk outputs
    // to their source
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

    // In R Notebooks, when a code chunk has multiple outputs it is split into multiple
    // <rnb-source> and <rnb-output> elements...
    for (const chunkElem of all(contentElem, 'stencila-codechunk')) {
      // So join all the source code into one `<pre><code>` element
      const sourceElems = all(chunkElem, 'rnb-source')
      const source = sourceElems.map(elem => {
        const code = text(elem)
        elem.remove()
        return code !== null ? code.trimLeft() : ''
      }).join('')
      chunkElem.appendChild(
        elem('pre', { slot: 'code' }, elem('code', { class: 'language-r' }, source))
      )

      // And collect all the outputs into one element
      const outputs = all(chunkElem, 'rnb-output')
      chunkElem.appendChild(
        elem(
          'figure',
          { 'slot':  'outputs'},
          ...outputs.map(transformOutput)
        )
      )
      outputs.forEach(output => output.remove())
    }

    // Decode the HTML fragment into Stencila `Node`s
    const node = htmlCodec.decodeHtml(contentElem.outerHTML)
    const content = Array.isArray(node) ? node : [node]

    return {...article, content}
  }

  public readonly encode = async (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to a R Notebook is not yet implemented`)
  }
}

/**
 * Transform a code chunk output HTML element by transforming it
 * into the HTML elements expected by the `html` codec.
 */
const transformOutput = (outputElem: HTMLElement): HTMLElement => {
  const preCode = first(outputElem, 'pre>code')
  if (preCode !== null) return elem('pre', {}, text(preCode) || '')

  const img = first(outputElem, 'img')
  if (img !== null) return img

  log.warn(`Unhandled chunk output type: ${outputElem.nodeName}`)
  return elem('pre', {}, text(outputElem) || '')
}
