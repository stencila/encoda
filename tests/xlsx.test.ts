import { Datatable, Table } from '@stencila/schema'
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

const table = {
  file: `${__dirname}/fixtures/table/simple/simple.xlsx`,
  node: {
    type: 'Table',
    name: 'Sheet1',
    rows: [
      {
        type: 'TableRow',
        cells: [
          {
            type: 'TableCell',
            name: 'A1',
            content: ['A']
          },
          {
            type: 'TableCell',
            name: 'B1',
            content: ['B']
          }
        ]
      },
      {
        type: 'TableRow',
        cells: [
          {
            type: 'TableCell',
            name: 'A2',
            content: ['a']
          },
          {
            type: 'TableCell',
            name: 'B2',
            content: [1]
          }
        ]
      },
      {
        type: 'TableRow',
        cells: [
          {
            type: 'TableCell',
            name: 'A3',
            content: ['b']
          },
          {
            type: 'TableCell',
            name: 'B3',
            content: [2]
          }
        ]
      },
      {
        type: 'TableRow',
        cells: [
          {
            type: 'TableCell',
            name: 'A4',
            content: ['c']
          },
          {
            type: 'TableCell',
            name: 'B4',
            content: [
              {
                type: 'CodeExpr',
                programmingLanguage: 'excel',
                text: 'SUM(B2:B3)^3',
                value: 27
              }
            ]
          }
        ]
      }
    ]
  }
}

const collection: {
  file: string
  node: {
    type: 'Collection'
    parts: [Datatable, Table]
  }
} = {
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
        rows: [
          {
            type: 'TableRow',
            cells: [
              {
                type: 'TableCell',
                name: 'A1',
                content: ['mean height']
              },
              {
                type: 'TableCell',
                name: 'B1',
                content: [
                  {
                    type: 'CodeExpr',
                    programmingLanguage: 'excel',
                    text: 'AVERAGE(data!B2:B7)',
                    value: 3.5
                  }
                ]
              }
            ]
          },
          {
            type: 'TableRow',
            cells: [
              {
                type: 'TableCell',
                name: 'A2',
                content: ['mean weight']
              },
              {
                type: 'TableCell',
                name: 'B2',
                content: [
                  {
                    type: 'CodeExpr',
                    programmingLanguage: 'excel',
                    text: 'AVERAGE(data!C2:C7)',
                    value: 2.66666666666667
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

describe('decode', () => {
  test('simple node', async () => {
    expect(await decode(await read(simple.file))).toEqual(simple.node)
  })

  test('simple table', async () => {
    expect(await decode(await read(table.file))).toEqual(table.node)
  })

  test('collection node', async () => {
    expect(await decode(await read(collection.file))).toEqual(collection.node)
  })
})

describe('encode', () => {
  // Use round trip since meta data in the binary file (e.g. last save time)
  // makes comparison of those files difficult
  test('simple node', async () => {
    expect(await decode(await encode(simple.node))).toEqual(simple.node)
  })

  test('simple table', async () => {
    expect(await decode(await encode(table.node))).toEqual(table.node)
  })

  test('collection node', async () => {
    expect(await decode(await encode(collection.node))).toEqual(collection.node)
  })
})
