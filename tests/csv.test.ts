import { parse, unparse } from '../src/csv'
import { dump, load } from '../src/vfile'

const simple = {
  content: `1,2,3\n2,5,6\n3,8,9`,
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
  content: `code,height,width\na,2,3\nb,5,6\nc,8,9`,
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

const formulas = {
  content: `1\t= A1 * 2\n= B1 * 3`,
  node: {
    type: 'Table',
    cells: {
      A1: 1,
      B1: {
        type: 'Expression',
        programmingLanguages: ['excel'],
        text: 'A1 * 2'
      },
      A2: {
        type: 'Expression',
        programmingLanguages: ['excel'],
        text: 'B1 * 3'
      }
    }
  }
}

test('parse', async () => {
  expect(await parse(load(simple.content))).toEqual(simple.node)
  expect(await parse(load(named.content))).toEqual(named.node)
  expect(await parse(load(formulas.content))).toEqual(formulas.node)
})

test.skip('unparse', async () => {
  expect(dump(await unparse(simple.node))).toEqual(simple.content)
})
