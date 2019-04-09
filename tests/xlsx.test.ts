import { read } from '../src/vfile'
import {
  columnIndexToName,
  columnNameToIndex,
  parse,
  unparse
} from '../src/xlsx'

test('columnNameToIndex, columnIndexToName', async () => {
  expect(columnNameToIndex('A')).toEqual(0)
  expect(columnIndexToName(0)).toEqual('A')

  expect(columnNameToIndex('Z')).toEqual(25)
  expect(columnIndexToName(25)).toEqual('Z')

  expect(columnNameToIndex('AA')).toEqual(columnNameToIndex('Z') + 1)

  expect(columnIndexToName(columnNameToIndex('AZ'))).toEqual('AZ')
  expect(columnIndexToName(columnNameToIndex('ZZ'))).toEqual('ZZ')
})

const simple = {
  file: `${__dirname}/fixtures/datatable/simple/simple.xlsx`,
  node: {
    type: 'Datatable',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'A',
        values: ['a', 'b', 'c']
      },
      {
        type: 'DatatableColumn',
        name: 'B',
        values: [1, 2, 3]
      }
    ]
  }
}

const collection = {
  file: `${__dirname}/fixtures/collection/datatable+table/collection.xlsx`,
  node: {
    type: 'Collection',
    parts: [
      {
        type: 'Datatable',
        columns: [
          {
            type: 'DatatableColumn',
            name: 'species',
            values: ['a', 'b', 'a', 'a', 'b', 'c']
          },
          {
            type: 'DatatableColumn',
            name: 'height',
            values: [1, 2, 3, 4, 5, 6]
          },
          {
            type: 'DatatableColumn',
            name: 'weight',
            values: [3, 2, 1, 3, 4, 3]
          },
          {
            type: 'DatatableColumn',
            name: 'date',
            values: [-322135, -322070, -322005, -321940, -321875, -321810]
          }
        ]
      },
      {
        type: 'Table',
        cells: {
          A1: 'mean height',
          A2: 'mean weight',
          B1: {
            type: 'Expression',
            programmingLanguages: ['excel'],
            text: 'AVERAGE(data!B2:B7)',
            value: 3.5
          },
          B2: {
            type: 'Expression',
            programmingLanguages: ['excel'],
            text: 'AVERAGE(data!C2:C7)',
            value: 2.66666666666667
          }
        }
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(await read(simple.file))).toEqual(simple.node)
  expect(await parse(await read(collection.file))).toEqual(collection.node)
})

test.skip('unparse', async () => {
  expect(await unparse(simple.node)).toEqual(await read(simple.file))
  expect(await unparse(collection.node)).toEqual(await read(collection.file))
})
