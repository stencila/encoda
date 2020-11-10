import { getLogger } from '@stencila/logga'
import * as schema from '@stencila/schema'
import fs from 'fs-extra'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const log = getLogger('encoda:plotly')

/**
 * The Puppeteer page used to persist Plotly.js across calls to `PlotlyCodec`
 * instances and calls to `encode`. Instantiated lazily and just-in-time in `ensurePlotlyPage`.
 */
let plotlyPage: puppeteer.Page | undefined

/**
 * Ensure that `plotlyPage` is defined.
 */
async function ensurePlotlyPage(): Promise<puppeteer.Page> {
  if (plotlyPage) return plotlyPage

  const src = await fs.readFile(
    require.resolve('plotly.js-dist/plotly.js'),
    'utf8'
  )
  plotlyPage = await puppeteer.page()
  await plotlyPage.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script>${src}</script>
  </head>
  <body>
    <div id="plotly"></div>
  </body>
</html>
`)
  return plotlyPage
}

export const plotlyMediaType = 'application/vnd.plotly.v1+json'

/**
 * Define a Plotly object to obviate the need to //@ts-ignore within
 * the `page.evaluate` function below. There is a `@types/plotly.js`
 * which would be nicer to use that doing this. But that needs us
 * to depend on and import `plotly.js` (which fails to import in Node.js
 * due to missing `document`, probably related to
 * https://github.com/plotly/plotly.js/issues/3518).
 */
const Plotly: any = {}

export class PlotlyCodec extends Codec implements Codec {
  public readonly mediaTypes = [plotlyMediaType]

  /**
   * Decode Plotly JSON to an `ImageObject`.
   *
   * Most often used to convert the output of a Jupyter cell to an
   * image for compatibility to non-browser, non-Plotly supporting
   * formats such as Word or Markdown.
   *
   * Uses Puppeteer and Plotly to generate a static PNG for `contentUrl`.
   * An alternative would be to use `jsdom` in Node.js but it is reported
   * that a lot of Plotly's functionality does not work this way (e.g. missing text).
   * See https://gist.github.com/etpinard/58a9e054b9ca7c0ca4c39976fc8bbf8a.
   *
   * In addition to the static image, stores the Plotly JSON in `content` (
   * with `mediaType` and `data` properties, so that the node can be reversed
   * back to Jupyter if needed, or rendered as an interactive figure in HTML.
   *
   * It is possible to set the `height` and `width` of the generated image
   * in options to `Plotly.toImage`. However, it seems best to avoid that
   * and instead let the values be taken from the `layout` object in the
   * Plotly JSON (this seems to be the default behavior).
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<schema.ImageObject> => {
    const json = await vfile.dump(file)
    const data = JSON.parse(json)

    const page = await ensurePlotlyPage()

    // Don't include this uninstrumented code that runs in the browser
    // in coverage stats.
    // istanbul ignore next
    const image = await page.evaluate(async (data) => {
      const root = document.getElementById('plotly') as HTMLDivElement
      await Plotly.newPlot(root, data)
      const image = await Plotly.toImage(root, { format: 'png' })
      Plotly.purge(root)
      return image
    }, data)

    return schema.imageObject({
      contentUrl: image,
      content: [
        {
          mediaType: plotlyMediaType,
          data,
        },
      ],
    })
  }

  /**
   * Encode a Stencila `ImageObject` with to Plotly JSON
   *
   * Most often used when encoding a Jupyter Notebook from some other format, when
   * the source document was itself created from a Jupyter Notebook (ie. reverse
   * converting back to a Jupyter Notebook from Word)
   */
  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    if (schema.isA('ImageObject', node) && node.content) {
      for (const content of node.content) {
        if (
          typeof content === 'object' &&
          content !== null &&
          'data' in content &&
          'mediaType' in content &&
          content.mediaType === plotlyMediaType
        ) {
          const json = JSON.stringify(content.data)
          return Promise.resolve(vfile.load(json))
        }
      }
    }
    log.warn(
      `Unable to encode Plotly JSON from node of type "${schema.nodeType(
        node
      )}"`
    )
    return Promise.resolve(vfile.load('{}'))
  }
}
