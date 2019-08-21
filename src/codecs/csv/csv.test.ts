import { dump, load } from '../../util/vfile'
import { CsvCodec } from './'

const { decode, encode } = new CsvCodec()

const simple = {
  content: `A,B,C\r\n1,2,3\r\n2,5,6\r\n3,8,9`,
  node: {
    type: 'Datatable',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'A',
        values: [1, 2, 3]
      },
      {
        type: 'DatatableColumn',
        name: 'B',
        values: [2, 5, 8]
      },
      {
        type: 'DatatableColumn',
        name: 'C',
        values: [3, 6, 9]
      }
    ]
  }
}

const named = {
  content: `code,height,width\r\na,2,3\r\nb,5,6\r\nc,8,9`,
  node: {
    type: 'Datatable',
    columns: [
      {
        type: 'DatatableColumn',
        name: 'code',
        values: ['a', 'b', 'c']
      },
      {
        type: 'DatatableColumn',
        name: 'height',
        values: [2, 5, 8]
      },
      {
        type: 'DatatableColumn',
        name: 'width',
        values: [3, 6, 9]
      }
    ]
  }
}

test('decode', async () => {
  expect(await decode(load(simple.content))).toEqual(simple.node)
  expect(await decode(load(named.content))).toEqual(named.node)
})

describe('encode', () => {
  test('simple', async () => {
    expect(await dump(await encode(simple.node))).toEqual(simple.content)
  })

  test('named', async () => {
    expect(await dump(await encode(named.node))).toEqual(named.content)
  })
})
