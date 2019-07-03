import { dump, load } from '../../util/vfile'
import { decode, encode } from './'

test('decode', async () => {
  const p = async (xmd: any) => await decode(load(xmd))
  expect(await p(kitchenSink.xmd)).toEqual(kitchenSink.node)
})

test('encode', async () => {
  const u = async (node: any) => dump(await encode(node))
  expect(await u(kitchenSink.node)).toEqual(kitchenSink.xmd)
})

// An example intended for testing progressively added parser/unparser pairs
const kitchenSink = {
  xmd: `---
title: Untitled
authors: []
---

# Inline chunks

Simple \`r x * y\`

With parentheses and brackets \`python sum(x*y)[1]\`

Just inline code \`a * 6\`

# Block chunks

\`\`\` {r}
file = 'data.csv'
# a comment
read.table(file)
\`\`\`

\`\`\` {r fig.height=7 fig.width=8}
plot(x,y)
\`\`\`
`,

  node: {
    type: 'Article',
    title: 'Untitled',
    authors: [],
    content: [
      {
        type: 'Heading',
        depth: 1,
        content: ['Inline chunks']
      },
      {
        type: 'Paragraph',
        content: [
          'Simple ',
          {
            type: 'CodeExpr',
            programmingLanguage: 'r',
            text: 'x * y'
          }
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'With parentheses and brackets ',
          {
            type: 'CodeExpr',
            programmingLanguage: 'python',
            text: 'sum(x*y)[1]'
          }
        ]
      },
      {
        type: 'Paragraph',
        content: [
          'Just inline code ',
          {
            type: 'Code',
            value: 'a * 6'
          }
        ]
      },
      {
        type: 'Heading',
        depth: 1,
        content: ['Block chunks']
      },
      {
        type: 'CodeChunk',
        programmingLanguage: 'r',
        text: "file = 'data.csv'\n# a comment\nread.table(file)"
      },
      {
        type: 'CodeChunk',
        programmingLanguage: 'r',
        meta: {
          'fig.height': '7',
          'fig.width': '8'
        },
        text: 'plot(x,y)'
      }
    ]
  }
}
