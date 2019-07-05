/**
 * Generate documentation for Encoda using the `dir` codec
 * to convert documentation files (matching patterns below)
 * to a tree of HTML in `docs`.
 */

import { decode, encode } from './src/codecs/dir'
import * as vfile from './src/util/vfile'
import * as logga from '@stencila/logga'

logga.replaceHandlers((data: logga.LogData) => {
  if (data.level < 1) logga.defaultHandler(data)
})
;(async () => {
  const docs = await decode(vfile.create('.'), {
    patterns: [
      '*.md',
      'src/**/README.*',
      '!**/__fixtures__',
      '!**/__outputs__',
      '!**/__tests__'
    ]
  })
  await encode(docs, {
    filePath: 'docs'
  })
})()
