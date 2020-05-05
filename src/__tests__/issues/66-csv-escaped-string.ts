import { CsvCodec } from '../../codecs/csv'
import * as vfile from '../../util/vfile'

/**
 * The original issue was confusing a "parser" used in the `coerce()` function to
 * split comma separated lists (e.g. names of authors) with the decoding of CSV files.
 *
 * At the time, the decoding of CSV files was being delegated to https://github.com/SheetJS/js-xlsx
 * which was presumed to handle the escaping of strings properly. However, this test showed
 * that may be issues with `js-xlsx`'s parsing and so we switched to using
 * `papaparse` instead.
 */
test('issue 66: csv codec properly escapes strings', async () => {
  const { decode, encode } = new CsvCodec()

  const csv =
    'header1,header2,header3\r\ntext,"some text, it contains a comma",another text'

  const datatable = await decode(await vfile.load(csv))
  expect(datatable).toEqual({
    type: 'Datatable',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'header1',
        values: ['text'],
      },
      {
        type: 'DatatableColumn',
        name: 'header2',
        values: ['some text, it contains a comma'],
      },
      {
        type: 'DatatableColumn',
        name: 'header3',
        values: ['another text'],
      },
    ],
  })

  expect(await vfile.dump(await encode(datatable))).toEqual(csv)
})
