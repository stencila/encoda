/**
 * A script to regenerate `*.json` text fixture files.
 *
 * Add entries to `fixtures` following the pattern ot
 * other entries. Destination files should always have
 * `.json` extension.
 *
 * This script should be rerun when the decoding codecs
 * involved are updated.
 */

import fs from 'fs-extra'
import path from 'path'
import { convert } from '..'

const fixtures = [
  {
    src: 'https://elifesciences.org/articles/50356',
    dest: ['article', 'journal', 'elife', '50356.json']
  }
]

for (const { src, dest } of fixtures) {
  convert(src, path.join(__dirname, ...dest)).catch(console.log)
}
