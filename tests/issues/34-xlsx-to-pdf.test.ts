import fs from 'fs-extra'
import path from 'path'
import { read, write } from '../../src'

const xlsx = path.join(__dirname, '34-xlsx-to-pdf.xlsx')
const pdf = path.join(__dirname, '34-xlsx-to-pdf.out.pdf')

/**
 * This issue was reported by a user attempting to convert directly
 * from xlsx to pdf. See https://community.stenci.la/t/missing-inserted-in-alignment-preamble-xlsx-to-pdf/206
 *
 * The error occurred with a previous incarnation of the PDF encoder
 * which was using Pandoc and which seems to have baulked at the `#`
 * in the first column header.
 *
 * This test just tests that the PDF file is created and that the
 * error reported does not occur. Use manual, visual
 * inspection of the PDF to check it looks OK :)
 */
test('issue 34: XLSX to PDF conversion fails', async () => {
  const datatable = await read(xlsx)

  const expected = {
    type: 'Datatable',
    name: 'Monkeys',
    columns: [
      {
        type: 'DatatableColumn',
        name: '# Monkeys',
        values: [10, 30, 28]
      },
      {
        type: 'DatatableColumn',
        name: 'Tame?',
        values: ['Partly', 'Completely', 'Utterly intransigent']
      }
    ]
  }
  expect(datatable).toEqual(expected)

  await write(datatable, pdf)
  expect(await fs.pathExists(pdf)).toBe(true)
})

afterAll(async () => {
  await fs.remove(pdf)
})
