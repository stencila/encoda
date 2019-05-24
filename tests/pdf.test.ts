import path from 'path'
import * as pdf from '../src/pdf'
import { create } from '../src/vfile'
import articleSimple from './fixtures/article-simple'

test('parse', async () => {
  await expect(pdf.parse(create())).rejects.toThrow(
    /Parsing of PDF files is not supported/
  )
})

test('unparse', async () => {
  const output = path.join(__dirname, 'output', 'pdf-unparse.pdf')
  const doc = await pdf.unparse(articleSimple, output)

  expect(Buffer.isBuffer(doc.contents)).toBe(true)
  expect(doc.contents.slice(0, 5).toString()).toBe('%PDF-')
})

afterAll(async () => {
  await pdf.browser('close')
})
