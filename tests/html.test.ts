import { parse, unparse } from '../src/html'
import { dump, load } from '../src/vfile'

const eg1 = {
  string: `<html>

<head></head>

<body>
    <p>Paragraph one.</p>
</body>

</html>`,

  node: {
    type: 'Article',
    content: [
      {
        type: 'Paragraph',
        content: [
          {
            type: '#text',
            value: 'Paragraph one.'
          }
        ]
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(load(eg1.string))).toEqual(eg1.node)
})

test('unparse', async () => {
  expect(dump(await unparse(eg1.node))).toEqual(eg1.string)
})
