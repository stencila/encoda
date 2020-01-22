import stencila from '@stencila/schema'
import { JatsCodec } from '../jats'
import * as xml from '../../util/xml'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import path from 'path'
import tempy from 'tempy'

const log = getLogger('encoda:elife')
const jats = new JatsCodec()

export class ElifeCodec extends Codec implements Codec {
  private static regex = /^\s*((elife\s*:?\s*)|(https?:\/\/elifesciences\.org\/articles\/))(\d{5})(v(\d))?\s*$/i

  public readonly sniff = (content: string): Promise<boolean> => {
    return Promise.resolve(ElifeCodec.regex.exec(content) !== null)
  }

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const match = ElifeCodec.regex.exec(content)
    if (!match) throw new Error('Unable to parse content')

    const article = match[4]

    let version = match[6]
    if (version === undefined) {
      // Version unspecified, so fallback to version 1, but...
      version = '1'
      // Try to determine the latest version using the Github API.
      // This search is intended to return the latest version of the
      // article with a `<body>` element
      const url = `https://api.github.com/search/code?q=<body>+repo:elifesciences/elife-article-xml+language:xml+filename:elife-${article}-`
      const { statusCode, body } = await http.get(url)
      if (statusCode === 200) {
        const { items = [] } = JSON.parse(body)
        if (items.length > 0) {
          const versions: string[] = items
            .map((item: { name: string }) => item.name)
            .sort()
          const last = versions[versions.length - 1]
          const match = new RegExp(`^elife-${article}-v(\\d+).xml$`).exec(last)
          if (match !== null) {
            version = match[1]
          } else {
            log.warn(
              `Unable to determine latest version number from filename "${last}"`
            )
          }
        } else {
          log.warn(
            `Unable to find a version of article "${article}" with body content. Is the article number correct?`
          )
        }
      }
    }

    const url = `https://raw.githubusercontent.com/elifesciences/elife-article-xml/master/articles/elife-${article}-v${version}.xml`
    const { statusCode, body } = await http.get(url)
    if (statusCode !== 200) {
      log.error(`Unable to find eLife article with id: ${article}`)
      return stencila.article()
    }

    const doc = xml.load(body, { compact: false }) as xml.Element

    // Check that there is a <body> element, some don't have one
    if (xml.all(doc, 'body').length === 0) {
      log.warn(
        `Article ${article}v${version} has no body. You may wish to try another version.`
      )
    }

    const dir = tempy.directory()
    await fs.ensureDir(dir)

    // Get the figures and rewrite hrefs
    const graphics = xml.all(doc, 'graphic')
    for (const graphic of graphics) {
      let href = xml.attr(graphic, 'xlink:href')
      if (href?.startsWith('elife')) {
        if (!href.endsWith('.tif')) href += '.tif'
        const url = `https://iiif.elifesciences.org/lax:${article}%2F${href}/full/600,/0/default.jpg`
        const filename = href
          .replace(`elife-${article}-`, '')
          .replace(`-v${version}.tif`, '.jpg')
        const filepath = path.join(dir, filename)
        await http.download(url, filepath)
        if (graphic.attributes !== undefined) {
          graphic.attributes['xlink:href'] = filepath
          graphic.attributes['mime-subtype'] = 'jpeg'
        }
      }
    }

    // Dump the new JATS with `xlink:href`s to local images
    const jatsNew = xml.dump(doc)

    return jats.decode(vfile.load(jatsNew))
  }

  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to an eLife article is not yet implemented`)
  }
}
