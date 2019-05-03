import { parse, unparse } from '../src/html'
import { dump, load } from '../src/vfile'

test('parse', async () => {
  expect(await parse(load(kitchenSink.html))).toEqual(kitchenSink.node)
})

test('unparse', async () => {
  expect(dump(await unparse(kitchenSink.node))).toEqual(kitchenSink.html)
})

// An example intended for testing progressively added parser/unparser pairs
const kitchenSink = {
  html: `<html>

  <head>
    <title>Our article</title>
    <script type="application/ld+json">
      {
        "@context": "http://stencila.github.io/schema/stencila.jsonld",
        "type": "Article",
        "title": "Our article",
        "authors": []
      }
    </script>
  </head>

  <body>
    <h1>Heading one</h1>
    <h2>Heading two</h2>
    <h3>Heading three</h3>
    <p>A paragraph with <em>emphasis</em>, <strong>strong</strong>, <del>delete</del>.</p>
    <p>A paragraph with <q cite="https://example.org">quote</q>.</p>
    <p>Paragraph with a <s-boolean>true</s-boolean> and a <s-boolean>false</s-boolean>.</p>
    <p>A paragraph with other data: a <s-null>null</s-null>, a <s-number>3.14</s-number>, an
      <s-array>[1,2]</s-array>, and an <s-object>{"a":1,"b":"two"}</s-object>.</p>
    <blockquote cite="https://example.org">A blockquote</blockquote>
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
    <hr>
  </body>

</html>`,

  node: {
    type: 'Article',
    title: 'Our article',
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
            type: 'Quote',
            citation: 'https://example.org',
            text: 'quote'
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
          ', an ',
          [1, 2],
          ', and an ',
          { a: 1, b: 'two' },
          '.'
        ]
      },
      {
        type: 'QuoteBlock',
        citation: 'https://example.org',
        content: ['A blockquote']
      },
      {
        type: 'List',
        order: 'unordered',
        items: ['One', 'Two', 'Three']
      },
      {
        type: 'List',
        order: 'ascending',
        items: ['First', 'Second', 'Third']
      },
      {
        type: 'ThematicBreak'
      }
    ]
  }
}
