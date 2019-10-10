import stencila, {
  article,
  cite,
  heading,
  imageObject,
  link,
  paragraph
} from '@stencila/schema'
import { dump, load } from '../../util/vfile'
import { MdCodec } from './'

const { decode, encode } = new MdCodec()

describe('decode', () => {
  const d = async (md: string) => await decode(await load(md))

  test('Kitchen Sink', async () => {
    expect(await d(kitchenSink.md)).toEqual(kitchenSink.node)
  })

  test('Attributes', async () => {
    expect(await d(attrs.md)).toEqual(attrs.node)
  })

  test('Subscript and superscripts', async () => {
    expect(await d(subSuper.md)).toEqual(subSuper.node)
  })

  test('Split Paragraphs', async () => {
    expect(await d(splitParas.from)).toEqual(splitParas.node)
  })

  test('References', async () => {
    expect(await d(references.from)).toEqual(references.node)
  })

  test('Nested HTML in MD', async () => {
    expect(
      await d(`# Heading 1

some paragraphs

<a href="#">My link</a>

followed by more paragraphs`)
    ).toEqual(
      article([], 'Untitled', {
        content: [
          heading(['Heading 1'], 1),
          paragraph(['some paragraphs']),
          paragraph([link(['My link'], '#')]),
          paragraph(['followed by more paragraphs'])
        ]
      })
    )
  })

  test.skip('Nested HTML in MD with mixed inline content', async () => {
    // TODO: Reinstate this test
    expect(
      await d(`some paragraphs

An inline element in MD <img src="#" /><img src="#2" />, like this image

followed by more paragraphs`)
    ).toEqual(
      article([], 'Untitled', {
        content: [
          paragraph(['some paragraphs']),
          paragraph([
            'An inline element in MD ',
            imageObject('#'),
            imageObject('#2'),
            ', like this image'
          ]),
          paragraph(['followed by more paragraphs'])
        ]
      })
    )
  })

  test('Nested HTML in MD with nested HTML tags', async () => {
    const actual = await d(`some paragraphs

<div>

<p>
With some nested HTML, and a <cite><a href="#like-this">like-this</a></cite>
</p>

</div>

followed by more paragraphs`)

    expect(actual).toEqual(
      article([], 'Untitled', {
        content: [
          paragraph(['some paragraphs']),
          paragraph(['With some nested HTML, and a ', cite('like-this')]),
          paragraph(['followed by more paragraphs'])
        ]
      })
    )
  })

  test('Nested HTML in MD with irregular white space between HTML tags', async () => {
    const actual = await d(`some paragraphs

<div>
<div>

<div>

<p>
With some nested HTML, and a <cite><a href="#like-this">like-this</a></cite></p>

</div>

</div>

</div>

followed by more paragraphs`)

    expect(actual).toEqual(
      article([], 'Untitled', {
        content: [
          paragraph(['some paragraphs']),
          paragraph(['With some nested HTML, and a ', cite('like-this')]),
          paragraph(['followed by more paragraphs'])
        ]
      })
    )
  })

  test('Nested HTML in MD with more MD between HTML blocks', async () => {
    const actual = await d(`some paragraphs

<div>
<div>

<div>

<p>With some nested HTML, and a <cite><a href="#like-this">like-this</a></cite></p>

</div>

</div>

</div>

followed by more paragraphs

<div>

<p>
And now more HTML, and a <cite><a href="#like-this-two">like-this-two</a></cite>
</p>

</div>`)

    expect(actual).toEqual(
      article([], 'Untitled', {
        content: [
          paragraph(['some paragraphs']),
          paragraph(['With some nested HTML, and a ', cite('like-this')]),
          paragraph(['followed by more paragraphs']),
          paragraph(['And now more HTML, and a ', cite('like-this-two')])
        ]
      })
    )
  })

  // We currently do not support handling Markdown within HTML
  test.skip('Nested HTML in MD with intermixed MD and HTML', async () => {
    const actual = await d(`some paragraphs

<div>

An inline element in MD <img src="#" />, like this image <img src="#2" />

</div>

followed by more paragraphs`)

    expect(actual).toEqual(
      article([], 'Untitled', {
        content: [
          paragraph(['some paragraphs']),
          paragraph([
            'An inline element in MD ',
            imageObject('#'),
            ', like this image ',
            imageObject('#2')
          ]),
          paragraph(['followed by more paragraphs'])
        ]
      })
    )
  })
})

describe('encode', () => {
  const e = async (node: stencila.Node) => await dump(await encode(node))

  test('Kitchen Sink', async () => {
    expect(await e(kitchenSink.node)).toEqual(kitchenSink.md)
  })

  test('Attributes', async () => {
    expect(await e(attrs.node)).toEqual(attrs.md)
  })

  test('Subscript and superscripts', async () => {
    expect(await e(subSuper.node)).toEqual(subSuper.md)
  })

  test('Split Paragraphs', async () => {
    expect(await e(emptyParas.node)).toEqual(emptyParas.to)
  })

  test('References', async () => {
    expect(await e(references.node)).toEqual(references.to)
  })

  it('Strip newlines from tables', async () => {
    const table = {
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
              content: ['Some content\n split accross multiple rows'],
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
              type: 'TableCell',
              content: ['Some content\n split\naccross\nmultiple\nrows']
            },
            {
              content: ['6'],
              type: 'TableCell'
            }
          ]
        }
      ]
    }

    const expected = `| A   | B                                        | C   |
| --- | ---------------------------------------- | --- |
| 1   | Some content split accross multiple rows | 3   |
| 4   | Some content split accross multiple rows | 6   |`

    expect(await e(table)).toEqual(expected)
  })
})

// An example intended for testing progressively added decoder/encoder pairs
const kitchenSink = {
  // Note: for bidi conversion, we're using expanded YAML frontmatter,
  // but most authors are likely to prefer using shorter variants e.g.
  //   - Joe James <joe@example.com>
  //   - Dr Jill Jones PhD
  // See other examples for this

  md: `---
title: Our article
authors:
  - type: Person
    givenNames:
      - Joe
    familyNames:
      - James
    emails:
      - joe@example.com
  - type: Person
    honorificPrefix: Dr
    givenNames:
      - Jill
    familyNames:
      - Jones
    honorificSuffix: PhD
---

# Heading one

## Heading two

### Heading three

A paragraph with _emphasis_, **strong**, ~~delete~~ and \`code\`.

A paragraph with [a _rich_ link](https://example.org).

A paragraph with !quote[quote](https://example.org).

A paragraph with an image ![alt text](https://example.org/image.png "title").

A paragraph with !true and !false boolean values.

A paragraph with a !null, a !number(42.2), an !array(1,2), and an !object(a:'1',b:'two').

> A block quote

\`\`\`python meta1 meta2=foo meta3="bar baz" meta4=qux
# A code block
x = {}
\`\`\`

chunk:
:::
\`\`\`r
# A code chunk
ans = 42
\`\`\`

!number(42)

* * *

'And some text output!'

* * *

This is some longer output,

it has lots of lines.

* * *

Unquoted text.
:::

Basic code output \`some_var\`{type=expr lang=python output=43}

Fancy JSON output \`some_object\`{type=expr lang=python output="{\\"type\\":\\"Paragraph\\",\\"content\\":[\\"This was generated from code!\\"]}"}

No output \`a = 1 + 1\`{type=expr lang=python}

-   Unordered list item one
-   Unordered list item two
-   Unordered list item three

1.  Ordered list item one
2.  Ordered list item two
3.  Ordered list item three

-   [ ] First item
-   [x] Done
-   [ ] Not done

1.  [ ] One
2.  [x] Two
3.  [ ] Three

| A   | B   | C   |
| --- | --- | --- |
| 1   | 2   | 3   |
| 4   | 5   | 6   |

* * *
`,
  node: {
    type: 'Article',
    title: 'Our article',
    authors: [
      {
        type: 'Person',
        givenNames: ['Joe'],
        familyNames: ['James'],
        emails: ['joe@example.com']
      },
      {
        type: 'Person',
        honorificPrefix: 'Dr',
        givenNames: ['Jill'],
        familyNames: ['Jones'],
        honorificSuffix: 'PhD'
      }
    ],
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
          ' and ',
          {
            type: 'CodeFragment',
            text: 'code'
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
        content: ['A paragraph with ', true, ' and ', false, ' boolean values.']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with a ',
          null,
          ', a ',
          42.2,
          ', an ',
          [1, 2],
          ', and an ',
          { a: '1', b: 'two' },
          '.'
        ]
      },
      {
        type: 'QuoteBlock',
        content: [
          {
            type: 'Paragraph',
            content: ['A block quote']
          }
        ]
      },
      {
        type: 'CodeBlock',
        programmingLanguage: 'python',
        meta: {
          meta1: '',
          meta2: 'foo',
          meta3: 'bar baz',
          meta4: 'qux'
        },
        text: '# A code block\nx = {}'
      },
      {
        type: 'CodeChunk',
        meta: undefined,
        programmingLanguage: 'r',
        text: '# A code chunk\nans = 42',
        outputs: [
          42,
          "'And some text output!'",
          [
            { type: 'Paragraph', content: ['This is some longer output,'] },
            { type: 'Paragraph', content: ['it has lots of lines.'] }
          ],
          'Unquoted text.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'Basic code output ',
          {
            type: 'CodeExpression',
            programmingLanguage: 'python',
            text: 'some_var',
            output: 43
          }
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'Fancy JSON output ',
          {
            type: 'CodeExpression',
            programmingLanguage: 'python',
            text: 'some_object',
            output: {
              type: 'Paragraph',
              content: ['This was generated from code!']
            }
          }
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'No output ',
          {
            type: 'CodeExpression',
            programmingLanguage: 'python',
            text: 'a = 1 + 1'
          }
        ]
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Unordered list item one']
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Unordered list item two']
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Unordered list item three']
              }
            ]
          }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Ordered list item one']
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Ordered list item two']
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Ordered list item three']
              }
            ]
          }
        ]
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            type: 'ListItem',
            checked: false,
            content: [
              {
                type: 'Paragraph',
                content: ['First item']
              }
            ]
          },
          {
            type: 'ListItem',
            checked: true,
            content: [
              {
                type: 'Paragraph',
                content: ['Done']
              }
            ]
          },
          {
            type: 'ListItem',
            checked: false,
            content: [
              {
                type: 'Paragraph',
                content: ['Not done']
              }
            ]
          }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          {
            type: 'ListItem',
            checked: false,
            content: [
              {
                type: 'Paragraph',
                content: ['One']
              }
            ]
          },
          {
            type: 'ListItem',
            checked: true,
            content: [
              {
                type: 'Paragraph',
                content: ['Two']
              }
            ]
          },
          {
            type: 'ListItem',
            checked: false,
            content: [
              {
                type: 'Paragraph',
                content: ['Three']
              }
            ]
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

/**
 * Example for testing attributes on
 * `Link`, `CodeFragment` and `CodeBlock` nodes.
 */
const attrs = {
  md: `---
title: Our article
authors: []
---

A [link](url){attr1=foo attr2="bar baz" attr3}.

A \`code\`{lang=r}.

\`\`\`r attr1=foo attr2="bar baz" attr3
# A code block
\`\`\`
`,
  node: {
    type: 'Article',
    title: 'Our article',
    authors: [],
    content: [
      {
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
          '.'
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'A ',
          {
            type: 'CodeFragment',
            programmingLanguage: 'r',
            text: 'code'
          },
          '.'
        ]
      },
      {
        type: 'CodeBlock',
        programmingLanguage: 'r',
        meta: {
          attr1: 'foo',
          attr2: 'bar baz',
          attr3: ''
        },
        text: '# A code block'
      }
    ]
  }
}

/**
 * Example for testing decoding / encoding of
 * `Subscript` and `Superscript` nodes.
 */
const subSuper = {
  md: `---
title: What'sup sub?
authors: []
---

A subscript H~2~O. A superscript E = mc^2^.
`,
  node: {
    type: 'Article',
    title: "What'sup sub?",
    authors: [],
    content: [
      {
        type: 'Paragraph',
        content: [
          'A subscript H',
          {
            type: 'Subscript',
            content: ['2']
          },
          'O. A superscript E = mc',
          {
            type: 'Superscript',
            content: ['2']
          },
          '.'
        ]
      }
    ]
  }
}

// Example for testing that empty paragraphs
// are not represented in Markdown
const emptyParas = {
  to: `Paragraph one.

Paragraph three.

Paragraph five.
`,
  node: {
    type: 'Article',
    content: [
      {
        type: 'Paragraph',
        content: ['Paragraph one.']
      },
      {
        type: 'Paragraph',
        content: []
      },
      {
        type: 'Paragraph',
        content: ['Paragraph three.']
      },
      {
        type: 'Paragraph',
        content: ['']
      },
      {
        type: 'Paragraph',
        content: ['Paragraph five.']
      },
      {
        type: 'Paragraph',
        content: ['\n']
      }
    ]
  }
}

// Example for testing that paragraphs that are split
// across lines are decoded into a single line.
const splitParas = {
  from: `Line1\nline2\nline3\n`,
  to: `---\nauthors: []\ntitle: Untitled\n---\n\nLine1 line2 line3\n`,
  node: {
    type: 'Article',
    authors: [],
    title: 'Untitled',
    content: [
      {
        type: 'Paragraph',
        content: ['Line1 line2 line3']
      }
    ]
  }
}

// Example for testing that paragraphs that are split
// across lines are decoded into a single line.
const references = {
  from: `
[al**ph**a][alpha] [Bravo][bravo]

![alpha] ![Bravo][bravo]

[alpha]: http://example.com/alpha
[bravo]: http://example.com/bravo
`,
  to: `---
authors: []
title: Untitled
---

[al**ph**a](http://example.com/alpha) [Bravo](http://example.com/bravo)

![alpha](http://example.com/alpha) ![Bravo](http://example.com/bravo)
`,
  node: {
    type: 'Article',
    authors: [],
    title: 'Untitled',
    content: [
      {
        type: 'Paragraph',
        content: [
          {
            content: ['al', { type: 'Strong', content: ['ph'] }, 'a'],
            target: 'http://example.com/alpha',
            type: 'Link'
          },
          ' ',
          {
            content: ['Bravo'],
            target: 'http://example.com/bravo',
            type: 'Link'
          }
        ]
      },
      {
        type: 'Paragraph',
        content: [
          {
            contentUrl: 'http://example.com/alpha',
            text: 'alpha',
            type: 'ImageObject'
          },
          ' ',
          {
            contentUrl: 'http://example.com/bravo',
            text: 'Bravo',
            type: 'ImageObject'
          }
        ]
      }
    ]
  }
}
