import stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import { dump, load } from '../../util/vfile'
import { RPNGCodec } from '../rpng'
import { decodeMeta, emptyAttrs, encodeMeta, PandocCodec } from './'
import * as P from './types'

const { decode, encode } = new PandocCodec()
const rpng = new RPNGCodec()

// Set a high timeout to avoid occasional failures on CI
jest.setTimeout(60 * 1000)

test('decode', async () => {
  const p = async (pdoc: any) => await decode(load(JSON.stringify(pdoc)))

  let got = await p(kitchenSink.pdoc)
  expect(got).toEqual(kitchenSink.node)

  expect(await p(collapseSpaces.pdoc)).toEqual(collapseSpaces.node)
  expect(await p(imageInlinesToString.pdoc)).toEqual(imageInlinesToString.node)
})

test('encode', async () => {
  const u = async (node: any) => JSON.parse(await dump(await encode(node)))

  let got = await u(kitchenSink.node)
  expect(got).toEqual(kitchenSink.pdoc)
})

test('metadata', async () => {
  const meta = {
    null: null,
    boolean: false,
    number: 3.14,
    array: [1, 2, 3],
    object: { a: true, b: 'two' },
    inlines: {
      type: 'Paragraph',
      content: ['Hello']
    },
    blocks: {
      type: 'QuoteBlock',
      content: [
        {
          type: 'Paragraph',
          content: ['World']
        }
      ]
    }
  }
  const pmeta: P.Meta = {
    null: { t: 'MetaString', c: '!!null' },
    boolean: { t: 'MetaBool', c: false },
    number: { t: 'MetaString', c: '!!number 3.14' },
    array: {
      t: 'MetaList',
      c: [
        {
          c: '!!number 1',
          t: 'MetaString'
        },
        {
          c: '!!number 2',
          t: 'MetaString'
        },
        {
          c: '!!number 3',
          t: 'MetaString'
        }
      ]
    },
    object: {
      t: 'MetaMap',
      c: {
        a: {
          c: true,
          t: 'MetaBool'
        },
        b: {
          c: 'two',
          t: 'MetaString'
        }
      }
    },
    inlines: {
      t: 'MetaInlines',
      c: [{ t: 'Str', c: 'Hello' }]
    },
    blocks: {
      t: 'MetaBlocks',
      c: [{ t: 'Para', c: [{ t: 'Str', c: 'World' }] }]
    }
  }

  const encoded = await encodeMeta(meta)
  const decoded = await decodeMeta(pmeta)

  expect(encoded).toEqual(pmeta)
  expect(decoded).toEqual(meta)
})

interface testCase {
  pdoc: P.Document
  node: stencila.Article
}

// Shorthands for creating Pandoc elements
const str = (str: string): P.Str => ({ t: 'Str', c: str })
const space = (): P.Space => ({ t: 'Space', c: undefined })

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
      references: {
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
            c: [{ t: P.QuoteType.SingleQuote }, [str('quote')]]
          },
          str(' and '),
          { t: 'Code', c: [['', ['r'], []], 'code'] },
          str(' and '),
          { t: 'Link', c: [emptyAttrs, [], ['url', 'title']] },
          str(' and '),
          {
            t: 'Image',
            c: [
              emptyAttrs,
              [str('alt text')],
              ['http://example.org/image.png', 'title']
            ]
          },
          str('.')
        ]
      },
      {
        t: 'BlockQuote',
        c: [{ t: 'Para', c: [str('A blockquote')] }]
      },
      {
        t: 'CodeBlock',
        c: [['', ['python'], []], '# A code block']
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
            { t: P.ListNumberStyle.DefaultStyle },
            { t: P.ListNumberDelim.DefaultDelim }
          ],
          [
            [{ t: 'Para', c: [str('First item')] }],
            [{ t: 'Para', c: [str('Second item')] }]
          ]
        ]
      },
      {
        t: 'Table',
        c: [
          [],
          [
            {
              t: P.Alignment.AlignDefault
            },
            {
              t: P.Alignment.AlignDefault
            },
            {
              t: P.Alignment.AlignDefault
            }
          ],
          [0, 0, 0],
          [
            [{ t: 'Para', c: [{ t: 'Str', c: 'A' }] }],
            [{ t: 'Para', c: [{ t: 'Str', c: 'B' }] }],
            [{ t: 'Para', c: [{ t: 'Str', c: 'C' }] }]
          ],
          [
            [
              [{ t: 'Para', c: [{ t: 'Str', c: '1' }] }],
              [{ t: 'Para', c: [{ t: 'Str', c: '2' }] }],
              [{ t: 'Para', c: [{ t: 'Str', c: '3' }] }]
            ],
            [
              [{ t: 'Para', c: [{ t: 'Str', c: '4' }] }],
              [{ t: 'Para', c: [{ t: 'Str', c: '5' }] }],
              [{ t: 'Para', c: [{ t: 'Str', c: '6' }] }]
            ]
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
    references: [],
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
          { type: 'Code', programmingLanguage: 'r', value: 'code' },
          ' and ',
          {
            type: 'Link',
            content: [],
            title: 'title',
            target: 'url'
          },
          ' and ',
          {
            type: 'ImageObject',
            contentUrl: 'http://example.org/image.png',
            title: 'title',
            text: 'alt text'
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
        programmingLanguage: 'python',
        value: '# A code block'
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            type: 'ListItem',
            content: [{ type: 'Paragraph', content: ['Item one'] }]
          },
          {
            type: 'ListItem',
            content: [{ type: 'Paragraph', content: ['Item two'] }]
          }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          {
            type: 'ListItem',
            content: [{ type: 'Paragraph', content: ['First item'] }]
          },
          {
            type: 'ListItem',
            content: [{ type: 'Paragraph', content: ['Second item'] }]
          }
        ]
      },
      {
        type: 'Table',
        rows: [
          {
            type: 'TableRow',
            cells: [
              {
                content: ['A'],
                type: 'TableCell'
              },
              {
                content: ['B'],
                type: 'TableCell'
              },
              {
                content: ['C'],
                type: 'TableCell'
              }
            ]
          },
          {
            type: 'TableRow',
            cells: [
              {
                content: ['1'],
                type: 'TableCell'
              },
              {
                content: ['2'],
                type: 'TableCell'
              },
              {
                content: ['3'],
                type: 'TableCell'
              }
            ]
          },
          {
            type: 'TableRow',
            cells: [
              {
                content: ['4'],
                type: 'TableCell'
              },
              {
                content: ['5'],
                type: 'TableCell'
              },
              {
                content: ['6'],
                type: 'TableCell'
              }
            ]
          }
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
    'pandoc-api-version': P.Version,
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
    title: 'Untitled',
    authors: [],
    content: [
      {
        type: 'Paragraph',
        content: [
          'One two three  four. ',
          { type: 'Strong', content: ['Strong then space'] },
          ' .'
        ]
      }
    ]
  }
}

// Test that where necessary Pandoc inline nodes are decoded to strings
const imageInlinesToString: testCase = {
  pdoc: {
    'pandoc-api-version': P.Version,
    meta: {},
    blocks: [
      {
        t: 'Para',
        c: [
          {
            t: 'Image',
            c: [
              emptyAttrs,
              [
                {
                  t: 'Emph',
                  c: [str('emphasis')]
                },
                {
                  t: 'Space',
                  c: undefined
                },
                {
                  t: 'Strong',
                  c: [str('strong')]
                },
                {
                  t: 'Space',
                  c: undefined
                },
                {
                  t: 'Quoted',
                  c: [{ t: P.QuoteType.SingleQuote }, [str('quoted')]]
                }
              ],
              ['http://example.org/image.png', 'title']
            ]
          }
        ]
      }
    ]
  },
  node: {
    type: 'Article',
    title: 'Untitled',
    authors: [],
    content: [
      {
        type: 'Paragraph',
        content: [
          {
            type: 'ImageObject',
            contentUrl: 'http://example.org/image.png',
            title: 'title',
            text: 'emphasis strong quoted'
          }
        ]
      }
    ]
  }
}

describe('rPNG encoding & decoding of "special" node types', () => {
  const output = path.join(__dirname, '__outputs__', 'pandoc-rpngs')
  fs.ensureDirSync(output)

  const nodeMap = {
    null: null,
    boolean: false,
    number: 3.14,
    array: [1, 2, 3],
    object: { a: 1, b: 'two' },
    Thing: { type: 'Thing', name: 'thing' },
    Person: { type: 'Person', givenNames: ['John'] }
  }

  const pdoc = (rPNG: P.Target): P.Document => ({
    'pandoc-api-version': P.Version,
    meta: {},
    blocks: [
      {
        t: 'Para',
        c: [
          str('A paragraph with primitives: a null '),
          { t: 'Image', c: [emptyAttrs, [], rPNG] },
          str('.')
        ]
      }
    ]
  })

  const rPNGNode = (node: stencila.Node): stencila.Node => ({
    type: 'Article',
    title: 'Untitled',
    authors: [],
    content: [
      {
        type: 'Paragraph',
        content: ['A paragraph with primitives: a null ', node, '.']
      }
    ]
  })

  test.each<any>(Object.entries(nodeMap))(
    'decode: %s',
    async (name: string, value: stencila.Node, done: jest.DoneCallback) => {
      const rPNG = await rpng.encode(value, {
        filePath: path.join(output, `${name}.png`)
      })

      const expected = rPNGNode(value)

      const actual = await decode(
        load(JSON.stringify(pdoc([rPNG.path!, name])))
      )

      expect(actual).toEqual(expected)
      done()
    }
  )

  // Skipping this until resolve how to deal with output RPNG paths
  test.skip('decode', () => {
    // expect(JSON.parse(await dump(await encode(node)))).toEqual(pdoc)
  })
})

// A very simple test of the approach to typing Pandoc nodes
test('types', () => {
  const str: P.Str = {
    t: 'Str',
    c: 'A string'
  }

  let para: P.Para = {
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

  const meta: P.Meta = {
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

  const blocks: P.Block[] = [
    para,
    {
      t: 'BlockQuote',
      c: []
    }
    // Should create error: Type '"Str"' is not assignable to type '"Para" ...
    // {t: 'Str'}
  ]

  const doc: P.Document = {
    'pandoc-api-version': P.Version,
    meta,
    blocks
  }
})
