import stencila, {
  article,
  cite,
  citeGroup,
  collection,
  creativeWork,
  figure,
  imageObject,
  link,
  person
} from '@stencila/schema'
import { getByText } from '@testing-library/dom'
import '@testing-library/jest-dom/extend-expect'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import * as vfile from '../../util/vfile'
import { defaultEncodeOptions } from '../types'
import { HTMLCodec, decodeHref } from './'

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
    expect(await e(kitchenSink.node)).toEqual(kitchenSink.html))
  test('Encode attrs', async () =>
    expect(await e(attrs.node)).toEqual(attrs.html))
  test('Encode Datatable', async () =>
    expect(await e(dt.node)).toEqual(dt.html))
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

describe('Encode & Decode cite nodes', () => {
  const schemaNode = cite('myTarget')
  const htmlNode = `<cite><a href="#myTarget">myTarget</a></cite>`

  test('encode', async () => {
    expect(await e(schemaNode)).toEqual(htmlNode)
  })

  test('decode', async () => {
    expect(await decode(vfile.load(htmlNode))).toEqual(schemaNode)
  })

  test('encode with prefix & suffix', async () => {
    const actual = doc(await e(cite('myTarget', { prefix: '(', suffix: ')' })))
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

describe('Encode & Decode cite group nodes', () => {
  const cite1 = cite('myFirstTarget')
  const cite2 = cite('mySecondTarget')

  const schemaNode = citeGroup([cite1, cite2])
  const htmlNode = `<span itemtype="https://schema.stenci.la/CiteGroup">
    <cite><a href="myFirstTarget">myFirstTarget</a></cite>
    <cite><a href="mySecondTarget">mySecondTarget</a></cite>
  </ol>`

  test('encode', async () => {
    const actual = doc(await e(schemaNode))

    expect(actual.querySelectorAll('cite')).toHaveLength(2)
    expect(actual.querySelector('span')).toHaveAttribute(
      'itemtype',
      'https://schema.stenci.la/CiteGroup'
    )
  })

  test('decode', async () => {
    expect(await decode(vfile.load(htmlNode))).toEqual(schemaNode)
  })
})

describe('Encode & Decode references', () => {
  const schemaNode = article([], 'Article title', {
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
      itemtype="https://schema.org/CreativeWork"
      itemscope="true"
      itemprop="citation"
    >
      <a
        itemprop="headline"
        href="https://doi.org/10.1016/j.cell.2010.07.042"
      >
        Cell flow reorients the axis of planar polarity in the wing epithelium
        of Drosophila
      </a>
      <ol class="authors">
        <li
          itemtype="https://schema.org/Person"
          itemscope="true"
          itemprop="author"
        >
          <a href="https://scholar.google.com/scholar?q=%22author:B+Aigouy%22">
            <span itemprop="familyName">Aigouy</span>
            <span itemprop="givenName">B</span>
          </a>
        </li>
        <li
          itemtype="https://schema.org/Person"
          itemscope="true"
          itemprop="author"
        >
          <a
            href="https://scholar.google.com/scholar?q=%22author:R+Farhadifar%22"
          >
            <span itemprop="familyName">Farhadifar</span>
            <span itemprop="givenName">R</span>
          </a>
        </li>
      </ol>
      <time itemprop="datePublished" datetime="2010">2010</time>
      <a itemprop="url" href="https://doi.org/10.1016/j.cell.2010.07.042">
        https://doi.org/10.1016/j.cell.2010.07.042
      </a>
    </li>
  </ol>
</article>
`

  test('encode', async () => {
    const actual = doc(await e(schemaNode)).querySelector('.references')
    const expected = doc(articleRefs).querySelector('.references')
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
          content: [imageObject('someImage')],
          label,
          caption: ['This is a test image. It has a ', link(['link'], '#')]
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
      content: [imageObject('someImage')],
      caption: ['This is a test image. It has a ', link(['link'], '#')]
    })

    const htmlNode = `<figure><img src="someImage" /><figcaption>This is a test image. It has a <a href="#">link</a></figcaption></figure>`

    expect(await d(htmlNode)).toMatchObject(schemaNode)
  })
})

describe('Encode & Decode Collections', () => {
  const schemaNode = collection([
    figure({
      content: [imageObject('someImage')],
      caption: ['This is a test image. It has a ', link(['link'], '#')]
    }),
    figure({
      content: [imageObject('figure2')]
    })
  ])

  const htmlNode = `
    <ol itemtype="https://schema.org/Collection">
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

    expect(collection).toHaveAttribute(
      'itemtype',
      'https://schema.org/Collection'
    )
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
    /<script src="https:\/\/unpkg\.com\/@stencila\/thema@\d\.\d\.\d\/dist\/themes\/stencila\/index\.js/
  )
  expect(html).toMatch(
    /<link href="https:\/\/unpkg\.com\/@stencila\/thema@\d\.\d\.\d\/dist\/themes\/stencila\/styles\.css/
  )

  html = await e({ theme: 'eLife' })
  expect(html).toMatch(
    /<script src="https:\/\/unpkg\.com\/@stencila\/thema@\d\.\d\.\d\/dist\/themes\/eLife\/index\.js/
  )
  expect(html).toMatch(
    /<link href="https:\/\/unpkg\.com\/@stencila\/thema@\d\.\d\.\d\/dist\/themes\/eLife\/styles\.css/
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
    await e({
      type: 'Heading',
      depth: 1,
      content: ['One']
    })
  ).toBe('<h1 id="one">One</h1>')

  expect(
    await e({
      type: 'Heading',
      depth: 2,
      content: ['foo 123 $#% 🐶 bar']
    })
  ).toEqual('<h2 id="foo-123---bar">foo 123 $#% 🐶 bar</h2>')

  expect(
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
  ).toBe(`<article itemtype="https://schema.org/Article" itemscope="true">
  <h1 itemprop="headline">Test</h1>
  <h1 id="duplicated">duplicated</h1>
  <h1 id="duplicated-1">duplicated</h1>
</article>`)
})

// An example intended for testing progressively added decoder/encoder pairs
const kitchenSink = {
  html: `<article itemtype="https://schema.org/Article" itemscope="true">
  <h1 itemprop="headline">Article title</h1>
  <h1 id="heading-one">Heading one</h1>
  <h2 id="heading-two">Heading two</h2>
  <h3 id="heading-three">Heading three</h3>
  <p>A paragraph with <em>emphasis</em>, <strong>strong</strong>, <del>delete</del>.</p>
  <p>A paragraph with <a href="https://example.org" data-attr="foo">a <em>rich</em> link</a>.</p>
  <p>A paragraph with <q cite="https://example.org">quote</q>.</p>
  <p>A paragraph with <code class="language-python"># code</code>.</p>
  <p>A paragraph with an image <img src="https://example.org/image.png" title="title"
      alt="alt text">.</p>
  <p>Paragraph with a <span itemtype="https://schema.org/Boolean">true</span> and a <span
      itemtype="https://schema.org/Boolean">false</span>.</p>
  <p>A paragraph with other data: a <span itemtype="https://schema.stenci.la/Null">null</span>, a
    <span itemtype="https://schema.org/Number">3.14</span>, and a <span
      itemtype="https://schema.stenci.la/Array">[1,2]</span>.</p>
  <p>A paragraph with an <span itemtype="https://schema.stenci.la/Object">{a:1,b:'two'}</span> and a
    <span itemtype="https://schema.stenci.la/Entity">{type:'Person'}</span>.</p>
  <blockquote cite="https://example.org">A blockquote</blockquote>
  <pre><code class="language-r"># Some code
x = c(1,2)</code></pre>
  <pre><code class="language-js">// Test for html character escaping. See note at https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
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
    authors: [],
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
            type: 'Code',
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
        type: 'Paragraph',
        content: [
          'A paragraph with an ',
          { a: 1, b: 'two' },
          ' and a ',
          { type: 'Person' },
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
          '// Test for html character escaping. See note at https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML\nconst inc = (n) => n + 1'
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
 * `Link`, `Code` and `CodeBlock` nodes.
 */
const attrs = {
  html: `<p>A <a href=\"url\" data-attr1=\"foo\" data-attr2=\"bar baz\" data-attr3=\"\">link</a> and <code
    data-attr1="foo">da code</code>.</p>`,
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
        type: 'Code',
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
  html: `<div itemtype="https://schema.stenci.la/Datatable">
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
