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
 * Media files (e.g figure images) are included as part of fixtures to allow
 * testing of formats such as PDF and DOCX.
 */

import path from 'path'
import { read, write } from '..'

const fixtures = [
  {
    src: 'https://elifesciences.org/articles/30274v2',
    dest: ['article', 'journal', 'elife', '30274.json'],
  },
  {
    src: 'https://elifesciences.org/articles/50356',
    dest: ['article', 'journal', 'elife', '50356.json'],
  },
  {
    src:
      'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229075',
    dest: ['article', 'journal', 'plosone', '0229075.json'],
  },
]

Promise.all(
  fixtures.map(async ({ src, dest }) => {
    const node = await read(src)
    await write(node, path.join(__dirname, ...dest))
  })
).catch(console.log)
