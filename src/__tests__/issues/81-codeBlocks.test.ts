import path from 'path'
import { read } from '../..'

describe('issue 77', () => {
  const file = path.join(__dirname, '81-codeBlocks.md')

  test('that CodeBlocks in Markdown get decoded properly', async () => {
    const node = await read(file, 'md')
    expect(node).toEqual({
      type: 'Article',
      content: [
        {
          type: 'CodeBlock',
          text: 'date',
        },
        {
          type: 'CodeBlock',
          text: 'date -u',
        },
        {
          type: 'CodeBlock',
          text: 'date --utc',
          programmingLanguage: 'sh',
        },
        {
          type: 'CodeBlock',
          programmingLanguage: 'bash',
          meta: {
            pause: '2',
          },
          text: 'date --help',
        },
      ],
    })
  })
})
