import fs from 'fs-extra'
import path from 'path'
import { create } from '../../util/vfile'
import articleSimple from '../../__fixtures__/article-simple'
import * as pdf from './'

jest.setTimeout(30 * 1000) // Extending timeout due to long running test

// Ensure that the dir for test outputs is present
const output = path.join(__dirname, '__output__')
fs.ensureDirSync(output)

test('decode', async () => {
  await expect(pdf.decode(create())).rejects.toThrow(
    /Parsing of PDF files is not supported/
  )
})

test('encode', async () => {
  const filePath = path.join(output, 'pdf-encode.pdf')
  const doc = await pdf.encode(articleSimple, { filePath })

  expect(Buffer.isBuffer(doc.contents)).toBe(true)
  expect(doc.contents.slice(0, 5).toString()).toBe('%PDF-')
})
