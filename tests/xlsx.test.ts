import { read } from '../src/vfile'
import {
  columnIndexToName,
  columnNameToIndex,
  decode,
  encode
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
    name: 'Sheet1',
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
        name: 'data',
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
        name: 'calcs',
        rows: [],
        cells: [
          {
            type: 'TableCell',
            name: 'A1',
            position: [0, 0],
            content: ['mean height']
          },
          {
            type: 'TableCell',
            name: 'B1',
            position: [1, 0],
            content: [
              {
                type: 'Expression',
                programmingLanguages: ['excel'],
                text: 'AVERAGE(data!B2:B7)',
                value: 3.5
              }
            ]
          },
          {
            type: 'TableCell',
            name: 'A2',
            position: [0, 1],
            content: ['mean weight']
          },
          {
            type: 'TableCell',
            name: 'B2',
            position: [1, 1],
            content: [
              {
                type: 'Expression',
                programmingLanguages: ['excel'],
                text: 'AVERAGE(data!C2:C7)',
                value: 2.66666666666667
              }
            ]
          }
        ]
      }
    ]
  }
}

test('decode', async () => {
  expect(await decode(await read(simple.file))).toEqual(simple.node)
  expect(await decode(await read(collection.file))).toEqual(collection.node)
})

test('encode', async () => {
  // Use round trip since meta data in the binary file (e.g. last save time)
  // makes comparison of those files difficult
  expect(await decode(await encode(simple.node))).toEqual(simple.node)
  expect(await decode(await encode(collection.node))).toEqual(collection.node)
})
