import { dump, load } from '../../util/vfile'
import { CsvCodec } from './'

const { decode, encode } = new CsvCodec()

const simple = {
  content: `A,B,C\n1,2,3\n2,5,6\n3,8,9\n`,
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
  content: `code,height,width\na,2,3\nb,5,6\nc,8,9\n`,
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
  const normalizeNewline = function(actual: string) {
    let normalized = actual.replace(/\r\n/g, '\n')
    if (!normalized.endsWith('\n')) normalized += '\n'
    return normalized
  }

  test('simple', async () => {
    expect(normalizeNewline(await dump(await encode(simple.node)))).toEqual(
      simple.content
    )
  })

  test('named', async () => {
    expect(normalizeNewline(await dump(await encode(named.node)))).toEqual(
      named.content
    )
  })
})
