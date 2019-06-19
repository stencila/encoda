import stencila from '@stencila/schema'
import { load } from '../../src'

test('issue 20: empty cells ignored during conversion', async () => {
  // Note that the last two rows are included
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
    name: 'Sheet1',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'A',
        values: [1, 4, 6, null, 7, 8, null, 11, null, null]
      },
      {
        type: 'DatatableColumn',
        name: 'B',
        values: [2, null, null, null, null, 9, null, null, null, null]
      },
      {
        type: 'DatatableColumn',
        name: 'C',
        values: [3, 5, null, null, null, 10, null, null, null, null]
      }
    ]
  }

  expect(await load(csv, 'csv')).toEqual(dt)
})
