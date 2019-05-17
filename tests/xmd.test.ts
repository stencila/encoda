import { dump, load } from '../src/vfile'
import { parse, unparse } from '../src/xmd'

test('parse', async () => {
  const p = async (xmd: any) => await parse(load(xmd))
  expect(await p(kitchenSink.xmd)).toEqual(kitchenSink.node)
})

test('unparse', async () => {
  const u = async (node: any) => dump(await unparse(node))
  expect(await u(kitchenSink.node)).toEqual(kitchenSink.xmd)
})

// An example intended for testing progressively added parser/unparser pairs
const kitchenSink = {
  xmd: `---
authors: []
---

# Inline chunks

Simple \`r x * y\`

With parentheses and brackets \`python sum(x*y)[1]\`

# Block chunks

\`\`\` {r}
plot(1)
\`\`\`
`,

  node: {
    type: 'Article',
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
            languages: ['r'],
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
            languages: ['python'],
            text: 'sum(x*y)[1]'
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
        languages: ['r'],
        text: 'plot(1)'
      }
    ]
  }
}
