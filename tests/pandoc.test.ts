import * as Pandoc from '../src/pandoc-types'

// A very simple test of the approach to typing Pandoc nodes
test('types', () => {
  const str: Pandoc.Str = {
    t: 'Str',
    c: 'A string'
  }

  let para: Pandoc.Para = {
    t: 'Para',
    c: [
      str,
      {
        t: 'Str',
        c: ' and another.'
      }
    ]
  }

  // Should create error: Property 'c' is missing in type '{ t: "Para"; }' but required in type....
  // para = {t: 'Para'}

  const meta: Pandoc.Meta = {
    key: {
      t: 'MetaList',
      c: [
        {
          t: 'MetaBool',
          c: true
        }
      ]
    }
  }

  const blocks: Pandoc.Block[] = [
    para,
    {
      t: 'BlockQuote',
      c: []
    }
    // Should create error: Type '"Str"' is not assignable to type '"Para" ...
    // {t: 'Str'}
  ]

  const doc: Pandoc.Document = {
    'pandoc-api-version': [1, 17, 5, 4],
    meta,
    blocks
  }
})
