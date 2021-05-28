/**
 * Script to create F1000 JATS XML fixture. Usage:
 *
 *    npx ts-node f1000.ts 8-1394
 *
 * See also https://f1000research.com/developers
 *
 * Note that currently, there is no know easy way to fetch images.
 */

import * as xml from '../../../util/xml'
import { encoda } from '../../..'
import fs from 'fs-extra'
import path from 'path'

const create = async (id: string, version: number = 1) => {
  const url = `https://f1000research.com/articles/${id}/v${version}/xml`
  const [jats] = await encoda.read(url)
  const doc = xml.load(jats) as xml.Element

  const dir = `f1000-${id}-v${version}`
  await fs.ensureDir(dir)

  await fs.writeFile(path.join(dir, `main.jats.xml`), xml.dump(doc), 'utf8')
  await fs.writeFile(
    path.join(dir, `main.pretty.xml`),
    xml.dump(doc, { spaces: 2 }),
    'utf8'
  )
}

// Get arguments from command line and create fixture!
const id = process.argv[2]
const version = parseInt(process.argv[3] || '1')
create(id, version)
