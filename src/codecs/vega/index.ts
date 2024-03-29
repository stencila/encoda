/**
 * [[include:src/codecs/vega/README.md]]
 *
 * @module codecs/vega
 */

import { getLogger } from '@stencila/logga'
import schema from '@stencila/schema'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const log = getLogger('encoda:vega')

/**
 * The Puppeteer page used to persist Vega.js across calls to `VegaCodec`
 * instances and calls to `encode`. Instantiated lazily and just-in-time in `ensureVegaPage`.
 */
let page: puppeteer.Page | undefined

interface VegaScriptVersions {
  vega: string
  vegaLite: string
}

/**
 * Ensure that `page` is defined.
 */
async function ensureVegaPage({
  vega,
  vegaLite,
}: VegaScriptVersions): Promise<puppeteer.Page> {
  if (page) return page

  page = await puppeteer.page()

  await page.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <!-- Import vega-embed -->
    <script src="https://unpkg.com/vega@${vega}"></script>
    <script src="https://unpkg.com/vega-lite@${vegaLite}"></script>
    <!-- Import vega-embed -->
    <script src="https://unpkg.com/vega-embed@latest"></script>
  </head>
  <body>
    <div id="figure"></div>
  </body>
</html>
`)

  return page
}

// Custom and generic Vega mimetype used by Stencila during encoding
export const vegaMediaType = 'application/vnd.vega+json'

const vegaMediaTypes = [
  vegaMediaType,
  // Mimetypes used by Altair
  // @see https://altair-viz.github.io/user_guide/display_frontends.html#renderer-api
  'application/vnd.vega.v1+json',
  'application/vnd.vega.v2+json',
  'application/vnd.vega.v3+json',
  'application/vnd.vega.v4+json',
  'application/vnd.vega.v5+json',
  'application/vnd.vegalite.v1+json',
  'application/vnd.vegalite.v2+json',
  'application/vnd.vegalite.v3+json',
  'application/vnd.vegalite.v4+json',
]

export const isVegaMediaType = (mimeType: string): boolean =>
  vegaMediaTypes.includes(mimeType)

/**
 * RegEx to parse a Vega Spec `$schema` url and find the library and version number used
 * Group 1: library used `vega` or `vega-lite | vegalite`
 * Group 2: version number used
 */
const VegaVersionRegEx = /(vega|vega-?lite)[/.]v([0-9]+(?:\.[0-9]){0,2})/

interface LibVersion {
  library: string
  version: string
  versionMajor: string
}

/**
 * Given a string, attempts to find the Vega library (`vega` vs `vega-lite`)
 * and the version being used.
 * Falls back to `vega` and `latest`.
 */
const getVegaVersion = (input: string): LibVersion => {
  const [, lib = 'vega', version = 'latest'] =
    VegaVersionRegEx.exec(input) ?? []

  const library = lib.replace('lite', '-lite')
  const versionMajor = version.split('.')[0]

  return { library, version, versionMajor }
}

const vegaScriptVersions = (libVersion: LibVersion): VegaScriptVersions => ({
  vega:
    libVersion.library === 'vega'
      ? libVersion.version
      : libVersion.versionMajor,
  vegaLite:
    libVersion.library === 'vegaLite'
      ? libVersion.version
      : libVersion.versionMajor,
})

/**
 * Define a Vega object to obviate the need to //@ts-ignore within
 * the `page.evaluate` function below.
 */
declare const vegaEmbed: (...args: unknown[]) => Promise<unknown>

export class VegaCodec extends Codec implements Codec {
  public readonly mediaTypes = vegaMediaTypes

  /**
   * Decode Vega JSON to an `ImageObject`.
   *
   * Most often used to convert the output of a Jupyter cell to an
   * image for compatibility to non-browser, non-Vega supporting
   * formats such as Word or Markdown.
   *
   * Uses Puppeteer and Vega to generate a static PNG for `contentUrl` for
   * consistency with the Plotly codec.
   *
   * In addition to the static image, stores the Vega JSON in `content` (
   * with `mediaType` and `spec` properties, so that the node can be reversed
   * back to Jupyter if needed, or rendered as an interactive figure in HTML.
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<schema.ImageObject> => {
    const json = await vfile.dump(file)
    const spec = JSON.parse(json)

    const libVersions = vegaScriptVersions(getVegaVersion(spec))

    const page = await ensureVegaPage(libVersions)

    // Wait until all resources are loaded
    await page.waitForFunction('vegaEmbed !== undefined')

    // Don't include this uninstrumented code that runs in the browser
    // in coverage stats.
    // istanbul ignore next
    const image = await page.evaluate(async (data) => {
      const pngImage = await vegaEmbed('#figure', data)
        .then(function (result: any) {
          return result.view.toImageURL('png')
        })
        .catch(console.error)
      return pngImage
    }, spec)

    return schema.imageObject({
      contentUrl: image,
      content: [
        {
          mediaType: vegaMediaType,
          spec,
        },
      ],
    })
  }

  /**
   * Encode a Stencila `ImageObject` to Vega spec JSON
   *
   * Most often used when encoding a Jupyter Notebook from some other format, when
   * the source document was itself created from a Jupyter Notebook (ie. reverse
   * converting back to a Jupyter Notebook from Word)
   */
  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    if (schema.isA('ImageObject', node) && node.content !== undefined) {
      for (const content of node.content) {
        if (
          typeof content === 'object' &&
          content !== null &&
          'spec' in content &&
          'mediaType' in content &&
          isVegaMediaType(content.mediaType)
        ) {
          const json = JSON.stringify(content.spec)
          return Promise.resolve(vfile.load(json))
        }
      }
    }
    log.warn(
      `Unable to encode Vega JSON from node of type "${schema.nodeType(node)}"`
    )
    return Promise.resolve(vfile.load('{}'))
  }
}
