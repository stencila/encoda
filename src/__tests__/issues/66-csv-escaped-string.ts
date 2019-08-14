import { CSVCodec } from '../../codecs/csv'
import * as vfile from '../../util/vfile'

/**
 * The original issue was confusing a "parser" used in the `coerce()` function to
 * split comma separated lists (e.g. names of authors) with the decoding of csv files.
 *
 * At the time, the decoding of CSV files was being delegated to https://github.com/SheetJS/js-xlsx.
 * Given the original test data in the issue, that seemed to have some problems with
 * handling quoted values as documented here: https://github.com/stencila/encoda/commit/d12bc5a454034ba4b00c7c0fbd976cae9d49482b
 *
 * However, replacing `js-xlsx` with another CSV parser (`papaparse`) showed the same result
 * and suggested that was expected behaviour given the trailing spaces after the commas in the
 * test data. This commit, just shows that when removing those trailing spaces, you get
 * expected behaviour.
 */
test('issue 66: csv codec properly escapes strings', async () => {
  const {decode, encode} = new CSVCodec()

  const csv = 'header1,header2,header3\ntext,"some text, it contains a comma",another text\n'

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
          "name": "header2",
          "type": "DatatableColumn",
          "values": [
            "some text, it contains a comma",
          ],
        },
        {
          "name": "header3",
          "type": "DatatableColumn",
          "values": [
            "another text",
          ],
        },
      ]
  })

  const csvOut = await vfile.dump(await encode(datatable))
  expect(csvOut).toEqual(csv)
})
