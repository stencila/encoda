import path from 'path'
import * as pdf from '../src/pdf'
import { create } from '../src/vfile'
import articleSimple from './fixtures/article-simple'

test('decode', async () => {
  await expect(pdf.decode(create())).rejects.toThrow(
    /Parsing of PDF files is not supported/
  )
})

test('encode', async () => {
  const output = path.join(__dirname, 'output', 'pdf-encode.pdf')
  const doc = await pdf.encode(articleSimple, { filePath: output })

  expect(Buffer.isBuffer(doc.contents)).toBe(true)
  expect(doc.contents.slice(0, 5).toString()).toBe('%PDF-')
})

afterAll(async () => {
  await pdf.browser('close')
})
