import stencila, {
  article,
  cite,
  citeGroup,
  code,
  codeBlock,
  codeChunk,
  codeExpression,
  collection,
  creativeWork,
  datatable,
  datatableColumn,
  figure,
  heading,
  imageObject,
  link,
  organization,
  person,
  periodical,
  publicationIssue,
  softwareSourceCode,
  audioObject
} from '@stencila/schema'
import { getByText } from '@testing-library/dom'
import '@testing-library/jest-dom/extend-expect'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import * as vfile from '../../util/vfile'
import { defaultEncodeOptions } from '../types'
import { decodeHref, HTMLCodec, schemaURLs, stencilaItemProp } from './'

const doc = (innerHTML: string) =>
  new JSDOM(innerHTML).window.document.documentElement

const { encode, decode } = new HTMLCodec()

const e = async (
  node: stencila.Node,
  options = { ...defaultEncodeOptions, isStandalone: false }
) => vfile.dump(await encode(node, options))

const d = async (htmlString: string): Promise<stencila.Node> =>
  decode(vfile.load(htmlString))

test('decode', async () => {
  expect(await d(kitchenSink.html)).toEqual(kitchenSink.node)
  expect(await d(attrs.html)).toEqual(attrs.node)
  expect(await d(dt.html)).toEqual(dt.node)
})

describe('encode', () => {
  test('Encode kitchenSink', async () =>
    expect(await e(kitchenSink.node)).toEqualStringContent(
      kitchenSink.html,
      true
    ))
  test('E data-attr1="foo"code attrs', async () =>
    expect(await e(attrs.node)).toEqualStringContent(attrs.html))
  test('Encode Datatable', async () =>
    expect(await e(dt.node)).toEqualStringContent(dt.html))
})

describe('String escaping', () => {
  test('Escape HTML entities', async () => {
    expect(
      await e({ type: 'Paragraph', content: ['<em>', '<strong>'] })
    ).toEqual('<p>&lt;em&gt;&lt;strong&gt;</p>')
  })

  test('Convert HTML entities back', async () => {
    expect(await d('<p>&lt;em&gt;&lt;strong&gt;</p>')).toEqual({
      type: 'Paragraph',
      content: ['<em><strong>']
    })
  })
})

describe('Decode container elements', () => {
  test('Nested divs and spans', async () => {
    expect(
      await d(
        '<div><div><p><span><strong>Stroonnng</strong<</span></p></div></div>'
      )
    ).toEqual({
      type: 'Paragraph',
      content: [
        {
          type: 'Strong',
          content: ['Stroonnng']
        }
      ]
    })
  })
})

describe('Encode & Decode cite nodes', () => {
  const schemaNode = cite({ target: 'myTarget' })
  const htmlNode = `<cite><a href="#myTarget">myTarget</a></cite>`

  test('encode', async () => {
    const node = doc(await e(schemaNode)).querySelector('cite')

    expect(node).toBeDefined()
    expect(node?.querySelector('a')).toHaveAttribute('href', '#myTarget')
    expect(node).toHaveTextContent('myTarget')
  })

  test('decode', async () => {
    expect(await decode(vfile.load(htmlNode))).toEqual(schemaNode)
  })

  test('encode with prefix & suffix', async () => {
    const actual = doc(
      await e(cite({ target: 'myTarget', prefix: '(', suffix: ')' }))
    )
    const prefix = getByText(actual, '(')
    const suffix = getByText(actual, ')')

    expect(actual).toHaveTextContent('(myTarget)')
    expect(actual).toContainElement(prefix)
    expect(actual).toContainElement(suffix)
    expect(prefix).toHaveAttribute('itemprop', 'citePrefix')
    expect(suffix).toHaveAttribute('itemprop', 'citeSuffix')
    expect.assertions(5)
  })

  test('decode with prefix & suffix', async () => {
    const actual = await d(
      `<cite><span itemprop="citePrefix">(</span><a href="#myTarget">myTarget</a><span itemprop="citeSuffix">)</span></cite>`
    )

    expect(actual).toHaveProperty('target', 'myTarget')
    expect(actual).toHaveProperty('prefix', '(')
    expect(actual).toHaveProperty('suffix', ')')
  })
})

describe('Encode & Decode code-expression nodes', () => {
  const codeExpressionSchema = codeExpression({
    text: 'x * 2',
    output: '42',
    programmingLanguage: 'python'
  })
  const codeExpressionHTML =
    '<stencila-code-expression programming-language="python"><code slot="text">x * 2</code><output slot="output">42</output></stencila-code-expression>'

  test('encode', async () => {
    const actual = doc(await e(codeExpressionSchema))
    const code = actual.getElementsByTagName('code')[0]
    const output = actual.getElementsByTagName('output')[0]

    expect(actual).toContainElement(code)
    expect(actual).toContainElement(output)
  })

  test('decode', async () => {
    const c = await d(codeExpressionHTML)
    expect(c).toMatchObject(codeExpressionSchema)
  })
})

describe('Encode & Decode cite group nodes', () => {
  const cite1 = cite({ target: 'myFirstTarget' })
  const cite2 = cite({ target: 'mySecondTarget' })

  const schemaNode = citeGroup({ items: [cite1, cite2] })
  const htmlNode = `<span itemtype="${schemaURLs.CiteGroup}">
    <cite><a href="myFirstTarget">myFirstTarget</a></cite>
    <cite><a href="mySecondTarget">mySecondTarget</a></cite>
  </ol>`

  test('encode', async () => {
    const actual = doc(await e(schemaNode))

    expect(actual.querySelectorAll('cite')).toHaveLength(2)
    expect(actual.querySelector('span')).toHaveAttribute(
      'itemtype',
      schemaURLs.CiteGroup
    )
  })

  test('decode', async () => {
    expect(await decode(vfile.load(htmlNode))).toEqual(schemaNode)
  })
})

describe.skip('Encode & Decode references', () => {
  const schemaNode = article({
    authors: [],
    title: 'Article title',
    references: [
      creativeWork({
        title:
          'Cell flow reorients the axis of planar polarity in the wing epithelium of Drosophila',
        datePublished: '2010',
        // issueNumber: 142,
        // title: 'Cell',
        // pagination: '773-786',
        url: 'https://doi.org/10.1016/j.cell.2010.07.042',
        authors: [
          person({
            givenNames: ['B'],
            familyNames: ['Aigouy'],
            url: 'https://scholar.google.com/scholar?q=%22author:B+Aigouy%22'
          }),
          person({
            givenNames: ['R'],
            familyNames: ['Farhadifar'],
            url:
              'https://scholar.google.com/scholar?q=%22author:R+Farhadifar%22'
          })
        ]
      })
    ]
  })

  const schemaNodeCiteGroups = {
    type: 'Article',
    title: 'An example of using the CiteGroup node type',
    authors: [
      {
        type: 'Person',
        givenNames: ['Joe'],
        familyNames: ['Bloggs']
      }
    ],
    content: [
      {
        type: 'Paragraph',
        content: [
          'Citing two articles ',
          {
            type: 'CiteGroup',
            items: [
              { type: 'Cite', target: 'some-one-else-1991' },
              { type: 'Cite', target: 'updated-works-2009' },
              { type: 'Cite', target: 'https://www.fullUrl.com' }
            ]
          },
          '.'
        ]
      }
    ],
    references: [
      {
        type: 'Article',
        id: 'some-one-else-1991',
        title: 'Another article by someone else',
        authors: [
          {
            type: 'Person',
            givenNames: ['Some', 'One'],
            familyNames: ['Else']
          }
        ],
        datePublished: '1991'
      },
      {
        type: 'Article',
        id: 'update-works-2009',
        title: 'A Better Updated Work',
        authors: [
          {
            type: 'Person',
            givenNames: ['Some', 'Better'],
            familyNames: ['Person']
          }
        ],
        datePublished: '2009'
      }
    ]
  }

  const articleRefs = `<article>
  <h1 itemprop="headline">Article title</h1>

  <h2>
    References
  </h2>

  <ol class="references">
    <li
      itemtype="${schemaURLs.CreativeWork}"
      itemprop="citation"
    >
      <a
        itemprop="headline"
        href="https://doi.org/10.1016/j.cell.2010.07.042"
      >
        Cell flow reorients the axis of planar polarity in the wing epithelium
        of Drosophila
      </a>
      <div>
        <ol class="authors">
          <li
            itemtype="${schemaURLs.Person}"
            itemprop="author"
          >
            <a itemprop="url" href="https://scholar.google.com/scholar?q=%22author:B+Aigouy%22">
              <span itemprop="name" content="B Aigouy">
                <span itemprop="givenName">B</span>
                <span itemprop="familyName">Aigouy</span>
              </span>
            </a>
          </li>
          <li
            itemtype="${schemaURLs.Person}"
            itemprop="author"
          >
            <a itemprop="url" href="https://scholar.google.com/scholar?q=%22author:R+Farhadifar%22">
              <span itemprop="name" content="R Farhadifar">
                <span itemprop="givenName">R</span>
                <span itemprop="familyName">Farhadifar</span>
              </span>
            </span>
          </li>
        </ol>
      </div>
      <time itemprop="datePublished" datetime="2010">2010</time>
      <a itemprop="url" href="https://doi.org/10.1016/j.cell.2010.07.042">
        https://doi.org/10.1016/j.cell.2010.07.042
      </a>
    </li>
  </ol>
</article>
`

  test('encode', async () => {
    const actual = doc(await e(schemaNode)).querySelector(
      `[${stencilaItemProp}="references"]`
    )
    const expected = doc(articleRefs).querySelector(
      `[${stencilaItemProp}="references"]`
    )
    expect(actual!.outerHTML).toEqualStringContent(expected!.outerHTML)
  })

  test('encode - citegroup and references', async () => {
    const actual = doc(await e(schemaNodeCiteGroups)).querySelector('article')
    expect(actual!.outerHTML).toMatchSnapshot()
  })

  test('decode', async () => {
    const actual = await d(articleRefs)

    expect(actual).toMatchObject(schemaNode)
  })
})

describe('Encode & Decode figure nodes', () => {
  test('encode', async () => {
    const label = 'Image label'
    const actual = doc(
      await e(
        figure({
          content: [imageObject({ contentUrl: 'someImage' })],
          label,
          caption: [
            'This is a test image. It has a ',
            link({ content: ['link'], target: '#' })
          ]
        })
      )
    )

    const fig = actual.querySelector('figure')
    const img = actual.querySelector('img')
    const caption = actual.querySelector('figcaption')

    expect(fig).toHaveAttribute('title', label)
    expect(fig).toContainElement(img)
    expect(fig).toContainElement(caption)
    expect(caption).toHaveTextContent('This is a test image. It has a link')
  })

  test('decode', async () => {
    const schemaNode = figure({
      content: [imageObject({ contentUrl: 'someImage' })],
      caption: [
        'This is a test image. It has a ',
        link({ content: ['link'], target: '#' })
      ]
    })

    const htmlNode = `<figure><img src="someImage" /><figcaption>This is a test image. It has a <a href="#">link</a></figcaption></figure>`

    expect(await d(htmlNode)).toMatchObject(schemaNode)
  })
})

const nodes = [
  ['Article', article({ title: 'Test article' })],
  // ['Brand', brand('My Brand')],
  ['Cite', cite({ target: '#id1' })],
  [
    'CiteGroup',
    citeGroup({ items: [cite({ target: '#id1' }), cite({ target: '#id2' })] })
  ],
  ['Code', code({ text: 'a + b' })],
  ['CodeBlock', codeBlock({ text: 'a + b' })],
  ['CodeChunk', codeChunk({ text: 'a + b' })],
  ['CodeExpression', codeExpression({ text: 'a + b' })],
  ['Collection', collection({ parts: [article({ title: 'Test article' })] })],
  ['CreativeWork', creativeWork()],
  [
    'Datatable',
    datatable({ columns: [datatableColumn({ name: 'A', values: [] })] })
  ],
  ['Organization', organization({ name: 'Mega Corp' })],
  ['Periodical', periodical()],
  ['PublicationIssue', publicationIssue()],
  ['SoftwareSourceCode', softwareSourceCode()],
  ['AudioObject', audioObject({ contentUrl: '' })],
  ['Heading', heading({ content: ['Title'], depth: 1 })],
  ['ImageObject', imageObject({ contentUrl: '' })],
  ['Link', link({ content: ['link'], target: 'url' })]
  // 'Delete',
  // 'Emphasis',
  // 'Strong',
  // 'Subscript',
  // 'List',
  // 'ListItem',
  // 'Paragraph',
  // 'Quote',
  // 'QuoteBlock',
  // 'Table',
  // 'TableRow',
  // 'TableCell',
  // 'ThematicBreak',
  // 'VideoObject'
]

describe.each(nodes)(
  'Encode %s with MicroData',
  // @ts-ignore
  (schemaType: keyof typeof schemaURLs, node) => {
    test('it has itemtype', async () => {
      const actual = doc(await e(node)).querySelector('body > *')
      expect(actual).toHaveAttribute('itemtype', schemaURLs[schemaType])
    })
  }
)

describe('Encode & Decode Collections', () => {
  const schemaNode = collection({
    parts: [
      figure({
        content: [imageObject({ contentUrl: 'someImage' })],
        caption: [
          'This is a test image. It has a ',
          link({ content: ['link'], target: '#' })
        ]
      }),
      figure({
        content: [imageObject({ contentUrl: 'figure2' })]
      })
    ]
  })

  const htmlNode = `
    <ol itemtype="${schemaURLs.Collection}">
      <li>
        <figure><img src="someImage" /><figcaption>This is a test image. It has a <a href="#">link</a></figcaption></figure>
      </li>
      <li>
        <figure><img src="figure2" /></figure>
      </li>
    </ol>
  `

  test('encode', async () => {
    const actual = doc(await e(schemaNode))

    const collection = actual.querySelector('ol')
    const figures = actual.querySelectorAll('figure')

    expect(collection).toHaveAttribute('itemtype', schemaURLs.Collection)
    expect(figures).toHaveLength(2)
  })

  test('decode', async () => {
    expect(await d(htmlNode)).toMatchObject(schemaNode)
  })
})

test('encode with different themes', async () => {
  const e = async (options = defaultEncodeOptions) =>
    vfile.dump(await encode(kitchenSink.node, options))

  let html = await e({ theme: 'stencila' })
  expect(html).toMatch(
    /<script src="https:\/\/unpkg\.com\/@stencila\/thema@\d\/dist\/themes\/stencila\/index\.js/
  )
  expect(html).toMatch(
    /<link href="https:\/\/unpkg\.com\/@stencila\/thema@\d\/dist\/themes\/stencila\/styles\.css/
  )

  html = await e({ theme: 'eLife' })
  expect(html).toMatch(
    /<script src="https:\/\/unpkg\.com\/@stencila\/thema@\d\/dist\/themes\/eLife\/index\.js/
  )
  expect(html).toMatch(
    /<link href="https:\/\/unpkg\.com\/@stencila\/thema@\d\/dist\/themes\/eLife\/styles\.css/
  )
})

test('encode with bundling', async () => {
  const e = async (options = defaultEncodeOptions) =>
    vfile.dump(await encode(kitchenSink.node, options))

  const stylesheet = fs.readFileSync(
    require.resolve('@stencila/thema/dist/themes/eLife/styles.css'),
    'utf8'
  )

  const js = fs.readFileSync(
    require.resolve('@stencila/thema/dist/themes/eLife/index.js'),
    'utf8'
  )

  // Match for first line of CSS and Javascript since beautify
  // affects indentation.
  // Previously we used a snapshot for this but that is avoided
  // here since it will fail when Thema is upgraded.
  let html = await e({ theme: 'eLife', isBundle: true })
  expect(html).toMatch(stylesheet.trim().split('\n')[1])
  expect(html).toMatch(js.trim().split('\n')[1])
})

test('encode add heading ids', async () => {
  expect(
    doc(
      await e({
        type: 'Heading',
        depth: 1,
        content: ['One']
      })
    ).querySelector('h1')?.id
  ).toBe('one')

  expect(
    doc(
      await e({
        type: 'Heading',
        depth: 2,
        content: ['foo 123 $#% 🐶 bar']
      })
    ).querySelector('h2')?.id
  ).toEqual('foo-123---bar')

  const headingItems = doc(
    await e({
      type: 'Article',
      title: 'Test',
      content: [
        {
          type: 'Heading',
          depth: 1,
          content: ['duplicated']
        },
        {
          type: 'Heading',
          depth: 1,
          content: ['duplicated']
        }
      ]
    })
  ).querySelectorAll('h1')

  const ids: string[] = []

  headingItems.forEach(item => {
    if (item.id) {
      ids.push(item.id)
    }
  })

  expect(ids).toEqual(expect.arrayContaining(['duplicated', 'duplicated-1']))
})

describe('handle decoding HTML comments', () => {
  const html = `<p>
      A paragraph with
      <!-- <span itemtype="https://schema.stenci.la/Object">{a:1,b:'two'}</span> -->
      a nested comment
    </p>`

  const schema = {
    type: 'Paragraph',
    content: ['A paragraph with ', 'a nested comment']
  }

  // test('encode', async () => {
  //   expect(await e(schema)).toEqualStringContent(html)
  // })

  test('decode', async () => {
    expect(await d(html)).toMatchObject(schema)
  })
})

// An example intended for testing progressively added decoder/encoder pairs
const kitchenSink = {
  html: `<article itemtype="${schemaURLs.Article}" itemscope="true">
    <h1 itemtype="${schemaURLs.Heading}" itemprop="headline">Article title</h1>
    <h1
      id="heading-one"
      itemtype="${schemaURLs.Heading}">Heading one</h1>
    <h2
      id="heading-two"
      itemtype="${schemaURLs.Heading}">Heading two</h2>
    <h3
      id="heading-three"
      itemtype="${schemaURLs.Heading}">Heading three</h3>
    <p>
      A paragraph with <em>emphasis</em>, <strong>strong</strong>,
      <del>delete</del>.
    </p>
    <p>
      A paragraph with
      <a
        href="https://example.org"
        data-attr="foo"
        itemtype="${schemaURLs.Link}">a <em>rich</em> link</a>.
    </p>
    <p>A paragraph with <q cite="https://example.org">quote</q>.</p>
    <p>
      A paragraph with
      <code
        class="language-python"
        itemtype="${schemaURLs.Code}"># code</code>.
    </p>
    <p>
      A paragraph with an image
      <img
        src="https://example.org/image.png"
        title="title"
        alt="alt text"
        itemtype="${schemaURLs.ImageObject}"
        itemprop="image">.
    </p>
    <p>
      Paragraph with a
      <span itemtype="${schemaURLs.BooleanValidator}">true</span>
      and a
      <span itemtype="${schemaURLs.BooleanValidator}">false</span>.
    </p>
    <p>
      A paragraph with other data: a
      <span itemtype="https://schema.stenci.la/Null">null</span>,
      a
      <span itemtype="${schemaURLs.NumberValidator}">3.14</span>, and a
      <span itemtype="${schemaURLs.ArrayValidator}">[1,2]</span>.
    </p>
    <blockquote cite="https://example.org">A blockquote</blockquote>
    <pre itemtype="${schemaURLs.CodeBlock}"><code class="language-r" itemtype="${schemaURLs.Code}"># Some code
x = c(1,2)</code></pre>
    <pre itemtype="${schemaURLs.CodeBlock}"><code class="language-js" itemtype="${schemaURLs.Code}">// Test for html character escaping. See note at https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
      const inc = (n) =&gt; n + 1</code></pre>
    <ul>
      <li>One</li>
      <li>Two</li>
      <li>Three</li>
    </ul>
    <ol>
      <li>First</li>
      <li>Second</li>
      <li>Third</li>
    </ol>
    <table>
      <tbody>
        <tr>
          <td>A</td>
          <td>B</td>
          <td>C</td>
        </tr>
        <tr>
          <td>1</td>
          <td>2</td>
          <td>3</td>
        </tr>
        <tr>
          <td>4</td>
          <td>5</td>
          <td>6</td>
        </tr>
      </tbody>
    </table>
    <hr>
  </article>`,

  node: {
    type: 'Article',
    title: 'Article title',
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
        type: 'Heading',
        depth: 3,
        content: ['Heading three']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          {
            type: 'Emphasis',
            content: ['emphasis']
          },
          ', ',
          {
            type: 'Strong',
            content: ['strong']
          },
          ', ',
          {
            type: 'Delete',
            content: ['delete']
          },
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          {
            type: 'Link',
            target: 'https://example.org',
            meta: {
              attr: 'foo'
            },
            content: [
              'a ',
              {
                type: 'Emphasis',
                content: ['rich']
              },
              ' link'
            ]
          },
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          {
            type: 'Quote',
            cite: 'https://example.org',
            content: ['quote']
          },
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          {
            type: 'CodeFragment',
            programmingLanguage: 'python',
            text: '# code'
          },
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with an image ',
          {
            type: 'ImageObject',
            contentUrl: 'https://example.org/image.png',
            title: 'title',
            text: 'alt text'
          },
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: ['Paragraph with a ', true, ' and a ', false, '.']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with other data: a ',
          null,
          ', a ',
          3.14,
          ', and a ',
          [1, 2],
          '.'
        ]
      },
      {
        type: 'QuoteBlock',
        cite: 'https://example.org',
        content: ['A blockquote']
      },
      {
        type: 'CodeBlock',
        programmingLanguage: 'r',
        text: '# Some code\nx = c(1,2)'
      },
      {
        type: 'CodeBlock',
        programmingLanguage: 'js',
        text:
          '// Test for html character escaping. See note at https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML\n      const inc = (n) => n + 1'
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          { type: 'ListItem', content: ['One'] },
          { type: 'ListItem', content: ['Two'] },
          { type: 'ListItem', content: ['Three'] }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          { type: 'ListItem', content: ['First'] },
          { type: 'ListItem', content: ['Second'] },
          { type: 'ListItem', content: ['Third'] }
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

/**
 * Example for testing attributes on
 * `Link`, `CodeFragment` and `CodeBlock` nodes.
 */
const attrs = {
  html: `<p>A <a href="url" data-attr1="foo" data-attr2="bar baz" data-attr3="" itemtype="${schemaURLs.Link}">link</a> and
    <code itemtype="https://schema.org/Code" data-attr1="foo">da code</code>.</p>`,
  node: {
    type: 'Paragraph',
    content: [
      'A ',
      {
        type: 'Link',
        target: 'url',
        meta: {
          attr1: 'foo',
          attr2: 'bar baz',
          attr3: ''
        },
        content: ['link']
      },
      ' and ',
      {
        type: 'CodeFragment',
        meta: {
          attr1: 'foo'
        },
        text: 'da code'
      },
      '.'
    ]
  }
}

/**
 * Example for testing encoding/decoding of `Datatable` nodes
 */
const dtNode: stencila.Datatable = {
  type: 'Datatable',
  columns: [
    {
      type: 'DatatableColumn',
      name: 'A',
      values: ['1', '2', '3']
    },
    {
      type: 'DatatableColumn',
      name: 'B',
      values: ['4', '5', '6']
    }
  ]
}
const dt = {
  html: `<div itemtype="${schemaURLs.Datatable}">
  <table>
    <thead>
      <tr>
        <th>A</th>
        <th>B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>4</td>
      </tr>
      <tr>
        <td>2</td>
        <td>5</td>
      </tr>
      <tr>
        <td>3</td>
        <td>6</td>
      </tr>
    </tbody>
  </table>
</div>`,
  node: dtNode
}

describe('encode/decode href attributes', () => {
  describe('decode', () => {
    test('an href pointing to a website returns the full link', () => {
      const url = 'http://stencil.la'
      expect(decodeHref(url)).toBe(url)
    })

    test('an href pointing to a website starting with www returns the full link', () => {
      const url = 'www.stencil.la'
      expect(decodeHref(url)).toBe(url)
    })

    test('an href pointing to a website starting with www returns the full link', () => {
      const url = 'www.stencil.la'
      expect(decodeHref(url)).toBe(url)
    })

    test('an anchor link with a target returns just the target value', () => {
      expect(decodeHref('#someTarget')).toBe('someTarget')
    })

    test('an anchor link without a target returns just the id', () => {
      expect(decodeHref('#')).toBe('')
    })
  })
})
