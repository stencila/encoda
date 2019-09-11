import * as stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import { load, text, first, all, elem } from '../../util/html'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { HTMLCodec } from '../html'

const htmlCodec = new HTMLCodec()

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
    let rmd: string | undefined
    const rmdElem = first(contentElem, '#rmd-source-code')
    if (rmdElem !== null) {
      const base64 = text(rmdElem)
      if (base64 !== null) rmd = Buffer.from(base64, 'base64').toString()
      rmdElem.remove()
    }

    // In R Notebooks, when a code chunk has multiple outputs it is split into multiple
    // <rnb-source> and <rnb-output> elements...
    for (const chunkElem of all(contentElem, 'stencila-codechunk')) {
      // So join all the source code into one `<pre><code>` element
      const sourceElems = all(chunkElem, 'rnb-source')
      const source = sourceElems.map(elem => {
        const code = text(elem)
        elem.remove()
        return code
      }).join('')
      chunkElem.appendChild(
        elem('pre', { class: 'language-r' }, elem('code', {}, source))
      )

      // And collect all the outputs into one element
      const outputs = all(chunkElem, 'rnb-output')
      chunkElem.appendChild(
        elem(
          'div',
          { 'data-outputs': true },
          ...outputs.map(decodeOutput)
        )
      )
      outputs.forEach(output => output.remove())
    }

    const node = htmlCodec.decodeHtml(contentElem.outerHTML)
    const nodes = (Array.isArray(node) ? node : [node]
    ).reduce((prev, curr) => [...prev, ...(Array.isArray(curr) ? curr : [curr])], [])

    const authors: stencila.Person[] = []
    const title = ''

    return stencila.article(authors, title, {
      content: nodes
    })
  }

  public readonly encode = async (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to a R Notebook is not yet implemented`)
  }
}

const decodeOutput = (outputElem: HTMLElement): HTMLElement => {
  const preCode = first(outputElem, 'pre>code')
  if (preCode !== null) return elem('figure', {}, text(preCode) || '')

  const img = first(outputElem, 'img')
  if (img !== null) return elem('figure', {}, img)

  return elem('figure')
}
