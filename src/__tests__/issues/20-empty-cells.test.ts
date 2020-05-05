import stencila from '@stencila/schema'
import { CsvCodec } from '../../codecs/csv'
import * as vfile from '../../util/vfile'

const { decode } = new CsvCodec()

test('issue 20: empty cells ignored during conversion', async () => {
  // Note that the last rows is included
  const csv = `1,2,3
4,,5
6,,
,,
7,
8,9,10
,,
11
,,
`
  const dt: stencila.Datatable = {
    type: 'Datatable',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'A',
        values: [1, 4, 6, null, 7, 8, null, 11, null],
      },
      {
        type: 'DatatableColumn',
        name: 'B',
        values: [2, null, null, null, null, 9, null, null, null],
      },
      {
        type: 'DatatableColumn',
        name: 'C',
        values: [3, 5, null, null, null, 10, null, null, null],
      },
    ],
  }

  expect(await decode(await vfile.load(csv))).toEqual(dt)
})
