/**
 * Script to create an eLife JATS XML fixture. Usage:
 *
 *    npx ts-node elife.ts 46793
 */

import * as xml from '../../../util/xml'
import * as http from '../../../util/http'
import fs from 'fs-extra'
import path from 'path'

/**
 * Fetch and format eLife JATS XML to improve readability for developers
 * and to download images.
 *
 * Walks the tree and finds `<graphic xlink:href="elife-46793-fig1-v1.tif"/>` like
 * elements and:
 *  - downloads the image from the eLife image server
 *  - replaces the `href` with name of the downloaded file
 *
 * See [this comment](https://github.com/elifesciences/elife-article-xml/issues/2#issuecomment-467521451)
 * for potential minor problems with prettifying XML.
 */
const create = async (id: number, version: number = 1) => {
  const url = `https://raw.githubusercontent.com/elifesciences/elife-article-xml/master/articles/elife-${id}-v${version}.xml`
  const jats = await http.get(url)
  const doc = xml.load(jats.body, { compact: false }) as xml.Element

  // Check that there is a <body> element, some don't have one
  if (xml.all(doc, 'body').length === 0) {
    throw new Error (`Article ${id} v${version} has no body`)
  }

  const dir = `elife-${id}-v${version}`
  await fs.ensureDir(dir)

  // Get the figures and rewrite hrefs
  const graphics = xml.all(doc, 'graphic')
  for (const graphic of graphics) {
    let href = xml.attr(graphic, 'xlink:href')
    if (href !== null && href.startsWith('elife')) {
      if (!href.endsWith('.tif')) href += '.tif'
      const url = `https://iiif.elifesciences.org/lax:${id}%2F${href}/full/600,/0/default.jpg`
      const filename = href.replace(`elife-${id}-`, '').replace(`-v${version}.tif`, '.jpg')
      await http.download(url, path.join(dir, filename))
      if (graphic.attributes !== undefined) graphic.attributes['xlink:href'] = filename
    }
  }

  await fs.writeFile(
    path.join(dir, `main.jats.xml`),
    xml.dump(doc),
    'utf8'
  )
  await fs.writeFile(
    path.join(dir, `main.pretty.xml`),
    xml.dump(doc, {spaces: 2}),
    'utf8'
  )
}

// Get arguments from command line and create fixture!
const id = parseInt(process.argv[2])
const version = parseInt(process.argv[3] || '1')
create(id, version)
