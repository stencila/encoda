/**
 * Script to create an PLoS JATS XML fixture. Usage:
 *
 *    npx ts-node plos.ts 10.1371/journal.pone.0091296
 *
 * See http://api.plos.org/text-and-data-mining/
 */

import * as xml from '../../../util/xml'
import * as http from '../../../util/http'
import fs from 'fs-extra'
import path from 'path'

const create = async (doi: string, journal: string = 'plosone') => {
  const url = `http://journals.plos.org/${journal}/article/file?id=${doi}&type=manuscript`
  const jats = await http.get(url)
  const doc = xml.load(jats.body, { compact: false }) as xml.Element

  const id = doi.split('.').pop()
  const dir = `${journal}-${id}`
  await fs.ensureDir(dir)

  // Get the figures and rewrite hrefs
  const graphics = xml.all(doc, 'graphic')
  for (const graphic of graphics) {
    let href = xml.attr(graphic, 'xlink:href')
    if (href !== null && href.startsWith(`info:doi/${doi}`)) {
      const id = href.split('.').pop() || ''
      let url =
        `https://journals.plos.org/${journal}/article/` +
        (id.startsWith('e')
          ? // Equation
            `file?id=info:doi/${doi}.${id}&type=thumbnail`
          : // Eveything else
            `figure/image?id=${doi}.${id}&size=medium`)
      const filename = `${id}.png`
      await http.download(url, path.join(dir, filename))
      if (graphic.attributes !== undefined)
        graphic.attributes['xlink:href'] = filename
    }
  }

  await fs.writeFile(path.join(dir, `main.jats.xml`), xml.dump(doc), 'utf8')
  await fs.writeFile(
    path.join(dir, `main.pretty.xml`),
    xml.dump(doc, { spaces: 2 }),
    'utf8'
  )
}

// Get arguments from command line and create fixture!
const journal = process.argv[2]
const doi = process.argv[3]
create(journal, doi)
