import path from 'path'
import { read } from '../..'

describe('issue 77', () => {
  const file = path.join(__dirname, '81-codeBlocks.md')

  test('that CodeBlocks in Markdown get decoded properly', async () => {
    const node = await read(file, 'md')
    expect(node).toEqual({
      type: 'Article',
      title: 'Untitled',
      authors: [],
      content: [
        {
          type: 'CodeBlock',
          value: 'date'
        },
        {
          type: 'CodeBlock',
          value: 'date -u'
        },
        {
          type: 'CodeBlock',
          language: 'sh',
          value: 'date --utc'
        },
        {
          type: 'CodeBlock',
          language: 'bash',
          meta: {
            pause: '2'
          },
          value: 'date --help'
        }
      ]
    })
  })
})
