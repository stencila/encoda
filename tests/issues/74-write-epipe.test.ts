import fs from 'fs-extra'
import path from 'path'
import { read, write } from '../../src'

test('issue 74', async () => {
  /**
   * The [issue](https://github.com/stencila/convert/issues/74)
   * was reported with respect to converting to HTML
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

  const docx = path.join(__dirname, '74-write-epipe.docx')
  const html = path.join(__dirname, '74-write-epipe.html')

  // Before fix, this fails with `Error: write EPIPE`
  //    https://travis-ci.org/stencila/convert/jobs/537572367#L172
  //    https://ci.appveyor.com/project/nokome/convert/builds/24825307#L66
  const node = await read(docx)
  expect(node).toBeTruthy()

  // The bug wasn't related to generating HTML, but just
  // to cover everything in the issue...
  await write(node, html)
  expect(await fs.pathExists(html)).toBeTruthy()

  // Cleanup
  await fs.remove(html)
  await fs.remove(docx + '.media')
})
