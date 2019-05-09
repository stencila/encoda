import * as stencila from '@stencila/schema'
import { emptyAttrs, parse, unparse } from '../src/pandoc'
import * as Pandoc from '../src/pandoc-types'
import { dump, load } from '../src/vfile'

test('parse', async () => {
  const p = async (pdoc: any) => await parse(load(JSON.stringify(pdoc)))
  expect(await p(kitchenSink.pdoc)).toEqual(kitchenSink.node)
  expect(await p(collapseSpaces.pdoc)).toEqual(collapseSpaces.node)
})

test('unparse', async () => {
  const u = async (node: any) => JSON.parse(dump(await unparse(node)))
  expect(await u(kitchenSink.node)).toEqual(kitchenSink.pdoc)
})

interface testCase {
  pdoc: Pandoc.Document
  node: stencila.Article
}

// Shorthands for creating Pandoc elements
const str = (str: string): Pandoc.Str => ({ t: 'Str', c: str })
const space = (): Pandoc.Space => ({ t: 'Space', c: undefined })

// A test intended to have with at least one example of each
// Pandoc element type (we'll add them over time :)
const kitchenSink: testCase = {
  pdoc: {
    'pandoc-api-version': [1, 17, 5, 4],
    meta: {
      title: {
        t: 'MetaString',
        c: 'The title'
      },
      authors: {
        t: 'MetaList',
        c: [
          {
            t: 'MetaMap',
            c: {
              type: { t: 'MetaString', c: 'Person' },
              givenNames: {
                t: 'MetaList',
                c: [{ t: 'MetaString', c: 'Jane' }]
              },
              familyNames: {
                t: 'MetaList',
                c: [{ t: 'MetaString', c: 'Jones' }]
              }
            }
          }
        ]
      },
      citations: {
        t: 'MetaList',
        c: []
      }
    },
    blocks: [
      {
        t: 'Header',
        c: [1, emptyAttrs, [str('Heading one')]]
      },
      {
        t: 'Header',
        c: [2, emptyAttrs, [str('Heading two')]]
      },
      {
        t: 'Para',
        c: [
          str('A paragraph with '),
          { t: 'Emph', c: [str('emphasis')] },
          str(' and '),
          { t: 'Strong', c: [str('strong')] },
          str(' and '),
          { t: 'Strikeout', c: [str('delete')] },
          str(' and '),
          {
            t: 'Quoted',
            c: [{ t: Pandoc.QuoteType.SingleQuote }, [str('quote')]]
          },
          str(' and '),
          { t: 'Code', c: [['', ['r'], []], 'code'] },
          str(' and '),
          { t: 'Link', c: [emptyAttrs, [], ['url', 'title']] },
          str(' and '),
          { t: 'Image', c: [emptyAttrs, [], ['url', 'title']] },
          str('.')
        ]
      },
      {
        t: 'BlockQuote',
        c: [{ t: 'Para', c: [str('A blockquote')] }]
      },
      {
        t: 'CodeBlock',
        c: [emptyAttrs, '# A code block']
      },
      {
        t: 'BulletList',
        c: [
          [{ t: 'Para', c: [str('Item one')] }],
          [{ t: 'Para', c: [str('Item two')] }]
        ]
      },
      {
        t: 'OrderedList',
        c: [
          [
            1,
            { t: Pandoc.ListNumberStyle.DefaultStyle },
            { t: Pandoc.ListNumberDelim.DefaultDelim }
          ],
          [
            [{ t: 'Para', c: [str('First item')] }],
            [{ t: 'Para', c: [str('Second item')] }]
          ]
        ]
      },
      {
        t: 'HorizontalRule',
        c: undefined
      }
    ]
  },
  node: {
    type: 'Article',
    title: 'The title',
    authors: [
      {
        type: 'Person',
        givenNames: ['Jane'],
        familyNames: ['Jones']
      }
    ],
    citations: [],
    content: [
      {
        type: 'Heading',
        depth: 1,
        content: ['Heading one']
      },
      {
        type: 'Heading',
        depth: 2,
        content: ['Heading two']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          { type: 'Emphasis', content: ['emphasis'] },
          ' and ',
          { type: 'Strong', content: ['strong'] },
          ' and ',
          { type: 'Delete', content: ['delete'] },
          ' and ',
          { type: 'Quote', content: ['quote'] },
          ' and ',
          { type: 'Code', language: 'r', value: 'code' },
          ' and ',
          {
            type: 'Link',
            content: [],
            description: 'title',
            target: 'url'
          },
          ' and ',
          {
            type: 'ImageObject',
            caption: 'title',
            content: [],
            contentUrl: 'url'
          },
          '.'
        ]
      },
      {
        type: 'QuoteBlock',
        content: [
          {
            type: 'Paragraph',
            content: ['A blockquote']
          }
        ]
      },
      {
        type: 'CodeBlock',
        value: '# A code block'
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          { type: 'Paragraph', content: ['Item one'] },
          { type: 'Paragraph', content: ['Item two'] }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          { type: 'Paragraph', content: ['First item'] },
          { type: 'Paragraph', content: ['Second item'] }
        ]
      },
      {
        type: 'ThematicBreak'
      }
    ]
  }
}

// Check that adjacent `Str` and `Space` elements are collapsed
const collapseSpaces: testCase = {
  pdoc: {
    'pandoc-api-version': Pandoc.Version,
    meta: {},
    blocks: [
      {
        t: 'Para',
        c: [
          str('One'),
          space(),
          str('two'),
          str(' three'),
          space(),
          space(),
          str('four.'),
          space(),
          { t: 'Strong', c: [str('Strong then space')] },
          space(),
          str('.')
        ]
      }
    ]
  },
  node: {
    type: 'Article',
    authors: [],
    content: [
      {
        type: 'Paragraph',
        content: [
          'One two three  four. ',
          { type: 'Strong', content: ['Strong then space'] },
          ' ',
          '.'
        ]
      }
    ]
  }
}

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
    'pandoc-api-version': Pandoc.Version,
    meta,
    blocks
  }
})
