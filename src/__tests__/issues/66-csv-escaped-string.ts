import { CSVCodec } from '../../codecs/csv'
import * as vfile from '../../util/vfile'

/**
 * The original issue way confusing a "parser" used in the `coerce()` function to
 * split comma separated lists (e.g. names of authors) with the decoding of csv files.
 *
 * At the time, the decoding of CSV files was being delegated to https://github.com/SheetJS/js-xlsx
 * which was presumed to handle the escaping of strings properly. However, this test showed
 * that there were deficiencies with `js-xlsx`'s parsing of CSV as noted below:
 */
test('issue 66: csv codec properly escapes strings', async () => {
  const {decode, encode} = new CSVCodec()

  const csv = 'header1, header2, header3\ntext, "some text, it contains a comma", another text\n'

  const datatable = await decode(await vfile.load(csv))
  expect(datatable).toEqual({
      "type": "Datatable",
      "name": "Sheet1",
      "columns": [
        {
          "name": "header1",
          "type": "DatatableColumn",
          "values": [
            "text",
          ],
        },
        {
          "name": " header2", // Note leading space
          "type": "DatatableColumn",
          "values": [
            " \"some text, it contains a comma\"",  // Note leading space and extra escaped quotes
          ],
        },
        {
          "name": " header3", // Note leading space
          "type": "DatatableColumn",
          "values": [
            " another text", // Note leading space
          ],
        },
      ]
  })

  const csvOut = await vfile.dump(await encode(datatable))
  expect(csvOut).toEqual(
    // The extra quotes get put into the output, along with leading space
    'header1, header2, header3\ntext," ""some text, it contains a comma""", another text\n'
  )
})
