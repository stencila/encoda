/**
 * Generate documentation for Encoda using the `dir` codec
 * to convert documentation files (matching patterns below)
 * to a tree of HTML in `docs`.
 */

import * as logga from '@stencila/logga'
import { DirCodec } from './src/codecs/dir'
;(async () => {
  logga.replaceHandlers((data: logga.LogData) => {
    if (data.level < 1) logga.defaultHandler(data)
  })

  const dir = new DirCodec()

  const docs = await dir.read('.', {
    patterns: [
      '*.md',
      'src/**/README.*',
      '!**/__fixtures__',
      '!**/__outputs__',
      '!**/__tests__'
    ]
  })

  await dir.write(docs, 'docs', {
    isStandalone: true,
    theme: 'stencila'
  })
})()
