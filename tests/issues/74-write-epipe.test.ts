//import * as stencila from '@stencila/schema'
//import fs from 'fs-extra'
import path from 'path'
import { read } from '../../src'

describe('issue 74', () => {
  /**
   * The issue was reported with respect to converting to HTML
   * but it also occurs when converting to JSON.
   *
   * $ npx ts-node --files src/cli ./tests/issues/74-write-epipe.docx --to json
   *
   * Error: write EPIPE
   *     at WriteWrap.afterWrite (net.js:836:14)
   *
   * This suggests it's a problem within `read` and
   * [this issue](https://github.com/nodejs/node/issues/947)
   * suggest that it is a problem with use of `stdin` of `stdout`
   * within `pandoc.run`.
   */

  const file = path.join(__dirname, '74-write-epipe.docx')

  test('can read file', async () => {
    // Before bug fix, this fails with `Error: write EPIPE`
    const node = await read(file)
  })
})
