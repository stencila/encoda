/**
 * Generate documentation
 *
 *
 */

import { decode, encode } from './src/codecs/dir'
import * as vfile from './src/util/vfile'

;(async () => {
  const docs = await decode(vfile.create('src'), {
    patterns: [
      '**/README.*',
      '!**/__fixtures__',
      '!**/__outputs__',
      '!**/__tests__'
    ]
  })
  await encode(docs, {
    filePath: 'docs'
  })
})()
