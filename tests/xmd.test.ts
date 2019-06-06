import { dump, load } from '../src/vfile'
import { decode, encode } from '../src/xmd'

test.skip('decode', async () => {
  const p = async (xmd: any) => await decode(load(xmd))
  expect(await p(kitchenSink.xmd)).toEqual(kitchenSink.node)
})

test.skip('encode', async () => {
  const u = async (node: any) => dump(await encode(node))
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
        type: 'Heading',
        depth: 1,
        content: ['Block chunks']
      },
      {
        type: 'CodeChunk',
        programmingLanguage: 'r',
        text: 'plot(1)'
      }
    ]
  }
}
