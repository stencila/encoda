/**
 * A script to regenerate `*.json` text fixture files.
 * Run it using:
 *
 * ```bash
 * npm run fixtures
 * ```
 *
 * Add entries to `fixtures` following the pattern for
 * other entries. Destination files should always have
 * `.json` extension.
 *
 * This script should be rerun when the decoding codecs
 * involved are updated.
 *
 * Media files are 'unlinked' to prevent are large number
 * of files being created.
 */

import path from 'path'
import { read, write } from '..'
import { unlinkFiles } from '../util/media/unlinkFiles'

const fixtures = [
  {
    src: 'https://elifesciences.org/articles/50356',
    dest: ['article', 'journal', 'elife', '50356.json']
  },
  {
    src:
      'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229075',
    dest: ['article', 'journal', 'plosone', '0229075.json']
  }
]

Promise.all(
  fixtures.map(async ({ src, dest }) => {
    const node = await read(src)
    const unlinked = await unlinkFiles(node)
    await write(unlinked, path.join(__dirname, ...dest))
  })
).catch(console.log)
