import { dump, read } from '../../util/vfile'
import { TDP } from './'

const { decode, encode } = new TDP()

const periodic = {
  file: `${__dirname}/__fixtures__/datapackage.json`,
  node: {
    type: 'Datatable',
    name: 'periodic-table',
    alternateNames: ['Periodic Table'],
    licenses: [
      {
        type: 'CreativeWork',
        name: 'CC0-1.0',
        alternateNames: ['CC0 1.0'],
        url: 'https://creativecommons.org/publicdomain/zero/1.0/'
      }
    ],
    columns: [
      {
        type: 'DatatableColumn',
        name: 'atomic number',
        schema: {
          type: 'DatatableColumnSchema',
          items: {
            type: 'integer',
            minimum: 1,
            maximum: 10
          }
        },
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        type: 'DatatableColumn',
        name: 'symbol',
        schema: {
          type: 'DatatableColumnSchema',
          items: {
            type: 'string',
            minLength: 1,
            maxLength: 2
          },
          uniqueItems: true
        },
        values: ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne']
      },
      {
        type: 'DatatableColumn',
        name: 'name',
        schema: {
          type: 'DatatableColumnSchema',
          items: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            pattern: '[A-Z][a-z]+'
          }
        },
        values: [
          'Hydrogen',
          'Helium',
          'Lithium',
          'Beryllium',
          'Boron',
          'Carbon',
          'Nitrogen',
          'Oxygen',
          'Fluorine',
          'Neon'
        ]
      },
      {
        type: 'DatatableColumn',
        name: 'atomic mass',
        schema: {
          type: 'DatatableColumnSchema',
          items: {
            anyOf: [
              {
                type: 'number',
                minimum: 1
              },
              {
                type: 'null'
              }
            ]
          }
        },
        values: [
          1.00794,
          4.002602,
          6.941,
          9.012182,
          10.811,
          12.0107,
          14.0067,
          15.9994,
          18.9984032,
          20.1797
        ]
      },
      {
        type: 'DatatableColumn',
        name: 'metal or nonmetal?',
        schema: {
          type: 'DatatableColumnSchema',
          items: {
            type: 'string',
            enum: [
              'nonmetal',
              'noble gas',
              'alkali metal',
              'alkaline earth metal',
              'metalloid',
              'halogen'
            ]
          }
        },
        values: [
          'nonmetal',
          'noble gas',
          'alkali metal',
          'alkaline earth metal',
          'metalloid',
          'nonmetal',
          'nonmetal',
          'nonmetal',
          'halogen',
          'noble gas'
        ]
      }
    ]
  }
}

test('decode', async () => {
  expect(await decode(await read(periodic.file))).toEqual(periodic.node)
})

test('encode', async () => {
  const actual = JSON.parse(await dump(await encode(periodic.node)))
  // Pretend that we encoded to a a filePath i.e. that
  // the data was written to disk.
  delete actual.resources[0].data
  actual.resources[0].path = 'periodic-table.csv'
  const expected = JSON.parse(await dump(await read(periodic.file)))
  expect(actual).toEqual(expected)
})
